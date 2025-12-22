<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marker-Typen - LoeschNetz Admin</title>
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
            <h2>Marker-Typen Verwaltung</h2>
            <button id="newMarkerTypeBtn" class="btn-primary">➕ Neuer Marker-Typ</button>
        </div>

        <!-- Mobile Sort Controls -->
        <div class="mobile-sort-controls">
            <label>Sortieren:</label>
            <select id="mobileSortField">
                <option value="id">ID</option>
                <option value="label">Bezeichnung</option>
                <option value="color">Farbe</option>
                <option value="description">Beschreibung</option>
            </select>
            <button id="mobileSortToggle" title="Sortierreihenfolge umkehren">↕️</button>
        </div>

        <!-- Marker Types Table -->
        <div class="table-container">
            <table id="markerTypesTable" class="marker-types-table">
                <thead>
                    <tr>
                        <th style="width: 60px;">Icon</th>
                        <th style="width: 120px;" data-sort="id">ID <span class="sort-icon">↕</span></th>
                        <th style="width: 180px;" data-sort="label">Bezeichnung <span class="sort-icon">↕</span></th>
                        <th style="width: 120px;" data-sort="color">Farbe <span class="sort-icon">↕</span></th>
                        <th data-sort="description">Beschreibung <span class="sort-icon">↕</span></th>
                        <th style="width: 100px;">Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="6" class="text-center text-muted">Lade Marker-Typen...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Marker Type Modal -->
    <div class="modal-overlay" id="markerTypeModal">
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title" id="modalTitle">Neuer Marker-Typ</h2>
                <button class="modal-close" id="closeMarkerType">&times;</button>
            </div>
            <form id="markerTypeForm">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="markerTypeId">ID * <small>(nur Kleinbuchstaben, Zahlen, - und _)</small></label>
                        <input type="text" name="id" id="markerTypeId" required 
                               pattern="[a-z0-9_\-]+" 
                               title="Nur Kleinbuchstaben, Zahlen, Unterstrich und Bindestrich erlaubt"
                               placeholder="z.B. h100">
                    </div>

                    <div class="form-group">
                        <label for="markerTypeLabel">Bezeichnung *</label>
                        <input type="text" name="label" id="markerTypeLabel" required 
                               placeholder="z.B. H100 Hydrant">
                    </div>

                    <div class="form-group">
                        <label for="markerTypeColor">Farbe *</label>
                        <div class="color-picker-container">
                            <div class="color-preview-large" id="colorPreviewLarge">
                                <div class="color-sample" id="colorSample"></div>
                                <div class="color-info">
                                    <span id="colorHex">#0000FF</span>
                                    <small>Marker-Farbe</small>
                                </div>
                            </div>
                            <input type="color" name="color" id="markerTypeColor" required
                                   value="#0000FF" class="color-input-hidden">
                            <div class="color-presets">
                                <button type="button" class="color-preset" data-color="#FF0000" style="background: #FF0000;" title="Rot"></button>
                                <button type="button" class="color-preset" data-color="#FF8800" style="background: #FF8800;" title="Orange"></button>
                                <button type="button" class="color-preset" data-color="#0000FF" style="background: #0000FF;" title="Blau"></button>
                                <button type="button" class="color-preset" data-color="#3388FF" style="background: #3388FF;" title="Hellblau"></button>
                                <button type="button" class="color-preset" data-color="#00AA00" style="background: #00AA00;" title="Grün"></button>
                                <button type="button" class="color-preset" data-color="#666666" style="background: #666666;" title="Grau"></button>
                                <button type="button" class="color-preset" data-color="#000000" style="background: #000000;" title="Schwarz"></button>
                                <button type="button" class="color-preset" data-color="#8B4513" style="background: #8B4513;" title="Braun"></button>
                            </div>
                        </div>
                        <small style="color: #666; margin-top: 8px; display: block;">💡 Icons werden automatisch in dieser Farbe generiert</small>
                    </div>

                    <div class="form-group">
                        <label for="markerTypeDescription">Beschreibung *</label>
                        <textarea name="description" id="markerTypeDescription" required 
                                  rows="3" placeholder="Beschreibung des Marker-Typs..."></textarea>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelMarkerType">Abbrechen</button>
                    <button type="submit" class="btn-primary">Speichern</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Change Password Modal -->
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
    <script src="./js/admin-marker-types.js"></script>
    <script>
        // Desktop Sort Setup
        function setupDesktopSort() {
            const headers = document.querySelectorAll('th[data-sort]');
            headers.forEach(header => {
                header.addEventListener('click', () => {
                    const field = header.getAttribute('data-sort');

                    if (MarkerTypes.sortField === field) {
                        MarkerTypes.sortAscending = !MarkerTypes.sortAscending;
                    } else {
                        MarkerTypes.sortField = field;
                        MarkerTypes.sortAscending = true;
                    }

                    updateSortHeaders();
                    MarkerTypes.renderTable();
                });
            });
        }

        // Update header sort indicators
        function updateSortHeaders() {
            const headers = document.querySelectorAll('th[data-sort]');
            headers.forEach(header => {
                const field = header.getAttribute('data-sort');
                header.classList.remove('sorted-asc', 'sorted-desc');

                if (field === MarkerTypes.sortField) {
                    header.classList.add(MarkerTypes.sortAscending ? 'sorted-asc' : 'sorted-desc');
                }
            });
        }

        // Mobile Sort Setup
        function setupMobileSort() {
            const sortField = document.getElementById('mobileSortField');
            const sortToggle = document.getElementById('mobileSortToggle');

            if (sortField) {
                sortField.addEventListener('change', (e) => {
                    MarkerTypes.sortField = e.target.value;
                    updateSortHeaders();
                    MarkerTypes.renderTable();
                });
            }

            if (sortToggle) {
                sortToggle.addEventListener('click', () => {
                    MarkerTypes.sortAscending = !MarkerTypes.sortAscending;
                    sortToggle.style.transform = MarkerTypes.sortAscending ? 'rotate(0deg)' : 'rotate(180deg)';
                    updateSortHeaders();
                    MarkerTypes.renderTable();
                });
            }
        }
    </script>
    <script>
        async function initApp() {
            // Session prüfen
            const isAuthenticated = await Auth.checkSession();

            if (!isAuthenticated) {
                Auth.requireLogin();
                return;
            }

            // User-Info anzeigen
            Auth.displayUserInfo();

            // Admin-Berechtigung erforderlich
            Auth.requireAdmin();

            // UI für Rolle anpassen
            Auth.updateUIForRole();

            // Menu generieren (nach Auth-Check!)
            AdminMenu.generate();
            
            // Event-Listener
            setupLogout();
            setupPasswordChange();
            setupMarkerTypes();
            setupDesktopSort();
            setupMobileSort();
            setupColorPicker();
        }

        // Color Picker Setup
        function setupColorPicker() {
            const colorInput = document.getElementById('markerTypeColor');
            const colorSample = document.getElementById('colorSample');
            const colorHex = document.getElementById('colorHex');
            const colorPreviewLarge = document.getElementById('colorPreviewLarge');
            const colorPresets = document.querySelectorAll('.color-preset');

            if (!colorInput || !colorSample || !colorHex) return;

            // Update preview when color changes
            function updateColorPreview(color) {
                colorSample.style.background = color;
                colorHex.textContent = color.toUpperCase();
                colorInput.value = color;

                // Update active preset
                colorPresets.forEach(preset => {
                    if (preset.dataset.color.toUpperCase() === color.toUpperCase()) {
                        preset.classList.add('active');
                    } else {
                        preset.classList.remove('active');
                    }
                });
            }

            // Click on preview to open color picker
            colorPreviewLarge.addEventListener('click', () => {
                colorInput.click();
            });

            // When color input changes
            colorInput.addEventListener('input', (e) => {
                updateColorPreview(e.target.value);
            });

            // Preset button clicks
            colorPresets.forEach(preset => {
                preset.addEventListener('click', () => {
                    updateColorPreview(preset.dataset.color);
                });
            });

            // Initialize with current color
            updateColorPreview(colorInput.value);
        }

        // Logout
        function setupLogout() {
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    await Auth.logout();
                });
            }
        }
        
        // App starten
        initApp();
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
