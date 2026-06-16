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
  $('#modal').innerHTML = html;
  $('#modal-overlay').classList.add('active');
}
function closeModal() { $('#modal-overlay').classList.remove('active'); }

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
    $('#ob-step').innerHTML = steps[this.step].render();
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
  { id: 'agrumi',   name: 'Agrumi',     sw: 'linear-gradient(135deg,#fffaf2 0%,#ff8a3d 55%,#f2542d 100%)' },
  { id: 'teal',     name: 'Teal notte', sw: 'linear-gradient(135deg,#2dd4bf,#34d399)' },
  { id: 'neon',     name: 'Neon',       sw: 'linear-gradient(135deg,#a3e635,#22d3ee)' },
  { id: 'energico', name: 'Energico',   sw: 'linear-gradient(135deg,#ff6b3d,#ff9f1c)' },
  { id: 'aurora',   name: 'Aurora',     sw: 'linear-gradient(160deg,#4f46e5,#7c3aed,#c026d3,#f97316)' },
  { id: 'carta',    name: 'Carta',      sw: 'linear-gradient(135deg,#f6f2e9,#1f7a53)' }
];

const App = {
  currentView: 'oggi',
  dietDay: todayIdx(),

  applyTheme(id) {
    document.documentElement.setAttribute('data-theme', id || 'agrumi');
  },

  setTheme(id) {
    Store.data.theme = id;
    Store.save();
    this.applyTheme(id);
    this.renderProfilo();
    toast('Tema applicato ✨');
  },

  enter() {
    this.applyTheme(Store.data.theme);
    $('#onboarding').classList.remove('active');
    $('#app').classList.add('active');
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

    const protK = t.protein * 4, carbK = t.carbs * 4, fatK = t.fat * 9;
    const tot = protK + carbK + fatK;
    const donut = (() => {
      const r = 42, c = 2 * Math.PI * r;
      const segs = [[protK, 'var(--prot)'], [carbK, 'var(--carb)'], [fatK, 'var(--fat)']];
      let off = 0, out = '';
      segs.forEach(([v, col]) => {
        const len = (v / tot) * c;
        out += `<circle r="${r}" cx="55" cy="55" fill="none" stroke="${col}" stroke-width="13"
                stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}" transform="rotate(-90 55 55)"/>`;
        off += len;
      });
      return `<svg width="110" height="110" viewBox="0 0 110 110">${out}
        <text x="55" y="51" text-anchor="middle" font-size="20" font-weight="700" fill="var(--text)">${t.kcal}</text>
        <text x="55" y="68" text-anchor="middle" font-size="10" fill="var(--muted)">kcal/giorno</text></svg>`;
    })();

    const macro = (lbl, v, kcal, col) => `
      <div class="macro-bar">
        <div class="row between"><span>${lbl}</span><b>${v} g</b></div>
        <div class="track"><div class="fill" style="width:${Math.round((kcal / tot) * 100)}%;background:${col}"></div></div>
      </div>`;

    // allenamento di oggi
    const wp = d.workoutPlan;
    const ti = todayIdx();
    const pos = wp.trainWeekdays.indexOf(ti);
    const done = !!d.workoutLog[todayStr()];
    let workoutCard;
    if (pos >= 0) {
      const wd = wp.days[pos % wp.days.length];
      workoutCard = `
        <div class="card">
          <h3>🏋️ Allenamento di oggi</h3>
          <div class="row between">
            <div><b>${wd.name}</b><div class="hint">${wd.ex.length} esercizi · ${wp.split}</div></div>
            <span class="badge">${done ? '✔ Fatto' : 'In programma'}</span>
          </div>
          <div class="row mt">
            <button class="btn small secondary grow" onclick="App.show('allenamento')">Vedi scheda</button>
            <button class="btn small grow" onclick="App.toggleWorkoutDone()">${done ? 'Annulla ✔' : 'Segna come fatto ✔'}</button>
          </div>
        </div>`;
    } else {
      const c = wp.cardio.sessions[0];
      workoutCard = `
        <div class="card">
          <h3>🧘 Oggi riposo</h3>
          <p class="hint mb0">Recupero attivo consigliato: ${c.name.toLowerCase()}, ${c.dur}. E punta a ${wp.cardio.steps}.</p>
        </div>`;
    }

    $('#view-oggi').innerHTML = `
      <div class="card">
        <h3>Ciao ${esc(d.profile.name)} 👋</h3>
        <div class="ring-wrap">
          ${donut}
          <div class="grow">
            ${macro('Proteine', t.protein, protK, 'var(--prot)')}
            ${macro('Carboidrati', t.carbs, carbK, 'var(--carb)')}
            ${macro('Grassi', t.fat, fatK, 'var(--fat)')}
          </div>
        </div>
      </div>
      ${workoutCard}
      <div class="card">
        <h3>🍽️ I pasti di oggi</h3>
        ${day.slots.map((s, i) => this.mealHtml(s, i, todayIdx(), checked.includes(i), true)).join('')}
        <p class="hint mb0">💧 Bevi circa <b>${t.water} L</b> di acqua oggi.</p>
      </div>`;
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
    this.renderOggi();
  },

  toggleWorkoutDone() {
    const d = Store.data;
    const key = todayStr();
    if (d.workoutLog[key]) delete d.workoutLog[key];
    else { d.workoutLog[key] = true; toast('Grande! Allenamento completato 💪'); }
    Store.save();
    this.renderOggi();
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

  /* ---------------- DIETA ---------------- */
  renderDieta() {
    const d = Store.data;
    const t = d.targets;
    const di = this.dietDay;
    const day = d.mealPlan.days[di];
    const tot = Meals.dayTotals(day);

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
        <p class="hint">P ${tot.prot} g · C ${tot.carb} g · G ${tot.fat} g — obiettivo: P ${t.protein} · C ${t.carbs} · G ${t.fat}</p>
        ${day.slots.map((s, i) => this.mealHtml(s, i, di, false, false)).join('')}
      </div>
      <div class="row">
        <button class="btn secondary grow" onclick="App.showShoppingList()">🛒 Lista della spesa</button>
        <button class="btn secondary grow" onclick="App.regenerateMeals()">🔄 Rigenera settimana</button>
      </div>
      <p class="hint mt">Le grammature si riferiscono al peso a crudo. Verdura e condimenti sono liberi entro il buonsenso; il piano centra le calorie con uno scarto fisiologico di ±5%.</p>`;
  },

  showShoppingList() {
    const groups = Meals.shoppingList(Store.data.mealPlan);
    const fmt = g => g >= 1000 ? (g / 1000).toFixed(1).replace('.', ',') + ' kg' : g + ' g';
    showModal(`
      <h3>🛒 Lista della spesa settimanale</h3>
      <p class="hint">Quantità totali per seguire il piano per 7 giorni.</p>
      ${Object.entries(groups).map(([cat, items]) => `
        <h4 style="margin:14px 0 4px">${cat}</h4>
        <ul class="clean">${items.map(i => `<li><span>${i.name}</span><b>${fmt(i.grams)}</b></li>`).join('')}</ul>`).join('')}
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
    const loc = wp.location;
    const trainDaysLbl = wp.trainWeekdays.map(i => DAYS_SHORT[i]).join(', ');

    const dayCard = (wd, i) => `
      <div class="card workout-day ${i === 0 ? 'open' : ''}" id="wd-${i}">
        <div class="wd-head" onclick="document.getElementById('wd-${i}').classList.toggle('open')">
          <h4>${wd.name}</h4><span class="muted">▾</span>
        </div>
        <table class="ex-table">
          ${wd.ex.map(ex => `
            <tr>
              <td>
                <div class="ex-name">${loc === 'casa' ? ex.home : ex.gym}</div>
                <div class="ex-muscle">${ex.muscle}</div>
                ${loc === 'misto' ? `<div class="ex-home">🏠 A casa: ${ex.home}</div>` : ''}
              </td>
              <td class="ex-scheme">${ex.sets} × ${ex.reps}<div class="ex-rest">rec. ${typeof ex.rest === 'number' ? ex.rest + '″' : ex.rest}</div></td>
            </tr>`).join('')}
        </table>
      </div>`;

    $('#view-allenamento').innerHTML = `
      <div class="card">
        <h3>📋 La tua scheda: ${wp.split}</h3>
        <p class="hint mb0">${wp.days.length} sedute a settimana — giorni consigliati: <b>${trainDaysLbl}</b>.
        ${loc === 'casa' ? 'Versione a corpo libero / casa.' : loc === 'misto' ? 'Versione palestra con alternative per casa.' : ''}</p>
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

  /* ---------------- PROGRESSI ---------------- */
  renderProgressi() {
    const d = Store.data;
    const p = d.profile;
    const t = d.targets;
    const ws = d.weights.slice().sort((a, b) => a.date.localeCompare(b.date));
    const last = ws[ws.length - 1];
    const first = ws[0];

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
        <div class="macro-bar"><div class="track"><div class="fill" style="width:${adh}%;background:var(--brand)"></div></div></div>
      </div>
      ${ws.length ? `
      <div class="card">
        <h3>🗒️ Storico pesate</h3>
        <ul class="clean">
          ${ws.slice(-10).reverse().map(w => `
            <li><span>${fmtDate(w.date)}</span>
                <span><b>${w.kg.toFixed(1)} kg</b>
                <button class="icon-btn" onclick="App.deleteWeight('${w.date}')">🗑</button></span></li>`).join('')}
        </ul>
      </div>` : ''}
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
        <h3>👤 ${esc(p.name)}</h3>
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
        <h3>💾 I tuoi dati</h3>
        <p class="hint">I dati sono salvati solo su questo dispositivo. Fai un backup per non perderli o per spostarli.</p>
        <div class="row">
          <button class="btn secondary grow" onclick="App.exportBackup()">⬇️ Esporta backup</button>
          <button class="btn secondary grow" onclick="App.importBackup()">⬆️ Importa backup</button>
        </div>
        <hr class="divider">
        <button class="btn danger block" onclick="App.confirmReset()">🗑 Azzera tutti i dati</button>
      </div>
      <p class="hint center">InForma v1.0 — funziona completamente offline.<br>Questa app fornisce indicazioni generali e non sostituisce il parere di medici o nutrizionisti.</p>`;
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
