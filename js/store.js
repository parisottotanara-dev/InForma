/* =====================================================================
   InForma — store.js
   Layer di persistenza: TUTTE le letture/scritture dei dati passano
   da qui. Quando l'app diventerà multi-utente con account, basterà
   sostituire l'implementazione di questi metodi con chiamate API,
   senza toccare il resto dell'applicazione.
   ===================================================================== */
'use strict';

const Store = {
  KEY: 'informa.data.v1',
  _data: null,

  _empty() {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      theme: 'brace',     // tema grafico scelto
      profile: null,      // dati inseriti nell'onboarding
      targets: null,      // kcal e macro calcolati dal motore
      mealPlan: null,     // piano alimentare settimanale
      workoutPlan: null,  // scheda di allenamento
      weights: [],        // [{date:'YYYY-MM-DD', kg:Number}]
      workoutLog: {},     // {'YYYY-MM-DD': true} = allenamento completato
      mealLog: {},        // {'YYYY-MM-DD': [indici dei pasti spuntati]}
      waterLog: {},       // {'YYYY-MM-DD': numero di bicchieri da 250 ml}
      notes: {},          // {'YYYY-MM-DD': testo del diario}
      badges: [],         // id dei traguardi già sbloccati (per il messaggio "nuovo!")
      equipment: null,    // array attrezzi disponibili (null = deriva da location)
      space: 'medio',     // spazio disponibile: piccolo | medio | grande
      workoutSchedule: {},// {'YYYY-MM-DD': indice seduta | 'rest'} override del calendario
      exNotes: {}         // {chiaveEsercizio: nota personale}
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this._data = raw ? Object.assign(this._empty(), JSON.parse(raw)) : this._empty();
    } catch (e) {
      console.error('Dati locali non leggibili, riparto da zero.', e);
      this._data = this._empty();
    }
    return this._data;
  },

  get data() {
    return this._data || this.load();
  },

  save() {
    localStorage.setItem(this.KEY, JSON.stringify(this.data));
  },

  reset() {
    this._data = this._empty();
    this.save();
  },

  exportJson() {
    return JSON.stringify(this.data, null, 2);
  },

  importJson(text) {
    const parsed = JSON.parse(text); // lancia un errore se il file non è JSON
    if (!parsed || typeof parsed !== 'object' || !('profile' in parsed)) {
      throw new Error('File di backup non riconosciuto');
    }
    this._data = Object.assign(this._empty(), parsed);
    this.save();
  }
};
