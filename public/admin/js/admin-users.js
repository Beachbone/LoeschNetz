// admin-users.js - User-Verwaltung

const Users = {
    users: [],
    currentUser: null,
    sortField: 'username',
    sortAscending: true,
    
    /**
     * Alle User laden
     */
    async loadAll() {
        try {
            const result = await API.get('../api/users-admin.php');

            this.users = result.data.users;
            this.renderTable();
            this.updateStats();
        } catch (error) {
            console.error('Fehler beim Laden:', error);
            showMessage('Fehler: ' + error.message, 'error');
        }
    },
    
    /**
     * User sortieren
     */
    sortUsers() {
        this.users.sort((a, b) => {
            let aVal = a[this.sortField];
            let bVal = b[this.sortField];

            // Spezialbehandlung für Rolle
            if (this.sortField === 'role') {
                aVal = (a.is_admin ?? false) ? 'admin' : 'editor';
                bVal = (b.is_admin ?? false) ? 'admin' : 'editor';
            }

            // Datumsfelder als Date-Objekte vergleichen
            if (this.sortField === 'created_at' || this.sortField === 'updated_at') {
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            }

            // Null-Werte behandeln
            if (!aVal && aVal !== 0) aVal = '';
            if (!bVal && bVal !== 0) bVal = '';

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
        const tbody = document.getElementById('userTableBody');

        if (this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Keine User vorhanden</td></tr>';
            return;
        }

        // Sortieren vor dem Rendern
        this.sortUsers();
        
        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td data-label="Username"><strong>${escapeHtml(user.username)}</strong></td>
                <td data-label="Rolle">
                    <span class="badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">
                        ${user.role === 'admin' ? '👑 Admin' : '✏️ Editor'}
                    </span>
                </td>
                <td data-label="Erstellt">
                    ${user.created_at ? new Date(user.created_at).toLocaleString('de-DE') : '-'}
                    ${user.created_by ? `<br><small>von ${escapeHtml(user.created_by)}</small>` : ''}
                </td>
                <td data-label="Geändert">${user.updated_at ? new Date(user.updated_at).toLocaleString('de-DE') : '-'}</td>
                <td data-label="Aktionen">
                    <button class="btn-icon" onclick="Users.edit('${user.id}')" title="Bearbeiten">✏️</button>
                    <button class="btn-icon" onclick="Users.resetPassword('${user.id}')" title="Passwort zurücksetzen">🔑</button>
                    <button class="btn-icon btn-danger" onclick="Users.delete('${user.id}')" title="Löschen">🗑️</button>
                </td>
            </tr>
        `).join('');
    },
    
    /**
     * Stats aktualisieren
     */
    updateStats() {
        document.getElementById('statTotal').textContent = this.users.length;
    },
    
    /**
     * Modal öffnen (Neu)
     */
    openNewModal() {
        this.currentUser = null;
        
        document.getElementById('modalTitle').textContent = 'Neuer User';
        document.getElementById('userId').value = '';
        document.getElementById('username').value = '';
        document.getElementById('username').disabled = false;
        document.getElementById('role').value = 'editor';
        document.getElementById('password').value = '';
        document.getElementById('password').required = true;
        document.getElementById('passwordGroup').style.display = 'block';
        
        document.getElementById('userModal').classList.add('active');
    },
    
    /**
     * User bearbeiten
     */
    edit(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        this.currentUser = user;
        
        document.getElementById('modalTitle').textContent = 'User bearbeiten';
        document.getElementById('userId').value = user.id;
        document.getElementById('username').value = user.username;
        document.getElementById('username').disabled = true;
        document.getElementById('role').value = user.role;
        document.getElementById('password').value = '';
        document.getElementById('password').required = false;
        document.getElementById('passwordGroup').style.display = 'none';
        
        document.getElementById('userModal').classList.add('active');
    },
    
    /**
     * Modal schließen
     */
    closeModal() {
        document.getElementById('userModal').classList.remove('active');
        document.getElementById('userForm').reset();
    },
    
    /**
     * User speichern
     */
    async save(formData) {
        console.log('=== User speichern gestartet ===');
        console.log('FormData:', formData);

        try {
            const userId = formData.id;
            const isEdit = !!userId;

            const url = isEdit
                ? `../api/users-admin.php?id=${userId}`
                : '../api/users-admin.php';

            const body = {
                username: formData.username,
                role: formData.role
            };

            if (!isEdit) {
                body.password = formData.password;
            }

            console.log('Sende Request:', { url, method: isEdit ? 'PUT' : 'POST', body });

            const result = isEdit
                ? await API.put(url, body)
                : await API.post(url, body);

            console.log('Server Response:', result);
            showMessage(isEdit ? 'User aktualisiert' : 'User erstellt', 'success');
            this.closeModal();
            await this.loadAll();
        } catch (error) {
            console.error('=== FEHLER beim Speichern ===');
            console.error('Error Object:', error);
            console.error('Error Message:', error.message);
            console.error('Error Stack:', error.stack);
            showMessage('Fehler: ' + error.message, 'error');
        }
    },
    
    /**
     * Passwort zurücksetzen Modal
     */
    resetPassword(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        document.getElementById('resetUserId').value = user.id;
        document.getElementById('resetUsername').textContent = user.username;
        document.getElementById('newPassword').value = '';
        
        // Username-Feld für Accessibility befüllen
        const form = document.getElementById('resetPasswordForm');
        const usernameField = form.querySelector('input[name="username"]');
        if (usernameField) {
            usernameField.value = user.username;
        }
        
        document.getElementById('resetPasswordModal').classList.add('active');
    },
    
    /**
     * Reset Modal schließen
     */
    closeResetModal() {
        document.getElementById('resetPasswordModal').classList.remove('active');
        document.getElementById('resetPasswordForm').reset();
    },
    
    /**
     * Passwort zurücksetzen
     */
    async submitPasswordReset(formData) {
        try {
            const userId = formData.userId;

            await API.put(`../api/users-admin.php?id=${userId}`, {
                new_password: formData.new_password
            });

            showMessage('Passwort zurückgesetzt', 'success');
            this.closeResetModal();
        } catch (error) {
            console.error('Fehler:', error);
            showMessage('Fehler: ' + error.message, 'error');
        }
    },
    
    /**
     * User löschen
     */
    async delete(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (!confirm(`User "${user.username}" wirklich löschen?`)) return;

        try {
            await API.delete(`../api/users-admin.php?id=${userId}`);

            showMessage('User gelöscht', 'success');
            await this.loadAll();
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            showMessage('Fehler: ' + error.message, 'error');
        }
    }
};

/**
 * Event-Listener Setup
 */
function setupUserEventListeners() {
    console.log('=== Setting up user event listeners ===');

    const newUserBtn = document.getElementById('newUserBtn');
    if (newUserBtn) {
        console.log('✓ newUserBtn found');
        newUserBtn.addEventListener('click', () => {
            console.log('New user button clicked');
            Users.openNewModal();
        });
    } else {
        console.error('✗ newUserBtn NOT found');
    }

    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        console.log('✓ closeModal found');
        closeModal.addEventListener('click', () => Users.closeModal());
    }

    const closeResetModal = document.getElementById('closeResetModal');
    if (closeResetModal) {
        console.log('✓ closeResetModal found');
        closeResetModal.addEventListener('click', () => Users.closeResetModal());
    }

    const userForm = document.getElementById('userForm');
    if (userForm) {
        console.log('✓ userForm found, attaching submit handler');
        userForm.addEventListener('submit', async (e) => {
            console.log('=== FORM SUBMIT TRIGGERED ===');
            e.preventDefault();
            e.stopPropagation();
            console.log('Default prevented');

            const formData = Object.fromEntries(new FormData(e.target));
            await Users.save(formData);
        });
    } else {
        console.error('✗ userForm NOT found - submit handler NOT attached!');
    }

    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        console.log('✓ resetPasswordForm found');
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const formData = Object.fromEntries(new FormData(e.target));
            await Users.submitPasswordReset(formData);
        });
    }

    // Passwort-Stärke für Reset-Modal
    const newPassword = document.getElementById('newPassword');
    if (newPassword) {
        console.log('✓ newPassword found');
        newPassword.addEventListener('input', (e) => {
            if (window.PasswordManager) {
                PasswordManager.checkPasswordStrength(e.target.value, 'resetPasswordStrength');
            }
        });
    }

    console.log('=== Event listener setup complete ===');
}

/**
 * Desktop Sort Setup (clickable headers)
 */
function setupDesktopSort() {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const field = header.getAttribute('data-sort');

            // Toggle direction if same field, otherwise ascending
            if (Users.sortField === field) {
                Users.sortAscending = !Users.sortAscending;
            } else {
                Users.sortField = field;
                Users.sortAscending = true;
            }

            // Update header styles
            updateSortHeaders();
            Users.renderTable();
        });
    });
}

/**
 * Update header sort indicators
 */
function updateSortHeaders() {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        const field = header.getAttribute('data-sort');
        header.classList.remove('sorted-asc', 'sorted-desc');

        if (field === Users.sortField) {
            header.classList.add(Users.sortAscending ? 'sorted-asc' : 'sorted-desc');
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
            Users.sortField = e.target.value;
            updateSortHeaders();
            Users.renderTable();
        });
    }

    if (sortToggle) {
        sortToggle.addEventListener('click', () => {
            Users.sortAscending = !Users.sortAscending;
            sortToggle.style.transform = Users.sortAscending ? 'rotate(0deg)' : 'rotate(180deg)';
            updateSortHeaders();
            Users.renderTable();
        });
    }
}

// Call setup when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupUserEventListeners();
        setupDesktopSort();
        setupMobileSort();
    });
} else {
    setupUserEventListeners();
    setupDesktopSort();
    setupMobileSort();
}
