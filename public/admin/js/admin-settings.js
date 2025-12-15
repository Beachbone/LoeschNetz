// admin/js/admin-settings.js - Einstellungen verwalten

window.Settings = {
    config: null,
    
    /**
     * Config laden
     */
    async loadConfig() {
        try {
            const data = await API.get('../api/config.php?endpoint=get');

            this.config = data.data;

            // Toast-Konfiguration in localStorage speichern
            if (window.setToastConfig && this.config.toast) {
                setToastConfig(this.config.toast);
            }

            this.populateForm();
        } catch (error) {
            console.error('Fehler beim Laden der Config:', error);
            showMessage('Fehler beim Laden der Einstellungen: ' + error.message, 'error');
        }
    },
    
    /**
     * Formular mit Daten füllen
     */
    populateForm() {
        if (!this.config) return;
        
        // MAP
        document.getElementById('mapCenterLat').value = this.config.map.center[0];
        document.getElementById('mapCenterLng').value = this.config.map.center[1];
        document.getElementById('mapZoom').value = this.config.map.zoom;
        document.getElementById('mapMinZoom').value = this.config.map.minZoom;
        document.getElementById('mapMaxZoom').value = this.config.map.maxZoom;
        document.getElementById('mapLocationZoom').value = this.config.map.locationZoom;
        
        // ORGANIZATION
        document.getElementById('orgName').value = this.config.organization.name;
        document.getElementById('orgShortName').value = this.config.organization.shortName;
        document.getElementById('orgLogo').value = this.config.organization.logo;
        
        // THEME
        document.getElementById('themePrimaryColor').value = this.config.theme.primaryColor;
        document.getElementById('themeBackgroundColor').value = this.config.theme.backgroundColor;
        
        // LEGAL
        document.getElementById('legalImpressum').value = this.config.legal.impressumUrl;
        document.getElementById('legalDatenschutz').value = this.config.legal.datenschutzUrl;
        
        // SECURITY
        document.getElementById('securityAutoLogout').value = this.config.security.autoLogoutMinutes;
        document.getElementById('securitySessionTimeout').value = this.config.security.sessionTimeout;
        
        // LOGGING
        document.getElementById('loggingLevel').value = this.config.logging.level;
        document.getElementById('loggingMaxSize').value = this.config.logging.maxSizeKb;
        document.getElementById('loggingRetention').value = this.config.logging.retentionDays;
        
        // SNAPSHOTS
        document.getElementById('snapshotsEnabled').checked = this.config.snapshots.enabled;
        document.getElementById('snapshotsMaxCount').value = this.config.snapshots.maxCount;
        document.getElementById('snapshotsAutoCreate').checked = this.config.snapshots.autoCreate;
        
        // PHOTOS
        document.getElementById('photosMaxWidth').value = this.config.photos.maxWidth;
        document.getElementById('photosMaxHeight').value = this.config.photos.maxHeight;
        document.getElementById('photosQuality').value = this.config.photos.quality;
        document.getElementById('photosMaxSize').value = this.config.photos.maxSizeKb;

        // TOAST MESSAGES
        if (this.config.toast) {
            document.getElementById('toastDurationSuccess').value = this.config.toast.durationSuccess || 5;
            document.getElementById('toastDurationError').value = this.config.toast.durationError || 10;
            document.getElementById('toastDurationWarning').value = this.config.toast.durationWarning || 8;
            document.getElementById('toastDurationInfo').value = this.config.toast.durationInfo || 5;
        } else {
            document.getElementById('toastDurationSuccess').value = 5;
            document.getElementById('toastDurationError').value = 10;
            document.getElementById('toastDurationWarning').value = 8;
            document.getElementById('toastDurationInfo').value = 5;
        }

        // DEBUG
        if (this.config.debug) {
            document.getElementById('debugEnabled').checked = this.config.debug.enabled || false;
            document.getElementById('debugShowReloadButton').checked = this.config.debug.showReloadButton || false;
        } else {
            document.getElementById('debugEnabled').checked = false;
            document.getElementById('debugShowReloadButton').checked = false;
        }
    },
    
    /**
     * Config speichern
     */
    async saveConfig(formData) {
        // Config-Objekt aus FormData bauen
        const newConfig = {
            map: {
                center: [
                    parseFloat(formData.get('mapCenterLat')),
                    parseFloat(formData.get('mapCenterLng'))
                ],
                zoom: parseInt(formData.get('mapZoom')),
                minZoom: parseInt(formData.get('mapMinZoom')),
                maxZoom: parseInt(formData.get('mapMaxZoom')),
                locationZoom: parseInt(formData.get('mapLocationZoom'))
            },
            organization: {
                name: formData.get('orgName'),
                shortName: formData.get('orgShortName'),
                logo: formData.get('orgLogo')
            },
            theme: {
                primaryColor: formData.get('themePrimaryColor'),
                backgroundColor: formData.get('themeBackgroundColor')
            },
            legal: {
                impressumUrl: formData.get('legalImpressum'),
                datenschutzUrl: formData.get('legalDatenschutz')
            },
            security: {
                autoLogoutMinutes: parseInt(formData.get('securityAutoLogout')),
                sessionTimeout: parseInt(formData.get('securitySessionTimeout'))
            },
            logging: {
                level: parseInt(formData.get('loggingLevel')),
                maxSizeKb: parseInt(formData.get('loggingMaxSize')),
                retentionDays: parseInt(formData.get('loggingRetention'))
            },
            snapshots: {
                enabled: formData.get('snapshotsEnabled') === 'on',
                maxCount: parseInt(formData.get('snapshotsMaxCount')),
                autoCreate: formData.get('snapshotsAutoCreate') === 'on'
            },
            photos: {
                maxWidth: parseInt(formData.get('photosMaxWidth')),
                maxHeight: parseInt(formData.get('photosMaxHeight')),
                quality: parseInt(formData.get('photosQuality')),
                maxSizeKb: parseInt(formData.get('photosMaxSize'))
            },
            toast: {
                durationSuccess: parseInt(formData.get('toastDurationSuccess')),
                durationError: parseInt(formData.get('toastDurationError')),
                durationWarning: parseInt(formData.get('toastDurationWarning')),
                durationInfo: parseInt(formData.get('toastDurationInfo'))
            },
            debug: {
                enabled: formData.get('debugEnabled') === 'on',
                showReloadButton: formData.get('debugShowReloadButton') === 'on'
            }
        };

        try {
            const result = await API.put('../api/config.php?endpoint=update', newConfig);

            // Toast-Konfiguration auch in localStorage speichern für sofortige Verfügbarkeit
            if (window.setToastConfig && newConfig.toast) {
                setToastConfig(newConfig.toast);
            }

            showMessage(result.data.message || 'Einstellungen gespeichert', 'success');
            this.config = result.data.config;
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            showMessage('Fehler: ' + error.message, 'error');
        }
    }
};

/**
 * Tab-Wechsel
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const panes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            // Tabs aktivieren/deaktivieren
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Panes zeigen/verstecken
            panes.forEach(pane => {
                if (pane.id === target) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
        });
    });
}

/**
 * Event-Listener Setup
 */
function setupSettings() {
    // Tabs
    setupTabs();
    
    // Form Submit
    const form = document.getElementById('settingsForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            await Settings.saveConfig(formData);
        });
    }
    
    // Config laden
    Settings.loadConfig();
}
