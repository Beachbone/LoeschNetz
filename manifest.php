<?php
// manifest.php - Dynamisches PWA Manifest aus config.json
header('Content-Type: application/json');
header('Cache-Control: max-age=3600'); // 1 Stunde cachen

// Config laden
$configFile = __DIR__ . '/../data/config.json';

if (!file_exists($configFile)) {
    // Fallback wenn Config fehlt
    $config = [
        'organization' => ['name' => 'LoeschNetz'],
        'theme' => ['primaryColor' => '#d32f2f']
    ];
} else {
    $configContent = file_get_contents($configFile);
    $config = json_decode($configContent, true);
}

// PWA-Werte aus Config extrahieren
$appName = $config['pwa']['appName'] ?? $config['organization']['name'] ?? 'LoeschNetz';
$shortName = $config['pwa']['shortName'] ?? 'LoeschNetz';
$description = $config['pwa']['description'] ?? 'Offline-fähige Hydrantenverwaltung';
$themeColor = $config['pwa']['themeColor'] ?? $config['theme']['primaryColor'] ?? '#d32f2f';
$backgroundColor = $config['pwa']['backgroundColor'] ?? $config['theme']['backgroundColor'] ?? '#ffffff';

// Manifest erstellen
$manifest = [
    'name' => $appName,
    'short_name' => $shortName,
    'description' => $description,
    'start_url' => './index.html',
    'scope' => './',
    'display' => 'standalone',
    'orientation' => 'any',
    'theme_color' => $themeColor,
    'background_color' => $backgroundColor,
    'icons' => [
        [
            'src' => './icons/icon-48x48.png',
            'sizes' => '48x48',
            'type' => 'image/png',
            'purpose' => 'any'
        ],
        [
            'src' => './icons/icon-72x72.png',
            'sizes' => '72x72',
            'type' => 'image/png',
            'purpose' => 'any'
        ],
        [
            'src' => './icons/icon-96x96.png',
            'sizes' => '96x96',
            'type' => 'image/png',
            'purpose' => 'any'
        ],
        [
            'src' => './icons/icon-128x128.png',
            'sizes' => '128x128',
            'type' => 'image/png',
            'purpose' => 'any'
        ],
        [
            'src' => './icons/icon-144x144.png',
            'sizes' => '144x144',
            'type' => 'image/png',
            'purpose' => 'any'
        ],
        [
            'src' => './icons/icon-152x152.png',
            'sizes' => '152x152',
            'type' => 'image/png',
            'purpose' => 'any'
        ],
        [
            'src' => './icons/icon-192x192.png',
            'sizes' => '192x192',
            'type' => 'image/png',
            'purpose' => 'any maskable'
        ],
        [
            'src' => './icons/icon-384x384.png',
            'sizes' => '384x384',
            'type' => 'image/png',
            'purpose' => 'any'
        ],
        [
            'src' => './icons/icon-512x512.png',
            'sizes' => '512x512',
            'type' => 'image/png',
            'purpose' => 'any maskable'
        ]
    ],
    'categories' => ['utilities', 'navigation'],
    'screenshots' => [],
    'related_applications' => [],
    'prefer_related_applications' => false
];

echo json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
