const fs = require('fs');
const glob = require('path');

const OLD_LOGO_REGEX = /<path\s+d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"\s*\/>/g;
const NEW_LOGO = '<path d="M9 3 2 6v15l7-3 6 3 7-3V3l-7 3-6-3z"/><path d="M9 3v15"/><path d="M15 6v15"/>';

const OLD_CLINICA_REGEX = /<path\s+d="M22 12h-4l-3 9L9 3l-3 9H2"\s*\/>/g;
const NEW_CLINICA = '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>';

const OLD_PEDIATRIA_REGEX = /<circle\s+cx="12"\s+cy="12"\s+r="10"\s*\/>\s*<circle\s+cx="12"\s+cy="12"\s+r="2"\s*\/>/g;
const NEW_PEDIATRIA = '<path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.1-2 2.5c-.8.3-1.5.4-1.5 1l.5 2.5 3.1-1.2c3.2-1.2 3.4-4 3.4-4Z"/>';

for (let i = 1; i <= 7; i++) {
    const path = 'C:/Laboratorio_de_imagens/public/posts/002-carrossel-venda/slides/slide-' + i + '.html';
    if (!fs.existsSync(path)) continue;
    let html = fs.readFileSync(path, 'utf8');

    html = html.replace(OLD_LOGO_REGEX, NEW_LOGO);

    if (i === 4) {
        html = html.replace(OLD_CLINICA_REGEX, NEW_CLINICA);
        html = html.replace(OLD_PEDIATRIA_REGEX, NEW_PEDIATRIA);
    }

    fs.writeFileSync(path, html);
    console.log(`Updated slide ${i}`);
}
console.log('Done.');
