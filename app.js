// ===== AlergoPrognoza — logika aplikacji =====

const STORAGE_KEY = "alergo-settings";

let settings = {
    location: null // { name, lat, lon }
};

const POLLEN_TYPES = [
    { key: "alder_pollen", label: "Olcha", icon: "fa-tree" },
    { key: "birch_pollen", label: "Brzoza", icon: "fa-tree" },
    { key: "grass_pollen", label: "Trawy", icon: "fa-seedling" },
    { key: "mugwort_pollen", label: "Bylica", icon: "fa-leaf" },
    { key: "olive_pollen", label: "Oliwka", icon: "fa-leaf" },
    { key: "ragweed_pollen", label: "Ambrozja", icon: "fa-allergies" }
];

// ----- Trwałość danych -----
function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) settings = JSON.parse(raw);
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
            updateUI();
            await saveData();
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

// ----- Prognoza pyłków (Open-Meteo Air Quality API, klucz API nie jest wymagany) -----
async function fetchForecast() {
    if (!settings.location) return;

    const resultsEl = document.getElementById("forecast-results");
    if (resultsEl) {
        resultsEl.innerHTML = `<p class="text-slate-500 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Pobieranie prognozy...</p>`;
    }

    try {
        const { lat, lon } = settings.location;
        const params = POLLEN_TYPES.map(p => p.key).join(",");
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=${params}&timezone=auto`;
        const response = await fetch(url);
        const data = await response.json();

        renderForecast(data);
    } catch (e) {
        console.error(e);
        if (resultsEl) {
            resultsEl.innerHTML = `<p class="text-red-500 text-sm"><i class="fa-solid fa-triangle-exclamation mr-2"></i>Nie udało się pobrać prognozy. Spróbuj ponownie później.</p>`;
        }
    }
}

function pollenLevel(value) {
    if (value === null || value === undefined) return { label: "Brak danych", color: "bg-slate-300 text-slate-600" };
    if (value === 0) return { label: "Brak", color: "bg-slate-200 text-slate-600" };
    if (value < 10) return { label: "Niskie", color: "bg-green-100 text-green-700" };
    if (value < 30) return { label: "Średnie", color: "bg-yellow-100 text-yellow-700" };
    if (value < 70) return { label: "Wysokie", color: "bg-orange-100 text-orange-700" };
    return { label: "Bardzo wysokie", color: "bg-red-100 text-red-700" };
}

function renderForecast(data) {
    const resultsEl = document.getElementById("forecast-results");
    if (!resultsEl) return;

    if (!data.hourly || !data.hourly.time) {
        resultsEl.innerHTML = `<p class="text-slate-500 text-sm">Brak danych o pyłkach dla tej lokalizacji.</p>`;
        return;
    }

    // Bierzemy najbliższą nadchodzącą godzinę
    const now = new Date();
    let idx = data.hourly.time.findIndex(t => new Date(t) >= now);
    if (idx === -1) idx = 0;

    const cards = POLLEN_TYPES.map(p => {
        const value = data.hourly[p.key] ? data.hourly[p.key][idx] : null;
        const level = pollenLevel(value);
        return `
            <div class="glass-card rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-3">
                    <i class="fa-solid ${p.icon} text-blue-600 text-lg w-6 text-center"></i>
                    <span class="font-medium">${p.label}</span>
                </div>
                <span class="text-xs font-semibold px-3 py-1 rounded-full ${level.color}">${level.label}</span>
            </div>
        `;
    }).join("");

    resultsEl.innerHTML = `
        <p class="text-xs text-slate-400 mb-3">Aktualizacja: ${new Date(data.hourly.time[idx]).toLocaleString("pl-PL")}</p>
        <div class="space-y-2">${cards}</div>
    `;
}

// ----- Renderowanie interfejsu -----
function updateUI() {
    const root = document.getElementById("app-root");
    if (!root) return;

    const locationLabel = settings.location ? settings.location.name : "Nie wybrano lokalizacji";

    root.innerHTML = `
        <div class="min-h-screen flex flex-col">
            <header class="bg-blue-600 text-white px-5 py-6 shadow-md">
                <h1 class="text-xl font-bold"><i class="fa-solid fa-wind mr-2"></i>AlergoPrognoza</h1>
                <p class="text-blue-100 text-sm mt-1">Prognoza pyłków alergennych</p>
            </header>

            <main class="flex-1 px-5 py-6 max-w-md w-full mx-auto">
                <section class="glass-card rounded-xl p-4 mb-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p class="text-xs text-slate-400 uppercase tracking-wide">Lokalizacja</p>
                        <p class="font-semibold"><i class="fa-solid fa-location-dot text-blue-600 mr-1"></i>${locationLabel}</p>
                    </div>
                    <button id="gps-btn" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                        <i class="fa-solid fa-crosshairs mr-1"></i>Użyj GPS
                    </button>
                </section>

                <section>
                    <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Poziom pyłków</h2>
                    <div id="forecast-results">
                        ${settings.location
                            ? `<p class="text-slate-500 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Pobieranie prognozy...</p>`
                            : `<p class="text-slate-500 text-sm">Wybierz lokalizację, aby zobaczyć prognozę.</p>`}
                    </div>
                </section>
            </main>
        </div>
    `;

    const gpsBtn = document.getElementById("gps-btn");
    if (gpsBtn) gpsBtn.addEventListener("click", handleGPS);
}

// ----- Inicjalizacja -----
document.addEventListener("DOMContentLoaded", async () => {
    loadData();
    updateUI();
    if (settings.location) {
        await fetchForecast();
    }
});
