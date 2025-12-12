// admin-hydrants.js - CRUD für Hydranten

window.Hydrants = {
    // Alle Hydranten
    list: [],
    
    // Gefilterte Liste
    filteredList: [],
    
    // Aktuell bearbeiteter Hydrant
    currentHydrant: null,
    
    // Sortierung
    sortField: null,
    sortDirection: 'asc',
    
    // Suchtext
    searchText: '',
    
    /**
     * Alle Hydranten laden
     */
    async loadAll() {
        try {
            const response = await fetch('../api/hydrants.php', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                this.list = data.data.hydrants || [];
                this.applyFiltersAndSort();
                if (window.AdminMap) {
                    AdminMap.renderMarkers(this.list);
                }
                this.updateStats();
            } else {
                throw new Error(data.error || 'Laden fehlgeschlagen');
            }
        } catch (error) {
            console.error('Fehler beim Laden:', error);
            this.showMessage('Fehler beim Laden der Hydranten: ' + error.message, 'error');
        }
    },
    
    /**
     * Filter und Sortierung anwenden
     */
    applyFiltersAndSort() {
        // Filtern
        this.filteredList = this.list.filter(h => {
            if (!this.searchText) return true;
            const search = this.searchText.toLowerCase();
            return (
                h.title.toLowerCase().includes(search) ||
                (h.description && h.description.toLowerCase().includes(search))
            );
        });
        
        // Sortieren
        if (this.sortField) {
            this.filteredList.sort((a, b) => {
                let aVal = a[this.sortField] || '';
                let bVal = b[this.sortField] || '';
                
                // Spezialbehandlung für Zahlen
                if (this.sortField === 'lat' || this.sortField === 'lng') {
                    aVal = parseFloat(aVal);
                    bVal = parseFloat(bVal);
                }
                
                if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        this.renderTable();
    },
    
    /**
     * Tabelle rendern
     */
    renderTable() {
        const tbody = document.getElementById('hydrantTableBody');
        if (!tbody) return;
        
        if (this.filteredList.length === 0) {
            if (this.searchText) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="empty-state-icon">🔍</div><div>Keine Hydranten gefunden</div></td></tr>';
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="empty-state-icon">💧</div><div>Noch keine Hydranten vorhanden</div></td></tr>';
            }
            return;
        }
        
        tbody.innerHTML = this.filteredList.map(hydrant => `
            <tr onclick="Hydrants.edit('${hydrant.id}')">
                <td><span class="badge badge-${hydrant.type}">${this.getTypeLabel(hydrant.type)}</span></td>
                <td><strong>${this.escapeHtml(hydrant.title)}</strong></td>
                <td>${this.escapeHtml(hydrant.description || '-')}</td>
                <td>${hydrant.lat.toFixed(6)}, ${hydrant.lng.toFixed(6)}</td>
                <td>${this.formatDate(hydrant.updated_at)}</td>
                <td onclick="event.stopPropagation()">
                    <button class="btn-action btn-edit" onclick="Hydrants.edit('${hydrant.id}')">✏️ Bearbeiten</button>
                    <button class="btn-action btn-delete" onclick="Hydrants.confirmDelete('${hydrant.id}')">🗑️ Löschen</button>
                </td>
            </tr>
        `).join('');
    },
    
    /**
     * Statistiken aktualisieren
     */
    updateStats() {
        const totalEl = document.getElementById('statTotal');
        const typesEl = document.getElementById('statTypes');
        
        if (totalEl) {
            totalEl.textContent = this.list.length;
        }
        
        if (typesEl) {
            const counts = this.list.reduce((acc, h) => {
                acc[h.type] = (acc[h.type] || 0) + 1;
                return acc;
            }, {});
            
            const parts = Object.entries(counts).map(([type, count]) => 
                `${count}× ${this.getTypeLabel(type)}`
            );
            
            typesEl.textContent = parts.join(', ') || 'Keine';
        }
    },
    
    /**
     * Neuen Hydrant erstellen
     */
    createNew() {
        this.currentHydrant = null;
        this.showModal();
    },
    
    /**
     * Hydrant bearbeiten
     */
    edit(id) {
        this.currentHydrant = this.list.find(h => h.id === id);
        if (this.currentHydrant) {
            this.showModal();
        }
    },
    
    /**
     * Modal anzeigen
     */
    showModal() {
        const modal = document.getElementById('hydrantModal');
        const form = document.getElementById('hydrantForm');
        const title = document.getElementById('modalTitle');
        
        if (!modal || !form) return;
        
        // Titel setzen
        if (title) {
            title.textContent = this.currentHydrant ? 'Hydrant bearbeiten' : 'Neuer Hydrant';
        }
        
        // Formular füllen
        if (this.currentHydrant) {
            form.id_field.value = this.currentHydrant.id;
            form.type.value = this.currentHydrant.type;
            form.title.value = this.currentHydrant.title;
            form.description.value = this.currentHydrant.description || '';
            form.lat.value = this.currentHydrant.lat;
            form.lng.value = this.currentHydrant.lng;
            form.photo.value = this.currentHydrant.photo || '';
        } else {
            form.reset();
            form.id_field.value = '';
            // Standardposition (Mitte Kappel)
            form.lat.value = '50.000';
            form.lng.value = '7.360';
        }
        
        // Modal-Karte initialisieren
        if (window.AdminMap) {
            setTimeout(() => {
                AdminMap.initModalMap();
            }, 100);
        }
        
        modal.classList.add('active');
    },
    
    /**
     * Modal schließen
     */
    closeModal() {
        const modal = document.getElementById('hydrantModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.currentHydrant = null;
    },
    
    /**
     * Hydrant speichern
     */
    async save(formData) {
        try {
            const isEdit = !!formData.id;
            const url = isEdit 
                ? `../api/hydrants.php?id=${formData.id}`
                : '../api/hydrants.php';
            
            const method = isEdit ? 'PUT' : 'POST';
            
            console.log('Speichere Hydrant:', method, url, formData);
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            // Response-Text holen (auch bei Fehler)
            const responseText = await response.text();
            console.log('Response Status:', response.status);
            console.log('Response Text:', responseText);
            
            // JSON parsen
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('JSON Parse Error:', e);
                console.error('Response war:', responseText);
                throw new Error('Server-Antwort ist kein gültiges JSON. Erste 200 Zeichen: ' + responseText.substring(0, 200));
            }
            
            if (data.success) {
                this.showMessage(
                    isEdit ? 'Hydrant erfolgreich gespeichert' : 'Hydrant erfolgreich erstellt',
                    'success'
                );
                this.closeModal();
                await this.loadAll();
            } else {
                throw new Error(data.error || 'Speichern fehlgeschlagen');
            }
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            this.showMessage('Fehler beim Speichern: ' + error.message, 'error');
        }
    },
    
    /**
     * Löschen bestätigen
     */
    confirmDelete(id) {
        const hydrant = this.list.find(h => h.id === id);
        if (!hydrant) return;
        
        if (confirm(`Hydrant "${hydrant.title}" wirklich löschen?`)) {
            this.delete(id);
        }
    },
    
    /**
     * Hydrant löschen
     */
    async delete(id) {
        try {
            const response = await fetch(`../api/hydrants.php?id=${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('Hydrant erfolgreich gelöscht', 'success');
                await this.loadAll();
            } else {
                throw new Error(data.error || 'Löschen fehlgeschlagen');
            }
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            this.showMessage('Fehler beim Löschen: ' + error.message, 'error');
        }
    },
    
    /**
     * Nachricht anzeigen
     */
    showMessage(text, type = 'info') {
        const container = document.getElementById('messageContainer');
        if (!container) return;
        
        const div = document.createElement('div');
        div.className = `message message-${type}`;
        div.textContent = text;
        
        container.innerHTML = '';
        container.appendChild(div);
        
        // Nach 5 Sekunden ausblenden
        setTimeout(() => {
            div.remove();
        }, 5000);
    },
    
    /**
     * Typ-Label
     */
    getTypeLabel(type) {
        const labels = {
            'h80': 'H80',
            'h100': 'H100',
            'h125': 'H125',
            'h150': 'H150',
            'reservoir': 'Reservoir',
            'building': 'Gebäude'
        };
        return labels[type] || type;
    },
    
    /**
     * Datum formatieren
     */
    formatDate(isoString) {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toLocaleDateString('de-DE');
    },
    
    /**
     * HTML escapen
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

/**
 * Formular-Submit-Handler
 */
function setupHydrantForm() {
    const form = document.getElementById('hydrantForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            type: form.type.value,
            title: form.title.value.trim(),
            description: form.description.value.trim(),
            lat: parseFloat(form.lat.value),
            lng: parseFloat(form.lng.value),
            photo: form.photo.value.trim()
        };
        
        // Bei Edit: ID mitgeben
        if (form.id_field.value) {
            formData.id = form.id_field.value;
        }
        
        // Validierung
        if (!formData.title) {
            alert('Bitte Titel eingeben');
            return;
        }
        
        if (isNaN(formData.lat) || isNaN(formData.lng)) {
            alert('Ungültige Koordinaten');
            return;
        }
        
        await Hydrants.save(formData);
    });
}

/**
 * Modal schließen Button
 */
function setupModalClose() {
    const closeBtn = document.getElementById('closeModal');
    const overlay = document.getElementById('hydrantModal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            Hydrants.closeModal();
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                Hydrants.closeModal();
            }
        });
    }
}

/**
 * Neuer Hydrant Button
 */
function setupNewHydrantButton() {
    const btn = document.getElementById('newHydrantBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            Hydrants.createNew();
        });
    }
}

/**
 * Suchfeld setup
 */
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            Hydrants.searchText = e.target.value;
            Hydrants.applyFiltersAndSort();
        });
    }
}

/**
 * Tabellen-Sortierung setup
 */
function setupTableSort() {
    const headers = document.querySelectorAll('.hydrant-table th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const field = header.dataset.sort;
            
            // Toggle direction wenn gleiche Spalte
            if (Hydrants.sortField === field) {
                Hydrants.sortDirection = Hydrants.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                Hydrants.sortField = field;
                Hydrants.sortDirection = 'asc';
            }
            
            // CSS-Klassen aktualisieren
            headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
            header.classList.add(`sorted-${Hydrants.sortDirection}`);
            
            // Neu rendern
            Hydrants.applyFiltersAndSort();
        });
    });
}

/**
 * Scroll-Indikator für Tabelle (Mobile)
 */
function setupTableScrollIndicator() {
    const container = document.querySelector('.table-container');
    if (!container) return;
    
    container.addEventListener('scroll', () => {
        if (container.scrollLeft > 10) {
            container.classList.add('scrolled');
        } else {
            container.classList.remove('scrolled');
        }
    });
}
