#!/usr/bin/env bash
# build.sh - Genera index_monolithic.html da index.html + JS sorgenti
#
# Uso: ./build.sh
#
# Prende index.html (template) e produce index_monolithic.html
# con CartiaTTS.js, tts-worker.js e cartia.js inlineati.
# Il risultato è un singolo file HTML portatile.

set -euo pipefail
cd "$(dirname "$0")"

SRC="index.html"
OUT="index_monolithic.html"

if [ ! -f "$SRC" ]; then
    echo "Errore: $SRC non trovato" >&2
    exit 1
fi

echo "Building $OUT ..."

python3 << 'PYEOF'
import re

with open("index.html", "r") as f:
    html = f.read()
with open("CartiaTTS.js", "r") as f:
    cartia_tts = f.read()
with open("tts-worker.js", "r") as f:
    tts_worker = f.read()
with open("cartia.js", "r") as f:
    cartia_js = f.read()

# Inline tts-worker.js as a global string (for Blob Worker)
worker_inline = '<script>\n// tts-worker.js (inlined for monolithic build)\nwindow.__TTS_WORKER_CODE__ = ' + repr(tts_worker) + ';\n    </script>'

# Replace <script src="CartiaTTS.js"></script> with worker global + CartiaTTS inline
html = html.replace(
    '<script src="CartiaTTS.js"></script>',
    worker_inline + '\n    <script>\n' + cartia_tts + '\n    </script>'
)

# Replace <script src="cartia.js"></script> with inline
html = html.replace(
    '<script src="cartia.js"></script>',
    '<script>\n' + cartia_js + '\n    </script>'
)

with open("index_monolithic.html", "w") as f:
    f.write(html)

print("OK: index_monolithic.html generato")
PYEOF

ls -lh "$OUT" | awk '{print "Dimensione:", $5}'
echo "Done!"
