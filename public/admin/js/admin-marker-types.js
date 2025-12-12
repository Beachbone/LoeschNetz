// admin/js/admin-marker-types.js - Marker-Typen Verwaltung

window.MarkerTypes = {
    markerTypes: [],
    sortField: 'id',
    sortAscending: true,
    
    /**
     * Lade alle Marker-Typen
     */
    async loadMarkerTypes() {
        try {
            const data = await API.get('../api/marker-types.php?endpoint=list');

            this.markerTypes = data.data.types || [];
            this.renderTable();
        } catch (error) {
            console.error('Fehler beim Laden der Marker-Typen:', error);
            showMessage('Fehler beim Laden der Marker-Typen: ' + error.message, 'error');
        }
    },
    
    /**
     * Marker-Typen sortieren
     */
    sortMarkerTypes() {
        this.markerTypes.sort((a, b) => {
            let aVal = a[this.sortField];
            let bVal = b[this.sortField];

            // Null-Werte behandeln
            if (!aVal) aVal = '';
            if (!bVal) bVal = '';

            let comparison = 0;
            if (typeof aVal === 'string') {
                comparison = aVal.localeCompare(bVal);
            } else {
                comparison = aVal < bVal ? -1 : (aVal > bVal ? 1 : 0);
            }

            return this.sortAscending ? comparison : -comparison;
        });
    },

    /**
     * Tabelle rendern
     */
    renderTable() {
        const tbody = document.querySelector('#markerTypesTable tbody');
        if (!tbody) return;

        if (this.markerTypes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Keine Marker-Typen vorhanden</td></tr>';
            return;
        }

        // Sortieren vor dem Rendern
        this.sortMarkerTypes();
        
        tbody.innerHTML = this.markerTypes.map(type => `
            <tr data-id="${type.id}">
                <td data-label="Icon">
                    <img src="../icons/${type.icon}" alt="${type.label}"
                         style="width: 25px; height: 41px; vertical-align: middle;">
                </td>
                <td data-label="ID"><strong>${type.id}</strong></td>
                <td data-label="Bezeichnung">${type.label}</td>
                <td data-label="Farbe">
                    <span class="color-badge" style="background: ${type.color};" title="${type.color}">
                        ${type.color}
                    </span>
                </td>
                <td data-label="Beschreibung">${type.description}</td>
                <td data-label="Aktionen" class="actions">
                    <button class="btn-icon" onclick="MarkerTypes.editMarkerType('${type.id}')" title="Bearbeiten">
                        ✏️
                    </button>
                    <button class="btn-icon btn-danger" onclick="MarkerTypes.deleteMarkerType('${type.id}')" title="Löschen">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    },
    
    /**
     * Modal öffnen (Neu/Bearbeiten)
     */
    openModal(markerType = null) {
        const modal = document.getElementById('markerTypeModal');
        const form = document.getElementById('markerTypeForm');
        const title = document.getElementById('modalTitle');
        const idInput = document.getElementById('markerTypeId');
        
        // Modus setzen
        const isEdit = !!markerType;
        title.textContent = isEdit ? 'Marker-Typ bearbeiten' : 'Neuer Marker-Typ';
        form.dataset.mode = isEdit ? 'edit' : 'create';
        form.dataset.id = isEdit ? markerType.id : '';
        
        // Formular füllen
        if (isEdit) {
            document.getElementById('markerTypeId').value = markerType.id;
            document.getElementById('markerTypeLabel').value = markerType.label;
            document.getElementById('markerTypeColor').value = markerType.color;
            document.getElementById('markerTypeDescription').value = markerType.description;
            
            // ID readonly bei Bearbeitung
            idInput.readOnly = true;
            idInput.style.backgroundColor = '#f5f5f5';
        } else {
            form.reset();
            idInput.readOnly = false;
            idInput.style.backgroundColor = '';
        }
        
        // Color Picker Preview
        this.updateColorPreview();
        
        modal.classList.add('active');
    },
    
    /**
     * Modal schließen
     */
    closeModal() {
        const modal = document.getElementById('markerTypeModal');
        modal.classList.remove('active');
        document.getElementById('markerTypeForm').reset();
    },
    
    /**
     * Farb-Vorschau aktualisieren
     */
    updateColorPreview() {
        const colorInput = document.getElementById('markerTypeColor');
        const preview = document.getElementById('colorPreview');
        
        if (colorInput && preview) {
            preview.style.backgroundColor = colorInput.value;
            preview.textContent = colorInput.value.toUpperCase();
        }
    },
    
    /**
     * Marker-Typ bearbeiten
     */
    editMarkerType(id) {
        const markerType = this.markerTypes.find(t => t.id === id);
        if (markerType) {
            this.openModal(markerType);
        }
    },
    
    /**
     * Marker-Typ speichern
     */
    async saveMarkerType(formData) {
        const form = document.getElementById('markerTypeForm');
        const isEdit = form.dataset.mode === 'edit';
        const id = form.dataset.id;
        
        const data = {
            id: formData.get('id'),
            label: formData.get('label'),
            color: formData.get('color'),
            description: formData.get('description')
        };
        
        try {
            const url = isEdit
                ? `../api/marker-types.php?endpoint=update&id=${id}`
                : '../api/marker-types.php?endpoint=create';

            const result = isEdit
                ? await API.put(url, data)
                : await API.post(url, data);

            showMessage(result.data.message || 'Marker-Typ gespeichert', 'success');
            this.closeModal();
            await this.loadMarkerTypes();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            showMessage('Fehler: ' + error.message, 'error');
        }
    },
    
    /**
     * Marker-Typ löschen
     */
    async deleteMarkerType(id) {
        const markerType = this.markerTypes.find(t => t.id === id);
        if (!markerType) return;
        
        if (!confirm(`Marker-Typ "${markerType.label}" wirklich löschen?\n\nDieser Typ darf nicht mehr von Hydranten verwendet werden.`)) {
            return;
        }
        
        try {
            await API.delete(`../api/marker-types.php?endpoint=delete&id=${id}`);

            showMessage('Marker-Typ gelöscht', 'success');
            await this.loadMarkerTypes();
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            showMessage('Fehler: ' + error.message, 'error');
        }
    }
};

/**
 * Event-Listener Setup
 */
function setupMarkerTypes() {
    // Neuer Marker-Typ Button
    const newBtn = document.getElementById('newMarkerTypeBtn');
    if (newBtn) {
        newBtn.addEventListener('click', () => {
            MarkerTypes.openModal();
        });
    }
    
    // Form Submit
    const form = document.getElementById('markerTypeForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            await MarkerTypes.saveMarkerType(formData);
        });
    }
    
    // Color Picker Live-Update
    const colorInput = document.getElementById('markerTypeColor');
    if (colorInput) {
        colorInput.addEventListener('input', () => {
            MarkerTypes.updateColorPreview();
        });
    }
    
    // Modal schließen
    const cancelBtn = document.getElementById('cancelMarkerType');
    const closeBtn = document.getElementById('closeMarkerType');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => MarkerTypes.closeModal());
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => MarkerTypes.closeModal());
    }
    
    // Initial laden
    MarkerTypes.loadMarkerTypes();
}
