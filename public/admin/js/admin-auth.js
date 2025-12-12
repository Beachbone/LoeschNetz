// admin-auth.js - Session-Management für Admin-PWA

window.Auth = {
    // Aktueller User
    currentUser: null,

    // CSRF Token
    csrfToken: null,

    /**
     * CSRF Token speichern
     */
    setCsrfToken(token) {
        this.csrfToken = token;
        if (token) {
            sessionStorage.setItem('csrf_token', token);
        } else {
            sessionStorage.removeItem('csrf_token');
        }
    },

    /**
     * CSRF Token abrufen
     */
    getCsrfToken() {
        if (!this.csrfToken) {
            this.csrfToken = sessionStorage.getItem('csrf_token');
        }
        return this.csrfToken;
    },

    /**
     * Session prüfen
     */
    async checkSession() {
        console.log('=== Checking session ===');
        try {
            const response = await fetch('../api/auth.php?endpoint=check', {
                credentials: 'include'
            });
            const data = await response.json();

            console.log('Session check response:', {
                success: data.success,
                logged_in: data.data?.logged_in,
                user: data.data?.user?.username,
                has_csrf_token: !!data.data?.csrf_token
            });

            if (data.success && data.data.logged_in) {
                this.currentUser = data.data.user;
                // CSRF Token aus Response speichern
                if (data.data.csrf_token) {
                    console.log('✓ Setting CSRF token from session check:', data.data.csrf_token.substring(0, 20) + '...');
                    this.setCsrfToken(data.data.csrf_token);
                } else {
                    console.error('✗ No CSRF token in session check response!');
                }
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Session-Check fehlgeschlagen:', error);
            return false;
        }
    },
    
    /**
     * Login erforderlich - Weiterleitung zu Login
     */
    requireLogin() {
        window.location.href = './login.html';
    },
    
    /**
     * Logout
     */
    async logout() {
        try {
            const response = await fetch('../api/auth.php?endpoint=logout', {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = null;
                this.setCsrfToken(null); // CSRF Token löschen
                window.location.href = './login.html';
            } else {
                throw new Error(data.error || 'Logout fehlgeschlagen');
            }
        } catch (error) {
            console.error('Logout fehlgeschlagen:', error);
            alert('Logout fehlgeschlagen: ' + error.message);
        }
    },
    
    /**
     * User-Info anzeigen
     */
    displayUserInfo() {
        if (!this.currentUser) return;
        
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        
        if (userNameEl) {
            userNameEl.textContent = this.currentUser.username;
        }
        
        if (userRoleEl) {
            userRoleEl.textContent = this.currentUser.is_admin ? 'Administrator' : 'Editor';
        }
        
        // Passwort-Änderung erzwingen?
        if (this.currentUser.force_password_change && window.PasswordManager) {
            setTimeout(() => {
                PasswordManager.showChangePasswordModal(true);
            }, 500);
        }
    },
    
    /**
     * Ist Admin?
     */
    isAdmin() {
        return this.currentUser && this.currentUser.is_admin;
    },
    
    /**
     * Admin-Berechtigung prüfen (mit Umleitung)
     */
    requireAdmin() {
        if (!this.isAdmin()) {
            alert('Diese Funktion ist nur für Administratoren verfügbar.');
            window.location.href = './index.html';
        }
    },
    
    /**
     * UI basierend auf Rolle anpassen
     */
    updateUIForRole() {
        const isAdmin = this.isAdmin();
        
        // Admin-only Navigation ausblenden
        document.querySelectorAll('[data-admin-only]').forEach(el => {
            if (!isAdmin) {
                el.style.display = 'none';
            }
        });
        
        // Admin-only Buttons ausblenden
        document.querySelectorAll('.admin-only').forEach(el => {
            if (!isAdmin) {
                el.style.display = 'none';
            }
        });
        
        console.log(`UI angepasst für Rolle: ${isAdmin ? 'Admin' : 'Editor'}`);
    }
};

// Logout-Button Event-Listener (wird in index.html gesetzt)
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
}
