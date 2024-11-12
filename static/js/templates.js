// Template management functionality with improved organization and error handling
export class TemplateManager {
    constructor() {
        this.modals = {
            save: null,
            load: null,
            confirm: null
        };
        this.templates = {};
        this.pendingAction = null;
        this.initializeTemplateManagement();
    }

    async initializeTemplateManagement() {
        try {
            this.createModals();
            this.initializeEventListeners();
            this.templates = await this.getStoredTemplates();
        } catch (error) {
            console.error('Failed to initialize template manager:', error);
        }
    }

    createModals() {
        const modalHTML = `
            <!-- Save Template Modal -->
            <div id="saveTemplateModal" class="modal" role="dialog" aria-labelledby="saveTemplateTitle">
                <div class="modal-content">
                    <h2 id="saveTemplateTitle">Save Template</h2>
                    <input type="text" id="templateName" placeholder="Enter template name" 
                           aria-label="Template name" autocomplete="off">
                    <div class="modal-buttons">
                        <button type="button" class="btn-secondary cancel-save">Cancel</button>
                        <button type="button" class="btn-primary save-template">Save</button>
                    </div>
                </div>
            </div>

            <!-- Load Template Modal -->
            <div id="loadTemplateModal" class="modal" role="dialog" aria-labelledby="loadTemplateTitle">
                <div class="modal-content">
                    <h2 id="loadTemplateTitle">Load Template</h2>
                    <div id="templateList" role="list"></div>
                    <div class="modal-buttons">
                        <button type="button" class="btn-secondary close-load">Close</button>
                    </div>
                </div>
            </div>

            <!-- Confirmation Modal -->
            <div id="templateManagerConfirmModal" class="modal" role="dialog" aria-labelledby="confirmTitle">
                <div class="modal-content">
                    <h2 id="confirmTitle">Confirm Action</h2>
                    <p id="templateManagerConfirmMessage"></p>
                    <div class="modal-buttons">
                        <button type="button" class="btn-secondary cancel-confirm">Cancel</button>
                        <button type="button" class="btn-primary confirm-action">Confirm</button>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        this.modals.save = document.getElementById('saveTemplateModal');
        this.modals.load = document.getElementById('loadTemplateModal');
        this.modals.confirm = document.getElementById('templateManagerConfirmModal');

        this.addStyles();
    }

    addStyles() {
        const styles = `
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
                z-index: 1000;
            }

            .modal-content {
                background-color: var(--card);
                margin: 15% auto;
                padding: 20px;
                border-radius: 0.5rem;
                width: 80%;
                max-width: 500px;
                border: 2px solid var(--border);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .modal-content h2 {
                color: var(--primary);
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 1rem;
            }

            .template-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                margin: 5px 0;
                border: 2px solid var(--border);
                border-radius: 0.5rem;
                background: var(--card);
            }

            .template-controls {
                display: flex;
                gap: 0.5rem;
            }

            #templateName {
                width: 100%;
                padding: 0.5rem;
                margin-top: 10px;
                border: 2px solid var(--border);
                border-radius: 0.5rem;
                font-size: 1rem;
                color: var(--text);
            }

            .modal-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }

            .btn-primary, .btn-secondary {
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .btn-primary {
                background-color: var(--primary);
                color: white;
                border: none;
            }

            .btn-primary:hover {
                background-color: var(--primary-hover);
            }

            .btn-secondary {
                background-color: white;
                color: var(--text);
                border: 2px solid var(--border);
            }

            .btn-secondary:hover {
                background-color: var(--background);
            }

            .btn-delete {
                color: var(--error);
                border-color: var(--error);
            }

            .btn-delete:hover {
                background-color: var(--error);
                color: white;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    initializeEventListeners() {
        document.querySelector('#save-template')?.addEventListener('click', () => this.showSaveTemplateDialog());
        document.querySelector('#load-template')?.addEventListener('click', () => this.showLoadTemplateDialog());

        this.modals.save.querySelector('.cancel-save').addEventListener('click', () => this.hideModal('save'));
        this.modals.save.querySelector('.save-template').addEventListener('click', () => this.handleSaveTemplate());
        this.modals.load.querySelector('.close-load').addEventListener('click', () => this.hideModal('load'));
        this.modals.confirm.querySelector('.cancel-confirm').addEventListener('click', () => this.hideModal('confirm'));
        this.modals.confirm.querySelector('.confirm-action').addEventListener('click', () => this.handleConfirmAction());

        const templateNameInput = this.modals.save.querySelector('#templateName');
        templateNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSaveTemplate();
            }
        });
    }

    async handleSaveTemplate() {
        const nameInput = this.modals.save.querySelector('#templateName');
        const name = nameInput.value.trim();

        if (!name) {
            this.showError('Please enter a template name');
            return;
        }

        try {
            if (this.templates[name]) {
                this.showConfirmation(
                    `Template "${name}" already exists. Do you want to overwrite it?`,
                    'save',
                    { name }
                );
            } else {
                await this.saveTemplate(name);
            }
        } catch (error) {
            this.showError('Failed to save template');
            console.error('Save template error:', error);
        }
    }

    async saveTemplate(name) {
        const templateData = this.gatherTemplateData();

        try {
            await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    ...templateData
                })
            });

            this.templates[name] = templateData;
            this.hideModal('save');
            this.showSuccess('Template saved successfully');
        } catch (error) {
            throw new Error('Failed to save template to server');
        }
    }

    gatherTemplateData() {
        const materialData = [];
        const rows = document.querySelectorAll('#materialsTable tbody tr');
        const taxSettings = {
            materialsTaxable: document.getElementById('materialsTaxable')?.checked || false,
            laborTaxable: document.getElementById('laborTaxable')?.checked || false
        };

        rows.forEach(row => {
            const materialItem = this.processMaterialRow(row);
            if (materialItem) {
                materialData.push(materialItem);
            }
        });

        return {
            data: materialData,
            taxSettings
        };
    }

    processMaterialRow(row) {
        const isCustom = row.classList.contains('custom-row');
        const qtyInput = row.querySelector('.quantity-input');
        const quantity = parseInt(qtyInput?.value) || 0;

        if (isCustom) {
            return {
                type: 'Custom Item',
                name: row.cells[1].querySelector('input').value,
                description: row.cells[2].querySelector('input').value,
                unitPrice: parseFloat(row.cells[3].querySelector('input').value) || 0,
                quantity: quantity,
                isTaxable: row.querySelector('.tax-checkbox')?.checked || false,
                isCustom: true
            };
        } else {
            const select = row.cells[2].querySelector('select');
            if (select) {
                return {
                    type: row.cells[1].textContent,
                    styleType: select.value,
                    quantity: quantity,
                    unitPrice: parseFloat(row.cells[3].textContent.replace('$', '')) || 0,
                    isTaxable: row.querySelector('.tax-checkbox')?.checked || false,
                    isCustom: false
                };
            }
        }
        return null;
    }

    async loadTemplate(name) {
        try {
            console.log('Loading template:', name);
            const template = this.templates[name];
            console.log('Retrieved template:', template);
            console.log('Tax settings from template:', template?.taxSettings);
            console.log('Labor taxable status:', template?.taxSettings?.laborTaxable);

            this.clearCustomRows();

            if (typeof calculateInitialQuantities === 'function') {
                calculateInitialQuantities();
            }

            if (Array.isArray(template)) {
                const convertedTemplate = {
                    data: template,
                    taxSettings: {
                        materialsTaxable: document.getElementById('materialsTaxable')?.checked || false,
                        laborTaxable: document.getElementById('laborTaxable')?.checked || false
                    }
                };
                console.log('Converting old format to new:', convertedTemplate);
                await this.applyTemplateData(convertedTemplate.data);
            } else if (template && template.data) {
                console.log('Loading tax settings:', template.taxSettings);

                if (template.taxSettings) {
                    const laborTaxCheckbox = document.getElementById('laborTaxable');
                    const materialsTaxCheckbox = document.getElementById('materialsTaxable');

                    if (laborTaxCheckbox && template.taxSettings.hasOwnProperty('laborTaxable')) {
                        laborTaxCheckbox.checked = template.taxSettings.laborTaxable;
                        laborTaxCheckbox.dispatchEvent(new Event('change'));
                    }

                    if (materialsTaxCheckbox && template.taxSettings.hasOwnProperty('materialsTaxable')) {
                        materialsTaxCheckbox.checked = template.taxSettings.materialsTaxable;
                        materialsTaxCheckbox.dispatchEvent(new Event('change'));
                    }
                }

                await this.applyTemplateData(template.data);
            } else {
                throw new Error('Invalid template format');
            }

            setTimeout(() => {
                if (typeof calculateTotals === 'function') {
                    console.log('Calling final calculateTotals');
                    calculateTotals();
                }
            }, 100);

            this.hideModal('load');
            this.showSuccess('Template loaded successfully');
        } catch (error) {
            console.error('Load template error details:', error);
            this.showError('Failed to load template');
        }
    }

    clearCustomRows() {
        document.querySelectorAll('.custom-row').forEach(row => row.remove());
    }

    async applyTemplateData(data) {
        if (!Array.isArray(data)) {
            console.error('Template data must be an array');
            return;
        }

        data.forEach(item => {
            if (item.isCustom) {
                this.addCustomRow(item);
            } else {
                this.updateStandardRow(item);
            }
        });

        if (typeof calculateInitialQuantities === 'function') {
            calculateInitialQuantities();
        }
        if (typeof calculateTotals === 'function') {
            calculateTotals();
        }
    }

    addCustomRow(item) {
        const tbody = document.querySelector('#materialsTable tbody');
        if (!tbody) return;

        const row = tbody.insertRow();
        row.className = 'custom-row';
        this.createCustomRowCells(row, item);
    }

    createCustomRowCells(row, item) {
        const qtyCell = row.insertCell();
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.className = 'quantity-input';
        qtyInput.value = item.quantity || '0';
        qtyInput.addEventListener('input', () => {
            if (typeof calculateTotals === 'function') calculateTotals();
        });
        qtyCell.appendChild(qtyInput);

        const nameCell = row.insertCell();
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = item.name;
        nameCell.appendChild(nameInput);

        const descCell = row.insertCell();
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.value = item.description || '';
        descCell.appendChild(descInput);

        const priceCell = row.insertCell();
        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.step = '0.01';
        priceInput.value = item.unitPrice;
        priceInput.addEventListener('input', () => {
            if (typeof calculateTotals === 'function') calculateTotals();
        });
        priceCell.appendChild(priceInput);

        const taxCell = row.insertCell();
        const taxCheckbox = document.createElement('input');
        taxCheckbox.type = 'checkbox';
        taxCheckbox.className = 'tax-checkbox';
        taxCheckbox.checked = item.isTaxable;
        taxCheckbox.addEventListener('change', () => {
            if (typeof calculateTotals === 'function') calculateTotals();
        });
        taxCell.appendChild(taxCheckbox);

        row.insertCell().textContent = '$0.00';
    }

    updateStandardRow(item) {
        const rows = document.querySelectorAll('#materialsTable tbody tr');
        for (const row of rows) {
            if (row.cells[1].textContent.trim() === item.type) {
                const select = row.cells[2].querySelector('select');
                const taxCheckbox = row.querySelector('.tax-checkbox');
                const qtyInput = row.querySelector('.quantity-input');

                if (select) {
                    select.value = item.styleType;
                    select.dispatchEvent(new Event('change'));
                }

                if (taxCheckbox) {
                    taxCheckbox.checked = item.isTaxable;
                    const inputEvent = new Event('input', { bubbles: true });
                    const changeEvent = new Event('change', { bubbles: true });
                    taxCheckbox.dispatchEvent(inputEvent);
                    taxCheckbox.dispatchEvent(changeEvent);
                }

                if (qtyInput && item.quantity) {
                    qtyInput.value = item.quantity;
                    const inputEvent = new Event('input', { bubbles: true });
                    const changeEvent = new Event('change', { bubbles: true });
                    qtyInput.dispatchEvent(inputEvent);
                    qtyInput.dispatchEvent(changeEvent);
                }

                break;
            }
        }
    }

    showSaveTemplateDialog() {
        this.showModal('save');
        const nameInput = this.modals.save.querySelector('#templateName');
        nameInput.value = '';
        nameInput.focus();
    }

    async showLoadTemplateDialog() {
        const templateList = this.modals.load.querySelector('#templateList');
        templateList.innerHTML = '';

        if (Object.keys(this.templates).length === 0) {
            templateList.innerHTML = '<p class="text-center py-4">No saved templates</p>';
        } else {
            Object.keys(this.templates).forEach(name => {
                templateList.appendChild(this.createTemplateListItem(name));
            });
        }

        this.showModal('load');
    }

    createTemplateListItem(name) {
        const item = document.createElement('div');
        item.className = 'template-item';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;

        const controls = document.createElement('div');
        controls.className = 'template-controls';

        const loadButton = document.createElement('button');
        loadButton.textContent = 'Load';
        loadButton.className = 'btn-primary';
        loadButton.addEventListener('click', () => this.loadTemplate(name));

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '🗑️';
        deleteButton.className = 'btn-secondary btn-delete';
        deleteButton.addEventListener('click', () => this.confirmDeleteTemplate(name));

        controls.appendChild(loadButton);
        controls.appendChild(deleteButton);
        item.appendChild(nameSpan);
        item.appendChild(controls);

        return item;
    }

    showConfirmation(message, action, data = {}) {
        const messageEl = this.modals.confirm.querySelector('#templateManagerConfirmMessage');
        messageEl.textContent = message;

        this.pendingAction = { action, data };
        this.showModal('confirm');
    }

    async handleConfirmAction() {
        if (!this.pendingAction) return;

        try {
            const { action, data } = this.pendingAction;

            switch (action) {
                case 'save':
                    await this.saveTemplate(data.name);
                    break;
                case 'delete':
                    await this.deleteTemplate(data.name);
                    break;
                default:
                    console.warn('Unknown action:', action);
            }
        } catch (error) {
            console.error('Action failed:', error);
            this.showError('Failed to complete action');
        } finally {
            this.pendingAction = null;
            this.hideModal('confirm');
        }
    }

    confirmDeleteTemplate(name) {
        this.showConfirmation(
            `Are you sure you want to delete template "${name}"?`,
            'delete',
            { name }
        );
    }

    async deleteTemplate(name) {
        try {
            await fetch(`/api/templates/${name}`, {
                method: 'DELETE'
            });

            delete this.templates[name];
            await this.showLoadTemplateDialog();
            this.showSuccess('Template deleted successfully');
        } catch (error) {
            throw new Error('Failed to delete template');
        }
    }

    showModal(type) {
        if (this.modals[type]) {
            this.modals[type].style.display = 'block';
        }
    }

    hideModal(type) {
        if (this.modals[type]) {
            this.modals[type].style.display = 'none';
        }
    }

    async getStoredTemplates() {
        try {
            const response = await fetch('/api/templates');
            const templates = await response.json();
            return templates || {};
        } catch (error) {
            console.error('Error loading templates:', error);
            return {};
        }
    }

    showSuccess(message) {
        console.log('Success:', message);
    }

    showError(message) {
        console.error('Error:', message);
        alert(message);
    }
}

window.templateManager = new TemplateManager();
export const templateManager = window.templateManager;