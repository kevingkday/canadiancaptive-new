// Add SEO OG/canonical tags to domicile page templates in the generator
const fs = require('fs');
const path = require('path');

const genPath = path.join(__dirname, 'generate-domiciles.js');
let gen = fs.readFileSync(genPath, 'utf8');

// For individual domicile pages - add OG & canonical before <title>
const domicileOgTags = `<meta name="keywords" content="\${domicile.name} captive insurance, \${domicile.jurisdiction} domicile, captive formation" />
    <link rel="canonical" href="https://canadiancaptive.com/domiciles/\${slugify(domicile.name)}.html" />
    <meta property="og:title" content="\${domicile.name} Captive Insurance Domicile | CanadianCaptive.com" />
    <meta property="og:description" content="\${domicile.summary.substring(0, 160).replace(/"/g, '&quot;')}..." />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://canadiancaptive.com/domiciles/\${slugify(domicile.name)}.html" />
    <meta property="og:site_name" content="CanadianCaptive.com" />
    `;

// Insert before the first <title> in the individual domicile template
gen = gen.replace(
    '<title>${domicile.name} Domicile | CanadianCaptive.com</title>',
    domicileOgTags + '<title>${domicile.name} Domicile | CanadianCaptive.com</title>'
);

// For directory page - add OG & canonical before <title>
const directoryOgTags = `<link rel="canonical" href="https://canadiancaptive.com/domiciles.html" />
    <meta property="og:title" content="Global Captive Domiciles | CanadianCaptive.com" />
    <meta property="og:description" content="Explore 60+ captive insurance domiciles worldwide. Compare jurisdictions, capital requirements, and tax environments." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://canadiancaptive.com/domiciles.html" />
    <meta property="og:site_name" content="CanadianCaptive.com" />
    `;

gen = gen.replace(
    '<title>Global Captive Domiciles | CanadianCaptive.com</title>',
    directoryOgTags + '<title>Global Captive Domiciles | CanadianCaptive.com</title>'
);

fs.writeFileSync(genPath, gen, 'utf8');
console.log('Added OG/canonical tags to generator templates');
