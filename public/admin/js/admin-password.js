// admin/js/admin-password.js - Passwort-Änderung

window.PasswordManager = {
    
    /**
     * Passwort-Änderungs-Modal öffnen
     */
    showChangePasswordModal(forced = false) {
        console.log('📂 showChangePasswordModal aufgerufen, forced:', forced);
        
        const modal = document.getElementById('changePasswordModal');
        const notice = document.getElementById('passwordChangeNotice');
        const cancelBtn = document.getElementById('cancelPasswordChange');
        const closeBtn = document.getElementById('closeChangePassword');
        const currentPasswordField = document.getElementById('currentPassword');
        
        console.log('Modal Element:', modal);
        console.log('Notice Element:', notice);
        
        if (!modal) {
            console.error('❌ changePasswordModal nicht gefunden!');
            return;
        }
        
        if (forced) {
            notice.style.display = 'block';
            cancelBtn.style.display = 'none';
            closeBtn.style.display = 'none';
            
            // Autocomplete deaktivieren bei erzwungenem Wechsel
            if (currentPasswordField) {
                currentPasswordField.setAttribute('autocomplete', 'off');
                currentPasswordField.value = '';
            }
        } else {
            notice.style.display = 'none';
            cancelBtn.style.display = 'inline-block';
            closeBtn.style.display = 'block';
            
            // Autocomplete wieder aktivieren
            if (currentPasswordField) {
                currentPasswordField.setAttribute('autocomplete', 'current-password');
            }
        }
        
        modal.classList.add('active');
        console.log('✅ Modal-Klasse "active" hinzugefügt');
        
        // Form zurücksetzen
        document.getElementById('changePasswordForm').reset();
        
        if (currentPasswordField) {
            currentPasswordField.focus();
        }
    },
    
    /**
     * Modal schließen
     */
    closeModal() {
        const modal = document.getElementById('changePasswordModal');
        modal.classList.remove('active');
        document.getElementById('changePasswordForm').reset();
        document.getElementById('passwordStrength').innerHTML = '';
    },
    
    /**
     * Passwort ändern
     */
    async changePassword(formData) {
        const currentPassword = formData.get('current_password');
        const newPassword = formData.get('new_password');
        const confirmPassword = formData.get('confirm_password');
        
        // Validierung
        if (newPassword !== confirmPassword) {
            this.showError('Passwörter stimmen nicht überein');
            return;
        }
        
        if (newPassword.length < 8) {
            this.showError('Passwort muss mindestens 8 Zeichen haben');
            return;
        }
        
        try {
            const data = await API.post('../api/auth.php?endpoint=change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });

            this.showSuccess('Passwort erfolgreich geändert. Du wirst abgemeldet...');
            this.closeModal();

            // Nach 2 Sekunden ausloggen
            setTimeout(() => {
                if (window.Auth) {
                    Auth.logout();
                } else {
                    window.location.href = './login.html';
                }
            }, 2000);
        } catch (error) {
            console.error('Fehler beim Passwort ändern:', error);
            this.showError(error.message);
        }
    },
    
    /**
     * Passwort-Stärke prüfen
     */
    checkPasswordStrength(password) {
        const strengthEl = document.getElementById('passwordStrength');
        
        // Element existiert nicht (z.B. auf users.html) → Silent Return
        if (!strengthEl) {
            return;
        }
        
        if (!password) {
            strengthEl.innerHTML = '';
            return;
        }
        
        let strength = 0;
        let feedback = [];
        
        // Länge
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // Komplexität
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        // Feedback
        if (password.length < 8) feedback.push('Mindestens 8 Zeichen');
        if (!/[A-Z]/.test(password)) feedback.push('Großbuchstaben empfohlen');
        if (!/[0-9]/.test(password)) feedback.push('Zahlen empfohlen');
        if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Sonderzeichen empfohlen');
        
        // Anzeige
        const labels = ['Sehr schwach', 'Schwach', 'Mittel', 'Gut', 'Sehr gut', 'Exzellent'];
        const colors = ['#f44336', '#ff9800', '#ffc107', '#8bc34a', '#4caf50', '#2196f3'];
        const level = Math.min(strength, 5);
        
        strengthEl.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill" style="width: ${(level + 1) * 16.66}%; background: ${colors[level]}"></div>
            </div>
            <div class="strength-label" style="color: ${colors[level]}">${labels[level]}</div>
            ${feedback.length > 0 ? `<div class="strength-feedback">${feedback.join(', ')}</div>` : ''}
        `;
    },
    
    /**
     * Nachrichten
     */
    showError(message) {
        if (window.Hydrants && window.Hydrants.showMessage) {
            window.Hydrants.showMessage(message, 'error');
        } else {
            alert(message);
        }
    },
    
    showSuccess(message) {
        if (window.Hydrants && window.Hydrants.showMessage) {
            window.Hydrants.showMessage(message, 'success');
        } else {
            alert(message);
        }
    }
};

/**
 * Setup Passwort-Änderung
 */
function setupPasswordChange() {
    const form = document.getElementById('changePasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const cancelBtn = document.getElementById('cancelPasswordChange');
    const closeBtn = document.getElementById('closeChangePassword');
    
    // Form Submit
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            await PasswordManager.changePassword(formData);
        });
    }
    
    // Passwort-Stärke live
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', (e) => {
            PasswordManager.checkPasswordStrength(e.target.value);
        });
    }
    
    // Modal schließen
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => PasswordManager.closeModal());
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => PasswordManager.closeModal());
    }
    
    // Passwort-Ändern Button im Header
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        console.log('✅ Passwort-Button gefunden');
        changePasswordBtn.addEventListener('click', () => {
            console.log('🔐 Passwort-Button geklickt');
            PasswordManager.showChangePasswordModal(false);
        });
    } else {
        console.warn('⚠️ Passwort-Button nicht gefunden');
    }
}
