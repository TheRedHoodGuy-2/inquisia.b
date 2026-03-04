const fs = require('fs');
const path = require('path');

function getRoutes(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getRoutes(filePath, fileList);
        } else if (file === 'route.ts') {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const routes = getRoutes('src/app/api');
let out = '';
for (const p of routes) {
    out += `\n\n=================================================================\n--- FILE: ${p.replace(/\\/g, '/')} ---\n=================================================================\n`;
    out += fs.readFileSync(p, 'utf8');
}
fs.writeFileSync('all_routes_dump.txt', out);
console.log('Dumped ' + routes.length + ' routes to all_routes_dump.txt');
