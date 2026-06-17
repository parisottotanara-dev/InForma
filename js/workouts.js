/* =====================================================================
   InForma — workouts.js
   Generatore della scheda di allenamento, consapevole di attrezzatura
   e spazio.

   Catalogo EX: ogni esercizio ha
     n  = nome
     m  = muscolo (etichetta mostrata)
     g  = gruppo per le alternative (petto, dorso, spalle, quad,
          postchain, polpacci, bicipiti, tricipiti, core)
     e  = attrezzi richiesti ([] = corpo libero, sempre disponibile)
     d  = difficoltà 1-3
     sp = spazio minimo richiesto (1 piccolo · 2 medio · 3 grande)

   In base agli attrezzi/spazio dichiarati dall'utente, la scheda
   sostituisce gli esercizi non compatibili con alternative dello
   stesso gruppo. Da qui derivano anche "cambia" e "variante più dura".
   ===================================================================== */
'use strict';

const EX = {
  // ---- PETTO ----
  panca:        { n: 'Panca piana con bilanciere',      m: 'Petto', g: 'petto', e: ['bilanciere', 'panca'], d: 3, sp: 2 },
  panca_inc:    { n: 'Panca inclinata con manubri',     m: 'Petto alto', g: 'petto', e: ['manubri', 'panca'], d: 3, sp: 2 },
  croci:        { n: 'Croci con manubri',               m: 'Petto', g: 'petto', e: ['manubri', 'panca'], d: 2, sp: 2 },
  chest_press:  { n: 'Chest press alla macchina',       m: 'Petto', g: 'petto', e: ['macchine'], d: 2, sp: 1 },
  spinte_elast: { n: 'Spinte sul petto con elastico',   m: 'Petto', g: 'petto', e: ['elastici'], d: 1, sp: 1 },
  piegamenti:   { n: 'Piegamenti a terra',              m: 'Petto', g: 'petto', e: [], d: 2, sp: 2 },
  piegamenti_g: { n: 'Piegamenti sulle ginocchia',      m: 'Petto', g: 'petto', e: [], d: 1, sp: 2 },
  piegamenti_d: { n: 'Piegamenti con piedi rialzati',   m: 'Petto alto', g: 'petto', e: [], d: 3, sp: 2 },

  // ---- DORSO ----
  rematore:     { n: 'Rematore con bilanciere',         m: 'Dorso', g: 'dorso', e: ['bilanciere'], d: 3, sp: 2 },
  rematore_man: { n: 'Rematore con manubri',            m: 'Dorso', g: 'dorso', e: ['manubri'], d: 2, sp: 1 },
  lat:          { n: 'Lat machine',                     m: 'Dorso', g: 'dorso', e: ['macchine'], d: 2, sp: 1 },
  pulley:       { n: 'Pulley basso ai cavi',            m: 'Dorso', g: 'dorso', e: ['macchine'], d: 2, sp: 1 },
  trazioni:     { n: 'Trazioni alla sbarra',            m: 'Dorso', g: 'dorso', e: ['sbarra'], d: 3, sp: 2 },
  trazioni_el:  { n: 'Trazioni assistite con elastico', m: 'Dorso', g: 'dorso', e: ['sbarra', 'elastici'], d: 2, sp: 2 },
  rematore_el:  { n: 'Rematore con elastico',           m: 'Dorso', g: 'dorso', e: ['elastici'], d: 1, sp: 1 },
  rematore_inv: { n: 'Rematore inverso sotto un tavolo',m: 'Dorso', g: 'dorso', e: [], d: 2, sp: 2 },
  superman:     { n: 'Superman a terra',                m: 'Dorso', g: 'dorso', e: [], d: 1, sp: 2 },

  // ---- SPALLE ----
  lento_bil:    { n: 'Military press con bilanciere',   m: 'Spalle', g: 'spalle', e: ['bilanciere'], d: 3, sp: 2 },
  lento:        { n: 'Lento avanti con manubri',        m: 'Spalle', g: 'spalle', e: ['manubri'], d: 2, sp: 1 },
  alzate:       { n: 'Alzate laterali con manubri',     m: 'Spalle', g: 'spalle', e: ['manubri'], d: 1, sp: 1 },
  alzate_el:    { n: 'Alzate laterali con elastico',    m: 'Spalle', g: 'spalle', e: ['elastici'], d: 1, sp: 1 },
  pike:         { n: 'Pike push-up',                    m: 'Spalle', g: 'spalle', e: [], d: 2, sp: 2 },

  // ---- GAMBE (quadricipiti) ----
  squat:        { n: 'Squat con bilanciere',            m: 'Gambe', g: 'quad', e: ['bilanciere'], d: 3, sp: 2 },
  goblet:       { n: 'Goblet squat con manubrio',       m: 'Gambe', g: 'quad', e: ['manubri'], d: 2, sp: 2 },
  goblet_kb:    { n: 'Goblet squat con kettlebell',     m: 'Gambe', g: 'quad', e: ['kettlebell'], d: 2, sp: 2 },
  pressa:       { n: 'Pressa a 45°',                    m: 'Gambe', g: 'quad', e: ['macchine'], d: 2, sp: 1 },
  affondi:      { n: 'Affondi con manubri',             m: 'Gambe', g: 'quad', e: ['manubri'], d: 2, sp: 3 },
  affondi_cl:   { n: 'Affondi sul posto',               m: 'Gambe', g: 'quad', e: [], d: 2, sp: 3 },
  squat_cl:     { n: 'Squat a corpo libero',            m: 'Gambe', g: 'quad', e: [], d: 1, sp: 2 },
  bulgaro:      { n: 'Affondo bulgaro (una gamba)',     m: 'Gambe', g: 'quad', e: [], d: 3, sp: 2 },

  // ---- CATENA POSTERIORE (femorali e glutei) ----
  stacco_rum:   { n: 'Stacco rumeno con bilanciere',    m: 'Femorali e glutei', g: 'postchain', e: ['bilanciere'], d: 3, sp: 2 },
  stacco_man:   { n: 'Stacco rumeno con manubri',       m: 'Femorali e glutei', g: 'postchain', e: ['manubri'], d: 2, sp: 1 },
  hip:          { n: 'Hip thrust con bilanciere',       m: 'Glutei', g: 'postchain', e: ['bilanciere', 'panca'], d: 2, sp: 2 },
  hip_cl:       { n: 'Ponte per glutei a terra',        m: 'Glutei', g: 'postchain', e: [], d: 1, sp: 2 },
  hip_1leg:     { n: 'Hip thrust a una gamba',          m: 'Glutei', g: 'postchain', e: [], d: 2, sp: 2 },
  leg_curl:     { n: 'Leg curl alla macchina',          m: 'Femorali', g: 'postchain', e: ['macchine'], d: 1, sp: 1 },
  curl_slider:  { n: 'Leg curl con asciugamano',        m: 'Femorali', g: 'postchain', e: [], d: 2, sp: 2 },
  nordic:       { n: 'Nordic curl',                     m: 'Femorali', g: 'postchain', e: [], d: 3, sp: 2 },

  // ---- POLPACCI ----
  polpacci:     { n: 'Calf raise in piedi',             m: 'Polpacci', g: 'polpacci', e: [], d: 1, sp: 1 },
  polpacci_man: { n: 'Calf raise con manubri',          m: 'Polpacci', g: 'polpacci', e: ['manubri'], d: 1, sp: 1 },
  polpacci_mac: { n: 'Calf alla macchina',              m: 'Polpacci', g: 'polpacci', e: ['macchine'], d: 1, sp: 1 },

  // ---- BICIPITI ----
  curl:         { n: 'Curl con bilanciere',             m: 'Bicipiti', g: 'bicipiti', e: ['bilanciere'], d: 2, sp: 1 },
  curl_mart:    { n: 'Curl a martello con manubri',     m: 'Bicipiti', g: 'bicipiti', e: ['manubri'], d: 1, sp: 1 },
  curl_el:      { n: 'Curl con elastico',               m: 'Bicipiti', g: 'bicipiti', e: ['elastici'], d: 1, sp: 1 },
  curl_zaino:   { n: 'Curl con bottiglie o zaino',      m: 'Bicipiti', g: 'bicipiti', e: [], d: 1, sp: 1 },
  chin:         { n: 'Chin-up (presa supina)',          m: 'Bicipiti', g: 'bicipiti', e: ['sbarra'], d: 3, sp: 2 },

  // ---- TRICIPITI ----
  pushdown:     { n: 'Pushdown ai cavi',                m: 'Tricipiti', g: 'tricipiti', e: ['macchine'], d: 1, sp: 1 },
  french:       { n: 'French press con manubri',        m: 'Tricipiti', g: 'tricipiti', e: ['manubri'], d: 2, sp: 1 },
  dip_sedie:    { n: 'Dip tra due sedie',               m: 'Tricipiti', g: 'tricipiti', e: [], d: 2, sp: 2 },
  pieg_stretti: { n: 'Piegamenti presa stretta',        m: 'Tricipiti', g: 'tricipiti', e: [], d: 2, sp: 2 },

  // ---- CORE ----
  plank:        { n: 'Plank',                           m: 'Core', g: 'core', e: [], d: 1, sp: 2 },
  crunch:       { n: 'Crunch',                          m: 'Core', g: 'core', e: [], d: 1, sp: 2 },
  hollow:       { n: 'Hollow hold',                     m: 'Core', g: 'core', e: [], d: 2, sp: 2 },
  leg_raise:    { n: 'Sollevamento gambe a terra',      m: 'Core', g: 'core', e: [], d: 2, sp: 2 }
};

// Schema base (livello intermedio): [chiave, serie, ripetizioni, recupero]
const TEMPLATES = {
  2: [
    { name: 'Full Body A', ex: [['squat', 4, '6-10', 120], ['panca', 4, '6-10', 120], ['rematore', 3, '8-12', 90], ['lento', 3, '8-12', 90], ['leg_curl', 3, '10-15', 60], ['plank', 3, '45-60″', 60]] },
    { name: 'Full Body B', ex: [['stacco_rum', 4, '6-10', 120], ['lat', 4, '8-12', 90], ['panca_inc', 3, '8-12', 90], ['affondi', 3, '10-12', 90], ['curl', 3, '10-15', 60], ['pushdown', 3, '10-15', 60]] }
  ],
  3: [
    { name: 'Full Body A', ex: [['squat', 4, '6-10', 120], ['panca', 4, '6-10', 120], ['rematore', 3, '8-12', 90], ['alzate', 3, '12-15', 60], ['plank', 3, '45-60″', 60]] },
    { name: 'Full Body B', ex: [['stacco_rum', 4, '6-10', 120], ['lat', 4, '8-12', 90], ['lento', 3, '8-12', 90], ['affondi', 3, '10-12', 90], ['curl', 3, '10-15', 60]] },
    { name: 'Full Body C', ex: [['pressa', 4, '8-12', 120], ['panca_inc', 3, '8-12', 90], ['pulley', 3, '10-12', 90], ['leg_curl', 3, '10-15', 60], ['french', 3, '10-15', 60], ['crunch', 3, '15-20', 45]] }
  ],
  4: [
    { name: 'Upper A', ex: [['panca', 4, '6-10', 120], ['rematore', 4, '8-12', 90], ['lento', 3, '8-12', 90], ['lat', 3, '8-12', 90], ['curl', 3, '10-15', 60], ['pushdown', 3, '10-15', 60]] },
    { name: 'Lower A', ex: [['squat', 4, '6-10', 120], ['stacco_rum', 3, '8-12', 120], ['affondi', 3, '10-12', 90], ['polpacci', 4, '12-15', 60], ['plank', 3, '45-60″', 60]] },
    { name: 'Upper B', ex: [['panca_inc', 4, '8-12', 90], ['lat', 4, '8-12', 90], ['alzate', 3, '12-15', 60], ['pulley', 3, '10-12', 90], ['curl_mart', 3, '10-15', 60], ['french', 3, '10-15', 60]] },
    { name: 'Lower B', ex: [['pressa', 4, '8-12', 120], ['hip', 3, '8-12', 90], ['leg_curl', 3, '10-15', 60], ['polpacci', 4, '12-15', 60], ['crunch', 3, '15-20', 45]] }
  ],
  5: [
    { name: 'Upper', ex: [['panca', 4, '6-10', 120], ['rematore', 4, '8-12', 90], ['lento', 3, '8-12', 90], ['lat', 3, '8-12', 90], ['curl', 3, '10-15', 60]] },
    { name: 'Lower', ex: [['squat', 4, '6-10', 120], ['stacco_rum', 3, '8-12', 120], ['affondi', 3, '10-12', 90], ['polpacci', 4, '12-15', 60], ['plank', 3, '45-60″', 60]] },
    { name: 'Push (spinta)', ex: [['panca_inc', 4, '8-12', 90], ['croci', 3, '10-15', 60], ['alzate', 3, '12-15', 60], ['pushdown', 3, '10-15', 60], ['french', 3, '10-15', 60]] },
    { name: 'Pull (trazione)', ex: [['lat', 4, '8-12', 90], ['pulley', 3, '10-12', 90], ['rematore', 3, '8-12', 90], ['curl', 3, '10-15', 60], ['curl_mart', 3, '10-15', 60]] },
    { name: 'Legs (gambe)', ex: [['pressa', 4, '8-12', 120], ['hip', 3, '8-12', 90], ['leg_curl', 3, '10-15', 60], ['polpacci', 4, '12-15', 60], ['crunch', 3, '15-20', 45]] }
  ],
  6: [
    { name: 'Push A', ex: [['panca', 4, '6-10', 120], ['lento', 3, '8-12', 90], ['croci', 3, '10-15', 60], ['pushdown', 3, '10-15', 60]] },
    { name: 'Pull A', ex: [['lat', 4, '8-12', 90], ['rematore', 4, '8-12', 90], ['curl', 3, '10-15', 60], ['plank', 3, '45-60″', 60]] },
    { name: 'Legs A', ex: [['squat', 4, '6-10', 120], ['stacco_rum', 3, '8-12', 120], ['affondi', 3, '10-12', 90], ['polpacci', 4, '12-15', 60]] },
    { name: 'Push B', ex: [['panca_inc', 4, '8-12', 90], ['alzate', 3, '12-15', 60], ['french', 3, '10-15', 60], ['crunch', 3, '15-20', 45]] },
    { name: 'Pull B', ex: [['pulley', 4, '10-12', 90], ['lat', 3, '8-12', 90], ['curl_mart', 3, '10-15', 60], ['plank', 3, '45-60″', 60]] },
    { name: 'Legs B', ex: [['pressa', 4, '8-12', 120], ['hip', 3, '8-12', 90], ['leg_curl', 3, '10-15', 60], ['polpacci', 4, '12-15', 60]] }
  ]
};

const SPLIT_NAMES = {
  2: 'Full Body 2 giorni', 3: 'Full Body 3 giorni', 4: 'Upper / Lower',
  5: 'Upper / Lower + Push / Pull / Legs', 6: 'Push / Pull / Legs ×2'
};
const DEFAULT_TRAIN_WEEKDAYS = {
  2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5]
};

const Workouts = {
  EX,
  EQUIP: [
    { id: 'manubri',    label: 'Manubri',         icon: '🏋️' },
    { id: 'bilanciere', label: 'Bilanciere',      icon: '🟰' },
    { id: 'panca',      label: 'Panca',           icon: '🪑' },
    { id: 'sbarra',     label: 'Sbarra trazioni', icon: '🚪' },
    { id: 'elastici',   label: 'Elastici',        icon: '🎗️' },
    { id: 'kettlebell', label: 'Kettlebell',      icon: '🔔' },
    { id: 'macchine',   label: 'Macchine / cavi', icon: '⚙️' }
  ],
  SPACES: [
    { id: 'piccolo', label: 'Piccolo', desc: 'Una stanza, poco spazio', v: 1 },
    { id: 'medio',   label: 'Medio',   desc: 'Spazio per stendersi e fare affondi', v: 2 },
    { id: 'grande',  label: 'Grande',  desc: 'Garage / palestra, tanto spazio', v: 3 }
  ],

  spaceValue(space) {
    const s = this.SPACES.find(x => x.id === space);
    return s ? s.v : 2;
  },

  // Attrezzi predefiniti derivati dalla vecchia scelta palestra/casa/misto
  defaultEquip(location) {
    if (location === 'casa') return ['elastici'];
    if (location === 'misto') return ['manubri', 'panca', 'elastici', 'sbarra'];
    return ['manubri', 'bilanciere', 'panca', 'sbarra', 'elastici', 'kettlebell', 'macchine'];
  },

  compatible(key, equip, spaceV) {
    const x = EX[key];
    if (!x) return false;
    if ((x.sp || 1) > spaceV) return false;
    return x.e.every(req => equip.includes(req));
  },

  /** Alternative dello stesso gruppo compatibili con attrezzi/spazio. */
  alternatives(key, equip, spaceV, exclude) {
    const x = EX[key];
    if (!x) return [];
    exclude = exclude || [];
    return Object.keys(EX)
      .filter(k => k !== key && EX[k].g === x.g && !exclude.includes(k) && this.compatible(k, equip, spaceV))
      .sort((a, b) => Math.abs(EX[a].d - x.d) - Math.abs(EX[b].d - x.d));
  },

  /** Variante più difficile dello stesso gruppo (difficoltà superiore). */
  harder(key, equip, spaceV) {
    const x = EX[key];
    if (!x) return null;
    const cands = Object.keys(EX)
      .filter(k => k !== key && EX[k].g === x.g && EX[k].d > x.d && this.compatible(k, equip, spaceV))
      .sort((a, b) => EX[a].d - EX[b].d);
    return cands[0] || null;
  },

  /** Sceglie l'esercizio per uno slot: l'originale se compatibile, altrimenti la migliore alternativa. */
  resolve(key, equip, spaceV) {
    if (this.compatible(key, equip, spaceV)) return key;
    const alt = this.alternatives(key, equip, spaceV);
    if (alt.length) return alt[0];
    // ripiego garantito: un esercizio a corpo libero dello stesso gruppo (così non resta mai un esercizio impossibile)
    const x = EX[key];
    const bw = Object.keys(EX).filter(k => EX[k].g === x.g && EX[k].e.length === 0).sort((a, b) => EX[a].d - EX[b].d);
    return bw[0] || key;
  },

  exObj(key, sets, reps, rest) {
    const x = EX[key];
    return { key, name: x.n, muscle: x.m, diff: x.d, sets, reps, rest };
  },

  // Video curati (id YouTube, canali italiani) per gli esercizi più tecnici;
  // per gli altri si usa una ricerca mirata.
  VIDEO: {
    squat: 'H1_YLMIkoCU', panca: '3CgfAV84cfM', panca_inc: 'KBog9sXe4I4',
    stacco_rum: 'avFCLVJB0xs', stacco_man: 'avFCLVJB0xs', hip: 'IHk9Qn8ttX8',
    trazioni: 'm2cauCtWj8E', rematore: 'x1HJqhZP0tg', rematore_man: 'x1HJqhZP0tg',
    lento: 'fkW9CxGN4pk', affondi: 'Jezpb-6fuQ0', affondi_cl: 'Jezpb-6fuQ0',
    goblet: 'RPUqGn8mbN4', goblet_kb: 'RPUqGn8mbN4'
  },
  videoId(key) { return this.VIDEO[key] || null; },
  searchUrl(name) {
    return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' tutorial esecuzione corretta');
  },

  generate(profile, equip, space) {
    const days = Math.min(6, Math.max(2, profile.trainDays || 3));
    const template = TEMPLATES[days];
    const levelDelta = { principiante: -1, intermedio: 0, avanzato: 1 }[profile.level] || 0;
    equip = (equip && equip.length !== undefined) ? equip : this.defaultEquip(profile.location);
    space = space || 'medio';
    const spaceV = this.spaceValue(space);

    const plan = template.map(day => {
      const used = new Set();
      return {
        name: day.name,
        ex: day.ex.map(([key, sets, reps, rest]) => {
          let chosen = this.resolve(key, equip, spaceV);
          if (used.has(chosen)) { // evita lo stesso esercizio due volte nella giornata
            const alts = this.alternatives(key, equip, spaceV, [...used, chosen]);
            if (alts.length) chosen = alts[0];
            else {
              const x = EX[key];
              const bw = Object.keys(EX).filter(k => EX[k].g === x.g && EX[k].e.length === 0 && !used.has(k)).sort((a, b) => EX[a].d - EX[b].d);
              if (bw.length) chosen = bw[0];
            }
          }
          used.add(chosen);
          return this.exObj(chosen, Math.max(2, sets + levelDelta), reps, rest);
        })
      };
    });

    return {
      v2: true,
      split: SPLIT_NAMES[days],
      days: plan,
      trainWeekdays: DEFAULT_TRAIN_WEEKDAYS[days],
      location: profile.location,
      equipment: equip,
      space: space,
      cardio: this.cardio(profile),
      notes: this.notes(profile),
      generatedAt: new Date().toISOString().slice(0, 10)
    };
  },

  cardio(profile) {
    const byGoal = {
      dimagrire: [
        { name: 'Camminata veloce, corsa leggera o bici', dur: '30-40 min', freq: '2-3 volte a settimana, nei giorni di riposo o dopo i pesi' },
        { name: 'HIIT (sprint o circuito, opzionale)', dur: '15-20 min', freq: '1 volta a settimana al posto di una sessione lenta' }
      ],
      mantenere: [
        { name: 'Camminata veloce, corsa o bici', dur: '30 min', freq: '1-2 volte a settimana' }
      ],
      massa: [
        { name: 'Camminata o bici a bassa intensità', dur: '20-30 min', freq: '1 volta a settimana per la salute cardiovascolare' }
      ]
    };
    return {
      sessions: byGoal[profile.goal] || byGoal.mantenere,
      steps: profile.goal === 'dimagrire' ? '8.000-10.000 passi al giorno' : '6.000-8.000 passi al giorno'
    };
  },

  notes(profile) {
    const n = [
      'Riscaldamento: 5-10 minuti di cardio leggero + 1-2 serie di avvicinamento sui primi esercizi.',
      'Progressione: quando completi tutte le serie al limite alto delle ripetizioni, aumenta il carico del 2,5-5% (o aggiungi 1-2 ripetizioni a corpo libero).',
      'Lascia 1-2 ripetizioni "di riserva": non arrivare a cedimento completo su ogni serie.',
      'Tecnica prima del carico: meglio un peso più basso eseguito bene. Nel dubbio guarda il video ▶️ accanto all\'esercizio.'
    ];
    if (profile.level === 'principiante') {
      n.unshift('Le prime 2 settimane usa carichi leggeri per imparare i movimenti: la forza arriverà comunque.');
    }
    return n;
  }
};
