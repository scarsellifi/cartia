/**
 * CartiaTTS - Web Component per Text-to-Speech
 *
 * Engine:
 * - Primary: Piper TTS via Web Worker (off-main-thread)
 * - Fallback: Web Speech API (speechSynthesis)
 *
 * ---------------------------------------------------------------------------
 * QUICK START (portable)
 * ---------------------------------------------------------------------------
 * 1) Copy these files: CartiaTTS.js, tts-worker.js
 *
 * 2) Include: cartia-tts-script src="CartiaTTS.js"
 *
 * 3) Use element: cartia-tts data-text="Text to read"
 *    Voices:  cartia-tts data-text="..." data-voice="it_IT-paola-medium"
 *    Engine:  cartia-tts data-text="..." data-engine="speech-api"
 *
 * 4) JS API:
 *    const el = document.querySelector('cartia-tts');
 *    el.speak('Text to read');
 *    el.stop();
 *
 * Emitted events:
 * - tts-loading: model loading started
 * - tts-start: playback started
 * - tts-end: playback finished (or explicit user stop)
 * - tts-error: unrecoverable error
 *
 * Supported attributes:
 * - data-text   : text to read
 * - data-voice  : Piper voice (default: it_IT-paola-medium)
 * - data-engine : "piper" (default) | "speech-api" | "webspeech"
 * - data-speed  : playback speed (float, default 1.0)
 * - data-label  : custom button label
 *
 * ---------------------------------------------------------------------------
 * RECOMMENDED PLAYER PATTERN (paragraph/section navigation)
 * ---------------------------------------------------------------------------
 * Use one hidden cartia-tts engine and control your own external UI.
 *
 * Core loop idea:
 * - Build an ordered list of readable blocks (headings, paragraphs, list items).
 * - Speak one block at a time.
 * - Wait for tts-end before advancing.
 * - Treat tts-error as failure (reject current step), not as normal completion.
 *
 * Skip / Prev / Next:
 * - Set target index directly (index = target).
 * - Set a "jumpRequested" flag.
 * - Call engine.stop() and settle current wait.
 * - In loop: if jumpRequested is true, clear it and continue WITHOUT auto index++.
 *   This avoids accidental "double skip" jumps.
 * - Use a per-call token/counter in your state object and ignore events from
 *   stale calls; handle tts-end only after tts-start of the same call.
 *
 * Pause / Resume:
 * - Pause: set paused=true, pauseRequested=true, call engine.stop().
 * - Resume: clear paused and resolve the pending pause promise.
 * - While paused, prev/next can move index immediately without restarting playback.
 *
 * Coexisting controls (recommended UX):
 * - Keep audio controls hidden by default behind an explicit user switch.
 * - Provide a one-line explanation near the switch (what gets enabled).
 * - Highlight utility near the switch (e.g. "listen while doing other tasks").
 * - Keep global controls (prev / play-pause / stop / next).
 * - Also add one small inline play button per readable block.
 * - Inline button behavior:
 *   - click on current playing block -> pause
 *   - click on current paused block -> resume
 *   - click on different block -> start from that block
 * - If user does nothing, continue automatically to next block.
 *
 * Inline button implementation notes:
 * - Decorate blocks after HTML rendering (headings, paragraphs, list items).
 * - Store a stable block index in dataset (e.g. data-tts-index).
 * - Use event delegation on the container for inline button clicks.
 * - Update inline button state whenever playback state/index changes.
 *   Example: inactive='play icon', active+playing='pause icon', active+paused='play icon'
 *
 * IMPORTANT when extracting speech text:
 * - Do not read raw block.textContent if the block contains inline controls/icons.
 * - Clone the block, remove inline control nodes, then read clone.textContent.
 * - This prevents TTS from reading UI symbols/labels (e.g. play/pause glyphs).
 *
 * Event semantics (important to avoid race conditions):
 * - speak(): silently cleanup previous playback (no synthetic tts-end).
 * - stop(): explicit user stop; emits tts-end to unblock external waiters.
 * - If primary engine fails but fallback starts successfully, do NOT emit tts-error.
 *
 * Stability tips:
 * - For long content, assign text via JS property (`el.text = longText`) instead of
 *   very large HTML attributes.
 * - Before stopping/replacing audio objects, remove old handlers to prevent ghost
 *   onended/onerror callbacks from stale instances.
 * - On page/tab transitions, call your external stop handler on `beforeunload`,
 *   `pagehide`, and `visibilitychange` (hidden) to avoid lingering playback.
 *
 * Worker note:
 * - Worker path defaults to tts-worker.js (same directory).
 *   If changed, update CartiaTTS._initWorker().
 */

class CartiaTTS extends HTMLElement {
    // Worker condiviso fra tutte le istanze
    static _worker = null;
    static _workerReady = false;
    static _workerLoading = false;
    static _pendingCallbacks = new Map();
    static _requestId = 0;
    static _loadingListeners = [];

    static get observedAttributes() {
        return ['data-text', 'data-voice', 'data-engine', 'data-speed', 'data-label'];
    }

    constructor() {
        super();
        this._playing = false;
        this._loading = false;
        this._audio = null;
        this._audioUrl = null;
        this._utterance = null;
        this._text = null;

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: inline-block; }
                button {
                    background: none;
                    border: 1.5px solid currentColor;
                    border-radius: 8px;
                    padding: 6px 12px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-family: inherit;
                    color: inherit;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: opacity 0.2s, background 0.2s;
                    line-height: 1;
                }
                button:hover { background: rgba(0,0,0,0.05); }
                button:active { opacity: 0.7; }
                button[disabled] { opacity: 0.5; cursor: wait; }
                .icon { width: 18px; height: 18px; flex-shrink: 0; }
                .spinner { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            </style>
            <button part="button">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
                <span class="label"></span>
            </button>
        `;

        this._btn = this.shadowRoot.querySelector('button');
        this._iconContainer = this.shadowRoot.querySelector('.icon');
        this._labelEl = this.shadowRoot.querySelector('.label');
        this._btn.addEventListener('click', () => this._toggle());
    }

    connectedCallback() {
        this._updateLabel();
    }

    attributeChangedCallback() {
        this._updateLabel();
    }

    // --- Proprietà pubbliche ---

    get text() {
        if (typeof this._text === 'string') return this._text;
        return this.getAttribute('data-text') || '';
    }

    set text(v) {
        this._text = String(v || '');
    }

    get voice() {
        return this.getAttribute('data-voice') || 'it_IT-paola-medium';
    }

    get engine() {
        return this.getAttribute('data-engine') || 'piper';
    }

    get speed() {
        return parseFloat(this.getAttribute('data-speed')) || 1.0;
    }

    // --- API pubblica ---

    async speak(text) {
        // Cleanup silenzioso: ferma audio/speech SENZA emettere tts-end.
        // Così il loop paragrafo-per-paragrafo non viene confuso da eventi spuri.
        this._silentCleanup();
        this._stopped = false;
        const cleanText = this._stripMarkdown(text || this.text);
        if (!cleanText) return;

        if (this.engine === 'speech-api' || this.engine === 'webspeech') {
            return this._speakWebSpeech(cleanText);
        }
        return this._speakPiper(cleanText);
    }

    stop() {
        this._stopped = true;
        this._silentCleanup();
        // Lo stop esplicito deve sempre sbloccare i wait esterni.
        this._setPlaying(false, { forceEnd: true });
    }

    _silentCleanup() {
        if (this._audio) {
            this._audio.onended = null;
            this._audio.onerror = null;
            this._audio.pause();
            this._audio.currentTime = 0;
            this._audio = null;
        }
        if (this._audioUrl) {
            URL.revokeObjectURL(this._audioUrl);
            this._audioUrl = null;
        }
        if (this._utterance) {
            this._utterance.onend = null;
            this._utterance.onerror = null;
            window.speechSynthesis.cancel();
            this._utterance = null;
        }
        this._playing = false;
    }

    // --- Engine: Piper TTS via Web Worker ---

    static _initWorker() {
        if (CartiaTTS._worker) return;

        if (typeof __TTS_WORKER_CODE__ === 'string') {
            const blob = new Blob([__TTS_WORKER_CODE__], { type: 'application/javascript' });
            CartiaTTS._worker = new Worker(URL.createObjectURL(blob), { type: 'module' });
        } else {
            CartiaTTS._worker = new Worker('tts-worker.js', { type: 'module' });
        }
        CartiaTTS._worker.onmessage = (e) => {
            const msg = e.data;

            if (msg.type === 'ready') {
                CartiaTTS._workerReady = true;
                CartiaTTS._workerLoading = false;
                return;
            }

            if (msg.type === 'download-progress') {
                CartiaTTS._loadingListeners.forEach(fn => fn(msg.loaded));
                return;
            }

            if (msg.type === 'result' || msg.type === 'error') {
                const cb = CartiaTTS._pendingCallbacks.get(msg.id);
                if (cb) {
                    CartiaTTS._pendingCallbacks.delete(msg.id);
                    if (msg.type === 'error') {
                        cb.reject(new Error(msg.error));
                    } else {
                        cb.resolve(msg.wavBlob);
                    }
                }
                return;
            }
        };
    }

    _predictViaWorker(text) {
        CartiaTTS._initWorker();

        const id = ++CartiaTTS._requestId;
        return new Promise((resolve, reject) => {
            CartiaTTS._pendingCallbacks.set(id, { resolve, reject });
            CartiaTTS._worker.postMessage({
                type: 'predict',
                id,
                text,
                voice: this.voice,
                speed: this.speed,
            });
        });
    }

    async _speakPiper(text) {
        this._stopped = false;
        let onProgress = null;

        try {
            this._setLoading(true);
            this.dispatchEvent(new CustomEvent('tts-loading', {
                bubbles: true, detail: { voice: this.voice }
            }));

            // Listener per progresso download (condiviso)
            onProgress = (loaded) => {
                const pct = Math.round(loaded * 100);
                this._labelEl.textContent = `${pct}%`;
            };
            CartiaTTS._loadingListeners.push(onProgress);

            const wav = await this._predictViaWorker(text);

            // Se stop() è stato chiamato durante il predict, non suonare
            if (this._stopped) {
                this._setLoading(false);
                return;
            }

            this._setLoading(false);
            this._setPlaying(true);

            const url = URL.createObjectURL(wav);
            this._audio = new Audio(url);
            this._audioUrl = url;
            this._audio.onended = () => {
                URL.revokeObjectURL(url);
                this._audioUrl = null;
                this._setPlaying(false);
            };
            this._audio.onerror = () => {
                URL.revokeObjectURL(url);
                this._audioUrl = null;
                this._setPlaying(false);
            };
            const playPromise = this._audio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch((playErr) => {
                    this._silentCleanup();
                    this.dispatchEvent(new CustomEvent('tts-error', {
                        bubbles: true,
                        detail: { engine: 'piper', error: playErr?.message || 'Audio playback failed' }
                    }));
                });
            }
            this.dispatchEvent(new CustomEvent('tts-start', { bubbles: true }));
        } catch (err) {
            this._setLoading(false);
            console.warn('[CartiaTTS] Piper fallback a Web Speech API:', err.message);
            // NON emettere tts-error qui: il fallback Web Speech gestirà
            // tts-start e tts-end autonomamente. Emettere tts-error causerebbe
            // al loop chiamante di avanzare al paragrafo successivo prematuramente.
            return this._speakWebSpeech(text);
        } finally {
            if (onProgress) {
                const idx = CartiaTTS._loadingListeners.indexOf(onProgress);
                if (idx >= 0) CartiaTTS._loadingListeners.splice(idx, 1);
            }
        }
    }

    // --- Engine: Web Speech API (fallback) ---

    _speakWebSpeech(text) {
        if (!window.speechSynthesis) {
            this.dispatchEvent(new CustomEvent('tts-error', {
                bubbles: true, detail: { engine: 'webspeech', error: 'Non supportato' }
            }));
            return;
        }

        const chunks = this._chunkText(text, 200);
        this._setPlaying(true);
        this.dispatchEvent(new CustomEvent('tts-start', { bubbles: true }));

        let index = 0;
        const speakNext = () => {
            if (index >= chunks.length || !this._playing) {
                this._setPlaying(false);
                return;
            }
            const utt = new SpeechSynthesisUtterance(chunks[index]);
            utt.lang = 'it-IT';
            utt.rate = this.speed;

            const voices = window.speechSynthesis.getVoices();
            const itVoice = voices.find(v => v.lang.startsWith('it') && v.localService)
                || voices.find(v => v.lang.startsWith('it'));
            if (itVoice) utt.voice = itVoice;

            utt.onend = () => { index++; speakNext(); };
            utt.onerror = () => { this._setPlaying(false); };
            this._utterance = utt;
            window.speechSynthesis.speak(utt);
        };
        speakNext();
    }

    // --- UI ---

    _toggle() {
        if (this._loading) return;
        if (this._playing) {
            this.stop();
        } else {
            this.speak();
        }
    }

    _setPlaying(playing, opts = {}) {
        const forceEnd = !!opts.forceEnd;
        const wasPlaying = this._playing;
        this._playing = playing;
        this._updateIcon();
        this._updateLabel();
        if (!playing && (wasPlaying || forceEnd)) {
            this.dispatchEvent(new CustomEvent('tts-end', { bubbles: true }));
        }
    }

    _setLoading(loading) {
        this._loading = loading;
        this._btn.disabled = loading;
        this._updateIcon();
    }

    _updateLabel() {
        if (this._loading) return;
        const custom = this.getAttribute('data-label');
        this._labelEl.textContent = custom || (this._playing ? 'Stop' : 'Ascolta');
    }

    _updateIcon() {
        if (this._loading) {
            this._iconContainer.outerHTML = `
                <svg class="icon spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>`;
            this._iconContainer = this.shadowRoot.querySelector('.icon');
        } else if (this._playing) {
            this._iconContainer.outerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>`;
            this._iconContainer = this.shadowRoot.querySelector('.icon');
        } else {
            this._iconContainer.outerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>`;
            this._iconContainer = this.shadowRoot.querySelector('.icon');
        }
    }

    // --- Utilità ---

    _stripMarkdown(text) {
        return text
            .replace(/<[^>]+>/g, '')
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
            .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/^>\s+/gm, '')
            .replace(/^[\s]*[-*+]\s+/gm, '')
            .replace(/^[\s]*\d+\.\s+/gm, '')
            .replace(/^[-*_]{3,}$/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    _chunkText(text, maxLen) {
        const sentences = text.split(/(?<=[.!?;:])\s+/);
        const chunks = [];
        let current = '';

        for (const sentence of sentences) {
            if ((current + ' ' + sentence).length > maxLen && current) {
                chunks.push(current.trim());
                current = sentence;
            } else {
                current += (current ? ' ' : '') + sentence;
            }
        }
        if (current.trim()) chunks.push(current.trim());
        return chunks.length ? chunks : [text];
    }
}

customElements.define('cartia-tts', CartiaTTS);
