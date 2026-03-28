const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\GitHub\\canadiancaptive-new';
const GA_TAG = `<!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XW6PXCXNZC"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XW6PXCXNZC');
    </script>`;

function findHtmlFiles(dir) {
    let results = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && item !== 'node_modules' && item !== '.git' && item !== 'domiciles') {
            results = results.concat(findHtmlFiles(fullPath));
        } else if (item.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

// Only root-level HTML files (domiciles will be regenerated)
const files = findHtmlFiles(rootDir);
console.log(`Found ${files.length} root HTML files`);

let count = 0;
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('G-XW6PXCXNZC')) {
        console.log(`  Skip (already has GA): ${path.basename(file)}`);
        continue;
    }
    // Insert after <head>
    content = content.replace(/<head>\s*\n\s*<meta charset/, `<head>\n    ${GA_TAG}\n    <meta charset`);
    if (!content.includes('G-XW6PXCXNZC')) {
        // Try alternate pattern
        content = content.replace(/<head>/, `<head>\n    ${GA_TAG}`);
    }
    fs.writeFileSync(file, content, 'utf8');
    count++;
    console.log(`  ✓ ${path.basename(file)}`);
}
console.log(`\nUpdated ${count} files`);
