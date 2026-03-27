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

    // 1. Remove Regulatory link
    content = content.replace(
        /\s*<a class="text-slate-600 hover:text-red-600 transition-colors font-sans antialiased tracking-tight"\s*\n?\s*href="#">Regulatory<\/a>/g,
        ''
    );

    // 2. Remove Compliance link
    content = content.replace(
        /\s*<a class="text-slate-600 hover:text-red-600 transition-colors font-sans antialiased tracking-tight"\s*\n?\s*href="#">Compliance<\/a>/g,
        ''
    );

    // 3. Remove Office column in footer
    content = content.replace(
        /\s*<div>\s*\n?\s*<h4 class="font-bold text-slate-900 mb-6">Office<\/h4>[\s\S]*?Contact\s*\n?\s*Us<\/a>\s*\n?\s*<\/div>/g,
        ''
    );

    // 4. Update copyright year from 2024 to 2026 and add powered by
    content = content.replace(
        /&copy; 2024 CanadianCaptive Consultancy\. All rights\s*\n?\s*reserved\.\s*<\/p>/g,
        '&copy; 2026 CanadianCaptive Consultancy. All rights\n                reserved. Powered by <a href="https://kevinday.ai" target="_blank" rel="noopener noreferrer" class="text-red-700 hover:underline">kevinday.ai</a></p>'
    );

    // 5. Remove search icon if present
    content = content.replace(
        /\s*<button class="text-slate-400 hover:text-red-600 transition-colors">\s*\n?\s*<span class="material-symbols-outlined">search<\/span>\s*\n?\s*<\/button>/g,
        ''
    );

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
        console.log(`Updated: ${path.relative(rootDir, file)}`);
    }
}

console.log(`\nDone! Updated ${updatedCount} files.`);
