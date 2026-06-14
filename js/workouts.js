/* =====================================================================
   InForma — workouts.js
   Generatore della scheda di allenamento.

   - Ogni esercizio ha la variante palestra (g) e casa/corpo libero (h)
   - Split scelto in base ai giorni disponibili:
       2 → Full Body A/B          4 → Upper/Lower ×2
       3 → Full Body A/B/C        5 → Upper/Lower + Push/Pull/Legs
       6 → Push/Pull/Legs ×2
   - Serie adattate al livello (principiante/intermedio/avanzato)
   - Cardio consigliato in base all'obiettivo
   ===================================================================== */
'use strict';

const EX = {
  panca:      { g: 'Panca piana con bilanciere',   h: 'Piegamenti a terra',                     m: 'Petto' },
  panca_inc:  { g: 'Panca inclinata con manubri',  h: 'Piegamenti con piedi rialzati',          m: 'Petto alto' },
  croci:      { g: 'Croci ai cavi o con manubri',  h: 'Piegamenti presa larga',                 m: 'Petto' },
  lat:        { g: 'Lat machine (o trazioni)',     h: 'Trazioni alla sbarra o con elastico',    m: 'Dorso' },
  rematore:   { g: 'Rematore con bilanciere',      h: 'Rematore con zaino zavorrato',           m: 'Dorso' },
  pulley:     { g: 'Pulley basso',                 h: 'Rematore con elastico da seduto',        m: 'Dorso' },
  lento:      { g: 'Lento avanti con manubri',     h: 'Pike push-up',                           m: 'Spalle' },
  alzate:     { g: 'Alzate laterali con manubri',  h: 'Alzate laterali con elastico/bottiglie', m: 'Spalle' },
  squat:      { g: 'Squat con bilanciere',         h: 'Squat a corpo libero (o jump squat)',    m: 'Gambe' },
  pressa:     { g: 'Pressa a 45°',                 h: 'Affondi camminati',                      m: 'Gambe' },
  affondi:    { g: 'Affondi con manubri',          h: 'Affondi sul posto',                      m: 'Gambe' },
  stacco_rum: { g: 'Stacco rumeno con bilanciere', h: 'Hip thrust a una gamba',                 m: 'Femorali e glutei' },
  hip:        { g: 'Hip thrust con bilanciere',    h: 'Hip thrust con appoggio sul divano',     m: 'Glutei' },
  leg_curl:   { g: 'Leg curl',                     h: 'Leg curl con asciugamano (slider)',      m: 'Femorali' },
  polpacci:   { g: 'Calf raise in piedi',          h: 'Calf raise su un gradino',               m: 'Polpacci' },
  curl:       { g: 'Curl con bilanciere',          h: 'Curl con elastico o zaino',              m: 'Bicipiti' },
  curl_mart:  { g: 'Curl a martello con manubri',  h: 'Curl presa neutra con bottiglie',        m: 'Bicipiti' },
  pushdown:   { g: 'Pushdown ai cavi',             h: 'Dip tra due sedie',                      m: 'Tricipiti' },
  french:     { g: 'French press con manubri',     h: 'Piegamenti presa stretta (diamante)',    m: 'Tricipiti' },
  plank:      { g: 'Plank',                        h: 'Plank',                                  m: 'Core' },
  crunch:     { g: 'Crunch',                       h: 'Crunch',                                 m: 'Core' }
};

// Schema base (per livello intermedio): [esercizio, serie, ripetizioni, recupero in secondi]
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

// Giorni della settimana consigliati per allenarsi (0=lunedì … 6=domenica)
const DEFAULT_TRAIN_WEEKDAYS = {
  2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5]
};

const Workouts = {
  EX,

  generate(profile) {
    const days = Math.min(6, Math.max(2, profile.trainDays || 3));
    const template = TEMPLATES[days];
    const levelDelta = { principiante: -1, intermedio: 0, avanzato: 1 }[profile.level] || 0;

    const plan = template.map(day => ({
      name: day.name,
      ex: day.ex.map(([key, sets, reps, rest]) => ({
        key,
        sets: Math.max(2, sets + levelDelta),
        reps, rest,
        gym: EX[key].g, home: EX[key].h, muscle: EX[key].m
      }))
    }));

    return {
      split: SPLIT_NAMES[days],
      days: plan,
      trainWeekdays: DEFAULT_TRAIN_WEEKDAYS[days],
      location: profile.location,
      cardio: this.cardio(profile),
      notes: this.notes(profile),
      generatedAt: new Date().toISOString().slice(0, 10)
    };
  },

  /** Nome dell'esercizio da mostrare in base al luogo di allenamento. */
  exerciseName(ex, location) {
    return location === 'casa' ? ex.home : ex.gym;
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
      'Tecnica prima del carico: meglio un peso più basso eseguito bene.'
    ];
    if (profile.level === 'principiante') {
      n.unshift('Le prime 2 settimane usa carichi leggeri per imparare i movimenti: la forza arriverà comunque.');
    }
    if (profile.location === 'misto') {
      n.push('Sotto ogni esercizio trovi l\'alternativa da fare a casa quando non vai in palestra.');
    }
    return n;
  }
};
