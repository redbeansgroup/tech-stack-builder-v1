document.addEventListener('DOMContentLoaded', () => {
    const editorForms = document.getElementById('editor-forms');
    const saveJsonBtn = document.getElementById('saveJsonBtn');
    let currentData = {};

    async function loadInitialJson() {
        try {
            const response = await fetch('data.json');
            currentData = await response.json();
            buildEditor();
        } catch (error) {
            console.error('Could not load data.json:', error);
            // Initialize with empty structure if file doesn't exist
            currentData = { settings: {}, categories: [], apps: [] };
            buildEditor();
        }
    }

    function buildEditor() {
        // Clear previous forms
        editorForms.innerHTML = '';
        
        // Settings Editor
        // (Simplified for brevity - can be expanded for fonts, colors)

        // Categories Editor
        let categoriesHtml = '<div class="editor-section"><h2>Categories</h2>';
        currentData.categories.forEach((cat, index) => {
            categoriesHtml += `<div><input type="text" value="${cat.name}" data-index="${index}" class="category-name"></div>`;
        });
        categoriesHtml += '<button id="addCategoryBtn">Add Category</button></div>';
        editorForms.innerHTML += categoriesHtml;

        // Apps Editor
        let appsHtml = '<div class="editor-section"><h2>Apps</h2>';
        currentData.apps.forEach((app, index) => {
            appsHtml += `
                <div class="app-editor-item" style="border-top: 1px solid #ddd; padding-top: 10px;">
                    <input type="text" placeholder="App Name" value="${app.name}" data-index="${index}" class="app-name">
                    <textarea placeholder="Description" data-index="${index}" class="app-desc">${app.description}</textarea>
                    <input type="text" placeholder="Icon Path (e.g., icons/app.png)" value="${app.icon}" data-index="${index}" class="app-icon">
                    <select data-index="${index}" class="app-category">${createCategoryOptions(app.category)}</select>
                    <input type="number" step="0.01" placeholder="Monthly Cost" value="${app.cost.monthly}" data-index="${index}" class="app-cost-monthly">
                    <input type="number" step="0.01" placeholder="Yearly Cost" value="${app.cost.yearly}" data-index="${index}" class="app-cost-yearly">
                </div>
            `;
        });
        appsHtml += '<button id="addAppBtn">Add App</button></div>';
        editorForms.innerHTML += appsHtml;
    }
    
    function createCategoryOptions(selectedCategory) {
        let options = '';
        currentData.categories.forEach(cat => {
            options += `<option value="${cat.name}" ${cat.name === selectedCategory ? 'selected' : ''}>${cat.name}</option>`;
        });
        return options;
    }
    
    function saveData() {
        // Collect data from forms and build the new JSON object
        const updatedData = { settings: currentData.settings, categories: [], apps: [] };

        document.querySelectorAll('.category-name').forEach(input => {
            updatedData.categories.push({ name: input.value });
        });

        document.querySelectorAll('.app-editor-item').forEach((item, index) => {
            updatedData.apps.push({
                id: currentData.apps[index]?.id || Date.now(), // Keep old ID or generate new
                name: item.querySelector('.app-name').value,
                description: item.querySelector('.app-desc').value,
                icon: item.querySelector('.app-icon').value,
                category: item.querySelector('.app-category').value,
                cost: {
                    monthly: parseFloat(item.querySelector('.app-cost-monthly').value),
                    yearly: parseFloat(item.querySelector('.app-cost-yearly').value)
                }
            });
        });

        // Trigger download
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(updatedData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    saveJsonBtn.addEventListener('click', saveData);

    loadInitialJson();
});
