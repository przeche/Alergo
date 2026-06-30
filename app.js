// ===== AlergoPrognoza — logika aplikacji =====

const STORAGE_KEY = "alergo-settings";

function defaultSettings() {
    return {
        location: null,            // { name, lat, lon }
        selectedAllergens: ["birch_pollen", "grass_pollen", "ragweed_pollen", "dust_mites"],
        panelOpen: false,
        viewMode: "selected"       // "selected" | "all"
    };
}

let settings = defaultSettings();
let dailyForecast = []; // [{ date, label, levels: { key: value } }]

// Pełna lista alergenów: pyłki roślin (Open-Meteo Air Quality) + alergeny zależne od pogody
const ALLERGENS = [
    { key: "alder_pollen",   label: "Olcha",   icon: "fa-tree",      type: "pollen" },
    { key: "birch_pollen",   label: "Brzoza",  icon: "fa-tree",      type: "pollen" },
    { key: "grass_pollen",   label: "Trawy",   icon: "fa-seedling",  type: "pollen" },
    { key: "mugwort_pollen", label: "Bylica",  icon: "fa-leaf",      type: "pollen" },
    { key: "olive_pollen",   label: "Oliwka",  icon: "fa-leaf",      type: "pollen" },
    { key: "ragweed_pollen", label: "Ambrozja",icon: "fa-allergies", type: "pollen" },
    { key: "dust_mites",     label: "Roztocza",icon: "fa-bed",       type: "weather" },
    { key: "mold",           label: "Grzyby (pleśń)", icon: "fa-bacterium", type: "weather" }
];

// ----- Trwałość danych -----
function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            settings = { ...defaultSettings(), ...parsed };
        }
    } catch (e) {
        console.warn("Nie udało się wczytać ustawień:", e);
    }
}

async function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn("Nie udało się zapisać ustawień:", e);
    }
}

function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// ----- Wyszukiwanie miast (Open-Meteo Geocoding API, bez klucza) -----
async function searchCities(query) {
    if (!query || query.trim().length < 2) return [];
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=pl&format=json`;
        const res = await fetch(url);
        const data = await res.json();
        return data.results || [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

function renderSuggestions(results) {
    const box = document.getElementById("city-suggestions");
    if (!box) return;
    if (!results.length) {
        box.innerHTML = "";
        box.classList.add("hide");
        return;
    }
    box.innerHTML = results.map((r, i) => {
        const region = [r.admin1, r.country].filter(Boolean).join(", ");
        return `<button type="button" data-idx="${i}" class="city-option w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-slate-100 last:border-0">
            <span class="font-medium">${r.name}</span>
            <span class="text-slate-400 text-xs block">${region}</span>
        </button>`;
    }).join("");
    box.dataset.results = JSON.stringify(results);
    box.classList.remove("hide");
}

async function selectCity(result) {
    const region = [result.admin1, result.country].filter(Boolean).join(", ");
    settings.location = {
        name: region ? `${result.name} (${region})` : result.name,
        lat: result.latitude,
        lon: result.longitude
    };
    await saveData();
    updateLocationUI();
    const box = document.getElementById("city-suggestions");
    if (box) { box.innerHTML = ""; box.classList.add("hide"); }
    const input = document.getElementById("city-input");
    if (input) input.value = "";
    await fetchForecast();
}

// ----- GPS -----
async function handleGPS() {
    if (!navigator.geolocation) {
        alert("Twoja przeglądarka nie wspiera geolokalizacji.");
        return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await response.json();
            const city = (data.address && (data.address.city || data.address.town || data.address.village)) || "Twoja lokalizacja";

            settings.location = { name: city, lat: latitude, lon: longitude };
            await saveData();
            updateLocationUI();
            await fetchForecast();
        } catch (e) {
            console.error(e);
            alert("Nie udało się ustalić nazwy lokalizacji. Spróbuj ponownie.");
        }
    }, (err) => {
        console.error(err);
        alert("Włącz uprawnienia do lokalizacji w ustawieniach telefonu.");
    });
}

function updateLocationUI() {
    const label = document.getElementById("location-label");
    if (label) label.textContent = settings.location ? settings.location.name : "Nie wybrano lokalizacji";
}

// ----- Ryzyko alergenów zależnych od pogody -----
function dustMiteRisk(humidity, temp) {
    if (humidity == null || temp == null) return null;
    let humidityScore;
    if (humidity >= 70) humidityScore = 100;
    else if (humidity >= 50) humidityScore = ((humidity - 50) / 20) * 70 + 30;
    else humidityScore = (humidity / 50) * 30;

    let tempFactor = 1;
    if (temp < 15 || temp > 30) tempFactor = 0.4;
    else if (temp < 18 || temp > 27) tempFactor = 0.7;

    return Math.round(humidityScore * tempFactor);
}

function moldRisk(humidity, precipitation) {
    if (humidity == null) return null;
    let humidityScore;
    if (humidity >= 80) humidityScore = 100;
    else if (humidity >= 60) humidityScore = ((humidity - 60) / 20) * 60 + 40;
    else humidityScore = (humidity / 60) * 40;

    const rainBonus = precipitation ? Math.min(precipitation * 10, 30) : 0;
    return Math.min(100, Math.round(humidityScore + rainBonus));
}

// ----- Pobieranie prognozy (pyłki + pogoda) -----
async function fetchForecast() {
    if (!settings.location) return;
    const resultsEl = document.getElementById("forecast-results");
    if (resultsEl) {
        resultsEl.innerHTML = `<p class="text-slate-500 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Pobieranie prognozy...</p>`;
    }

    try {
        const { lat, lon } = settings.location;
        const pollenKeys = ALLERGENS.filter(a => a.type === "pollen").map(a => a.key).join(",");

        const pollenUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=${pollenKeys}&forecast_days=3&timezone=auto`;
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=relative_humidity_2m,temperature_2m,precipitation&forecast_days=3&timezone=auto`;

        const [pollenRes, weatherRes] = await Promise.all([fetch(pollenUrl), fetch(weatherUrl)]);
        const pollenData = await pollenRes.json();
        const weatherData = await weatherRes.json();

        dailyForecast = computeDailyForecast(pollenData, weatherData);
        renderForecastSection();
    } catch (e) {
        console.error(e);
        if (resultsEl) {
            resultsEl.innerHTML = `<p class="text-red-500 text-sm"><i class="fa-solid fa-triangle-exclamation mr-2"></i>Nie udało się pobrać prognozy. Spróbuj ponownie później.</p>`;
        }
    }
}

function computeDailyForecast(pollenData, weatherData) {
    const days = [];
    const pollenHourly = pollenData.hourly || {};
    const weatherHourly = weatherData.hourly || {};
    const times = pollenHourly.time || weatherHourly.time || [];
    if (!times.length) return days;

    const dateKeys = [];
    times.forEach(t => {
        const d = t.slice(0, 10);
        if (!dateKeys.includes(d)) dateKeys.push(d);
    });
    const todayKeys = dateKeys.slice(0, 3);

    const dayLabels = ["Dziś", "Jutro", "Pojutrze"];

    todayKeys.forEach((dateKey, i) => {
        const idxList = times.reduce((acc, t, idx) => {
            if (t.startsWith(dateKey)) acc.push(idx);
            return acc;
        }, []);

        const levels = {};
        ALLERGENS.forEach(a => {
            if (a.type === "pollen") {
                const arr = pollenHourly[a.key];
                if (!arr) { levels[a.key] = null; return; }
                const vals = idxList.map(idx => arr[idx]).filter(v => v !== null && v !== undefined);
                levels[a.key] = vals.length ? Math.max(...vals) : null;
            } else if (a.key === "dust_mites") {
                const hum = weatherHourly.relative_humidity_2m;
                const temp = weatherHourly.temperature_2m;
                if (!hum || !temp) { levels[a.key] = null; return; }
                const vals = idxList.map(idx => dustMiteRisk(hum[idx], temp[idx])).filter(v => v !== null);
                levels[a.key] = vals.length ? Math.max(...vals) : null;
            } else if (a.key === "mold") {
                const hum = weatherHourly.relative_humidity_2m;
                const precip = weatherHourly.precipitation;
                if (!hum) { levels[a.key] = null; return; }
                const vals = idxList.map(idx => moldRisk(hum[idx], precip ? precip[idx] : 0)).filter(v => v !== null);
                levels[a.key] = vals.length ? Math.max(...vals) : null;
            }
        });

        const dateObj = new Date(dateKey + "T00:00:00");
        days.push({
            date: dateKey,
            label: dayLabels[i] || dateObj.toLocaleDateString("pl-PL", { weekday: "long" }),
            dateDisplay: dateObj.toLocaleDateString("pl-PL", { day: "numeric", month: "long" }),
            levels
        });
    });

    return days;
}

function concentrationLevel(value) {
    if (value === null || value === undefined) return { label: "Brak danych", color: "bg-slate-100 text-slate-400" };
    if (value === 0) return { label: "Brak", color: "bg-slate-200 text-slate-600" };
    if (value < 10) return { label: "Niskie", color: "bg-green-100 text-green-700" };
    if (value < 30) return { label: "Średnie", color: "bg-yellow-100 text-yellow-700" };
    if (value < 70) return { label: "Wysokie", color: "bg-orange-100 text-orange-700" };
    return { label: "Bardzo wysokie", color: "bg-red-100 text-red-700" };
}

function visibleAllergens() {
    if (settings.viewMode === "selected" && settings.selectedAllergens.length > 0) {
        return ALLERGENS.filter(a => settings.selectedAllergens.includes(a.key));
    }
    return ALLERGENS;
}

function renderForecastSection() {
    const resultsEl = document.getElementById("forecast-results");
    if (!resultsEl) return;

    if (!settings.location) {
        resultsEl.innerHTML = `<p class="text-slate-500 text-sm">Wybierz lokalizację, aby zobaczyć prognozę.</p>`;
        return;
    }
    if (!dailyForecast.length) {
        resultsEl.innerHTML = `<p class="text-slate-500 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Pobieranie prognozy...</p>`;
        return;
    }

    const allergens = visibleAllergens();
    if (!allergens.length) {
        resultsEl.innerHTML = `<p class="text-slate-500 text-sm">Brak wybranych alergenów. Otwórz panel "Moje alergeny", aby je wybrać.</p>`;
        return;
    }

    const dayCards = dailyForecast.map(day => {
        const badges = allergens.map(a => {
            const value = day.levels[a.key];
            const level = concentrationLevel(value);
            return `
                <div class="flex flex-col items-center gap-1 w-16" title="${a.label}: ${level.label}">
                    <div class="w-11 h-11 rounded-full flex items-center justify-center ${level.color}">
                        <i class="fa-solid ${a.icon}"></i>
                    </div>
                    <span class="text-[11px] text-slate-500 text-center leading-tight">${a.label}</span>
                </div>
            `;
        }).join("");

        return `
            <div class="glass-card rounded-xl p-4 shadow-sm">
                <p class="font-semibold text-sm mb-1">${day.label}</p>
                <p class="text-xs text-slate-400 mb-3 capitalize">${day.dateDisplay}</p>
                <div class="flex flex-wrap gap-3">${badges}</div>
            </div>
        `;
    }).join("");

    resultsEl.innerHTML = `
        <div class="space-y-3">${dayCards}</div>
        <div class="flex flex-wrap gap-2 mt-4 text-[11px]">
            <span class="px-2 py-1 rounded-full bg-green-100 text-green-700">Niskie</span>
            <span class="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Średnie</span>
            <span class="px-2 py-1 rounded-full bg-orange-100 text-orange-700">Wysokie</span>
            <span class="px-2 py-1 rounded-full bg-red-100 text-red-700">Bardzo wysokie</span>
        </div>
    `;
}

// ----- Panel alergenów (zwijany, stan zapisywany) -----
function renderAllergenPanel() {
    const list = document.getElementById("allergen-list");
    if (!list) return;
    list.innerHTML = ALLERGENS.map(a => {
        const checked = settings.selectedAllergens.includes(a.key) ? "checked" : "";
        return `
            <label class="flex items-center justify-between py-2 px-1 border-b border-slate-100 last:border-0 cursor-pointer">
                <span class="flex items-center gap-2 text-sm">
                    <i class="fa-solid ${a.icon} text-blue-600 w-5 text-center"></i>${a.label}
                </span>
                <input type="checkbox" data-key="${a.key}" class="allergen-checkbox w-4 h-4 accent-blue-600" ${checked}>
            </label>
        `;
    }).join("");

    applyPanelState();
}

function applyPanelState() {
    const panel = document.getElementById("allergen-panel-body");
    const chevron = document.getElementById("panel-chevron");
    if (!panel || !chevron) return;
    if (settings.panelOpen) {
        panel.classList.remove("hide");
        chevron.classList.add("rotate-180");
    } else {
        panel.classList.add("hide");
        chevron.classList.remove("rotate-180");
    }
}

async function togglePanel() {
    settings.panelOpen = !settings.panelOpen;
    await saveData();
    applyPanelState();
}

async function toggleAllergenSelection(key) {
    const idx = settings.selectedAllergens.indexOf(key);
    if (idx >= 0) settings.selectedAllergens.splice(idx, 1);
    else settings.selectedAllergens.push(key);
    await saveData();
    renderForecastSection();
}

async function setViewMode(mode) {
    settings.viewMode = mode;
    await saveData();
    applyViewToggleUI();
    renderForecastSection();
}

function applyViewToggleUI() {
    const selBtn = document.getElementById("view-selected-btn");
    const allBtn = document.getElementById("view-all-btn");
    if (!selBtn || !allBtn) return;
    const active = "bg-blue-600 text-white";
    const inactive = "bg-slate-100 text-slate-600";
    selBtn.className = `flex-1 text-sm font-medium px-3 py-1.5 rounded-lg transition ${settings.viewMode === "selected" ? active : inactive}`;
    allBtn.className = `flex-1 text-sm font-medium px-3 py-1.5 rounded-lg transition ${settings.viewMode === "all" ? active : inactive}`;
}

// ----- Szkielet interfejsu (renderowany raz) -----
function renderShell() {
    const root = document.getElementById("app-root");
    if (!root) return;

    root.innerHTML = `
        <div class="min-h-screen flex flex-col">
            <header class="bg-blue-600 text-white px-5 py-6 shadow-md">
                <h1 class="text-xl font-bold"><i class="fa-solid fa-wind mr-2"></i>AlergoPrognoza</h1>
                <p class="text-blue-100 text-sm mt-1">Prognoza pyłków i alergenów</p>
            </header>

            <main class="flex-1 px-5 py-6 max-w-md w-full mx-auto">

                <!-- Lokalizacja -->
                <section class="glass-card rounded-xl p-4 mb-5 shadow-sm">
                    <p class="text-xs text-slate-400 uppercase tracking-wide mb-2">Lokalizacja</p>
                    <p class="font-semibold mb-3"><i class="fa-solid fa-location-dot text-blue-600 mr-1"></i><span id="location-label">Nie wybrano lokalizacji</span></p>

                    <div class="relative mb-2">
                        <input id="city-input" type="text" placeholder="Wpisz nazwę miasta..."
                            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" autocomplete="off">
                        <div id="city-suggestions" class="hide absolute z-10 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-56 overflow-y-auto"></div>
                    </div>

                    <button id="gps-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                        <i class="fa-solid fa-crosshairs mr-1"></i>Użyj mojej lokalizacji (GPS)
                    </button>
                </section>

                <!-- Zwijany panel alergenów -->
                <section class="glass-card rounded-xl mb-5 shadow-sm overflow-hidden">
                    <button id="panel-toggle" type="button" class="w-full flex items-center justify-between px-4 py-3">
                        <span class="font-semibold text-sm"><i class="fa-solid fa-list-check text-blue-600 mr-2"></i>Moje alergeny</span>
                        <i id="panel-chevron" class="fa-solid fa-chevron-down text-slate-400 transition-transform"></i>
                    </button>
                    <div id="allergen-panel-body" class="hide px-4 pb-4">
                        <div id="allergen-list"></div>
                    </div>
                </section>

                <!-- Prognoza -->
                <section>
                    <div class="flex items-center justify-between mb-3">
                        <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide">Prognoza 3-dniowa</h2>
                    </div>
                    <div class="flex gap-2 mb-4">
                        <button id="view-selected-btn" type="button">Wybrane</button>
                        <button id="view-all-btn" type="button">Wszystkie</button>
                    </div>
                    <div id="forecast-results"></div>
                </section>
            </main>
        </div>
    `;

    renderAllergenPanel();
    applyViewToggleUI();
    updateLocationUI();
    renderForecastSection();
    bindEvents();
}

// ----- Obsługa zdarzeń (delegacja na #app-root) -----
function bindEvents() {
    const root = document.getElementById("app-root");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "true";

    const debouncedSearch = debounce(async (query) => {
        const results = await searchCities(query);
        renderSuggestions(results);
    }, 350);

    root.addEventListener("input", (e) => {
        if (e.target.id === "city-input") {
            const q = e.target.value;
            if (q.trim().length < 2) {
                const box = document.getElementById("city-suggestions");
                if (box) { box.innerHTML = ""; box.classList.add("hide"); }
                return;
            }
            debouncedSearch(q);
        }
    });

    root.addEventListener("click", (e) => {
        const gpsBtn = e.target.closest("#gps-btn");
        if (gpsBtn) { handleGPS(); return; }

        const cityOption = e.target.closest(".city-option");
        if (cityOption) {
            const box = document.getElementById("city-suggestions");
            const results = JSON.parse(box.dataset.results || "[]");
            const result = results[parseInt(cityOption.dataset.idx, 10)];
            if (result) selectCity(result);
            return;
        }

        const panelToggle = e.target.closest("#panel-toggle");
        if (panelToggle) { togglePanel(); return; }

        const selBtn = e.target.closest("#view-selected-btn");
        if (selBtn) { setViewMode("selected"); return; }

        const allBtn = e.target.closest("#view-all-btn");
        if (allBtn) { setViewMode("all"); return; }

        // Kliknięcie poza polem wyszukiwania zamyka podpowiedzi
        if (!e.target.closest("#city-input") && !e.target.closest("#city-suggestions")) {
            const box = document.getElementById("city-suggestions");
            if (box) box.classList.add("hide");
        }
    });

    root.addEventListener("change", (e) => {
        const checkbox = e.target.closest(".allergen-checkbox");
        if (checkbox) toggleAllergenSelection(checkbox.dataset.key);
    });
}

// ----- Inicjalizacja -----
document.addEventListener("DOMContentLoaded", async () => {
    loadData();
    renderShell();
    if (settings.location) {
        await fetchForecast();
    }
});
