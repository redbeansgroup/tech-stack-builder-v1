document.addEventListener('DOMContentLoaded', async () => {
    // --- Global State & Config ---
    let appData = {};
    let config = {};
    let activeCategories = new Set();
    let techStack = [];
    let preparerLogo = null;
    let selectedCurrency = 'USD';
    let currencyRates = {};
    let aiSummarizer = null;

    // --- Element References ---
    const darkModeToggle = document.getElementById('darkModeToggle');
    const themeSelector = document.getElementById('themeSelector');
    const startBtn = document.getElementById('startBtn');
    const builderDiv = document.getElementById('builder');
    const categoryTogglesDiv = document.getElementById('categoryToggles');
    const appSelectionArea = document.getElementById('app-selection-area');
    const stackRowsDiv = document.getElementById('stack-rows');
    const costToggle = document.getElementById('costToggle');
    const currencySelector = document.getElementById('currencySelector');
    const totalCostEl = document.getElementById('totalCost');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const saveStackBtn = document.getElementById('saveStackBtn');
    const loadStackInput = document.getElementById('loadStackInput');
    const shareStackBtn = document.getElementById('shareStackBtn');
    const templateSelector = document.getElementById('templateSelector');
    
    // AI Elements
    const aiAdjustBtn = document.getElementById('aiAdjustBtn');
    const aiInputText = document.getElementById('aiInputText');
    const aiOutputText = document.getElementById('aiOutputText');

    // Modal Elements
    const iconModal = document.getElementById('iconModal');
    const iconSearchInput = document.getElementById('iconSearchInput');
    const iconResultsDiv = document.getElementById('iconResults');
    let currentCategoryToUpdate = null;


    // --- INITIALIZATION ---
    async function init() {
        try {
            const response = await fetch('./data.json');
            appData = await response.json();
            config = appData.config;
            selectedCurrency = config.currencies.default;
            await fetchCurrencyRates();

            applyConfig();
            setupEventListeners();
            
            populateCategories();
            populateCurrencySelector();
            populateThemeSelector();
            populateTemplateSelector();
            
            checkForShareLink();
        } catch (error) {
            console.error('Failed to initialize application:', error);
            document.body.innerHTML = '<h1>Error: Could not load data.json</h1><p>Please check the console for details.</p>';
        }
    }

    // --- DYNAMIC CONFIGURATION & THEMING ---
    function applyConfig() {
        document.getElementById('pageTitle').textContent = config.pageTitle;
        document.getElementById('headerTitle').textContent = config.headerTitle;
        document.getElementById('headerSubtitle').textContent = config.headerSubtitle;
        document.getElementById('startBtn').textContent = config.startButtonText;
        document.getElementById('exportPdfBtn').textContent = config.exportButtonText;
    }
    
    function populateThemeSelector() {
        config.themes.forEach((theme, index) => {
            themeSelector.add(new Option(theme.name, index));
        });
        const savedTheme = localStorage.getItem('selectedTheme') || 0;
        themeSelector.value = savedTheme;
        applyTheme(savedTheme);
    }
    
    function applyTheme(themeIndex) {
        const theme = config.themes[themeIndex];
        document.documentElement.style.setProperty('--font-family', theme.fontFamily);
        const mode = darkModeToggle.checked ? 'dark' : 'light';
        const colors = { ...theme.light, ...theme.dark, ...theme[mode] };
        for (const [key, value] of Object.entries(colors)) {
            document.documentElement.style.setProperty(`--${key}-color`, value);
        }
        localStorage.setItem('selectedTheme', themeIndex);
    }

    function updateTheme() {
        document.body.classList.toggle('dark-mode', darkModeToggle.checked);
        applyTheme(themeSelector.value);
        localStorage.setItem('darkMode', darkModeToggle.checked);
    }

    // --- CURRENCY & DATA FETCHING ---
    async function fetchCurrencyRates() {
        const url = config.apis.currency.replace('{base}', config.currencies.default.toLowerCase());
        try {
            const response = await fetch(url);
            const data = await response.json();
            currencyRates = data[config.currencies.default.toLowerCase()];
        } catch (error) {
            console.error('Could not fetch currency rates, using fallback.', error);
            config.currencies.supported.forEach(c => currencyRates[c.toLowerCase()] = 1);
        }
    }
    
    function populateCurrencySelector() {
        config.currencies.supported.forEach(code => currencySelector.add(new Option(code, code)));
        currencySelector.value = selectedCurrency;
    }

    function convertCurrency(amount, fromCurrency) {
        fromCurrency = fromCurrency.toLowerCase();
        const toCurrency = selectedCurrency.toLowerCase();
        
        const rateFrom = currencyRates[fromCurrency] || 1;
        const amountInBase = amount / rateFrom;
        const rateTo = currencyRates[toCurrency] || 1;
        
        return amountInBase * rateTo;
    }
    
    // --- CORE APP LOGIC ---
    function populateCategories() {
        categoryTogglesDiv.innerHTML = '';
        appData.categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.textContent = category.name;
            btn.dataset.category = category.name;
            btn.onclick = () => { btn.classList.toggle('active'); activeCategories.has(category.name) ? activeCategories.delete(category.name) : activeCategories.add(category.name); populateApps(); };
            categoryTogglesDiv.appendChild(btn);
        });
    }

    function populateApps() {
        appSelectionArea.innerHTML = '';
        const defaultIcon = config.apis.iconRetrieve.replace('{icon}', 'mdi:apps');
        appData.apps
            .filter(app => activeCategories.has(app.category))
            .forEach(app => {
                const appDiv = document.createElement('div');
                appDiv.className = 'app-item';
                appDiv.draggable = true;
                appDiv.dataset.appId = app.id;
                appDiv.innerHTML = `<img src="${defaultIcon}" alt=""><span>${app.name}</span>`;
                appDiv.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', app.id));
                appSelectionArea.appendChild(appDiv);
            });
    }

    function handleDrop(e) {
        e.preventDefault();
        const appId = e.dataTransfer.getData('text/plain');
        const app = appData.apps.find(a => a.id == appId);
        if (app && !techStack.some(item => item.id == appId)) {
            techStack.push(app);
            renderTechStack();
        }
    }

    function renderTechStack() {
        stackRowsDiv.innerHTML = '';
        const defaultIcon = config.apis.iconRetrieve.replace('{icon}', 'mdi:apps');
        techStack.forEach(app => {
            const isYearly = costToggle.checked;
            const cost = isYearly ? app.cost.yearly : app.cost.monthly;
            const convertedCost = convertCurrency(cost, app.cost.currency);
            const cycle = isYearly ? '/yr' : '/mo';

            const row = document.createElement('div');
            row.className = 'stack-row';
            row.innerHTML = `
                <div class="stack-row-item stack-app-name">
                    <img src="${defaultIcon}" alt="${app.name} icon">
                    <span>${app.name}</span>
                </div>
                <div class="stack-row-item"><p>${app.description}</p></div>
                <div class="stack-row-item">
                    ${selectedCurrency} ${convertedCost.toFixed(2)}${cycle}
                    <button class="remove-btn" data-app-id="${app.id}">✖</button>
                </div>
            `;
            stackRowsDiv.appendChild(row);
        });
        updateTotalCost();
    }
    
    function updateTotalCost() {
        const total = techStack.reduce((sum, app) => {
            const isYearly = costToggle.checked;
            const cost = isYearly ? app.cost.yearly : app.cost.monthly;
            return sum + convertCurrency(cost, app.cost.currency);
        }, 0);
        totalCostEl.textContent = `${selectedCurrency} ${total.toFixed(2)}`;
    }

    // --- STATE MANAGEMENT (SAVE/LOAD/SHARE) ---
    function saveStack() {
        const state = {
            preparerName: document.getElementById('preparerName').value,
            preparerAddress: document.getElementById('preparerAddress').value,
            clientName: document.getElementById('clientName').value,
            clientAddress: document.getElementById('clientAddress').value,
            notes: document.getElementById('notes').value,
            techStackIds: techStack.map(app => app.id)
        };
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.clientName || 'stack'}-project.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function loadStack(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const state = JSON.parse(e.target.result);
                document.getElementById('preparerName').value = state.preparerName || '';
                document.getElementById('preparerAddress').value = state.preparerAddress || '';
                document.getElementById('clientName').value = state.clientName || '';
                document.getElementById('clientAddress').value = state.clientAddress || '';
                document.getElementById('notes').value = state.notes || '';
                techStack = appData.apps.filter(app => state.techStackIds && state.techStackIds.includes(app.id));
                builderDiv.classList.remove('hidden');
                renderTechStack();
            } catch (err) {
                alert('Invalid project file.');
            }
        };
        reader.readAsText(file);
    }
    
    function generateShareLink() {
        if (techStack.length === 0) {
            alert('Add apps to your stack before generating a link.');
            return;
        }
        const ids = techStack.map(app => app.id).join(',');
        const url = `${window.location.origin}${window.location.pathname}?stack=${ids}`;
        navigator.clipboard.writeText(url).then(() => alert('Share link copied to clipboard!'));
    }
    
    function checkForShareLink() {
        const params = new URLSearchParams(window.location.search);
        const stackIds = params.get('stack');
        if (stackIds) {
            const ids = stackIds.split(',').map(id => parseInt(id, 10));
            techStack = appData.apps.filter(app => ids.includes(app.id));
            builderDiv.classList.remove('hidden');
            renderTechStack();
        }
    }
    
    function populateTemplateSelector() {
        config.templates.forEach(template => {
            templateSelector.add(new Option(template.name, JSON.stringify(template.appIds)));
        });
    }

    // --- AI & API FEATURES ---
    async function adjustDescription() {
        const text = aiInputText.value;
        if (!text) {
            alert('Please enter a description to adjust.');
            return;
        }
        aiOutputText.textContent = 'Thinking...';
        try {
            if (!aiSummarizer) {
                // Lazy-load the AI model on first use
                const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');
                aiSummarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
            }
            const output = await aiSummarizer(text, { max_new_tokens: 50, min_new_tokens: 10 });
            aiOutputText.textContent = output[0].summary_text;
        } catch (error) {
            console.error('AI summarization failed:', error);
            aiOutputText.textContent = 'An error occurred. The AI model might still be downloading.';
        }
    }

    async function searchIcons(event) {
        if (event.key !== 'Enter') return;
        const query = iconSearchInput.value;
        if (query.length < 3) return;
        
        const url = config.apis.iconSearch.replace('{query}', encodeURIComponent(query));
        const response = await fetch(url);
        const data = await response.json();

        iconResultsDiv.innerHTML = '';
        data.icons.forEach(iconName => {
            const iconUrl = config.apis.iconRetrieve.replace('{icon}', iconName);
            const item = document.createElement('div');
            item.className = 'icon-result-item';
            item.dataset.iconName = iconName;
            item.innerHTML = `<img src="${iconUrl}" alt="${iconName}">`;
            item.onclick = () => selectIcon(iconName);
            iconResultsDiv.appendChild(item);
        });
    }
    
    function selectIcon(iconName) {
        const category = appData.categories.find(c => c.name === currentCategoryToUpdate);
        if (category) {
            category.icon = iconName;
        }
        iconModal.classList.add('hidden');
    }

    // --- PDF GENERATION ---
    async function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const now = new Date();
        const isYearly = costToggle.checked;

        // Header
        if (preparerLogo) { doc.addImage(preparerLogo, 'PNG', 15, 15, 30, 30); }
        doc.setFontSize(20).setFont(undefined, 'bold');
        doc.text(document.getElementById('preparerName').value, 105, 25, { align: 'center' });
        doc.setFontSize(10).setFont(undefined, 'normal');
        doc.text(document.getElementById('preparerAddress').value.split('\n'), 105, 32, { align: 'center' });
        doc.setFontSize(26).setFont(undefined, 'bold').text('Tech Stack Proposal', 195, 25, { align: 'right' });
        
        // Client Info & Dates
        doc.setLineWidth(0.5).line(15, 55, 195, 55);
        doc.setFontSize(12).setFont(undefined, 'bold').text('Prepared For:', 15, 65);
        doc.setFont(undefined, 'normal');
        doc.text(document.getElementById('clientName').value, 15, 72);
        doc.text(document.getElementById('clientAddress').value.split('\n'), 15, 79);
        doc.autoTable({
            body: [['Date:', now.toLocaleDateString()], ['Currency:', selectedCurrency]],
            startY: 65, margin: { left: 140 }, theme: 'plain', styles: { fontSize: 10 }
        });

        // Table
        const tableColumns = ["Item & Description", "Billing Cycle", "Amount"];
        const tableRows = techStack.map(app => {
            const cost = isYearly ? app.cost.yearly : app.cost.monthly;
            const convertedCost = convertCurrency(cost, app.cost.currency);
            return [ `${app.name}\n${app.description}`, isYearly ? 'Annual' : 'Monthly', `${convertedCost.toFixed(2)}` ];
        });
        doc.autoTable({ head: [tableColumns], body: tableRows, startY: 95 });

        // Totals & Pie Chart
        let finalY = doc.autoTable.previous.finalY + 10;
        const total = techStack.reduce((sum, app) => sum + convertCurrency(isYearly ? app.cost.yearly : app.cost.monthly, app.cost.currency), 0);
        
        const categoryTotals = appData.categories.reduce((acc, cat) => {
            const categoryTotal = techStack
                .filter(app => app.category === cat.name)
                .reduce((sum, app) => sum + convertCurrency(isYearly ? app.cost.yearly : app.cost.monthly, app.cost.currency), 0);
            if (categoryTotal > 0) acc[cat.name] = categoryTotal;
            return acc;
        }, {});
        
        const chartLabels = Object.keys(categoryTotals);
        const chartData = Object.values(categoryTotals);
        const chartUrl = config.apis.pieChart
            .replace('{labels}', encodeURIComponent(JSON.stringify(chartLabels)))
            .replace('{data}', encodeURIComponent(JSON.stringify(chartData)));
        
        const saveDoc = () => {
            const notes = document.getElementById('notes').value;
            if (notes) {
                let notesY = doc.autoTable.previous.finalY > finalY + 50 ? doc.autoTable.previous.finalY : finalY + 50;
                doc.setFontSize(10).setFont(undefined, 'bold').text('Notes:', 15, notesY);
                doc.setFont(undefined, 'normal').text(notes, 15, notesY + 5, { maxWidth: 180 });
            }
            doc.save(`${document.getElementById('clientName').value || 'TechStack'}_Proposal.pdf`);
        };
        
        if (chartData.length > 0) {
            fetch(chartUrl)
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        doc.addImage(base64data, 'PNG', 15, finalY, 80, 40);
                        doc.setFontSize(12).setFont(undefined, 'bold').text('Total:', 140, finalY + 20, { align: 'right' });
                        doc.text(`${selectedCurrency} ${total.toFixed(2)}`, 195, finalY + 20, { align: 'right' });
                        saveDoc();
                    };
                }).catch(saveDoc); // Save without chart if fetch fails
        } else {
            doc.setFontSize(12).setFont(undefined, 'bold').text('Total:', 140, finalY + 20, { align: 'right' });
            doc.text(`${selectedCurrency} ${total.toFixed(2)}`, 195, finalY + 20, { align: 'right' });
            saveDoc();
        }
    }
    
    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        darkModeToggle.checked = localStorage.getItem('darkMode') === 'true';
        darkModeToggle.addEventListener('change', updateTheme);
        themeSelector.addEventListener('change', e => applyTheme(e.target.value));

        startBtn.addEventListener('click', () => builderDiv.classList.remove('hidden'));
        stackRowsDiv.addEventListener('dragover', e => e.preventDefault());
        stackRowsDiv.addEventListener('drop', handleDrop);
        stackRowsDiv.addEventListener('click', e => {
            if (e.target.classList.contains('remove-btn')) {
                const appId = parseInt(e.target.dataset.appId, 10);
                techStack = techStack.filter(app => app.id !== appId);
                renderTechStack();
            }
        });

        costToggle.addEventListener('change', renderTechStack);
        currencySelector.addEventListener('change', e => { selectedCurrency = e.target.value; renderTechStack(); });
        exportPdfBtn.addEventListener('click', generatePDF);
        
        saveStackBtn.addEventListener('click', saveStack);
        loadStackInput.addEventListener('change', loadStack);
        shareStackBtn.addEventListener('click', generateShareLink);
        templateSelector.addEventListener('change', e => {
            if (e.target.value) {
                const ids = JSON.parse(e.target.value);
                techStack = appData.apps.filter(app => ids.includes(app.id));
                builderDiv.classList.remove('hidden');
                renderTechStack();
            }
        });
        
        aiAdjustBtn.addEventListener('click', adjustDescription);

        document.getElementById('logoUpload').addEventListener('change', e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => { preparerLogo = event.target.result; };
                reader.readAsDataURL(file);
            }
        });

        // Modal Listeners
        document.body.addEventListener('click', e => {
            const iconButton = e.target.closest('.category-icon-btn');
            if (iconButton) {
                currentCategoryToUpdate = iconButton.dataset.category;
                iconModal.classList.remove('hidden');
                iconSearchInput.focus();
            }
        });
        iconSearchInput.addEventListener('keydown', searchIcons);
        iconModal.querySelector('.close-btn').addEventListener('click', () => iconModal.classList.add('hidden'));
        iconModal.addEventListener('click', (e) => {
            if (e.target === iconModal) {
                 iconModal.classList.add('hidden');
            }
        });
    }

    init();
});
