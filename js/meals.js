/* =====================================================================
   InForma — meals.js
   Generatore del piano alimentare settimanale.

   - Filtra i piatti in base a dieta (onnivora/vegetariana/vegana)
     ed esclusioni (lattosio, glutine, pesce, frutta secca)
   - Ripartisce le calorie target sui pasti della giornata
   - Scala le grammature di ogni piatto per centrare le calorie
   - Garantisce varietà: nessun piatto ripetuto due giorni di fila
   ===================================================================== */
'use strict';

const Meals = {
  // Ripartizione calorica per numero di pasti
  DISTRIBUTIONS: {
    3: [['colazione', 0.30], ['pranzo', 0.40], ['cena', 0.30]],
    4: [['colazione', 0.25], ['pranzo', 0.35], ['spuntino', 0.10], ['cena', 0.30]],
    5: [['colazione', 0.25], ['spuntino', 0.10], ['pranzo', 0.30], ['spuntino', 0.10], ['cena', 0.25]]
  },

  SLOT_LABELS: { colazione: 'Colazione', pranzo: 'Pranzo', cena: 'Cena', spuntino: 'Spuntino' },

  /** Piatti compatibili con dieta ed esclusioni del profilo. */
  pool(slot, profile) {
    const excl = profile.exclusions || [];
    let list = Foods.MEALS.filter(m => m.slot === slot);

    if (profile.diet === 'vegana') list = list.filter(m => Foods.isVegan(m));
    else if (profile.diet === 'vegetariana') list = list.filter(m => Foods.isVegetarian(m));

    const filtered = list.filter(m => {
      const f = Foods.flagsOf(m);
      if (excl.includes('lattosio') && f.has('lact')) return false;
      if (excl.includes('glutine') && f.has('glut')) return false;
      if (excl.includes('pesce') && f.has('fish')) return false;
      if (excl.includes('frutta_secca') && f.has('nuts')) return false;
      return true;
    });

    // Se le esclusioni svuotano il pool, si ripiega sulla sola dieta
    return filtered.length ? filtered : list;
  },

  /** Scala un piatto perché si avvicini alle kcal target dello slot. */
  _scaled(meal, targetKcal) {
    const base = Foods.totals(meal, 1).kcal;
    let factor = targetKcal / base;
    factor = Math.min(1.8, Math.max(0.55, factor));
    factor = Math.round(factor * 20) / 20; // passi di 0,05
    const t = Foods.totals(meal, factor);
    return { id: meal.id, factor, ...t };
  },

  /**
   * Genera il piano settimanale: 7 giorni (0=lunedì … 6=domenica),
   * ogni giorno con i pasti previsti dal profilo.
   */
  generateWeek(profile, targets) {
    const dist = this.DISTRIBUTIONS[profile.mealsPerDay] || this.DISTRIBUTIONS[4];
    const days = [];

    // Densità proteica richiesta dal piano (quota di kcal da proteine):
    // per ogni pasto si ruota tra i 5 piatti che ci si avvicinano di più,
    // così le proteine restano vicine al target tutta la settimana
    // mantenendo comunque varietà (un pizzico di casualità nel punteggio).
    const targetPd = (targets.protein * 4) / targets.kcal;

    const ranked = {};
    const cursor = {};
    const next = (slot, avoidId) => {
      if (!ranked[slot]) {
        const pool = this.pool(slot, profile)
          .map(m => {
            const t = Foods.totals(m, 1);
            return { m, score: Math.abs((t.prot * 4) / t.kcal - targetPd) + Math.random() * 0.05 };
          })
          .sort((a, b) => a.score - b.score)
          .map(x => x.m);
        ranked[slot] = pool.slice(0, Math.min(pool.length, 5));
        cursor[slot] = Math.floor(Math.random() * ranked[slot].length);
      }
      const list = ranked[slot];
      let m = list[cursor[slot] % list.length];
      if (m.id === avoidId && list.length > 1) {
        cursor[slot]++;
        m = list[cursor[slot] % list.length];
      }
      cursor[slot]++;
      return m;
    };

    for (let d = 0; d < 7; d++) {
      const slots = dist.map(([slot, share], i) => {
        const prev = days[d - 1] ? days[d - 1].slots[i] : null;
        const meal = next(slot, prev ? prev.id : null);
        return { slot, share, ...this._scaled(meal, targets.kcal * share) };
      });
      days.push({ slots });
    }

    return { days, generatedAt: new Date().toISOString().slice(0, 10) };
  },

  /** Sostituisce un singolo pasto con un'alternativa compatibile. */
  swap(plan, dayIdx, slotIdx, profile, targets) {
    const current = plan.days[dayIdx].slots[slotIdx];
    const candidates = this.pool(current.slot, profile).filter(m => m.id !== current.id);
    if (!candidates.length) return false;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    plan.days[dayIdx].slots[slotIdx] = {
      slot: current.slot, share: current.share,
      ...this._scaled(pick, targets.kcal * current.share)
    };
    return true;
  },

  /** Totali nutrizionali di una giornata del piano. */
  dayTotals(day) {
    return day.slots.reduce((acc, s) => ({
      kcal: acc.kcal + s.kcal, prot: acc.prot + s.prot,
      carb: acc.carb + s.carb, fat: acc.fat + s.fat
    }), { kcal: 0, prot: 0, carb: 0, fat: 0 });
  },

  /** Lista della spesa settimanale, raggruppata per categoria. */
  shoppingList(plan) {
    const sums = {};
    plan.days.forEach(day => {
      day.slots.forEach(s => {
        const meal = Foods.byId(s.id);
        Foods.scaledIngredients(meal, s.factor).forEach(i => {
          if (!sums[i.code]) sums[i.code] = { name: i.name, grams: 0, cat: i.cat };
          sums[i.code].grams += i.grams;
        });
      });
    });

    const CAT_LABELS = {
      cer: 'Cereali e pane', pro: 'Carne, pesce e proteine', lat: 'Latticini e uova',
      fv: 'Frutta e verdura', gra: 'Grassi e frutta secca', alt: 'Dispensa'
    };
    const groups = {};
    Object.values(sums).forEach(item => {
      const label = CAT_LABELS[item.cat] || 'Altro';
      (groups[label] = groups[label] || []).push(item);
    });
    Object.values(groups).forEach(list => list.sort((a, b) => b.grams - a.grams));
    return groups;
  }
};
