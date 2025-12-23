<!-- Header -->
<div class="header">
    <div class="header-content">
        <div class="logo">
            <span>🔥 LoeschNetz Admin</span>
        </div>
        <div class="user-info">
            <span>Angemeldet als: <strong id="userName">...</strong></span>
            <span class="text-muted text-small" id="userRole"></span>
            <button id="reloadButton" class="btn-header" title="App neu laden (Cache löschen)" style="display: none;">🔄</button>
            <button id="installAppBtn" class="btn-header" title="App installieren" onclick="showInstallPrompt()" style="display: none;">📱</button>
            <button id="changePasswordBtn" class="btn-header" title="Passwort ändern">🔑</button>
            <button class="btn-logout" id="logoutBtn">Abmelden</button>
        </div>
    </div>
</div>

<!-- Navigation (dynamically generated) -->
<div id="nav-menu"></div>
