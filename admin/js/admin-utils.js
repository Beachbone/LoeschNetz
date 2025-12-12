// admin/js/admin-utils.js - Gemeinsame Hilfsfunktionen

/**
 * Nachricht anzeigen
 */
function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) {
        console.warn('messageContainer nicht gefunden');
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
    
    // Auto-remove nach 5 Sekunden
    setTimeout(() => {
        messageEl.style.opacity = '0';
        setTimeout(() => messageEl.remove(), 300);
    }, 5000);
}
