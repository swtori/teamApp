// TeamApp V1 - Gestion des Agents
// Version ultra-simple et robuste

console.log('🚀 TeamApp V1 - Initialisation...');

// Variables globales
let agents = [];
let currentAgentId = null;
let isEditMode = false;

// Éléments DOM
let newAgentBtn, refreshBtn, searchBox, modal, closeModal, cancelBtn, form, modalTitle;
let pseudoInput, discordInput, actifCheckbox, dansLaTeamCheckbox, commentsTextarea;
let agentsContainer;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM chargé, configuration des éléments...');
    initializeElements();
    setupEventListeners();
    // loadAgents(); // Retiré - sera appelé par le système d'authentification
});

// Initialisation des éléments DOM
function initializeElements() {
    console.log('🔧 Initialisation des éléments DOM...');
    
    // Boutons principaux
    newAgentBtn = document.getElementById('newAgentBtn');
    refreshBtn = document.getElementById('refreshBtn');
    searchBox = document.getElementById('searchBox');
    
    // Modal
    modal = document.getElementById('agentModal');
    closeModal = document.getElementById('closeModal');
    cancelBtn = document.getElementById('cancelBtn');
    modalTitle = document.getElementById('modalTitle');
    
    // Formulaire
    form = document.getElementById('agentForm');
    pseudoInput = document.getElementById('pseudo');
    discordInput = document.getElementById('discordAgent');
    actifCheckbox = document.getElementById('actif');
    dansLaTeamCheckbox = document.getElementById('dansLaTeam');
    commentsTextarea = document.getElementById('comments');
    
    // Container des agents
    agentsContainer = document.getElementById('agents-container');
    
    console.log('✅ Éléments DOM initialisés');
}

// Configuration des événements
function setupEventListeners() {
    console.log('🔧 Configuration des événements...');
    
    // Bouton Nouvel Agent
    if (newAgentBtn) {
        newAgentBtn.addEventListener('click', function() {
            console.log('➕ Bouton Nouvel Agent cliqué');
            openModal();
        });
        console.log('✅ Bouton Nouvel Agent configuré');
    }
    
    // Bouton Actualiser
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            console.log('🔄 Bouton Actualiser cliqué');
            refreshAgents();
        });
        console.log('✅ Bouton Actualiser configuré');
    }
    
    // Barre de recherche
    if (searchBox) {
        searchBox.addEventListener('input', function(e) {
            console.log('🔍 Recherche:', e.target.value);
            filterAgents(e.target.value);
        });
        console.log('✅ Barre de recherche configurée');
    }
    
    // Fermeture du modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            console.log('🔒 Fermeture du modal (X)');
            closeModalFunc();
        });
        console.log('✅ Bouton fermeture modal configuré');
    }
    
    // Bouton Annuler
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            console.log('❌ Bouton Annuler cliqué');
            closeModalFunc();
        });
        console.log('✅ Bouton Annuler configuré');
    }
    
    // Formulaire
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Soumission du formulaire');
            handleFormSubmit();
        });
        console.log('✅ Formulaire configuré');
    }
    
    // Gestion automatique du champ "Actif" quand "Dans la team" change
    if (dansLaTeamCheckbox) {
        dansLaTeamCheckbox.addEventListener('change', function() {
            if (!this.checked && actifCheckbox && actifCheckbox.checked) {
                // Si on décoche "Dans la team" et que "Actif" est coché
                actifCheckbox.checked = false;
                showMessage('ℹ️ Note : Un agent hors de la team est automatiquement marqué comme inactif', 'info');
            }
        });
        console.log('✅ Gestion automatique Dans la team configurée');
    }
    
    // Fermeture du modal en cliquant à l'extérieur
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                console.log('🔒 Fermeture du modal (extérieur)');
                closeModalFunc();
            }
        });
        console.log('✅ Fermeture modal extérieur configurée');
    }
    
    console.log('✅ Tous les événements configurés');
}

// Chargement des agents
// Fonction pour charger les agents (appelée par le système d'authentification)
window.loadAgents = async function loadAgents() {
    console.log('📥 Chargement des agents...');
    try {
        const response = await fetch('/api/agents');
        if (!response.ok) throw new Error('Erreur lors du chargement');
        
        const data = await response.json();
        agents = data.agents || [];
        console.log(`✅ ${agents.length} agents chargés`);
        
        renderAgents();
    } catch (error) {
        console.error('❌ Erreur lors du chargement des agents:', error);
        showMessage('Erreur lors du chargement des agents', 'error');
    }
}

// Fonction pour calculer et afficher les statistiques du dashboard
function updateAgentsDashboard() {
    console.log('📊 Mise à jour du dashboard des agents...');
    
    if (!Array.isArray(agents)) {
        console.error('❌ Les données des agents ne sont pas un tableau pour le dashboard');
        return;
    }
    
    // Debug: afficher un échantillon des données
    console.log('🔍 Debug agents:', agents.slice(0, 2));
    
    // Calculer les statistiques
    const stats = {
        builders: { total: 0, active: 0 },
        devs: { total: 0, active: 0 },
        apprentis: { total: 0, active: 0 },
        team: { total: 0, active: 0 }
    };
    
    agents.forEach(agent => {
        // Vérifier si l'agent est dans la team (pas un client)
        if (agent.dansLaTeam) {
            stats.team.total++;
            
            // Vérifier si actif (le champ s'appelle 'actif' et non 'statut')
            const isActive = agent.actif === true;
            if (isActive) {
                stats.team.active++;
            }
            
            // Flags pour éviter de compter plusieurs fois le même agent
            let isBuilder = false;
            let isDev = false;
            let isApprenti = false;
            
            // Compter par rôles (le champ s'appelle 'role' et non 'roles')
            if (agent.role && Array.isArray(agent.role)) {
                agent.role.forEach(role => {
                    switch (role.toLowerCase()) {
                        case 'builder':
                            isBuilder = true;
                            break;
                        case 'dev':
                        case 'développeur':
                        case 'developpeur':
                        case 'developer':
                            isDev = true;
                            break;
                        case 'apprenti':
                        case 'apprentice':
                            isApprenti = true;
                            break;
                    }
                });
            }
            
            // Compter chaque agent une seule fois par catégorie
            if (isBuilder) {
                stats.builders.total++;
                if (isActive) stats.builders.active++;
            }
            if (isDev) {
                stats.devs.total++;
                if (isActive) stats.devs.active++;
            }
            if (isApprenti) {
                stats.apprentis.total++;
                if (isActive) stats.apprentis.active++;
            }
        }
    });
    
    // Mettre à jour l'affichage
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };
    
    updateElement('buildersTotal', stats.builders.total);
    updateElement('buildersActive', `${stats.builders.active} actifs`);
    
    updateElement('devsTotal', stats.devs.total);
    updateElement('devsActive', `${stats.devs.active} actifs`);
    
    updateElement('apprentisTotal', stats.apprentis.total);
    updateElement('apprentisActive', `${stats.apprentis.active} actifs`);
    
    updateElement('teamTotal', stats.team.total);
    updateElement('teamActive', `${stats.team.active} actifs`);
    
    console.log('✅ Dashboard mis à jour:', stats);
}

// Rendu des agents
function renderAgents() {
    console.log('🎨 Rendu des agents...');
    
    if (!agentsContainer) {
        console.error('❌ Container des agents non trouvé');
        return;
    }
    
    if (agents.length === 0) {
        agentsContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-users"></i> Aucun agent trouvé
            </div>
        `;
        return;
    }
    
    // Trier les agents : dans la team en haut, hors team en bas
    const sortedAgents = [...agents].sort((a, b) => {
        // D'abord par statut "dans la team" (true en premier)
        if (a.dansLaTeam !== b.dansLaTeam) {
            return b.dansLaTeam ? 1 : -1;
        }
        // Puis par pseudo alphabétiquement
        return a.pseudo.localeCompare(b.pseudo);
    });
    
    // Créer des sections séparées
    const inTeamAgents = sortedAgents.filter(agent => agent.dansLaTeam);
    const outTeamAgents = sortedAgents.filter(agent => !agent.dansLaTeam);
    
    let agentsHTML = '';
    
    // Section "Dans la team"
    if (inTeamAgents.length > 0) {
        agentsHTML += `
            <div class="team-section">
                <h3 class="section-title team-section-title">
                    <i class="fas fa-users"></i> Dans la team (${inTeamAgents.length})
                </h3>
                <div class="agents-grid">
                    ${inTeamAgents.map(agent => renderAgentCard(agent)).join('')}
                </div>
            </div>
        `;
    }
    
    // Section "Hors de la team"
    if (outTeamAgents.length > 0) {
        agentsHTML += `
            <div class="team-section">
                <h3 class="section-title out-team-section-title">
                    <i class="fas fa-user-times"></i> Hors de la team (${outTeamAgents.length})
                </h3>
                <div class="agents-grid">
                    ${outTeamAgents.map(agent => renderAgentCard(agent)).join('')}
                </div>
            </div>
        `;
    }
    
    agentsContainer.innerHTML = agentsHTML;
    
    // Ajouter les gestionnaires d'événements aux boutons générés
    setupAgentCardEventListeners();
    
    // Mettre à jour le dashboard
    updateAgentsDashboard();
    
    console.log(`✅ ${agents.length} agents rendus (triés par statut team)`);
}

// Configuration des événements pour les cartes d'agents
function setupAgentCardEventListeners() {
    console.log('🔧 Configuration des événements des cartes d\'agents...');
    
    // Boutons Modifier
    const editButtons = document.querySelectorAll('.edit-agent-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const agentId = parseInt(this.getAttribute('data-agent-id'));
            console.log('✏️ Bouton Modifier cliqué pour l\'agent:', agentId);
            editAgent(agentId);
        });
    });
    
    // Boutons Supprimer
    const deleteButtons = document.querySelectorAll('.delete-agent-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const agentId = parseInt(this.getAttribute('data-agent-id'));
            console.log('🗑️ Bouton Supprimer cliqué pour l\'agent:', agentId);
            deleteAgent(agentId);
        });
    });
    
    console.log('✅ Événements des cartes d\'agents configurés');
}

// Rendu d'une carte d'agent
function renderAgentCard(agent) {
    const statusClass = agent.actif ? 'active' : 'inactive';
    const statusText = agent.actif ? 'Actif' : 'Inactif';
    const statusBadgeClass = agent.actif ? 'status-active' : 'status-inactive';
    
            // Différencier les clients des agents
        const isClient = agent.role && agent.role.includes('client');
        const teamStatus = agent.dansLaTeam ? 'Dans la team' : 'Hors équipe';
        const teamBadgeClass = agent.dansLaTeam ? 'team-status-in' : 'team-status-out';
        
        // Style spécial pour les agents hors de la team
        const cardClass = agent.dansLaTeam ? 
            `agent-card ${isClient ? 'client-card' : ''}` : 
            `agent-card ${isClient ? 'client-card' : ''} out-of-team`;
    
    const rolesHTML = agent.role && agent.role.length > 0 
        ? agent.role.map(role => {
            const roleClass = role === 'client' ? 'role-tag client' : 'role-tag';
            return `<span class="${roleClass}">${role}</span>`;
        }).join('')
        : '<span class="role-tag">Aucun rôle</span>';
    
    const commentsHTML = agent.comments && agent.comments.length > 0
        ? agent.comments.map(comment => `
            <div class="info-row">
                <span class="info-label">Commentaire:</span>
                <span class="info-value">${comment.texte}</span>
            </div>
        `).join('')
        : '';
    
    return `
        <div class="${cardClass}">
            <div class="agent-content">
                <div class="agent-header">
                    <div class="agent-name">${agent.pseudo}</div>
                    <div class="agent-statuses">
                        <div class="agent-status ${statusBadgeClass}">${statusText}</div>
                        <div class="team-status ${teamBadgeClass}">${teamStatus}</div>
                    </div>
                </div>
                
                <div class="agent-info">
                    <div class="info-row">
                        <span class="info-label">ID:</span>
                        <span class="info-value">#${agent.idAgent}</span>
                    </div>
                    ${agent.discordAgent ? `
                        <div class="info-row">
                            <span class="info-label">Discord:</span>
                            <span class="info-value">${agent.discordAgent}</span>
                        </div>
                    ` : ''}
                    ${commentsHTML}
                </div>
                
                <div class="agent-roles">
                    ${rolesHTML}
                </div>
            </div>
            
            <div class="agent-actions">
                <button class="btn btn-warning btn-sm edit-agent-btn" data-agent-id="${agent.idAgent}">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-danger btn-sm delete-agent-btn" data-agent-id="${agent.idAgent}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `;
}

// Ouverture du modal
function openModal(agent = null) {
    console.log('🔓 Ouverture du modal, agent:', agent);
    
    if (!modal || !modalTitle) {
        console.error('❌ Éléments du modal non trouvés');
        return;
    }
    
    isEditMode = !!agent;
    currentAgentId = agent ? agent.idAgent : null;
    
    modalTitle.textContent = isEditMode ? 'Modifier l\'Agent' : 'Nouvel Agent';
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    // Remettre le scroll de la modale au début
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
    
    if (agent) {
        populateForm(agent);
    } else {
        clearForm();
    }
    
    console.log('✅ Modal ouvert');
}

// Fermeture du modal
function closeModalFunc() {
    console.log('🔒 Fermeture du modal');
    
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        clearForm();
        isEditMode = false;
        currentAgentId = null;
        console.log('✅ Modal fermé');
    }
}

// Remplissage du formulaire
function populateForm(agent) {
    console.log('📝 === DÉBUT populateForm ===');
    console.log('  - Agent reçu:', agent);
    console.log('  - Rôles de l\'agent:', agent.role);
    
    if (pseudoInput) pseudoInput.value = agent.pseudo || '';
    if (discordInput) discordInput.value = agent.discordAgent || '';
    if (actifCheckbox) actifCheckbox.checked = agent.actif !== false;
    if (dansLaTeamCheckbox) dansLaTeamCheckbox.checked = agent.dansLaTeam !== false;
    if (commentsTextarea) commentsTextarea.value = agent.comments ? agent.comments.map(c => c.texte).join('\n') : '';
    
    // Réinitialiser tous les rôles
    const allRoleCheckboxes = document.querySelectorAll('.role-checkbox');
    console.log('  - Sélecteur utilisé: .role-checkbox');
    console.log('  - Tous les checkboxes de rôles trouvés:', allRoleCheckboxes.length);
    
    if (allRoleCheckboxes.length > 0) {
        console.log('  - Réinitialisation des checkboxes:');
        allRoleCheckboxes.forEach(cb => {
            const wasChecked = cb.checked;
            cb.checked = false;
            console.log(`    - ${cb.value}: ${wasChecked ? 'était coché' : 'était décoché'} → décoché`);
        });
        
        // Cocher les rôles existants
        if (agent.role && Array.isArray(agent.role)) {
            console.log('  - Application des rôles existants:');
            agent.role.forEach(role => {
                const checkbox = document.querySelector(`input[value="${role}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    console.log(`    - ${role}: coché avec succès`);
                } else {
                    console.log(`    - ⚠️ ${role}: checkbox non trouvé !`);
                }
            });
        } else {
            console.log('  - Aucun rôle à appliquer');
        }
    } else {
        console.log('  - ⚠️ AUCUN CHECKBOX DE RÔLE TROUVÉ !');
    }
    
    console.log('📝 === FIN populateForm ===');
}

// Nettoyage du formulaire
function clearForm() {
    console.log('🧹 Nettoyage du formulaire');
    
    if (form) form.reset();
    if (commentsTextarea) commentsTextarea.value = '';
}

// Gestion de la soumission du formulaire
async function handleFormSubmit() {
    console.log('📝 Traitement du formulaire...');
    
    const formData = getFormData();
    
    if (!formData.pseudo.trim()) {
        showMessage('Le pseudo est obligatoire', 'error');
        return;
    }
    
    console.log('📊 Données du formulaire:', formData);
    await saveAgent(formData);
}

// Récupération des données du formulaire
function getFormData() {
    console.log('🔍 === DÉBUT getFormData ===');
    
    // Utiliser une classe commune pour tous les checkboxes de rôles
    const allRoleCheckboxes = document.querySelectorAll('.role-checkbox');
    const checkedRoleCheckboxes = document.querySelectorAll('.role-checkbox:checked');
    
    console.log('  - Sélecteur utilisé: .role-checkbox');
    console.log('  - Tous les checkboxes de rôles trouvés:', allRoleCheckboxes.length);
    console.log('  - Checkboxes cochés:', checkedRoleCheckboxes.length);
    
    // Log détaillé de chaque checkbox
    if (allRoleCheckboxes.length > 0) {
        console.log('  - Détail des checkboxes:');
        Array.from(allRoleCheckboxes).forEach((cb, index) => {
            console.log(`    ${index + 1}. ${cb.value}: ${cb.checked ? 'COCHÉ' : 'décoché'} (classe: ${cb.className})`);
        });
    } else {
        console.log('  - ⚠️ AUCUN CHECKBOX DE RÔLE TROUVÉ !');
        console.log('  - Vérifiez que la classe .role-checkbox est bien présente dans le HTML');
    }
    
    const roles = Array.from(checkedRoleCheckboxes).map(cb => cb.value);
    console.log('  - Rôles sélectionnés:', roles);
    
    const formData = {
        pseudo: pseudoInput ? pseudoInput.value.trim() : '',
        discordAgent: discordInput ? discordInput.value.trim() : null,
        role: roles,
        actif: actifCheckbox ? actifCheckbox.checked : false,
        dansLaTeam: dansLaTeamCheckbox ? dansLaTeamCheckbox.checked : false,
        comments: commentsTextarea ? commentsTextarea.value.trim() : null
    };
    
    console.log('📊 Données complètes du formulaire:', formData);
    console.log('🔍 === FIN getFormData ===');
    return formData;
}

// Sauvegarde d'un agent
async function saveAgent(agentData) {
    console.log('💾 Sauvegarde de l\'agent:', agentData);
    
    try {
        const url = isEditMode ? `/api/agents/${currentAgentId}` : '/api/agents';
        const method = isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(agentData)
        });
        
        if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
        
        const result = await response.json();
        showMessage(
            isEditMode ? 'Agent modifié avec succès!' : 'Agent ajouté avec succès!', 
            'success'
        );
        
        await loadAgents();
        closeModalFunc();
        return result;
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        showMessage('Erreur lors de la sauvegarde', 'error');
        throw error;
    }
}

// Suppression d'un agent
async function deleteAgent(agentId) {
    console.log('🗑️ Suppression de l\'agent:', agentId);
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) return;
    
    try {
        const response = await fetch(`/api/agents/${agentId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        
        showMessage('Agent supprimé avec succès!', 'success');
        await loadAgents();
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showMessage('Erreur lors de la suppression', 'error');
    }
}

// Édition d'un agent
function editAgent(agentId) {
    console.log('✏️ Édition de l\'agent:', agentId);
    
    const agent = agents.find(a => a.idAgent === agentId);
    if (agent) {
        openModal(agent);
    } else {
        console.error('❌ Agent non trouvé:', agentId);
    }
}

// Filtrage des agents
function filterAgents(searchTerm) {
    console.log('🔍 Filtrage des agents:', searchTerm);
    
    if (!agentsContainer) return;
    
    const searchLower = searchTerm.toLowerCase();
    const filteredAgents = agents.filter(agent => 
        agent.pseudo.toLowerCase().includes(searchLower) ||
        (agent.discordAgent && agent.discordAgent.includes(searchLower)) ||
        (agent.role && agent.role.some(role => role.toLowerCase().includes(searchLower)))
    );
    
    if (filteredAgents.length === 0) {
        agentsContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-search"></i> Aucun agent trouvé pour "${searchTerm}"
            </div>
        `;
        return;
    }
    
    const agentsHTML = filteredAgents.map(agent => renderAgentCard(agent)).join('');
    agentsContainer.innerHTML = `
        <div class="agents-grid">
            ${agentsHTML}
        </div>
    `;
    
    // Reconfigurer les événements après le filtrage
    setupAgentCardEventListeners();
}

// Actualisation des agents
async function refreshAgents() {
    console.log('🔄 Actualisation des agents...');
    await loadAgents();
    showMessage('Liste actualisée!', 'success');
}

// Affichage des messages
function showMessage(message, type = 'info') {
    console.log(`💬 Message ${type}:`, message);
    
    // Supprimer les messages existants
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
            const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(messageDiv, container.firstChild);
            
            // Auto-suppression après 5 secondes
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
}

// Fonctions globales pour compatibilité
window.openModal = openModal;
window.closeModal = closeModal;
window.refreshAgents = refreshAgents;
window.filterAgents = filterAgents;
window.editAgent = editAgent;
window.deleteAgent = deleteAgent;

console.log('✅ TeamApp V1 - Initialisation terminée !');
