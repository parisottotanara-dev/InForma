/* =====================================================================
   InForma — foods.js
   Database alimentare italiano.

   ING: ingredienti con valori per 100 g
        [nome, kcal, proteine, carboidrati, grassi, flags, categoria]
        flags: meat | fish | lact | glut | nuts | egg | honey
        categoria: cer (cereali/pane) | pro (carne/pesce/proteine)
                   lat (latticini/uova) | fv (frutta/verdura)
                   gra (grassi/frutta secca) | alt (altro)

   MEALS: piatti composti da ingredienti con grammature base.
          slot: colazione | pranzo | cena | spuntino
          I tag dietetici (vegetariano/vegano/senza lattosio/ecc.)
          vengono DERIVATI automaticamente dagli ingredienti.
   ===================================================================== */
'use strict';

const ING = {
  avena:        ['Fiocchi di avena',          379, 13,   67,   7,   '',          'cer'],
  latte_ps:     ['Latte parz. scremato',       46,  3.3,  5,   1.6, 'lact',      'lat'],
  latte_soia:   ['Latte di soia',              39,  3,    2.5, 1.8, '',          'lat'],
  yog_greco:    ['Yogurt greco 0%',            59, 10,    3.6, 0.4, 'lact',      'lat'],
  yog_soia:     ['Yogurt di soia',             50,  4,    2.5, 2.3, '',          'lat'],
  uova:         ['Uova',                      143, 12.5,  0.7, 9.5, 'egg',       'lat'],
  albume:       ['Albume d\'uovo',             52, 10.9,  0.7, 0.2, 'egg',       'lat'],
  whey:         ['Proteine in polvere (whey)',380, 78,    6,   5,   'lact',      'pro'],
  pane_int:     ['Pane integrale',            247, 13,   41,   3.5, 'glut',      'cer'],
  pane:         ['Pane comune',               265,  9,   49,   3.2, 'glut',      'cer'],
  fette_bisc:   ['Fette biscottate integrali',380, 13,   72,   5,   'glut',      'cer'],
  gallette:     ['Gallette di riso',          387,  8,   82,   2.8, '',          'cer'],
  crackers_int: ['Crackers integrali',        420, 10,   68,  11,   'glut',      'cer'],
  marmellata:   ['Marmellata',                165,  0.5, 40,   0.1, '',          'alt'],
  miele:        ['Miele',                     304,  0.3, 82,   0,   'honey',     'alt'],
  banana:       ['Banana',                     89,  1.1, 23,   0.3, '',          'fv'],
  mela:         ['Mela',                       52,  0.3, 14,   0.2, '',          'fv'],
  frutti_bosco: ['Frutti di bosco',            40,  0.7,  9,   0.3, '',          'fv'],
  frutta_stag:  ['Frutta di stagione',         55,  0.6, 13,   0.2, '',          'fv'],
  pasta:        ['Pasta di semola',           353, 12,   71,   1.5, 'glut',      'cer'],
  pasta_int:    ['Pasta integrale',           350, 13,   67,   2.5, 'glut',      'cer'],
  riso:         ['Riso',                      358,  7,   79,   0.6, '',          'cer'],
  quinoa:       ['Quinoa',                    368, 14,   64,   6,   '',          'cer'],
  couscous:     ['Couscous',                  376, 13,   77,   0.6, 'glut',      'cer'],
  patate:       ['Patate',                     77,  2,   17,   0.1, '',          'fv'],
  piadina:      ['Piadina',                   320,  8,   53,   8,   'glut',      'cer'],
  pollo:        ['Petto di pollo',            110, 23,    0,   1.2, 'meat',      'pro'],
  tacchino:     ['Fesa di tacchino',          105, 22,    0,   1,   'meat',      'pro'],
  manzo:        ['Manzo magro',               150, 21,    0,   7,   'meat',      'pro'],
  bresaola:     ['Bresaola',                  151, 32,    0,   2.6, 'meat',      'pro'],
  tonno:        ['Tonno al naturale',         103, 24,    0,   1,   'fish',      'pro'],
  salmone:      ['Salmone',                   185, 20,    0,  12,   'fish',      'pro'],
  merluzzo:     ['Merluzzo',                   82, 18,    0,   0.7, 'fish',      'pro'],
  gamberi:      ['Gamberi',                    85, 18,    0,   1,   'fish',      'pro'],
  tofu:         ['Tofu',                      120, 12,    2,   7,   '',          'pro'],
  tempeh:       ['Tempeh',                    193, 19,    9,  11,   '',          'pro'],
  ceci:         ['Ceci cotti',                120,  7,   21,   2.5, '',          'pro'],
  lenticchie:   ['Lenticchie cotte',           92,  7,   16,   0.4, '',          'pro'],
  fagioli:      ['Fagioli cotti',              91,  7,   16,   0.5, '',          'pro'],
  hummus:       ['Hummus',                    166,  8,   14,  10,   '',          'pro'],
  parmigiano:   ['Parmigiano Reggiano',       392, 33,    0,  29,   'lact',      'lat'],
  feta:         ['Feta',                      264, 14,    4,  21,   'lact',      'lat'],
  ricotta:      ['Ricotta',                   146,  9,    4,  11,   'lact',      'lat'],
  olio:         ['Olio extravergine di oliva',884,  0,    0, 100,   '',          'gra'],
  burro_arach:  ['Burro di arachidi',         588, 25,   20,  50,   'nuts',      'gra'],
  mandorle:     ['Mandorle',                  603, 22,    9,  54,   'nuts',      'gra'],
  noci:         ['Noci',                      654, 15,   14,  65,   'nuts',      'gra'],
  ciocc_fond:   ['Cioccolato fondente 85%',   546,  7.8, 46,  31,   '',          'alt'],
  verdure:      ['Verdure miste',              30,  2,    5,   0.4, '',          'fv'],
  insalata:     ['Insalata',                   17,  1.2,  3,   0.2, '',          'fv'],
  broccoli:     ['Broccoli',                   34,  2.8,  7,   0.4, '',          'fv'],
  zucchine:     ['Zucchine',                   17,  1.2,  3.1, 0.3, '',          'fv'],
  pomodoro:     ['Pomodori',                   18,  0.9,  3.9, 0.2, '',          'fv'],
  rucola:       ['Rucola',                     25,  2.6,  3.7, 0.7, '',          'fv'],
  avocado:      ['Avocado',                   160,  2,    9,  15,   '',          'fv'],
  passata:      ['Passata di pomodoro',        35,  1.6,  7,   0.2, '',          'alt']
};

const MEALS = [
  /* ---------------- COLAZIONI (base ~350-450 kcal) ---------------- */
  { id: 'c01', slot: 'colazione', name: 'Porridge con banana e miele',
    ing: [['avena', 60], ['latte_ps', 200], ['banana', 100], ['miele', 10]] },
  { id: 'c02', slot: 'colazione', name: 'Yogurt greco con avena e frutti di bosco',
    ing: [['yog_greco', 250], ['avena', 50], ['frutti_bosco', 100], ['miele', 10]] },
  { id: 'c03', slot: 'colazione', name: 'Pancake di avena e albumi',
    ing: [['avena', 60], ['albume', 150], ['banana', 80], ['miele', 10]] },
  { id: 'c04', slot: 'colazione', name: 'Toast integrale con uova e avocado',
    ing: [['pane_int', 80], ['uova', 110], ['avocado', 50]] },
  { id: 'c05', slot: 'colazione', name: 'Fette biscottate con marmellata e latte',
    ing: [['fette_bisc', 60], ['marmellata', 40], ['latte_ps', 250]] },
  { id: 'c06', slot: 'colazione', name: 'Smoothie proteico con banana e arachidi',
    ing: [['whey', 30], ['latte_ps', 250], ['banana', 100], ['burro_arach', 15]] },
  { id: 'c07', slot: 'colazione', name: 'Pane con ricotta, miele e noci',
    ing: [['pane_int', 70], ['ricotta', 100], ['miele', 15], ['noci', 15]] },
  { id: 'c08', slot: 'colazione', name: 'Overnight oats con mela e mandorle',
    ing: [['avena', 60], ['latte_soia', 200], ['mela', 100], ['mandorle', 15]] },
  { id: 'c09', slot: 'colazione', name: 'Yogurt di soia con avena e banana',
    ing: [['yog_soia', 200], ['avena', 50], ['banana', 100]] },
  { id: 'c10', slot: 'colazione', name: 'Gallette con burro di arachidi e banana',
    ing: [['gallette', 40], ['burro_arach', 25], ['banana', 100]] },

  /* ---------------- PRANZI (base ~550-650 kcal) ---------------- */
  { id: 'p01', slot: 'pranzo', name: 'Pasta al pomodoro con pollo alla griglia',
    ing: [['pasta', 90], ['passata', 100], ['parmigiano', 10], ['pollo', 120], ['insalata', 80], ['olio', 10]] },
  { id: 'p02', slot: 'pranzo', name: 'Riso con tonno e zucchine',
    ing: [['riso', 90], ['tonno', 120], ['zucchine', 150], ['olio', 10]] },
  { id: 'p03', slot: 'pranzo', name: 'Insalatona di pollo con pane integrale',
    ing: [['pollo', 130], ['insalata', 120], ['pomodoro', 100], ['pane_int', 80], ['olio', 12]] },
  { id: 'p04', slot: 'pranzo', name: 'Bowl di quinoa, ceci e verdure',
    ing: [['quinoa', 80], ['ceci', 180], ['verdure', 150], ['olio', 12]] },
  { id: 'p05', slot: 'pranzo', name: 'Pasta con tonno e pomodoro',
    ing: [['pasta', 90], ['tonno', 100], ['passata', 100], ['olio', 10]] },
  { id: 'p06', slot: 'pranzo', name: 'Couscous con verdure e ceci',
    ing: [['couscous', 80], ['ceci', 150], ['verdure', 150], ['olio', 12]] },
  { id: 'p07', slot: 'pranzo', name: 'Riso al curry con pollo e broccoli',
    ing: [['riso', 90], ['pollo', 130], ['broccoli', 150], ['olio', 10]] },
  { id: 'p08', slot: 'pranzo', name: 'Piadina con bresaola, rucola e grana',
    ing: [['piadina', 120], ['bresaola', 80], ['rucola', 30], ['parmigiano', 15]] },
  { id: 'p09', slot: 'pranzo', name: 'Pasta e lenticchie',
    ing: [['pasta', 80], ['lenticchie', 180], ['passata', 80], ['olio', 10]] },
  { id: 'p10', slot: 'pranzo', name: 'Riso con salmone e zucchine',
    ing: [['riso', 90], ['salmone', 100], ['zucchine', 150], ['olio', 8]] },
  { id: 'p11', slot: 'pranzo', name: 'Wrap di tacchino con verdure',
    ing: [['piadina', 120], ['tacchino', 100], ['insalata', 60], ['pomodoro', 80], ['olio', 8]] },
  { id: 'p12', slot: 'pranzo', name: 'Riso e tofu saltati con verdure',
    ing: [['riso', 90], ['tofu', 150], ['verdure', 150], ['olio', 10]] },

  /* ---------------- CENE (base ~500-600 kcal) ---------------- */
  { id: 'd01', slot: 'cena', name: 'Salmone al forno con patate e verdure',
    ing: [['salmone', 150], ['patate', 250], ['verdure', 150], ['olio', 10]] },
  { id: 'd02', slot: 'cena', name: 'Merluzzo con patate e broccoli',
    ing: [['merluzzo', 200], ['patate', 250], ['broccoli', 150], ['olio', 12]] },
  { id: 'd03', slot: 'cena', name: 'Frittata con verdure e pane integrale',
    ing: [['uova', 165], ['verdure', 150], ['pane_int', 60], ['olio', 8]] },
  { id: 'd04', slot: 'cena', name: 'Petto di pollo con pane e insalata',
    ing: [['pollo', 160], ['pane_int', 70], ['insalata', 100], ['pomodoro', 100], ['olio', 12]] },
  { id: 'd05', slot: 'cena', name: 'Tagliata di manzo con rucola e grana',
    ing: [['manzo', 160], ['rucola', 50], ['parmigiano', 15], ['pane', 60], ['olio', 10]] },
  { id: 'd06', slot: 'cena', name: 'Gamberi saltati con riso e zucchine',
    ing: [['gamberi', 180], ['riso', 70], ['zucchine', 150], ['olio', 12]] },
  { id: 'd07', slot: 'cena', name: 'Tofu saltato con verdure e riso',
    ing: [['tofu', 180], ['riso', 70], ['verdure', 180], ['olio', 12]] },
  { id: 'd08', slot: 'cena', name: 'Zuppa di legumi con pane integrale',
    ing: [['lenticchie', 150], ['fagioli', 100], ['passata', 100], ['pane_int', 70], ['olio', 12]] },
  { id: 'd09', slot: 'cena', name: 'Hamburger di manzo magro con pane',
    ing: [['manzo', 150], ['pane', 80], ['insalata', 80], ['pomodoro', 80], ['olio', 8]] },
  { id: 'd10', slot: 'cena', name: 'Tacchino in padella con patate',
    ing: [['tacchino', 160], ['patate', 250], ['verdure', 120], ['olio', 12]] },
  { id: 'd11', slot: 'cena', name: 'Insalata greca con feta e pane',
    ing: [['feta', 100], ['pomodoro', 150], ['insalata', 100], ['pane_int', 70], ['olio', 10]] },
  { id: 'd12', slot: 'cena', name: 'Tempeh con quinoa e verdure',
    ing: [['tempeh', 120], ['quinoa', 60], ['verdure', 180], ['olio', 10]] },

  /* ---------------- SPUNTINI (base ~150-250 kcal) ---------------- */
  { id: 's01', slot: 'spuntino', name: 'Yogurt greco con miele',
    ing: [['yog_greco', 170], ['miele', 10]] },
  { id: 's02', slot: 'spuntino', name: 'Mela con mandorle',
    ing: [['mela', 150], ['mandorle', 20]] },
  { id: 's03', slot: 'spuntino', name: 'Pane integrale con burro di arachidi',
    ing: [['pane_int', 40], ['burro_arach', 15]] },
  { id: 's04', slot: 'spuntino', name: 'Shake proteico con banana',
    ing: [['whey', 25], ['banana', 100]] },
  { id: 's05', slot: 'spuntino', name: 'Cioccolato fondente e noci',
    ing: [['ciocc_fond', 20], ['noci', 15]] },
  { id: 's06', slot: 'spuntino', name: 'Yogurt di soia con frutta',
    ing: [['yog_soia', 150], ['frutta_stag', 100]] },
  { id: 's07', slot: 'spuntino', name: 'Hummus con gallette di riso',
    ing: [['hummus', 60], ['gallette', 30]] },
  { id: 's08', slot: 'spuntino', name: 'Ricotta con miele',
    ing: [['ricotta', 120], ['miele', 10]] },
  { id: 's09', slot: 'spuntino', name: 'Bresaola con gallette',
    ing: [['bresaola', 50], ['gallette', 30]] },
  { id: 's10', slot: 'spuntino', name: 'Frutta di stagione con mandorle',
    ing: [['frutta_stag', 250], ['mandorle', 15]] }
];

const Foods = {
  ING, MEALS,

  flagsOf(meal) {
    const flags = new Set();
    meal.ing.forEach(([code]) => {
      const f = ING[code][5];
      if (f) f.split(' ').forEach(x => flags.add(x));
    });
    return flags;
  },

  isVegetarian(meal) {
    const f = this.flagsOf(meal);
    return !f.has('meat') && !f.has('fish');
  },

  isVegan(meal) {
    const f = this.flagsOf(meal);
    return this.isVegetarian(meal) && !f.has('lact') && !f.has('egg') && !f.has('honey');
  },

  /** Valori nutrizionali di un piatto a un certo fattore di scala. */
  totals(meal, factor = 1) {
    let kcal = 0, prot = 0, carb = 0, fat = 0;
    meal.ing.forEach(([code, grams]) => {
      const i = ING[code];
      const g = grams * factor;
      kcal += (i[1] * g) / 100;
      prot += (i[2] * g) / 100;
      carb += (i[3] * g) / 100;
      fat  += (i[4] * g) / 100;
    });
    return { kcal: Math.round(kcal), prot: Math.round(prot), carb: Math.round(carb), fat: Math.round(fat) };
  },

  /** Lista ingredienti con grammature scalate (arrotondate ai 5 g). */
  scaledIngredients(meal, factor = 1) {
    return meal.ing.map(([code, grams]) => ({
      code,
      name: ING[code][0],
      grams: Math.max(5, Math.round((grams * factor) / 5) * 5),
      cat: ING[code][6]
    }));
  },

  byId(id) {
    return MEALS.find(m => m.id === id);
  }
};
