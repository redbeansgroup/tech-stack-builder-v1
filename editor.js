document.addEventListener('DOMContentLoaded', () => {
    const jsonFileInput = document.getElementById('jsonFileInput');
    const editorContent = document.getElementById('editor-content');
    
    // Div containers for each section
    const configEditorDiv = document.getElementById('config-editor');
    const themeListDiv = document.getElementById('theme-list');
    const categoryListDiv = document.getElementById('category-list');
    const appListDiv = document.getElementById('app-list');
    const templateListDiv = document.getElementById('template-list');

    // "Add" buttons
    const addThemeBtn = document.getElementById('addThemeBtn');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const addAppBtn = document.getElementById('addAppBtn');
    const addTemplateBtn = document.getElementById('addTemplateBtn');
    const saveJsonBtn = document.getElementById('saveJsonBtn');

    let fullData = {};

    // --- FILE LOADING ---
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
                console.error("JSON Parse Error:", error);
            }
        };
        reader.readAsText(file);
    });

    function buildFullEditor() {
        buildConfigEditor();
        buildThemesEditor();
        buildCategoriesEditor();
        buildAppsEditor();
        buildTemplatesEditor();
    }
    
    // --- BUILDER FUNCTIONS ---

    function buildConfigEditor() {
        configEditorDiv.innerHTML = '<h3>UI Text</h3>';
        const textFields = ['pageTitle', 'headerTitle', 'headerSubtitle', 'startButtonText', 'exportButtonText'];
        textFields.forEach(key => {
            configEditorDiv.innerHTML += `
                <label for="config-text-${key}">${key}</label>
                <input type="text" id="config-text-${key}" value="${fullData.config[key] || ''}" data-config-key="${key}">
            `;
        });
        
        configEditorDiv.innerHTML += '<h3>API URLs</h3>';
        for (const key in fullData.config.apis) {
            configEditorDiv.innerHTML += `
                <label for="config-api-${key}">${key}</label>
                <input type="text" id="config-api-${key}" value="${fullData.config.apis[key]}" data-config-type="api" data-key="${key}">
            `;
        }

        configEditorDiv.innerHTML += '<h3>AI Settings</h3>';
        configEditorDiv.innerHTML += `<label for="ai-model">AI Model Path</label><input type="text" id="ai-model" value="${fullData.config.ai.model}">`;
        configEditorDiv.innerHTML += `<label for="ai-prompt">AI Prompt Template</label><textarea id="ai-prompt">${fullData.config.ai.prompt}</textarea>`;

        configEditorDiv.innerHTML += '<h3>Currencies</h3>';
        const supportedCurrencies = fullData.config.currencies.supported.join(', ');
        const currencyOptions = fullData.config.currencies.supported.map(c => `<option value="${c}" ${c === fullData.config.currencies.default ? 'selected' : ''}>${c}</option>`).join('');
        configEditorDiv.innerHTML += `
            <label for="config-currencies">Supported Currencies (comma-separated)</label>
            <input type="text" id="config-currencies" value="${supportedCurrencies}">
            <label for="config-default-currency">Default Currency</label>
            <select id="config-default-currency">${currencyOptions}</select>
        `;
    }

    function buildThemesEditor() {
        themeListDiv.innerHTML = '';
        fullData.config.themes.forEach((theme, index) => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.innerHTML = `
                <button class="delete-btn" onclick="deleteItem('theme', ${index})">×</button>
                <h3>Theme ${index + 1}</h3>
                <label>Name</label>
                <input type="text" value="${theme.name}" class="theme-name">
                <label>Font Family</label>
                <input type="text" value="${theme.fontFamily}" class="theme-font">
                <div class="theme-card-grid">
                    <div class="theme-colors">
                        <h4>Light Mode</h4>
                        <div class="color-input-group"><label>Primary</label><input type="color" value="${theme.light.primary}" class="theme-light-primary"></div>
                        <div class="color-input-group"><label>Secondary</label><input type="color" value="${theme.light.secondary}" class="theme-light-secondary"></div>
                    </div>
                    <div class="theme-colors">
                        <h4>Dark Mode</h4>
                        <div class="color-input-group"><label>Primary</label><input type="color" value="${theme.dark.primary}" class="theme-dark-primary"></div>
                        <div class="color-input-group"><label>Secondary</label><input type="color" value="${theme.dark.secondary}" class="theme-dark-secondary"></div>
                    </div>
                </div>
            `;
            themeListDiv.appendChild(div);
        });
    }

    function buildCategoriesEditor() {
        categoryListDiv.innerHTML = '';
        fullData.categories.forEach((cat, index) => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.innerHTML = `
                <button class="delete-btn" onclick="deleteItem('category', ${index})">×</button>
                <label>Category Name</label>
                <input type="text" value="${cat.name}" class="cat-name">
                <label>Description</label>
                <input type="text" value="${cat.description}" class="cat-desc">
                <label>Icon (from iconify, e.g., mdi:database)</label>
                <input type="text" value="${cat.icon}" class="cat-icon">
            `;
            categoryListDiv.appendChild(div);
        });
    }

    function buildAppsEditor() {
        appListDiv.innerHTML = '';
        const currencyOptions = fullData.config.currencies.supported.map(c => `<option value="${c}">${c}</option>`).join('');
        const categoryOptions = fullData.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

        fullData.apps.forEach((app, index) => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.innerHTML = `
                <button class="delete-btn" onclick="deleteItem('app', ${index})">×</button>
                <label>App Name</label><input type="text" value="${app.name}" class="app-name">
                <label>Description</label><textarea class="app-desc">${app.description}</textarea>
                <label>Category</label><select class="app-cat">${categoryOptions}</select>
                <label>Monthly Cost</label><input type="number" step="0.01" value="${app.cost.monthly}" class="app-cost-monthly">
                <label>Yearly Cost</label><input type="number" step="0.01" value="${app.cost.yearly}" class="app-cost-yearly">
                <label>Currency</label><select class="app-currency">${currencyOptions}</select>
            `;
            div.querySelector('.app-cat').value = app.category;
            div.querySelector('.app-currency').value = app.cost.currency;
            appListDiv.appendChild(div);
        });
    }

    function buildTemplatesEditor() {
        templateListDiv.innerHTML = '';
        const appCheckboxes = fullData.apps.map(app => `
            <label class="template-app-item">
                <input type="checkbox" value="${app.id}"> ${app.name} (ID: ${app.id})
            </label>
        `).join('');

        fullData.config.templates.forEach((template, index) => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.innerHTML = `
                <button class="delete-btn" onclick="deleteItem('template', ${index})">×</button>
                <label>Template Name</label>
                <input type="text" value="${template.name}" class="template-name">
                <label>Included Apps</label>
                <div class="template-apps-list">${appCheckboxes}</div>
            `;
            template.appIds.forEach(id => {
                const checkbox = div.querySelector(`input[value="${id}"]`);
                if(checkbox) checkbox.checked = true;
            });
            templateListDiv.appendChild(div);
        });
    }

    // --- ADD/DELETE LOGIC ---
    window.deleteItem = (type, index) => {
        if (confirm(`Are you sure you want to delete this ${type}?`)) {
            if (type === 'theme') fullData.config.themes.splice(index, 1);
            if (type === 'category') fullData.categories.splice(index, 1);
            if (type === 'app') fullData.apps.splice(index, 1);
            if (type === 'template') fullData.config.templates.splice(index, 1);
            buildFullEditor();
        }
    };
    
    addThemeBtn.addEventListener('click', () => {
        fullData.config.themes.push({ name: "New Theme", fontFamily: "sans-serif", light: { primary: "#000000", secondary: "#cccccc" }, dark: { primary: "#ffffff", secondary: "#333333" } });
        buildThemesEditor();
    });
    addCategoryBtn.addEventListener('click', () => {
        fullData.categories.push({ name: "New Category", description: "", icon: "mdi:help-box" });
        buildCategoriesEditor();
    });
    addAppBtn.addEventListener('click', () => {
        fullData.apps.push({ id: Date.now(), name: "New App", category: "", description: "", cost: { monthly: 0, yearly: 0, currency: "USD" } });
        buildAppsEditor();
    });
    addTemplateBtn.addEventListener('click', () => {
        fullData.config.templates.push({ name: "New Template", appIds: [] });
        buildTemplatesEditor();
    });

    // --- SAVE LOGIC ---
    saveJsonBtn.addEventListener('click', () => {
        const newData = { ...fullData, config: { ...fullData.config, themes: [], templates: [] }, categories: [], apps: [] };

        // Save Config
        document.querySelectorAll('#config-editor input[data-config-key]').forEach(input => {
            newData.config[input.dataset.configKey] = input.value;
        });
        document.querySelectorAll('#config-editor input[data-config-type="api"]').forEach(input => {
            newData.config.apis[input.dataset.key] = input.value;
        });
        newData.config.ai.model = document.getElementById('ai-model').value;
        newData.config.ai.prompt = document.getElementById('ai-prompt').value;
        newData.config.currencies.supported = document.getElementById('config-currencies').value.split(',').map(c => c.trim());
        newData.config.currencies.default = document.getElementById('config-default-currency').value;

        // Save Themes
        document.querySelectorAll('#theme-list .item-card').forEach(card => {
            newData.config.themes.push({
                name: card.querySelector('.theme-name').value,
                fontFamily: card.querySelector('.theme-font').value,
                light: { primary: card.querySelector('.theme-light-primary').value, secondary: card.querySelector('.theme-light-secondary').value },
                dark: { primary: card.querySelector('.theme-dark-primary').value, secondary: card.querySelector('.theme-dark-secondary').value }
            });
        });

        // Save Categories
        document.querySelectorAll('#category-list .item-card').forEach(card => {
            newData.categories.push({
                name: card.querySelector('.cat-name').value,
                description: card.querySelector('.cat-desc').value,
                icon: card.querySelector('.cat-icon').value
            });
        });

        // Save Apps
        document.querySelectorAll('#app-list .item-card').forEach((card, index) => {
            newData.apps.push({
                id: fullData.apps[index]?.id || Date.now(),
                name: card.querySelector('.app-name').value,
                category: card.querySelector('.app-cat').value,
                description: card.querySelector('.app-desc').value,
                cost: {
                    monthly: parseFloat(card.querySelector('.app-cost-monthly').value),
                    yearly: parseFloat(card.querySelector('.app-cost-yearly').value),
                    currency: card.querySelector('.app-currency').value
                }
            });
        });

        // Save Templates
        document.querySelectorAll('#template-list .item-card').forEach(card => {
            const checkedAppIds = Array.from(card.querySelectorAll('.template-apps-list input:checked')).map(input => parseInt(input.value));
            newData.config.templates.push({
                name: card.querySelector('.template-name').value,
                appIds: checkedAppIds
            });
        });

        // Trigger download
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(newData, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = 'data.json';
        a.click();
    });
});
