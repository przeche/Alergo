// ===== Alergo — logika aplikacji =====

const STORAGE_KEY = "alergo-settings";

function defaultSettings() {
    return {
        location: null,
        selectedAllergens: ["birch_pollen", "grass_pollen", "ragweed_pollen", "dust_mites"],
        panelOpen: false,
        viewMode: "selected",
        language: "pl",
        theme: "system"
    };
}

let settings = defaultSettings();
let dailyForecast = []; // [{ date, dayIndex, tempMin, tempMax, humidityAvg, levels:{key:value} }]

const LOCALES = { pl: "pl-PL", en: "en-GB", de: "de-DE", es: "es-ES", fr: "fr-FR", it: "it-IT" };
const LANGUAGE_NAMES = { pl: "Polski", en: "English", de: "Deutsch", es: "Español", fr: "Français", it: "Italiano" };

const ALLERGENS = [
    { key: "alder_pollen",   icon: "fa-tree",      type: "pollen",
      labels: { pl: "Olcha",            en: "Alder",          de: "Erle",                   es: "Aliso",              fr: "Aulne",         it: "Ontano" } },
    { key: "birch_pollen",   icon: "fa-tree",      type: "pollen",
      labels: { pl: "Brzoza",           en: "Birch",           de: "Birke",                  es: "Abedul",             fr: "Bouleau",       it: "Betulla" } },
    { key: "grass_pollen",   icon: "fa-seedling",  type: "pollen",
      labels: { pl: "Trawy",            en: "Grass",           de: "Gräser",                 es: "Gramíneas",          fr: "Graminées",     it: "Graminacee" } },
    { key: "mugwort_pollen", icon: "fa-leaf",      type: "pollen",
      labels: { pl: "Bylica",           en: "Mugwort",         de: "Beifuß",                 es: "Artemisa",           fr: "Armoise",       it: "Artemisia" } },
    { key: "olive_pollen",   icon: "fa-leaf",      type: "pollen",
      labels: { pl: "Oliwka",           en: "Olive",           de: "Olive",                  es: "Olivo",              fr: "Olivier",       it: "Ulivo" } },
    { key: "ragweed_pollen", icon: "fa-allergies", type: "pollen",
      labels: { pl: "Ambrozja",         en: "Ragweed",         de: "Ambrosia",               es: "Ambrosía",           fr: "Ambroisie",     it: "Ambrosia" } },
    { key: "dust_mites",     icon: "fa-bed",       type: "weather",
      labels: { pl: "Roztocza",         en: "Dust mites",      de: "Hausstaubmilben",        es: "Ácaros del polvo",   fr: "Acariens",      it: "Acari" } },
    { key: "mold",           icon: "fa-bacterium", type: "weather",
      labels: { pl: "Grzyby/Pleśń",     en: "Mold",            de: "Schimmel",               es: "Moho",               fr: "Moisissures",   it: "Muffe" } }
];

const TRANSLATIONS = {
    pl: {
        cityPlaceholder: "Szukaj miasta...",
        locationNotSet: "Nie wybrano lokalizacji",
        panelTitle: "Moje alergeny",
        forecastTitle: "Prognoza 3-dniowa",
        viewSelected: "Wybrane", viewAll: "Wszystkie",
        noLocationForecast: "Wybierz lokalizację, aby zobaczyć prognozę.",
        loading: "Pobieranie prognozy...",
        errorFetch: "Nie udało się pobrać prognozy. Spróbuj ponownie później.",
        noAllergensSelected: "Brak wybranych alergenów. Otwórz panel 'Moje alergeny', aby je wybrać.",
        levelNone: "Brak", levelNoData: "Brak danych", levelLow: "Niskie", levelMedium: "Średnie", levelHigh: "Wysokie", levelVeryHigh: "Bardzo wysokie",
        today: "Dziś", tomorrow: "Jutro", dayAfter: "Pojutrze",
        dataSource: "Źródło danych: Open-Meteo (pyłki i pogoda). Roztocza i grzyby szacowane z wilgotności i temperatury.",
        copyright: "© {year} Alergo. Wszelkie prawa zastrzeżone.",
        themeLight: "Jasny", themeDark: "Ciemny", themeSystem: "Systemowy"
    },
    en: {
        cityPlaceholder: "Search city...",
        locationNotSet: "No location selected",
        panelTitle: "My allergens",
        forecastTitle: "3-day forecast",
        viewSelected: "Selected", viewAll: "All",
        noLocationForecast: "Choose a location to see the forecast.",
        loading: "Loading forecast...",
        errorFetch: "Couldn't load the forecast. Please try again later.",
        noAllergensSelected: "No allergens selected. Open \"My allergens\" to choose some.",
        levelNone: "None", levelNoData: "No data", levelLow: "Low", levelMedium: "Medium", levelHigh: "High", levelVeryHigh: "Very high",
        today: "Today", tomorrow: "Tomorrow", dayAfter: "Day after tomorrow",
        dataSource: "Data source: Open-Meteo (pollen & weather). Dust mites and mold estimated from humidity and temperature.",
        copyright: "© {year} Alergo. All rights reserved.",
        themeLight: "Light", themeDark: "Dark", themeSystem: "System"
    },
    de: {
        cityPlaceholder: "Stadt suchen...",
        locationNotSet: "Kein Standort ausgewählt",
        panelTitle: "Meine Allergene",
        forecastTitle: "3-Tages-Vorhersage",
        viewSelected: "Ausgewählt", viewAll: "Alle",
        noLocationForecast: "Wähle einen Standort, um die Vorhersage zu sehen.",
        loading: "Vorhersage wird geladen...",
        errorFetch: "Die Vorhersage konnte nicht geladen werden. Bitte später erneut versuchen.",
        noAllergensSelected: "Keine Allergene ausgewählt. Öffne 'Meine Allergene' zum Auswählen.",
        levelNone: "Keine", levelNoData: "Keine Daten", levelLow: "Niedrig", levelMedium: "Mittel", levelHigh: "Hoch", levelVeryHigh: "Sehr hoch",
        today: "Heute", tomorrow: "Morgen", dayAfter: "Übermorgen",
        dataSource: "Datenquelle: Open-Meteo (Pollen & Wetter). Hausstaubmilben und Schimmel werden aus Luftfeuchtigkeit und Temperatur geschätzt.",
        copyright: "© {year} Alergo. Alle Rechte vorbehalten.",
        themeLight: "Hell", themeDark: "Dunkel", themeSystem: "System"
    },
    es: {
        cityPlaceholder: "Buscar ciudad...",
        locationNotSet: "Sin ubicación seleccionada",
        panelTitle: "Mis alérgenos",
        forecastTitle: "Pronóstico de 3 días",
        viewSelected: "Seleccionados", viewAll: "Todos",
        noLocationForecast: "Elige una ubicación para ver el pronóstico.",
        loading: "Cargando pronóstico...",
        errorFetch: "No se pudo cargar el pronóstico. Inténtalo de nuevo más tarde.",
        noAllergensSelected: "No hay alérgenos seleccionados. Abre \"Mis alérgenos\" para elegirlos.",
        levelNone: "Ninguno", levelNoData: "Sin datos", levelLow: "Bajo", levelMedium: "Medio", levelHigh: "Alto", levelVeryHigh: "Muy alto",
        today: "Hoy", tomorrow: "Mañana", dayAfter: "Pasado mañana",
        dataSource: "Fuente: Open-Meteo (polen y clima). Ácaros y moho estimados por humedad y temperatura.",
        copyright: "© {year} Alergo. Todos los derechos reservados.",
        themeLight: "Claro", themeDark: "Oscuro", themeSystem: "Sistema"
    },
    fr: {
        cityPlaceholder: "Rechercher une ville...",
        locationNotSet: "Aucune localisation sélectionnée",
        panelTitle: "Mes allergènes",
        forecastTitle: "Prévisions sur 3 jours",
        viewSelected: "Sélectionnés", viewAll: "Tous",
        noLocationForecast: "Choisissez une localisation pour voir les prévisions.",
        loading: "Chargement des prévisions...",
        errorFetch: "Impossible de charger les prévisions. Veuillez réessayer plus tard.",
        noAllergensSelected: "Aucun allergène sélectionné. Ouvrez « Mes allergènes » pour en choisir.",
        levelNone: "Aucun", levelNoData: "Aucune donnée", levelLow: "Faible", levelMedium: "Moyen", levelHigh: "Élevé", levelVeryHigh: "Très élevé",
        today: "Aujourd'hui", tomorrow: "Demain", dayAfter: "Après-demain",
        dataSource: "Source : Open-Meteo (pollen et météo). Acariens et moisissures estimés d'après l'humidité et la température.",
        copyright: "© {year} Alergo. Tous droits réservés.",
        themeLight: "Clair", themeDark: "Sombre", themeSystem: "Système"
    },
    it: {
        cityPlaceholder: "Cerca città...",
        locationNotSet: "Nessuna posizione selezionata",
        panelTitle: "I miei allergeni",
        forecastTitle: "Previsioni a 3 giorni",
        viewSelected: "Selezionati", viewAll: "Tutti",
        noLocationForecast: "Scegli una posizione per vedere le previsioni.",
        loading: "Caricamento previsioni...",
        errorFetch: "Impossibile caricare le previsioni. Riprova più tardi.",
        noAllergensSelected: "Nessun allergene selezionato. Apri \"I miei allergeni\" per sceglierli.",
        levelNone: "Nessuno", levelNoData: "Nessun dato", levelLow: "Basso", levelMedium: "Medio", levelHigh: "Alto", levelVeryHigh: "Molto alto",
        today: "Oggi", tomorrow: "Domani", dayAfter: "Dopodomani",
        dataSource: "Fonte: Open-Meteo (pollini e meteo). Acari e muffe stimati da umidità e temperatura.",
        copyright: "© {year} Alergo. Tutti i diritti riservati.",
        themeLight: "Chiaro", themeDark: "Scuro", themeSystem: "Sistema"
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

function formatDate(dateStr) {
    const locale = LOCALES[settings.language] || "pl-PL";
    return new Date(dateStr + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "long" });
}

// ----- Trwałość danych -----
function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) settings = { ...defaultSettings(), ...JSON.parse(raw) };
    } catch (e) {
        console.warn("loadData error:", e);
    }
}

async function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn("saveData error:", e);
    }
}

function debounce(fn, delay) {
    let timer = null;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ----- Motyw (jasny / ciemny / systemowy) -----
function applyTheme() {
    const html = document.documentElement;
    const theme = settings.theme || "system";
    if (theme === "dark") {
        html.classList.add("dark");
    } else if (theme === "light") {
        html.classList.remove("dark");
    } else {
        window.matchMedia("(prefers-color-scheme: dark)").matches
            ? html.classList.add("dark")
            : html.classList.remove("dark");
    }
}

async function setTheme(mode) {
    settings.theme = mode;
    await saveData();
    applyTheme();
    const sel = document.getElementById("theme-select");
    if (sel) sel.value = mode;
}

// ----- Wyszukiwanie miast -----
async function searchCities(query) {
    if (!query || query.trim().length < 2) return [];
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=${settings.language}&format=json`);
        const data = await res.json();
        return data.results || [];
    } catch (e) { console.error(e); return []; }
}

function renderSuggestions(results) {
    const box = document.getElementById("city-suggestions");
    if (!box) return;
    if (!results.length) { box.innerHTML = ""; box.classList.add("hide"); return; }
    box.innerHTML = results.map((r, i) => {
        const region = [r.admin1, r.country].filter(Boolean).join(", ");
        return `<button type="button" data-idx="${i}" class="city-option w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-600 text-sm border-b border-slate-100 dark:border-slate-600 last:border-0">
            <span class="font-medium text-slate-800 dark:text-slate-100">${r.name}</span>
            <span class="text-slate-400 dark:text-slate-400 text-xs block">${region}</span>
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
    const box = document.getElementById("city-suggestions");
    if (box) { box.innerHTML = ""; box.classList.add("hide"); }
    const input = document.getElementById("city-input");
    if (input) { delete input.dataset.searching; input.value = settings.location.name; }
    await fetchForecast();
}

// ----- GPS -----
async function handleGPS() {
    if (!navigator.geolocation) { alert("Brak wsparcia geolokalizacji."); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const city = (data.address && (data.address.city || data.address.town || data.address.village)) || "—";
            settings.location = { name: city, lat: latitude, lon: longitude };
            await saveData();
            const input = document.getElementById("city-input");
            if (input) input.value = city;
            await fetchForecast();
        } catch (e) { console.error(e); }
    }, (err) => console.error(err));
}

// ----- Ryzyko alergenów pogodowych -----
function dustMiteRisk(humidity, temp) {
    if (humidity == null || temp == null) return null;
    let s = humidity >= 70 ? 100 : humidity >= 50 ? ((humidity - 50) / 20) * 70 + 30 : (humidity / 50) * 30;
    let f = (temp < 15 || temp > 30) ? 0.4 : (temp < 18 || temp > 27) ? 0.7 : 1;
    return Math.round(s * f);
}

function moldRisk(humidity, precipitation) {
    if (humidity == null) return null;
    let s = humidity >= 80 ? 100 : humidity >= 60 ? ((humidity - 60) / 20) * 60 + 40 : (humidity / 60) * 40;
    return Math.min(100, Math.round(s + (precipitation ? Math.min(precipitation * 10, 30) : 0)));
}

// ----- Pobieranie prognozy -----
async function fetchForecast() {
    if (!settings.location) return;
    renderForecastSection("loading");
    try {
        const { lat, lon } = settings.location;
        const pollenKeys = ALLERGENS.filter(a => a.type === "pollen").map(a => a.key).join(",");
        const [pollenRes, weatherRes] = await Promise.all([
            fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=${pollenKeys}&forecast_days=3&timezone=auto`),
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=relative_humidity_2m,temperature_2m,precipitation&forecast_days=3&timezone=auto`)
        ]);
        dailyForecast = computeDailyForecast(await pollenRes.json(), await weatherRes.json());
        renderForecastSection();
    } catch (e) {
        console.error(e);
        renderForecastSection("error");
    }
}

function computeDailyForecast(pollenData, weatherData) {
    const ph = pollenData.hourly || {}, wh = weatherData.hourly || {};
    const times = ph.time || wh.time || [];
    if (!times.length) return [];

    const dateKeys = [];
    times.forEach(tm => { const d = tm.slice(0, 10); if (!dateKeys.includes(d)) dateKeys.push(d); });

    return dateKeys.slice(0, 3).map((dateKey, i) => {
        const idxList = times.reduce((acc, tm, idx) => { if (tm.startsWith(dateKey)) acc.push(idx); return acc; }, []);

        const levels = {};
        ALLERGENS.forEach(a => {
            if (a.type === "pollen") {
                const arr = ph[a.key];
                if (!arr) { levels[a.key] = null; return; }
                const vals = idxList.map(idx => arr[idx]).filter(v => v != null);
                levels[a.key] = vals.length ? Math.max(...vals) : null;
            } else if (a.key === "dust_mites") {
                if (!wh.relative_humidity_2m || !wh.temperature_2m) { levels[a.key] = null; return; }
                const vals = idxList.map(idx => dustMiteRisk(wh.relative_humidity_2m[idx], wh.temperature_2m[idx])).filter(v => v != null);
                levels[a.key] = vals.length ? Math.max(...vals) : null;
            } else if (a.key === "mold") {
                if (!wh.relative_humidity_2m) { levels[a.key] = null; return; }
                const vals = idxList.map(idx => moldRisk(wh.relative_humidity_2m[idx], wh.precipitation ? wh.precipitation[idx] : 0)).filter(v => v != null);
                levels[a.key] = vals.length ? Math.max(...vals) : null;
            }
        });

        let tempMin = null, tempMax = null, humSum = 0, humCount = 0;
        idxList.forEach(idx => {
            const t2 = wh.temperature_2m && wh.temperature_2m[idx];
            const h2 = wh.relative_humidity_2m && wh.relative_humidity_2m[idx];
            if (t2 != null) { if (tempMin === null || t2 < tempMin) tempMin = t2; if (tempMax === null || t2 > tempMax) tempMax = t2; }
            if (h2 != null) { humSum += h2; humCount++; }
        });

        return {
            date: dateKey,
            dayIndex: i,
            tempMin: tempMin !== null ? Math.round(tempMin) : null,
            tempMax: tempMax !== null ? Math.round(tempMax) : null,
            humidityAvg: humCount ? Math.round(humSum / humCount) : null,
            levels
        };
    });
}

function dayLabel(idx) {
    return [t("today"), t("tomorrow"), t("dayAfter")][idx] || "";
}

function concentrationLevel(value) {
    if (value == null) return { label: t("levelNoData"), color: "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500" };
    if (value === 0)   return { label: t("levelNone"),   color: "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400" };
    if (value < 10)    return { label: t("levelLow"),    color: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" };
    if (value < 30)    return { label: t("levelMedium"), color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300" };
    if (value < 70)    return { label: t("levelHigh"),   color: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300" };
    return                    { label: t("levelVeryHigh"), color: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" };
}

function visibleAllergens() {
    if (settings.viewMode === "selected" && settings.selectedAllergens.length > 0)
        return ALLERGENS.filter(a => settings.selectedAllergens.includes(a.key));
    return ALLERGENS;
}

function renderForecastSection(state) {
    const el = document.getElementById("forecast-results");
    if (!el) return;

    if (!settings.location) {
        el.innerHTML = `<p class="text-slate-500 dark:text-slate-400 text-sm">${t("noLocationForecast")}</p>`;
        return;
    }
    if (state === "loading") {
        el.innerHTML = `<p class="text-slate-500 dark:text-slate-400 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i>${t("loading")}</p>`;
        return;
    }
    if (state === "error") {
        el.innerHTML = `<p class="text-red-500 dark:text-red-400 text-sm"><i class="fa-solid fa-triangle-exclamation mr-2"></i>${t("errorFetch")}</p>`;
        return;
    }
    if (!dailyForecast.length) {
        el.innerHTML = `<p class="text-slate-500 dark:text-slate-400 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i>${t("loading")}</p>`;
        return;
    }

    const allergens = visibleAllergens();
    if (!allergens.length) {
        el.innerHTML = `<p class="text-slate-500 dark:text-slate-400 text-sm">${t("noAllergensSelected")}</p>`;
        return;
    }

    const dayCards = dailyForecast.map(day => {
        const dateDisplay = formatDate(day.date);
        const tempStr = (day.tempMin !== null && day.tempMax !== null) ? `${day.tempMin}°–${day.tempMax}°C` : "—";
        const humStr  = day.humidityAvg !== null ? `${day.humidityAvg}%` : "—";

        const badges = allergens.map(a => {
            const lv = concentrationLevel(day.levels[a.key]);
            return `<div class="flex flex-col items-center gap-1 w-16" title="${allergenLabel(a)}: ${lv.label}">
                <div class="w-11 h-11 rounded-full flex items-center justify-center ${lv.color}">
                    <i class="fa-solid ${a.icon}"></i>
                </div>
                <span class="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-tight">${allergenLabel(a)}</span>
            </div>`;
        }).join("");

        return `<div class="glass-card rounded-xl p-4 shadow-sm">
            <p class="font-semibold text-sm mb-2">
                ${dayLabel(day.dayIndex)}
                <span class="text-slate-400 dark:text-slate-500 font-normal">· ${dateDisplay}</span>
            </p>
            <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                <span><i class="fa-solid fa-temperature-half text-blue-500 dark:text-blue-400 mr-1"></i>${tempStr}</span>
                <span><i class="fa-solid fa-droplet text-blue-500 dark:text-blue-400 mr-1"></i>${humStr}</span>
            </div>
            <div class="flex flex-wrap gap-3">${badges}</div>
        </div>`;
    }).join("");

    el.innerHTML = `
        <div class="space-y-3">${dayCards}</div>
        <div class="flex flex-wrap gap-2 mt-4 text-[11px]">
            <span class="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">${t("levelLow")}</span>
            <span class="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">${t("levelMedium")}</span>
            <span class="px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">${t("levelHigh")}</span>
            <span class="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">${t("levelVeryHigh")}</span>
        </div>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-4">${t("dataSource")}</p>`;
}

// ----- Panel alergenów -----
function renderAllergenPanel() {
    const list = document.getElementById("allergen-list");
    if (!list) return;
    list.innerHTML = ALLERGENS.map(a => {
        const checked = settings.selectedAllergens.includes(a.key) ? "checked" : "";
        return `<label class="flex items-center justify-between py-2 px-1 border-b border-slate-100 dark:border-slate-600 last:border-0 cursor-pointer">
            <span class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <i class="fa-solid ${a.icon} text-blue-600 dark:text-blue-400 w-5 text-center"></i>${allergenLabel(a)}
            </span>
            <input type="checkbox" data-key="${a.key}" class="allergen-checkbox w-4 h-4 accent-blue-600" ${checked}>
        </label>`;
    }).join("");
    applyPanelState();
}

function applyPanelState() {
    const panel   = document.getElementById("allergen-panel-body");
    const chevron = document.getElementById("panel-chevron");
    if (!panel || !chevron) return;
    panel.classList.toggle("hide", !settings.panelOpen);
    chevron.classList.toggle("rotate-180", settings.panelOpen);
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
    const active   = "flex-1 text-sm font-medium px-3 py-1.5 rounded-lg transition bg-blue-600 dark:bg-blue-500 text-white";
    const inactive = "flex-1 text-sm font-medium px-3 py-1.5 rounded-lg transition bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
    selBtn.className = active + (settings.viewMode === "selected" ? "" : " !bg-slate-100 dark:!bg-slate-700 !text-slate-600 dark:!text-slate-300");
    allBtn.className = active + (settings.viewMode === "all"      ? "" : " !bg-slate-100 dark:!bg-slate-700 !text-slate-600 dark:!text-slate-300");
    selBtn.className = settings.viewMode === "selected" ? active : inactive;
    allBtn.className = settings.viewMode === "all"      ? active : inactive;
}

async function setLanguage(lang) {
    settings.language = lang;
    await saveData();
    renderShell();
    if (dailyForecast.length) renderForecastSection();
}

function languageOptions() {
    return Object.keys(LANGUAGE_NAMES).map(code =>
        `<option value="${code}" ${settings.language === code ? "selected" : ""}>${LANGUAGE_NAMES[code]}</option>`
    ).join("");
}

function themeOptions() {
    const themes = [
        { value: "light",  label: `☀️ ${t("themeLight")}` },
        { value: "dark",   label: `🌙 ${t("themeDark")}` },
        { value: "system", label: `⚙️ ${t("themeSystem")}` }
    ];
    return themes.map(th =>
        `<option value="${th.value}" ${settings.theme === th.value ? "selected" : ""}>${th.label}</option>`
    ).join("");
}

// ----- Szkielet interfejsu -----
function renderShell() {
    const root = document.getElementById("app-root");
    if (!root) return;

    root.innerHTML = `
        <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">

            <header class="bg-blue-600 dark:bg-blue-900 text-white px-4 py-4 shadow-md">

                <!-- Wiersz 1: Logo + nazwa | Język + Motyw -->
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <img src="icon-512.png" alt="Alergo" class="h-8 w-8 rounded-lg shrink-0 object-cover">
                        <h1 class="text-xl font-bold tracking-tight">Alergo</h1>
                    </div>
                    <div class="flex items-center gap-2">
                        <select id="lang-select"
                            class="bg-blue-700 dark:bg-blue-800 text-white text-xs rounded-lg px-2 py-1.5 border border-blue-400 dark:border-blue-700 focus:outline-none cursor-pointer">
                            ${languageOptions()}
                        </select>
                        <select id="theme-select"
                            class="bg-blue-700 dark:bg-blue-800 text-white text-xs rounded-lg px-2 py-1.5 border border-blue-400 dark:border-blue-700 focus:outline-none cursor-pointer">
                            ${themeOptions()}
                        </select>
                    </div>
                </div>

                <!-- Wiersz 2: Ikona lokalizacji | Pole wyszukiwania | Przycisk GPS — wszystko w jednym rzędzie -->
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-location-dot text-blue-200 shrink-0 text-sm"></i>
                    <div class="relative flex-1">
                        <input id="city-input" type="text" autocomplete="off"
                            placeholder="${t("cityPlaceholder")}"
                            class="w-full rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 border border-transparent dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-slate-400 dark:placeholder-slate-400">
                        <div id="city-suggestions"
                            class="hide absolute z-20 left-0 right-0 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg mt-1 max-h-56 overflow-y-auto"></div>
                    </div>
                    <button id="gps-btn" type="button" title="GPS"
                        class="bg-blue-500 dark:bg-blue-700 hover:bg-blue-400 dark:hover:bg-blue-600 text-white p-2 rounded-lg shrink-0 transition">
                        <i class="fa-solid fa-crosshairs text-sm"></i>
                    </button>
                </div>

            </header>

            <main class="flex-1 px-4 py-5 max-w-md w-full mx-auto">

                <!-- Panel alergenów (zwijany) -->
                <section class="glass-card rounded-xl mb-4 shadow-sm overflow-hidden">
                    <button id="panel-toggle" type="button"
                        class="w-full flex items-center justify-between px-4 py-3 text-left">
                        <span class="font-semibold text-sm flex items-center gap-2">
                            <i class="fa-solid fa-list-check text-blue-600 dark:text-blue-400"></i>
                            ${t("panelTitle")}
                        </span>
                        <i id="panel-chevron"
                            class="fa-solid fa-chevron-down text-slate-400 dark:text-slate-500 transition-transform duration-200"></i>
                    </button>
                    <div id="allergen-panel-body" class="hide px-4 pb-4">
                        <div id="allergen-list"></div>
                    </div>
                </section>

                <!-- Prognoza -->
                <section>
                    <h2 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                        ${t("forecastTitle")}
                    </h2>
                    <div class="flex gap-2 mb-4">
                        <button id="view-selected-btn" type="button">${t("viewSelected")}</button>
                        <button id="view-all-btn"      type="button">${t("viewAll")}</button>
                    </div>
                    <div id="forecast-results"></div>
                </section>

            </main>

            <footer class="text-center text-[11px] text-slate-400 dark:text-slate-500 py-4 px-5 border-t border-slate-200 dark:border-slate-700">
                ${t("copyright").replace("{year}", new Date().getFullYear())}
            </footer>
        </div>`;

    renderAllergenPanel();
    applyViewToggleUI();

    // Wpisz aktualną lokalizację w pole wyszukiwania
    const input = document.getElementById("city-input");
    if (input && settings.location) input.value = settings.location.name;

    renderForecastSection();
    bindEvents();
}

// ----- Obsługa zdarzeń (delegacja na #app-root) -----
function bindEvents() {
    const root = document.getElementById("app-root");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "true";

    const debouncedSearch = debounce(async (query) => {
        renderSuggestions(await searchCities(query));
    }, 350);

    // Focus na polu wyszukiwania — przejście w tryb wyszukiwania
    root.addEventListener("focus", (e) => {
        if (e.target.id === "city-input") {
            e.target.dataset.searching = "true";
            e.target.select();
        }
    }, true);

    // Blur — przywróć nazwę lokalizacji po chwili (czas na kliknięcie podpowiedzi)
    root.addEventListener("blur", (e) => {
        if (e.target.id === "city-input") {
            setTimeout(() => {
                const inp = document.getElementById("city-input");
                if (!inp) return;
                delete inp.dataset.searching;
                if (settings.location) inp.value = settings.location.name;
                const box = document.getElementById("city-suggestions");
                if (box) box.classList.add("hide");
            }, 200);
        }
    }, true);

    root.addEventListener("input", (e) => {
        if (e.target.id !== "city-input") return;
        const q = e.target.value;
        if (q.trim().length < 2) {
            const box = document.getElementById("city-suggestions");
            if (box) { box.innerHTML = ""; box.classList.add("hide"); }
            return;
        }
        debouncedSearch(q);
    });

    root.addEventListener("click", (e) => {
        if (e.target.closest("#gps-btn"))         { handleGPS(); return; }
        if (e.target.closest("#panel-toggle"))     { togglePanel(); return; }
        if (e.target.closest("#view-selected-btn")){ setViewMode("selected"); return; }
        if (e.target.closest("#view-all-btn"))     { setViewMode("all"); return; }

        const opt = e.target.closest(".city-option");
        if (opt) {
            const box = document.getElementById("city-suggestions");
            const results = JSON.parse(box.dataset.results || "[]");
            const result = results[parseInt(opt.dataset.idx, 10)];
            if (result) selectCity(result);
            return;
        }

        if (!e.target.closest("#city-input") && !e.target.closest("#city-suggestions")) {
            const box = document.getElementById("city-suggestions");
            if (box) box.classList.add("hide");
        }
    });

    root.addEventListener("change", (e) => {
        const cb  = e.target.closest(".allergen-checkbox");
        if (cb)  { toggleAllergenSelection(cb.dataset.key); return; }

        const ls  = e.target.closest("#lang-select");
        if (ls)  { setLanguage(ls.value); return; }

        const ts  = e.target.closest("#theme-select");
        if (ts)  { setTheme(ts.value); return; }
    });
}

// ----- Inicjalizacja -----
document.addEventListener("DOMContentLoaded", async () => {
    loadData();
    applyTheme();

    // Nasłuchuj zmian motywu systemowego
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (settings.theme === "system") applyTheme();
    });

    renderShell();
    if (settings.location) await fetchForecast();
});
