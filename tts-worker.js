/**
 * tts-worker.js - Web Worker per Piper TTS
 *
 * Esegue il caricamento della libreria e la sintesi vocale off-main-thread.
 * Comunica con CartiaTTS.js via postMessage.
 *
 * Messaggi IN:
 *   { type: 'init', voice: 'it_IT-riccardo-x_low' }
 *   { type: 'predict', id, text, voice, speed }
 *
 * Messaggi OUT:
 *   { type: 'ready' }
 *   { type: 'download-progress', loaded: 0.75 }
 *   { type: 'result', id, wavBlob: Blob }
 *   { type: 'error', id?, error: string }
 */

let ttsModule = null;

self.onmessage = async (e) => {
    const msg = e.data;

    if (msg.type === 'init') {
        try {
            await ensureLoaded(msg.voice);
            self.postMessage({ type: 'ready' });
        } catch (err) {
            self.postMessage({ type: 'error', error: err.message });
        }
        return;
    }

    if (msg.type === 'predict') {
        try {
            await ensureLoaded(msg.voice);

            const wav = await ttsModule.predict({
                text: msg.text,
                voiceId: msg.voice,
                speed: msg.speed || 1.0,
            });

            self.postMessage({ type: 'result', id: msg.id, wavBlob: wav });
        } catch (err) {
            self.postMessage({ type: 'error', id: msg.id, error: err.message });
        }
        return;
    }
};

async function ensureLoaded(voice) {
    if (ttsModule) return;

    ttsModule = await import(
        'https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.2/+esm'
    );

    const stored = await ttsModule.stored();
    if (!stored.includes(voice)) {
        await ttsModule.download(voice, (progress) => {
            self.postMessage({
                type: 'download-progress',
                loaded: progress.loaded,
            });
        });
    }
}
