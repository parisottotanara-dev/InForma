# InForma 💪 — Piano alimentare e allenamento su misura

InForma è la tua app personale di fitness e gestione alimentare: inserisci i tuoi dati
fisici, scegli l'obiettivo (perdere peso, mantenerti o aumentare massa) ed entro quando
raggiungerlo, e l'app costruisce per te **piano alimentare settimanale** e **scheda di
allenamento** personalizzati.

Funziona **completamente offline**, è **gratuita** e i tuoi dati restano **solo sul tuo
dispositivo**.

---

## ▶️ Come si avvia

**Doppio clic su `Avvia InForma.bat`** (nella cartella dell'app).

Si aprirà una piccola finestra nera (il "motore" dell'app: lasciala aperta) e subito dopo
l'app nel browser, all'indirizzo `http://localhost:8642`.

> In alternativa puoi aprire direttamente `index.html` col browser: funziona tutto, ma i
> dati salvati sono separati tra i due metodi. **Scegline uno e usa sempre quello.**
> Consigliato: il file `Avvia InForma.bat`.

## 📱 Installarla sul telefono come una vera app

L'app è una PWA (Progressive Web App). Sul telefono:

1. Apri l'app nel browser del telefono (serve che PC e telefono siano sulla stessa rete
   Wi-Fi, sostituendo `localhost` con l'indirizzo IP del PC, es. `http://192.168.1.10:8642`),
   **oppure** copia l'intera cartella sul telefono / su un hosting web.
2. In Chrome/Edge: menu ⋮ → **"Aggiungi a schermata Home"** / **"Installa app"**.
3. L'icona di InForma comparirà tra le tue app, a schermo intero e senza barra del browser.

## 🧭 Le 5 schermate

| Schermata | Cosa trovi |
|---|---|
| **Oggi** | Calorie e macro del giorno, i pasti di oggi (da spuntare), l'allenamento in programma |
| **Dieta** | Piano alimentare dei 7 giorni con grammature, sostituzione pasti, lista della spesa |
| **Workout** | La tua scheda completa: esercizi, serie × ripetizioni, recuperi, cardio e linee guida |
| **Progressi** | Registra il peso, grafico reale vs piano, costanza in palestra, ricalcolo del piano |
| **Profilo** | I tuoi dati e numeri, modifica obiettivo, backup/ripristino, azzeramento |

## 🧮 Come calcola il piano (metodo)

- **Metabolismo basale**: formula di **Mifflin-St Jeor** (la più accurata per la popolazione generale)
- **Fabbisogno totale (TDEE)**: fattore di attività quotidiana + dispendio per ogni seduta di allenamento
- **Calorie del piano**: deficit o surplus calcolato dal tuo obiettivo e dalla data scelta,
  con **limiti di sicurezza**: mai più di −1% del peso a settimana, mai sotto 1200/1500 kcal,
  surplus massimo +0,35 kg a settimana. Se l'obiettivo è troppo aggressivo, l'app te lo dice
  e propone una data realistica.
- **Macro**: proteine 1,7-2 g/kg, grassi 0,8-1 g/kg, carboidrati a completamento
- **Scheda**: split scelto in base ai giorni disponibili (Full Body, Upper/Lower, Push/Pull/Legs),
  con progressione del carico e varianti casa/palestra

## 💾 I tuoi dati

- Tutto è salvato **in locale** sul dispositivo (niente account, niente cloud).
- Da **Profilo → Esporta backup** scarichi un file `.json` con tutti i tuoi dati: conservalo
  per sicurezza o per spostarti su un altro dispositivo (lì usa **Importa backup**).

## 📁 Struttura del progetto (per chi sviluppa)

```
index.html            Struttura della pagina
css/style.css         Stile (tema chiaro/scuro automatico)
js/store.js           Persistenza dati (da sostituire con API nella futura versione multi-utente)
js/engine.js          Motore di calcolo (BMR, TDEE, macro, limiti di sicurezza)
js/foods.js           Database alimenti e piatti italiani
js/meals.js           Generatore piano alimentare settimanale
js/workouts.js        Database esercizi e generatore schede
js/app.js             Interfaccia (onboarding + 5 schermate)
sw.js                 Service worker (offline/PWA)
manifest.webmanifest  Manifest PWA
server.ps1            Mini server locale (solo PowerShell, nessuna installazione)
tools/make-icons.ps1  Rigenera le icone PNG
```

**Roadmap**: la versione attuale è single-user con dati locali; l'architettura è già
predisposta (tutto l'accesso ai dati passa da `store.js`) per la futura versione
**multi-utente con account e sincronizzazione cloud**.

---

⚠️ *InForma fornisce indicazioni generali calcolate con formule standard e non sostituisce
il parere di un medico, dietologo o nutrizionista, soprattutto in presenza di patologie.*
