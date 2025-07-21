# DevZen - Il Tuo Hub di Conoscenza Potenziato dall'IA

![DevZen Logo](https://placehold.co/100x100.png)

**DevZen** trasforma il modo in cui salvi, organizzi e interagisci con i contenuti web. Smetti di perdere link e inizia a costruire una base di conoscenza intelligente, ricercabile e attiva.

## ✨ Funzionalità Chiave

- **Organizzazione Intelligente con "Spazi"**: Crea spazi di lavoro dedicati per ogni progetto, interesse o area tematica. Mantieni i tuoi link, le tue note e le tue idee perfettamente organizzati.
- **Riassunti e Categorizzazione AI**: Ogni volta che aggiungi un segnalibro, l'IA ne analizza il contenuto per generare un riassunto conciso e suggerire lo spazio più appropriato in cui salvarlo.
- **Chat AI con i Tuoi Contenuti**: Avvia una conversazione con l'IA all'interno di uno spazio. Fai domande, chiedi approfondimenti e ottieni risposte basate sui link che hai salvato, arricchite dalla conoscenza generale dell'IA.
- **Generazione di Spazi di Lavoro con AI**: Descrivi semplicemente il tipo di progetto che vuoi avviare (es. "un'app per il social media marketing") e l'IA creerà uno spazio di lavoro completo di spazi, cartelle e strumenti pertinenti.
- **Sviluppo Guidato di Idee**: Hai un'idea vaga? Avvia una chat con l'IA che, attraverso domande mirate, ti aiuterà a trasformarla in un piano d'azione strutturato, completo di task e strumenti consigliati.
- **Gestione Task Integrata**: Trasforma le idee in azioni. Ogni spazio generato da un'idea include una lista di task interattiva con barre di avanzamento per tenere traccia del tuo progetto.
- **Libreria di Strumenti AI**: Accedi a un elenco curato di strumenti AI e importali direttamente nei tuoi spazi come segnalibri.
- **Personalizzazione e Condivisione**: Personalizza l'aspetto di ogni elemento e condividi i tuoi contenuti tramite link o webhook.

## 🚀 Stack Tecnologico

- **Framework**: Next.js (App Router)
- **Libreria UI**: React con TypeScript
- **Stile**: Tailwind CSS
- **Componenti**: ShadCN UI
- **Funzionalità AI**: Genkit (con modelli Google Gemini)
- **Backend & Database**: PocketBase
- **Drag & Drop**: Dnd-kit

## 🏁 Come Iniziare

Segui questi passaggi per configurare ed eseguire il progetto in locale.

### Prerequisiti

- Node.js (v18 o superiore)
- Un'istanza di PocketBase in esecuzione (puoi scaricarla da [pocketbase.io](https://pocketbase.io/))
- Una chiave API per Google Gemini (puoi ottenerla da [Google AI Studio](https://aistudio.google.com/))

### 1. Clona il Repository

```bash
git clone <URL_DEL_REPOSITORY>
cd <NOME_DELLA_CARTELLA>
```

### 2. Installa le Dipendenze

```bash
npm install
```

### 3. Configura le Variabili d'Ambiente

Crea un file `.env` nella root del progetto e aggiungi le seguenti variabili:

```env
# L'URL della tua istanza PocketBase in esecuzione
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090

# La tua chiave API per i modelli Gemini di Google
GEMINI_API_KEY=TUA_CHIAVE_API_QUI
```

**Importante**: Dopo aver avviato PocketBase, vai all'Admin UI e importa le collezioni che trovi nel file `pb_schema.json` di questo repository per avere la struttura dati corretta.

### 4. Avvia il Server di Sviluppo

```bash
npm run dev
```

L'applicazione sarà disponibile all'indirizzo `http://localhost:9002`.

### 5. Avvia Genkit (per lo sviluppo AI)

In un terminale separato, esegui il seguente comando per avviare l'interfaccia di sviluppo di Genkit:

```bash
npm run genkit:watch
```

Questo ti permetterà di ispezionare e fare il debug dei flussi AI.

## 📁 Struttura del Progetto

```
/src
├── /ai                 # Flussi e configurazione di Genkit
├── /app                # Pagine e layout (Next.js App Router)
│   ├── /actions        # Azioni server per l'interazione con il backend e l'IA
│   ├── /auth           # Pagine e logica di autenticazione
│   └── /dashboard      # Layout e pagina principale del dashboard
├── /components         # Componenti React riutilizzabili
│   └── /ui             # Componenti UI di base (generati da ShadCN)
├── /hooks              # Hook React personalizzati
├── /lib                # Utilità, tipi e configurazione del client PocketBase
```
