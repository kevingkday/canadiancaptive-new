/**
 * generate-service-providers.js
 * 
 * Reads data/service-providers.json and generates:
 *   1. A service providers directory page (service-providers.html)
 * 
 * Usage:  node scripts/generate-service-providers.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'service-providers.json');
const OUTPUT_FILE = path.join(ROOT, 'service-providers.html');

// Helper to escape values safely
function escapeTemplateValue(value) {
    if (!value) return '';
    return String(value)
        .replace(/`/g, '&#96;')
        .replace(/\$\{/g, '&#36;{');
}

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

function buildNav() {
    return `    <nav class="fixed top-0 w-full z-50 glass-nav shadow-sm">
        <div class="flex justify-between items-center max-w-7xl mx-auto px-6 py-4">
            <a href="index.html" class="text-2xl font-bold tracking-tighter text-red-700 hover:opacity-80 transition-opacity">
                CanadianCaptive.com
            </a>
            <div class="hidden md:flex items-center gap-x-8">
                <a class="text-slate-600 hover:text-red-600 transition-colors font-sans antialiased tracking-tight"
                    href="index.html">Home</a>
                <a class="text-slate-600 hover:text-red-600 transition-colors font-sans antialiased tracking-tight"
                    href="index.html#services">Captive Lifecycle Phases</a>
                <a class="text-slate-600 hover:text-red-600 transition-colors font-sans antialiased tracking-tight"
                    href="captive-advantages.html">Captive Advantages</a>
                <div class="relative group">
                    <a class="text-slate-600 hover:text-red-600 transition-colors font-sans antialiased tracking-tight cursor-pointer flex items-center gap-1"
                        href="domiciles.html">Domiciles <span class="material-symbols-outlined text-sm">expand_more</span></a>
                    <div class="absolute top-full left-0 pt-2 hidden group-hover:block z-50">
                        <div class="bg-white rounded-xl shadow-lg border border-slate-200 py-2 min-w-[220px] max-h-[400px] overflow-y-auto">
                            <div class="px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-red-700">Canadian</div>
                            <a class="block px-5 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-slate-50 transition-colors"
                                href="domiciles/british-columbia.html">British Columbia</a>
                            <a class="block px-5 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-slate-50 transition-colors"
                                href="domiciles/alberta.html">Alberta</a>
                            <div class="border-t border-slate-100 my-1"></div>
                            <a class="block px-5 py-2.5 text-sm text-red-700 font-semibold hover:bg-red-50 transition-colors flex items-center gap-1"
                                href="domiciles.html">Browse All 60+ Domiciles <span class="material-symbols-outlined text-sm">arrow_forward</span></a>
                        </div>
                    </div>
                </div>
                <a class="text-red-700 font-semibold border-b-2 border-red-700 pb-1 font-sans antialiased tracking-tight"
                    href="service-providers.html">Service Providers</a>
            </div>
            <div class="flex items-center gap-6">
                <a href="index.html#contact"
                    class="bg-primary text-on-primary px-6 py-2 rounded-xl font-semibold hover:opacity-90 transition-all scale-95 duration-200 ease-in-out">
                    Contact Us
                </a>
            </div>
        </div>
    </nav>`;
}

function buildFooter() {
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
                            href="feasibility-studies.html">Feasibility Studies</a></li>
                    <li><a class="text-slate-500 hover:text-red-600 transition-colors text-sm"
                            href="formation-structuring.html">Formation &amp; Structuring</a></li>
                    <li><a class="text-slate-500 hover:text-red-600 transition-colors text-sm"
                            href="captive-management.html">Captive Management</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold text-slate-900 mb-6">Legal</h4>
                <ul class="space-y-4">
                    <li><a class="text-slate-500 hover:text-red-600 transition-colors text-sm"
                            href="privacy-policy.html">Privacy Policy</a></li>
                    <li><a class="text-slate-500 hover:text-red-600 transition-colors text-sm"
                            href="terms-of-service.html">Terms of Service</a></li>
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

function buildProviderCard(p) {
    const verificationBadge = p.verified 
        ? `<span class="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
               <span class="material-symbols-outlined text-[12px] font-bold">verified</span> Verified
           </span>`
        : '';

    return `            <div class="provider-card bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all" data-category="${escapeTemplateValue(p.category)}" data-name="${escapeTemplateValue(p.name).toLowerCase()}">
                <div>
                    <div class="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <span class="inline-block bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold tracking-wide border border-slate-200 mb-2">${escapeTemplateValue(p.category)}</span>
                            <h3 class="font-headline font-bold text-xl text-on-surface leading-tight">${escapeTemplateValue(p.name)}</h3>
                        </div>
                        ${verificationBadge}
                    </div>
                    <p class="text-secondary text-sm leading-relaxed mb-6">${escapeTemplateValue(p.description)}</p>
                    <div class="space-y-2.5 border-t border-outline-variant/10 pt-4 mb-6 text-sm">
                        <div class="flex items-center gap-2 text-secondary">
                            <span class="material-symbols-outlined text-base">location_on</span>
                            <span>${escapeTemplateValue(p.headquarters)}</span>
                        </div>
                        ${p.contact_email ? `
                        <div class="flex items-center gap-2 text-secondary">
                            <span class="material-symbols-outlined text-base">mail</span>
                            <a href="mailto:${escapeTemplateValue(p.contact_email)}" class="hover:text-primary transition-colors hover:underline">${escapeTemplateValue(p.contact_email)}</a>
                        </div>` : ''}
                        ${p.contact_phone ? `
                        <div class="flex items-center gap-2 text-secondary">
                            <span class="material-symbols-outlined text-base">phone</span>
                            <span>${escapeTemplateValue(p.contact_phone)}</span>
                        </div>` : ''}
                    </div>
                </div>
                <a href="${escapeTemplateValue(p.website)}" target="_blank" rel="noopener noreferrer" class="w-full text-center border border-primary/30 text-primary px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary hover:text-on-primary transition-all inline-flex items-center justify-center gap-1.5">
                    Visit Website
                    <span class="material-symbols-outlined text-sm">open_in_new</span>
                </a>
            </div>`;
}

function generatePage() {
    console.log('Reading service provider data...');
    if (!fs.existsSync(DATA_FILE)) {
        console.error('Data file not found!');
        process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    // Categories list for filters
    const categories = [
        "All Specialties",
        "Captive Manager",
        "Actuary",
        "Legal Advisor",
        "Auditor & Accountant",
        "Reinsurance Broker",
        "Fronting Carrier"
    ];

    const cardsHtml = data.map(buildProviderCard).join('\n');

    const html = `<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XW6PXCXNZC"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XW6PXCXNZC');
    </script>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <meta name="description" content="Discover verified captive insurance service providers for Canadian companies, including captive managers, actuarial consultants, fronting carriers, and legal advisors." />
    <meta name="keywords" content="captive manager, captive insurance actuary, fronting carrier, captive insurance auditor, Willis Towers Watson, Milliman, Marsh, SRS" />
    <link rel="canonical" href="https://canadiancaptive.com/service-providers.html" />
    <title>Verified Service Provider Directory | CanadianCaptive.com</title>
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
${buildNav()}

    <main class="pt-24">
        <!-- Hero Section -->
        <section class="py-20 md:py-28 bg-surface relative overflow-hidden">
            <div class="max-w-7xl mx-auto px-6 relative z-10 text-center max-w-3xl">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-50 border border-red-200 text-red-700 mb-6">
                    <span class="material-symbols-outlined text-sm">handshake</span> Verified Directory
                </span>
                <h1 class="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface leading-tight mb-6">
                    Captive Insurance Service Providers
                </h1>
                <div class="horizon-line mx-auto mb-6"></div>
                <p class="text-lg md:text-xl text-secondary leading-relaxed">
                    Connect with industry-leading captive managers, actuaries, fronting carriers, legal specialists, and auditors supporting Canadian risk management structures.
                </p>
            </div>
            <div class="absolute top-0 right-0 w-1/3 h-full bg-surface-container-low -z-10 opacity-30"></div>
        </section>

        <!-- Search & Filter Controls -->
        <section class="pb-24 bg-surface">
            <div class="max-w-7xl mx-auto px-6">
                <div class="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant/10 mb-10 flex flex-col md:flex-row gap-6 justify-between items-center">
                    <div class="relative w-full md:max-w-md">
                        <span class="material-symbols-outlined absolute left-3.5 top-3 text-slate-400">search</span>
                        <input type="text" id="search-box" oninput="filterProviders()" placeholder="Search providers by name..." class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-700">
                    </div>
                    <!-- Categories (Horizontal Scroll on Mobile) -->
                    <div class="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-thin">
${categories.map((c, i) => `                        <button onclick="selectCategory('${escapeTemplateValue(c)}', this)" class="category-btn px-4 py-2 rounded-lg text-sm font-medium border transition-all ${i === 0 ? 'bg-primary text-on-primary border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'} whitespace-nowrap">${escapeTemplateValue(c)}</button>`).join('\n')}
                    </div>
                </div>

                <!-- Cards Grid -->
                <div id="providers-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
${cardsHtml}
                </div>

                <!-- Empty State -->
                <div id="empty-state" class="hidden text-center py-20 bg-white border border-outline-variant/10 rounded-2xl shadow-sm">
                    <span class="material-symbols-outlined text-slate-300 text-6xl mb-4">person_search</span>
                    <h3 class="font-headline font-bold text-xl mb-2 text-on-surface">No Service Providers Found</h3>
                    <p class="text-secondary text-sm">Try broadening your search term or selecting a different specialty category.</p>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="py-24 bg-surface-container-low border-t border-outline-variant/10">
            <div class="max-w-7xl mx-auto px-6 text-center max-w-2xl">
                <h2 class="text-3xl font-headline font-bold mb-4 text-on-surface">Are you a Captive Service Provider?</h2>
                <p class="text-secondary mb-8 leading-relaxed">Join our independent directory to help Canadian risk managers and financial officers discover your firm during their feasibility and formation lifecycle phases.</p>
                <a href="index.html#contact" class="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center gap-2">
                    Request a Verified Listing
                    <span class="material-symbols-outlined">add_circle</span>
                </a>
            </div>
        </section>
    </main>

${buildFooter()}

    <script>
        let activeCategory = 'All Specialties';

        function filterProviders() {
            const query = document.getElementById('search-box').value.toLowerCase();
            const cards = document.querySelectorAll('.provider-card');
            let visibleCount = 0;

            cards.forEach(card => {
                const name = card.getAttribute('data-name');
                const category = card.getAttribute('data-category');
                
                const matchesSearch = !query || name.includes(query);
                const matchesCategory = activeCategory === 'All Specialties' || category === activeCategory;

                if (matchesSearch && matchesCategory) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            const emptyState = document.getElementById('empty-state');
            if (visibleCount === 0) {
                emptyState.classList.remove('hidden');
                document.getElementById('providers-grid').classList.add('hidden');
            } else {
                emptyState.classList.add('hidden');
                document.getElementById('providers-grid').classList.remove('hidden');
            }
        }

        function selectCategory(cat, btn) {
            activeCategory = cat;
            
            // Toggle active classes on buttons
            document.querySelectorAll('.category-btn').forEach(b => {
                b.className = 'category-btn px-4 py-2 rounded-lg text-sm font-medium border transition-all bg-white text-slate-600 border-slate-200 hover:border-slate-300 whitespace-nowrap';
            });
            btn.className = 'category-btn px-4 py-2 rounded-lg text-sm font-medium border transition-all bg-primary text-on-primary border-primary whitespace-nowrap';

            filterProviders();
        }
    </script>
</body>
</html>`;

    fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
    console.log(`Successfully generated ${OUTPUT_FILE}`);
}

generatePage();
