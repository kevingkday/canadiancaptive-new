/**
 * admin.js
 * 
 * Local zero-dependency web server for managing domicile information.
 * Serves an interactive visual form at http://localhost:3000 to edit JSON data
 * and auto-triggers static page generation on save.
 * 
 * Secure password protection is enabled for all write/read API endpoints.
 * Run command: node scripts/admin.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'domiciles.json');
const REBUILD_SCRIPT = path.join(ROOT, 'scripts', 'generate-domiciles.js');

// Set your password here or specify it as an environment variable (e.g. ADMIN_PASSWORD=mysecret)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'canadian-captive-2026';

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 1. Serve the frontend console (No password required to fetch the HTML itself)
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getAdminHtml());
        return;
    }

    // 2. Authenticate API endpoints
    const authHeader = req.headers['authorization'];
    if (authHeader !== ADMIN_PASSWORD) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized. Invalid password.' }));
        return;
    }

    // 3. API: Load Domiciles
    if (req.method === 'GET' && req.url === '/api/domiciles') {
        fs.readFile(DATA_FILE, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to read data file' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
        return;
    }

    // 4. API: Save Domicile & Rebuild
    if (req.method === 'POST' && req.url === '/api/save') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                if (!payload.slug || !payload.name) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Name and Slug are required' }));
                    return;
                }

                fs.readFile(DATA_FILE, 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to read data file for saving' }));
                        return;
                    }

                    let domiciles = JSON.parse(data);
                    const idx = domiciles.findIndex(d => d.slug === payload.slug || d.name === payload.name);
                    
                    if (idx === -1) {
                        domiciles.push(payload);
                    } else {
                        // Merge properties to preserve any missing values not editable in form
                        domiciles[idx] = { ...domiciles[idx], ...payload };
                    }

                    // Sort alphabetically by name
                    domiciles.sort((a, b) => a.name.localeCompare(b.name));

                    fs.writeFile(DATA_FILE, JSON.stringify(domiciles, null, 2), 'utf8', err => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to write updated data file' }));
                            return;
                        }

                        // Run rebuild script
                        exec(`node "${REBUILD_SCRIPT}"`, (execErr, stdout, stderr) => {
                            if (execErr) {
                                console.error('Rebuild failed:', execErr);
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ 
                                    success: true, 
                                    warning: 'Data saved, but page rebuild failed. Check terminal logs.',
                                    rebuildError: execErr.message
                                }));
                                return;
                            }
                            console.log('Rebuild output:', stdout);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true, message: 'Data saved and pages rebuilt successfully!' }));
                        });
                    });
                });
            } catch (parseErr) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` Domicile Data Manager is running locally!`);
    console.log(` Access interface: http://localhost:${PORT}`);
    console.log(` Default Password: canadian-captive-2026`);
    console.log(` Press Ctrl+C to shut down the server.`);
    console.log(`==================================================`);
});

function getAdminHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Domicile Data Manager | CanadianCaptive</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col">
    <!-- Login Overlay -->
    <div id="login-overlay" class="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50">
        <div class="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-slate-200 text-center">
            <span class="material-symbols-outlined text-red-700 text-5xl mb-4">lock</span>
            <h2 class="text-2xl font-bold text-slate-900 mb-2">Password Protected</h2>
            <p class="text-sm text-slate-500 mb-6">Enter password to manage CanadianCaptive Domiciles.</p>
            
            <form onsubmit="tryLogin(event)" class="space-y-4">
                <input type="password" id="login-password" required placeholder="Enter password" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-red-700">
                <button type="submit" id="btn-login" class="w-full bg-red-700 text-white font-semibold py-2.5 rounded-lg hover:bg-red-800 shadow transition-all">
                    Unlock Console
                </button>
            </form>
            <p id="login-error" class="text-xs text-red-600 font-semibold mt-3 hidden"></p>
        </div>
    </div>

    <!-- Header -->
    <header class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-red-700 text-3xl font-bold">gavel</span>
            <div>
                <h1 class="text-xl font-bold text-slate-900">Domicile Data Manager</h1>
                <p class="text-xs text-slate-500">CanadianCaptive.com Local Admin Console</p>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <span id="status-toast" class="hidden text-sm font-medium px-4 py-2 rounded-lg"></span>
            <button onclick="saveCurrentDomicile()" id="btn-save" class="bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-red-800 shadow transition-all disabled:opacity-50">
                <span class="material-symbols-outlined text-lg">save</span> Save &amp; Rebuild Pages
            </button>
        </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar -->
        <aside class="w-80 border-r border-slate-200 bg-white flex flex-col sticky top-16 h-[calc(100vh-4.5rem)]">
            <div class="p-4 border-b border-slate-100">
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                    <input type="text" id="search-input" oninput="filterDomiciles()" placeholder="Search 68 domiciles..." class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-700">
                </div>
            </div>
            <div id="domiciles-list" class="flex-1 overflow-y-auto divide-y divide-slate-100">
                <!-- Filled dynamically -->
            </div>
        </aside>

        <!-- Main Form Area -->
        <main class="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
            <div class="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                <div>
                    <h2 id="active-domicile-name" class="text-3xl font-bold text-slate-900">Select Domicile</h2>
                    <p id="active-domicile-slug" class="text-sm text-slate-500 font-mono mt-1"></p>
                </div>
                <span id="badge-jurisdiction" class="hidden px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"></span>
            </div>

            <!-- Tab Buttons -->
            <div class="flex border-b border-slate-200 mb-8 overflow-x-auto gap-2">
                <button onclick="switchTab('tab-general')" id="btn-tab-general" class="tab-btn border-b-2 border-red-700 text-red-700 font-semibold px-4 py-3 text-sm flex items-center gap-1.5 whitespace-nowrap">
                    <span class="material-symbols-outlined text-lg">info</span> General Info
                </button>
                <button onclick="switchTab('tab-stats')" id="btn-tab-stats" class="tab-btn border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium px-4 py-3 text-sm flex items-center gap-1.5 whitespace-nowrap">
                    <span class="material-symbols-outlined text-lg">analytics</span> Statistics (2025)
                </button>
                <button onclick="switchTab('tab-fees')" id="btn-tab-fees" class="tab-btn border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium px-4 py-3 text-sm flex items-center gap-1.5 whitespace-nowrap">
                    <span class="material-symbols-outlined text-lg">payments</span> Fees &amp; Compliance
                </button>
                <button onclick="switchTab('tab-contacts')" id="btn-tab-contacts" class="tab-btn border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium px-4 py-3 text-sm flex items-center gap-1.5 whitespace-nowrap">
                    <span class="material-symbols-outlined text-lg">gavel</span> Regulator &amp; Contact
                </button>
            </div>

            <form id="domicile-form" class="space-y-6" onsubmit="event.preventDefault();">
                <!-- TAB: General Info -->
                <div id="tab-general" class="tab-content space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-2">Domicile Name *</label>
                            <input type="text" id="input-name" required onchange="suggestSlug(this.value)" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-700">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-2">Slug (URL Path) *</label>
                            <input type="text" id="input-slug" required class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-red-700">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-2">Jurisdiction Type *</label>
                            <select id="input-jurisdiction" required class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-700">
                                <option value="Onshore (Canada)">Onshore (Canada)</option>
                                <option value="Onshore (USA)">Onshore (USA)</option>
                                <option value="Onshore (EU)">Onshore (EU)</option>
                                <option value="Offshore">Offshore</option>
                                <option value="Offshore (Caribbean)">Offshore (Caribbean)</option>
                                <option value="Offshore (UAE)">Offshore (UAE)</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-2">Primary Enabling Legislation *</label>
                            <input type="text" id="input-legislation" required class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-700">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">Summary / Overview Description *</label>
                        <textarea id="input-summary" rows="4" required class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-700 leading-relaxed"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">Tax Notes / Environment *</label>
                        <input type="text" id="input-tax-notes" required class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-700">
                    </div>
                </div>

                <!-- TAB: Statistics -->
                <div id="tab-stats" class="tab-content hidden space-y-6">
                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 class="text-sm font-bold uppercase tracking-wider text-red-700 mb-4 flex items-center gap-1"><span class="material-symbols-outlined text-base">bar_chart</span> Captive Volume Counts</h3>
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Reporting Stats Year</label>
                                <input type="number" id="stats-reporting-year" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Total Active Captives</label>
                                <input type="number" id="stats-total" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">New Captives Licensed</label>
                                <input type="number" id="stats-new" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Surrendered Licenses</label>
                                <input type="number" id="stats-surrendered" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 class="text-sm font-bold uppercase tracking-wider text-red-700 mb-4 flex items-center gap-1"><span class="material-symbols-outlined text-base">pie_chart</span> Structure Breakdown</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Pure / Single Parent Captives</label>
                                <input type="number" id="stats-pure" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Group / Association Captives</label>
                                <input type="number" id="stats-group" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Sponsored / Cell Captives</label>
                                <input type="number" id="stats-sponsored" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Individual Cells / Series</label>
                                <input type="number" id="stats-cells-count" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Cells Year Counted</label>
                                <input type="number" id="stats-cells-year" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div class="flex items-center h-full pt-6">
                                <input type="checkbox" id="stats-cells-estimated" class="w-4 h-4 text-red-700 border-slate-300 rounded focus:ring-red-500">
                                <label class="ml-2 text-xs font-semibold text-slate-600">Cells count is estimated</label>
                            </div>
                            <div class="col-span-full">
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Other Captives count (Industrial, SPFI, Branch, agency)</label>
                                <input type="number" id="stats-other" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAB: Fees & Compliance -->
                <div id="tab-fees" class="tab-content hidden space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-2">Year Legislation Passed</label>
                            <input type="number" id="input-legislation-year" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-2">Licensing Speed</label>
                            <input type="text" id="input-licensing-speed" placeholder="e.g. 2-4 weeks" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-2">Premium Tax Rate</label>
                            <input type="text" id="input-premium-tax-rate" placeholder="e.g. None or 0.5% - 2%" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-2">Incorporation / Initial Licensing Fee</label>
                            <input type="text" id="input-licensing-fee" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm">
                        </div>
                        <div class="col-span-full">
                            <label class="block text-sm font-semibold text-slate-700 mb-2">Annual Renewal Maintenance Fee</label>
                            <input type="text" id="input-annual-fee" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm">
                        </div>
                        <div class="col-span-full">
                            <label class="block text-sm font-semibold text-slate-700 mb-2">Annual Filing Requirements</label>
                            <textarea id="input-filing-requirements" rows="2" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm"></textarea>
                        </div>
                    </div>
                </div>

                <!-- TAB: Regulator & Contact -->
                <div id="tab-contacts" class="tab-content hidden space-y-6">
                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 class="text-sm font-bold uppercase tracking-wider text-red-700 mb-4 flex items-center gap-1"><span class="material-symbols-outlined text-base">domain</span> Supervisory Authority</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Authority Name</label>
                                <input type="text" id="regulator-name" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Authority Website</label>
                                <input type="url" id="regulator-website" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Office Address</label>
                                <input type="text" id="regulator-address" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Regulatory Team Staff Size</label>
                                <input type="text" id="regulator-staff" placeholder="e.g. 10-15" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 class="text-sm font-bold uppercase tracking-wider text-red-700 mb-4 flex items-center gap-1"><span class="material-symbols-outlined text-base">person</span> Captive Administrator</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Administrator Name</label>
                                <input type="text" id="admin-name" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Contact Email</label>
                                <input type="email" id="admin-email" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Contact Phone</label>
                                <input type="text" id="admin-phone" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Contact Fax</label>
                                <input type="text" id="admin-fax" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 class="text-sm font-bold uppercase tracking-wider text-red-700 mb-4 flex items-center gap-1"><span class="material-symbols-outlined text-base">checklist</span> Additional Information</h3>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-2">Authorized Captive Structures (One per line)</label>
                            <textarea id="input-types-allowed" rows="3" placeholder="Single parent captives&#10;Group captives" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm leading-relaxed"></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-2">Verification Sources (One URL per line)</label>
                            <textarea id="input-sources" rows="3" placeholder="https://www.bma.bm" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono leading-relaxed"></textarea>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-2">Last Verification Date (YYYY-MM-DD)</label>
                                <input type="text" id="input-last-verified" placeholder="2026-06-29" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono">
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </main>
    </div>

    <!-- Frontend Script -->
    <script>
        let domicilesList = [];
        let activeIndex = -1;

        async function tryLogin(e) {
            if (e) e.preventDefault();
            const password = document.getElementById('login-password').value.trim();
            const btn = document.getElementById('btn-login');
            const err = document.getElementById('login-error');

            btn.disabled = true;
            err.classList.add('hidden');

            try {
                const response = await fetch('/api/domiciles', {
                    headers: { 'Authorization': password }
                });
                
                if (response.status === 200) {
                    sessionStorage.setItem('admin_password', password);
                    domicilesList = await response.json();
                    document.getElementById('login-overlay').classList.add('hidden');
                    renderList();
                    if (domicilesList.length > 0) {
                        selectDomicile(0);
                    }
                } else {
                    err.innerText = 'Incorrect password.';
                    err.classList.remove('hidden');
                }
            } catch (fetchErr) {
                err.innerText = 'Server communication error.';
                err.classList.remove('hidden');
            } finally {
                btn.disabled = false;
            }
        }

        function checkSession() {
            const savedPassword = sessionStorage.getItem('admin_password');
            if (savedPassword) {
                document.getElementById('login-password').value = savedPassword;
                tryLogin();
            }
        }

        function renderList() {
            const container = document.getElementById('domiciles-list');
            const searchVal = document.getElementById('search-input').value.toLowerCase();
            container.innerHTML = '';

            domicilesList.forEach((d, idx) => {
                if (searchVal && !d.name.toLowerCase().includes(searchVal) && !d.jurisdiction.toLowerCase().includes(searchVal)) {
                    return;
                }

                const isActive = idx === activeIndex;
                const activeClasses = isActive ? 'bg-red-50 text-red-700 border-l-4 border-red-700 font-semibold' : 'text-slate-700 hover:bg-slate-50';
                
                const div = document.createElement('div');
                div.className = \`p-4 cursor-pointer transition-colors \${activeClasses}\`;
                div.onclick = () => selectDomicile(idx);
                div.innerHTML = \`
                    <div class="text-sm font-medium">\${d.name}</div>
                    <div class="text-xs text-slate-400 mt-1 flex justify-between">
                        <span>\${d.jurisdiction}</span>
                        <span>\${d.slug}</span>
                    </div>
                \`;
                container.appendChild(div);
            });
        }

        function selectDomicile(idx) {
            activeIndex = idx;
            renderList();

            const d = domicilesList[idx];
            document.getElementById('active-domicile-name').innerText = d.name;
            document.getElementById('active-domicile-slug').innerText = '/' + d.slug;
            
            // Jurisdiction Badge
            const badge = document.getElementById('badge-jurisdiction');
            badge.innerText = d.jurisdiction;
            badge.className = 'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ';
            if (d.jurisdiction.toLowerCase().includes('canada')) {
                badge.className += 'bg-red-100 text-red-700';
            } else if (d.jurisdiction.toLowerCase().includes('usa')) {
                badge.className += 'bg-blue-100 text-blue-700';
            } else if (d.jurisdiction.toLowerCase().includes('offshore')) {
                badge.className += 'bg-emerald-100 text-emerald-700';
            } else {
                badge.className += 'bg-slate-100 text-slate-700';
            }
            badge.classList.remove('hidden');

            // Populate Form
            document.getElementById('input-name').value = d.name || '';
            document.getElementById('input-slug').value = d.slug || '';
            document.getElementById('input-jurisdiction').value = d.jurisdiction || 'Offshore';
            document.getElementById('input-summary').value = d.summary || '';
            document.getElementById('input-legislation').value = d.legislation || '';
            document.getElementById('input-tax-notes').value = d.tax_notes || '';

            // Stats
            const stats = d.stats || {};
            document.getElementById('stats-reporting-year').value = stats.reporting_year || '';
            document.getElementById('stats-total').value = stats.total_captives || '';
            document.getElementById('stats-new').value = stats.new_captives || '';
            document.getElementById('stats-surrendered').value = stats.surrendered_licenses || '';
            document.getElementById('stats-pure').value = stats.pure_captives || '';
            document.getElementById('stats-group').value = stats.group_captives || '';
            document.getElementById('stats-sponsored').value = stats.sponsored_cell_captives || '';
            document.getElementById('stats-cells-count').value = stats.individual_cells_count || '';
            document.getElementById('stats-cells-year').value = stats.individual_cells_year || '';
            document.getElementById('stats-cells-estimated').checked = !!stats.individual_cells_estimated;
            document.getElementById('stats-other').value = stats.other_captives || '';

            // Fees
            const fees = d.fees || {};
            document.getElementById('input-legislation-year').value = d.legislation_year || '';
            document.getElementById('input-licensing-speed').value = d.licensing_speed || '';
            document.getElementById('input-premium-tax-rate').value = fees.premium_tax_rate || '';
            document.getElementById('input-licensing-fee').value = fees.licensing_incorporation || '';
            document.getElementById('input-annual-fee').value = fees.annual_fees || '';
            document.getElementById('input-filing-requirements').value = d.annual_filing_requirements || '';

            // Regulator & Contact
            const regulator = d.regulator || {};
            document.getElementById('regulator-name').value = regulator.name || '';
            document.getElementById('regulator-website').value = regulator.website || '';
            document.getElementById('regulator-address').value = regulator.address || '';
            document.getElementById('regulator-staff').value = d.regulator_staff_count || '';

            const admin = d.captive_administrator || {};
            document.getElementById('admin-name').value = admin.name || '';
            document.getElementById('admin-email').value = admin.email || '';
            document.getElementById('admin-phone').value = admin.phone || '';
            document.getElementById('admin-fax').value = admin.fax || '';

            // Multi-line Textareas
            document.getElementById('input-types-allowed').value = (d.types_allowed || []).join('\\n');
            document.getElementById('input-sources').value = (d.source_urls || []).join('\\n');
            document.getElementById('input-last-verified').value = d.last_verified || '';

            // Reset tab view
            switchTab('tab-general');
        }

        function suggestSlug(name) {
            const slugInput = document.getElementById('input-slug');
            if (!slugInput.value) {
                slugInput.value = name.toLowerCase()
                    .replace(/^the\\s+/i, '')
                    .replace(/[']/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
            }
        }

        function filterDomiciles() {
            renderList();
        }

        function switchTab(tabId) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('border-red-700', 'text-red-700', 'font-semibold');
                b.classList.add('border-transparent', 'text-slate-500', 'font-medium');
            });

            // Show selected
            document.getElementById(tabId).classList.remove('hidden');
            const activeBtn = document.getElementById('btn-' + tabId);
            activeBtn.classList.remove('border-transparent', 'text-slate-500', 'font-medium');
            activeBtn.classList.add('border-red-700', 'text-red-700', 'font-semibold');
        }

        async function saveCurrentDomicile() {
            if (activeIndex === -1) return;

            const name = document.getElementById('input-name').value.trim();
            const slug = document.getElementById('input-slug').value.trim();
            
            if (!name || !slug) {
                alert('Name and Slug are required properties.');
                return;
            }

            // Build Stats object
            const totalVal = document.getElementById('stats-total').value;
            const pureVal = document.getElementById('stats-pure').value;
            const newStats = {
                reporting_year: parseInteger(document.getElementById('stats-reporting-year').value),
                total_captives: parseInteger(totalVal),
                new_captives: parseInteger(document.getElementById('stats-new').value),
                surrendered_licenses: parseInteger(document.getElementById('stats-surrendered').value),
                pure_captives: parseInteger(pureVal),
                group_captives: parseInteger(document.getElementById('stats-group').value),
                sponsored_cell_captives: parseInteger(document.getElementById('stats-sponsored').value),
                individual_cells_count: parseInteger(document.getElementById('stats-cells-count').value),
                individual_cells_year: parseInteger(document.getElementById('stats-cells-year').value),
                individual_cells_estimated: document.getElementById('stats-cells-estimated').checked,
                other_captives: parseInteger(document.getElementById('stats-other').value)
            };

            // Only attach stats if at least one value exists
            const hasStats = Object.values(newStats).some(val => val !== null && val !== false);

            // Types Allowed & Sources
            const typesText = document.getElementById('input-types-allowed').value.trim();
            const typesAllowed = typesText ? typesText.split('\\n').map(t => t.trim()).filter(Boolean) : [];

            const sourcesText = document.getElementById('input-sources').value.trim();
            const sourceUrls = sourcesText ? sourcesText.split('\\n').map(t => t.trim()).filter(Boolean) : [];

            // Compile Save Payload
            const payload = {
                name,
                slug,
                jurisdiction: document.getElementById('input-jurisdiction').value,
                summary: document.getElementById('input-summary').value.trim(),
                legislation: document.getElementById('input-legislation').value.trim(),
                tax_notes: document.getElementById('input-tax-notes').value.trim(),
                legislation_year: parseInteger(document.getElementById('input-legislation-year').value),
                licensing_speed: parseString(document.getElementById('input-licensing-speed').value),
                regulator_staff_count: parseString(document.getElementById('regulator-staff').value),
                last_verified: parseString(document.getElementById('input-last-verified').value),
                annual_filing_requirements: parseString(document.getElementById('input-filing-requirements').value),
                types_allowed: typesAllowed,
                source_urls: sourceUrls,
                
                stats: hasStats ? newStats : null,

                fees: {
                    licensing_incorporation: parseString(document.getElementById('input-licensing-fee').value),
                    annual_fees: parseString(document.getElementById('input-annual-fee').value),
                    premium_tax_rate: parseString(document.getElementById('input-premium-tax-rate').value)
                },

                regulator: {
                    name: parseString(document.getElementById('regulator-name').value),
                    address: parseString(document.getElementById('regulator-address').value),
                    website: parseString(document.getElementById('regulator-website').value)
                },

                captive_administrator: {
                    name: parseString(document.getElementById('admin-name').value),
                    email: parseString(document.getElementById('admin-email').value),
                    phone: parseString(document.getElementById('admin-phone').value),
                    fax: parseString(document.getElementById('admin-fax').value)
                }
            };

            // Clean empty sub-objects if they are fully null
            if (Object.values(payload.fees).every(v => v === null)) payload.fees = null;
            if (Object.values(payload.regulator).every(v => v === null)) payload.regulator = null;
            if (Object.values(payload.captive_administrator).every(v => v === null)) payload.captive_administrator = null;

            // Preserve contact coordinates at the root level if present in the administrator
            payload.contact_name = payload.captive_administrator?.name || domicilesList[activeIndex].contact_name || null;
            payload.contact_email = payload.captive_administrator?.email || domicilesList[activeIndex].contact_email || null;

            // Trigger Save
            const saveBtn = document.getElementById('btn-save');
            saveBtn.disabled = true;
            showToast('Saving data & generating static pages...', 'bg-blue-100 text-blue-700 border border-blue-200');

            try {
                const response = await fetch('/api/save', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': sessionStorage.getItem('admin_password')
                    },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                
                if (result.success) {
                    showToast(result.message || 'Saved successfully!', 'bg-emerald-100 text-emerald-700 border border-emerald-200');
                    // Update local copy
                    domicilesList[activeIndex] = { ...domicilesList[activeIndex], ...payload };
                    renderList();
                } else {
                    showToast(result.error || 'Failed to save.', 'bg-red-100 text-red-700 border border-red-200');
                }
            } catch (err) {
                showToast('Server communication error.', 'bg-red-100 text-red-700 border border-red-200');
            } finally {
                saveBtn.disabled = false;
            }
        }

        function parseInteger(val) {
            if (!val || isNaN(val)) return null;
            return parseInt(val, 10);
        }

        function parseString(val) {
            const v = val.trim();
            return v ? v : null;
        }

        function showToast(text, classes) {
            const toast = document.getElementById('status-toast');
            toast.innerText = text;
            toast.className = 'text-sm font-semibold px-4 py-2 rounded-lg ' + classes;
            toast.classList.remove('hidden');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 4000);
        }

        // Initialize session check on load
        checkSession();
    </script>
</body>
</html>`;
}
