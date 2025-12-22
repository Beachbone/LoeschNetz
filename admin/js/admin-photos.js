// admin/js/admin-photos.js - Foto-Verwaltung

window.PhotoManager = {
    currentHydrantId: null,
    
    /**
     * Galerie rendern
     */
    renderGallery(hydrant) {
        this.currentHydrantId = hydrant.id;
        const gallery = document.getElementById('photoGallery');
        
        // Sammle alle Fotos (neue + alte)
        let allPhotos = [];
        
        // Neue Fotos aus photos[]
        if (hydrant.photos && hydrant.photos.length > 0) {
            allPhotos = hydrant.photos.map(photo => ({
                filename: photo.filename,
                isNew: true,
                uploaded_at: photo.uploaded_at
            }));
        }
        
        // Altes photo-Feld (Legacy)
        if (hydrant.photo && !allPhotos.some(p => p.filename === hydrant.photo)) {
            allPhotos.push({
                filename: hydrant.photo,
                isNew: false,
                isLegacy: true
            });
        }
        
        if (allPhotos.length === 0) {
            gallery.innerHTML = '<div class="photo-empty">Noch keine Fotos</div>';
            return;
        }
        
        gallery.innerHTML = allPhotos.map(photo => {
            // Neue Struktur: uploads/hydrants/{id}/
            // Alte Struktur: uploads/{filename} (direkt)
            let thumbPath, fullPath;
            
            if (photo.isNew) {
                // Neues System: uploads/hydrants/{id}/thumbs/
                thumbPath = `../uploads/hydrants/${hydrant.id}/thumbs/${photo.filename}`;
                fullPath = `../uploads/hydrants/${hydrant.id}/${photo.filename}`;
            } else {
                // Altes System: uploads/{filename} (direkt)
                thumbPath = `../uploads/${photo.filename}`;
                fullPath = `../uploads/${photo.filename}`;
            }
            
            return `
                <div class="photo-item" data-filename="${photo.filename}">
                    <img src="${thumbPath}" 
                         alt="Hydrant Foto"
                         onerror="this.onerror=null; this.src='${fullPath}';"
                         onclick="PhotoManager.openLightbox('${fullPath}')">
                    ${photo.isNew ? `<button class="photo-delete" data-filename="${photo.filename}" title="Foto löschen">×</button>` : ''}
                    ${photo.isLegacy ? '<div class="photo-badge">Alt</div>' : ''}
                </div>
            `;
        }).join('');
        
        // Event-Delegation für Delete-Buttons
        gallery.querySelectorAll('.photo-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const filename = btn.dataset.filename;
                this.deletePhoto(filename);
            });
        });
    },
    
    /**
     * Bild komprimieren (Client-seitig)
     */
    async compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    // Skalierung berechnen
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth || height > maxHeight) {
                        const scale = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * scale);
                        height = Math.round(height * scale);
                    }
                    
                    // Canvas erstellen
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Als Blob exportieren
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Kompression fehlgeschlagen'));
                        }
                    }, 'image/jpeg', quality);
                };
                
                img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
            reader.readAsDataURL(file);
        });
    },
    
    /**
     * Foto hochladen
     */
    async uploadPhoto(file) {
        if (!this.currentHydrantId) {
            showMessage('Kein Hydrant ausgewählt', 'error');
            return;
        }
        
        try {
            // Bild komprimieren (Client-seitig)
            showMessage('Bild wird komprimiert...', 'info');
            
            
            const compressedBlob = await this.compressImage(file, 1920, 1920, 0.7); // Qualität auf 70% reduziert
            
            
            // FormData mit komprimiertem Bild
            const formData = new FormData();
            formData.append('photo', compressedBlob, file.name);
            formData.append('hydrant_id', this.currentHydrantId);

            const result = await API.upload('../api/upload-photo.php', formData);

            if (result.success) {
                
                showMessage('Foto hochgeladen', 'success');
                
                // Nutze das aktuelle Modal-Hydrant-Objekt (nicht das Array!)
                const currentHydrant = Hydrants.currentHydrant;
                
                
                if (currentHydrant) {
                    // Foto zum Array hinzufügen
                    if (!currentHydrant.photos) {
                        currentHydrant.photos = [];
                    }
                    currentHydrant.photos.push({
                        filename: result.data.filename,
                        uploaded_at: new Date().toISOString(),
                        uploaded_by: 'current_user'
                    });
                    
                    
                    // Galerie neu rendern
                    this.renderGallery(currentHydrant);
                }
                
                // Hydrant im Hintergrund neu laden (für Tabelle/Karte)
                Hydrants.loadAll().catch(err => console.error('Reload-Fehler:', err));
            } else {
                throw new Error(result.error || 'Upload fehlgeschlagen');
            }
        } catch (error) {
            console.error('Upload-Fehler:', error);
            showMessage('Fehler: ' + error.message, 'error');
        }
    },
    
    /**
     * Foto löschen
     */
    async deletePhoto(filename) {
        if (!confirm('Foto wirklich löschen?')) return;
        
        try {
            const result = await API.delete('../api/photos.php?endpoint=delete', {
                hydrant_id: this.currentHydrantId,
                filename: filename
            });

            if (result.success) {
                showMessage('Foto gelöscht', 'success');
                
                // Nutze das aktuelle Modal-Hydrant-Objekt
                const currentHydrant = Hydrants.currentHydrant;
                
                
                if (currentHydrant) {
                    if (currentHydrant.photos && Array.isArray(currentHydrant.photos)) {
                        // Foto aus Array entfernen
                        currentHydrant.photos = currentHydrant.photos.filter(p => p.filename !== filename);
                        
                        
                        // Galerie neu rendern
                        this.renderGallery(currentHydrant);
                    } else {
                    }
                }
                
                // Hydrant im Hintergrund neu laden (für Tabelle/Karte)
                Hydrants.loadAll().catch(err => console.error('Reload-Fehler:', err));
            } else {
                throw new Error(result.error || 'Löschen fehlgeschlagen');
            }
        } catch (error) {
            console.error('Lösch-Fehler:', error);
            showMessage('Fehler: ' + error.message, 'error');
        }
    },
    
    /**
     * Lightbox öffnen
     */
    openLightbox(imageUrl) {
        let lightbox = document.getElementById('lightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'lightbox';
            lightbox.className = 'lightbox';
            lightbox.innerHTML = `
                <button class="lightbox-close" onclick="PhotoManager.closeLightbox()">×</button>
                <img src="" alt="Foto">
            `;
            document.body.appendChild(lightbox);
        }
        
        lightbox.querySelector('img').src = imageUrl;
        lightbox.classList.add('active');
        
        // ESC zum Schließen
        const closeOnEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeLightbox();
                document.removeEventListener('keydown', closeOnEsc);
            }
        };
        document.addEventListener('keydown', closeOnEsc);
    },
    
    /**
     * Lightbox schließen
     */
    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
        }
    }
};

/**
 * Hilfsfunktion: Hydrant speichern falls noch nicht gespeichert
 */
async function ensureHydrantSaved() {
    // Wenn Hydrant bereits existiert, nichts tun
    if (window.Hydrants && window.Hydrants.currentHydrant) {
        return true;
    }

    // Formular validieren und speichern
    const form = document.getElementById('hydrantForm');
    if (!form) {
        showMessage('Formular nicht gefunden', 'error');
        return false;
    }

    const formData = {
        type: form.type.value,
        title: form.title.value.trim(),
        description: form.description.value.trim(),
        lat: parseFloat(form.lat.value),
        lng: parseFloat(form.lng.value)
    };

    // Validierung
    if (!formData.title) {
        showMessage('Bitte Titel eingeben', 'error');
        return false;
    }

    if (isNaN(formData.lat) || isNaN(formData.lng)) {
        showMessage('Ungültige Koordinaten', 'error');
        return false;
    }

    // Speichern
    showMessage('Hydrant wird gespeichert...', 'info');

    try {
        await window.Hydrants.save(formData);
        // Nach dem Speichern sollte currentHydrant gesetzt sein
        return !!window.Hydrants.currentHydrant;
    } catch (error) {
        showMessage('Fehler beim Speichern: ' + error.message, 'error');
        return false;
    }
}

/**
 * Upload-Button Setup
 */
function setupPhotoUpload() {
    const uploadBtn = document.getElementById('photoUploadBtn');
    const cameraBtn = document.getElementById('photoCameraBtn');
    const uploadInput = document.getElementById('photoUpload');
    const cameraInput = document.getElementById('photoCameraUpload');

    // Galerie-Upload
    if (uploadBtn && uploadInput) {
        uploadBtn.addEventListener('click', async () => {
            // Erst Hydrant speichern falls nötig
            const saved = await ensureHydrantSaved();
            if (saved) {
                uploadInput.click();
            }
        });

        uploadInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);

            for (const file of files) {
                await PhotoManager.uploadPhoto(file);
            }

            uploadInput.value = '';
        });
    }

    // Kamera-Upload
    if (cameraBtn && cameraInput) {
        cameraBtn.addEventListener('click', async () => {
            // Erst Hydrant speichern falls nötig
            const saved = await ensureHydrantSaved();
            if (saved) {
                cameraInput.click();
            }
        });

        cameraInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);

            for (const file of files) {
                await PhotoManager.uploadPhoto(file);
            }

            cameraInput.value = '';
        });
    }
}
