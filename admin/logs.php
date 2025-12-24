<?php
$pageTitle = 'Logging';
$pageScripts = ['logs'];
include __DIR__ . '/includes/head.php';
?>

<?php include __DIR__ . '/includes/header.php'; ?>


    <!-- Container -->
    <div class="container">
        <!-- Message Container -->
        <div id="messageContainer"></div>

        <!-- Stats Grid -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">📋</div>
                <div class="stat-content">
                    <div class="stat-label">Gesamt</div>
                    <div class="stat-value" id="statTotal">0</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color: #4CAF50;">➕</div>
                <div class="stat-content">
                    <div class="stat-label">Erstellt</div>
                    <div class="stat-value" id="statCreate">0</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color: #2196F3;">✏️</div>
                <div class="stat-content">
                    <div class="stat-label">Bearbeitet</div>
                    <div class="stat-value" id="statUpdate">0</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color: #F44336;">🗑️</div>
                <div class="stat-content">
                    <div class="stat-label">Gelöscht</div>
                    <div class="stat-value" id="statDelete">0</div>
                </div>
            </div>
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; flex: 1;">
                <select id="filterAction" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Alle Aktionen</option>
                    <option value="CREATE">CREATE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                </select>
                <input type="text" id="searchInput" placeholder="🔍 Suchen (User, Details)..." style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; flex: 1; max-width: 300px;">
            </div>
            <button class="btn-secondary" id="refreshBtn">🔄 Aktualisieren</button>
        </div>

        <!-- Table -->
        <div class="table-container">
            <table class="hydrant-table logs-table">
                <thead>
                    <tr>
                        <th style="width: 50px">#</th>
                        <th style="width: 180px" data-sort="timestamp">Zeitstempel <span class="sort-icon">⇅</span></th>
                        <th style="width: 120px" data-sort="user">Benutzer <span class="sort-icon">⇅</span></th>
                        <th style="width: 100px" data-sort="action">Aktion <span class="sort-icon">⇅</span></th>
                        <th style="width: 100px" data-sort="resource">Resource <span class="sort-icon">⇅</span></th>
                        <th data-sort="details">Details <span class="sort-icon">⇅</span></th>
                        <th style="width: 120px" data-sort="ip">IP-Adresse <span class="sort-icon">⇅</span></th>
                    </tr>
                </thead>
                <tbody id="logsTableBody">
                    <tr>
                        <td colspan="7">
                            <div class="loading">
                                <div class="spinner"></div>
                                <div>Lade Log-Einträge...</div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Info Box -->
        <div style="margin-top: 20px; padding: 16px; background: #f5f5f5; border-radius: 4px; color: #666; font-size: 14px;">
            <strong>ℹ️ Hinweis:</strong> Diese Seite zeigt die letzten 1000 CRUD-Operationen (Create, Update, Delete) auf Hydranten.
            Die vollständige Log-Datei befindet sich unter <code>public/data/crud.log</code>.
        </div>
    </div>

    <?php include __DIR__ . '/includes/scripts.php'; ?>

    <!-- Init -->
    <script>
        // App initialisieren
        async function initApp() {
            // Session prüfen
            const isLoggedIn = await Auth.checkSession();

            if (!isLoggedIn) {
                Auth.requireLogin();
                return;
            }

            // User-Info anzeigen
            Auth.displayUserInfo();

            // UI für Rolle anpassen
            Auth.updateUIForRole();

            // Menu generieren (nach Auth-Check!)
            AdminMenu.generate();

            // Event-Listener
            setupLogout();
            setupPasswordChange();
            setupRefreshButton();
            setupSearch();
            setupFilterAction();
            setupTableSort();

            // Logs laden
            await Logs.loadAll();
        }

        // App starten wenn DOM bereit
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initApp);
        } else {
            initApp();
        }
    </script>

    <!-- Change Password Modal -->
    <div class="modal-overlay" id="changePasswordModal">
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">Passwort ändern</h2>
                <button class="modal-close" id="closeChangePassword">&times;</button>
            </div>
            <form id="changePasswordForm">
                <div class="modal-body">
                    <input type="text" name="username" autocomplete="username" style="display: none;" aria-hidden="true" tabindex="-1">

                    <div id="passwordChangeNotice" class="alert alert-warning" style="display: none;">
                        <strong>⚠️ Passwort muss geändert werden</strong>
                        <p>Aus Sicherheitsgründen müssen Sie Ihr Passwort bei der ersten Anmeldung ändern.</p>
                    </div>

                    <div class="form-group">
                        <label for="currentPassword">Aktuelles Passwort *</label>
                        <input type="password" name="current_password" id="currentPassword" required autocomplete="current-password">
                    </div>

                    <div class="form-group">
                        <label for="newPassword">Neues Passwort * <small>(mind. 8 Zeichen)</small></label>
                        <input type="password" name="new_password" id="newPassword" required minlength="8" autocomplete="new-password">
                    </div>

                    <div class="form-group">
                        <label for="confirmPassword">Neues Passwort bestätigen *</label>
                        <input type="password" name="confirm_password" id="confirmPassword" required minlength="8" autocomplete="new-password">
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
<?php include __DIR__ . '/includes/footer.php'; ?>
