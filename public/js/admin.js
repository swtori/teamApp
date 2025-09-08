// TeamApp V1 - Administration JavaScript
// Variables globales
let currentUser = null;
let authKeys = [];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadKeys();
    setupEventListeners();
});

// Vérifier l'authentification
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/verify');
        
        if (!response.ok) {
            window.location.href = '/login.html';
            return;
        }
        
        const data = await response.json();
        currentUser = data.user;
        
        // Vérifier les permissions admin
        if (currentUser.username !== 'antoi') {
            showMessage('Accès refusé. Seul antoi peut accéder à cette page.', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }
        
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        window.location.href = '/login.html';
    }
}

// Charger les clés
async function loadKeys() {
    try {
        const response = await fetch('/api/auth/keys');
        
        if (!response.ok) {
            throw new Error('Erreur lors du chargement');
        }
        
        const data = await response.json();
        authKeys = data.keys;
        renderKeys();
        
    } catch (error) {
        console.error('Erreur lors du chargement des clés:', error);
        document.getElementById('keysContainer').innerHTML = `
            <div class="message error">
                <i class="fas fa-exclamation-circle"></i>
                Erreur lors du chargement des clés
            </div>
        `;
    }
}

// Afficher les clés
function renderKeys() {
    const container = document.getElementById('keysContainer');
    
    if (authKeys.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6c757d;">
                <i class="fas fa-key" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3>Aucune clé trouvée</h3>
                <p>Générez votre première clé d'authentification</p>
            </div>
        `;
        return;
    }
    
    const keysHTML = authKeys.map(key => `
        <div class="key-card ${!key.isActive ? 'inactive' : ''}">
            <div class="key-header">
                <div class="key-name">
                    <i class="fas fa-key"></i>
                    ${key.name}
                </div>
                <div class="key-status ${key.isActive ? 'status-active' : 'status-inactive'}">
                    ${key.isActive ? 'Active' : 'Inactive'}
                </div>
            </div>
            
            <div class="key-info">
                <div class="info-item">
                    <div class="info-label">ID</div>
                    <div class="info-value">#${key.id}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Créée par</div>
                    <div class="info-value">${key.createdBy}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Date de création</div>
                    <div class="info-value">${new Date(key.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Utilisateurs</div>
                    <div class="info-value">${key.allowedUsers.join(', ')}</div>
                </div>
            </div>
            
            <div class="key-actions">
                <button class="btn ${key.isActive ? 'btn-warning' : 'btn-success'}" data-key-id="${key.id}">
                    <i class="fas ${key.isActive ? 'fa-pause' : 'fa-play'}"></i>
                    ${key.isActive ? 'Désactiver' : 'Activer'}
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `<div class="keys-grid">${keysHTML}</div>`;
    
    // Ajouter les event listeners pour les boutons toggle
    document.querySelectorAll('[data-key-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const keyId = parseInt(btn.getAttribute('data-key-id'));
            toggleKey(keyId);
        });
    });
}

// Configuration des événements
function setupEventListeners() {
    document.getElementById('newKeyForm').addEventListener('submit', handleNewKeySubmit);
    
    // Boutons de navigation
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Boutons modals
    document.getElementById('newKeyBtn').addEventListener('click', openNewKeyModal);
    document.getElementById('closeNewKeyModal').addEventListener('click', () => closeModal('newKeyModal'));
    document.getElementById('cancelNewKeyBtn').addEventListener('click', () => closeModal('newKeyModal'));
    document.getElementById('closeKeyGeneratedModal').addEventListener('click', () => closeModal('keyGeneratedModal'));
    document.getElementById('closeKeyGeneratedBtn').addEventListener('click', () => closeModal('keyGeneratedModal'));
    document.getElementById('copyKeyBtn').addEventListener('click', copyGeneratedKey);
}

// Gestion nouvelle clé
async function handleNewKeySubmit(e) {
    e.preventDefault();
    
    const keyName = document.getElementById('keyName').value.trim();
    const keyType = document.getElementById('keyType').value;
    const permissions = {};
    
    // Définir les utilisateurs selon le type
    let allowedUsers = [];
    switch(keyType) {
        case 'antoi':
            allowedUsers = ['antoi'];
            permissions.admin = true;
            break;
        case 'mineki':
            allowedUsers = ['miinéki'];
            permissions.admin = false;
            break;
        case 'shared':
            allowedUsers = ['antoi', 'miinéki'];
            permissions.admin = false;
            break;
    }
    
    // Récupérer les permissions personnalisées
    permissions.read = document.getElementById('permRead').checked;
    permissions.write = document.getElementById('permWrite').checked;
    permissions.delete = document.getElementById('permDelete').checked;
    if (keyType !== 'antoi') { // Pour antoi, admin est toujours true
        permissions.admin = document.getElementById('permAdmin').checked;
    }
    
    if (!keyName) {
        showMessage('Veuillez saisir un nom pour la clé', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/keys/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: keyName,
                allowedUsers,
                permissions
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('newKeyModal');
            showGeneratedKey(data.key.key);
            loadKeys(); // Recharger la liste
            
            // Reset form
            document.getElementById('newKeyForm').reset();
            document.getElementById('permRead').checked = true;
            document.getElementById('permWrite').checked = true;
            
        } else {
            showMessage(data.error || 'Erreur lors de la génération', 'error');
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        showMessage('Erreur lors de la génération de la clé', 'error');
    }
}

// Afficher la clé générée
function showGeneratedKey(key) {
    document.getElementById('generatedKeyDisplay').innerHTML = `
        ${key}
        <button class="copy-btn" id="copyGeneratedKeyBtn">
            <i class="fas fa-copy"></i>
        </button>
    `;
    document.getElementById('keyGeneratedModal').style.display = 'block';
    
    // Ajouter l'event listener pour le bouton de copie
    document.getElementById('copyGeneratedKeyBtn').addEventListener('click', copyGeneratedKey);
}

// Copier la clé générée
function copyGeneratedKey() {
    const keyDisplay = document.getElementById('generatedKeyDisplay');
    const key = keyDisplay.textContent.trim();
    
    navigator.clipboard.writeText(key).then(() => {
        const copyBtn = keyDisplay.querySelector('.copy-btn');
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        copyBtn.style.background = '#28a745';
        
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.style.background = '#667eea';
        }, 2000);
    });
}

// Activer/Désactiver une clé
async function toggleKey(keyId) {
    try {
        const response = await fetch(`/api/auth/keys/${keyId}/toggle`, {
            method: 'PUT'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            loadKeys(); // Recharger la liste
        } else {
            showMessage(data.error || 'Erreur', 'error');
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        showMessage('Erreur lors de la modification', 'error');
    }
}

// Fonctions utilitaires
function openNewKeyModal() {
    document.getElementById('newKeyModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showMessage(message, type) {
    document.getElementById('messageContainer').innerHTML = `
        <div class="message ${type}">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        document.getElementById('messageContainer').innerHTML = '';
    }, 5000);
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        document.cookie = 'teamapp_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        localStorage.removeItem('teamapp_user');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
    }
}

// Fermer les modals en cliquant à l'extérieur
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Fonctions globales pour les onclick
window.showSection = function(section) {
    // Fonction pour changer de section (si nécessaire)
    console.log('Section:', section);
};

window.openNewKeyModal = openNewKeyModal;
window.closeModal = closeModal;
window.toggleKey = toggleKey;
window.copyGeneratedKey = copyGeneratedKey;
window.logout = logout;
