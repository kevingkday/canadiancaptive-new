/**
 * seo-optimize.js
 * Generates sitemap.xml, robots.txt, and adds missing SEO tags to all pages.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOMAIN = 'https://canadiancaptive.com';
const TODAY = new Date().toISOString().split('T')[0];

// ── 1. Generate sitemap.xml ─────────────────────────────────────────────────

function findHtmlFiles(dir, base = '') {
    let results = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !['node_modules', '.git', 'scripts', 'data', '.github'].includes(item)) {
            results = results.concat(findHtmlFiles(fullPath, base + item + '/'));
        } else if (item.endsWith('.html')) {
            results.push({
                url: base + item,
                lastmod: stat.mtime.toISOString().split('T')[0],
                priority: getPriority(base + item),
                changefreq: getChangefreq(base + item)
            });
        }
    }
    return results;
}

function getPriority(page) {
    if (page === 'index.html') return '1.0';
    if (page === 'domiciles.html') return '0.9';
    if (page.match(/^(feasibility|formation|captive-management)/)) return '0.8';
    if (page.startsWith('domiciles/') && page.includes('british-columbia')) return '0.85';
    if (page.startsWith('domiciles/') && page.includes('alberta')) return '0.85';
    if (page.startsWith('domiciles/')) return '0.7';
    if (page.match(/^(privacy|terms)/)) return '0.3';
    return '0.5';
}

function getChangefreq(page) {
    if (page === 'index.html') return 'weekly';
    if (page === 'domiciles.html') return 'weekly';
    if (page.startsWith('domiciles/')) return 'monthly';
    return 'monthly';
}

const pages = findHtmlFiles(ROOT);
pages.sort((a, b) => parseFloat(b.priority) - parseFloat(a.priority));

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

for (const page of pages) {
    const loc = page.url === 'index.html' ? DOMAIN + '/' : `${DOMAIN}/${page.url}`;
    sitemap += `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
}

sitemap += `</urlset>`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
console.log(`✓ sitemap.xml (${pages.length} URLs)`);

// ── 2. Generate robots.txt ──────────────────────────────────────────────────

const robots = `User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml

# Block utility scripts and data
Disallow: /scripts/
Disallow: /data/
`;
fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots, 'utf8');
console.log('✓ robots.txt');

// ── 3. Add missing SEO tags to root pages ───────────────────────────────────

const seoMeta = {
    'index.html': {
        description: 'CanadianCaptive.com provides expert captive insurance consultancy for Canadian enterprises. Feasibility studies, formation, structuring, and ongoing captive management across 60+ global domiciles.',
        keywords: 'captive insurance, Canadian captive, risk management, feasibility study, captive formation, captive management, alternative risk transfer, insurance domicile',
        ogTitle: 'CanadianCaptive.com | Expert Captive Insurance Consultancy',
        ogType: 'website',
    },
    'domiciles.html': {
        description: 'Explore 60+ captive insurance domiciles worldwide. Compare jurisdictions, capital requirements, tax environments, and regulatory frameworks to find the optimal home for your captive.',
        keywords: 'captive insurance domiciles, insurance jurisdictions, offshore captive, onshore captive, captive domicile comparison',
    },
    'feasibility-studies.html': {
        description: 'Rigorous actuarial and strategic analysis to determine whether a captive insurance vehicle aligns with your organization\'s risk profile, financial objectives, and growth trajectory.',
        keywords: 'captive feasibility study, actuarial analysis, captive insurance assessment, risk analysis, captive viability',
    },
    'formation-structuring.html': {
        description: 'Expert guidance on captive insurance entity formation, corporate structuring, and regulatory compliance across Canadian and international jurisdictions.',
        keywords: 'captive formation, captive structuring, insurance company formation, captive entity setup, regulatory compliance',
    },
    'captive-management.html': {
        description: 'Comprehensive ongoing captive insurance management services including compliance, financial reporting, regulatory filings, and strategic oversight.',
        keywords: 'captive management, captive insurance administration, regulatory compliance, financial reporting, captive oversight',
    },
    'privacy-policy.html': {
        description: 'Privacy Policy for CanadianCaptive.com - Learn how we collect, use, and protect your personal information.',
    },
    'terms-of-service.html': {
        description: 'Terms of Service for CanadianCaptive.com - Read our terms and conditions for using our captive insurance consultancy services.',
    },
};

let updatedCount = 0;
for (const [filename, meta] of Object.entries(seoMeta)) {
    const filepath = path.join(ROOT, filename);
    if (!fs.existsSync(filepath)) continue;

    let content = fs.readFileSync(filepath, 'utf8');
    let changed = false;

    // Add meta description if missing
    if (meta.description && !content.includes('meta name="description"')) {
        content = content.replace(
            /<title>/,
            `<meta name="description" content="${meta.description}" />\n    <title>`
        );
        changed = true;
    }

    // Add meta keywords if missing
    if (meta.keywords && !content.includes('meta name="keywords"')) {
        content = content.replace(
            /<title>/,
            `<meta name="keywords" content="${meta.keywords}" />\n    <title>`
        );
        changed = true;
    }

    // Add canonical URL
    if (!content.includes('rel="canonical"')) {
        const canonicalUrl = filename === 'index.html' ? DOMAIN + '/' : `${DOMAIN}/${filename}`;
        content = content.replace(
            /<title>/,
            `<link rel="canonical" href="${canonicalUrl}" />\n    <title>`
        );
        changed = true;
    }

    // Add Open Graph tags if missing
    if (!content.includes('og:title')) {
        const ogTitle = meta.ogTitle || content.match(/<title>(.*?)<\/title>/)?.[1] || 'CanadianCaptive.com';
        const ogDesc = meta.description || '';
        const ogType = meta.ogType || 'article';
        const canonicalUrl = filename === 'index.html' ? DOMAIN + '/' : `${DOMAIN}/${filename}`;
        const ogTags = `<meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDesc}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:site_name" content="CanadianCaptive.com" />`;
        content = content.replace(/<title>/, ogTags + '\n    <title>');
        changed = true;
    }

    // Add sitemap link in head if missing
    if (!content.includes('sitemap')) {
        // Skip - sitemap reference is in robots.txt
    }

    if (changed) {
        fs.writeFileSync(filepath, content, 'utf8');
        updatedCount++;
        console.log(`✓ SEO tags added: ${filename}`);
    }
}

// ── 4. Add structured data (JSON-LD) to index.html ──────────────────────────

const indexPath = path.join(ROOT, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

if (!indexContent.includes('application/ld+json')) {
    const jsonLd = `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "CanadianCaptive.com",
        "description": "Expert captive insurance consultancy for Canadian enterprises. Feasibility studies, formation, structuring, and ongoing captive management.",
        "url": "${DOMAIN}",
        "areaServed": "Canada",
        "serviceType": ["Captive Insurance Consulting", "Feasibility Studies", "Captive Formation", "Captive Management"],
        "knowsAbout": ["Captive Insurance", "Risk Management", "Alternative Risk Transfer", "Insurance Domicile Selection"],
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Vancouver",
            "addressRegion": "BC",
            "addressCountry": "CA"
        }
    }
    </script>`;
    indexContent = indexContent.replace('</head>', jsonLd + '\n</head>');
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log('✓ JSON-LD structured data added to index.html');
}

console.log(`\nDone! SEO optimized ${updatedCount} pages, created sitemap.xml and robots.txt`);
