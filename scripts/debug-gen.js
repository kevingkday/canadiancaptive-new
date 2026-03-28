// Fix: replace slugify(domicile.name) with the pre-computed slug variable in OG tags
const fs = require('fs');
const path = require('path');

const genPath = path.join(__dirname, 'generate-domiciles.js');
let gen = fs.readFileSync(genPath, 'utf8');

// In the individual domicile template, the slug is computed as:
//   const slug = slugify(domicile.name);  (but inside generateDomicilePage it's available)
// However the OG tags are inside a template literal where slugify IS available
// The real issue is that the injected text has ${slugify(domicile.name)} 
// but it was injected as literal text, not as template expression.
// Let me check what actually happened...

// Actually let me just look at and fix line 250 area
const lines = gen.split('\n');
let fixed = 0;
for (let i = 0; i < lines.length; i++) {
    // The problem: add-seo-generator.js used backtick template literal replacement
    // which resolved ${slugify(...)} to literal text at injection time.
    // We need the meta tags to use template expressions that reference the slug variable.
    
    // Replace any "slugify(domicile.name)" that's inside the OG meta tags with the slug variable
    if (lines[i].includes('slugify(domicile.name)') && (lines[i].includes('og:') || lines[i].includes('canonical'))) {
        // This shouldn't happen since they're in template literals... let me just check
    }
}

// Let's see what lines 248-260 actually look like
console.log('--- Lines 248-265 ---');
for (let i = 247; i < 265 && i < lines.length; i++) {
    console.log(`${i+1}: ${lines[i].substring(0, 120)}`);
}
