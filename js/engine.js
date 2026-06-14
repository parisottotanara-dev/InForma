/* =====================================================================
   InForma — engine.js
   Motore di calcolo: formule scientifiche validate, nessuna
   dipendenza esterna, funziona completamente offline.

   - Metabolismo basale: formula di Mifflin-St Jeor
   - Fabbisogno totale (TDEE): fattore di attività quotidiana
     + contributo per ogni seduta di allenamento settimanale
   - Obiettivo: deficit/surplus calcolato da peso target e data,
     con limiti di sicurezza (ritmo massimo, calorie minime)
   - Macro: proteine e grassi in g/kg in base all'obiettivo,
     carboidrati a completamento delle calorie
   ===================================================================== */
'use strict';

const Engine = {
  KCAL_PER_KG: 7700, // contenuto energetico di 1 kg di tessuto adiposo

  ACTIVITY: [
    { id: 'sedentario', label: 'Sedentario',           desc: 'Lavoro da scrivania, poco movimento durante il giorno', f: 1.2 },
    { id: 'leggero',    label: 'Leggermente attivo',   desc: 'Cammini regolarmente o lavori in piedi',                f: 1.375 },
    { id: 'moderato',   label: 'Moderatamente attivo', desc: 'Lavoro in movimento per gran parte della giornata',     f: 1.55 },
    { id: 'alto',       label: 'Molto attivo',         desc: 'Lavoro fisico pesante',                                 f: 1.725 }
  ],

  GOALS: [
    { id: 'dimagrire', label: 'Perdere peso',     desc: 'Deficit calorico controllato preservando i muscoli' },
    { id: 'mantenere', label: 'Mantenimento',     desc: 'Restare al peso attuale migliorando la composizione corporea' },
    { id: 'massa',     label: 'Aumentare massa',  desc: 'Surplus calorico moderato per costruire muscolo' }
  ],

  // Metabolismo basale (Mifflin-St Jeor)
  bmr(p) {
    const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
    return Math.round(base + (p.sex === 'M' ? 5 : -161));
  },

  // Il fattore di attività descrive la vita quotidiana SENZA allenamento;
  // ogni seduta settimanale aggiunge circa il 2,5% di dispendio, così
  // l'allenamento non viene mai contato due volte.
  activityFactor(p) {
    const a = this.ACTIVITY.find(x => x.id === p.activity) || this.ACTIVITY[0];
    return a.f + 0.025 * (p.trainDays || 0);
  },

  tdee(p) {
    return Math.round(this.bmr(p) * this.activityFactor(p));
  },

  /**
   * Calcola il piano completo: calorie, macro, ritmo settimanale.
   * Restituisce anche eventuali avvisi se l'obiettivo non è realistico
   * e, in quel caso, una data di arrivo raggiungibile in sicurezza.
   */
  plan(p) {
    const bmr  = this.bmr(p);
    const tdee = this.tdee(p);
    const warnings = [];
    let weeklyKg = 0;
    let realisticDate = null;

    if (p.goal !== 'mantenere' && p.targetDate) {
      const msWeek = 7 * 86400000;
      const weeks = Math.max(1, (new Date(p.targetDate) - Date.now()) / msWeek);
      weeklyKg = (p.targetWeight - p.weight) / weeks;

      // Limiti di sicurezza sul ritmo
      const maxLoss = Math.min(p.weight * 0.01, 1); // max 1% del peso (o 1 kg) a settimana
      const maxGain = 0.35;                          // oltre, il surplus diventa soprattutto grasso

      if (weeklyKg < -maxLoss) {
        const weeksNeeded = Math.ceil(Math.abs(p.targetWeight - p.weight) / maxLoss);
        realisticDate = new Date(Date.now() + weeksNeeded * msWeek);
        warnings.push(
          `L'obiettivo richiederebbe di perdere ${Math.abs(weeklyKg).toFixed(1)} kg a settimana: troppo rapido per essere sano e sostenibile. ` +
          `Il piano è stato impostato al ritmo massimo sicuro (${maxLoss.toFixed(1)} kg/settimana): arriverai al peso obiettivo intorno al ${realisticDate.toLocaleDateString('it-IT')}.`
        );
        weeklyKg = -maxLoss;
      } else if (weeklyKg > maxGain) {
        const weeksNeeded = Math.ceil((p.targetWeight - p.weight) / maxGain);
        realisticDate = new Date(Date.now() + weeksNeeded * msWeek);
        warnings.push(
          `Aumentare di ${weeklyKg.toFixed(1)} kg a settimana significherebbe accumulare soprattutto grasso. ` +
          `Il piano è stato impostato a +${maxGain} kg/settimana: raggiungerai il peso obiettivo intorno al ${realisticDate.toLocaleDateString('it-IT')}.`
        );
        weeklyKg = maxGain;
      }
    }

    let kcal = Math.round(tdee + (weeklyKg * this.KCAL_PER_KG) / 7);

    // Paletti di sicurezza sulle calorie
    const minKcal = p.sex === 'M' ? 1500 : 1200;
    const maxDeficitFloor = Math.round(tdee * 0.75); // deficit mai oltre il 25% del TDEE
    const maxSurplusCeil  = Math.round(tdee * 1.15); // surplus mai oltre il 15% del TDEE

    if (p.goal === 'dimagrire' && kcal < maxDeficitFloor) kcal = maxDeficitFloor;
    if (p.goal === 'massa' && kcal > maxSurplusCeil) kcal = maxSurplusCeil;
    if (kcal < minKcal) {
      kcal = minKcal;
      warnings.push(`Le calorie sono state alzate a ${minKcal} kcal: scendere sotto questa soglia non è sicuro.`);
    }

    // Ripartizione dei macronutrienti
    const gkgProt = { dimagrire: 2.0, mantenere: 1.7, massa: 1.8 }[p.goal] || 1.7;
    const gkgFat  = { dimagrire: 0.8, mantenere: 0.9, massa: 1.0 }[p.goal] || 0.9;
    let protein = Math.round(gkgProt * p.weight);
    let fat     = Math.round(gkgFat * p.weight);
    let carbs   = Math.round((kcal - protein * 4 - fat * 9) / 4);

    if (carbs < 50) {
      // Con poche calorie e molto peso corporeo i conti possono stringersi:
      // si riducono prima i grassi (fino a 0,6 g/kg), poi le proteine (fino a 1,6 g/kg)
      fat = Math.max(Math.round(0.6 * p.weight), Math.round((kcal - protein * 4 - 50 * 4) / 9));
      carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
      if (carbs < 50) {
        protein = Math.max(Math.round(1.6 * p.weight), Math.round((kcal - fat * 9 - 50 * 4) / 4));
        carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
      }
      if (carbs < 0) carbs = 0;
    }

    const water = Math.round(p.weight * 0.033 * 10) / 10; // litri/giorno

    return { bmr, tdee, kcal, protein, fat, carbs, weeklyKg, water, warnings,
             realisticDate: realisticDate ? realisticDate.toISOString().slice(0, 10) : null,
             computedAt: new Date().toISOString().slice(0, 10),
             startWeight: p.weight };
  },

  /**
   * Peso atteso a una certa data seguendo il piano
   * (traiettoria lineare dal peso di partenza al target).
   */
  expectedWeight(targets, profile, dateStr) {
    if (!targets || profile.goal === 'mantenere') return profile.weight;
    const start = new Date(targets.computedAt);
    const days = (new Date(dateStr) - start) / 86400000;
    const w = targets.startWeight + (targets.weeklyKg / 7) * days;
    // non oltre il target
    if (targets.weeklyKg < 0) return Math.max(w, profile.targetWeight);
    return Math.min(w, profile.targetWeight);
  }
};
