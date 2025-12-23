<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Core Admin Scripts (immer laden) -->
<script src="./js/admin-utils.js"></script>
<script src="./js/admin-auth.js"></script>
<script src="./js/admin-menu.js"></script>
<script src="./js/admin-password.js"></script>

<?php
// Seiten-spezifische Scripts
if (isset($pageScripts) && is_array($pageScripts)) {
    foreach ($pageScripts as $script) {
        echo "    <script src=\"./js/admin-{$script}.js\"></script>\n";
    }
}
?>
