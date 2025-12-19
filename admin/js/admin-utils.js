// admin/js/admin-utils.js - Gemeinsame Hilfsfunktionen

/**
 * HTML escapen (XSS-Schutz)
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Toast-Konfiguration abrufen (aus localStorage oder Default)
 */
function getToastConfig() {
    try {
        const stored = localStorage.getItem('toastConfig');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Fehler beim Laden der Toast-Config:', e);
    }

    // Default-Werte
    return {
        durationSuccess: 5,
        durationError: 10,
        durationWarning: 8,
        durationInfo: 5
    };
}

/**
 * Toast-Konfiguration speichern (in localStorage)
 */
function setToastConfig(config) {
    try {
        localStorage.setItem('toastConfig', JSON.stringify(config));
    } catch (e) {
        console.warn('Fehler beim Speichern der Toast-Config:', e);
    }
}

/**
 * Nachricht anzeigen
 */
function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) {
        console.warn('messageContainer nicht gefunden');
        console.error('Message would have been:', type, message);
        alert(`${type.toUpperCase()}: ${message}`); // Fallback
        return;
    }

    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;

    const icon = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    }[type] || 'ℹ️';

    messageEl.innerHTML = `
        <span class="message-icon">${icon}</span>
        <span class="message-text">${message}</span>
        <button class="message-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(messageEl);

    // Dauer aus Konfiguration holen
    const toastConfig = getToastConfig();
    const durationMap = {
        'success': toastConfig.durationSuccess,
        'error': toastConfig.durationError,
        'warning': toastConfig.durationWarning,
        'info': toastConfig.durationInfo
    };

    const durationSeconds = durationMap[type] || 5;
    const duration = durationSeconds * 1000; // In Millisekunden umrechnen

    // Auto-remove
    setTimeout(() => {
        messageEl.style.opacity = '0';
        setTimeout(() => messageEl.remove(), 300);
    }, duration);
}

/**
 * API Helper mit automatischem CSRF-Schutz
 */
window.API = {
    /**
     * GET Request
     */
    async get(url) {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return this._handleResponse(response);
    },

    /**
     * POST Request mit CSRF Token
     */
    async post(url, data = {}) {
        const csrfToken = window.Auth?.getCsrfToken() || '';
        console.log('=== POST Request Debug ===');
        console.log('URL:', url);
        console.log('CSRF Token:', csrfToken ? csrfToken.substring(0, 20) + '...' : 'MISSING!');
        console.log('Has Auth object:', !!window.Auth);
        console.log('Auth.currentUser:', window.Auth?.currentUser?.username);

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify(data)
        });

        console.log('Response status:', response.status);
        return this._handleResponse(response);
    },

    /**
     * PUT Request mit CSRF Token
     */
    async put(url, data = {}) {
        const response = await fetch(url, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': window.Auth?.getCsrfToken() || ''
            },
            body: JSON.stringify(data)
        });

        return this._handleResponse(response);
    },

    /**
     * DELETE Request mit CSRF Token
     */
    async delete(url, data = {}) {
        const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': window.Auth?.getCsrfToken() || ''
            },
            body: JSON.stringify(data)
        });

        return this._handleResponse(response);
    },

    /**
     * File Upload mit CSRF Token (FormData)
     */
    async upload(url, formData) {
        // CSRF Token zu FormData hinzufügen
        const csrfToken = window.Auth?.getCsrfToken();
        if (csrfToken) {
            formData.append('csrf_token', csrfToken);
        }

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            body: formData
            // WICHTIG: Kein Content-Type Header bei FormData!
        });

        return this._handleResponse(response);
    },

    /**
     * Response Handler
     */
    async _handleResponse(response) {
        let data;

        // Versuche JSON zu parsen
        try {
            const text = await response.text();
            if (!text || text.trim() === '') {
                // Leere Antwort bei Fehler
                data = {
                    success: false,
                    error: `Server Error (${response.status}): ${response.statusText}`
                };
            } else {
                data = JSON.parse(text);
            }
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            // Keine gültige JSON-Antwort
            data = {
                success: false,
                error: `Server Error (${response.status}): ${response.statusText}`
            };
        }

        // CSRF Token Error → Session abgelaufen
        if (!response.ok && (data.code === 'CSRF_TOKEN_MISSING' || data.code === 'CSRF_TOKEN_INVALID')) {
            console.error('CSRF Token ungültig - Session abgelaufen');
            if (window.Auth) {
                window.Auth.setCsrfToken(null);
                window.Auth.requireLogin();
            }
            throw new Error('Session abgelaufen. Bitte neu anmelden.');
        }

        // Auth Error → Login erforderlich
        if (!response.ok && (data.code === 'AUTH_REQUIRED' || data.code === 'SESSION_EXPIRED')) {
            console.error('Nicht authentifiziert');
            if (window.Auth) {
                window.Auth.requireLogin();
            }
            throw new Error('Bitte anmelden');
        }

        // Andere Fehler
        if (!response.ok || !data.success) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return data;
    }
};
