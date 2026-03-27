/**
 * rebuild.js - Adds Alberta to domiciles.json if missing, 
 * then updates the generator nav/footer and regenerates all pages.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'domiciles.json');
const GEN_FILE = path.join(ROOT, 'scripts', 'generate-domiciles.js');

// 1. Add Alberta to JSON if missing
let domiciles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const hasAlberta = domiciles.some(d => d.name === 'Alberta');
if (!hasAlberta) {
    const alberta = {
        "name": "Alberta",
        "summary": "Alberta does not have dedicated captive insurance legislation, but captives can be established under the province's general Insurance Act with approval from the Alberta Superintendent of Insurance. The province's strong energy and natural resource sectors create significant demand for alternative risk transfer mechanisms. Alberta offers a business-friendly regulatory environment and competitive corporate tax rates, making it an emerging consideration for Canadian enterprises exploring captive solutions.",
        "jurisdiction": "Onshore (Canada)",
        "legislation": "Alberta Insurance Act (General Provisions)",
        "min_capital": {
            "General Requirement": "Subject to Superintendent approval"
        },
        "tax_notes": "Provincial premium taxes apply; competitive corporate tax rate of 8%",
        "slug": "alberta",
        "contact_name": "Alberta Superintendent of Insurance",
        "contact_email": null,
        "last_verified": null,
        "source_urls": []
    };
    // Insert after Abu Dhabi (alphabetical)
    const idx = domiciles.findIndex(d => d.name > 'Alberta');
    if (idx >= 0) domiciles.splice(idx, 0, alberta);
    else domiciles.push(alberta);
    fs.writeFileSync(DATA_FILE, JSON.stringify(domiciles, null, 2), 'utf8');
    console.log('Added Alberta to domiciles.json');
}
console.log(`domiciles.json has ${domiciles.length} entries`);

// 2. Update generator script - fix nav, footer, branding
let gen = fs.readFileSync(GEN_FILE, 'utf8');

// Fix nav: remove Regulatory and Compliance links
gen = gen.replace(/\s*<a class=.*?href="#">Regulatory<\/a>/g, '');
gen = gen.replace(/\s*<a class=.*?href="#">Compliance<\/a>/g, '');

// Fix nav branding
gen = gen.replace(/CanadianCaptive\n            <\/a>/g, 'CanadianCaptive.com\n            </a>');

// Fix footer branding
gen = gen.replace(/<div class="text-xl font-black text-slate-900 mb-6">CanadianCaptive<\/div>/g,
    '<div class="text-xl font-black text-slate-900 mb-6">CanadianCaptive.com</div>');

// Remove Office column from footer
gen = gen.replace(/\s*<div>\s*\n\s*<h4 class="font-bold text-slate-900 mb-6">Office<\/h4>[\s\S]*?Contact\s*\n\s*Us<\/a>\s*\n\s*<\/div>/g, '');

// Fix grid from 4 cols to 3 cols  
gen = gen.replace(/grid-cols-1 md:grid-cols-4 gap-12/g, 'grid-cols-1 md:grid-cols-3 gap-12');

// Fix copyright
gen = gen.replace(/&copy; 2024 CanadianCaptive Consultancy\. All rights\s*\n\s*reserved\.<\/p>/g,
    '&copy; 2026 CanadianCaptive.com. All rights\n                reserved. Powered by <a href="https://kevinday.ai" target="_blank" rel="noopener noreferrer" class="text-red-700 hover:underline">kevinday.ai</a></p>');

// Fix page titles
gen = gen.replace(/\| CanadianCaptive</g, '| CanadianCaptive.com<');

fs.writeFileSync(GEN_FILE, gen, 'utf8');
console.log('Updated generator script');

// 3. Remove old standalone alberta.html and british-columbia.html from root
const oldFiles = ['alberta.html', 'british-columbia.html'];
oldFiles.forEach(f => {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        console.log(`Removed old standalone ${f}`);
    }
});

console.log('Done! Now run: node scripts/generate-domiciles.js');
