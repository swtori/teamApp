// TeamApp V1 - Système d'Authentification
// Gestion de l'authentification côté client

console.log('🔐 TeamApp V1 - Initialisation de l\'authentification...');

// Variables globales
let currentUser = null;
let isAuthenticated = false;

// Vérifier l'authentification immédiatement (pas dans DOMContentLoaded)
// pour éviter que le contenu soit visible avant l'authentification
initAuth();

// Initialiser l'authentification
async function initAuth() {
    console.log('🔐 Initialisation de l\'authentification...');
    
    try {
        // Vérifier s'il y a une session active
        const response = await fetch('/api/auth/verify');
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            isAuthenticated = true;
            
            console.log('✅ Utilisateur authentifié:', currentUser.username);
            
            // Stocker les informations utilisateur
            localStorage.setItem('teamapp_user', JSON.stringify({
                username: currentUser.username,
                permissions: currentUser.permissions,
                sessionExpires: currentUser.sessionExpires
            }));
            
            // Initialiser l'interface utilisateur
            initAuthenticatedUI();
            
        } else {
            // Pas de session active, afficher le login directement
            console.log('❌ Aucune session active, affichage du login');
            showLoginInterface();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification d\'authentification:', error);
        showLoginInterface();
    }
}

// Initialiser l'interface pour un utilisateur authentifié
function initAuthenticatedUI() {
    console.log('🎨 Initialisation de l\'interface authentifiée...');
    
    // Marquer comme authentifié et rendre le contenu visible
    document.body.classList.add('authenticated');
    document.body.classList.add('loaded');
    
    // Ajouter les informations utilisateur dans l'interface
    addUserInfo();
    
    // Configurer les intercepteurs pour les requêtes API
    setupAPIInterceptors();
    
    // Vérifier périodiquement la validité de la session
    startSessionCheck();
    
    // Initialiser les autres modules maintenant que l'authentification est confirmée
    initializeAppModules();
    
    console.log('✅ Interface authentifiée initialisée');
}

// Initialiser les modules de l'application après authentification
function initializeAppModules() {
    console.log('🚀 Initialisation des modules de l\'application...');
    
    // Initialiser les agents si la fonction existe
    if (typeof window.loadAgents === 'function') {
        window.loadAgents();
    }
    
    // Initialiser les commissions si la fonction existe
    if (typeof window.loadCommissions === 'function') {
        window.loadCommissions();
    }
    
    // Initialiser les dépenses si la fonction existe
    if (typeof window.loadDepenses === 'function') {
        window.loadDepenses();
    }
    
    console.log('✅ Modules de l\'application initialisés');
}

// Ajouter les informations utilisateur dans l'interface
function addUserInfo() {
    // Chercher un endroit pour afficher les informations utilisateur
    const header = document.querySelector('.main-header') || document.querySelector('header') || document.body;
    
    // Créer la barre d'information utilisateur
    const userBar = document.createElement('div');
    userBar.id = 'userInfoBar';
    userBar.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 15px;
        border-radius: 0 0 0 10px;
        font-size: 0.85rem;
        font-weight: 500;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    `;
    
    userBar.innerHTML = `
        <i class="fas fa-user-shield"></i>
        <span>${currentUser.username}</span>
        ${currentUser.username === 'antoi' ? '<a href="/admin.html" style="color: #fff3cd; text-decoration: none; margin-left: 10px;"><i class="fas fa-cog"></i></a>' : ''}
        <button onclick="logout()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 5px; cursor: pointer; margin-left: 10px;" title="Déconnexion">
            <i class="fas fa-sign-out-alt"></i>
        </button>
    `;
    
    document.body.appendChild(userBar);
    
    // Ajuster le padding du body pour éviter que la barre cache le contenu
    document.body.style.paddingTop = '40px';
}

// Configurer les intercepteurs pour les requêtes API
function setupAPIInterceptors() {
    // Sauvegarder la fonction fetch originale
    const originalFetch = window.fetch;
    
    // Remplacer fetch pour ajouter automatiquement l'authentification
    window.fetch = async function(url, options = {}) {
        // Ajouter le header d'authentification pour les requêtes API
        if (url.startsWith('/api/') && !url.startsWith('/api/auth/')) {
            options.headers = options.headers || {};
            
            // Ajouter le cookie de session s'il existe
            const sessionCookie = document.cookie.split(';').find(c => c.trim().startsWith('teamapp_session='));
            if (sessionCookie) {
                options.headers['Cookie'] = sessionCookie.trim();
            }
        }
        
        try {
            const response = await originalFetch(url, options);
            
            // Vérifier si la réponse indique une erreur d'authentification
            if (response.status === 401 && url.startsWith('/api/')) {
                console.log('❌ Session expirée, affichage du login');
                showLoginInterface();
                return response;
            }
            
            return response;
            
        } catch (error) {
            console.error('Erreur lors de la requête:', error);
            throw error;
        }
    };
}

// Démarrer la vérification périodique de session
function startSessionCheck() {
    // Vérifier la session toutes les 5 minutes
    setInterval(async () => {
        try {
            const response = await fetch('/api/auth/verify');
            
            if (!response.ok) {
                console.log('❌ Session expirée lors de la vérification périodique');
                showLoginInterface();
            }
            
        } catch (error) {
            console.error('Erreur lors de la vérification de session:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Afficher l'interface de login directement dans la page
function showLoginInterface() {
    // Nettoyer les données locales
    localStorage.removeItem('teamapp_user');
    document.cookie = 'teamapp_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Retirer les classes d'authentification et rendre le body visible
    document.body.classList.remove('authenticated');
    document.body.classList.remove('loaded');
    document.body.style.opacity = '1';
    
    // Remplacer tout le contenu de la page par l'interface de login
    document.body.innerHTML = `
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                margin: 0;
            }

            .login-container {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
                text-align: center;
            }

            .login-header h1 {
                color: #2c3e50;
                font-size: 2rem;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }

            .login-header p {
                color: #7f8c8d;
                font-size: 1rem;
                margin-bottom: 30px;
            }

            .form-group {
                margin-bottom: 20px;
                text-align: left;
            }

            .form-label {
                display: block;
                color: #2c3e50;
                font-weight: 600;
                margin-bottom: 8px;
                font-size: 0.9rem;
            }

            .form-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e9ecef;
                border-radius: 10px;
                font-size: 1rem;
                transition: all 0.3s ease;
                background: #f8f9fa;
                box-sizing: border-box;
            }

            .form-input:focus {
                outline: none;
                border-color: #667eea;
                background: white;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .checkbox-group {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 25px;
            }

            .checkbox-group input[type="checkbox"] {
                width: 18px;
                height: 18px;
                accent-color: #667eea;
            }

            .checkbox-group label {
                color: #2c3e50;
                font-size: 0.9rem;
                cursor: pointer;
            }

            .login-btn {
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .login-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
            }

            .login-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            .message {
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 0.9rem;
                font-weight: 500;
            }

            .message.success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .message.error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .loading-spinner {
                display: none;
                width: 20px;
                height: 20px;
                border: 2px solid transparent;
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .key-info {
                margin-top: 30px;
                padding: 20px;
                background: #e3f2fd;
                border-radius: 10px;
                border-left: 4px solid #2196f3;
            }

            .key-info h3 {
                color: #1976d2;
                margin-bottom: 10px;
                font-size: 1rem;
            }

            .key-info p {
                color: #424242;
                font-size: 0.85rem;
                line-height: 1.4;
            }
        </style>

        <div class="login-container">
            <div class="login-header">
                <h1>
                    <i class="fas fa-shield-alt"></i>
                    TeamApp V1
                </h1>
                <p>Connexion sécurisée</p>
            </div>

            <div id="messageContainer"></div>

            <form id="loginForm">
                <div class="form-group">
                    <label for="authKey" class="form-label">
                        <i class="fas fa-key"></i> Clé d'authentification
                    </label>
                    <input type="password" id="authKey" class="form-input" required placeholder="Votre clé d'authentification" autocomplete="off">
                </div>

                <div class="checkbox-group">
                    <input type="checkbox" id="rememberMe" checked>
                    <label for="rememberMe">Rester connecté (30 jours)</label>
                </div>

                <button type="submit" class="login-btn" id="loginBtn">
                    <span class="login-text">Se connecter</span>
                    <div class="loading-spinner" id="loadingSpinner"></div>
                </button>
            </form>

            <div class="key-info">
                <h3><i class="fas fa-info-circle"></i> Informations</h3>
                <p>
                    <strong>Utilisateurs autorisés :</strong> Responsables de la LuscianaBT<br>
                    <strong>Persistance :</strong> 30 jours avec "Rester connecté"<br>
                    <strong>Sécurité :</strong> Clé d'authentification requise
                </p>
            </div>
        </div>
    `;
    
    // Initialiser les événements de login
    initLoginEvents();
}

// Initialiser les événements de la page de login
function initLoginEvents() {
    const loginForm = document.getElementById('loginForm');
    const authKeyInput = document.getElementById('authKey');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const loginBtn = document.getElementById('loginBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const loginText = document.querySelector('.login-text');
    const messageContainer = document.getElementById('messageContainer');
    
    let isLoading = false;
    
    // Focus sur le champ clé
    authKeyInput.focus();
    
    // Gestion du formulaire
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (isLoading) return;
        
        const authKey = authKeyInput.value.trim();
        const rememberMe = rememberMeCheckbox.checked;
        
        if (!authKey) {
            showMessage('Veuillez saisir votre clé d\'authentification', 'error');
            return;
        }
        
        await performLogin(authKey, rememberMe);
    });
    
    // Fonction de connexion
    async function performLogin(authKey, rememberMe) {
        setLoading(true);
        clearMessage();
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key: authKey,
                    rememberMe
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage('Connexion réussie ! Chargement...', 'success');
                
                // Stocker la session si nécessaire
                if (data.user.sessionId && rememberMe) {
                    document.cookie = `teamapp_session=${data.user.sessionId}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Strict`;
                }
                
                // Stocker les informations utilisateur
                localStorage.setItem('teamapp_user', JSON.stringify({
                    username: data.user.username,
                    permissions: data.user.permissions,
                    loginTime: new Date().toISOString()
                }));
                
                // Recharger la page pour afficher l'interface authentifiée
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
                
            } else {
                showMessage(data.error || 'Erreur de connexion', 'error');
            }
            
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            showMessage('Erreur de connexion au serveur', 'error');
        }
        
        setLoading(false);
    }
    
    // Fonctions utilitaires
    function setLoading(loading) {
        isLoading = loading;
        loginBtn.disabled = loading;
        
        if (loading) {
            loginText.style.display = 'none';
            loadingSpinner.style.display = 'block';
        } else {
            loginText.style.display = 'block';
            loadingSpinner.style.display = 'none';
        }
    }
    
    function showMessage(message, type) {
        messageContainer.innerHTML = `
            <div class="message ${type}">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                ${message}
            </div>
        `;
    }
    
    function clearMessage() {
        messageContainer.innerHTML = '';
    }
}

// Rediriger vers la page de connexion (fallback)
function redirectToLogin() {
    window.location.href = '/login.html';
}

// Fonction de déconnexion
async function logout() {
    try {
        // Informer le serveur de la déconnexion
        await fetch('/api/auth/logout', { method: 'POST' });
        
        // Nettoyer les données locales
        localStorage.removeItem('teamapp_user');
        document.cookie = 'teamapp_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Afficher l'interface de login
        showLoginInterface();
        
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        // Rediriger quand même vers login
        window.location.href = '/login.html';
    }
}

// Fonctions utilitaires pour les autres scripts
function getCurrentUser() {
    return currentUser;
}

function isUserAuthenticated() {
    return isAuthenticated;
}

function hasPermission(permission) {
    return currentUser && currentUser.permissions && currentUser.permissions[permission];
}

function isAdmin() {
    return currentUser && currentUser.username === 'antoi';
}

// Rendre les fonctions disponibles globalement
window.getCurrentUser = getCurrentUser;
window.isUserAuthenticated = isUserAuthenticated;
window.hasPermission = hasPermission;
window.isAdmin = isAdmin;
window.logout = logout;

console.log('✅ TeamApp V1 - Authentification initialisée !');
