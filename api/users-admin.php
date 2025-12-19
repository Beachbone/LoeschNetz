<?php
/**
 * users-admin.php
 * 
 * User-Verwaltung (nur für Admins)
 * 
 * Endpoints:
 * - GET    /api/users-admin.php           → Alle User auflisten
 * - POST   /api/users-admin.php           → Neuer User
 * - PUT    /api/users-admin.php?id=xxx    → User bearbeiten
 * - DELETE /api/users-admin.php?id=xxx    → User löschen
 */

require_once 'common.php';

// Nur Admins dürfen User verwalten
requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;

// Router
switch ($method) {
    case 'GET':
        handleGetUsers();
        break;
    
    case 'POST':
        handleCreateUser();
        break;
    
    case 'PUT':
        if (!$userId) {
            sendError('User-ID fehlt', 400);
        }
        handleUpdateUser($userId);
        break;
    
    case 'DELETE':
        if (!$userId) {
            sendError('User-ID fehlt', 400);
        }
        handleDeleteUser($userId);
        break;
    
    default:
        sendError('Methode nicht erlaubt', 405);
}

/**
 * Alle User abrufen
 */
function handleGetUsers() {
    $users = readJson(USERS_FILE);
    
    // Passwörter entfernen und role hinzufügen für Ausgabe
    $safeUsers = array_map(function($user) {
        unset($user['password_hash']);
        $user['role'] = ($user['is_admin'] ?? false) ? 'admin' : 'editor';
        return $user;
    }, $users['users']);
    
    sendSuccess([
        'users' => array_values($safeUsers)
    ]);
}

/**
 * Neuen User erstellen
 */
function handleCreateUser() {
    // CSRF-Schutz
    validateCsrfToken();

    $data = getJsonInput();
    
    // Validierung
    if (empty($data['username'])) {
        sendError('Username erforderlich', 400);
    }
    
    if (empty($data['password'])) {
        sendError('Passwort erforderlich', 400);
    }
    
    if (strlen($data['password']) < 8) {
        sendError('Passwort muss mindestens 8 Zeichen lang sein', 400);
    }
    
    $role = $data['role'] ?? 'editor';
    if (!in_array($role, ['admin', 'editor'])) {
        sendError('Ungültige Rolle', 400);
    }
    
    $isAdmin = ($role === 'admin');
    
    // User-Daten laden
    $users = readJson(USERS_FILE);

    // Username-Duplikat prüfen
    $username = trim($data['username']);
    foreach ($users['users'] as $user) {
        if ($user['username'] === $username) {
            sendError('Username bereits vergeben', 400);
        }
    }

    // Neuer User
    $newUser = [
        'id' => 'user_' . uniqid(),
        'username' => $username,
        'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
        'is_admin' => $isAdmin,
        'created_at' => date('Y-m-d H:i:s'),
        'created_by' => getCurrentUser()['username'],
        'updated_at' => null,
        'updated_by' => null,
        'force_password_change' => true,
        'last_login' => null,
        'locked_until' => null,
        'failed_login_attempts' => 0,
        'biometric_registered' => false,
        'biometric_credential_id' => null,
        'biometric_public_key' => null
    ];
    
    $users['users'][] = $newUser;
    writeJson(USERS_FILE, $users);
    
    // Passwort für Response entfernen und role hinzufügen
    unset($newUser['password_hash']);
    $newUser['role'] = $isAdmin ? 'admin' : 'editor';
    
    sendSuccess([
        'message' => 'User erfolgreich erstellt',
        'user' => $newUser
    ]);
}

/**
 * User bearbeiten
 */
function handleUpdateUser($userId) {
    // CSRF-Schutz
    validateCsrfToken();

    $data = getJsonInput();
    $users = readJson(USERS_FILE);
    
    $userIndex = -1;
    foreach ($users['users'] as $index => $user) {
        if ($user['id'] === $userId) {
            $userIndex = $index;
            break;
        }
    }
    
    if ($userIndex === -1) {
        sendError('User nicht gefunden', 404);
    }
    
    $currentUser = getCurrentUser();
    $targetUser = $users['users'][$userIndex];
    
    // Sich selbst löschen verhindern
    if ($targetUser['username'] === $currentUser['username']) {
        // Nur Passwort-Änderung erlaubt (über change-password.php)
        if (isset($data['role']) && $data['role'] !== $targetUser['role']) {
            sendError('Du kannst deine eigene Rolle nicht ändern', 403);
        }
    }
    
    // Rolle ändern
    if (isset($data['role']) && in_array($data['role'], ['admin', 'editor'])) {
        $users['users'][$userIndex]['is_admin'] = ($data['role'] === 'admin');
    }
    
    // Passwort zurücksetzen
    if (isset($data['new_password']) && !empty($data['new_password'])) {
        if (strlen($data['new_password']) < 8) {
            sendError('Passwort muss mindestens 8 Zeichen lang sein', 400);
        }
        
        $users['users'][$userIndex]['password_hash'] = password_hash($data['new_password'], PASSWORD_DEFAULT);
        $users['users'][$userIndex]['force_password_change'] = true;
    }
    
    $users['users'][$userIndex]['updated_at'] = date('Y-m-d H:i:s');
    $users['users'][$userIndex]['updated_by'] = $currentUser['username'];
    
    writeJson(USERS_FILE, $users);
    
    // Passwort für Response entfernen und role hinzufügen
    $updatedUser = $users['users'][$userIndex];
    unset($updatedUser['password_hash']);
    $updatedUser['role'] = $updatedUser['is_admin'] ? 'admin' : 'editor';
    
    sendSuccess([
        'message' => 'User erfolgreich aktualisiert',
        'user' => $updatedUser
    ]);
}

/**
 * User löschen
 */
function handleDeleteUser($userId) {
    // CSRF-Schutz
    validateCsrfToken();

    $users = readJson(USERS_FILE);
    $currentUser = getCurrentUser();
    
    $userIndex = -1;
    foreach ($users['users'] as $index => $user) {
        if ($user['id'] === $userId) {
            $userIndex = $index;
            break;
        }
    }
    
    if ($userIndex === -1) {
        sendError('User nicht gefunden', 404);
    }
    
    $targetUser = $users['users'][$userIndex];
    
    // Sich selbst löschen verhindern
    if ($targetUser['username'] === $currentUser['username']) {
        sendError('Du kannst dich nicht selbst löschen', 403);
    }
    
    // Letzten Admin löschen verhindern
    $adminCount = 0;
    foreach ($users['users'] as $user) {
        if ($user['is_admin'] ?? false) {
            $adminCount++;
        }
    }
    
    if (($targetUser['is_admin'] ?? false) && $adminCount <= 1) {
        sendError('Letzter Admin kann nicht gelöscht werden', 403);
    }
    
    // User entfernen
    array_splice($users['users'], $userIndex, 1);
    writeJson(USERS_FILE, $users);
    
    sendSuccess([
        'message' => 'User erfolgreich gelöscht'
    ]);
}
