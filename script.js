document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const builderDiv = document.getElementById('builder');
    const categoryTogglesDiv = document.getElementById('categoryToggles');
    const appSelectionArea = document.getElementById('app-selection-area');
    const stackRowsDiv = document.getElementById('stack-rows');
    const costToggle = document.getElementById('costToggle');
    const toggleLabel = document.getElementById('toggleLabel');
    const totalCostEl = document.getElementById('totalCost');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const businessNameInput = document.getElementById('businessName');

    let techData = {};
    let activeCategories = new Set();
    let techStack = []; // Array to hold the apps in the stack

    // Fetch data from JSON file
    async function loadData() {
        try {
            const response = await fetch('data.json');
            techData = await response.json();
            populateCategories();
        } catch (error) {
            console.error('Failed to load tech data:', error);
        }
    }

    function populateCategories() {
        categoryTogglesDiv.innerHTML = '';
        techData.categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.textContent = category.name;
            btn.dataset.category = category.name;
            btn.onclick = () => toggleCategory(category.name, btn);
            categoryTogglesDiv.appendChild(btn);
        });
    }

    function toggleCategory(categoryName, btn) {
        btn.classList.toggle('active');
        if (activeCategories.has(categoryName)) {
            activeCategories.delete(categoryName);
        } else {
            activeCategories.add(categoryName);
        }
        populateApps();
    }

    function populateApps() {
        appSelectionArea.innerHTML = '';
        const appsToShow = techData.apps.filter(app => activeCategories.has(app.category));
        
        appsToShow.forEach(app => {
            const appDiv = document.createElement('div');
            appDiv.className = 'app-item';
            appDiv.draggable = true;
            appDiv.dataset.appId = app.id;
            appDiv.innerHTML = `<img src="${app.icon}" alt="${app.name} icon"><span>${app.name}</span>`;
            appDiv.addEventListener('dragstart', handleDragStart);
            appSelectionArea.appendChild(appDiv);
        });
    }

    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.appId);
    }

    stackRowsDiv.addEventListener('dragover', e => e.preventDefault());
    stackRowsDiv.addEventListener('drop', handleDrop);

    function handleDrop(e) {
        e.preventDefault();
        const appId = e.dataTransfer.getData('text/plain');
        const app = techData.apps.find(a => a.id == appId);
        if (app && !techStack.some(item => item.id == appId)) {
            techStack.push(app);
            renderTechStack();
        }
    }
    
    function renderTechStack() {
        stackRowsDiv.innerHTML = '';
        techStack.forEach(app => {
            const isYearly = costToggle.checked;
            const cost = isYearly ? app.cost.yearly : app.cost.monthly;

            const row = document.createElement('div');
            row.className = 'stack-row';
            row.dataset.appId = app.id;
            row.innerHTML = `
                <div class="stack-row-item stack-app-name">
                    <img src="${app.icon}" alt="${app.name} icon">
                    <span>${app.name}</span>
                </div>
                <div class="stack-row-item">
                    <p>${app.description}</p>
                </div>
                <div class="stack-row-item">
                    $${cost.toFixed(2)}
                    <button class="remove-btn" onclick="removeApp(${app.id})">✖</button>
                </div>
            `;
            stackRowsDiv.appendChild(row);
        });
        updateTotalCost();
    }

    window.removeApp = function(appId) {
        techStack = techStack.filter(app => app.id != appId);
        renderTechStack();
    };

    function updateTotalCost() {
        const isYearly = costToggle.checked;
        const total = techStack.reduce((sum, app) => {
            return sum + (isYearly ? app.cost.yearly : app.cost.monthly);
        }, 0);
        totalCostEl.textContent = `$${total.toFixed(2)}`;
    }
    
    // Event Listeners
    startBtn.addEventListener('click', () => {
        builderDiv.classList.remove('hidden');
    });

    costToggle.addEventListener('change', () => {
        toggleLabel.textContent = costToggle.checked ? 'Yearly' : 'Monthly';
        renderTechStack();
    });

    exportPdfBtn.addEventListener('click', generatePDF);

    // PDF Generation
    function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const businessName = businessNameInput.value || "My Business";
        const title = `${businessName}'s Tech Stack`;
        const isYearly = costToggle.checked;
        const costType = isYearly ? 'Yearly' : 'Monthly';

        doc.setFontSize(22);
        doc.text(title, 105, 20, { align: 'center' });

        const tableColumn = ["Category", "App", "Description", `Cost (${costType})`];
        const tableRows = [];

        techStack.forEach(app => {
            const cost = isYearly ? app.cost.yearly : app.cost.monthly;
            const appData = [app.category, app.name, app.description, `$${cost.toFixed(2)}`];
            tableRows.push(appData);
        });
        
        const totalCost = totalCostEl.textContent;
        tableRows.push(['', '', 'Total', totalCost]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [22, 160, 133] },
            foot: [['', '', 'Total', totalCost]],
            footStyles: { fontStyle: 'bold' }
        });

        doc.save(`${businessName}_Tech_Stack.pdf`);
    }

    loadData();
});
