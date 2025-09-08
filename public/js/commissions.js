// TeamApp V1 - Gestion des Commissions
// Version ultra-simple et robuste

console.log('💰 TeamApp V1 - Initialisation des commissions...');

// Variables globales
let commissions = [];
let commissionAgents = []; // Renommé pour éviter le conflit avec app.js
let currentCommissionId = null;
let isCommissionEditMode = false; // Renommé pour éviter le conflit avec app.js
let currentStatusFilter = 'tous'; // Filtre de statut actuel

// Éléments DOM
let newCommissionBtn, refreshCommissionsBtn, searchCommissionsBox;
let commissionModal, closeCommissionModal, cancelCommissionBtn, commissionForm, commissionModalTitle;
let nomClientInput, nomProjetInput, prixInput, deadlineInput, descriptionTextarea, statutCommissionSelect;
let montantAcompteInput, statutAcompteSelect, dateAcomptePrevuInput, dateAcompteRecuInput;
let participantsContainer, addParticipantBtn;
let commissionsContainer;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM chargé, configuration des commissions...');
    initializeCommissionElements();
    setupCommissionEventListeners();
    // Suppression de setupTabNavigation() - géré directement dans le HTML
    // setupTabNavigation();
    // loadCommissions(); // Chargé uniquement quand on clique sur l'onglet
});

// Initialisation des éléments DOM pour les commissions
function initializeCommissionElements() {
    console.log('🔧 Initialisation des éléments DOM des commissions...');
    
    // Boutons principaux
    newCommissionBtn = document.getElementById('newCommissionBtn');
    refreshCommissionsBtn = document.getElementById('refreshCommissionsBtn');
    searchCommissionsBox = document.getElementById('searchCommissionsBox');
    
    // Modal
    commissionModal = document.getElementById('commissionModal');
    closeCommissionModal = document.getElementById('closeCommissionModal');
    cancelCommissionBtn = document.getElementById('cancelCommissionBtn');
    commissionModalTitle = document.getElementById('commissionModalTitle');
    
    // Formulaire
    commissionForm = document.getElementById('commissionForm');
    nomClientInput = document.getElementById('nomClient');
    nomProjetInput = document.getElementById('nomProjet');
    prixInput = document.getElementById('prix');
    deadlineInput = document.getElementById('deadline');
    statutCommissionSelect = document.getElementById('statutCommission');
    descriptionTextarea = document.getElementById('description');
    
    // Champs acompte
    montantAcompteInput = document.getElementById('montantAcompte');
    statutAcompteSelect = document.getElementById('statutAcompte');
    dateAcomptePrevuInput = document.getElementById('dateAcomptePrevu');
    dateAcompteRecuInput = document.getElementById('dateAcompteRecu');
    
    // Participants
    participantsContainer = document.getElementById('participantsContainer');
    addParticipantBtn = document.getElementById('addParticipantBtn');
    
    // Container des commissions
    commissionsContainer = document.getElementById('commissions-container');
    
    console.log('✅ Éléments DOM des commissions initialisés');
}

// Configuration des événements pour les commissions
function setupCommissionEventListeners() {
    console.log('🔧 Configuration des événements des commissions...');
    
    // Bouton Nouvelle Commission
    if (newCommissionBtn) {
        newCommissionBtn.addEventListener('click', function() {
            console.log('➕ Bouton Nouvelle Commission cliqué');
            openCommissionModal();
        });
        console.log('✅ Bouton Nouvelle Commission configuré');
    }
    
    // Bouton Actualiser
    if (refreshCommissionsBtn) {
        refreshCommissionsBtn.addEventListener('click', function() {
            console.log('🔄 Bouton Actualiser Commissions cliqué');
            refreshCommissions();
        });
        console.log('✅ Bouton Actualiser Commissions configuré');
    }
    
    // Barre de recherche
    if (searchCommissionsBox) {
        searchCommissionsBox.addEventListener('input', function(e) {
            console.log('🔍 Recherche commissions:', e.target.value);
            filterCommissions(e.target.value);
        });
        console.log('✅ Barre de recherche commissions configurée');
    }
    
    // Fermeture du modal
    if (closeCommissionModal) {
        closeCommissionModal.addEventListener('click', function() {
            console.log('🔒 Fermeture du modal commission (X)');
            closeCommissionModalFunc();
        });
        console.log('✅ Bouton fermeture modal commission configuré');
    }
    
    // Bouton Annuler
    if (cancelCommissionBtn) {
        cancelCommissionBtn.addEventListener('click', function() {
            console.log('❌ Bouton Annuler commission cliqué');
            closeCommissionModalFunc();
        });
        console.log('✅ Bouton Annuler commission configuré');
    }
    
    // Fermeture du modal en cliquant à l'extérieur
    if (commissionModal) {
        commissionModal.addEventListener('click', function(e) {
            if (e.target === commissionModal) {
                console.log('🔒 Fermeture du modal commission (extérieur)');
                closeCommissionModalFunc();
            }
        });
        console.log('✅ Event listener extérieur commission configuré');
    }
    
    // Formulaire
    if (commissionForm) {
        commissionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Soumission du formulaire commission');
            handleCommissionFormSubmit();
        });
        console.log('✅ Formulaire commission configuré');
    }
    
    // Bouton Ajouter Participant
    if (addParticipantBtn) {
        addParticipantBtn.addEventListener('click', function() {
            console.log('👤 Ajout d\'un participant');
            addParticipantField();
        });
        console.log('✅ Bouton Ajouter Participant configuré');
    }
    
    // Fermeture du modal en cliquant à l'extérieur
    if (commissionModal) {
        commissionModal.addEventListener('click', function(e) {
            if (e.target === commissionModal) {
                console.log('🔒 Fermeture du modal commission (extérieur)');
                closeCommissionModalFunc();
            }
        });
        console.log('✅ Fermeture modal commission extérieur configurée');
    }
    
    // Filtres de statut
    setupStatusFilters();
    
    console.log('✅ Tous les événements des commissions configurés');
    
    // Configurer la conversion virgule->point pour les champs de pourcentage
    setupPercentageInputs();
}

// Configuration des champs de pourcentage pour accepter les virgules
function setupPercentageInputs() {
    // Event listener global pour tous les champs de pourcentage
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('participant-percentage-input')) {
            // Remplacer les virgules par des points
            let value = e.target.value;
            if (value.includes(',')) {
                e.target.value = value.replace(',', '.');
            }
        }
    });
    
    // Event listener pour la validation en temps réel
    document.addEventListener('blur', function(e) {
        if (e.target.classList.contains('participant-percentage-input')) {
            let value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                // Arrondir à 2 décimales et s'assurer que c'est dans la plage 0-100
                value = Math.max(0, Math.min(100, Math.round(value * 100) / 100));
                e.target.value = value;
            }
        }
    });
    
    console.log('✅ Configuration des champs de pourcentage terminée');
}

// Configuration des filtres de statut
function setupStatusFilters() {
    console.log('🔧 Configuration des filtres de statut...');
    
    const filterButtons = document.querySelectorAll('.status-filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const status = this.getAttribute('data-status');
            console.log('🎯 Filtre de statut sélectionné:', status);
            
            // Retirer la classe active de tous les boutons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            
            // Mettre à jour le filtre actuel
            currentStatusFilter = status;
            
            // Appliquer le filtre
            applyStatusFilter();
        });
    });
    
    console.log('✅ Filtres de statut configurés');
}

// Chargement des commissions
// Fonction pour charger les commissions (appelée par le système d'authentification)
window.loadCommissions = async function loadCommissions() {
    console.log('📥 Chargement des commissions...');
    try {
        const response = await fetch('/api/commissions');
        if (!response.ok) throw new Error('Erreur lors du chargement');
        
        const data = await response.json();
        commissions = data.commissions || [];
        console.log(`✅ ${commissions.length} commissions chargées`);
        
        // Charger aussi la liste des agents pour les participants
        await loadAgentsList();
        
        renderCommissions();
    } catch (error) {
        console.error('❌ Erreur lors du chargement des commissions:', error);
        showMessage('Erreur lors du chargement des commissions', 'error');
    }
}

// Rendre la fonction accessible globalement
window.loadCommissions = loadCommissions;

// Chargement de la liste des agents
async function loadAgentsList() {
    console.log('📥 Chargement de la liste des agents...');
    try {
        const response = await fetch('/api/agents/list');
        if (!response.ok) throw new Error('Erreur lors du chargement des agents');
        
        commissionAgents = await response.json();
        console.log(`✅ ${commissionAgents.length} agents chargés pour la liste`);
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la liste des agents:', error);
        commissionAgents = [];
    }
}

// Rendu des commissions
function renderCommissions() {
    console.log('🎨 Rendu des commissions...');
    
    if (!commissionsContainer) {
        console.error('❌ Container des commissions non trouvé');
        return;
    }
    
    if (commissions.length === 0) {
        commissionsContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-briefcase"></i> Aucune commission trouvée
            </div>
        `;
        return;
    }
    
    // Filtrer les commissions selon le statut sélectionné
    let filteredCommissions = [...commissions];
    if (currentStatusFilter !== 'tous') {
        filteredCommissions = commissions.filter(commission => commission.statut === currentStatusFilter);
    }
    
    // Trier les commissions par statut et date
    const sortedCommissions = filteredCommissions.sort((a, b) => {
        // D'abord par statut (ordre de priorité)
        const statusOrder = { 
            'en_cours': 0,      // En cours en premier (priorité)
            'en_revision': 1,   // En révision
            'planifie': 2,      // Planifié
            'pas_commence': 3,  // Pas commencé
            'en_pause': 4,      // En pause
            'termine': 5,       // Terminé
            'annule': 6         // Annulé en dernier
        };
        if (statusOrder[a.statut] !== statusOrder[b.statut]) {
            return statusOrder[a.statut] - statusOrder[b.statut];
        }
        // Puis par date de création (plus récent en premier)
        return new Date(b.dateCreation) - new Date(a.dateCreation);
    });
    
    if (sortedCommissions.length === 0) {
        const statusText = currentStatusFilter === 'tous' ? 'correspondant à votre recherche' : 
                          `avec le statut "${currentStatusFilter}"`;
        commissionsContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-search"></i> Aucune commission ${statusText}
            </div>
        `;
        return;
    }
    
    const commissionsHTML = sortedCommissions.map(commission => renderCommissionCard(commission)).join('');
    commissionsContainer.innerHTML = `
        <div class="commissions-grid">
            ${commissionsHTML}
        </div>
    `;
    
    // Ajouter les gestionnaires d'événements aux boutons générés
    setupCommissionCardEventListeners();
    
    console.log(`✅ ${sortedCommissions.length} commissions rendues (filtre: ${currentStatusFilter})`);
}

// Application du filtre de statut
function applyStatusFilter() {
    console.log('🎯 Application du filtre de statut:', currentStatusFilter);
    renderCommissions();
}

// Suggestions de transitions de statut automatiques
function getStatusTransitionSuggestions(commission) {
    const suggestions = [];
    const currentStatus = commission.statut;
    const now = new Date();
    const deadline = commission.deadline ? new Date(commission.deadline) : null;
    const hasAcompte = commission.acompte && commission.acompte.montantAcompte > 0;
    const acompteRecu = commission.acompte && commission.acompte.statutAcompte === 'recu';
    
    switch (currentStatus) {
        case 'pas_commence':
            if (hasAcompte && acompteRecu) {
                suggestions.push({
                    newStatus: 'planifie',
                    reason: 'Acompte reçu - Prêt à planifier',
                    priority: 'high'
                });
            } else if (hasAcompte) {
                suggestions.push({
                    newStatus: 'planifie',
                    reason: 'Acompte configuré - Peut être planifié',
                    priority: 'medium'
                });
            }
            break;
            
        case 'planifie':
            suggestions.push({
                newStatus: 'en_cours',
                reason: 'Démarrer le projet',
                priority: 'high'
            });
            break;
            
        case 'en_cours':
            if (deadline && deadline < now) {
                suggestions.push({
                    newStatus: 'en_retard',
                    reason: 'Deadline dépassée',
                    priority: 'urgent'
                });
            }
            suggestions.push({
                newStatus: 'en_revision',
                reason: 'Soumettre pour révision',
                priority: 'medium'
            });
            suggestions.push({
                newStatus: 'en_pause',
                reason: 'Suspendre temporairement',
                priority: 'low'
            });
            break;
            
        case 'en_revision':
            suggestions.push({
                newStatus: 'termine',
                reason: 'Validation terminée',
                priority: 'high'
            });
            suggestions.push({
                newStatus: 'en_cours',
                reason: 'Corrections nécessaires',
                priority: 'medium'
            });
            break;
            
        case 'en_pause':
            suggestions.push({
                newStatus: 'en_cours',
                reason: 'Reprendre le projet',
                priority: 'high'
            });
            suggestions.push({
                newStatus: 'annule',
                reason: 'Annuler définitivement',
                priority: 'low'
            });
            break;
    }
    
    return suggestions;
}

// Afficher les suggestions de transition dans la carte
function renderStatusTransitionSuggestions(commission) {
    const suggestions = getStatusTransitionSuggestions(commission);
    
    if (suggestions.length === 0) return '';
    
    const suggestionsHTML = suggestions.map(suggestion => {
        const priorityColors = {
            'urgent': '#dc3545',
            'high': '#fd7e14', 
            'medium': '#ffc107',
            'low': '#6c757d'
        };
        
        const color = priorityColors[suggestion.priority] || '#6c757d';
        
        return `
            <button class="status-suggestion-btn" 
                    data-commission-id="${commission.idCommission}"
                    data-new-status="${suggestion.newStatus}"
                    style="padding: 0.25rem 0.5rem; margin: 0.25rem; border: 1px solid ${color}; background: ${color}15; color: ${color}; border-radius: 12px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s;">
                ${suggestion.reason}
            </button>
        `;
    }).join('');
    
    return `
        <div class="status-suggestions" style="margin-top: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #17a2b8;">
            <small style="color: #6c757d; font-weight: 600; display: block; margin-bottom: 0.25rem;">
                <i class="fas fa-lightbulb"></i> Suggestions de transition :
            </small>
            ${suggestionsHTML}
        </div>
    `;
}

// Application d'une transition de statut
async function applyStatusTransition(commissionId, newStatus) {
    console.log('🔄 Application de la transition de statut:', commissionId, '->', newStatus);
    
    try {
        // Trouver la commission
        const commission = commissions.find(c => c.idCommission === commissionId);
        if (!commission) {
            console.error('❌ Commission non trouvée:', commissionId);
            return;
        }
        
        // Confirmation utilisateur
        const statusConfig = {
            'pas_commence': 'Pas commencé',
            'planifie': 'Planifié',
            'en_cours': 'En cours',
            'en_pause': 'En pause',
            'en_revision': 'En révision',
            'termine': 'Terminé',
            'annule': 'Annulé'
        };
        
        const confirmMessage = `Voulez-vous vraiment changer le statut de "${commission.nomProjet}" vers "${statusConfig[newStatus]}" ?`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Mettre à jour le statut
        const updatedCommission = {
            ...commission,
            statut: newStatus
        };
        
        // Envoyer la mise à jour au serveur
        const response = await fetch(`/api/commissions/${commissionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedCommission)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour');
        }
        
        const result = await response.json();
        console.log('✅ Statut mis à jour:', result);
        
        // Mettre à jour localement
        const index = commissions.findIndex(c => c.idCommission === commissionId);
        if (index !== -1) {
            commissions[index] = result;
        }
        
        // Rafraîchir l'affichage
        renderCommissions();
        
        showMessage(`Statut changé vers "${statusConfig[newStatus]}" avec succès !`, 'success');
        
    } catch (error) {
        console.error('❌ Erreur lors de la transition de statut:', error);
        showMessage('Erreur lors du changement de statut', 'error');
    }
}

// Configuration des événements pour les cartes de commissions
function setupCommissionCardEventListeners() {
    console.log('🔧 Configuration des événements des cartes de commissions...');
    
    // Boutons Modifier
    const editButtons = document.querySelectorAll('.edit-commission-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commissionId = parseInt(this.getAttribute('data-commission-id'));
            console.log('✏️ Bouton Modifier cliqué pour la commission:', commissionId);
            editCommission(commissionId);
        });
    });
    
    // Boutons Supprimer
    const deleteButtons = document.querySelectorAll('.delete-commission-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commissionId = parseInt(this.getAttribute('data-commission-id'));
            console.log('🗑️ Bouton Supprimer cliqué pour la commission:', commissionId);
            deleteCommission(commissionId);
        });
    });
    
    // Boutons de suggestion de transition de statut
    const suggestionButtons = document.querySelectorAll('.status-suggestion-btn');
    suggestionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commissionId = parseInt(this.getAttribute('data-commission-id'));
            const newStatus = this.getAttribute('data-new-status');
            console.log('🔄 Suggestion de transition cliquée:', commissionId, '->', newStatus);
            applyStatusTransition(commissionId, newStatus);
        });
    });
    
    // Boutons de paiement final
    const paiementFinalButtons = document.querySelectorAll('.btn-paiement-final');
    paiementFinalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commissionId = parseInt(this.getAttribute('data-commission-id'));
            const soldeRestant = parseFloat(this.getAttribute('data-solde-restant'));
            console.log('💰 Bouton paiement final cliqué:', commissionId, soldeRestant);
            ajouterPaiementFinalDirect(commissionId, soldeRestant);
        });
    });
    
    // Boutons de suppression de paiement final
    const supprimerPaiementButtons = document.querySelectorAll('.btn-supprimer-paiement');
    supprimerPaiementButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commissionId = parseInt(this.getAttribute('data-commission-id'));
            const paiementIndex = parseInt(this.getAttribute('data-paiement-index'));
            console.log('🗑️ Bouton supprimer paiement cliqué:', commissionId, paiementIndex);
            supprimerPaiementFinal(commissionId, paiementIndex);
        });
    });
    
    console.log('✅ Événements des cartes de commissions configurés');
}

// Rendu d'une carte de commission
function renderCommissionCard(commission) {
    // Configuration des statuts avec icônes et couleurs
    const statusConfig = {
        'pas_commence': { 
            text: 'Pas commencé', 
            class: 'status-not-started', 
            icon: 'fa-clock',
            color: '#6c757d',
            description: 'Projet en attente de démarrage'
        },
        'planifie': { 
            text: 'Planifié', 
            class: 'status-planned', 
            icon: 'fa-calendar-alt',
            color: '#17a2b8',
            description: 'Projet planifié et organisé'
        },
        'en_cours': { 
            text: 'En cours', 
            class: 'status-in-progress', 
            icon: 'fa-play-circle',
            color: '#ffc107',
            description: 'Projet actuellement en développement'
        },
        'en_pause': { 
            text: 'En pause', 
            class: 'status-paused', 
            icon: 'fa-pause-circle',
            color: '#fd7e14',
            description: 'Projet temporairement suspendu'
        },
        'en_revision': { 
            text: 'En révision', 
            class: 'status-review', 
            icon: 'fa-search',
            color: '#6f42c1',
            description: 'Projet en cours de validation'
        },
        'termine': { 
            text: 'Terminé', 
            class: 'status-completed', 
            icon: 'fa-check-circle',
            color: '#28a745',
            description: 'Projet livré et finalisé'
        },
        'annule': { 
            text: 'Annulé', 
            class: 'status-cancelled', 
            icon: 'fa-times-circle',
            color: '#dc3545',
            description: 'Projet annulé ou abandonné'
        }
    };
    
    const statusInfo = statusConfig[commission.statut] || statusConfig['pas_commence'];
    const statusClass = statusInfo.class;
    
    const participantsHTML = commission.participants && commission.participants.length > 0
        ? commission.participants.map(participant => {
            const montantBrut = (commission.prix * participant.pourcentage) / 100;
            const montantTaxe = (montantBrut * (participant.taxe || 0)) / 100;
            const montantNet = montantBrut - montantTaxe;
            
            // Récupérer le pseudo depuis la liste des agents
            const agent = commissionAgents.find(a => a.idAgent === participant.idAgent);
            const pseudo = agent ? agent.pseudo : `Agent ${participant.idAgent}`;
            
            return `
                <div class="participant">
                    <div class="participant-info">
                        <span class="participant-name">${pseudo}</span>
                        <span class="participant-percentage">${participant.pourcentage}%</span>
                        ${participant.taxe ? `<span class="participant-tax">Taxe: ${participant.taxe}%</span>` : ''}
                    </div>
                    <div class="participant-amounts">
                        <span class="participant-gross">${montantBrut.toFixed(2)}€ brut</span>
                        ${participant.taxe ? `<span class="participant-tax-amount">-${montantTaxe.toFixed(2)}€ taxe</span>` : ''}
                        <span class="participant-net">${montantNet.toFixed(2)}€ net</span>
                    </div>
                </div>
            `;
        }).join('')
        : '<div class="participant"><span class="participant-name">Aucun participant</span></div>';
    
    const datesHTML = `
        <div class="commission-dates">
            <div class="date-item">
                <div class="date-label">Création</div>
                <div class="date-value">${formatDate(commission.dateCreation)}</div>
            </div>
            ${commission.deadline ? `
                <div class="date-item">
                    <div class="date-label">Deadline</div>
                    <div class="date-value">${formatDate(commission.deadline)}</div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Générer le HTML pour l'acompte
    const acompteHTML = commission.acompte ? generateAcompteHTML(commission) : '';
    
    // Générer les suggestions de transition
    const suggestionsHTML = renderStatusTransitionSuggestions(commission);
    
    return `
        <div class="commission-card ${statusClass}">
            <div class="commission-content">
                <div class="commission-header">
                    <div class="commission-title">${commission.nomProjet}</div>
                    <div class="commission-price">${commission.prix}€</div>
                </div>
                
                <div class="commission-status-bar" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; margin: 0.5rem 0; background: ${statusInfo.color}15; border-left: 4px solid ${statusInfo.color}; border-radius: 4px;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas ${statusInfo.icon}" style="color: ${statusInfo.color};"></i>
                        <span style="font-weight: 600; color: ${statusInfo.color};">${statusInfo.text}</span>
                    </div>
                    <small style="color: #6c757d; font-style: italic;">${statusInfo.description}</small>
                </div>
                
                <div class="commission-client">
                    <i class="fas fa-user"></i> ${commission.nomClient}
                </div>
                
                ${commission.description ? `
                    <div class="commission-description">${commission.description}</div>
                ` : ''}
                
                ${datesHTML}
                
                ${acompteHTML}
                
                <div class="commission-participants">
                    <div style="margin-bottom: 0.5rem; font-weight: 600; color: #2c3e50;">Participants:</div>
                    ${participantsHTML}
                </div>
                
                ${suggestionsHTML}
            </div>
            
            <div class="commission-actions">
                <button class="btn btn-warning btn-sm edit-commission-btn" data-commission-id="${commission.idCommission}">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-danger btn-sm delete-commission-btn" data-commission-id="${commission.idCommission}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `;
}

// Génération du HTML pour l'affichage des acomptes
function generateAcompteHTML(commission) {
    const acompte = commission.acompte;
    if (!acompte || !acompte.montantAcompte) return '';
    
    // Calculer le total versé (acomptes + paiements finaux)
    const totalVerseAcomptes = acompte.historiqueAcomptes ? 
        acompte.historiqueAcomptes.reduce((sum, h) => sum + h.montant, 0) : 0;
    const totalVersePaiements = acompte.historiquePaiements ? 
        acompte.historiquePaiements.reduce((sum, p) => sum + p.montant, 0) : 0;
    const totalVerse = totalVerseAcomptes + totalVersePaiements;
    
    // Calculer le solde restant
    const soldeRestant = commission.prix - totalVerse;
    const pourcentageVerse = commission.prix > 0 ? (totalVerse / commission.prix) * 100 : 0;
    
    // Déterminer l'icône et la couleur selon le statut
    const statutConfig = {
        'non_demande': { icon: 'fa-clock', color: '#6c757d', text: 'Non demandé' },
        'en_attente': { icon: 'fa-hourglass-half', color: '#ffc107', text: 'En attente' },
        'recu': { icon: 'fa-check-circle', color: '#28a745', text: 'Reçu' },
        'en_retard': { icon: 'fa-exclamation-triangle', color: '#dc3545', text: 'En retard' },
        'partiel': { icon: 'fa-adjust', color: '#17a2b8', text: 'Partiel' }
    };
    
    const config = statutConfig[acompte.statutAcompte] || statutConfig['non_demande'];
    
    return `
        <div class="commission-acompte" style="background: #f8f9fa; border-left: 4px solid ${config.color}; padding: 1rem; margin: 1rem 0; border-radius: 0 8px 8px 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas ${config.icon}" style="color: ${config.color};"></i>
                    <span style="font-weight: 600; color: #2c3e50;">💰 Acompte</span>
                    <span class="acompte-status" style="background: ${config.color}; color: white; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">${config.text}</span>
                </div>
                <div style="font-weight: 600; color: ${config.color};">${acompte.montantAcompte}€</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
                <div>
                    <div style="color: #6c757d; font-size: 0.8rem;">Versé</div>
                    <div style="font-weight: 600; color: ${totalVerse > 0 ? '#28a745' : '#6c757d'};">${totalVerse.toFixed(2)}€</div>
                </div>
                <div>
                    <div style="color: #6c757d; font-size: 0.8rem;">Restant</div>
                    <div style="font-weight: 600; color: ${soldeRestant <= 0 ? '#28a745' : '#dc3545'};">${soldeRestant.toFixed(2)}€</div>
                </div>
                <div>
                    <div style="color: #6c757d; font-size: 0.8rem;">Progression</div>
                    <div style="font-weight: 600; color: ${pourcentageVerse >= 100 ? '#28a745' : '#2c5aa0'};">${pourcentageVerse.toFixed(1)}%</div>
                </div>
            </div>
            
            ${acompte.dateAcomptePrevu || acompte.dateAcompteRecu ? `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem; font-size: 0.85rem;">
                    ${acompte.dateAcomptePrevu ? `
                        <div>
                            <div style="color: #6c757d; font-size: 0.8rem;">Prévu le</div>
                            <div style="color: #2c3e50;">${formatDate(acompte.dateAcomptePrevu)}</div>
                        </div>
                    ` : ''}
                    ${acompte.dateAcompteRecu ? `
                        <div>
                            <div style="color: #6c757d; font-size: 0.8rem;">Reçu le</div>
                            <div style="color: #28a745; font-weight: 600;">${formatDate(acompte.dateAcompteRecu)}</div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            ${totalVerse < commission.prix && soldeRestant > 0 ? `
                <div style="margin-top: 0.5rem; padding: 0.5rem; background: #fff3cd; border-radius: 4px; border-left: 3px solid #ffc107;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <small style="color: #856404;">
                            <i class="fas fa-info-circle"></i> 
                            Solde de <strong>${soldeRestant.toFixed(2)}€</strong> à recevoir pour finaliser le paiement
                        </small>
                        <button class="btn-paiement-final" 
                                data-commission-id="${commission.idCommission}" 
                                data-solde-restant="${soldeRestant.toFixed(2)}"
                                style="background: #28a745; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                            <i class="fas fa-plus"></i> Ajouter paiement final
                        </button>
                    </div>
                </div>
            ` : ''}
            
            ${acompte.historiquePaiements && acompte.historiquePaiements.length > 0 ? `
                <div style="margin-top: 0.5rem;">
                    <div style="font-size: 0.9rem; font-weight: 600; color: #2c3e50; margin-bottom: 0.3rem;">
                        <i class="fas fa-receipt"></i> Paiements finaux :
                    </div>
                    ${acompte.historiquePaiements.map((paiement, index) => `
                        <div style="background: #e8f5e8; padding: 0.3rem 0.5rem; margin: 0.2rem 0; border-radius: 4px; font-size: 0.85rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span><strong>${paiement.montant.toFixed(2)}€</strong> - ${formatDate(paiement.dateVersement)}</span>
                                        <span style="color: #6c757d;">${paiement.methodeVersement}</span>
                                    </div>
                                    ${paiement.commentaire ? `<div style="color: #6c757d; font-style: italic; font-size: 0.8rem;">${paiement.commentaire}</div>` : ''}
                                </div>
                                <button class="btn-supprimer-paiement" 
                                        data-commission-id="${commission.idCommission}" 
                                        data-paiement-index="${index}"
                                        style="background: #dc3545; color: white; border: none; padding: 0.2rem 0.4rem; border-radius: 3px; font-size: 0.7rem; cursor: pointer; margin-left: 0.5rem;"
                                        title="Supprimer ce paiement">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// Formatage des dates
function formatDate(dateString) {
    if (!dateString) return 'Non définie';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Ouverture du modal de commission
function openCommissionModal(commission = null) {
    console.log('🔓 Ouverture du modal commission, commission:', commission);
    
    if (!commissionModal || !commissionModalTitle) {
        console.error('❌ Éléments du modal commission non trouvés');
        return;
    }
    
    isCommissionEditMode = !!commission;
    currentCommissionId = commission ? commission.idCommission : null;
    
    commissionModalTitle.textContent = isCommissionEditMode ? 'Modifier la Commission' : 'Nouvelle Commission';
    commissionModal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    // Remettre le scroll de la modale au début
    const modalBody = commissionModal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
    
    if (commission) {
        populateCommissionForm(commission);
    } else {
        clearCommissionForm();
    }
    
    console.log('✅ Modal commission ouvert');
}

// Fermeture du modal de commission
function closeCommissionModalFunc() {
    console.log('🔒 Fermeture du modal commission');
    
    if (commissionModal) {
        commissionModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        clearCommissionForm();
        isCommissionEditMode = false;
        currentCommissionId = null;
        console.log('✅ Modal commission fermé');
    }
}

// Remplissage du formulaire de commission
function populateCommissionForm(commission) {
    console.log('📝 Remplissage du formulaire commission avec:', commission);
    
    if (nomClientInput) nomClientInput.value = commission.nomClient || '';
    if (nomProjetInput) nomProjetInput.value = commission.nomProjet || '';
    if (prixInput) prixInput.value = commission.prix || '';
    if (deadlineInput) deadlineInput.value = commission.deadline ? commission.deadline.slice(0, 16) : '';
    if (statutCommissionSelect) statutCommissionSelect.value = commission.statut || 'pas_commence';
    if (descriptionTextarea) descriptionTextarea.value = commission.description || '';
    
    // Remplir les champs d'acompte
    const acompte = commission.acompte || {};
    if (montantAcompteInput) montantAcompteInput.value = acompte.montantAcompte || '';
    if (statutAcompteSelect) statutAcompteSelect.value = acompte.statutAcompte || 'non_demande';
    if (dateAcomptePrevuInput) dateAcomptePrevuInput.value = acompte.dateAcomptePrevu ? acompte.dateAcomptePrevu.slice(0, 16) : '';
    if (dateAcompteRecuInput) dateAcompteRecuInput.value = acompte.dateAcompteRecu ? acompte.dateAcompteRecu.slice(0, 16) : '';
    
    // Remplir les participants
    populateParticipants(commission.participants || []);
}

// Nettoyage du formulaire de commission
function clearCommissionForm() {
    console.log('🧹 Nettoyage du formulaire commission');
    
    if (commissionForm) commissionForm.reset();
    if (descriptionTextarea) descriptionTextarea.value = '';
    
    // Vider les participants
    if (participantsContainer) {
        participantsContainer.innerHTML = '';
    }
}

// Ajout d'un champ participant
function addParticipantField() {
    console.log('👤 Ajout d\'un champ participant');
    
    const participantDiv = document.createElement('div');
    participantDiv.className = 'participant-field';
    participantDiv.style.cssText = 'display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center;';
    
    participantDiv.innerHTML = `
        <select class="form-input" style="flex: 2;" required>
            <option value="">Sélectionner un agent</option>
            ${commissionAgents.map(agent => `<option value="${agent.idAgent}">${agent.pseudo}</option>`).join('')}
        </select>
        <input type="number" class="form-input participant-percentage-input" placeholder="%" min="0" max="100" step="0.01" style="flex: 1;" required>
        <input type="number" class="form-input" placeholder="Taxe %" min="0" max="100" step="0.1" style="flex: 1;" value="0">
        <button type="button" class="btn btn-danger btn-sm remove-participant-btn">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Ajouter l'événement de suppression
    const removeBtn = participantDiv.querySelector('.remove-participant-btn');
    removeBtn.addEventListener('click', function() {
        participantDiv.remove();
    });
    
    participantsContainer.appendChild(participantDiv);
}

// Remplissage des participants
function populateParticipants(participants) {
    if (!participantsContainer) return;
    
    participantsContainer.innerHTML = '';
    
    participants.forEach(participant => {
        const participantDiv = document.createElement('div');
        participantDiv.className = 'participant-field';
        participantDiv.style.cssText = 'display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center;';
        
        participantDiv.innerHTML = `
            <select class="form-input" style="flex: 2;" required>
                <option value="">Sélectionner un agent</option>
                ${commissionAgents.map(agent => `<option value="${agent.idAgent}" ${agent.idAgent === participant.idAgent ? 'selected' : ''}>${agent.pseudo}</option>`).join('')}
            </select>
            <input type="number" class="form-input participant-percentage-input" placeholder="%" min="0" max="100" step="0.01" style="flex: 1;" value="${participant.pourcentage}" required>
            <input type="number" class="form-input" placeholder="Taxe %" min="0" max="100" step="0.1" style="flex: 1;" value="${participant.taxe || 0}">
            <button type="button" class="btn btn-danger btn-sm remove-participant-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Ajouter l'événement de suppression
        const removeBtn = participantDiv.querySelector('.remove-participant-btn');
        removeBtn.addEventListener('click', function() {
            participantDiv.remove();
        });
        
        participantsContainer.appendChild(participantDiv);
    });
}

// Gestion de la soumission du formulaire de commission
async function handleCommissionFormSubmit() {
    console.log('📝 Traitement du formulaire commission...');
    
    const formData = getCommissionFormData();
    
    if (!formData.nomClient.trim() || !formData.nomProjet.trim() || !formData.prix) {
        showMessage('Le nom du client, le nom du projet et le prix sont obligatoires', 'error');
        return;
    }
    
    console.log('📊 Données du formulaire commission:', formData);
    await saveCommission(formData);
}

// Récupération des données du formulaire de commission
function getCommissionFormData() {
    console.log('🔍 Récupération des données du formulaire commission...');
    
    const participants = [];
    const participantFields = participantsContainer.querySelectorAll('.participant-field');
    
    participantFields.forEach(field => {
        const select = field.querySelector('select');
        const inputs = field.querySelectorAll('input[type="number"]');
        const pourcentageInput = inputs[0]; // Premier input = pourcentage
        const taxeInput = inputs[1]; // Deuxième input = taxe
        
        if (select.value && pourcentageInput.value) {
                participants.push({
                    idAgent: parseInt(select.value),
                    pourcentage: parseFloat(pourcentageInput.value),
                    taxe: parseFloat(taxeInput.value) || 0
                });
        }
    });
    
    // Récupérer les données d'acompte
    const acompteData = {};
    if (montantAcompteInput && montantAcompteInput.value) {
        acompteData.montantAcompte = parseFloat(montantAcompteInput.value);
        acompteData.statutAcompte = statutAcompteSelect ? statutAcompteSelect.value : 'non_demande';
        acompteData.dateAcomptePrevu = dateAcomptePrevuInput && dateAcomptePrevuInput.value ? 
            new Date(dateAcomptePrevuInput.value).toISOString() : null;
        acompteData.dateAcompteRecu = dateAcompteRecuInput && dateAcompteRecuInput.value ? 
            new Date(dateAcompteRecuInput.value).toISOString() : null;
        acompteData.historiqueAcomptes = [];
    }
    
    const formData = {
        nomClient: nomClientInput ? nomClientInput.value.trim() : '',
        nomProjet: nomProjetInput ? nomProjetInput.value.trim() : '',
        prix: prixInput ? parseFloat(prixInput.value) : 0,
        deadline: deadlineInput && deadlineInput.value ? new Date(deadlineInput.value).toISOString() : null,
        statut: statutCommissionSelect ? statutCommissionSelect.value : 'pas_commence',
        description: descriptionTextarea ? descriptionTextarea.value.trim() : '',
        participants: participants,
        commentaires: []
    };
    
    // Ajouter les données d'acompte seulement si un montant est spécifié
    if (Object.keys(acompteData).length > 0) {
        formData.acompte = acompteData;
    }
    
    console.log('📊 Données complètes du formulaire commission:', formData);
    return formData;
}

// Sauvegarde d'une commission
async function saveCommission(commissionData) {
    console.log('💾 Sauvegarde de la commission:', commissionData);
    
    try {
        const url = isCommissionEditMode ? `/api/commissions/${currentCommissionId}` : '/api/commissions';
        const method = isCommissionEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commissionData)
        });
        
        if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
        
        const result = await response.json();
        showMessage(
            isCommissionEditMode ? 'Commission modifiée avec succès!' : 'Commission ajoutée avec succès!', 
            'success'
        );
        
        // Sauvegarder la position de scroll avant rechargement (sauf si c'est une nouvelle commission)
        const scrollPosition = isCommissionEditMode ? window.pageYOffset : 0;
        
        await loadCommissions();
        closeCommissionModalFunc();
        
        // Restaurer la position de scroll seulement en mode édition
        if (isCommissionEditMode) {
            window.scrollTo(0, scrollPosition);
        }
        return result;
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        showMessage('Erreur lors de la sauvegarde', 'error');
        throw error;
    }
}

// Suppression d'une commission
async function deleteCommission(commissionId) {
    console.log('🗑️ Suppression de la commission:', commissionId);
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commission ?')) return;
    
    try {
        const response = await fetch(`/api/commissions/${commissionId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        
        showMessage('Commission supprimée avec succès!', 'success');
        
        // Sauvegarder la position de scroll avant rechargement
        const scrollPosition = window.pageYOffset;
        
        await loadCommissions();
        
        // Restaurer la position de scroll
        window.scrollTo(0, scrollPosition);
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showMessage('Erreur lors de la suppression', 'error');
    }
}

// Édition d'une commission
function editCommission(commissionId) {
    console.log('✏️ Édition de la commission:', commissionId);
    
    const commission = commissions.find(c => c.idCommission === commissionId);
    if (commission) {
        openCommissionModal(commission);
    } else {
        console.error('❌ Commission non trouvée:', commissionId);
    }
}

// Filtrage des commissions
function filterCommissions(searchTerm) {
    console.log('🔍 Filtrage des commissions:', searchTerm);
    
    if (!commissionsContainer) return;
    
    const searchLower = searchTerm.toLowerCase();
    const filteredCommissions = commissions.filter(commission => 
        commission.nomClient.toLowerCase().includes(searchLower) ||
        commission.nomProjet.toLowerCase().includes(searchLower) ||
        commission.description.toLowerCase().includes(searchLower) ||
        commission.participants.some(p => {
            const agent = commissionAgents.find(a => a.idAgent === p.idAgent);
            return agent && agent.pseudo.toLowerCase().includes(searchLower);
        })
    );
    
    if (filteredCommissions.length === 0) {
        commissionsContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-search"></i> Aucune commission trouvée pour "${searchTerm}"
            </div>
        `;
        return;
    }
    
    const commissionsHTML = filteredCommissions.map(commission => renderCommissionCard(commission)).join('');
    commissionsContainer.innerHTML = `
        <div class="commissions-grid">
            ${commissionsHTML}
        </div>
    `;
    
    // Reconfigurer les événements après le filtrage
    setupCommissionCardEventListeners();
}

// Actualisation des commissions
async function refreshCommissions() {
    console.log('🔄 Actualisation des commissions...');
    
    // Sauvegarder la position de scroll avant rechargement
    const scrollPosition = window.pageYOffset;
    
    await loadCommissions();
    showMessage('Liste des commissions actualisée!', 'success');
    
    // Restaurer la position de scroll
    window.scrollTo(0, scrollPosition);
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

// ===========================================
// PAIEMENT FINAL DIRECT
// ===========================================

// Fonction pour ajouter directement le paiement final (sans modal)
async function ajouterPaiementFinalDirect(commissionId, soldeRestant) {
    console.log(`💰 Ajout paiement final direct pour commission ${commissionId}, montant: ${soldeRestant}€`);
    
    // Trouver la commission pour vérifier les données
    const commission = commissions.find(c => c.idCommission === commissionId);
    if (commission) {
        console.log('📊 Données commission avant paiement:', {
            prix: commission.prix,
            acompte: commission.acompte,
            soldeRestantCalcule: soldeRestant
        });
    }
    
    try {
        // Confirmation simple
        if (!confirm(`Confirmer que le client a payé le solde restant de ${soldeRestant}€ ?`)) {
            return;
        }
        
        // Préparer les données du paiement
        const paiementData = {
            montant: parseFloat(soldeRestant),
            dateVersement: new Date().toISOString(), // Date actuelle
            methodeVersement: "non_specifie",
            commentaire: "Paiement final ajouté directement"
        };
        
        console.log('💰 Enregistrement paiement final direct:', paiementData);
        
        // Appel à l'API
        const response = await fetch(`/api/commissions/${commissionId}/paiement-final`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authKey') || sessionStorage.getItem('authKey')}`
            },
            body: JSON.stringify(paiementData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Erreur lors de l\'enregistrement du paiement');
        }
        
        console.log('✅ Paiement final enregistré avec succès:', result);
        showMessage(`Paiement final de ${soldeRestant}€ enregistré avec succès!`, 'success');
        
        // Sauvegarder la position de scroll avant rechargement
        const scrollPosition = window.pageYOffset;
        
        // Recharger les commissions pour afficher les changements
        await loadCommissions();
        
        // Restaurer la position de scroll
        window.scrollTo(0, scrollPosition);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement du paiement final:', error);
        showMessage(`Erreur lors de l'enregistrement du paiement: ${error.message}`, 'error');
    }
}

// Fonction pour supprimer un paiement final
async function supprimerPaiementFinal(commissionId, paiementIndex) {
    console.log(`🗑️ Suppression paiement final pour commission ${commissionId}, index: ${paiementIndex}`);
    
    try {
        // Trouver la commission et le paiement pour afficher les détails
        const commission = commissions.find(c => c.idCommission === commissionId);
        if (!commission || !commission.acompte || !commission.acompte.historiquePaiements[paiementIndex]) {
            showMessage('Paiement non trouvé', 'error');
            return;
        }
        
        const paiement = commission.acompte.historiquePaiements[paiementIndex];
        
        // Confirmation avec détails du paiement
        if (!confirm(`Confirmer la suppression du paiement de ${paiement.montant.toFixed(2)}€ du ${formatDate(paiement.dateVersement)} ?`)) {
            return;
        }
        
        // Appel à l'API de suppression
        const response = await fetch(`/api/commissions/${commissionId}/paiement-final/${paiementIndex}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authKey') || sessionStorage.getItem('authKey')}`
            }
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Erreur lors de la suppression du paiement');
        }
        
        console.log('✅ Paiement final supprimé avec succès:', result);
        showMessage(`Paiement de ${paiement.montant.toFixed(2)}€ supprimé avec succès!`, 'success');
        
        // Sauvegarder la position de scroll avant rechargement
        const scrollPosition = window.pageYOffset;
        
        // Recharger les commissions pour afficher les changements
        await loadCommissions();
        
        // Restaurer la position de scroll
        window.scrollTo(0, scrollPosition);
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression du paiement final:', error);
        showMessage(`Erreur lors de la suppression du paiement: ${error.message}`, 'error');
    }
}

// ===========================================
// MODAL PAIEMENT FINAL (gardé pour compatibilité)
// ===========================================

// Fonction pour ouvrir le modal de paiement final
function ouvrirModalPaiementFinal(commissionId, soldeRestant) {
    console.log(`💰 Ouverture modal paiement final pour commission ${commissionId}, solde: ${soldeRestant}€`);
    
    // Créer le modal dynamiquement
    const modalHTML = `
        <div id="modalPaiementFinal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-money-bill-wave"></i> Ajouter un paiement final</h2>
                    <span class="close" onclick="fermerModalPaiementFinal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="formPaiementFinal">
                        <div class="form-group">
                            <label for="montantPaiement">
                                <i class="fas fa-euro-sign"></i> Montant du paiement *
                            </label>
                            <input type="number" 
                                   id="montantPaiement" 
                                   name="montant" 
                                   step="0.01" 
                                   max="${soldeRestant}" 
                                   value="${soldeRestant}"
                                   required>
                            <small style="color: #6c757d;">Solde restant : ${soldeRestant}€</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="datePaiement">
                                <i class="fas fa-calendar-alt"></i> Date de réception *
                            </label>
                            <input type="datetime-local" 
                                   id="datePaiement" 
                                   name="dateVersement" 
                                   value="${new Date().toISOString().slice(0, 16)}"
                                   required>
                        </div>
                        
                        <div class="form-group">
                            <label for="methodePaiement">
                                <i class="fas fa-credit-card"></i> Méthode de versement
                            </label>
                            <select id="methodePaiement" name="methodeVersement">
                                <option value="virement">Virement bancaire</option>
                                <option value="paypal">PayPal</option>
                                <option value="stripe">Stripe</option>
                                <option value="especes">Espèces</option>
                                <option value="cheque">Chèque</option>
                                <option value="autre">Autre</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="commentairePaiement">
                                <i class="fas fa-comment"></i> Commentaire
                            </label>
                            <textarea id="commentairePaiement" 
                                      name="commentaire" 
                                      rows="3" 
                                      placeholder="Commentaire optionnel sur ce paiement..."></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" onclick="fermerModalPaiementFinal()" class="btn-secondary">
                                <i class="fas fa-times"></i> Annuler
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-check"></i> Enregistrer le paiement
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Ajouter le modal au DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Configurer l'événement de soumission du formulaire
    document.getElementById('formPaiementFinal').addEventListener('submit', (e) => {
        e.preventDefault();
        enregistrerPaiementFinal(commissionId);
    });
    
    // Focus sur le premier champ
    document.getElementById('montantPaiement').focus();
}

// Fonction pour fermer le modal de paiement final
function fermerModalPaiementFinal() {
    const modal = document.getElementById('modalPaiementFinal');
    if (modal) {
        modal.remove();
    }
}

// Fonction pour enregistrer le paiement final
async function enregistrerPaiementFinal(commissionId) {
    try {
        const form = document.getElementById('formPaiementFinal');
        const formData = new FormData(form);
        
        const paiementData = {
            montant: parseFloat(formData.get('montant')),
            dateVersement: formData.get('dateVersement'),
            methodeVersement: formData.get('methodeVersement'),
            commentaire: formData.get('commentaire')
        };
        
        console.log('💰 Enregistrement paiement final:', paiementData);
        
        const response = await fetch(`/api/commissions/${commissionId}/paiement-final`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authKey') || sessionStorage.getItem('authKey')}`
            },
            body: JSON.stringify(paiementData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Erreur lors de l\'enregistrement du paiement');
        }
        
        console.log('✅ Paiement final enregistré avec succès:', result);
        showMessage('Paiement final enregistré avec succès!', 'success');
        
        // Fermer le modal
        fermerModalPaiementFinal();
        
        // Recharger les commissions pour afficher les changements
        await loadCommissions();
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement du paiement final:', error);
        showMessage(`Erreur lors de l'enregistrement du paiement: ${error.message}`, 'error');
    }
}

console.log('✅ TeamApp V1 - Initialisation des commissions terminée !');
