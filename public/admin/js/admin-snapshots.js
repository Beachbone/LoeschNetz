// admin/js/admin-snapshots.js - Snapshot-Verwaltung

window.Snapshots = {
    snapshots: [],
    sortField: 'date',
    sortAscending: false, // Newest first by default
    selectedDate: null,
    
    /**
     * Initialisierung
     */
    async init() {
        console.log('📂 Snapshots initialisieren...');
        
        // Event-Listener
        document.getElementById('createSnapshotBtn')?.addEventListener('click', () => this.createSnapshot());
        document.getElementById('refreshSnapshotsBtn')?.addEventListener('click', () => this.loadSnapshots());
        
        // Modal-Handler
        document.getElementById('closePreview')?.addEventListener('click', () => this.closePreviewModal());
        document.getElementById('closeRestore')?.addEventListener('click', () => this.closeRestoreModal());
        document.getElementById('closeDelete')?.addEventListener('click', () => this.closeDeleteModal());

        document.getElementById('confirmRestoreBtn')?.addEventListener('click', () => this.confirmRestore());
        document.getElementById('cancelRestoreBtn')?.addEventListener('click', () => this.closeRestoreModal());

        document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => this.confirmDelete());
        document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => this.closeDeleteModal());

        // Close modals when clicking outside
        ['previewModal', 'restoreModal', 'deleteModal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        if (modalId === 'previewModal') this.closePreviewModal();
                        else if (modalId === 'restoreModal') this.closeRestoreModal();
                        else if (modalId === 'deleteModal') this.closeDeleteModal();
                    }
                });
            }
        });

        // Close modals with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('previewModal').classList.contains('active')) {
                    this.closePreviewModal();
                } else if (document.getElementById('restoreModal').classList.contains('active')) {
                    this.closeRestoreModal();
                } else if (document.getElementById('deleteModal').classList.contains('active')) {
                    this.closeDeleteModal();
                }
            }
        });

        // Snapshots laden
        await this.loadSnapshots();
    },
    
    /**
     * Snapshots laden
     */
    async loadSnapshots() {
        const container = document.getElementById('snapshotsList');
        container.innerHTML = '<div class="loading">Lade Snapshots...</div>';
        
        try {
            console.log('📂 Lade Snapshots von API...');
            const data = await API.get('../api/snapshots.php?action=list');
            console.log('📂 API Response Data:', data);

            this.snapshots = data.data.snapshots || [];
            console.log('📂 Snapshots geladen:', this.snapshots.length);

            this.updateStats();
            this.renderSnapshots();
            
        } catch (error) {
            console.error('❌ Fehler beim Laden:', error);
            container.innerHTML = `<div class="error-state">
                <p>⚠️ Snapshots konnten nicht geladen werden</p>
                <p style="color:#d32f2f;font-size:0.9rem;">${error.message}</p>
                <button onclick="Snapshots.loadSnapshots()" class="btn-secondary" style="margin-top:12px;">🔄 Erneut versuchen</button>
            </div>`;
        }
    },
    
    /**
     * Update statistics
     */
    updateStats() {
        document.getElementById('totalSnapshots').textContent = this.snapshots.length;
        document.getElementById('snapshotCount').textContent = this.snapshots.length;

        const totalBytes = this.snapshots.reduce((sum, s) => sum + (s.size_bytes || 0), 0);
        document.getElementById('totalSize').textContent = this.formatBytes(totalBytes);
    },

    /**
     * Sort snapshots
     */
    sortSnapshots() {
        this.snapshots.sort((a, b) => {
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
     * Snapshots rendern
     */
    renderSnapshots() {
        const container = document.getElementById('snapshotsList');

        if (this.snapshots.length === 0) {
            container.innerHTML = '<div class="empty-state">Noch keine Snapshots vorhanden</div>';
            return;
        }

        // Sort before rendering
        this.sortSnapshots();

        let html = '<table class="data-table snapshots-table"><thead><tr>';
        html += '<th data-sort="date">Datum <span class="sort-icon">↕</span></th>';
        html += '<th data-sort="hydrant_count">Hydranten <span class="sort-icon">↕</span></th>';
        html += '<th data-sort="size_bytes">Größe <span class="sort-icon">↕</span></th>';
        html += '<th data-sort="created_by">Erstellt von <span class="sort-icon">↕</span></th>';
        html += '<th>Aktionen</th>';
        html += '</tr></thead><tbody>';

        this.snapshots.forEach(snapshot => {
            const date = new Date(snapshot.created);
            const size = this.formatBytes(snapshot.size_bytes);
            const isAuto = snapshot.created_by === 'auto';

            html += `<tr>
                <td data-label="Datum"><strong>${snapshot.date}</strong><br><small>${date.toLocaleString('de-DE')}</small></td>
                <td data-label="Hydranten">${snapshot.hydrant_count}</td>
                <td data-label="Größe">${size}</td>
                <td data-label="Erstellt von">${isAuto ? '🤖 Automatisch' : snapshot.created_by}</td>
                <td data-label="Aktionen" class="actions">
                    <button class="btn-icon" onclick="Snapshots.showPreview('${snapshot.date}')" title="Vorschau anzeigen">
                        👁️
                    </button>
                    <button class="btn-icon" onclick="Snapshots.showRestoreModal('${snapshot.date}')" title="Wiederherstellen">
                        ♻️
                    </button>
                    <button class="btn-icon btn-danger" onclick="Snapshots.showDeleteModal('${snapshot.date}')" title="Löschen">
                        🗑️
                    </button>
                </td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    },
    
    /**
     * Snapshot erstellen
     */
    async createSnapshot() {
        if (!confirm('Manuellen Snapshot erstellen?')) {
            return;
        }
        
        try {
            const data = await API.post('../api/snapshots.php?action=create');

            this.showSuccess('Snapshot erfolgreich erstellt');
            await this.loadSnapshots();
            
        } catch (error) {
            console.error('Fehler:', error);
            this.showError('Snapshot konnte nicht erstellt werden: ' + error.message);
        }
    },
    
    /**
     * Vorschau anzeigen
     */
    async showPreview(date) {
        try {
            const data = await API.get(`../api/snapshots.php?action=preview&date=${date}`);

            const preview = data.data;
            let html = `
                <p><strong>Snapshot vom ${date}</strong></p>
                <p>Insgesamt: <strong>${preview.hydrant_count} Hydranten</strong></p>
                <h3>Vorschau (erste 10):</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Typ</th>
                            <th>Titel</th>
                            <th>Position</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            preview.preview.forEach(h => {
                html += `<tr>
                    <td>${h.id}</td>
                    <td>${h.type.toUpperCase()}</td>
                    <td>${h.title}</td>
                    <td>${h.lat.toFixed(6)}, ${h.lng.toFixed(6)}</td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            
            document.getElementById('previewContent').innerHTML = html;
            document.getElementById('previewModal').classList.add('active');
            
        } catch (error) {
            console.error('Fehler:', error);
            this.showError('Vorschau konnte nicht geladen werden: ' + error.message);
        }
    },
    
    /**
     * Restore-Modal anzeigen
     */
    showRestoreModal(date) {
        this.selectedDate = date;
        
        const snapshot = this.snapshots.find(s => s.date === date);
        if (!snapshot) return;
        
        document.getElementById('restoreInfo').innerHTML = `
            <p><strong>Snapshot vom ${date}</strong></p>
            <p>Hydranten: ${snapshot.hydrant_count}</p>
            <p class="warning-text">
                Der aktuelle Stand wird automatisch als Backup gesichert,
                bevor dieser Snapshot wiederhergestellt wird.
            </p>
        `;
        
        document.getElementById('restoreModal').classList.add('active');
    },
    
    /**
     * Restore bestätigen
     */
    async confirmRestore() {
        if (!this.selectedDate) return;
        
        try {
            const data = await API.post('../api/snapshots.php?action=restore', {
                date: this.selectedDate
            });

            this.closeRestoreModal();
            this.showSuccess(`Snapshot wiederhergestellt! ${data.data.hydrants_restored} Hydranten geladen. Backup erstellt: ${data.data.backup_created}`);
            
            // Snapshots neu laden
            await this.loadSnapshots();
            
        } catch (error) {
            console.error('Fehler:', error);
            this.showError('Wiederherstellung fehlgeschlagen: ' + error.message);
        }
    },
    
    /**
     * Delete-Modal anzeigen
     */
    showDeleteModal(date) {
        this.selectedDate = date;
        
        const snapshot = this.snapshots.find(s => s.date === date);
        if (!snapshot) return;
        
        document.getElementById('deleteInfo').innerHTML = `
            <p><strong>Snapshot vom ${date}</strong></p>
            <p>Hydranten: ${snapshot.hydrant_count}</p>
        `;
        
        document.getElementById('deleteModal').classList.add('active');
    },
    
    /**
     * Delete bestätigen
     */
    async confirmDelete() {
        if (!this.selectedDate) return;
        
        try {
            await API.delete(`../api/snapshots.php?action=delete&date=${this.selectedDate}`);

            this.closeDeleteModal();
            this.showSuccess('Snapshot gelöscht');
            await this.loadSnapshots();
            
        } catch (error) {
            console.error('Fehler:', error);
            this.showError('Snapshot konnte nicht gelöscht werden: ' + error.message);
        }
    },
    
    /**
     * Modals schließen
     */
    closePreviewModal() {
        document.getElementById('previewModal').classList.remove('active');
    },
    
    closeRestoreModal() {
        document.getElementById('restoreModal').classList.remove('active');
        this.selectedDate = null;
    },
    
    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        this.selectedDate = null;
    },
    
    /**
     * Bytes formatieren
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    
    /**
     * Nachrichten
     */
    showSuccess(message) {
        // Nutze Hydrants.showMessage wenn verfügbar
        if (window.Hydrants && window.Hydrants.showMessage) {
            window.Hydrants.showMessage(message, 'success');
        } else {
            alert(message);
        }
    },
    
    showError(message) {
        if (window.Hydrants && window.Hydrants.showMessage) {
            window.Hydrants.showMessage(message, 'error');
        } else {
            alert('Fehler: ' + message);
        }
    }
};

/**
 * Desktop Sort Setup (clickable headers)
 */
function setupDesktopSort() {
    // Use event delegation since table is dynamically generated
    document.getElementById('snapshotsList').addEventListener('click', (e) => {
        const header = e.target.closest('th[data-sort]');
        if (!header) return;

        const field = header.getAttribute('data-sort');

        // Toggle direction if same field, otherwise ascending
        if (Snapshots.sortField === field) {
            Snapshots.sortAscending = !Snapshots.sortAscending;
        } else {
            Snapshots.sortField = field;
            Snapshots.sortAscending = true;
        }

        // Update header styles
        updateSortHeaders();
        Snapshots.renderSnapshots();
    });
}

/**
 * Update header sort indicators
 */
function updateSortHeaders() {
    const headers = document.querySelectorAll('.snapshots-table th[data-sort]');
    headers.forEach(header => {
        const field = header.getAttribute('data-sort');
        header.classList.remove('sorted-asc', 'sorted-desc');

        if (field === Snapshots.sortField) {
            header.classList.add(Snapshots.sortAscending ? 'sorted-asc' : 'sorted-desc');
        }
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
            Snapshots.sortField = e.target.value;
            updateSortHeaders();
            Snapshots.renderSnapshots();
        });
    }

    if (sortToggle) {
        sortToggle.addEventListener('click', () => {
            Snapshots.sortAscending = !Snapshots.sortAscending;
            sortToggle.style.transform = Snapshots.sortAscending ? 'rotate(0deg)' : 'rotate(180deg)';
            updateSortHeaders();
            Snapshots.renderSnapshots();
        });
    }
}
