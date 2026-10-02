/* Smoke test: comprueba que cada href/src local de las páginas exista */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pages = ['index.html', 'acceso.html'];

(async function () {
    let bad = 0;

    for (const page of pages) {
        const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
        const refs = new Set();

        let m;
        const re = /(?:href|src)="([^"]+)"/g;
        while ((m = re.exec(html)) !== null) {
            const v = m[1];
            if (/^(https?:|mailto:|#|data:)/.test(v)) continue;
            refs.add(v);
        }

        console.log('=== ' + page + '  (' + refs.size + ' referencias locales)');

        for (const ref of [...refs].sort()) {
            const clean = ref.split('#')[0];
            if (!clean) continue;
            const abs = path.join(ROOT, clean);
            const exists = fs.existsSync(abs);
            let size = '';
            if (exists) {
                const st = fs.statSync(abs);
                size = '  ' + (st.isDirectory() ? '[dir]' : (st.size / 1024).toFixed(1) + ' KB');
            }
            console.log('   ' + (exists ? 'OK  ' : 'FALTA') + '  ' + clean + size);
            if (!exists) bad++;
        }
    }

    // páginas de la guía
    const missing = [];
    for (let i = 1; i <= 67; i++) {
        const f = 'guia-pages/page-' + String(i).padStart(3, '0') + '.jpg';
        if (!fs.existsSync(path.join(ROOT, f))) missing.push(f);
    }
    console.log('');
    console.log('=== guia-pages/  (67 esperadas)');
    console.log(missing.length ? '   FALTAN: ' + missing.join(', ') : '   las 67 presentes');

    // El PDF no debe estar en la carpeta publicada: la guía solo se lee online.
    // Está movido a ../_fuera/ para que la URL directa dé 404.
    const pdf = path.join(ROOT, 'Guía.pdf');
    const pdfFuera = path.join(ROOT, '..', '_fuera', 'Guía.pdf');
    console.log('=== PDF descargable');
    console.log('   dentro de la carpeta publicada: ' +
        (fs.existsSync(pdf) ? 'SI - FALLO, se puede descargar' : 'no (correcto)'));
    console.log('   copia archivada fuera: ' +
        (fs.existsSync(pdfFuera)
            ? 'OK (' + (fs.statSync(pdfFuera).size / 1024 / 1024).toFixed(1) + ' MB)'
            : 'no encontrada'));

    // Ningún HTML debe ofrecer una descarga
    const descargas = [];
    for (const f of ['index.html', 'acceso.html', 'Gracias.html']) {
        const p = path.join(ROOT, f);
        if (!fs.existsSync(p)) continue;
        const c = fs.readFileSync(p, 'utf8');
        if (/\.pdf|descargar|download/i.test(c)) descargas.push(f);
    }
    console.log('=== enlaces de descarga en el sitio: ' +
        (descargas.length ? 'FALLO en ' + descargas.join(', ') : 'ninguno (correcto)'));

    console.log('');
    const pdfOk = !fs.existsSync(pdf) && descargas.length === 0;
    console.log(bad === 0 && missing.length === 0 && pdfOk
        ? 'SMOKE TEST: todo correcto'
        : 'SMOKE TEST: ' + (bad + missing.length + (pdfOk ? 0 : 1)) + ' fallo(s)');
})();