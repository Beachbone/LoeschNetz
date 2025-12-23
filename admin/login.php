<?php include __DIR__ . '/includes/head-login.php'; ?>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            background: linear-gradient(135deg, #cc0000 0%, #880000 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .login-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            padding: 40px;
            width: 100%;
            max-width: 400px;
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo-icon {
            font-size: 60px;
            margin-bottom: 10px;
        }
        .logo-text {
            font-size: 24px;
            font-weight: bold;
            color: #cc0000;
        }
        .logo-subtitle {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: bold;
            font-size: 14px;
        }
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        .form-group input:focus {
            outline: none;
            border-color: #cc0000;
        }
        .btn-login {
            width: 100%;
            background: #cc0000;
            color: white;
            border: none;
            padding: 14px;
            border-radius: 4px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s ease;
        }
        .btn-login:hover {
            background: #aa0000;
        }
        .btn-login:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .error-message {
            background: #ffebee;
            color: #c62828;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 20px;
            display: none;
            border-left: 4px solid #c62828;
        }
        .info-message {
            background: #e3f2fd;
            color: #1565c0;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 20px;
            border-left: 4px solid #1565c0;
            font-size: 14px;
        }
        .loading {
            text-align: center;
            color: #666;
            display: none;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #cc0000;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <div class="logo-icon">🔥</div>
            <div class="logo-text">LoeschNetz</div>
            <div class="logo-subtitle">Verwaltung - FFW Kappel-Kludenbach</div>
        </div>

        <div id="errorMessage" class="error-message"></div>
        
        <div id="infoMessage" class="info-message">
            Melde dich an um Hydranten zu verwalten.
        </div>

        <form id="loginForm">
            <div class="form-group">
                <label for="username">Benutzername</label>
                <input type="text" id="username" name="username" required autocomplete="username">
            </div>
            
            <div class="form-group">
                <label for="password">Passwort</label>
                <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>
            
            <button type="submit" class="btn-login" id="loginBtn">Anmelden</button>
        </form>

        <div id="loading" class="loading">
            <div class="spinner"></div>
            <div>Anmeldung läuft...</div>
        </div>
    </div>

    <script>
        const loginForm = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        const errorMessage = document.getElementById('errorMessage');
        const infoMessage = document.getElementById('infoMessage');
        const loading = document.getElementById('loading');

        // Prüfe ob bereits eingeloggt
        checkSession();

        async function checkSession() {
            try {
                const response = await fetch('../api/auth.php?endpoint=check', {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success && data.data.logged_in) {
                    // Bereits eingeloggt -> weiterleiten
                    window.location.href = './index.php';
                }
            } catch (error) {
                console.log('Nicht eingeloggt');
            }
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            // Validierung
            if (!username || !password) {
                showError('Bitte Benutzername und Passwort eingeben');
                return;
            }
            
            // UI
            errorMessage.style.display = 'none';
            infoMessage.style.display = 'none';
            loginBtn.disabled = true;
            loading.style.display = 'block';
            loginForm.style.display = 'none';
            
            try {
                const response = await fetch('../api/auth.php?endpoint=login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();

                if (data.success) {
                    // CSRF Token speichern
                    if (data.data && data.data.csrf_token) {
                        sessionStorage.setItem('csrf_token', data.data.csrf_token);
                        console.log('✅ CSRF Token gespeichert');
                    }

                    // Login erfolgreich
                    window.location.href = './index.php';
                } else {
                    // Login fehlgeschlagen
                    showError(data.error || 'Login fehlgeschlagen');
                    resetForm();
                }
            } catch (error) {
                showError('Verbindungsfehler: ' + error.message);
                resetForm();
            }
        });

        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }

        function resetForm() {
            loginBtn.disabled = false;
            loading.style.display = 'none';
            loginForm.style.display = 'block';
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }
    </script>

<?php include __DIR__ . '/includes/footer.php'; ?>
