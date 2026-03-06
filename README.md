# CARTIA 📄🧠

**Languages:** [English](#-english) · [Italiano](#-italiano)

## 🇬🇧 English

**CARTIA** is a chat interface for Artificial Intelligence designed specifically for **E-ink** displays and for learning **Prompt Engineering**.

A project by **Marco Scarselli**, created for people who suffer from eye dryness and spend many hours in front of a screen. CARTIA is a chat designed for e-ink screens, with a low-visual-impact design that reduces eye strain. Although optimized for e-readers, it can also be used on PCs and smartphones.

Unlike traditional chats, CARTIA turns the conversation into a reading experience: messages don’t scroll, they are turned like pages of a book, avoiding the annoying refresh (ghosting) issues typical of electronic ink displays.

### ✨ Key Features
- 📖 **Paged Interface**: Smooth navigation optimized for e-reader screens.
- 🎓 **Educational Approach**: Structures prompts into System, Context, and Examples to understand how the AI "thinks".
- 🌑 **E-ink Optimized**: High contrast design, serif fonts, and no heavy animations.
- 🔒 **ALL IN YOUR BROWSER**: Runs entirely in the browser and can be customized for local models/providers. OpenRouter is included for experimental use. In the future it can also support browser-native LLMs.
- 🛠️ **Open Source**: Built to be studied, modified, and improved by the community.

### 🤖 Multi-Agent Mode
CARTIA includes a **simplified multi-agent orchestration** system alongside the classic chat — lightweight, transparent, and easy to understand:
- **Agent Picker with Presets**: Choose from ready-to-use agents (Developer, Analyst, Creative Writer, Buddhist Monk, Facilitator…) or create your own.
- **LEAD Mode**: When only one agent is active, it responds directly — no orchestrator needed.
- **Phase-based Execution**: Assign agents to sequential phases (0 = parallel, 1→2→3 = sequential) with context passing between phases via `<PREVIOUS_AGENTS_OUTPUT>`.
- **Customizable Orchestrator Prompt**: Tailor how the orchestrator synthesizes agent responses.
- **Auto-disable Agents**: Some agents (e.g., Web Search) automatically deactivate after each turn.
- **Datetime Injection**: Optionally inject current date/time into system prompts.
- **E-reader Navigation in Agents**: Message-by-message navigation (↑/↓) and paged reading (📖) work in the Agents tab too.

### 🚀 Demo
- **Live Demo**: [https://scarsellifi.github.io/cartia/](https://scarsellifi.github.io/cartia/)
- Or open [`index.html`](./index.html) locally

### 🧭 How to use
1. Open `index.html` in your browser (or use the live demo).
2. Enter your OpenRouter API Key when prompted (create one here: https://openrouter.ai/keys).
3. Write a message and start the conversation.

### 🔗 Integration with iascarselli.it
CARTIA can be used together with **iascarselli.it**:
- **Artificial Intelligence for Public Administration and Public Exams**
- Teaching materials, lessons, and tools to understand and use AI in the public sector
- Introduction to Artificial Intelligence – go to the lesson

**Marco Scarselli**: expert in innovation and AI solution development for Public Administration. He has worked on research and development projects, with recognitions such as the "Fiorino d'Oro" (Comune di Firenze) and the "Tuscan Big Data Challenge" (CNR).

### 🤝 Contributing & Contact
To propose improvements or report issues:
- Open a GitHub issue
- Or email `scarselli@gmail.com`
- For a customized version (local models or providers other than OpenRouter), get in touch.

### 📝 License
- Full text: [`LICENSE`](LICENSE)
- Dual licensing and commercial use: [`LICENSING.md`](LICENSING.md)

### 📚 Third-party
- Third-party libraries: [`THIRD_PARTY_LICENSES`](THIRD_PARTY_LICENSES)

### 🛡️ Security
- Security reporting: [`SECURITY.md`](SECURITY.md)

---

## 🇮🇹 Italiano

**CARTIA** è un'interfaccia di chat per Intelligenza Artificiale progettata specificamente per schermi **E-ink** e per l'apprendimento del **Prompt Engineering**.

Un progetto di **Marco Scarselli**, creato per chi soffre di secchezza oculare e passa molte ore davanti al monitor. CARTIA è una chat studiata per gli schermi e-ink, con un design a basso impatto visivo che riduce l'affaticamento degli occhi. Anche se ottimizzata per e-reader, può essere utilizzata su PC e smartphone.

A differenza delle chat tradizionali, CARTIA trasforma la conversazione in un'esperienza di lettura: i messaggi non scorrono, ma si sfogliano come le pagine di un libro, eliminando i fastidiosi problemi di refresh (ghosting) tipici dei display a inchiostro elettronico.

### ✨ Caratteristiche Principali
- 📖 **Interfaccia a Pagine**: Navigazione fluida ottimizzata per schermi e-reader.
- 🎓 **Anima Didattica**: Struttura i prompt in System, Context ed Examples per capire come "pensa" l'IA.
- 🌑 **E-ink Optimized**: Design ad alto contrasto, font serif e zero animazioni pesanti.
- 🔒 **ALL IN YOUR BROWSER**: Funziona interamente nel browser e può essere personalizzata per modelli/provider locali. OpenRouter è incluso per uso sperimentale. In futuro potrà anche supportare LLM che girano direttamente nel browser.
- 🛠️ **Open Source**: Pensata per essere studiata, modificata e migliorata dalla community.

### 🤖 Modalità Multi-Agente
CARTIA include un sistema di **orchestrazione multi-agente semplificata** accanto alla chat classica — leggero, trasparente e facile da comprendere:
- **Agent Picker con Preset**: Scegli tra agenti pronti all'uso (Sviluppatore, Analista, Scrittore Creativo, Monaco Buddista, Facilitatore…) o creane di personalizzati.
- **Modalità LEAD**: Quando c'è un solo agente attivo, risponde direttamente — senza orchestratore.
- **Esecuzione a Fasi**: Assegna gli agenti a fasi sequenziali (0 = parallelo, 1→2→3 = sequenziale) con passaggio del contesto tra le fasi tramite `<PREVIOUS_AGENTS_OUTPUT>`.
- **Prompt Orchestratore Personalizzabile**: Personalizza come l'orchestratore sintetizza le risposte degli agenti.
- **Agenti Auto-disabilitanti**: Alcuni agenti (es. Ricerca Web) si disattivano automaticamente dopo ogni turno.
- **Iniezione Data/Ora**: Inserimento opzionale di data e ora correnti nei prompt di sistema.
- **Navigazione E-reader negli Agenti**: Navigazione messaggio per messaggio (↑/↓) e lettura paginata (📖) disponibili anche nel tab Agenti.

### 🚀 Demo
- **Live Demo**: [https://scarsellifi.github.io/cartia/](https://scarsellifi.github.io/cartia/)
- Oppure apri [`index.html`](./index.html) localmente

### 🧭 Come si usa
1. Apri `index.html` nel browser (o usa la demo online).
2. Inserisci la tua API Key di OpenRouter quando richiesto (puoi crearla qui: https://openrouter.ai/keys).
3. Scrivi un messaggio e avvia la conversazione.

### 🔗 Integrazione con iascarselli.it
CARTIA può essere usato in combinazione con **iascarselli.it**:
- **Intelligenza Artificiale per la Pubblica Amministrazione e i Concorsi Pubblici**
- Materiali didattici, lezioni e strumenti per comprendere e utilizzare l'IA nel settore pubblico
- [Lezione base di IA](https://iascarselli.it/lezione_base): perché sono importanti System Prompt, contesto e struttura dell'output

**Marco Scarselli**: esperto di innovazione e sviluppo di soluzioni AI per la Pubblica Amministrazione. Ha lavorato su progetti di ricerca e sviluppo, con riconoscimenti come il "Fiorino d'Oro" (Comune di Firenze) e la "Tuscan Big Data Challenge" (CNR).

### 🤝 Contribuire e contatti
Per proporre miglioramenti o segnalare problemi:
- Apri una issue su GitHub
- Oppure scrivi a `scarselli@gmail.com`
- Per una versione personalizzata (modelli locali o diversi da OpenRouter), contattami.

### 📝 Licenza
- Testo completo: [`LICENSE`](LICENSE)
- Dual licensing e uso commerciale: [`LICENSING.md`](LICENSING.md)

### 📚 Third-party
- Librerie di terze parti: [`THIRD_PARTY_LICENSES`](THIRD_PARTY_LICENSES)

### 🛡️ Sicurezza
- Segnalazioni di sicurezza: [`SECURITY.md`](SECURITY.md)
