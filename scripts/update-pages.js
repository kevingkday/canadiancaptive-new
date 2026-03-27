const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\GitHub\\canadiancaptive-new';

function findHtmlFiles(dir) {
    let results = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && item !== 'node_modules' && item !== '.git') {
            results = results.concat(findHtmlFiles(fullPath));
        } else if (item.endsWith('.html') && item !== 'index.html') {
            results.push(fullPath);
        }
    }
    return results;
}

const files = findHtmlFiles(rootDir);
console.log(`Found ${files.length} HTML files to update`);

let updatedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // 1. Update copyright text
    content = content.replace(
        /CanadianCaptive Consultancy/g,
        'CanadianCaptive.com'
    );

    // 2. Update header title from "CanadianCaptive" to "CanadianCaptive.com"
    // Match the div-based header (non-index pages)
    content = content.replace(
        /<div class="text-2xl font-bold tracking-tighter text-red-700">\s*\n?\s*CanadianCaptive\s*\n?\s*<\/div>/g,
        '<a href="index.html"\n                class="text-2xl font-bold tracking-tighter text-red-700 hover:opacity-80 transition-opacity">\n                CanadianCaptive.com\n            </a>'
    );

    // Also catch if it's already an <a> but says "CanadianCaptive" without .com
    content = content.replace(
        /(<a[^>]*class="text-2xl font-bold tracking-tighter text-red-700[^"]*"[^>]*>)\s*\n?\s*CanadianCaptive\s*\n?\s*(<\/a>)/g,
        '$1\n                CanadianCaptive.com\n            $2'
    );

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
        console.log(`Updated: ${path.relative(rootDir, file)}`);
    }
}

console.log(`\nDone! Updated ${updatedCount} files.`);
