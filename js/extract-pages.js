/* ========================================
   METAMORPHOSIS — EXTRACTOR DE PÁGINAS
   Convierte Guía_output.html (PDFix, 27MB con
   base64 inline) en JPEG individuales en
   guia-pages/ para un visor lightweight.
   Uso: node js/extract-pages.js
   ======================================== */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'Guía_output.html');
const OUT_DIR = path.join(ROOT, 'guia-pages');

function main() {
    if (!fs.existsSync(SOURCE)) {
        console.error('No se encontró Guía_output.html en:', SOURCE);
        process.exit(1);
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });

    console.log('Leyendo Guía_output.html (~27MB)...');
    const html = fs.readFileSync(SOURCE, 'utf8');

    const docMatch = html.match(/id="pdf-document"[^>]*data-num-pages="(\d+)"/);
    const totalPages = docMatch ? parseInt(docMatch[1], 10) : null;
    console.log('Páginas declaradas:', totalPages);

    // Cada página es un div.pdf-page con data-page-num="N" y su imagen
    // en style="... background-image: url(data:image/jpeg;base64,....)"
    const pageRe = /<div class="pdf-page[^>]*data-page-num="(\d+)"[\s\S]*?url\(data:image\/jpe?g;base64,([A-Za-z0-9+\/=]+)\)/g;

    let match;
    let written = 0;
    const index = [];

    while ((match = pageRe.exec(html)) !== null) {
        const pageNum = parseInt(match[1], 10);
        const b64 = match[2];

        const fileName = 'page-' + String(pageNum).padStart(3, '0') + '.jpg';
        const outPath = path.join(OUT_DIR, fileName);

        const buf = Buffer.from(b64, 'base64');
        fs.writeFileSync(outPath, buf);

        index.push({
            page: pageNum,
            file: fileName,
            bytes: buf.length
        });

        written++;
        if (written % 10 === 0) {
            console.log('  ...' + written + ' páginas extraídas');
        }
    }

    if (written === 0) {
        console.error('No se encontró ninguna página. Revisa el patrón de extracción.');
        process.exit(1);
    }

    index.sort((a, b) => a.page - b.page);
    fs.writeFileSync(
        path.join(OUT_DIR, 'index.json'),
        JSON.stringify({ total: written, pages: index }, null, 2)
    );

    const totalMb = index.reduce((s, p) => s + p.bytes, 0) / (1024 * 1024);
    console.log('');
    console.log('✓ Extraídas ' + written + '/' + (totalPages || '?') + ' páginas');
    console.log('  Peso total: ' + totalMb.toFixed(1) + ' MB');
    console.log('  Promedio:   ' + Math.round(totalMb * 1024 / written) + ' KB por página');
    console.log('  Destino:    ' + OUT_DIR);
}

main();