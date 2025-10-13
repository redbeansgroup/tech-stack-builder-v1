document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const jsonFileInput = document.getElementById('jsonFileInput');
    const editorContent = document.getElementById('editor-content');
    const iconModal = document.getElementById('iconModal');
    let fullData = {};
    let activeIconInput = null;

    // --- Core Initializer ---
    async function initEditor() {
        // Ensure modal is hidden on start, no matter what.
        iconModal.classList.add('hidden');
        
        setupStaticEventListeners();

        try {
            const response = await fetch('./data.json');
            if (response.ok) {
                fullData = await response.json();
                editorContent.classList.remove('hidden');
                document.querySelector('.file-controls').style.display = 'none'; // Hide the file upload section
                buildFullEditor();
            } else {
                console.warn('data.json not found. Waiting for file upload.');
            }
        } catch (error) {
            console.error('Failed to auto-load data.json on startup:', error);
        }
    }

    // --- File Loading ---
    jsonFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                fullData = JSON.parse(e.target.result);
                editorContent.classList.remove('hidden');
                buildFullEditor();
            } catch (error) {
                alert('Error parsing JSON file. Please check the file format.');
            }
        };
        reader.readAsText(file);
    });

    // --- UI Builders ---
    function buildFullEditor() {
        // Find all collapsible sections and clear them
        document.getElementById('config-editor').innerHTML = '';
        document.getElementById('theme-list').innerHTML = '';
        document.getElementById('category-list').innerHTML = '';
        document.getElementById('app-list').innerHTML = '';
        document.getElementById('template-list').innerHTML = '';
        
        buildConfigEditor();
        buildThemesEditor();
        buildCategoriesEditor();
        buildAppsEditor();
        buildTemplatesEditor();
        setupDynamicEventListeners();
    }
    
    function buildConfigEditor() {
        const container = document.getElementById('config-editor');
        container.innerHTML = '<h3>UI Text</h3>';
        const textFields = ['pageTitle', 'headerTitle', 'headerSubtitle', 'startButtonText', 'exportButtonText'];
        textFields.forEach(key => {
            container.innerHTML += `<label>${key}</label><input type="text" value="${fullData.config[key] || ''}" data-config-key="${key}">`;
        });
        
        container.innerHTML += '<h3>API URLs</h3>';
        for (const key in fullData.config.apis) {
            container.innerHTML += `<label>${key}</label><input type="text" value="${fullData.config.apis[key]}" data-config-type="api" data-key="${key}">`;
        }

        container.innerHTML += '<h3>AI Settings</h3>';
        container.innerHTML += `<label>AI Model Path</label><input type="text" id="ai-model" value="${fullData.config.ai.model}">`;
        container.innerHTML += `<label>AI Prompt Template</label><textarea id="ai-prompt">${fullData.config.ai.prompt}</textarea>`;

        container.innerHTML += '<h3>Currencies</h3>';
        const supportedCurrencies = fullData.config.currencies.supported.join(', ');
        const currencyOptions = fullData.config.currencies.supported.map(c => `<option value="${c}" ${c === fullData.config.currencies.default ? 'selected' : ''}>${c}</option>`).join('');
        container.innerHTML += `
            <label>Supported Currencies (comma-separated)</label><input type="text" id="config-currencies" value="${supportedCurrencies}">
            <label>Default Currency</label><select id="config-default-currency">${currencyOptions}</select>
        `;
    }

    function buildThemesEditor() {
        const container = document.getElementById('theme-list');
        fullData.config.themes.forEach((theme, index) => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.innerHTML = `
                <button class="delete-btn" data-type="theme" data-index="${index}">×</button>
                <h3>Theme ${index + 1}</h3>
                <label>Name</label><input type="text" value="${theme.name}" class="theme-name">
                <label>Font Family</label><input type="text" value="${theme.fontFamily}" class="theme-font">
                <div class="theme-card-grid">
                    <div><h4>Light Mode</h4>
                        <div class="color-input-group"><label>Primary</label><input type="color" value="${theme.light.primary}" class="theme-light-primary"></div>
                        <div class="color-input-group"><label>Secondary</label><input type="color" value="${theme.light.secondary}" class="theme-light-secondary"></div>
                    </div>
                    <div><h4>Dark Mode</h4>
                        <div class="color-input-group"><label>Primary</label><input type="color" value="${theme.dark.primary}" class="theme-dark-primary"></div>
                        <div class="color-input-group"><label>Secondary</label><input type="color" value="${theme.dark.secondary}" class="theme-dark-secondary"></div>
                    </div>
                </div>`;
            container.appendChild(div);
        });
    }

    function buildCategoriesEditor() {
        const container = document.getElementById('category-list');
        fullData.categories.forEach((cat, index) => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.innerHTML = `<button class="delete-btn" data-type="category" data-index="${index}">×</button>
                <label>Category Name</label><input type="text" value="${cat.name}" class="cat-name">
                <label>Description</label><input type="text" value="${cat.description}" class="cat-desc">`;
            container.appendChild(div);
        });
    }

    function buildAppsEditor() {
        const container = document.getElementById('app-list');
        const currencyOptions = fullData.config.currencies.supported.map(c => `<option value="${c}">${c}</option>`).join('');
        const categoryOptions = fullData.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

        fullData.apps.forEach((app, index) => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.innerHTML = `
                <button class="delete-btn" data-type="app" data-index="${index}">×</button>
                <label>App Name</label><input type="text" value="${app.name}" class="app-name">
                <label>Description</label><textarea class="app-desc">${app.description}</textarea>
                <label>Icon (from iconify, e.g., mdi:database)</label>
                <div class="icon-input-group">
                    <input type="text" value="${app.icon}" class="app-icon" id="app-icon-input-${index}">
                    <button class="open-icon-modal" data-target-input="app-icon-input-${index}">Search</button>
                </div>
                <label>Category</label><select class="app-cat">${categoryOptions}</select>
                <label>Monthly Cost</label><input type="number" step="0.01" value="${app.cost.monthly}" class="app-cost-monthly">
                <label>Yearly Cost</label><input type="number" step="0.01" value="${app.cost.yearly}" class="app-cost-yearly">
                <label>Currency</label><select class="app-currency">${currencyOptions}</select>`;
            div.querySelector('.app-cat').value = app.category;
            div.querySelector('.app-currency').value = app.cost.currency;
            container.appendChild(div);
        });
    }

    function buildTemplatesEditor() {
        const container = document.getElementById('template-list');
        const appCheckboxes = fullData.apps.map(app => `<label class="template-app-item"><input type="checkbox" value="${app.id}"> ${app.name} (ID: ${app.id})</label>`).join('');
        fullData.config.templates.forEach((template, index) => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.innerHTML = `<button class="delete-btn" data-type="template" data-index="${index}">×</button>
                <label>Template Name</label><input type="text" value="${template.name}" class="template-name">
                <label>Included Apps</label><div class="template-apps-list">${appCheckboxes}</div>`;
            template.appIds.forEach(id => {
                const checkbox = div.querySelector(`input[value="${id}"]`);
                if(checkbox) checkbox.checked = true;
            });
            container.appendChild(div);
        });
    }

    // --- EVENT HANDLING ---
    function setupStaticEventListeners() {
        document.getElementById('addThemeBtn').addEventListener('click', () => {
            fullData.config.themes.push({ name: "New Theme", fontFamily: "sans-serif", light: { primary: "#000000", secondary: "#cccccc" }, dark: { primary: "#ffffff", secondary: "#333333" } });
            buildFullEditor();
        });
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            fullData.categories.push({ name: "New Category", description: "" });
            buildFullEditor();
        });
        document.getElementById('addAppBtn').addEventListener('click', () => {
            fullData.apps.push({ id: Date.now(), name: "New App", category: "", description: "", icon: "mdi:help-box", cost: { monthly: 0, yearly: 0, currency: "USD" } });
            buildFullEditor();
        });
        document.getElementById('addTemplateBtn').addEventListener('click', () => {
            fullData.config.templates.push({ name: "New Template", appIds: [] });
            buildFullEditor();
        });

        closeIconModalBtn.addEventListener('click', () => iconModal.classList.add('hidden'));
        iconModal.addEventListener('click', (e) => { if(e.target === iconModal) iconModal.classList.add('hidden'); });
        iconSearchInput.addEventListener('keydown', handleIconSearch);
        
        document.getElementById('saveJsonBtn').addEventListener('click', saveData);
    }
    
    function setupDynamicEventListeners() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = (e) => deleteItem(e.target.dataset.type, e.target.dataset.index);
        });
        document.querySelectorAll('.open-icon-modal').forEach(btn => {
            btn.onclick = (e) => openIconModal(e.target.dataset.targetInput);
        });
    }
    
    function deleteItem(type, index) {
        if (confirm(`Are you sure you want to delete this ${type}?`)) {
            if (type === 'theme') fullData.config.themes.splice(index, 1);
            if (type === 'category') fullData.categories.splice(index, 1);
            if (type === 'app') fullData.apps.splice(index, 1);
            if (type === 'template') fullData.config.templates.splice(index, 1);
            buildFullEditor();
        }
    }

    // --- ICON MODAL ---
    function openIconModal(targetInputId) {
        activeIconInput = document.getElementById(targetInputId);
        iconModal.classList.remove('hidden');
        iconSearchInput.focus();
    }

    async function handleIconSearch(e) {
        if (e.key !== 'Enter') return;
        const query = iconSearchInput.value;
        if (query.length < 3) return;
        
        const url = fullData.config.apis.iconSearch.replace('{query}', encodeURIComponent(query));
        try {
            const response = await fetch(url);
            const data = await response.json();
            iconResultsDiv.innerHTML = '';
            data.icons.forEach(iconName => {
                const iconUrl = fullData.config.apis.iconRetrieve.replace('{icon}', iconName);
                const item = document.createElement('div');
                item.className = 'icon-result-item';
                item.innerHTML = `<img src="${iconUrl}" alt="${iconName}">`;
                item.onclick = () => {
                    if(activeIconInput) activeIconInput.value = iconName;
                    iconModal.classList.add('hidden');
                };
                iconResultsDiv.appendChild(item);
            });
        } catch (error) {
            console.error("Icon search failed:", error);
            iconResultsDiv.innerHTML = 'Could not fetch icons.';
        }
    }

    // --- SAVE LOGIC ---
    function saveData() {
        const newData = JSON.parse(JSON.stringify(fullData)); // Deep copy

        newData.config.themes = [];
        newData.config.templates = [];
        newData.categories = [];
        newData.apps = [];

        document.querySelectorAll('#config-editor input[data-config-key]').forEach(input => { newData.config[input.dataset.configKey] = input.value; });
        document.querySelectorAll('#config-editor input[data-config-type="api"]').forEach(input => { newData.config.apis[input.dataset.key] = input.value; });
        newData.config.ai.model = document.getElementById('ai-model').value;
        newData.config.ai.prompt = document.getElementById('ai-prompt').value;
        newData.config.currencies.supported = document.getElementById('config-currencies').value.split(',').map(c => c.trim());
        newData.config.currencies.default = document.getElementById('config-default-currency').value;

        document.querySelectorAll('#theme-list .item-card').forEach(card => {
            newData.config.themes.push({
                name: card.querySelector('.theme-name').value, fontFamily: card.querySelector('.theme-font').value,
                light: { primary: card.querySelector('.theme-light-primary').value, secondary: card.querySelector('.theme-light-secondary').value },
                dark: { primary: card.querySelector('.theme-dark-primary').value, secondary: card.querySelector('.theme-dark-secondary').value }
            });
        });

        document.querySelectorAll('#category-list .item-card').forEach(card => {
            newData.categories.push({ name: card.querySelector('.cat-name').value, description: card.querySelector('.cat-desc').value });
        });

        document.querySelectorAll('#app-list .item-card').forEach((card, index) => {
            newData.apps.push({
                id: fullData.apps[index]?.id || Date.now(), name: card.querySelector('.app-name').value, category: card.querySelector('.app-cat').value,
                description: card.querySelector('.app-desc').value, icon: card.querySelector('.app-icon').value,
                cost: {
                    monthly: parseFloat(card.querySelector('.app-cost-monthly').value), yearly: parseFloat(card.querySelector('.app-cost-yearly').value),
                    currency: card.querySelector('.app-currency').value
                }
            });
        });

        document.querySelectorAll('#template-list .item-card').forEach(card => {
            const checkedAppIds = Array.from(card.querySelectorAll('.template-apps-list input:checked')).map(input => parseInt(input.value));
            newData.config.templates.push({ name: card.querySelector('.template-name').value, appIds: checkedAppIds });
        });

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(newData, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = 'data.json';
        a.click();
    }

    initEditor();
});
