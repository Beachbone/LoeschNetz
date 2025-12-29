<?php
$pageTitle = 'Snapshots';
$pageScripts = ['snapshots'];
include __DIR__ . '/includes/head.php';
?>

<?php include __DIR__ . '/includes/header.php'; ?>


    <!-- Container -->
    <div class="container">
        <!-- Message Container -->
        <div id="messageContainer"></div>

        <!-- Page Header -->
        <div class="page-header">
            <div>
                <h1>Snapshot-Verwaltung</h1>
                <p class="page-subtitle">Automatische Sicherungskopien deiner Hydrantendaten</p>
            </div>
            <button id="createSnapshotBtn" class="btn-primary">➕ Neuer Snapshot</button>
        </div>

        <!-- Info Cards -->
        <div class="stats-grid" style="margin-bottom: 20px;">
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-content">
                    <div class="stat-label">Gesamt</div>
                    <div class="stat-value" id="totalSnapshots">0</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💾</div>
                <div class="stat-content">
                    <div class="stat-label">Gesamtgröße</div>
                    <div class="stat-value" id="totalSize">0 KB</div>
                    <small id="sizeBreakdown" style="color: #666; font-size: 0.75rem; margin-top: 4px; display: block;">Daten: 0 KB, Bilder: 0 KB</small>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⚙️</div>
                <div class="stat-content">
                    <div class="stat-label">Max. Snapshots</div>
                    <div class="stat-value" id="maxSnapshotsInfo">20</div>
                </div>
            </div>
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
            <div class="toolbar-info">
                <strong id="snapshotCount">0</strong> Snapshots
            </div>
            <button id="refreshSnapshotsBtn" class="btn-secondary">🔄 Aktualisieren</button>
        </div>

        <!-- Mobile Sort Controls -->
        <div class="mobile-sort-controls">
            <label>Sortieren:</label>
            <select id="mobileSortField">
                <option value="date">Datum</option>
                <option value="hydrant_count">Hydranten</option>
                <option value="size_bytes">Größe</option>
                <option value="created_by">Erstellt von</option>
            </select>
            <button id="mobileSortToggle" title="Sortierreihenfolge umkehren">↕️</button>
        </div>

        <!-- Snapshots Table -->
        <div class="table-container">
            <div id="snapshotsList" class="snapshots-list">
                <div class="loading">Lade Snapshots...</div>
            </div>
        </div>
    </div>
    <!-- /container -->

        <!-- Vorschau Modal -->
    <div id="previewModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">📋 Snapshot-Vorschau</h2>
                <button class="modal-close" id="closePreview">&times;</button>
            </div>
            <div class="modal-body">
                <div id="previewContent">
                    <div class="loading">Lade Vorschau...</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Restore Confirm Modal -->
    <div id="restoreModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">⚠️ Snapshot wiederherstellen</h2>
                <button class="modal-close" id="closeRestore">&times;</button>
            </div>
            <div class="modal-body">
                <div class="warning-box">
                    <p><strong>ACHTUNG:</strong> Diese Aktion überschreibt ALLE aktuellen Hydranten!</p>
                    <p>Es wird automatisch ein Backup des aktuellen Stands erstellt, bevor der Snapshot wiederhergestellt wird.</p>
                </div>
                <div id="restoreInfo"></div>
            </div>
            <div class="modal-footer">
                <button id="confirmRestoreBtn" class="btn-danger">✅ Ja, wiederherstellen</button>
                <button id="cancelRestoreBtn" class="btn-secondary">❌ Abbrechen</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div id="deleteModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">🗑️ Snapshot löschen</h2>
                <button class="modal-close" id="closeDelete">&times;</button>
            </div>
            <div class="modal-body">
                <p>Möchten Sie diesen Snapshot wirklich löschen?</p>
                <div id="deleteInfo"></div>
            </div>
            <div class="modal-footer">
                <button id="confirmDeleteBtn" class="btn-danger">✅ Ja, löschen</button>
                <button id="cancelDeleteBtn" class="btn-secondary">❌ Abbrechen</button>
            </div>
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

    <?php include __DIR__ . '/includes/scripts.php'; ?>

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

            // Snapshots initialisieren
            if (window.Snapshots) {
                Snapshots.init();
            }

            // Sorting setup
            setupDesktopSort();
            setupMobileSort();
        }
        
        // App starten wenn DOM bereit
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

    <!-- Service Worker Registration -->
    <script>
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('✅ Admin SW registered:', registration.scope);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('🔄 Admin SW update found');

                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('✨ Admin SW update available - reload to activate');
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('❌ Admin SW registration failed:', error);
                });
        });
    }

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

    <!-- Back to Top Button Functionality -->
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
