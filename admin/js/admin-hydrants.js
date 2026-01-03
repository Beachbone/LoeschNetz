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

    // Marker-Typen (dynamisch geladen)
    markerTypes: [],

    /**
     * Marker-Typen laden
     */
    async loadMarkerTypes() {
        try {
            const data = await API.get('../api/marker-types.php?endpoint=list');
            this.markerTypes = data.data.types || [];
            this.populateTypeSelect();
        } catch (error) {
            console.error('Fehler beim Laden der Marker-Typen:', error);
            // Fallback auf leeres Array
            this.markerTypes = [];
        }
    },

    /**
     * Typ-Dropdown befüllen
     */
    populateTypeSelect() {
        const select = document.getElementById('type');
        if (!select || this.markerTypes.length === 0) return;

        // Aktuellen Wert merken
        const currentValue = select.value;

        // Dropdown neu befüllen
        select.innerHTML = this.markerTypes.map(type =>
            `<option value="${type.id}">${type.label}</option>`
        ).join('');

        // Wert wiederherstellen (falls vorhanden)
        if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
            select.value = currentValue;
        }
    },

    /**
     * Alle Hydranten laden
     */
    async loadAll() {
        try {
            const data = await API.get('../api/hydrants.php');

            this.list = data.data.hydrants || [];
            this.applyFiltersAndSort();
            if (window.AdminMap) {
                AdminMap.renderMarkers(this.list);
            }
            this.updateStats();
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
                <td data-label="Typ"><span class="badge" style="background-color: ${this.getTypeColor(hydrant.type)};">${this.getTypeLabel(hydrant.type)}</span></td>
                <td data-label="Titel"><strong>${this.escapeHtml(hydrant.title)}</strong></td>
                <td data-label="Beschreibung">${this.escapeHtml(hydrant.description || '-')}</td>
                <td data-label="Koordinaten">${hydrant.lat.toFixed(6)}, ${hydrant.lng.toFixed(6)}</td>
                <td data-label="Geändert">${this.formatDate(hydrant.updated_at)}</td>
                <td data-label="Aktionen" onclick="event.stopPropagation()">
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
        const visibleEl = document.getElementById('statVisible');

        if (totalEl) {
            totalEl.textContent = this.list.length;
        }

        if (typesEl) {
            const counts = this.list.reduce((acc, h) => {
                acc[h.type] = (acc[h.type] || 0) + 1;
                return acc;
            }, {});

            const typeCount = Object.keys(counts).length;
            typesEl.textContent = typeCount > 0 ? typeCount : '-';
        }

        if (visibleEl) {
            // Zeige die Anzahl der gefilterten/sichtbaren Hydranten
            visibleEl.textContent = this.filteredList ? this.filteredList.length : this.list.length;
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
            
            // Foto-Galerie rendern
            if (window.PhotoManager) {
                PhotoManager.renderGallery(this.currentHydrant);
            }
        } else {
            form.reset();
            form.id_field.value = '';
            // Standardposition (Mitte Kappel)
            form.lat.value = '50.000';
            form.lng.value = '7.360';
            
            // Leere Galerie mit Hinweis
            if (window.PhotoManager) {
                const gallery = document.getElementById('photoGallery');
                if (gallery) {
                    gallery.innerHTML = '<div class="photo-empty">Noch keine Fotos<br><small style="color: #666;">💡 Speichern Sie den Hydranten zuerst, um Fotos hinzuzufügen</small></div>';
                }
            }
        }
        
        // Modal-Karte initialisieren
        if (window.AdminMap) {
            setTimeout(() => {
                AdminMap.initModalMap();
            }, 100);
        }

        // Modal öffnen
        modal.classList.add('active');

        // Scroll-Position zurücksetzen (Modal beginnt immer oben)
        setTimeout(() => {
            const modalContent = modal.querySelector('.modal');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
            // Auch das Overlay selbst zurücksetzen
            modal.scrollTop = 0;
        }, 0);
    },
    
    /**
     * Modal schließen
     */
    closeModal() {
        const modal = document.getElementById('hydrantModal');
        if (modal) {
            modal.classList.remove('active');
        }

        // User-Position-Tracking stoppen
        if (window.AdminMap) {
            AdminMap.stopUserLocationTracking();
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

            // API helper automatically includes CSRF token
            const data = isEdit
                ? await API.put(url, formData)
                : await API.post(url, formData);

            // Bei neuem Hydrant: Modal offen lassen und in Edit-Modus wechseln
            if (!isEdit && data.success && data.data && data.data.hydrant) {
                const newHydrant = data.data.hydrant;

                // CurrentHydrant setzen
                this.currentHydrant = newHydrant;

                // PhotoManager ID setzen
                if (window.PhotoManager) {
                    window.PhotoManager.currentHydrantId = newHydrant.id;
                    window.PhotoManager.renderGallery(newHydrant);
                }

                // Form ID-Feld aktualisieren
                const form = document.getElementById('hydrantForm');
                if (form && form.id_field) {
                    form.id_field.value = newHydrant.id;
                }

                // Modal-Titel ändern
                const title = document.getElementById('modalTitle');
                if (title) {
                    title.textContent = 'Hydrant bearbeiten';
                }

                this.showMessage(
                    'Hydrant erfolgreich erstellt. Sie können jetzt Fotos hinzufügen!',
                    'success'
                );

                // Hydranten-Liste im Hintergrund aktualisieren
                await this.loadAll();

                // Karte auf neuen Hydrant zentrieren und hervorheben
                if (window.AdminMap) {
                    AdminMap.centerOnHydrant(newHydrant.id, newHydrant.lat, newHydrant.lng);
                }
            } else {
                // Bei Edit: Modal schließen wie bisher
                this.showMessage(isEdit ? 'Hydrant erfolgreich gespeichert' : 'Hydrant erfolgreich erstellt', 'success');
                this.closeModal();
                await this.loadAll();

                // Karte auf gespeicherten Hydrant zentrieren und hervorheben
                if (isEdit && window.AdminMap && formData.id) {
                    AdminMap.centerOnHydrant(formData.id, formData.lat, formData.lng);
                }
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
            await API.delete(`../api/hydrants.php?id=${id}`);

            this.showMessage('Hydrant erfolgreich gelöscht', 'success');
            await this.loadAll();
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
        // Dynamisch aus geladenen Marker-Typen
        const markerType = this.markerTypes.find(t => t.id === type);
        if (markerType) {
            return markerType.label;
        }

        // Fallback falls Typ nicht gefunden
        return type;
    },

    /**
     * Typ-Farbe
     */
    getTypeColor(type) {
        // Dynamisch aus geladenen Marker-Typen
        const markerType = this.markerTypes.find(t => t.id === type);
        if (markerType && markerType.color) {
            return markerType.color;
        }

        // Fallback-Farbe
        return '#999999';
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
            lng: parseFloat(form.lng.value)
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
 * Mobile Sort Setup
 */
function setupMobileSort() {
    const sortField = document.getElementById('mobileSortField');
    const sortToggle = document.getElementById('mobileSortToggle');

    if (sortField) {
        sortField.addEventListener('change', (e) => {
            Hydrants.sortField = e.target.value;
            Hydrants.sortDirection = 'asc';
            updateSortHeaders();
            Hydrants.applyFiltersAndSort();
        });
    }

    if (sortToggle) {
        sortToggle.addEventListener('click', () => {
            Hydrants.sortDirection = Hydrants.sortDirection === 'asc' ? 'desc' : 'asc';
            sortToggle.style.transform = Hydrants.sortDirection === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)';
            updateSortHeaders();
            Hydrants.applyFiltersAndSort();
        });
    }
}

/**
 * Update header sort indicators
 */
function updateSortHeaders() {
    const headers = document.querySelectorAll('.hydrant-table th[data-sort]');
    headers.forEach(header => {
        header.classList.remove('sorted-asc', 'sorted-desc');
        if (header.dataset.sort === Hydrants.sortField) {
            header.classList.add(`sorted-${Hydrants.sortDirection}`);
        }
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
