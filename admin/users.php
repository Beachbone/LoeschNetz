<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User-Verwaltung - LoeschNetz</title>
    <link rel="stylesheet" href="./css/admin.css">
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-content">
            <div class="logo">
                <span>🔥 LoeschNetz Admin</span>
            </div>
            <div class="user-info">
                <span>Angemeldet als: <strong id="userName">...</strong></span>
                <span class="text-muted text-small" id="userRole"></span>
                <button id="installAppBtn" class="btn-header" title="App installieren" onclick="showInstallPrompt()" style="display: none;">📱</button>
                <button id="changePasswordBtn" class="btn-header" title="Passwort ändern">🔑</button>
                <button class="btn-logout" id="logoutBtn">Abmelden</button>
            </div>
        </div>
    </div>

    <!-- Navigation (dynamically generated) -->
    <div id="nav-menu"></div>

    <!-- Container -->
    <div class="container">
        <!-- Message Container -->
        <div id="messageContainer"></div>

        <!-- Toolbar -->
        <div class="toolbar">
            <div class="toolbar-info">
                <strong id="statTotal">0</strong> User
            </div>
            <button class="btn-primary" id="newUserBtn">+ Neuer User</button>
        </div>

        <!-- Mobile Sort Controls -->
        <div class="mobile-sort-controls">
            <label>Sortieren:</label>
            <select id="mobileSortField">
                <option value="username">Username</option>
                <option value="role">Rolle</option>
                <option value="last_login">Letzter Login</option>
                <option value="created_at">Erstellt</option>
                <option value="updated_at">Geändert</option>
            </select>
            <button id="mobileSortToggle" title="Sortierreihenfolge umkehren">↕️</button>
        </div>

        <!-- Table -->
        <div class="table-container">
            <table class="hydrant-table">
                <thead>
                    <tr>
                        <th data-sort="username">Username <span class="sort-icon">↕</span></th>
                        <th data-sort="role">Rolle <span class="sort-icon">↕</span></th>
                        <th data-sort="last_login">Letzter Login <span class="sort-icon">↕</span></th>
                        <th data-sort="created_at">Erstellt <span class="sort-icon">↕</span></th>
                        <th data-sort="updated_at">Geändert <span class="sort-icon">↕</span></th>
                        <th style="width: 280px">Aktionen</th>
                    </tr>
                </thead>
                <tbody id="userTableBody">
                    <tr>
                        <td colspan="6">
                            <div class="loading">
                                <div class="spinner"></div>
                                <div>Lade User...</div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Modal: User erstellen/bearbeiten -->
    <div class="modal-overlay" id="userModal">
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title" id="modalTitle">User erstellen</h2>
                <button class="modal-close" id="closeModal">&times;</button>
            </div>
            <form id="userForm">
                <div class="modal-body">
                    <input type="hidden" name="id" id="userId">
                    
                    <div class="form-group">
                        <label for="username">Username *</label>
                        <input type="text" name="username" id="username" required 
                               placeholder="z.B. max.mustermann" autocomplete="off">
                    </div>

                    <div class="form-group">
                        <label for="role">Rolle *</label>
                        <select name="role" id="role" required>
                            <option value="editor">Editor</option>
                            <option value="admin">Administrator</option>
                        </select>
                        <small>Editor: Hydranten bearbeiten | Admin: Volle Rechte</small>
                    </div>

                    <div class="form-group" id="passwordGroup">
                        <label for="password">Passwort *</label>
                        <input type="password" name="password" id="password" 
                               minlength="8" placeholder="Mindestens 8 Zeichen" autocomplete="new-password">
                        <small>User muss Passwort bei erster Anmeldung ändern</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-action" onclick="Users.closeModal()">Abbrechen</button>
                    <button type="submit" class="btn-primary">Speichern</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Passwort zurücksetzen -->
    <div class="modal-overlay" id="resetPasswordModal">
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">Passwort zurücksetzen</h2>
                <button class="modal-close" id="closeResetModal">&times;</button>
            </div>
            <form id="resetPasswordForm">
                <div class="modal-body">
                    <!-- Hidden username field for accessibility -->
                    <input type="text" name="username" autocomplete="username" style="display: none;" aria-hidden="true" tabindex="-1">
                    
                    <input type="hidden" name="userId" id="resetUserId">
                    
                    <p>Neues Passwort für <strong id="resetUsername"></strong></p>
                    
                    <div class="form-group">
                        <label for="newPassword">Neues Passwort *</label>
                        <input type="password" name="new_password" id="newPassword" 
                               required minlength="8" autocomplete="new-password">
                        <div id="resetPasswordStrength"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-action" onclick="Users.closeResetModal()">Abbrechen</button>
                    <button type="submit" class="btn-primary">Passwort zurücksetzen</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Passwort ändern -->
    <div class="modal-overlay" id="changePasswordModal">
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">Passwort ändern</h2>
                <button class="modal-close" id="closeChangePassword">&times;</button>
            </div>
            <form id="changePasswordForm">
                <div class="modal-body">
                    <!-- Hidden username field for accessibility -->
                    <input type="text" name="username" autocomplete="username" style="display: none;" aria-hidden="true" tabindex="-1">

                    <div id="passwordChangeNotice" class="alert alert-warning" style="display: none;">
                        <strong>⚠️ Passwort muss geändert werden</strong>
                        <p>Aus Sicherheitsgründen müssen Sie Ihr Passwort bei der ersten Anmeldung ändern.</p>
                    </div>

                    <div class="form-group">
                        <label for="currentPassword">Aktuelles Passwort *</label>
                        <input type="password" name="current_password" id="currentPassword" required
                               autocomplete="current-password">
                    </div>

                    <div class="form-group">
                        <label for="newPassword">Neues Passwort * <small>(mind. 8 Zeichen)</small></label>
                        <input type="password" name="new_password" id="newPassword" required
                               minlength="8" autocomplete="new-password">
                    </div>

                    <div class="form-group">
                        <label for="confirmPassword">Neues Passwort bestätigen *</label>
                        <input type="password" name="confirm_password" id="confirmPassword" required
                               minlength="8" autocomplete="new-password">
                    </div>

                    <div class="password-strength" id="passwordStrength"></div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelPasswordChange">Abbrechen</button>
                    <button type="submit" class="btn-primary">Passwort ändern</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Scripts -->
    <script src="./js/admin-utils.js"></script>
    <script src="./js/admin-auth.js"></script>
    <script src="./js/admin-menu.js"></script>
    <script src="./js/admin-password.js"></script>
    <script src="./js/admin-users.js"></script>
    
    <!-- Init -->
    <script>
        async function initApp() {
            const isLoggedIn = await Auth.checkSession();

            if (!isLoggedIn) {
                Auth.requireLogin();
                return;
            }

            Auth.displayUserInfo();
            Auth.updateUIForRole();

            // Menu generieren (nach Auth-Check!)
            AdminMenu.generate();
            
            setupLogout();
            setupPasswordChange();
            
            await Users.loadAll();
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initApp);
        } else {
            initApp();
        }
    </script>

    <!-- Back to Top Button -->
    <button id="backToTop" class="back-to-top" aria-label="Nach oben" title="Nach oben">↑</button>

    <!-- Install Prompt (nur wenn noch nicht installiert) -->
    <div id="installPrompt" class="install-prompt" style="display: none;">
        <p>LoeschNetz Admin als App installieren?</p>
        <div class="install-actions">
            <button id="installButton">Installieren</button>
            <button id="dismissInstall">Später</button>
        </div>
    </div>

    <!-- PWA Install Prompt -->
    <script>
    // PWA Install Prompt
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Zeige Install-Button im Header
        const installBtn = document.getElementById('installAppBtn');
        if (installBtn && !window.matchMedia('(display-mode: standalone)').matches) {
            installBtn.style.display = 'inline-block';
        }

        // Prüfe ob bereits angezeigt wurde
        const hasSeenInstallPrompt = localStorage.getItem('hasSeenInstallPrompt');

        // Zeige Install-Prompt nur beim ersten Mal automatisch
        if (!hasSeenInstallPrompt) {
            setTimeout(() => {
                const installPrompt = document.getElementById('installPrompt');
                if (installPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
                    installPrompt.style.display = 'block';
                }
            }, 10000);
        }
    });

    // Funktion zum manuellen Anzeigen des Install-Prompts
    window.showInstallPrompt = function() {
        const installPrompt = document.getElementById('installPrompt');
        if (deferredPrompt && installPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
            installPrompt.style.display = 'block';
        } else if (window.matchMedia('(display-mode: standalone)').matches) {
            alert('Die App ist bereits installiert!');
        } else {
            alert('Installation ist im Browser nicht verfügbar. Bitte öffnen Sie die Seite im Browser und versuchen Sie es erneut.');
        }
    };

    // Install-Button Handler
    document.getElementById('installButton')?.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('Install outcome:', outcome);

            // Markiere als gesehen
            localStorage.setItem('hasSeenInstallPrompt', 'true');

            // Verstecke Popup
            document.getElementById('installPrompt').style.display = 'none';

            // Verstecke Header-Button nach Installation
            if (outcome === 'accepted') {
                const installBtn = document.getElementById('installAppBtn');
                if (installBtn) installBtn.style.display = 'none';
            }

            deferredPrompt = null;
        }
    });

    // Dismiss-Button Handler
    document.getElementById('dismissInstall')?.addEventListener('click', () => {
        // Markiere als gesehen
        localStorage.setItem('hasSeenInstallPrompt', 'true');
        document.getElementById('installPrompt').style.display = 'none';
    });
    </script>

    <script>
        (function() {
            const backToTopButton = document.getElementById('backToTop');
            const scrollThreshold = 300;

            function toggleBackToTopButton() {
                if (window.pageYOffset > scrollThreshold || document.documentElement.scrollTop > scrollThreshold) {
                    backToTopButton.classList.add('visible');
                } else {
                    backToTopButton.classList.remove('visible');
                }
            }

            function scrollToTop() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }

            window.addEventListener('scroll', toggleBackToTopButton);
            backToTopButton.addEventListener('click', scrollToTop);

            toggleBackToTopButton();
        })();
    </script>
</body>
</html>
