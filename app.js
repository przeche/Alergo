// ===== Alergo — logika aplikacji =====

const STORAGE_KEY = "alergo-settings";

function defaultSettings() {
    return {
        location: null,            // { name, lat, lon }
        selectedAllergens: ["birch_pollen", "grass_pollen", "ragweed_pollen", "dust_mites"],
        panelOpen: false,
        viewMode: "selected",      // "selected" | "all"
        language: "pl"             // pl | en | de | es | fr | it
    };
}

let settings = defaultSettings();
let dailyForecast = []; // [{ date, dayIndex, dateDisplay, tempMin, tempMax, humidityAvg, levels:{key:value} }]

const LOCALES = { pl: "pl-PL", en: "en-GB", de: "de-DE", es: "es-ES", fr: "fr-FR", it: "it-IT" };

const LANGUAGE_NAMES = { pl: "Polski", en: "English", de: "Deutsch", es: "Español", fr: "Français", it: "Italiano" };

const ALLERGENS = [
    { key: "alder_pollen",   icon: "fa-tree",      type: "pollen",
      labels: { pl: "Olcha",   en: "Alder",      de: "Erle",      es: "Aliso",       fr: "Aulne",       it: "Ontano" } },
    { key: "birch_pollen",   icon: "fa-tree",      type: "pollen",
      labels: { pl: "Brzoza",  en: "Birch",      de: "Birke",     es: "Abedul",      fr: "Bouleau",     it: "Betulla" } },
    { key: "grass_pollen",   icon: "fa-seedling",  type: "pollen",
      labels: { pl: "Trawy",   en: "Grass",      de: "Gräser",    es: "Gramíneas",   fr: "Graminées",   it: "Graminacee" } },
    { key: "mugwort_pollen", icon: "fa-leaf",      type: "pollen",
      labels: { pl: "Bylica",  en: "Mugwort",    de: "Beifuß",    es: "Artemisa",    fr: "Armoise",     it: "Artemisia" } },
    { key: "olive_pollen",   icon: "fa-leaf",      type: "pollen",
      labels: { pl: "Oliwka",  en: "Olive",      de: "Olive",     es: "Olivo",       fr: "Olivier",     it: "Ulivo" } },
    { key: "ragweed_pollen", icon: "fa-allergies", type: "pollen",
      labels: { pl: "Ambrozja",en: "Ragweed",    de: "Ambrosia",  es: "Ambrosía",    fr: "Ambroisie",   it: "Ambrosia" } },
    { key: "dust_mites",     icon: "fa-bed",       type: "weather",
      labels: { pl: "Roztocza",en: "Dust mites", de: "Hausstaubmilben", es: "Ácaros del polvo", fr: "Acariens", it: "Acari della polvere" } },
    { key: "mold",           icon: "fa-bacterium", type: "weather",
      labels: { pl: "Grzyby (pleśń)", en: "Mold", de: "Schimmel", es: "Moho", fr: "Moisissures", it: "Muffe" } }
];

const TRANSLATIONS = {
    pl: {
        subtitle: "Prognoza pyłków i alergenów",
        locationNotSet: "Nie wybrano lokalizacji",
        cityPlaceholder: "Wpisz nazwę miasta...",
        panelTitle: "Moje alergeny",
        forecastTitle: "Prognoza 3-dniowa",
        viewSelected: "Wybrane",
        viewAll: "Wszystkie",
        noLocationForecast: "Wybierz lokalizację, aby zobaczyć prognozę.",
        loading: "Pobieranie prognozy...",
        errorFetch: "Nie udało się pobrać prognozy. Spróbuj ponownie później.",
        noAllergensSelected: "Brak wybranych alergenów. Otwórz panel „Moje alergeny”, aby je wybrać.",
        levelNone: "Brak", levelNoData: "Brak danych", levelLow: "Niskie", levelMedium: "Średnie", levelHigh: "Wysokie", levelVeryHigh: "Bardzo wysokie",
        today: "Dziś", tomorrow: "Jutro", dayAfter: "Pojutrze",
        dataSource: "Źródło danych: Open-Meteo (pyłki roślin i pogoda). Roztocza i grzyby są szacowane na podstawie wilgotności i temperatury.",
        copyright: "© {year} Alergo. Wszelkie prawa zastrzeżone."
    },
    en: {
        subtitle: "Pollen and allergen forecast",
        locationNotSet: "No location selected",
        cityPlaceholder: "Enter city name...",
        panelTitle: "My allergens",
        forecastTitle: "3-day forecast",
        viewSelected: "Selected",
        viewAll: "All",
        noLocationForecast: "Choose a location to see the forecast.",
        loading: "Loading forecast...",
        errorFetch: "Couldn't load the forecast. Please try again later.",
        noAllergensSelected: "No allergens selected. Open the \"My allergens\" panel to choose some.",
        levelNone: "None", levelNoData: "No data", levelLow: "Low", levelMedium: "Medium", levelHigh: "High", levelVeryHigh: "Very high",
        today: "Today", tomorrow: "Tomorrow", dayAfter: "Day after tomorrow",
        dataSource: "Data source: Open-Meteo (plant pollen and weather). Dust mites and mold are estimated from humidity and temperature.",
        copyright: "© {year} Alergo. All rights reserved."
    },
    de: {
        subtitle: "Pollen- und Allergenvorhersage",
        locationNotSet: "Kein Standort ausgewählt",
        cityPlaceholder: "Stadt eingeben...",
        panelTitle: "Meine Allergene",
        forecastTitle: "3-Tages-Vorhersage",
        viewSelected: "Ausgewählt",
        viewAll: "Alle",
        noLocationForecast: "Wähle einen Standort, um die Vorhersage zu sehen.",
        loading: "Vorhersage wird geladen...",
        errorFetch: "Die Vorhersage konnte nicht geladen werden. Bitte später erneut versuchen.",
        noAllergensSelected: "Keine Allergene ausgewählt. Öffne das Panel „Meine Allergene“, um sie auszuwählen.",
        levelNone: "Keine", levelNoData: "Keine Daten", levelLow: "Niedrig", levelMedium: "Mittel", levelHigh: "Hoch", levelVeryHigh: "Sehr hoch",
        today: "Heute", tomorrow: "Morgen", dayAfter: "Übermorgen",
        dataSource: "Datenquelle: Open-Meteo (Pflanzenpollen und Wetter). Hausstaubmilben und Schimmel werden anhand von Luftfeuchtigkeit und Temperatur geschätzt.",
        copyright: "© {year} Alergo. Alle Rechte vorbehalten."
    },
    es: {
        subtitle: "Pronóstico de polen y alérgenos",
        locationNotSet: "Sin ubicación seleccionada",
        cityPlaceholder: "Escribe el nombre de la ciudad...",
        panelTitle: "Mis alérgenos",
        forecastTitle: "Pronóstico de 3 días",
        viewSelected: "Seleccionados",
        viewAll: "Todos",
        noLocationForecast: "Elige una ubicación para ver el pronóstico.",
        loading: "Cargando pronóstico...",
        errorFetch: "No se pudo cargar el pronóstico. Inténtalo de nuevo más tarde.",
        noAllergensSelected: "No hay alérgenos seleccionados. Abre el panel \"Mis alérgenos\" para elegirlos.",
        levelNone: "Ninguno", levelNoData: "Sin datos", levelLow: "Bajo", levelMedium: "Medio", levelHigh: "Alto", levelVeryHigh: "Muy alto",
        today: "Hoy", tomorrow: "Mañana", dayAfter: "Pasado mañana",
        dataSource: "Fuente de datos: Open-Meteo (polen de plantas y clima). Los ácaros y el moho se estiman a partir de la humedad y la temperatura.",
        copyright: "© {year} Alergo. Todos los derechos reservados."
    },
    fr: {
        subtitle: "Prévisions de pollen et d'allergènes",
        locationNotSet: "Aucune localisation sélectionnée",
        cityPlaceholder: "Saisissez le nom de la ville...",
        panelTitle: "Mes allergènes",
        forecastTitle: "Prévisions sur 3 jours",
        viewSelected: "Sélectionnés",
        viewAll: "Tous",
        noLocationForecast: "Choisissez une localisation pour voir les prévisions.",
        loading: "Chargement des prévisions...",
        errorFetch: "Impossible de charger les prévisions. Veuillez réessayer plus tard.",
        noAllergensSelected: "Aucun allergène sélectionné. Ouvrez le panneau « Mes allergènes » pour en choisir.",
        levelNone: "Aucun", levelNoData: "Aucune donnée", levelLow: "Faible", levelMedium: "Moyen", levelHigh: "Élevé", levelVeryHigh: "Très élevé",
        today: "Aujourd'hui", tomorrow: "Demain", dayAfter: "Après-demain",
        dataSource: "Source des données : Open-Meteo (pollen des plantes et météo). Les acariens et les moisissures sont estimés à partir de l'humidité et de la température.",
        copyright: "© {year} Alergo. Tous droits réservés."
    },
    it: {
        subtitle: "Previsioni di pollini e allergeni",
        locationNotSet: "Nessuna posizione selezionata",
        cityPlaceholder: "Inserisci il nome della città...",
        panelTitle: "I miei allergeni",
        forecastTitle: "Previsioni a 3 giorni",
        viewSelected: "Selezionati",
        viewAll: "Tutti",
        noLocationForecast: "Scegli una posizione per vedere le previsioni.",
        loading: "Caricamento previsioni...",
        errorFetch: "Impossibile caricare le previsioni. Riprova più tardi.",
        noAllergensSelected: "Nessun allergene selezionato. Apri il pannello \"I miei allergeni\" per sceglierli.",
        levelNone: "Nessuno", levelNoData: "Nessun dato", levelLow: "Basso", levelMedium: "Medio", levelHigh: "Alto", levelVeryHigh: "Molto alto",
        today: "Oggi", tomorrow: "Domani", dayAfter: "Dopodomani",
        dataSource: "Fonte dei dati: Open-Meteo (pollini delle piante e meteo). Acari della polvere e muffe sono stimati in base a umidità e temperatura.",
        copyright: "© {year} Alergo. Tutti i diritti riservati."
    }
};

function t(key) {
    const lang = settings.language || "pl";
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.pl[key] || key;
}

function allergenLabel(a) {
    const lang = settings.language || "pl";
    return a.labels[lang] || a.labels.pl;
}

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
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=${settings.language}&format=json`;
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
        alert("Brak wsparcia geolokalizacji w tej przeglądarce.");
        return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await response.json();
            const city = (data.address && (data.address.city || data.address.town || data.address.village)) || "—";

            settings.location = { name: city, lat: latitude, lon: longitude };
            await saveData();
            updateLocationUI();
            await fetchForecast();
        } catch (e) {
            console.error(e);
        }
    }, (err) => {
        console.error(err);
    });
}

function updateLocationUI() {
    const label = document.getElementById("location-label");
    if (label) label.textContent = settings.location ? settings.location.name : t("locationNotSet");
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
    renderForecastSection(true);

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
        renderForecastSection(false, true);
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

    todayKeys.forEach((dateKey, i) => {
        const idxList = times.reduce((acc, tm, idx) => {
            if (tm.startsWith(dateKey)) acc.push(idx);
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

        let tempMin = null, tempMax = null, humiditySum = 0, humidityCount = 0;
        const tempArr = weatherHourly.temperature_2m;
        const humArr = weatherHourly.relative_humidity_2m;
        idxList.forEach(idx => {
            if (tempArr && tempArr[idx] !== null && tempArr[idx] !== undefined) {
                if (tempMin === null || tempArr[idx] < tempMin) tempMin = tempArr[idx];
                if (tempMax === null || tempArr[idx] > tempMax) tempMax = tempArr[idx];
            }
            if (humArr && humArr[idx] !== null && humArr[idx] !== undefined) {
                humiditySum += humArr[idx];
                humidityCount++;
            }
        });

        const dateObj = new Date(dateKey + "T00:00:00");
        days.push({
            date: dateKey,
            dayIndex: i,
            dateDisplay: dateObj.toLocaleDateString(LOCALES[settings.language] || "pl-PL", { day: "numeric", month: "long" }),
            tempMin: tempMin !== null ? Math.round(tempMin) : null,
            tempMax: tempMax !== null ? Math.round(tempMax) : null,
            humidityAvg: humidityCount ? Math.round(humiditySum / humidityCount) : null,
            levels
        });
    });

    return days;
}

function dayLabel(dayIndex) {
    if (dayIndex === 0) return t("today");
    if (dayIndex === 1) return t("tomorrow");
    return t("dayAfter");
}

function concentrationLevel(value) {
    if (value === null || value === undefined) return { label: t("levelNoData"), color: "bg-slate-100 text-slate-400" };
    if (value === 0) return { label: t("levelNone"), color: "bg-slate-200 text-slate-600" };
    if (value < 10) return { label: t("levelLow"), color: "bg-green-100 text-green-700" };
    if (value < 30) return { label: t("levelMedium"), color: "bg-yellow-100 text-yellow-700" };
    if (value < 70) return { label: t("levelHigh"), color: "bg-orange-100 text-orange-700" };
    return { label: t("levelVeryHigh"), color: "bg-red-100 text-red-700" };
}

function visibleAllergens() {
    if (settings.viewMode === "selected" && settings.selectedAllergens.length > 0) {
        return ALLERGENS.filter(a => settings.selectedAllergens.includes(a.key));
    }
    return ALLERGENS;
}

function renderForecastSection(loading, error) {
    const resultsEl = document.getElementById("forecast-results");
    if (!resultsEl) return;

    if (!settings.location) {
        resultsEl.innerHTML = `<p class="text-slate-500 text-sm">${t("noLocationForecast")}</p>`;
        return;
    }
    if (loading) {
        resultsEl.innerHTML = `<p class="text-slate-500 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i>${t("loading")}</p>`;
        return;
    }
    if (error) {
        resultsEl.innerHTML = `<p class="text-red-500 text-sm"><i class="fa-solid fa-triangle-exclamation mr-2"></i>${t("errorFetch")}</p>`;
        return;
    }
    if (!dailyForecast.length) {
        resultsEl.innerHTML = `<p class="text-slate-500 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i>${t("loading")}</p>`;
        return;
    }

    const allergens = visibleAllergens();
    if (!allergens.length) {
        resultsEl.innerHTML = `<p class="text-slate-500 text-sm">${t("noAllergensSelected")}</p>`;
        return;
    }

    const dayCards = dailyForecast.map(day => {
        const badges = allergens.map(a => {
            const value = day.levels[a.key];
            const level = concentrationLevel(value);
            return `
                <div class="flex flex-col items-center gap-1 w-16" title="${allergenLabel(a)}: ${level.label}">
                    <div class="w-11 h-11 rounded-full flex items-center justify-center ${level.color}">
                        <i class="fa-solid ${a.icon}"></i>
                    </div>
                    <span class="text-[11px] text-slate-500 text-center leading-tight">${allergenLabel(a)}</span>
                </div>
            `;
        }).join("");

        const tempStr = (day.tempMin !== null && day.tempMax !== null) ? `${day.tempMin}°–${day.tempMax}°C` : "—";
        const humStr = day.humidityAvg !== null ? `${day.humidityAvg}%` : "—";

        return `
            <div class="glass-card rounded-xl p-4 shadow-sm">
                <p class="font-semibold text-sm mb-2">${dayLabel(day.dayIndex)} <span class="text-slate-400 font-normal">· ${day.dateDisplay}</span></p>
                <div class="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span><i class="fa-solid fa-temperature-half text-blue-500 mr-1"></i>${tempStr}</span>
                    <span><i class="fa-solid fa-droplet text-blue-500 mr-1"></i>${humStr}</span>
                </div>
                <div class="flex flex-wrap gap-3">${badges}</div>
            </div>
        `;
    }).join("");

    resultsEl.innerHTML = `
        <div class="space-y-3">${dayCards}</div>
        <div class="flex flex-wrap gap-2 mt-4 text-[11px]">
            <span class="px-2 py-1 rounded-full bg-green-100 text-green-700">${t("levelLow")}</span>
            <span class="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">${t("levelMedium")}</span>
            <span class="px-2 py-1 rounded-full bg-orange-100 text-orange-700">${t("levelHigh")}</span>
            <span class="px-2 py-1 rounded-full bg-red-100 text-red-700">${t("levelVeryHigh")}</span>
        </div>
        <p class="text-[11px] text-slate-400 mt-4">${t("dataSource")}</p>
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
                    <i class="fa-solid ${a.icon} text-blue-600 w-5 text-center"></i>${allergenLabel(a)}
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

async function setLanguage(lang) {
    settings.language = lang;
    await saveData();
    renderShell();
}

function languageOptions() {
    return Object.keys(LANGUAGE_NAMES).map(code =>
        `<option value="${code}" ${settings.language === code ? "selected" : ""}>${LANGUAGE_NAMES[code]}</option>`
    ).join("");
}

// ----- Szkielet interfejsu -----
function renderShell() {
    const root = document.getElementById("app-root");
    if (!root) return;

    root.innerHTML = `
        <div class="min-h-screen flex flex-col">
            <header class="bg-blue-600 text-white px-5 py-4 shadow-md">
                <div class="flex items-center justify-between mb-3">
                    <h1 class="text-xl font-bold"><i class="fa-solid fa-wind mr-2"></i>Alergo</h1>
                    <select id="lang-select" class="bg-blue-700 text-white text-xs rounded-lg px-2 py-1.5 border border-blue-400 focus:outline-none">
                        ${languageOptions()}
                    </select>
                </div>
                <p class="text-blue-100 text-xs mb-3">${t("subtitle")}</p>

                <div class="flex items-center gap-2 mb-2">
                    <i class="fa-solid fa-location-dot text-blue-200"></i>
                    <span id="location-label" class="text-sm flex-1 truncate"></span>
                    <button id="gps-btn" type="button" class="bg-blue-500 hover:bg-blue-400 text-white text-xs px-2.5 py-1.5 rounded-lg shrink-0">
                        <i class="fa-solid fa-crosshairs"></i>
                    </button>
                </div>

                <div class="relative">
                    <input id="city-input" type="text" placeholder="${t("cityPlaceholder")}" autocomplete="off"
                        class="w-full rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300">
                    <div id="city-suggestions" class="hide absolute z-10 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-56 overflow-y-auto text-slate-800"></div>
                </div>
            </header>

            <main class="flex-1 px-5 py-6 max-w-md w-full mx-auto">

                <section class="glass-card rounded-xl mb-5 shadow-sm overflow-hidden">
                    <button id="panel-toggle" type="button" class="w-full flex items-center justify-between px-4 py-3">
                        <span class="font-semibold text-sm"><i class="fa-solid fa-list-check text-blue-600 mr-2"></i>${t("panelTitle")}</span>
                        <i id="panel-chevron" class="fa-solid fa-chevron-down text-slate-400 transition-transform"></i>
                    </button>
                    <div id="allergen-panel-body" class="hide px-4 pb-4">
                        <div id="allergen-list"></div>
                    </div>
                </section>

                <section>
                    <div class="flex items-center justify-between mb-3">
                        <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide">${t("forecastTitle")}</h2>
                    </div>
                    <div class="flex gap-2 mb-4">
                        <button id="view-selected-btn" type="button">${t("viewSelected")}</button>
                        <button id="view-all-btn" type="button">${t("viewAll")}</button>
                    </div>
                    <div id="forecast-results"></div>
                </section>
            </main>

            <footer class="text-center text-[11px] text-slate-400 py-4 px-5">
                ${t("copyright").replace("{year}", new Date().getFullYear())}
            </footer>
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

        if (!e.target.closest("#city-input") && !e.target.closest("#city-suggestions")) {
            const box = document.getElementById("city-suggestions");
            if (box) box.classList.add("hide");
        }
    });

    root.addEventListener("change", (e) => {
        const checkbox = e.target.closest(".allergen-checkbox");
        if (checkbox) { toggleAllergenSelection(checkbox.dataset.key); return; }

        const langSelect = e.target.closest("#lang-select");
        if (langSelect) setLanguage(langSelect.value);
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
