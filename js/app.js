/* =====================================================================
   InForma — app.js
   Interfaccia: onboarding guidato, navigazione e le 5 schermate
   (Oggi, Dieta, Workout, Progressi, Profilo).
   ===================================================================== */
'use strict';

/* ---------- Utility ---------- */
const $ = sel => document.querySelector(sel);
const DAYS_FULL = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function todayIdx() { return (new Date().getDay() + 6) % 7; } // 0 = lunedì
function fmtDate(iso) { return new Date(iso + 'T12:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function showModal(html) {
  // La "X" sta nell'angolo (fuori dal corpo scrollabile); il contenuto va in .modal-body
  $('#modal').innerHTML = '<button class="modal-close" onclick="closeModal()" aria-label="Chiudi">✕</button><div class="modal-body">' + html + '</div>';
  $('#modal-overlay').classList.add('active');
}
function closeModal() {
  $('#modal-overlay').classList.remove('active');
  // svuota il contenuto: rimuove eventuali iframe (video) e ne ferma subito l'audio
  $('#modal').innerHTML = '';
}

/* =====================================================================
   ONBOARDING
   ===================================================================== */
const Onboarding = {
  step: 0,
  editing: false,
  data: {},

  defaults() {
    return {
      name: '', sex: 'M', age: 30, height: 175, weight: 75,
      goal: 'dimagrire', targetWeight: 70, targetDate: '',
      activity: 'sedentario', trainDays: 3, location: 'palestra', level: 'principiante',
      diet: 'onnivora', mealsPerDay: 4, exclusions: []
    };
  },

  start(prefill) {
    this.editing = !!prefill;
    this.data = Object.assign(this.defaults(), prefill || {});
    if (!this.data.targetDate) {
      const d = new Date(Date.now() + 90 * 86400000); // proposta: tra 3 mesi
      this.data.targetDate = d.toISOString().slice(0, 10);
    }
    this.step = 0;
    $('#onboarding').classList.add('active');
    $('#app').classList.remove('active');
    this.render();
  },

  steps() {
    const d = this.data;
    return [
      { // ---- 1. Dati personali ----
        title: 'Parlaci di te',
        render: () => `
          <div class="card">
            <h3>👤 I tuoi dati</h3>
            <label class="field"><span class="lbl">Come ti chiami?</span>
              <input type="text" id="f-name" value="${esc(d.name)}" placeholder="Il tuo nome"></label>
            <label class="field"><span class="lbl">Sesso</span></label>
            <div class="choices grid2" data-pick="sex">
              <button class="choice ${d.sex === 'M' ? 'selected' : ''}" data-v="M">Uomo</button>
              <button class="choice ${d.sex === 'F' ? 'selected' : ''}" data-v="F">Donna</button>
            </div>
            <div class="row mt">
              <label class="field grow"><span class="lbl">Età</span>
                <input type="number" id="f-age" value="${d.age}" min="14" max="90"></label>
              <label class="field grow"><span class="lbl">Altezza (cm)</span>
                <input type="number" id="f-height" value="${d.height}" min="120" max="230"></label>
              <label class="field grow"><span class="lbl">Peso (kg)</span>
                <input type="number" id="f-weight" value="${d.weight}" min="35" max="250" step="0.1"></label>
            </div>
          </div>`,
        collect: () => {
          d.name = $('#f-name').value.trim();
          d.age = +$('#f-age').value; d.height = +$('#f-height').value; d.weight = +$('#f-weight').value;
        },
        validate: () => {
          if (!d.name) return 'Inserisci il tuo nome';
          if (!(d.age >= 14 && d.age <= 90)) return 'Inserisci un\'età valida (14-90)';
          if (!(d.height >= 120 && d.height <= 230)) return 'Inserisci un\'altezza valida';
          if (!(d.weight >= 35 && d.weight <= 250)) return 'Inserisci un peso valido';
          return null;
        }
      },
      { // ---- 2. Obiettivo ----
        title: 'Il tuo obiettivo',
        render: () => `
          <div class="card">
            <h3>🎯 Cosa vuoi ottenere?</h3>
            <div class="choices" style="flex-direction:column" data-pick="goal">
              ${Engine.GOALS.map(g => `
                <button class="choice ${d.goal === g.id ? 'selected' : ''}" data-v="${g.id}">${g.label}<small>${g.desc}</small></button>`).join('')}
            </div>
            <div id="goal-extra" class="mt" style="display:${d.goal === 'mantenere' ? 'none' : 'block'}">
              <div class="row">
                <label class="field grow"><span class="lbl">Peso obiettivo (kg)</span>
                  <input type="number" id="f-targetw" value="${d.targetWeight}" min="35" max="250" step="0.1"></label>
                <label class="field grow"><span class="lbl">Entro quando?</span>
                  <input type="date" id="f-targetd" value="${d.targetDate}" min="${todayStr()}"></label>
              </div>
              <p class="hint">Se il ritmo richiesto non fosse salutare, te lo diremo e ti proporremo una data realistica.</p>
            </div>
          </div>
          <div class="card">
            <h3>🚶 Quanto ti muovi nella vita di tutti i giorni?</h3>
            <p class="hint">Senza contare gli allenamenti: quelli li aggiungiamo dopo.</p>
            <div class="choices" style="flex-direction:column" data-pick="activity">
              ${Engine.ACTIVITY.map(a => `
                <button class="choice ${d.activity === a.id ? 'selected' : ''}" data-v="${a.id}">${a.label}<small>${a.desc}</small></button>`).join('')}
            </div>
          </div>`,
        collect: () => {
          if (d.goal !== 'mantenere') {
            d.targetWeight = +$('#f-targetw').value;
            d.targetDate = $('#f-targetd').value;
          } else {
            d.targetWeight = d.weight;
            d.targetDate = '';
          }
        },
        validate: () => {
          if (d.goal === 'mantenere') return null;
          if (!(d.targetWeight >= 35 && d.targetWeight <= 250)) return 'Inserisci un peso obiettivo valido';
          if (!d.targetDate || new Date(d.targetDate) <= new Date()) return 'Scegli una data futura';
          if (d.goal === 'dimagrire' && d.targetWeight >= d.weight) return 'Per perdere peso, il peso obiettivo deve essere inferiore a quello attuale';
          if (d.goal === 'massa' && d.targetWeight <= d.weight) return 'Per aumentare massa, il peso obiettivo deve essere superiore a quello attuale';
          return null;
        }
      },
      { // ---- 3. Allenamento ----
        title: 'Allenamento',
        render: () => `
          <div class="card">
            <h3>📅 Quanti giorni a settimana puoi allenarti?</h3>
            <div class="choices" data-pick="trainDays">
              ${[2, 3, 4, 5, 6].map(n => `<button class="choice ${d.trainDays === n ? 'selected' : ''}" data-v="${n}" style="flex:1;text-align:center">${n}</button>`).join('')}
            </div>
          </div>
          <div class="card">
            <h3>📍 Dove ti alleni?</h3>
            <div class="choices" style="flex-direction:column" data-pick="location">
              <button class="choice ${d.location === 'palestra' ? 'selected' : ''}" data-v="palestra">In palestra<small>Bilancieri, manubri e macchine</small></button>
              <button class="choice ${d.location === 'casa' ? 'selected' : ''}" data-v="casa">A casa<small>Corpo libero, elastici, piccoli attrezzi</small></button>
              <button class="choice ${d.location === 'misto' ? 'selected' : ''}" data-v="misto">Un po' e un po'<small>Scheda da palestra con alternative per casa</small></button>
            </div>
          </div>
          <div class="card">
            <h3>💪 Il tuo livello</h3>
            <div class="choices" style="flex-direction:column" data-pick="level">
              <button class="choice ${d.level === 'principiante' ? 'selected' : ''}" data-v="principiante">Principiante<small>Mi alleno da meno di 1 anno (o riparto da zero)</small></button>
              <button class="choice ${d.level === 'intermedio' ? 'selected' : ''}" data-v="intermedio">Intermedio<small>Mi alleno con costanza da 1-3 anni</small></button>
              <button class="choice ${d.level === 'avanzato' ? 'selected' : ''}" data-v="avanzato">Avanzato<small>Più di 3 anni di allenamento serio</small></button>
            </div>
          </div>`,
        collect: () => {}, validate: () => null
      },
      { // ---- 4. Alimentazione ----
        title: 'Alimentazione',
        render: () => `
          <div class="card">
            <h3>🥗 Che dieta segui?</h3>
            <div class="choices" data-pick="diet">
              <button class="choice grow ${d.diet === 'onnivora' ? 'selected' : ''}" data-v="onnivora">Onnivora</button>
              <button class="choice grow ${d.diet === 'vegetariana' ? 'selected' : ''}" data-v="vegetariana">Vegetariana</button>
              <button class="choice grow ${d.diet === 'vegana' ? 'selected' : ''}" data-v="vegana">Vegana</button>
            </div>
          </div>
          <div class="card">
            <h3>🍽️ Quanti pasti al giorno preferisci?</h3>
            <div class="choices" data-pick="mealsPerDay">
              <button class="choice grow center ${d.mealsPerDay === 3 ? 'selected' : ''}" data-v="3">3<small>Colazione, pranzo, cena</small></button>
              <button class="choice grow center ${d.mealsPerDay === 4 ? 'selected' : ''}" data-v="4">4<small>+ 1 spuntino</small></button>
              <button class="choice grow center ${d.mealsPerDay === 5 ? 'selected' : ''}" data-v="5">5<small>+ 2 spuntini</small></button>
            </div>
          </div>
          <div class="card">
            <h3>🚫 C'è qualcosa da evitare?</h3>
            <p class="hint">Puoi selezionare più opzioni, o nessuna.</p>
            <div class="choices grid2" data-multi="exclusions">
              ${[['lattosio', 'Senza lattosio'], ['glutine', 'Senza glutine'], ['pesce', 'Niente pesce'], ['frutta_secca', 'Niente frutta secca']]
                .map(([v, l]) => `<button class="choice ${d.exclusions.includes(v) ? 'selected' : ''}" data-v="${v}">${l}</button>`).join('')}
            </div>
          </div>`,
        collect: () => {}, validate: () => null
      }
    ];
  },

  render() {
    const steps = this.steps();
    $('#ob-progress').innerHTML = steps.map((_, i) => `<i class="${i <= this.step ? 'done' : ''}"></i>`).join('');
    $('#ob-step').innerHTML = `<div class="ob-stepcount">Passo ${this.step + 1} di ${steps.length} · ${steps[this.step].title}</div>` + steps[this.step].render();
    $('#ob-back').style.visibility = this.step === 0 ? 'hidden' : 'visible';
    $('#ob-next').textContent = this.step === steps.length - 1 ? 'Crea il mio piano ✨' : 'Avanti';

    // selettori a scelta singola
    document.querySelectorAll('[data-pick]').forEach(group => {
      group.addEventListener('click', e => {
        const btn = e.target.closest('.choice');
        if (!btn) return;
        const key = group.dataset.pick;
        const v = btn.dataset.v;
        this.data[key] = isNaN(+v) || key === 'sex' ? v : +v;
        if (key === 'sex' || key === 'goal' || key === 'activity' || key === 'location' || key === 'level' || key === 'diet') this.data[key] = v;
        group.querySelectorAll('.choice').forEach(b => b.classList.toggle('selected', b === btn));
        if (key === 'goal') {
          const extra = $('#goal-extra');
          if (extra) extra.style.display = v === 'mantenere' ? 'none' : 'block';
        }
      });
    });
    // selettori a scelta multipla
    document.querySelectorAll('[data-multi]').forEach(group => {
      group.addEventListener('click', e => {
        const btn = e.target.closest('.choice');
        if (!btn) return;
        const key = group.dataset.multi;
        const v = btn.dataset.v;
        const arr = this.data[key];
        const i = arr.indexOf(v);
        if (i >= 0) arr.splice(i, 1); else arr.push(v);
        btn.classList.toggle('selected');
      });
    });
  },

  next() {
    const steps = this.steps();
    const s = steps[this.step];
    s.collect();
    const err = s.validate();
    if (err) { toast(err); return; }
    if (this.step < steps.length - 1) {
      this.step++;
      this.render();
      window.scrollTo(0, 0);
    } else {
      this.finish();
    }
  },

  back() {
    if (this.step > 0) { this.step--; this.render(); window.scrollTo(0, 0); }
  },

  finish() {
    const profile = this.data;
    const targets = Engine.plan(profile);
    const data = Store.data;
    data.profile = profile;
    data.targets = targets;
    data.mealPlan = Meals.generateWeek(profile, targets);
    data.workoutPlan = Workouts.generate(profile);
    if (!this.editing || !data.weights.length) {
      data.weights = [{ date: todayStr(), kg: profile.weight }];
    }
    Store.save();
    this.showSummary(targets, profile);
  },

  showSummary(t, p) {
    $('#ob-step').innerHTML = `
      <div class="card center">
        <h3>🎉 ${esc(p.name)}, il tuo piano è pronto!</h3>
        <p class="hint">Calcolato con la formula di Mifflin-St Jeor sul tuo profilo e obiettivo.</p>
        <div class="stat-grid mt">
          <div class="stat"><div class="v">${t.kcal}</div><div class="l">kcal al giorno</div></div>
          <div class="stat"><div class="v">${t.tdee}</div><div class="l">kcal mantenimento (TDEE)</div></div>
          <div class="stat"><div class="v">${t.protein} g</div><div class="l">proteine</div></div>
          <div class="stat"><div class="v">${t.carb !== undefined ? t.carb : t.carbs} g</div><div class="l">carboidrati</div></div>
          <div class="stat"><div class="v">${t.fat} g</div><div class="l">grassi</div></div>
          <div class="stat"><div class="v">${t.weeklyKg ? (t.weeklyKg > 0 ? '+' : '') + t.weeklyKg.toFixed(2) + ' kg' : '—'}</div><div class="l">a settimana</div></div>
        </div>
        ${t.warnings.map(w => `<div class="warn" style="text-align:left">⚠️ ${w}</div>`).join('')}
      </div>`;
    $('#ob-back').style.visibility = 'hidden';
    const btn = $('#ob-next');
    btn.textContent = 'Inizia! 🚀';
    btn.onclick = () => { btn.onclick = null; App.enter(); };
  }
};

/* =====================================================================
   GRAFICO PESO (SVG)
   ===================================================================== */
function weightChart(weights, profile, targets) {
  if (!weights.length) return '<p class="hint center">Registra il tuo primo peso per vedere il grafico.</p>';

  const W = 600, H = 280, PAD = { l: 44, r: 14, t: 14, b: 28 };
  const sorted = weights.slice().sort((a, b) => a.date.localeCompare(b.date));

  const pts = sorted.map(w => ({ x: new Date(w.date).getTime(), y: w.kg }));
  let xMin = pts[0].x, xMax = pts[pts.length - 1].x;
  let yVals = pts.map(p => p.y);

  let expected = null;
  if (profile.goal !== 'mantenere' && targets && profile.targetDate) {
    expected = [
      { x: new Date(targets.computedAt).getTime(), y: targets.startWeight },
      { x: new Date(profile.targetDate).getTime(), y: profile.targetWeight }
    ];
    xMin = Math.min(xMin, expected[0].x); xMax = Math.max(xMax, expected[1].x);
    yVals = yVals.concat([expected[0].y, expected[1].y]);
  }
  if (xMax - xMin < 86400000 * 7) xMax = xMin + 86400000 * 7;

  let yMin = Math.min(...yVals), yMax = Math.max(...yVals);
  const padY = Math.max(1, (yMax - yMin) * 0.15);
  yMin -= padY; yMax += padY;

  const X = x => PAD.l + ((x - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const Y = y => H - PAD.b - ((y - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  // griglia orizzontale
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const v = yMin + ((yMax - yMin) * i) / 4;
    grid += `<line x1="${PAD.l}" y1="${Y(v)}" x2="${W - PAD.r}" y2="${Y(v)}" stroke="var(--line)" stroke-width="1"/>
             <text x="${PAD.l - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${v.toFixed(1)}</text>`;
  }
  // etichette date (inizio e fine)
  const dateLbl = ts => new Date(ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  grid += `<text x="${PAD.l}" y="${H - 8}" font-size="11" fill="var(--muted)">${dateLbl(xMin)}</text>
           <text x="${W - PAD.r}" y="${H - 8}" text-anchor="end" font-size="11" fill="var(--muted)">${dateLbl(xMax)}</text>`;

  let expLine = '';
  if (expected) {
    expLine = `<line x1="${X(expected[0].x)}" y1="${Y(expected[0].y)}" x2="${X(expected[1].x)}" y2="${Y(expected[1].y)}"
               stroke="var(--accent)" stroke-width="2" stroke-dasharray="7 6" opacity=".85"/>`;
  }

  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
  const dots = pts.map(p => `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="4" fill="var(--brand)"/>`).join('');

  return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${grid}${expLine}
      <path d="${path}" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linecap="round"/>
      ${dots}
    </svg></div>
    <div class="legend"><span><i style="background:var(--brand)"></i>Peso reale</span>
    ${expected ? '<span><i style="background:var(--accent)"></i>Traiettoria piano</span>' : ''}</div>`;
}

/* =====================================================================
   APP — schermate
   ===================================================================== */
const THEMES = [
  { id: 'brace',    name: 'Brace',      sw: 'radial-gradient(120% 120% at 72% 26%, #ffb347 0%, #ff6b3d 34%, #2a1d12 72%, #14100c 100%)' },
  { id: 'agrumi',   name: 'Agrumi',     sw: 'linear-gradient(135deg,#fffaf2 0%,#ff8a3d 55%,#f2542d 100%)' },
  { id: 'energico', name: 'Energico',   sw: 'linear-gradient(135deg,#ff6b3d,#ff9f1c)' },
  { id: 'carta',    name: 'Carta',      sw: 'linear-gradient(135deg,#f6f2e9,#1f7a53)' },
  { id: 'teal',     name: 'Teal notte', sw: 'linear-gradient(135deg,#2dd4bf,#34d399)' }
];

// Traguardi: calcolati al volo dai dati salvati (nessuno stato extra necessario)
const ACHIEVEMENTS = [
  { id: 'start',        icon: '🏁', name: 'Si comincia',          desc: 'Hai creato il tuo piano personalizzato',        test: () => true },
  { id: 'firstweight',  icon: '⚖️', name: 'Primo check',          desc: 'Hai registrato il tuo primo peso',              test: d => d.weights.length >= 2 },
  { id: 'water',        icon: '💧', name: 'Idratato',             desc: 'Raggiunto l\'obiettivo acqua in una giornata',  test: d => Object.values(d.waterLog || {}).some(g => g * 250 >= d.targets.water * 1000 - 1) },
  { id: 'cleanday',     icon: '🍽️', name: 'Giornata pulita',      desc: 'Spuntati tutti i pasti in una giornata',        test: d => Object.values(d.mealLog || {}).some(a => a.length >= d.profile.mealsPerDay) },
  { id: 'firstworkout', icon: '🏋️', name: 'Prima seduta',         desc: 'Completato il primo allenamento',               test: d => Object.keys(d.workoutLog).length >= 1 },
  { id: 'workout5',     icon: '🔥', name: 'Costante',             desc: '5 allenamenti completati',                      test: d => Object.keys(d.workoutLog).length >= 5 },
  { id: 'workout15',    icon: '💪', name: 'Inarrestabile',        desc: '15 allenamenti completati',                     test: d => Object.keys(d.workoutLog).length >= 15 },
  { id: 'note',         icon: '📝', name: 'Riflessivo',           desc: 'Scritta la prima nota nel diario',              test: d => Object.values(d.notes || {}).some(n => n && n.trim()) },
  { id: 'kg1',          icon: '📉', name: 'Primo traguardo',      desc: 'Avvicinato di almeno 1 kg all\'obiettivo',      test: d => App._towardGoal(d) >= 1 },
  { id: 'goal',         icon: '🎯', name: 'Obiettivo raggiunto',  desc: 'Hai raggiunto il tuo peso obiettivo',           test: d => d.profile.goal !== 'mantenere' && d.weights.length > 0 && Math.abs(App._lastWeight(d) - d.profile.targetWeight) <= 0.3 }
];

const App = {
  currentView: 'oggi',
  dietDay: todayIdx(),

  applyTheme(id) {
    document.documentElement.setAttribute('data-theme', id || 'brace');
  },

  setTheme(id) {
    Store.data.theme = id;
    Store.save();
    this.applyTheme(id);
    this.renderProfilo();
    toast('Tema applicato ✨');
  },

  enter() {
    const d = Store.data;
    // attrezzatura predefinita + migrazione scheda al motore consapevole degli attrezzi
    if (!d.equipment) d.equipment = Workouts.defaultEquip(d.profile.location);
    if (!d.workoutPlan || !d.workoutPlan.v2) {
      d.workoutPlan = Workouts.generate(d.profile, d.equipment, d.space);
      Store.save();
    }
    this.applyTheme(d.theme);
    this.checkBadges(true); // sblocca in silenzio i traguardi già maturati
    $('#onboarding').classList.remove('active');
    $('#app').classList.add('active');
    this.show(this.currentView);
  },

  // indice della seduta (in workoutPlan.days) per una certa data, rispettando gli spostamenti
  sessionDayIndexForDate(dateStr, weekdayIdx) {
    const d = Store.data, wp = d.workoutPlan;
    const ov = d.workoutSchedule ? d.workoutSchedule[dateStr] : undefined;
    if (ov === 'rest') return -1;
    if (typeof ov === 'number') return ov % wp.days.length;
    const pos = wp.trainWeekdays.indexOf(weekdayIdx);
    return pos >= 0 ? pos % wp.days.length : -1;
  },

  moveWorkoutToTomorrow() {
    const d = Store.data;
    const sIdx = this.sessionDayIndexForDate(todayStr(), todayIdx());
    if (sIdx < 0) { toast('Oggi non è previsto allenamento'); return; }
    d.workoutSchedule = d.workoutSchedule || {};
    d.workoutSchedule[todayStr()] = 'rest';
    const tom = new Date(); tom.setDate(tom.getDate() + 1);
    const tomKey = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;
    d.workoutSchedule[tomKey] = sIdx;
    Store.save();
    toast('Seduta spostata a domani 📅');
    this.renderOggi();
  },

  resetSchedule() {
    Store.data.workoutSchedule = {};
    Store.save();
    toast('Calendario ripristinato');
    this.show(this.currentView);
  },

  show(view) {
    this.currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${view}`).classList.add('active');
    document.querySelectorAll('nav.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    this['render' + view.charAt(0).toUpperCase() + view.slice(1)]();
    const d = Store.data;
    $('#header-sub').textContent = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    const goal = Engine.GOALS.find(g => g.id === d.profile.goal);
    $('#header-goal').textContent = goal ? goal.label : '';
    window.scrollTo(0, 0);
  },

  /* ---------------- OGGI ---------------- */
  renderOggi() {
    const d = Store.data;
    const t = d.targets;
    const day = d.mealPlan.days[todayIdx()];
    const checked = d.mealLog[todayStr()] || [];
    const glassesTarget = Math.max(1, Math.round(t.water * 1000 / 250));
    const glassesDone = d.waterLog[todayStr()] || 0;
    const waterL = (glassesDone * 250 / 1000).toFixed(1).replace('.', ',');
    const note = d.notes[todayStr()] || '';

    // consumo di oggi, calcolato dai pasti spuntati
    const eaten = checked.reduce((a, i) => {
      const s = day.slots[i];
      return s ? { kcal: a.kcal + s.kcal, prot: a.prot + s.prot, carb: a.carb + s.carb, fat: a.fat + s.fat } : a;
    }, { kcal: 0, prot: 0, carb: 0, fat: 0 });

    const remaining = t.kcal - eaten.kcal;
    const over = remaining < 0;
    const pct = Math.max(0, Math.min(1, t.kcal ? eaten.kcal / t.kcal : 0));
    const R = 52, C = 2 * Math.PI * R, dash = pct * C;

    const ring = `
      <svg class="cal-ring" viewBox="0 0 130 130" width="152" height="152" aria-hidden="true">
        <circle cx="65" cy="65" r="${R}" fill="none" stroke="var(--line-2)" stroke-width="11"/>
        <circle cx="65" cy="65" r="${R}" fill="none" stroke="${over ? 'var(--danger)' : 'var(--brand)'}" stroke-width="11"
                stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${(C - dash).toFixed(1)}" transform="rotate(-90 65 65)"/>
        <text x="65" y="62" text-anchor="middle" class="cr-big">${over ? '+' + Math.abs(remaining) : remaining}</text>
        <text x="65" y="82" text-anchor="middle" class="cr-lbl">kcal ${over ? 'oltre' : 'rimaste'}</text>
      </svg>`;

    let motiv;
    if (eaten.kcal === 0) motiv = 'Spunta i pasti man mano che li mangi: tengo io il conto. 🍽️';
    else if (over) motiv = `Hai superato di <b>${Math.abs(remaining)} kcal</b> — capita, domani si riparte. 💪`;
    else if (remaining <= t.kcal * 0.06) motiv = 'Sei perfettamente in linea con l\'obiettivo di oggi! 👏';
    else motiv = `Ti restano <b>${remaining} kcal</b> per chiudere la giornata.`;

    const macroProg = (lbl, val, target, col) => {
      const p = Math.max(0, Math.min(1, target ? val / target : 0));
      return `<div class="m">
        <div class="m-top"><span class="m-dot" style="background:${col}"></span>${lbl}</div>
        <div class="m-val"><b>${Math.round(val)}</b><span class="hint"> / ${target} g</span></div>
        <div class="track"><div class="fill" style="width:${Math.round(p * 100)}%;background:${col}"></div></div>
      </div>`;
    };

    // allenamento di oggi (rispetta gli spostamenti del calendario)
    const wp = d.workoutPlan;
    const sIdx = this.sessionDayIndexForDate(todayStr(), todayIdx());
    const done = !!d.workoutLog[todayStr()];
    let workoutBody;
    if (sIdx >= 0) {
      const wd = wp.days[sIdx];
      workoutBody = `
        <div class="row between">
          <div><b>${wd.name}</b><div class="hint">${wd.ex.length} esercizi · ${wp.split}</div></div>
          <span class="badge">${done ? '✔ Fatto' : 'In programma'}</span>
        </div>
        <div class="row mt">
          <button class="btn small grow" onclick="App.toggleWorkoutDone()">${done ? 'Annulla ✔' : 'Fatto ✔'}</button>
          <button class="btn small secondary grow" onclick="App.show('allenamento')">Scheda</button>
        </div>
        ${done ? '' : `<button class="btn small secondary block" style="margin-top:8px" onclick="App.moveWorkoutToTomorrow()">📅 Oggi non posso · sposta a domani</button>`}`;
    } else {
      const c = wp.cardio.sessions[0];
      workoutBody = `<p class="hint mb0">Oggi è riposo. Recupero attivo consigliato: ${c.name.toLowerCase()}, ${c.dur}. E punta a ${wp.cardio.steps}.</p>`;
    }

    $('#view-oggi').innerHTML = `
      <div class="card oggi-hero">
        <div class="hello">Ciao ${esc(d.profile.name)} 👋</div>
        ${ring}
        <div class="motiv">${motiv}</div>
        <div class="macro3">
          ${macroProg('Proteine', eaten.prot, t.protein, 'var(--prot)')}
          ${macroProg('Carbo', eaten.carb, t.carbs, 'var(--carb)')}
          ${macroProg('Grassi', eaten.fat, t.fat, 'var(--fat)')}
        </div>
      </div>
      <div class="card">
        <h3>${sIdx >= 0 ? '🏋️ Allenamento di oggi' : '🧘 Oggi riposo'}</h3>
        ${workoutBody}
        ${this.weekStrip()}
      </div>
      <div class="card">
        <div class="row between"><h3 class="mb0">🍽️ I pasti di oggi</h3><span class="badge">${checked.length}/${day.slots.length} fatti</span></div>
        <div class="mt">
          ${day.slots.map((s, i) => this.mealHtml(s, i, todayIdx(), checked.includes(i), true)).join('')}
        </div>
      </div>
      <div class="card">
        <div class="row between"><h3 class="mb0">💧 Acqua</h3><span class="badge">${waterL} / ${String(t.water).replace('.', ',')} L</span></div>
        <div class="glasses mt">${Array.from({ length: glassesTarget }, (_, i) => `<span class="glass ${i < glassesDone ? 'full' : ''}"></span>`).join('')}</div>
        <div class="row mt">
          <button class="btn small secondary" onclick="App.addWater(-1)" aria-label="Togli un bicchiere">−</button>
          <button class="btn small grow" onclick="App.addWater(1)">+ Bicchiere (250 ml)</button>
        </div>
      </div>
      <div class="card">
        <h3>📝 Diario di oggi</h3>
        <textarea class="note-area" placeholder="Come ti senti oggi? Sgarri, energia, umore… annota qui." oninput="App.saveNote(this.value)">${esc(note)}</textarea>
      </div>`;
  },

  // striscia degli allenamenti della settimana corrente (lun→dom)
  weekStrip() {
    const d = Store.data, wp = d.workoutPlan;
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - todayIdx());
    const letters = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
    let out = '<div class="weekstrip">';
    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      const isDone = !!d.workoutLog[key];
      const planned = this.sessionDayIndexForDate(key, i) >= 0;
      const cls = ['wk-dot', isDone ? 'done' : '', (planned && !isDone) ? 'planned' : '', i === todayIdx() ? 'today' : ''].filter(Boolean).join(' ');
      out += `<div class="wk"><div class="${cls}">${isDone ? '✓' : ''}</div><span>${letters[i]}</span></div>`;
    }
    return out + '</div>';
  },

  mealHtml(s, slotIdx, dayIdx, isChecked, checkable) {
    const meal = Foods.byId(s.id);
    const ings = Foods.scaledIngredients(meal, s.factor)
      .map(i => `${i.name} ${i.grams} g`).join(' · ');
    return `
      <div class="meal ${isChecked ? 'checked' : ''}" id="meal-${dayIdx}-${slotIdx}">
        <div class="slot">${Meals.SLOT_LABELS[s.slot]}</div>
        <div class="name">${esc(meal.name)}</div>
        <div class="macros">${s.kcal} kcal · P ${s.prot} g · C ${s.carb} g · G ${s.fat} g</div>
        <div class="ingredients">${ings}</div>
        <div class="actions">
          <button class="icon-btn" onclick="App.toggleIngredients(${dayIdx},${slotIdx})">📋 Dettagli</button>
          <button class="icon-btn" onclick="App.swapMeal(${dayIdx},${slotIdx})">🔄 Sostituisci</button>
          <button class="icon-btn" onclick="App.dislikeMeal(${dayIdx},${slotIdx})">🚫 Non mi piace</button>
          ${checkable ? `<button class="icon-btn" onclick="App.toggleMealDone(${slotIdx})">${isChecked ? '↩ Annulla' : '✔ Mangiato'}</button>` : ''}
        </div>
      </div>`;
  },

  toggleIngredients(dayIdx, slotIdx) {
    $(`#meal-${dayIdx}-${slotIdx}`).classList.toggle('open');
  },

  toggleMealDone(slotIdx) {
    const d = Store.data;
    const key = todayStr();
    const arr = d.mealLog[key] || (d.mealLog[key] = []);
    const i = arr.indexOf(slotIdx);
    if (i >= 0) arr.splice(i, 1); else arr.push(slotIdx);
    Store.save();
    this.checkBadges();
    this.renderOggi();
  },

  toggleWorkoutDone() {
    const d = Store.data;
    const key = todayStr();
    if (d.workoutLog[key]) delete d.workoutLog[key];
    else { d.workoutLog[key] = true; toast('Grande! Allenamento completato 💪'); }
    Store.save();
    this.checkBadges();
    this.renderOggi();
  },

  // ---- Acqua ----
  addWater(delta) {
    const d = Store.data, key = todayStr();
    d.waterLog[key] = Math.max(0, (d.waterLog[key] || 0) + delta);
    Store.save();
    this.checkBadges();
    this.renderOggi();
  },

  // ---- Diario ----
  saveNote(text) {
    Store.data.notes[todayStr()] = text;
    Store.save();
    this.checkBadges();
  },

  // ---- Traguardi ----
  _lastWeight(d) {
    return d.weights.slice().sort((a, b) => a.date.localeCompare(b.date)).pop().kg;
  },
  _towardGoal(d) {
    if (!d.weights.length || d.profile.goal === 'mantenere') return 0;
    const start = d.targets.startWeight, cur = this._lastWeight(d);
    const moved = d.profile.goal === 'dimagrire' ? start - cur : cur - start;
    return Math.max(0, moved);
  },
  checkBadges(silent) {
    const d = Store.data;
    if (!d.badges) d.badges = [];
    const earned = ACHIEVEMENTS.filter(a => { try { return a.test(d); } catch (e) { return false; } });
    const newly = earned.filter(a => !d.badges.includes(a.id));
    if (newly.length) {
      newly.forEach(a => d.badges.push(a.id));
      Store.save();
      if (!silent) { const a = newly[newly.length - 1]; toast(`${a.icon} Traguardo sbloccato: ${a.name}!`); }
    }
  },

  emptyState(icon, title, text) {
    return `<div class="empty"><div class="empty-ico">${icon}</div><div class="empty-t">${title}</div><div class="empty-x">${text}</div></div>`;
  },

  swapMeal(dayIdx, slotIdx) {
    const d = Store.data;
    if (Meals.swap(d.mealPlan, dayIdx, slotIdx, d.profile, d.targets)) {
      Store.save();
      toast('Pasto sostituito');
      this.currentView === 'oggi' ? this.renderOggi() : this.renderDieta();
    } else {
      toast('Nessuna alternativa disponibile con le tue preferenze');
    }
  },

  // ---- Preferenze alimentari ----
  dislikeMeal(dayIdx, slotIdx) {
    const d = Store.data;
    const meal = Foods.byId(d.mealPlan.days[dayIdx].slots[slotIdx].id);
    if (!d.excludedMeals.includes(meal.id)) d.excludedMeals.push(meal.id);
    Meals.swap(d.mealPlan, dayIdx, slotIdx, d.profile, d.targets); // sostituisce subito (rispetta le preferenze)
    Store.save();
    toast(`«${meal.name}» non comparirà più`);
    this.currentView === 'oggi' ? this.renderOggi() : this.renderDieta();
  },

  excludeIng(code) {
    const d = Store.data;
    if (!d.excludedIng.includes(code)) d.excludedIng.push(code);
    d.mealPlan = Meals.generateWeek(d.profile, d.targets);
    Store.save();
    toast(`${Foods.ING[code][0]} escluso dal piano`);
    this.renderDieta();
    this.showShoppingList(); // riapre la lista aggiornata
  },

  restoreMeal(id) {
    Store.data.excludedMeals = Store.data.excludedMeals.filter(x => x !== id);
    Store.save();
    this.foodPrefsModal();
  },

  foodPrefsModal() {
    const d = Store.data;
    const CAT = { pro: 'Carne, pesce e proteine', cer: 'Cereali e pane', lat: 'Latticini e uova', fv: 'Frutta e verdura', gra: 'Grassi e frutta secca', alt: 'Dispensa' };
    const byCat = {};
    Object.keys(Foods.ING).forEach(code => {
      const cat = Foods.ING[code][6];
      (byCat[cat] = byCat[cat] || []).push(code);
    });
    const catHtml = Object.keys(CAT).filter(c => byCat[c]).map(c => `
      <h4 style="margin:16px 0 7px">${CAT[c]}</h4>
      <div class="food-chips">
        ${byCat[c].sort((a, b) => Foods.ING[a][0].localeCompare(Foods.ING[b][0])).map(code =>
          `<button class="food-chip ${d.excludedIng.includes(code) ? '' : 'on'}" data-code="${code}" onclick="this.classList.toggle('on')">${Foods.ING[code][0]}</button>`).join('')}
      </div>`).join('');
    const exMeals = d.excludedMeals.map(id => Foods.byId(id)).filter(Boolean);
    const exMealsHtml = exMeals.length ? `
      <h4 style="margin:18px 0 7px">🚫 Piatti che hai escluso</h4>
      <ul class="clean">
        ${exMeals.map(m => `<li><span>${esc(m.name)}</span><button class="icon-btn" onclick="App.restoreMeal('${m.id}')">↩ Ripristina</button></li>`).join('')}
      </ul>` : '';
    showModal(`
      <h3>🍽️ Preferenze alimentari</h3>
      <p class="hint">Scegli gli alimenti che vuoi nel tuo piano: quelli ✓ evidenziati sono attivi. Tocca per accenderli o spegnerli — i pasti useranno gli alimenti che hai scelto, restando bilanciati.</p>
      <div class="row" style="gap:8px;margin-bottom:6px">
        <button class="btn small secondary grow" onclick="document.querySelectorAll('#modal .food-chip').forEach(c=>c.classList.add('on'))">Scegli tutti</button>
        <button class="btn small secondary grow" onclick="document.querySelectorAll('#modal .food-chip').forEach(c=>c.classList.remove('on'))">Azzera</button>
      </div>
      ${catHtml}
      ${exMealsHtml}
      <button class="btn block mt" onclick="App.saveFoodPrefs()">Salva e aggiorna il piano</button>
      <button class="btn secondary block" style="margin-top:8px" onclick="closeModal()">Annulla</button>`);
  },

  saveFoodPrefs() {
    const excluded = [...document.querySelectorAll('#modal .food-chip:not(.on)')].map(b => b.dataset.code);
    const d = Store.data;
    d.excludedIng = excluded;
    d.mealPlan = Meals.generateWeek(d.profile, d.targets);
    Store.save();
    closeModal();
    toast('Preferenze salvate, piano aggiornato 🍽️');
    this.renderDieta();
  },

  /* ---------------- DIETA ---------------- */
  // griglia di 3 barre macro (valore vs obiettivo), riusata da più schermate
  macroGrid(rows) {
    return '<div class="macro3">' + rows.map(([lbl, val, target, col]) => {
      const p = Math.max(0, Math.min(1, target ? val / target : 0));
      return `<div class="m">
        <div class="m-top"><span class="m-dot" style="background:${col}"></span>${lbl}</div>
        <div class="m-val"><b>${Math.round(val)}</b><span class="hint"> / ${target} g</span></div>
        <div class="track"><div class="fill" style="width:${Math.round(p * 100)}%;background:${col}"></div></div>
      </div>`;
    }).join('') + '</div>';
  },

  renderDieta() {
    const d = Store.data;
    const t = d.targets;
    const di = this.dietDay;
    const day = d.mealPlan.days[di];
    const tot = Meals.dayTotals(day);
    const kcalPct = Math.round(Math.max(0, Math.min(1, t.kcal ? tot.kcal / t.kcal : 0)) * 100);

    $('#view-dieta').innerHTML = `
      <div class="day-tabs">
        ${DAYS_SHORT.map((n, i) => `<button class="${i === di ? 'active' : ''} ${i === todayIdx() ? 'today' : ''}"
          onclick="App.dietDay=${i};App.renderDieta()">${n}</button>`).join('')}
      </div>
      <div class="card">
        <div class="row between">
          <h3 class="mb0">${DAYS_FULL[di]}</h3>
          <span class="badge">${tot.kcal} / ${t.kcal} kcal</span>
        </div>
        <div class="macro-bar" style="margin:12px 0 4px"><div class="track"><div class="fill" style="width:${kcalPct}%;background:var(--grad)"></div></div></div>
        ${this.macroGrid([['Proteine', tot.prot, t.protein, 'var(--prot)'], ['Carbo', tot.carb, t.carbs, 'var(--carb)'], ['Grassi', tot.fat, t.fat, 'var(--fat)']])}
      </div>
      <div class="card">
        <h3>🍽️ I pasti</h3>
        ${day.slots.map((s, i) => this.mealHtml(s, i, di, false, false)).join('')}
      </div>
      <button class="btn secondary block mt" onclick="App.foodPrefsModal()">🍽️ Preferenze alimentari${d.excludedIng.length || d.excludedMeals.length ? ` (${d.excludedIng.length + d.excludedMeals.length})` : ''}</button>
      <div class="row mt">
        <button class="btn secondary grow" onclick="App.showShoppingList()">🛒 Lista spesa</button>
        <button class="btn secondary grow" onclick="App.regenerateMeals()">🔄 Rigenera</button>
      </div>
      <p class="hint mt">Le grammature sono a crudo. Verdura e condimenti liberi entro il buonsenso; il piano centra le calorie con uno scarto fisiologico di ±5%. Dalla 🛒 lista spesa puoi togliere un alimento con la ✕.</p>`;
  },

  showShoppingList() {
    const groups = Meals.shoppingList(Store.data.mealPlan);
    const fmt = g => g >= 1000 ? (g / 1000).toFixed(1).replace('.', ',') + ' kg' : g + ' g';
    showModal(`
      <h3>🛒 Lista della spesa settimanale</h3>
      <p class="hint">Quantità per 7 giorni. Tocca la ✕ accanto a un alimento per toglierlo: il piano si aggiorna evitandolo.</p>
      ${Object.entries(groups).map(([cat, items]) => `
        <h4 style="margin:14px 0 4px">${cat}</h4>
        <ul class="clean">${items.map(i => `<li><span>${i.name}</span><span style="white-space:nowrap"><b>${fmt(i.grams)}</b> <button class="icon-btn" onclick="App.excludeIng('${i.code}')" aria-label="Togli ${i.name}">✕</button></span></li>`).join('')}</ul>`).join('')}
      <button class="btn block mt" onclick="closeModal()">Chiudi</button>`);
  },

  regenerateMeals() {
    showModal(`
      <h3>Rigenerare il piano alimentare?</h3>
      <p class="hint">Verrà creata una nuova settimana di pasti con le tue preferenze. Quella attuale andrà persa.</p>
      <div class="row mt">
        <button class="btn secondary grow" onclick="closeModal()">Annulla</button>
        <button class="btn grow" onclick="App.doRegenerateMeals()">Rigenera</button>
      </div>`);
  },

  doRegenerateMeals() {
    const d = Store.data;
    d.mealPlan = Meals.generateWeek(d.profile, d.targets);
    Store.save();
    closeModal();
    toast('Nuova settimana di pasti pronta 🍽️');
    this.renderDieta();
  },

  /* ---------------- ALLENAMENTO ---------------- */
  renderAllenamento() {
    const d = Store.data;
    const wp = d.workoutPlan;
    const trainDaysLbl = wp.trainWeekdays.map(i => DAYS_SHORT[i]).join(', ');
    const eq = d.equipment || Workouts.defaultEquip(wp.location);
    const eqLbl = eq.length ? eq.map(id => (Workouts.EQUIP.find(e => e.id === id) || {}).label).filter(Boolean).join(', ') : 'Solo corpo libero';
    const spaceLbl = ((Workouts.SPACES.find(s => s.id === d.space) || {}).label || 'Medio').toLowerCase();
    const moved = Object.keys(d.workoutSchedule || {}).length > 0;
    const dot = n => `<span class="ex-diff">${'●'.repeat(n)}${'○'.repeat(3 - n)}</span>`;

    const dayCard = (wd, i) => `
      <div class="card workout-day ${i === 0 ? 'open' : ''}" id="wd-${i}">
        <div class="wd-head" onclick="document.getElementById('wd-${i}').classList.toggle('open')">
          <div><h4>${wd.name}</h4><div class="hint">${wd.ex.length} esercizi · ${[...new Set(wd.ex.map(e => e.muscle))].slice(0, 3).join(' · ')}</div></div>
          <span class="muted">▾</span>
        </div>
        <div class="ex-list">
          ${wd.ex.map((ex, j) => {
            const note = d.exNotes[ex.key] || '';
            return `<div class="ex-item">
              <div class="ex-line">
                <div class="grow"><div class="ex-name">${ex.name}</div><div class="ex-muscle">${ex.muscle} · ${dot(ex.diff)}</div></div>
                <div class="ex-scheme">${ex.sets} × ${ex.reps}<div class="ex-rest">rec ${typeof ex.rest === 'number' ? ex.rest + '″' : ex.rest}</div></div>
              </div>
              <div class="ex-actions">
                <button class="icon-btn" onclick="App.swapEx(${i},${j})">🔁 Cambia</button>
                <button class="icon-btn" onclick="App.harderEx(${i},${j})">⬆️ Più difficile</button>
                <button class="icon-btn" onclick="App.videoModal('${ex.key}')">▶️ Video${Workouts.VIDEO[ex.key] ? '' : ' 🔎'}</button>
                <button class="icon-btn" onclick="App.exNoteModal('${ex.key}')">📝 Note${note ? ' •' : ''}</button>
              </div>
              ${note ? `<div class="ex-note">${esc(note)}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;

    $('#view-allenamento').innerHTML = `
      <div class="card">
        <h3>📋 ${wp.split}</h3>
        <p class="hint">${wp.days.length} sedute a settimana · giorni consigliati: <b>${trainDaysLbl}</b><br>🧰 ${eqLbl} · 📐 spazio ${spaceLbl}</p>
        ${this.weekStrip()}
        ${moved ? `<p class="hint mb0 mt">📅 Hai spostato delle sedute. <a href="#" onclick="App.resetSchedule();return false" style="color:var(--brand-soft)">Ripristina i giorni consigliati</a></p>` : ''}
        <button class="btn secondary block mt" onclick="App.equipmentModal()">⚙️ Attrezzatura e spazio</button>
      </div>
      ${wp.days.map(dayCard).join('')}
      <div class="card">
        <h3>🏃 Cardio</h3>
        <ul class="clean">
          ${wp.cardio.sessions.map(c => `<li><span>${c.name}<br><small class="muted">${c.freq}</small></span><b style="white-space:nowrap">${c.dur}</b></li>`).join('')}
        </ul>
        <p class="hint mb0">🚶 Obiettivo quotidiano: ${wp.cardio.steps}.</p>
      </div>
      <div class="card">
        <h3>📌 Linee guida</h3>
        <ul class="bullets">${wp.notes.map(n => `<li>${n}</li>`).join('')}</ul>
      </div>`;
  },

  swapEx(dayI, exI) {
    const d = Store.data, wp = d.workoutPlan;
    const ex = wp.days[dayI].ex[exI];
    const equip = d.equipment || Workouts.defaultEquip(wp.location);
    const alts = Workouts.alternatives(ex.key, equip, Workouts.spaceValue(d.space), [ex.key]);
    if (!alts.length) { toast('Nessuna alternativa coi tuoi attrezzi e spazio'); return; }
    const next = alts[Math.floor(Math.random() * alts.length)];
    wp.days[dayI].ex[exI] = Workouts.exObj(next, ex.sets, ex.reps, ex.rest);
    Store.save();
    toast('Esercizio cambiato 🔁');
    this.renderAllenamento();
  },

  harderEx(dayI, exI) {
    const d = Store.data, wp = d.workoutPlan;
    const ex = wp.days[dayI].ex[exI];
    const equip = d.equipment || Workouts.defaultEquip(wp.location);
    const h = Workouts.harder(ex.key, equip, Workouts.spaceValue(d.space));
    if (!h) { toast('È già la variante più impegnativa coi tuoi attrezzi 💪'); return; }
    wp.days[dayI].ex[exI] = Workouts.exObj(h, ex.sets, ex.reps, ex.rest);
    Store.save();
    toast('Variante più difficile ⬆️');
    this.renderAllenamento();
  },

  videoModal(key) {
    const ex = Workouts.EX[key];
    const vid = Workouts.VIDEO[key];
    if (vid) {
      showModal(`
        <h3>▶️ ${ex.n}</h3>
        <div class="video-wrap">
          <iframe src="https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1" title="${esc(ex.n)}"
                  frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>
        </div>
        <p class="hint mt mb0">Video dimostrativo. Se non parte, <a href="https://www.youtube.com/watch?v=${vid}" target="_blank" rel="noopener" style="color:var(--brand-soft)">aprilo su YouTube</a>.</p>
        <button class="btn block mt" onclick="closeModal()">Chiudi</button>`);
    } else {
      showModal(`
        <h3>▶️ ${ex.n}</h3>
        <p class="hint">Per questo esercizio non ho ancora un video curato: apro una ricerca mirata su YouTube con i tutorial più affidabili.</p>
        <a class="btn block" href="${Workouts.searchUrl(ex.n)}" target="_blank" rel="noopener">🔎 Cerca il tutorial su YouTube</a>
        <button class="btn secondary block" style="margin-top:8px" onclick="closeModal()">Chiudi</button>`);
    }
  },

  exNoteModal(key) {
    const cur = Store.data.exNotes[key] || '';
    showModal(`
      <h3>📝 Note · ${Workouts.EX[key].n}</h3>
      <textarea class="note-area" id="exnote" placeholder="Carico usato, sensazioni, promemoria di tecnica…">${esc(cur)}</textarea>
      <div class="row mt">
        <button class="btn secondary grow" onclick="closeModal()">Annulla</button>
        <button class="btn grow" onclick="App.saveExNote('${key}')">Salva</button>
      </div>`);
  },

  saveExNote(key) {
    const v = document.getElementById('exnote').value.trim();
    if (v) Store.data.exNotes[key] = v; else delete Store.data.exNotes[key];
    Store.save();
    closeModal();
    toast('Nota salvata 📝');
    this.renderAllenamento();
  },

  equipmentModal() {
    const d = Store.data;
    const eq = d.equipment || Workouts.defaultEquip(d.workoutPlan.location);
    showModal(`
      <h3>⚙️ Attrezzatura e spazio</h3>
      <p class="hint">Scegli cosa hai davvero: scheda e alternative useranno solo questo. Il corpo libero è sempre incluso.</p>
      <div class="choices grid2" id="eq-pick">
        ${Workouts.EQUIP.map(e => `<button class="choice ${eq.includes(e.id) ? 'selected' : ''}" data-v="${e.id}" onclick="this.classList.toggle('selected')">${e.icon} ${e.label}</button>`).join('')}
      </div>
      <p class="lbl" style="font-weight:600;font-size:.85rem;margin:16px 0 6px">Spazio a disposizione</p>
      <div class="choices" id="sp-pick">
        ${Workouts.SPACES.map(s => `<button class="choice grow center ${d.space === s.id ? 'selected' : ''}" data-v="${s.id}" onclick="this.parentElement.querySelectorAll('.choice').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">${s.label}<small>${s.desc}</small></button>`).join('')}
      </div>
      <button class="btn block mt" onclick="App.saveEquipment()">Salva e aggiorna la scheda</button>
      <button class="btn secondary block" style="margin-top:8px" onclick="closeModal()">Annulla</button>`);
  },

  saveEquipment() {
    const equip = [...document.querySelectorAll('#eq-pick .choice.selected')].map(b => b.dataset.v);
    const spBtn = document.querySelector('#sp-pick .choice.selected');
    const d = Store.data;
    d.equipment = equip;
    d.space = spBtn ? spBtn.dataset.v : 'medio';
    d.workoutPlan = Workouts.generate(d.profile, equip, d.space);
    Store.save();
    closeModal();
    toast('Scheda adattata ai tuoi attrezzi 💪');
    this.renderAllenamento();
  },

  /* ---------------- PROGRESSI ---------------- */
  renderProgressi() {
    const d = Store.data;
    const p = d.profile;
    const t = d.targets;
    const ws = d.weights.slice().sort((a, b) => a.date.localeCompare(b.date));
    const last = ws[ws.length - 1];
    const first = ws[0];
    const goalObj = Engine.GOALS.find(g => g.id === p.goal);

    // riepilogo obiettivo: avvicinamento al peso target
    let goalHtml = '';
    if (last) {
      if (p.goal === 'mantenere') {
        goalHtml = `
          <div class="card goal-hero">
            <div class="hello">${goalObj.label}</div>
            <div class="goal-now"><span class="gw">${last.kg.toFixed(1)}</span><span class="gu">kg oggi</span></div>
            <div class="goal-msg">Obiettivo: restare intorno ai <b>${p.weight} kg</b> migliorando la composizione corporea.</div>
          </div>`;
      } else {
        const start = t.startWeight, target = p.targetWeight, cur = last.kg;
        const total = Math.abs(target - start) || 1;
        const frac = Math.max(0, Math.min(1, Math.abs(cur - start) / total));
        const remainingKg = Math.abs(target - cur);
        goalHtml = `
          <div class="card goal-hero">
            <div class="row between"><div class="hello">${goalObj.label}</div><span class="badge">${Math.round(frac * 100)}%</span></div>
            <div class="goal-now"><span class="gw">${cur.toFixed(1)}</span><span class="gu">kg oggi</span></div>
            <div class="goalbar">
              <div class="g-track"><div class="g-fill" style="width:${(frac * 100).toFixed(0)}%"></div><div class="g-knob" style="left:${(frac * 100).toFixed(0)}%"></div></div>
              <div class="g-ends"><span>${start.toFixed(1)} kg</span><span>🎯 ${target.toFixed(1)} kg</span></div>
            </div>
            <div class="goal-msg">${remainingKg < 0.1 ? 'Obiettivo raggiunto! 🎉' : `Ti mancano <b>${remainingKg.toFixed(1)} kg</b> all'obiettivo.`}</div>
          </div>`;
      }
    }

    let statsHtml = '';
    if (last) {
      const diff = last.kg - first.kg;
      const expected = Engine.expectedWeight(t, p, todayStr());
      const drift = last.kg - expected;
      const weeks = Math.max(1, (new Date(last.date) - new Date(first.date)) / (7 * 86400000));
      statsHtml = `
        <div class="stat-grid">
          <div class="stat"><div class="v">${last.kg.toFixed(1)}</div><div class="l">peso attuale (kg)</div></div>
          <div class="stat"><div class="v">${(diff > 0 ? '+' : '') + diff.toFixed(1)}</div><div class="l">kg da inizio piano</div></div>
          <div class="stat"><div class="v">${(diff / weeks).toFixed(2)}</div><div class="l">kg/settimana (media)</div></div>
          <div class="stat"><div class="v ${Math.abs(drift) < 1 ? 'tag-ok' : ''}">${(drift > 0 ? '+' : '') + drift.toFixed(1)}</div><div class="l">kg rispetto al piano</div></div>
        </div>`;
    }

    // aderenza allenamenti ultime 4 settimane
    const since = Date.now() - 28 * 86400000;
    const doneCount = Object.keys(d.workoutLog).filter(k => new Date(k) >= since).length;
    const planned = p.trainDays * 4;
    const adh = Math.min(100, Math.round((doneCount / planned) * 100));

    $('#view-progressi').innerHTML = `
      ${goalHtml}
      <div class="card">
        <h3>⚖️ Registra il peso di oggi</h3>
        <div class="row">
          <input type="number" id="w-input" class="grow" step="0.1" min="35" max="250"
                 placeholder="${last ? last.kg.toFixed(1) : '70.0'}" value="">
          <button class="btn" onclick="App.addWeight()">Salva</button>
        </div>
        <p class="hint mb0">Consiglio: pesati al mattino a digiuno, 2-3 volte a settimana.</p>
      </div>
      <div class="card">
        <h3>📈 Andamento del peso</h3>
        ${weightChart(ws, p, t)}
        ${statsHtml}
      </div>
      <div class="card">
        <h3>💪 Costanza in palestra (ultime 4 settimane)</h3>
        <div class="row between"><span class="hint">${doneCount} allenamenti su ${planned} previsti</span><b>${adh}%</b></div>
        <div class="macro-bar"><div class="track"><div class="fill" style="width:${adh}%;background:var(--grad)"></div></div></div>
      </div>
      <div class="card">
        <h3>🗒️ Storico pesate</h3>
        ${ws.length > 1 ? `<ul class="clean">
          ${ws.slice(-10).reverse().map(w => `
            <li><span>${fmtDate(w.date)}</span>
                <span><b>${w.kg.toFixed(1)} kg</b>
                <button class="icon-btn" onclick="App.deleteWeight('${w.date}')">🗑</button></span></li>`).join('')}
        </ul>` : this.emptyState('📭', 'Ancora pochi dati', 'Registra il tuo peso 2-3 volte a settimana: qui comparirà lo storico e nel grafico vedrai l\'andamento.')}
      </div>
      <button class="btn secondary block" onclick="App.confirmRecalc()">♻️ Ricalcola il piano col peso attuale</button>
      <p class="hint mt">Ricalcola quando il peso cambia di 2-3 kg o ogni 4-6 settimane: calorie e macro si adattano ai tuoi progressi.</p>`;
  },

  addWeight() {
    const v = parseFloat($('#w-input').value.replace(',', '.'));
    if (!(v >= 35 && v <= 250)) { toast('Inserisci un peso valido'); return; }
    const d = Store.data;
    const key = todayStr();
    const existing = d.weights.find(w => w.date === key);
    if (existing) existing.kg = v; else d.weights.push({ date: key, kg: v });
    Store.save();
    this.checkBadges();
    toast('Peso registrato ⚖️');
    this.renderProgressi();
  },

  deleteWeight(date) {
    const d = Store.data;
    d.weights = d.weights.filter(w => w.date !== date);
    Store.save();
    this.renderProgressi();
  },

  confirmRecalc() {
    const d = Store.data;
    const last = d.weights.slice().sort((a, b) => a.date.localeCompare(b.date)).pop();
    if (!last) { toast('Registra prima il tuo peso'); return; }
    showModal(`
      <h3>♻️ Ricalcolare il piano?</h3>
      <p class="hint">Calorie, macro e piano alimentare verranno ricalcolati partendo dal tuo peso attuale (${last.kg.toFixed(1)} kg) verso l'obiettivo di ${d.profile.targetWeight} kg.</p>
      <div class="row mt">
        <button class="btn secondary grow" onclick="closeModal()">Annulla</button>
        <button class="btn grow" onclick="App.doRecalc()">Ricalcola</button>
      </div>`);
  },

  doRecalc() {
    const d = Store.data;
    const last = d.weights.slice().sort((a, b) => a.date.localeCompare(b.date)).pop();
    d.profile.weight = last.kg;
    d.targets = Engine.plan(d.profile);
    d.mealPlan = Meals.generateWeek(d.profile, d.targets);
    Store.save();
    closeModal();
    if (d.targets.warnings.length) showModal(`
      <h3>Piano aggiornato</h3>
      ${d.targets.warnings.map(w => `<div class="warn">⚠️ ${w}</div>`).join('')}
      <button class="btn block mt" onclick="closeModal()">Ok</button>`);
    else toast('Piano ricalcolato ✨');
    this.renderProgressi();
  },

  /* ---------------- PROFILO ---------------- */
  renderProfilo() {
    const d = Store.data;
    const p = d.profile;
    const t = d.targets;
    const act = Engine.ACTIVITY.find(a => a.id === p.activity);
    const goal = Engine.GOALS.find(g => g.id === p.goal);
    const exLbl = { lattosio: 'senza lattosio', glutine: 'senza glutine', pesce: 'niente pesce', frutta_secca: 'niente frutta secca' };
    const initials = (p.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('') || '🙂').toUpperCase();
    const badges = ACHIEVEMENTS.map(a => ({ ...a, earned: (() => { try { return !!a.test(d); } catch (e) { return false; } })() }));
    const earnedCount = badges.filter(b => b.earned).length;

    const curTheme = d.theme || 'teal';
    $('#view-profilo').innerHTML = `
      <div class="card">
        <h3>🎨 Aspetto</h3>
        <p class="hint">Tocca un tema per provarlo subito su tutta l'app.</p>
        <div class="theme-grid">
          ${THEMES.map(t => `
            <button class="theme-opt ${t.id === curTheme ? 'selected' : ''}" onclick="App.setTheme('${t.id}')">
              <div class="sw" style="background:${t.sw}"></div>
              <div class="nm">${t.name}</div>
            </button>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="prof-head">
          <div class="avatar">${initials}</div>
          <div class="grow">
            <div class="prof-name">${esc(p.name)}</div>
            <div class="hint">${goal.label}${p.goal !== 'mantenere' ? ` · 🎯 ${p.targetWeight} kg` : ''}</div>
          </div>
        </div>
        <ul class="clean">
          <li><span>Età · Altezza · Peso</span><b>${p.age} anni · ${p.height} cm · ${p.weight} kg</b></li>
          <li><span>Obiettivo</span><b>${goal.label}${p.goal !== 'mantenere' ? ` → ${p.targetWeight} kg entro ${fmtDate(p.targetDate)}` : ''}</b></li>
          <li><span>Attività quotidiana</span><b>${act.label}</b></li>
          <li><span>Allenamento</span><b>${p.trainDays} giorni/sett. · ${p.location} · ${p.level}</b></li>
          <li><span>Dieta</span><b>${p.diet}, ${p.mealsPerDay} pasti${p.exclusions.length ? ' · ' + p.exclusions.map(e => exLbl[e]).join(', ') : ''}</b></li>
        </ul>
        <button class="btn secondary block mt" onclick="App.editProfile()">✏️ Modifica profilo e obiettivo</button>
      </div>
      <div class="card">
        <h3>🧮 I tuoi numeri</h3>
        <ul class="clean">
          <li><span>Metabolismo basale (BMR)</span><b>${t.bmr} kcal</b></li>
          <li><span>Fabbisogno di mantenimento (TDEE)</span><b>${t.tdee} kcal</b></li>
          <li><span>Calorie del piano</span><b>${t.kcal} kcal</b></li>
          <li><span>Macro giornaliere</span><b>P ${t.protein} · C ${t.carbs} · G ${t.fat} g</b></li>
          <li><span>Acqua consigliata</span><b>${t.water} L</b></li>
        </ul>
        <p class="hint mb0">Metodo: formula di Mifflin-St Jeor per il metabolismo basale, fattore di attività + dispendio per seduta di allenamento, ritmo limitato a livelli sicuri (max 1% del peso a settimana in perdita, +0,35 kg in massa).</p>
      </div>
      <div class="card">
        <div class="row between"><h3 class="mb0">🏆 Traguardi</h3><span class="badge">${earnedCount}/${badges.length}</span></div>
        <div class="badge-grid mt">
          ${badges.map(b => `<div class="bdg ${b.earned ? 'on' : ''}"><div class="bdg-ico">${b.icon}</div><div class="bdg-nm">${b.name}</div></div>`).join('')}
        </div>
        <p class="hint mb0 mt">${earnedCount < badges.length ? 'Continua così per sbloccarli tutti!' : 'Li hai sbloccati tutti — campione! 🏆'}</p>
      </div>
      <div class="card">
        <h3>💾 I tuoi dati</h3>
        <p class="hint">I dati sono salvati solo su questo dispositivo. Fai un backup per non perderli o per spostarli.</p>
        <div class="row">
          <button class="btn secondary grow" onclick="App.exportBackup()">⬇️ Esporta backup</button>
          <button class="btn secondary grow" onclick="App.importBackup()">⬆️ Importa backup</button>
        </div>
        <hr class="divider">
        <button class="btn danger block" onclick="App.confirmReset()">🗑 Azzera tutti i dati</button>
      </div>
      <p class="hint center">InForma v1.3 — funziona completamente offline.<br>Questa app fornisce indicazioni generali e non sostituisce il parere di medici o nutrizionisti.</p>`;
  },

  editProfile() {
    Onboarding.start(Store.data.profile);
  },

  exportBackup() {
    const blob = new Blob([Store.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `informa-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup scaricato 💾');
  },

  importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          Store.importJson(reader.result);
          toast('Backup importato ✔');
          init();
        } catch (e) {
          toast('File non valido: ' + e.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  confirmReset() {
    showModal(`
      <h3>⚠️ Azzerare tutto?</h3>
      <p class="hint">Profilo, piani e storico verranno eliminati definitivamente da questo dispositivo. L'operazione non si può annullare.</p>
      <div class="row mt">
        <button class="btn secondary grow" onclick="closeModal()">Annulla</button>
        <button class="btn danger grow" onclick="Store.reset();closeModal();init()">Elimina tutto</button>
      </div>`);
  }
};

/* =====================================================================
   AVVIO
   ===================================================================== */
function init() {
  const data = Store.load();
  if (data.profile && data.targets && data.mealPlan && data.workoutPlan) {
    App.enter();
  } else {
    Onboarding.start();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('#ob-next').addEventListener('click', () => { if (!$('#ob-next').onclick) Onboarding.next(); });
  $('#ob-back').addEventListener('click', () => Onboarding.back());
  document.querySelectorAll('nav.tabbar button').forEach(b =>
    b.addEventListener('click', () => App.show(b.dataset.view)));
  $('#modal-overlay').addEventListener('click', e => { if (e.target.id === 'modal-overlay') closeModal(); });

  // Service worker solo quando l'app è servita via http(s)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    // Auto-aggiornamento: quando arriva una versione nuova, ricarica una volta sola
    let _refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (_refreshing) return;
      _refreshing = true;
      location.reload();
    });
  }

  init();

  // Nasconde la schermata d'avvio dopo un breve momento (resta visibile
  // quanto basta a non farla "sfarfallare", poi sfuma).
  const splash = $('#splash');
  if (splash) {
    setTimeout(() => {
      splash.classList.add('hide');
      splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    }, 1100);
  }
});
