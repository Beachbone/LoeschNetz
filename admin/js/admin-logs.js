// admin-logs.js - Logging anzeigen

window.Logs = {
    // Alle Log-Einträge
    list: [],

    // Gefilterte Liste
    filteredList: [],

    // Sortierung
    sortField: 'timestamp',
    sortDirection: 'desc', // Neueste zuerst

    // Filter
    searchText: '',
    filterAction: '',

    /**
     * Alle Log-Einträge laden
     */
    async loadAll() {
        try {
            const response = await fetch('../api/logs.php?limit=1000', {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.list = data.data.entries || [];
                this.applyFiltersAndSort();
                this.updateStats(data.data);
            } else {
                throw new Error(data.error || 'Laden fehlgeschlagen');
            }
        } catch (error) {
            console.error('Fehler beim Laden der Logs:', error);
            this.showMessage('Fehler beim Laden der Logs: ' + error.message, 'error');
        }
    },

    /**
     * Filter und Sortierung anwenden
     */
    applyFiltersAndSort() {
        // Filtern
        this.filteredList = this.list.filter(entry => {
            // Aktion filtern
            if (this.filterAction && entry.action !== this.filterAction) {
                return false;
            }

            // Textsuche
            if (this.searchText) {
                const search = this.searchText.toLowerCase();
                const searchableText = [
                    entry.user,
                    entry.action,
                    entry.resource,
                    JSON.stringify(entry.details),
                    entry.ip
                ].join(' ').toLowerCase();

                if (!searchableText.includes(search)) {
                    return false;
                }
            }

            return true;
        });

        // Sortieren
        if (this.sortField) {
            this.filteredList.sort((a, b) => {
                let aVal = this.getFieldValue(a, this.sortField);
                let bVal = this.getFieldValue(b, this.sortField);

                // String-Vergleich
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = (bVal || '').toLowerCase();
                }

                if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        this.renderTable();
    },

    /**
     * Feld-Wert für Sortierung holen
     */
    getFieldValue(entry, field) {
        if (field === 'details') {
            // Details als String für Sortierung
            return JSON.stringify(entry.details || {});
        }
        return entry[field] || '';
    },

    /**
     * Tabelle rendern
     */
    renderTable() {
        const tbody = document.getElementById('logsTableBody');
        if (!tbody) return;

        if (this.filteredList.length === 0) {
            if (this.searchText || this.filterAction) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><div class="empty-state-icon">🔍</div><div>Keine Log-Einträge gefunden</div></td></tr>';
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><div class="empty-state-icon">📋</div><div>Noch keine Log-Einträge vorhanden</div></td></tr>';
            }
            return;
        }

        tbody.innerHTML = this.filteredList.map((entry, index) => {
            const actionClass = this.getActionClass(entry.action);
            const detailsHtml = this.formatDetails(entry.details);

            return `
                <tr>
                    <td data-label="#" class="text-muted">${entry._index || index + 1}</td>
                    <td data-label="Zeitstempel">${this.formatTimestamp(entry.timestamp)}</td>
                    <td data-label="Benutzer"><strong>${this.escapeHtml(entry.user)}</strong></td>
                    <td data-label="Aktion"><span class="badge badge-${actionClass}">${entry.action}</span></td>
                    <td data-label="Resource">${this.escapeHtml(entry.resource)}</td>
                    <td data-label="Details">${detailsHtml}</td>
                    <td data-label="IP-Adresse" class="text-muted">${this.escapeHtml(entry.ip)}</td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Details formatieren
     */
    formatDetails(details) {
        if (!details || typeof details !== 'object') {
            return '-';
        }

        const parts = [];

        // ID
        if (details.id) {
            parts.push(`<strong>ID:</strong> ${this.escapeHtml(details.id)}`);
        }

        // Title
        if (details.title) {
            parts.push(`<strong>Titel:</strong> ${this.escapeHtml(details.title)}`);
        }

        // Type
        if (details.type) {
            parts.push(`<strong>Typ:</strong> ${this.escapeHtml(details.type)}`);
        }

        // Updated fields (für UPDATE)
        if (details.updated_fields && Array.isArray(details.updated_fields)) {
            parts.push(`<strong>Geändert:</strong> ${details.updated_fields.join(', ')}`);
        }

        return parts.length > 0 ? parts.join(' • ') : JSON.stringify(details);
    },

    /**
     * Zeitstempel formatieren
     */
    formatTimestamp(isoString) {
        if (!isoString) return '-';

        try {
            const date = new Date(isoString);
            const dateStr = date.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const timeStr = date.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            return `${dateStr}<br><small class="text-muted">${timeStr}</small>`;
        } catch (e) {
            return isoString;
        }
    },

    /**
     * Action-CSS-Klasse
     */
    getActionClass(action) {
        switch (action) {
            case 'CREATE': return 'success';
            case 'UPDATE': return 'warning';
            case 'DELETE': return 'danger';
            default: return 'default';
        }
    },

    /**
     * Statistiken aktualisieren
     */
    updateStats(data) {
        const totalEl = document.getElementById('statTotal');
        const createEl = document.getElementById('statCreate');
        const updateEl = document.getElementById('statUpdate');
        const deleteEl = document.getElementById('statDelete');

        // Zähle Aktionen
        const counts = this.list.reduce((acc, entry) => {
            acc[entry.action] = (acc[entry.action] || 0) + 1;
            return acc;
        }, {});

        // Aktualisiere Stat Cards
        if (totalEl) {
            totalEl.textContent = data.total || this.list.length;
        }

        if (createEl) {
            createEl.textContent = counts.CREATE || 0;
        }

        if (updateEl) {
            updateEl.textContent = counts.UPDATE || 0;
        }

        if (deleteEl) {
            deleteEl.textContent = counts.DELETE || 0;
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
     * HTML escapen
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

/**
 * Refresh Button
 */
function setupRefreshButton() {
    const btn = document.getElementById('refreshBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            Logs.loadAll();
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
            Logs.searchText = e.target.value;
            Logs.applyFiltersAndSort();
        });
    }
}

/**
 * Action-Filter setup
 */
function setupFilterAction() {
    const filterAction = document.getElementById('filterAction');
    if (filterAction) {
        filterAction.addEventListener('change', (e) => {
            Logs.filterAction = e.target.value;
            Logs.applyFiltersAndSort();
        });
    }
}

/**
 * Tabellen-Sortierung setup
 */
function setupTableSort() {
    const headers = document.querySelectorAll('.logs-table th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const field = header.dataset.sort;

            // Toggle direction wenn gleiche Spalte
            if (Logs.sortField === field) {
                Logs.sortDirection = Logs.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                Logs.sortField = field;
                Logs.sortDirection = field === 'timestamp' ? 'desc' : 'asc'; // Timestamp default: neueste zuerst
            }

            // CSS-Klassen aktualisieren
            headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
            header.classList.add(`sorted-${Logs.sortDirection}`);

            // Neu rendern
            Logs.applyFiltersAndSort();
        });
    });
}
