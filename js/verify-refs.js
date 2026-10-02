/* Verificación: cruza los IDs/clases que pide el JS contra el HTML real */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function collect(html, attr) {
    const set = new Set();
    const re = new RegExp('\\b' + attr + '="([^"]+)"', 'g');
    let m;
    while ((m = re.exec(html)) !== null) {
        if (attr === 'id') set.add(m[1]);
        else m[1].split(/\s+/).filter(Boolean).forEach(c => set.add(c));
    }
    return set;
}

function allText(dir, ext) {
    let out = '';
    try {
        out += fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
        out += fs.readFileSync(path.join(dir, 'access.css'), 'utf8');
        out += fs.readFileSync(path.join(dir, 'guide.css'), 'utf8');
    } catch (e) { /* opcional */ }
    return out;
}

const pairs = [
    ['index.html', 'js/app.js'],
    ['acceso.html', 'js/guide.js']
];

let problems = 0;

for (const [htmlFile, jsFile] of pairs) {
    const html = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');
    const js = fs.readFileSync(path.join(ROOT, jsFile), 'utf8');

    const htmlIds = collect(html, 'id');
    const htmlClasses = collect(html, 'class');

    const needIds = new Set();
    let m;
    const reId = /getElementById\('([^']+)'\)/g;
    while ((m = reId.exec(js)) !== null) needIds.add(m[1]);

    const missingIds = [...needIds].filter(i => !htmlIds.has(i));

    // clases pedidas por querySelector(All)
    const needCls = new Set();
    const reCls = /querySelector(?:All)?\('\.([a-zA-Z0-9_-]+)/g;
    while ((m = reCls.exec(js)) !== null) needCls.add(m[1]);

    // clases creadas dinámicamente por el propio JS
    const dyn = new Set();
    const reDyn = /className\s*=\s*'([^']+)'|class="([a-zA-Z0-9_ -]+)"/g;
    while ((m = reDyn.exec(js)) !== null) {
        (m[1] || m[2] || '').split(/\s+/).filter(Boolean).forEach(c => dyn.add(c));
    }
    const reDyn2 = /classList\.(?:add|toggle|remove)\('([^']+)'/g;
    while ((m = reDyn2.exec(js)) !== null) dyn.add(m[1]);

    const missingCls = [...needCls].filter(c => !htmlClasses.has(c) && !dyn.has(c));

    console.log('=== ' + htmlFile + '  <-  ' + jsFile);
    console.log('    IDs pedidos: ' + needIds.size +
        '  |  faltantes: ' + (missingIds.length ? missingIds.join(', ') : 'ninguno'));

    if (missingIds.length) problems++;

    const cssUsed = [...needCls, ...dyn];
    const cssAll = allText(path.join(ROOT, 'css'));
    const noCss = cssUsed.filter(c => {
        const sel = '.' + c;
        return cssAll.indexOf(sel) === -1;
    });
    console.log('    clases usadas por JS: ' + cssUsed.length +
        '  |  sin regla CSS: ' + (noCss.length ? noCss.join(', ') : 'ninguna'));
    if (noCss.length) problems++;
}

// atributos data-* usados por JS vs presentes en HTML
const idxHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const dataAttrs = [...new Set((appJs.match(/\[data-([a-z-]+)\]/g) || [])
    .map(s => s.replace(/[[\]]/g, '')))];
console.log('');
console.log('data-attrs en index.html: ' + dataAttrs.join(', '));
dataAttrs.forEach(a => {
    const n = (idxHtml.match(new RegExp(a.replace(/[-]/g, '\\-'), 'g')) || []).length;
    console.log('    ' + a + ' -> ' + n + ' usos');
    if (n === 0) problems++;
});

console.log('');
console.log(problems === 0 ? 'RESULTADO: sin problemas' : 'RESULTADO: ' + problems + ' problema(s)');