document.addEventListener('DOMContentLoaded', () => {
    const jsonFileInput = document.getElementById('jsonFileInput');
    const editorContent = document.getElementById('editor-content');
    const categoryListDiv = document.getElementById('category-list');
    const appListDiv = document.getElementById('app-list');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const addAppBtn = document.getElementById('addAppBtn');
    const saveJsonBtn = document.getElementById('saveJsonBtn');

    let currentData = {
        settings: {},
        categories: [],
        apps: []
    };

    // Event listener for the file input
    jsonFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                currentData = JSON.parse(e.target.result);
                editorContent.classList.remove('hidden');
                buildEditor();
            } catch (error) {
                alert('Error parsing JSON file. Please check the file format.');
                console.error("JSON Parse Error:", error);
            }
        };
        reader.readAsText(file);
    });

    function buildEditor() {
        buildCategoryList();
        buildAppList();
    }

    // Renders the list of category input fields
    function buildCategoryList() {
        categoryListDiv.innerHTML = '';
        currentData.categories.forEach((cat, index) => {
            const div = document.createElement('div');
            div.className = 'category-item';
            div.innerHTML = `
                <input type="text" value="${cat.name}" data-type="category" data-index="${index}">
                <button class="delete-btn" data-type="category" data-index="${index}">×</button>
            `;
            categoryListDiv.appendChild(div);
        });
    }

    // Renders the list of app editor cards
    function buildAppList() {
        appListDiv.innerHTML = '';
        currentData.apps.forEach((app, index) => {
            const div = document.createElement('div');
            div.className = 'app-card';
            div.innerHTML = `
                <input type="text" placeholder="App Name" value="${app.name}" data-index="${index}" data-field="name">
                <textarea placeholder="Description" data-index="${index}" data-field="description">${app.description}</textarea>
                <input type="text" placeholder="Icon Path" value="${app.icon}" data-index="${index}" data-field="icon">
                <select data-index="${index}" data-field="category">${createCategoryOptions(app.category)}</select>
                <input type="number" step="0.01" placeholder="Monthly Cost" value="${app.cost.monthly}" data-index="${index}" data-field="cost-monthly">
                <input type="number" step="0.01" placeholder="Yearly Cost" value="${app.cost.yearly}" data-index="${index}" data-field="cost-yearly">
                <button class="delete-btn" data-type="app" data-index="${index}">×</button>
            `;
            appListDiv.appendChild(div);
        });
    }

    function createCategoryOptions(selectedCategory) {
        return currentData.categories.map(cat => 
            `<option value="${cat.name}" ${cat.name === selectedCategory ? 'selected' : ''}>${cat.name}</option>`
        ).join('');
    }

    // --- Event Handlers for Adding/Deleting ---
    addCategoryBtn.addEventListener('click', () => {
        currentData.categories.push({ name: "New Category" });
        buildCategoryList();
    });

    addAppBtn.addEventListener('click', () => {
        const newId = currentData.apps.length > 0 ? Math.max(...currentData.apps.map(a => a.id)) + 1 : 1;
        currentData.apps.push({
            id: newId,
            name: "New App",
            category: currentData.categories[0]?.name || "",
            description: "A short description.",
            icon: "icons/sunshine.png",
            cost: { monthly: 20.00, yearly: 17.00 }
        });
        buildAppList();
    });

    // Use event delegation for delete buttons
    document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const type = event.target.dataset.type;
            const index = parseInt(event.target.dataset.index, 10);
            
            if (confirm(`Are you sure you want to delete this ${type}?`)) {
                if (type === 'category') {
                    currentData.categories.splice(index, 1);
                    buildCategoryList(); // Re-render categories
                    buildAppList(); // Re-render apps to update category dropdowns
                } else if (type === 'app') {
                    currentData.apps.splice(index, 1);
                    buildAppList();
                }
            }
        }
    });

    // --- Save Logic ---
    saveJsonBtn.addEventListener('click', () => {
        const updatedData = { settings: currentData.settings, categories: [], apps: [] };

        // Save categories
        document.querySelectorAll('#category-list input').forEach(input => {
            if (input.value) {
                updatedData.categories.push({ name: input.value });
            }
        });

        // Save apps
        document.querySelectorAll('#app-list .app-card').forEach((card, i) => {
            const originalApp = currentData.apps[i] || { id: Date.now() };
            const appData = { id: originalApp.id };
            card.querySelectorAll('input, textarea, select').forEach(field => {
                const key = field.dataset.field;
                if (key === 'cost-monthly') {
                    appData.cost = { ...appData.cost, monthly: parseFloat(field.value) || 0 };
                } else if (key === 'cost-yearly') {
                    appData.cost = { ...appData.cost, yearly: parseFloat(field.value) || 0 };
                } else {
                    appData[key] = field.value;
                }
            });
            if (appData.name) {
                updatedData.apps.push(appData);
            }
        });

        // Trigger download
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(updatedData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
});
