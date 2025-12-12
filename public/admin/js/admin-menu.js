// admin-menu.js - Dynamic Menu Generation for Admin Interface
// Centralized menu configuration for easy maintenance

/**
 * Menu Configuration
 * Each item has:
 * - label: Display text
 * - href: Link URL (relative to admin/)
 * - icon: Emoji icon
 * - adminOnly: Whether item is only visible to admins (optional)
 */
const MENU_CONFIG = [
    {
        label: 'Hydranten',
        href: './index.html',
        icon: '📍',
        adminOnly: false
    },
    {
        label: 'Marker-Typen',
        href: './marker-types.html',
        icon: '🎨',
        adminOnly: true
    },
    {
        label: 'User',
        href: './users.html',
        icon: '👥',
        adminOnly: true
    },
    {
        label: 'Einstellungen',
        href: './settings.html',
        icon: '⚙️',
        adminOnly: true
    },
    {
        label: 'Snapshots',
        href: './snapshots.html',
        icon: '🗂️',
        adminOnly: false
    },
    {
        label: 'CRUD Logs',
        href: './logs.html',
        icon: '📋',
        adminOnly: false
    }
];

/**
 * Generate menu HTML from configuration
 * Filters items based on user role
 */
function generateMenu() {
    const container = document.getElementById('nav-menu');

    if (!container) {
        console.error('Menu container #nav-menu not found');
        return;
    }

    // Get current user role from session
    const isAdmin = window.Auth && window.Auth.currentUser && window.Auth.currentUser.is_admin;

    // Get current page for active state
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Find active menu item for mobile toggle display
    let activeItemLabel = 'Menu';
    const activeConfig = MENU_CONFIG.find(item => {
        const itemPage = item.href.split('/').pop();
        return itemPage === currentPage;
    });
    if (activeConfig) {
        activeItemLabel = `${activeConfig.icon} ${activeConfig.label}`;
    }

    // Create mobile menu toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.innerHTML = `
        <span class="menu-text">${activeItemLabel}</span>
        <span class="menu-icon">☰</span>
    `;
    toggleBtn.addEventListener('click', toggleMobileMenu);

    // Create nav element
    const nav = document.createElement('nav');
    nav.className = 'nav-tabs';
    nav.id = 'main-nav';

    // Generate menu items
    MENU_CONFIG.forEach(item => {
        // Skip admin-only items if user is not admin
        if (item.adminOnly && !isAdmin) {
            return;
        }

        // Create link
        const link = document.createElement('a');
        link.href = item.href;
        link.textContent = `${item.icon} ${item.label}`;

        // Check if this is the active page
        const itemPage = item.href.split('/').pop();
        if (itemPage === currentPage) {
            link.className = 'active';
        }

        // Add data attribute for admin-only items
        if (item.adminOnly) {
            link.setAttribute('data-admin-only', '');
        }

        // Close mobile menu on click
        link.addEventListener('click', closeMobileMenu);

        nav.appendChild(link);
    });

    // Replace container content
    container.innerHTML = '';
    container.appendChild(toggleBtn);
    container.appendChild(nav);
}

/**
 * Toggle mobile menu open/closed
 */
function toggleMobileMenu() {
    const nav = document.getElementById('main-nav');
    if (nav) {
        nav.classList.toggle('active');

        // Update icon
        const toggle = document.querySelector('.mobile-menu-toggle');
        const icon = toggle?.querySelector('.menu-icon');
        if (icon) {
            icon.textContent = nav.classList.contains('active') ? '✕' : '☰';
        }
    }
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    const nav = document.getElementById('main-nav');
    if (nav) {
        nav.classList.remove('active');

        // Update icon
        const toggle = document.querySelector('.mobile-menu-toggle');
        const icon = toggle?.querySelector('.menu-icon');
        if (icon) {
            icon.textContent = '☰';
        }
    }
}

/**
 * Close menu when clicking outside
 */
function handleClickOutside(event) {
    const nav = document.getElementById('main-nav');
    const toggle = document.querySelector('.mobile-menu-toggle');

    if (nav && toggle && nav.classList.contains('active')) {
        if (!nav.contains(event.target) && !toggle.contains(event.target)) {
            closeMobileMenu();
        }
    }
}

// Add click outside handler when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('click', handleClickOutside);
    });
} else {
    document.addEventListener('click', handleClickOutside);
}

/**
 * Initialize menu on page load
 * Should be called after Auth module is loaded
 */
function initMenu() {
    // Wait for Auth module to be available AND user to be loaded
    if (window.Auth && window.Auth.currentUser !== null && window.Auth.currentUser !== undefined) {
        generateMenu();
    } else {
        // Auth not ready yet, wait a bit
        setTimeout(initMenu, 50);
    }
}

/**
 * Public API
 */
window.AdminMenu = {
    config: MENU_CONFIG,
    generate: generateMenu,
    init: initMenu
};

// Don't auto-initialize - wait for explicit call after Auth is ready
// Pages should call AdminMenu.generate() after Auth.checkSession() completes
