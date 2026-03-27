/**
 * generate-domiciles.js
 * 
 * Reads data/domiciles.json and generates:
 *   1. Individual HTML pages for each domicile (in /domiciles/ directory)
 *   2. A domiciles directory page (domiciles.html) listing all domiciles
 * 
 * Usage:  node scripts/generate-domiciles.js
 * Run monthly (or whenever domiciles.json is updated) to regenerate pages.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'domiciles.json');
const DOMICILES_DIR = path.join(ROOT, 'domiciles');

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name) {
    return name.toLowerCase()
        .replace(/^the\s+/i, '')
        .replace(/[']/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function jurisdictionBadgeColor(jurisdiction) {
    const j = jurisdiction.toLowerCase();
    if (j.includes('canada')) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    if (j.includes('usa') || j.includes('us territory')) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    if (j.includes('eu') || j.includes('eea')) return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    if (j.includes('offshore')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
}

function jurisdictionCategory(jurisdiction) {
    const j = jurisdiction.toLowerCase();
    if (j.includes('canada')) return 'Canadian';
    if (j.includes('usa') && !j.includes('territory')) return 'United States';
    if (j.includes('usa territory') || j.includes('us territory')) return 'US Territories';
    if (j.includes('eu') || j.includes('eea')) return 'European';
    if (j.includes('offshore')) return 'Offshore / International';
    return 'Other Onshore';
}

function buildCapitalRows(minCapital) {
    return Object.entries(minCapital).map(([type, amount]) =>
        `                            <tr class="border-b border-outline-variant/10 last:border-0">
                                <td class="py-4 pr-8 text-on-surface font-medium">${type}</td>
                                <td class="py-4 text-secondary">${amount}</td>
                            </tr>`
    ).join('\n');
}

// ── Shared HTML Components ───────────────────────────────────────────────────

const TAILWIND_CONFIG = `tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "secondary-fixed-dim": "#b8c8db",
                        "on-error": "#ffffff",
                        "surface-container-highest": "#d3e4f7",
                        "tertiary-container": "#426bea",
                        "primary-fixed-dim": "#ffb3ae",
                        "on-secondary-fixed-variant": "#394857",
                        "error-container": "#ffdad6",
                        "on-tertiary-container": "#fffbff",
                        "on-background": "#0c1d2a",
                        "surface-variant": "#d3e4f7",
                        "on-primary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "surface-container": "#e2efff",
                        "primary": "#b41d25",
                        "on-primary-fixed-variant": "#930014",
                        "on-error-container": "#93000a",
                        "on-secondary": "#ffffff",
                        "tertiary-fixed": "#dce1ff",
                        "inverse-on-surface": "#e7f2ff",
                        "outline-variant": "#e3bebb",
                        "background": "#f7f9ff",
                        "tertiary": "#2250d0",
                        "secondary": "#506070",
                        "surface-tint": "#b72027",
                        "surface-bright": "#f7f9ff",
                        "primary-fixed": "#ffdad7",
                        "secondary-fixed": "#d3e4f7",
                        "error": "#ba1a1a",
                        "on-tertiary-fixed-variant": "#003ab1",
                        "on-surface-variant": "#5a403e",
                        "on-secondary-container": "#566676",
                        "on-primary-container": "#fffbff",
                        "on-primary-fixed": "#410004",
                        "inverse-primary": "#ffb3ae",
                        "surface-container-lowest": "#ffffff",
                        "secondary-container": "#d3e4f7",
                        "primary-container": "#d7383a",
                        "surface-container-high": "#d9eafd",
                        "surface-container-low": "#edf4ff",
                        "surface": "#f7f9ff",
                        "on-surface": "#0c1d2a",
                        "inverse-surface": "#223240",
                        "outline": "#8f706d",
                        "on-secondary-fixed": "#0c1d2a",
                        "tertiary-fixed-dim": "#b6c4ff",
                        "surface-dim": "#cbdcef",
                        "on-tertiary-fixed": "#001550"
                    },
                    fontFamily: {
                        "headline": ["Inter", "sans-serif"],
                        "body": ["Inter", "sans-serif"],
                        "label": ["Inter", "sans-serif"]
                    },
                    borderRadius: { "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem" },
                },
            },
        }`;

function buildNav(pathPrefix, activePage) {
    // pathPrefix: '' for root pages, '../' for /domiciles/ pages
    const homeActive = activePage === 'home';
    const domicilesActive = activePage === 'domiciles';

    return `    <nav class="fixed top-0 w-full z-50 glass-nav shadow-sm">
        <div class="flex justify-between items-center max-w-7xl mx-auto px-6 py-4">
            <a href="${pathPrefix}index.html" class="text-2xl font-bold tracking-tighter text-red-700 hover:opacity-80 transition-opacity">
                CanadianCaptive.com
            </a>
            <div class="hidden md:flex items-center gap-x-8">
                <a class="${homeActive ? 'text-red-700 font-semibold border-b-2 border-red-700 pb-1' : 'text-slate-600 hover:text-red-600 transition-colors'} font-sans antialiased tracking-tight"
                    href="${pathPrefix}index.html">Home</a>
                <a class="text-slate-600 hover:text-red-600 transition-colors font-sans antialiased tracking-tight"
                    href="#">Services</a>
                <div class="relative group">
                    <a class="${domicilesActive ? 'text-red-700 font-semibold border-b-2 border-red-700 pb-1' : 'text-slate-600 hover:text-red-600 transition-colors'} font-sans antialiased tracking-tight cursor-pointer flex items-center gap-1"
                        href="${pathPrefix}domiciles.html">Domiciles <span class="material-symbols-outlined text-sm">expand_more</span></a>
                    <div class="absolute top-full left-0 pt-2 hidden group-hover:block z-50">
                        <div class="bg-white rounded-xl shadow-lg border border-slate-200 py-2 min-w-[220px] max-h-[400px] overflow-y-auto">
                            <div class="px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-red-700">Canadian</div>
                            <a class="block px-5 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-slate-50 transition-colors"
                                href="${pathPrefix}domiciles/british-columbia.html">British Columbia</a>
                            <a class="block px-5 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-slate-50 transition-colors"
                                href="${pathPrefix}domiciles/alberta.html">Alberta</a>
                            <div class="border-t border-slate-100 my-1"></div>
                            <a class="block px-5 py-2.5 text-sm text-red-700 font-semibold hover:bg-red-50 transition-colors flex items-center gap-1"
                                href="${pathPrefix}domiciles.html">Browse All 60+ Domiciles <span class="material-symbols-outlined text-sm">arrow_forward</span></a>
                        </div>
                    </div>
                </div>
                <a class="text-slate-600 hover:text-red-600 transition-colors font-sans antialiased tracking-tight"
                    href="#">Regulatory</a>
                <a class="text-slate-600 hover:text-red-600 transition-colors font-sans antialiased tracking-tight"
                    href="#">Compliance</a>
            </div>
            <div class="flex items-center gap-6">
                <button
                    class="bg-primary text-on-primary px-6 py-2 rounded-xl font-semibold hover:opacity-90 transition-all scale-95 duration-200 ease-in-out">
                    Contact Us
                </button>
            </div>
        </div>
    </nav>`;
}

function buildFooter(pathPrefix) {
    return `    <footer class="w-full border-t border-slate-200 bg-slate-50">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto px-8 py-16">
            <div class="md:col-span-1">
                <div class="text-xl font-black text-slate-900 mb-6">CanadianCaptive.com</div>
                <p class="text-slate-500 text-sm leading-relaxed">
                    Setting the standard for excellence in Canadian captive insurance consultancy. Experts in risk
                    sovereignty and financial stability.
                </p>
            </div>
            <div>
                <h4 class="font-bold text-slate-900 mb-6">Services</h4>
                <ul class="space-y-4">
                    <li><a class="text-slate-500 hover:text-red-600 transition-colors text-sm"
                            href="${pathPrefix}feasibility-studies.html">Feasibility Studies</a></li>
                    <li><a class="text-slate-500 hover:text-red-600 transition-colors text-sm"
                            href="${pathPrefix}formation-structuring.html">Formation &amp; Structuring</a></li>
                    <li><a class="text-slate-500 hover:text-red-600 transition-colors text-sm"
                            href="${pathPrefix}captive-management.html">Captive Management</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold text-slate-900 mb-6">Legal</h4>
                <ul class="space-y-4">
                    <li><a class="text-slate-500 hover:text-red-600 transition-colors text-sm"
                            href="${pathPrefix}privacy-policy.html">Privacy Policy</a></li>
                    <li><a class="text-slate-500 hover:text-red-600 transition-colors text-sm"
                            href="${pathPrefix}terms-of-service.html">Terms of Service</a></li>
                </ul>
            </div>
        </div>
        <div class="max-w-7xl mx-auto px-8 py-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p class="text-slate-500 text-xs opacity-80">&copy; 2026 CanadianCaptive.com. All rights
                reserved. Powered by <a href="https://kevinday.ai" target="_blank" rel="noopener noreferrer" class="text-red-700 hover:underline">kevinday.ai</a></p>
            <div class="flex items-center gap-4">
                <a href="https://x.com/canadiancaptive" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-slate-700 transition-colors" aria-label="X (Twitter)">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://www.facebook.com/canadiancaptive" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-slate-700 transition-colors" aria-label="Facebook">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.linkedin.com/company/canadian-captive" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-slate-700 transition-colors" aria-label="LinkedIn">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
            </div>
        </div>
    </footer>`;
}

// ── Individual Domicile Page Template ────────────────────────────────────────

function generateDomicilePage(domicile, allDomiciles) {
    const badge = jurisdictionBadgeColor(domicile.jurisdiction);
    const capitalRows = buildCapitalRows(domicile.min_capital);
    const capitalCount = Object.keys(domicile.min_capital).length;
    const pathPrefix = '../';

    // Find prev/next domiciles for navigation
    const idx = allDomiciles.findIndex(d => d.name === domicile.name);
    const prev = idx > 0 ? allDomiciles[idx - 1] : null;
    const next = idx < allDomiciles.length - 1 ? allDomiciles[idx + 1] : null;

    return `<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>${domicile.name} Domicile | CanadianCaptive.com</title>
    <meta name="description" content="${domicile.summary.substring(0, 160).replace(/"/g, '&quot;')}..." />
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&amp;display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet" />
    <script id="tailwind-config">${TAILWIND_CONFIG}</script>
    <style>
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; display: inline-block; vertical-align: middle; }
        .horizon-line { height: 2px; background: linear-gradient(90deg, #b41d25 0%, transparent 100%); width: 40%; }
        .glass-nav { background-color: rgba(255, 255, 255, 0.8); backdrop-filter: blur(24px); }
    </style>
</head>
<body class="bg-surface font-body text-on-surface antialiased">
${buildNav(pathPrefix, 'domiciles')}

    <main class="pt-24">
        <!-- Hero Section -->
        <section class="relative py-20 md:py-32 overflow-hidden bg-surface">
            <div class="max-w-7xl mx-auto px-6">
                <div class="flex items-center gap-3 mb-6">
                    <a href="${pathPrefix}domiciles.html" class="text-secondary hover:text-primary transition-colors flex items-center gap-1 text-sm">
                        <span class="material-symbols-outlined text-sm">arrow_back</span> All Domiciles
                    </a>
                    <span class="text-outline-variant">/</span>
                    <span class="text-secondary text-sm">${domicile.name}</span>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div class="lg:col-span-8">
                        <div class="flex flex-wrap items-center gap-3 mb-6">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border}">
                                <span class="material-symbols-outlined text-sm">public</span>
                                ${domicile.jurisdiction}
                            </span>
                        </div>
                        <h1 class="text-5xl md:text-6xl font-headline font-extrabold tracking-tight text-on-surface leading-[1.1] mb-8">
                            ${domicile.name}
                        </h1>
                        <div class="horizon-line mb-8"></div>
                        <p class="text-lg md:text-xl text-secondary max-w-3xl leading-relaxed mb-10">
                            ${domicile.summary}
                        </p>
                        <div class="flex flex-wrap gap-4">
                            <button class="bg-primary text-on-primary px-8 py-4 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
                                Request ${domicile.name} Feasibility Study
                                <span class="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                    <div class="lg:col-span-4">
                        <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
                            <div class="bg-inverse-surface text-inverse-on-surface px-8 py-5">
                                <h3 class="font-bold text-lg">Quick Facts</h3>
                            </div>
                            <div class="px-8 py-6 space-y-5">
                                <div>
                                    <div class="text-xs font-label uppercase tracking-widest text-secondary mb-1">Jurisdiction</div>
                                    <div class="font-semibold text-on-surface">${domicile.jurisdiction}</div>
                                </div>
                                <div class="border-t border-outline-variant/10 pt-5">
                                    <div class="text-xs font-label uppercase tracking-widest text-secondary mb-1">Legislation</div>
                                    <div class="font-semibold text-on-surface">${domicile.legislation}</div>
                                </div>
                                <div class="border-t border-outline-variant/10 pt-5">
                                    <div class="text-xs font-label uppercase tracking-widest text-secondary mb-1">Tax Environment</div>
                                    <div class="font-semibold text-on-surface">${domicile.tax_notes}</div>
                                </div>
                                ${domicile.contact_name ? `<div class="border-t border-outline-variant/10 pt-5">
                                    <div class="text-xs font-label uppercase tracking-widest text-secondary mb-1">Contact</div>
                                    <div class="font-semibold text-on-surface">${domicile.contact_name}</div>
                                    ${domicile.contact_email ? `<a href="mailto:${domicile.contact_email}" class="text-primary text-sm hover:underline">${domicile.contact_email}</a>` : ''}
                                </div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="absolute top-0 right-0 w-1/3 h-full bg-surface-container-low -z-10 opacity-50"></div>
        </section>

        <!-- Capital Requirements Section -->
        <section class="py-24 bg-surface-container-low">
            <div class="max-w-7xl mx-auto px-6">
                <div class="mb-12">
                    <span class="text-primary font-label text-xs tracking-widest uppercase block mb-2">Financial Requirements</span>
                    <h2 class="text-3xl md:text-4xl font-headline font-bold text-on-surface mb-4">Minimum Capital &amp; Surplus</h2>
                    <div class="horizon-line"></div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div class="lg:col-span-7">
                        <div class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/10">
                            <table class="w-full text-left">
                                <thead>
                                    <tr class="border-b-2 border-primary/20">
                                        <th class="px-8 py-5 text-xs font-label uppercase tracking-widest text-primary">Structure Type</th>
                                        <th class="px-8 py-5 text-xs font-label uppercase tracking-widest text-primary">Minimum Capital</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-outline-variant/10">
${capitalRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="lg:col-span-5 space-y-6">
                        <div class="bg-surface-container-lowest p-8 rounded-xl border-l-4 border-primary">
                            <div class="flex items-start gap-4">
                                <span class="material-symbols-outlined text-primary mt-1">info</span>
                                <div>
                                    <h3 class="text-lg font-bold text-on-surface mb-2">Regulatory Framework</h3>
                                    <p class="text-secondary leading-relaxed">${domicile.legislation}</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-surface-container-lowest p-8 rounded-xl">
                            <div class="flex items-start gap-4">
                                <span class="material-symbols-outlined text-primary mt-1">account_balance_wallet</span>
                                <div>
                                    <h3 class="text-lg font-bold text-on-surface mb-2">Tax Environment</h3>
                                    <p class="text-secondary leading-relaxed">${domicile.tax_notes}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Prev/Next Navigation -->
        <section class="py-12 bg-surface border-t border-outline-variant/10">
            <div class="max-w-7xl mx-auto px-6">
                <div class="flex justify-between items-center">
                    ${prev ? `<a href="${slugify(prev.name)}.html" class="flex items-center gap-2 text-secondary hover:text-primary transition-colors group">
                        <span class="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        <div>
                            <div class="text-xs uppercase tracking-wider opacity-60">Previous</div>
                            <div class="font-semibold">${prev.name}</div>
                        </div>
                    </a>` : '<div></div>'}
                    ${next ? `<a href="${slugify(next.name)}.html" class="flex items-center gap-2 text-secondary hover:text-primary transition-colors text-right group">
                        <div>
                            <div class="text-xs uppercase tracking-wider opacity-60">Next</div>
                            <div class="font-semibold">${next.name}</div>
                        </div>
                        <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </a>` : '<div></div>'}
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="py-24">
            <div class="max-w-7xl mx-auto px-6">
                <div class="bg-on-surface text-surface rounded-2xl overflow-hidden relative">
                    <div class="p-12 md:p-20 text-center max-w-3xl mx-auto">
                        <h2 class="text-4xl font-headline font-extrabold mb-6 tracking-tight">Considering ${domicile.name} for Your Captive?</h2>
                        <p class="text-secondary-fixed-dim text-lg mb-10">Our consultants provide end-to-end guidance on domicile selection, feasibility, and formation. Let us help you determine if ${domicile.name} is the right fit.</p>
                        <div class="flex flex-col sm:flex-row justify-center gap-4">
                            <button class="bg-white text-on-surface px-10 py-4 rounded-xl font-bold hover:bg-surface-container-low transition-all">
                                Schedule a Consultation
                            </button>
                            <a href="${pathPrefix}domiciles.html" class="border border-white/30 text-white px-10 py-4 rounded-xl font-bold hover:bg-white/10 transition-all inline-flex items-center justify-center">
                                Compare Other Domiciles
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

${buildFooter(pathPrefix)}
</body>
</html>`;
}

// ── Directory Page Template ──────────────────────────────────────────────────

function generateDirectoryPage(domiciles) {
    // Group by category
    const groups = {};
    domiciles.forEach(d => {
        const cat = jurisdictionCategory(d.jurisdiction);
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(d);
    });

    // Order: Canadian first, then USA, US Territories, European, Offshore, Other
    const categoryOrder = ['Canadian', 'United States', 'US Territories', 'European', 'Offshore / International', 'Other Onshore'];
    const categoryIcons = {
        'Canadian': 'flag',
        'United States': 'account_balance',
        'US Territories': 'map',
        'European': 'euro',
        'Offshore / International': 'public',
        'Other Onshore': 'location_on',
    };

    let sectionsHTML = '';
    for (const cat of categoryOrder) {
        const items = groups[cat];
        if (!items || items.length === 0) continue;
        const icon = categoryIcons[cat] || 'public';
        const cardsHTML = items.map(d => {
            const slug = slugify(d.name);
            const badge = jurisdictionBadgeColor(d.jurisdiction);
            const firstCapitalKey = Object.keys(d.min_capital)[0];
            const firstCapitalVal = d.min_capital[firstCapitalKey];
            return `
                    <a href="domiciles/${slug}.html"
                        class="bg-surface-container-lowest p-8 rounded-xl hover:shadow-md transition-all group border border-outline-variant/10 block">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">${d.name}</h3>
                            <span class="material-symbols-outlined text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all text-sm">arrow_forward</span>
                        </div>
                        <span class="inline-block px-2 py-0.5 rounded text-[0.65rem] font-semibold uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border} border mb-3">${d.jurisdiction}</span>
                        <p class="text-secondary text-sm leading-relaxed mb-4 line-clamp-2">${d.summary.substring(0, 140)}...</p>
                        <div class="text-xs text-on-surface-variant">
                            <span class="font-semibold">${firstCapitalKey}:</span> ${firstCapitalVal}
                        </div>
                    </a>`;
        }).join('\n');

        sectionsHTML += `
            <div class="mb-16" id="${cat.toLowerCase().replace(/[^a-z]+/g, '-')}">
                <div class="flex items-center gap-3 mb-8">
                    <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary">${icon}</span>
                    </div>
                    <h2 class="text-2xl font-headline font-bold text-on-surface">${cat}</h2>
                    <span class="text-sm text-secondary">(${items.length} domicile${items.length > 1 ? 's' : ''})</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
${cardsHTML}
                </div>
            </div>`;
    }

    // Quick-jump pills
    const jumpPills = categoryOrder
        .filter(cat => groups[cat] && groups[cat].length > 0)
        .map(cat => {
            const id = cat.toLowerCase().replace(/[^a-z]+/g, '-');
            const count = groups[cat].length;
            return `<a href="#${id}" class="px-4 py-2 rounded-full text-sm font-medium border border-outline-variant/20 text-secondary hover:text-primary hover:border-primary/30 transition-all">${cat} (${count})</a>`;
        }).join('\n                    ');

    return `<!DOCTYPE html>
<html class="scroll-smooth light" lang="en">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Global Captive Domiciles | CanadianCaptive.com</title>
    <meta name="description" content="Explore 60+ captive insurance domiciles worldwide. Compare jurisdictions, capital requirements, and tax environments to find the right home for your captive." />
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&amp;display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet" />
    <script id="tailwind-config">${TAILWIND_CONFIG}</script>
    <style>
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; display: inline-block; vertical-align: middle; }
        .horizon-line { height: 2px; background: linear-gradient(90deg, #b41d25 0%, transparent 100%); width: 40%; }
        .glass-nav { background-color: rgba(255, 255, 255, 0.8); backdrop-filter: blur(24px); }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    </style>
</head>
<body class="bg-surface font-body text-on-surface antialiased">
${buildNav('', 'domiciles')}

    <main class="pt-24">
        <!-- Hero -->
        <section class="py-20 md:py-28 bg-surface">
            <div class="max-w-7xl mx-auto px-6">
                <div class="mb-6 flex items-center gap-4">
                    <div class="h-px w-12 bg-primary"></div>
                    <span class="text-secondary font-label text-xs tracking-widest uppercase">Global Directory</span>
                </div>
                <h1 class="text-5xl md:text-6xl font-headline font-extrabold tracking-tight text-on-surface leading-[1.1] mb-6">
                    Captive Insurance <span class="text-primary">Domiciles</span>
                </h1>
                <div class="horizon-line mb-8"></div>
                <p class="text-lg md:text-xl text-secondary max-w-3xl leading-relaxed mb-10">
                    Explore over 60 domiciles worldwide. Each jurisdiction offers unique regulatory frameworks, capital requirements, and tax environments &mdash; our consultants help you find the optimal fit for your organization.
                </p>
                <div class="flex flex-wrap gap-3">
                    ${jumpPills}
                </div>
            </div>
        </section>

        <!-- Domicile Grid -->
        <section class="py-16 bg-surface-container-low">
            <div class="max-w-7xl mx-auto px-6">
${sectionsHTML}
            </div>
        </section>

        <!-- CTA -->
        <section class="py-24 bg-surface">
            <div class="max-w-7xl mx-auto px-6">
                <div class="bg-on-surface text-surface rounded-2xl overflow-hidden relative">
                    <div class="p-12 md:p-20 text-center max-w-3xl mx-auto">
                        <h2 class="text-4xl font-headline font-extrabold mb-6 tracking-tight">Not Sure Which Domicile Is Right?</h2>
                        <p class="text-secondary-fixed-dim text-lg mb-10">Our domicile selection analysis compares jurisdictions head-to-head based on your unique corporate profile, risk appetite, and strategic objectives.</p>
                        <button class="bg-white text-on-surface px-10 py-4 rounded-xl font-bold hover:bg-surface-container-low transition-all">
                            Schedule a Domicile Consultation
                        </button>
                    </div>
                </div>
            </div>
        </section>
    </main>

${buildFooter('')}
</body>
</html>`;
}

// ── Main Execution ───────────────────────────────────────────────────────────

console.log('Reading domicile data...');
const domiciles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
console.log(`Found ${domiciles.length} domiciles.`);

// Ensure output directory
if (!fs.existsSync(DOMICILES_DIR)) {
    fs.mkdirSync(DOMICILES_DIR, { recursive: true });
}

// Generate individual pages
domiciles.forEach((domicile) => {
    const slug = slugify(domicile.name);
    const filename = `${slug}.html`;
    const filepath = path.join(DOMICILES_DIR, filename);
    const html = generateDomicilePage(domicile, domiciles);
    fs.writeFileSync(filepath, html, 'utf-8');
    console.log(`  ✓ ${filename}`);
});

// Generate directory page
const directoryPath = path.join(ROOT, 'domiciles.html');
const directoryHtml = generateDirectoryPage(domiciles);
fs.writeFileSync(directoryPath, directoryHtml, 'utf-8');
console.log(`  ✓ domiciles.html (directory)`);

console.log(`\nDone! Generated ${domiciles.length} domicile pages + 1 directory page.`);
