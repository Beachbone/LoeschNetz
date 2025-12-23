<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? $pageTitle : 'Admin'; ?> - LoeschNetz</title>

    <!-- PWA Manifest -->
    <link rel="manifest" href="./manifest.json">
    <meta name="theme-color" content="#d32f2f">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="LoeschNetz Admin">
    <link rel="apple-touch-icon" href="../icons/icon-192x192.png">

    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

    <!-- Admin CSS -->
    <link rel="stylesheet" href="./css/admin.css">
</head>
<body>
