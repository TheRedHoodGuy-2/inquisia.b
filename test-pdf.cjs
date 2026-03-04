const pdf = require("pdf-parse");
console.log(pdf.name || typeof pdf);
// Let's see if pdf itself is callable
try {
    const dummy = Buffer.from("%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n");
    if (typeof pdf === 'function') {
        pdf(dummy).then(r => console.log('success!', r.text)).catch(e => console.log('func error', e));
    } else {
        console.log("pdf is not a function.");
    }
} catch (e) { console.log(e.message); }
