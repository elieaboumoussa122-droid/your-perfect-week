/* Stockage local : les données (JSON) dans localStorage, les fichiers lourds
   (photos d'élèves, PDF d'emploi du temps) dans IndexedDB. Rien ne quitte l'appareil. */
(function (EPS) {
  const KEY = 'eps-pro:v1';
  const LEVELS_COLLEGE = ['6e', '5e', '4e', '3e'];
  const LEVELS_LYCEE = ['2nde', '1re', 'Tle'];
  const LEVELS = [...LEVELS_COLLEGE, ...LEVELS_LYCEE];
  const LEVEL_LABEL = { '6e': '6e', '5e': '5e', '4e': '4e', '3e': '3e', '2nde': 'Seconde', '1re': 'Première', Tle: 'Terminale' };
  const LEVEL_COLOR = { '6e': '#0ea5e9', '5e': '#22c55e', '4e': '#f59e0b', '3e': '#ef4444', '2nde': '#8b5cf6', '1re': '#ec4899', Tle: '#14b8a6' };

  const defaults = () => ({
    version: 1,
    profile: {
      civilite: '', firstName: '', lastName: '', email: '', phone: '', photoId: '',
      statut: '', corps: '', diplomes: '', missions: '',
      school: { name: '', type: 'college', city: '', academie: '', uai: '' },
      periods: [],
      specialites: [],
      as: { coordinateur: false, activites: '', creneaux: '' },
      installations: ['Gymnase', 'Plateau extérieur', 'Piste d\'athlétisme'],
      qualifs: [],
      prefs: { sessionMinutes: 110, sessionsPerSequence: 8, weekARef: '', dayStart: '07:30', dayEnd: '18:30', showSaturday: false },
    },
    classes: [],
    timetable: [],
    timetablePdfId: '',
    team: [],
    events: [],
    holidays: [],
    customDocs: {},
    evaluations: {},
  });

  function deepMerge(base, extra) {
    if (Array.isArray(base) || typeof base !== 'object' || base === null) return extra === undefined ? base : extra;
    const out = { ...base };
    for (const k of Object.keys(extra || {})) out[k] = deepMerge(base[k], extra[k]);
    return out;
  }

  let state;
  try { state = deepMerge(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { state = defaults(); }

  const listeners = new Set();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { EPS.ui.toast('Stockage plein : exportez une sauvegarde.', 'err'); }
    listeners.forEach((fn) => fn(state));
  }

  /* ---------- Fichiers (IndexedDB) ---------- */
  const files = new Map();
  let dbp = null;
  function db() {
    if (!dbp) {
      dbp = new Promise((res, rej) => {
        const r = indexedDB.open('eps-pro-files', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('files');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    }
    return dbp;
  }
  async function loadFiles() {
    try {
      const d = await db();
      await new Promise((res) => {
        const tx = d.transaction('files', 'readonly');
        const st = tx.objectStore('files');
        const req = st.openCursor();
        req.onsuccess = () => { const c = req.result; if (c) { files.set(c.key, c.value); c.continue(); } else res(); };
        req.onerror = () => res();
      });
    } catch { /* navigation privée : on garde en mémoire seulement */ }
  }
  async function putFile(id, data) {
    files.set(id, data);
    try {
      const d = await db();
      await new Promise((res, rej) => { const tx = d.transaction('files', 'readwrite'); tx.objectStore('files').put(data, id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    } catch { EPS.ui.toast('Fichier gardé pour cette session seulement.', 'err'); }
  }
  async function deleteFile(id) {
    if (!id) return;
    files.delete(id);
    try { const d = await db(); d.transaction('files', 'readwrite').objectStore('files').delete(id); } catch { /* ignore */ }
  }
  const getFile = (id) => (id ? files.get(id) : undefined);

  /* ---------- Requêtes pratiques ---------- */
  const isLycee = (lvl) => LEVELS_LYCEE.includes(lvl);
  const cycleOf = (lvl) => (lvl === '6e' ? 'c3' : isLycee(lvl) ? 'ly' : 'c4');
  const classById = (id) => state.classes.find((c) => c.id === id);
  const className = (c) => (c ? `${c.level} ${c.section}`.trim() : '');
  const sortClasses = (list) => [...list].sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.section.localeCompare(b.section));

  /** Semaine A ou B pour une date donnée (si une semaine de référence A est définie). */
  function weekType(date) {
    const ref = state.profile.prefs.weekARef;
    if (!ref) return null;
    const monday = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
    const diff = Math.round((monday(date) - monday(EPS.ui.parseISO(ref))) / (7 * 864e5));
    return Math.abs(diff) % 2 === 0 ? 'A' : 'B';
  }
  const isHoliday = (date) => {
    const s = EPS.ui.isoDate(date);
    return state.holidays.find((h) => h.from <= s && s <= (h.to || h.from));
  };
  /** Créneaux d'un emploi du temps pour une date précise (semaine A/B et vacances pris en compte). */
  function slotsOn(date, timetable = state.timetable) {
    if (isHoliday(date)) return [];
    const wt = weekType(date);
    return timetable
      .filter((e) => e.day === date.getDay() && (!e.week || e.week === '*' || !wt || e.week === wt))
      .sort((a, b) => EPS.ui.toMin(a.start) - EPS.ui.toMin(b.start));
  }
  const entryLabel = (e) => (e.classId && classById(e.classId) ? className(classById(e.classId)) : e.label || 'Créneau');
  const entryColor = (e) => {
    const c = e.classId && classById(e.classId);
    if (c) return LEVEL_COLOR[c.level];
    const m = (e.label || '').match(/^(6e|5e|4e|3e|2nde|1re|Tle)/);
    if (m) return LEVEL_COLOR[m[1]];
    return e.type === 'AS' ? '#0f766e' : '#64748b';
  };

  function exportAll() {
    return JSON.stringify({ app: 'eps-pro', exportedAt: new Date().toISOString(), state, files: Object.fromEntries(files) });
  }
  async function importAll(text) {
    const data = JSON.parse(text);
    if (data.app !== 'eps-pro' || !data.state) throw new Error('Fichier non reconnu');
    state = deepMerge(defaults(), data.state);
    for (const [k, v] of Object.entries(data.files || {})) await putFile(k, v);
    save();
  }
  async function resetAll() {
    state = defaults();
    for (const k of [...files.keys()]) await deleteFile(k);
    save();
  }

  EPS.store = {
    get state() { return state; },
    save, subscribe: (fn) => listeners.add(fn),
    loadFiles, putFile, getFile, deleteFile,
    LEVELS, LEVELS_COLLEGE, LEVELS_LYCEE, LEVEL_LABEL, LEVEL_COLOR,
    isLycee, cycleOf, classById, className, sortClasses, weekType, isHoliday, slotsOn, entryLabel, entryColor,
    exportAll, importAll, resetAll,
  };
})(window.EPS);
