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
        let categoriesHtml = '<div class="editor-section"><h2>Categories</h2><div id="category-list">';
        currentData.categories.forEach((cat, index) => {
            categoriesHtml += `<div><input type="text" value="${cat.name}" data-index="${index}" class="category-name"></div>`;
        });
        categoriesHtml += '</div><button id="addCategoryBtn">Add Category</button></div>';
        editorForms.innerHTML += categoriesHtml;

        // Apps Editor
        let appsHtml = '<div class="editor-section"><h2>Apps</h2><div id="app-list">';
        currentData.apps.forEach((app, index) => {
            appsHtml += `
                <div class="app-editor-item">
                    <input type="text" placeholder="App Name" value="${app.name}" data-index="${index}" class="app-name">
                    <textarea placeholder="Description" data-index="${index}" class="app-desc">${app.description}</textarea>
                    <input type="text" placeholder="Icon Path" value="${app.icon}" data-index="${index}" class="app-icon">
                    <select data-index="${index}" class="app-category">${createCategoryOptions(app.category)}</select>
                    <input type="number" step="0.01" placeholder="Monthly Cost" value="${app.cost.monthly}" data-index="${index}" class="app-cost-monthly">
                    <input type="number" step="0.01" placeholder="Yearly Cost" value="${app.cost.yearly}" data-index="${index}" class="app-cost-yearly">
                </div>
            `;
        });
        appsHtml += '</div><button id="addAppBtn">Add App</button></div>';
        editorForms.innerHTML += appsHtml;
        
        // Add event listeners for dynamic buttons
        document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
        document.getElementById('addAppBtn').addEventListener('click', addApp);
    }
    
    function createCategoryOptions(selectedCategory) {
        let options = '';
        (currentData.categories || []).forEach(cat => {
            options += `<option value="${cat.name}" ${cat.name === selectedCategory ? 'selected' : ''}>${cat.name}</option>`;
        });
        return options;
    }

    function addCategory() {
        const categoryList = document.getElementById('category-list');
        const newCatDiv = document.createElement('div');
        newCatDiv.innerHTML = `<input type="text" placeholder="New Category" class="category-name">`;
        categoryList.appendChild(newCatDiv);
    }
    
    function addApp() {
        const appList = document.getElementById('app-list');
        const newAppDiv = document.createElement('div');
        newAppDiv.className = 'app-editor-item';
        newAppDiv.innerHTML = `
            <input type="text" placeholder="App Name" class="app-name">
            <textarea placeholder="Description" class="app-desc"></textarea>
            <input type="text" placeholder="Icon Path" value="icons/sunshine.png" class="app-icon">
            <select class="app-category">${createCategoryOptions('')}</select>
            <input type="number" step="0.01" placeholder="Monthly Cost" value="20.00" class="app-cost-monthly">
            <input type="number" step="0.01" placeholder="Yearly Cost" value="17.00" class="app-cost-yearly">
        `;
        appList.appendChild(newAppDiv);
    }
    
    function saveData() {
        const updatedData = { settings: currentData.settings || {}, categories: [], apps: [] };

        document.querySelectorAll('.category-name').forEach(input => {
            if(input.value) updatedData.categories.push({ name: input.value });
        });

        document.querySelectorAll('.app-editor-item').forEach((item, index) => {
            const name = item.querySelector('.app-name').value;
            if (!name) return; // Don't save empty app entries
            
            updatedData.apps.push({
                id: currentData.apps[index]?.id || Date.now() + index, // Keep old ID or generate new
                name: name,
                description: item.querySelector('.app-desc').value,
                icon: item.querySelector('.app-icon').value,
                category: item.querySelector('.app-category').value,
                cost: {
                    monthly: parseFloat(item.querySelector('.app-cost-monthly').value) || 0,
                    yearly: parseFloat(item.querySelector('.app-cost-yearly').value) || 0
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
