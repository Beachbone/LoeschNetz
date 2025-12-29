// admin-map.js - Karten-Verwaltung mit Leaflet

window.AdminMap = {
    // Haupt-Karte
    map: null,
    markers: [],
    
    // Modal-Karte
    modalMap: null,
    modalMarker: null,
    
    // Icons (wie in Phase 1)
    icons: {},
    
    /**
     * Haupt-Karte initialisieren
     */
    async initMainMap() {
        console.log('AdminMap.initMainMap() - Start');
        
        try {
            // Leaflet-Karte erstellen
            this.map = L.map('map', { tap: false });
            
            // OSM Tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            }).addTo(this.map);
            
            // Maßstab
            L.control.scale({imperial: false}).addTo(this.map);
            
            // Kartenausschnitt (Kappel-Kludenbach)
            const bounds = [[50.00387062220833, 7.351999282836915], [49.9865245373314, 7.3771047592163095]];
            this.map.fitBounds(bounds);
            
            // Icons definieren (async laden)
            await this.defineIcons();
            
            console.log('AdminMap.initMainMap() - Erfolgreich abgeschlossen');
        } catch (error) {
            console.error('AdminMap.initMainMap() - FEHLER:', error);
        }
    },
    
    /**
     * Icons definieren (dynamisch aus marker-types.json)
     */
    async defineIcons() {
        console.log('AdminMap.defineIcons() - Lade Marker-Typen...');
        
        const iconConfig = {
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [0, -29]
        };
        
        // Lade Marker-Typen dynamisch
        try {
            const response = await fetch('../api/marker-types.php?endpoint=list', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success && data.data.types) {
                this.icons = {};
                data.data.types.forEach(type => {
                    this.icons[type.id] = L.icon({
                        ...iconConfig,
                        iconUrl: `../icons/${type.icon}`
                    });
                    console.log(`✅ Icon geladen für ${type.id}: ${type.icon}`);
                });
            } else {
                console.warn('⚠️ Marker-Typen API Fehler, verwende Fallback');
                this.icons = this.getDefaultIcons(iconConfig);
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Icons:', error);
            this.icons = this.getDefaultIcons(iconConfig);
        }
    },
    
    /**
     * Fallback: Default Icons (falls API nicht erreichbar)
     */
    getDefaultIcons(iconConfig) {
        return {
            h150: L.icon({ ...iconConfig, iconUrl: '../icons/markericon_gruen.png' }),
            h125: L.icon({ ...iconConfig, iconUrl: '../icons/markericon.png' }),
            h100: L.icon({ ...iconConfig, iconUrl: '../icons/markericon_blau.png' }),
            h80: L.icon({ ...iconConfig, iconUrl: '../icons/markericon_rot.png' }),
            reservoir: L.icon({ ...iconConfig, iconUrl: '../icons/markericon_aqua.png' }),
            building: L.icon({ ...iconConfig, iconUrl: '../icons/markericon.png' })
        };
    },
    
    /**
     * Marker rendern
     */
    renderMarkers(hydrants) {
        console.log('AdminMap.renderMarkers() aufgerufen mit', hydrants.length, 'Hydranten');
        
        if (!this.map) {
            console.error('AdminMap.renderMarkers() - FEHLER: this.map ist null/undefined!');
            return;
        }
        
        
        // Alte Marker entfernen
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
        
        // Neue Marker erstellen
        hydrants.forEach((hydrant, index) => {
            
            try {
                const icon = this.icons[hydrant.type] || this.icons.h100;
                
                const marker = L.marker([hydrant.lat, hydrant.lng], { icon })
                    .addTo(this.map);
                
                
                // Popup
                let popupContent = `<div class="map-popup-content">`;
                popupContent += `<strong class="map-popup-title">${this.escapeHtml(hydrant.title)}</strong><br>`;
                popupContent += `<span class="map-popup-type">${Hydrants.getTypeLabel(hydrant.type)}</span><br>`;

                if (hydrant.description) {
                    popupContent += `<p class="map-popup-description">${this.escapeHtml(hydrant.description)}</p>`;
                }

                // Support new photos array structure
                if (hydrant.photos && Array.isArray(hydrant.photos) && hydrant.photos.length > 0) {
                    popupContent += `<div class="map-popup-photos">`;
                    hydrant.photos.forEach(photo => {
                        const photoPath = `../uploads/hydrants/${hydrant.id}/${photo.filename}`;
                        popupContent += `<img src="${photoPath}" class="map-popup-photo">`;
                    });
                    popupContent += `</div>`;
                }
                // Fallback for old single photo field
                else if (hydrant.photo) {
                    popupContent += `<img src="../uploads/${hydrant.photo}" class="map-popup-photo-legacy">`;
                }

                popupContent += `<div class="map-popup-actions">`;
                popupContent += `<button onclick="Hydrants.edit('${hydrant.id}')" class="map-popup-btn map-popup-btn-edit" title="Bearbeiten">✏️</button>`;
                popupContent += `<button onclick="Hydrants.confirmDelete('${hydrant.id}')" class="map-popup-btn map-popup-btn-delete" title="Löschen">🗑️</button>`;
                popupContent += `</div>`;
                popupContent += `</div>`;

                marker.bindPopup(popupContent);
                
                this.markers.push(marker);
            } catch (error) {
                console.error(`AdminMap: Fehler beim Setzen von Marker ${index + 1}:`, error);
            }
        });
        
    },
    
    /**
     * Modal-Karte initialisieren
     */
    async initModalMap() {
        console.log('AdminMap.initModalMap() - Start');
        
        // Icons definieren falls noch nicht geschehen
        if (Object.keys(this.icons).length === 0) {
            await this.defineIcons();
        }
        
        // Alte Karte aufräumen
        if (this.modalMap) {
            this.modalMap.remove();
            this.modalMap = null;
        }
        
        // Neue Karte erstellen
        const mapEl = document.getElementById('modalMap');
        if (!mapEl) {
            console.error('AdminMap.initModalMap() - FEHLER: Element #modalMap nicht gefunden!');
            return;
        }
        
        
        try {
            this.modalMap = L.map('modalMap', { tap: false });
            
            // OSM Tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OSM'
            }).addTo(this.modalMap);
            
            // Position aus Formular
            const form = document.getElementById('hydrantForm');
            const latField = form.querySelector('[name="lat"]');
            const lngField = form.querySelector('[name="lng"]');
            const typeField = form.querySelector('[name="type"]');
            const lat = parseFloat(latField.value) || 50.000;
            const lng = parseFloat(lngField.value) || 7.360;
            const type = typeField.value || 'h100';
            
            
            // Karte zentrieren
            this.modalMap.setView([lat, lng], 16);
            
            // Marker setzen mit richtigem Icon
            const icon = this.icons[type] || this.icons.h100;
            this.modalMarker = L.marker([lat, lng], {
                draggable: true,
                icon: icon
            }).addTo(this.modalMap);
            
            
            // Marker verschieben -> Koordinaten aktualisieren
            this.modalMarker.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                latField.value = pos.lat.toFixed(9);
                lngField.value = pos.lng.toFixed(9);
                console.log('AdminMap: Koordinaten nach Drag:', pos.lat, pos.lng);
            });
            
            // Klick auf Karte -> Marker verschieben
            this.modalMap.on('click', (e) => {
                this.modalMarker.setLatLng(e.latlng);
                latField.value = e.latlng.lat.toFixed(9);
                lngField.value = e.latlng.lng.toFixed(9);
                console.log('AdminMap: Koordinaten nach Klick:', e.latlng.lat, e.latlng.lng);
            });
            
            // Koordinaten-Felder -> Marker aktualisieren
            latField.addEventListener('change', () => {
                this.updateModalMarker();
            });
            
            lngField.addEventListener('change', () => {
                this.updateModalMarker();
            });
            
            // Typ-Feld -> Marker-Icon aktualisieren (typeField ist schon oben deklariert)
            typeField.addEventListener('change', () => {
                this.updateModalMarkerIcon();
            });
            
            // Karte neu rendern (Leaflet Bug-Fix)
            setTimeout(() => {
                this.modalMap.invalidateSize();
            }, 100);

            // GPS-Button Event-Listener
            this.setupGpsButton();

            // Automatisch GPS-Position beim Öffnen ermitteln
            this.autoSetGpsPosition();

            console.log('AdminMap.initModalMap() - Erfolgreich abgeschlossen');
        } catch (error) {
            console.error('AdminMap.initModalMap() - FEHLER:', error);
        }
    },

    /**
     * GPS-Button einrichten
     */
    setupGpsButton() {
        const gpsButton = document.getElementById('modalGpsButton');
        if (!gpsButton) {
            console.warn('AdminMap: GPS-Button nicht gefunden');
            return;
        }

        gpsButton.addEventListener('click', () => {
            this.getHighAccuracyPosition();
        });
    },

    /**
     * Automatisch GPS-Position beim Öffnen des Modals setzen
     */
    autoSetGpsPosition() {
        if (!navigator.geolocation) {
            console.log('AdminMap: GPS nicht verfügbar, verwende Standardposition');
            return;
        }

        console.log('AdminMap: Versuche GPS-Position automatisch zu ermitteln...');

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('AdminMap: GPS-Position automatisch ermittelt:', position.coords);

                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Formularfelder aktualisieren
                const form = document.getElementById('hydrantForm');
                const latField = form.querySelector('[name="lat"]');
                const lngField = form.querySelector('[name="lng"]');

                latField.value = lat.toFixed(9);
                lngField.value = lng.toFixed(9);

                // Marker und Karte aktualisieren
                if (this.modalMarker && this.modalMap) {
                    this.modalMarker.setLatLng([lat, lng]);
                    this.modalMap.setView([lat, lng], 18);
                }

                console.log('AdminMap: Marker automatisch auf GPS-Position gesetzt');
            },
            (error) => {
                console.log('AdminMap: GPS-Position konnte nicht automatisch ermittelt werden, verwende Standardposition');
                console.log('AdminMap: GPS-Fehler:', error.message);
                // Standardposition bleibt gesetzt (keine weitere Aktion nötig)
            },
            options
        );
    },

    /**
     * GPS-Position mit hoher Genauigkeit abrufen
     */
    getHighAccuracyPosition() {
        const gpsButton = document.getElementById('modalGpsButton');

        if (!navigator.geolocation) {
            showMessage('GPS wird von diesem Browser nicht unterstützt', 'error');
            return;
        }

        // Button-Status: Wird geladen
        gpsButton.classList.add('active');
        gpsButton.disabled = true;

        console.log('AdminMap: Starte hochgenaue GPS-Ortung...');

        const options = {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('AdminMap: GPS-Position erfolgreich:', position.coords);

                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;

                // Formularfelder aktualisieren
                const form = document.getElementById('hydrantForm');
                const latField = form.querySelector('[name="lat"]');
                const lngField = form.querySelector('[name="lng"]');

                latField.value = lat.toFixed(9);
                lngField.value = lng.toFixed(9);

                // Marker und Karte aktualisieren
                if (this.modalMarker && this.modalMap) {
                    this.modalMarker.setLatLng([lat, lng]);
                    this.modalMap.setView([lat, lng], 18);
                }

                // Button zurücksetzen
                gpsButton.classList.remove('active', 'error');
                gpsButton.disabled = false;

                // Erfolgs-Nachricht mit Genauigkeit
                showMessage(`GPS-Position erfolgreich ermittelt (±${Math.round(accuracy)}m Genauigkeit)`, 'success');
            },
            (error) => {
                console.error('AdminMap: GPS-Fehler:', error);

                // Button-Status: Fehler
                gpsButton.classList.remove('active');
                gpsButton.classList.add('error');
                gpsButton.disabled = false;

                // Fehler-Nachricht
                let errorMessage = 'GPS-Position konnte nicht ermittelt werden';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'GPS-Zugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'GPS-Position nicht verfügbar. Bitte prüfe deine Verbindung.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'GPS-Timeout. Bitte versuche es erneut.';
                        break;
                }

                showMessage(errorMessage, 'error');

                // Fehler-Status nach 3 Sekunden zurücksetzen
                setTimeout(() => {
                    gpsButton.classList.remove('error');
                }, 3000);
            },
            options
        );
    },
    
    /**
     * Modal-Marker aktualisieren
     */
    updateModalMarker() {
        if (!this.modalMap || !this.modalMarker) return;
        
        const form = document.getElementById('hydrantForm');
        const lat = parseFloat(form.querySelector('[name="lat"]').value);
        const lng = parseFloat(form.querySelector('[name="lng"]').value);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            this.modalMarker.setLatLng([lat, lng]);
            this.modalMap.setView([lat, lng]);
            console.log('AdminMap: Marker aktualisiert auf:', lat, lng);
        }
    },
    
    /**
     * Modal-Marker Icon aktualisieren (bei Typ-Änderung)
     */
    updateModalMarkerIcon() {
        if (!this.modalMarker) return;
        
        const form = document.getElementById('hydrantForm');
        const type = form.querySelector('[name="type"]').value;
        const icon = this.icons[type] || this.icons.h100;
        
        this.modalMarker.setIcon(icon);
        console.log('AdminMap: Marker-Icon aktualisiert auf:', type);
    },
    
    /**
     * Auf Hydrant zentrieren und highlighten
     */
    centerOnHydrant(hydrantId, lat, lng) {
        if (!this.map) {
            console.warn('AdminMap: Karte nicht initialisiert');
            return;
        }

        console.log(`AdminMap: Zentriere auf Hydrant ${hydrantId} bei ${lat}, ${lng}`);

        // Karte auf Position zentrieren mit Animation
        this.map.setView([lat, lng], 17, {
            animate: true,
            duration: 1
        });

        // Finde den entsprechenden Marker
        setTimeout(() => {
            const marker = this.markers.find(m => {
                const pos = m.getLatLng();
                return Math.abs(pos.lat - lat) < 0.0001 && Math.abs(pos.lng - lng) < 0.0001;
            });

            if (marker) {
                // Marker-Element für Animation finden
                const markerElement = marker.getElement();
                if (markerElement) {
                    // Highlight-Animation hinzufügen
                    markerElement.classList.add('marker-highlight');

                    // Animation nach 2 Sekunden entfernen
                    setTimeout(() => {
                        markerElement.classList.remove('marker-highlight');
                    }, 2000);
                }

                // Popup nicht mehr automatisch öffnen (Issue #7)
                // marker.openPopup();

                console.log('AdminMap: Marker hervorgehoben');
            } else {
                console.warn('AdminMap: Marker nicht gefunden');
            }
        }, 500); // Warte kurz, bis Karte zentriert ist
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
