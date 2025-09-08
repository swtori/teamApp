// TeamApp V1 - Gestion des Dépenses
// Version ultra-simple et robuste

console.log('💰 TeamApp V1 - Initialisation des dépenses...');

// Variables globales
let depenses = [];
let currentDepenseId = null;
let isDepenseEditMode = false;

// Éléments DOM
let newDepenseBtn, refreshDepensesBtn, searchDepensesBox;
let depenseModal, closeDepenseModal, cancelDepenseBtn, depenseForm, depenseModalTitle;
let labelDepenseInput, descriptionDepenseInput, prixDepenseInput, statutDepenseSelect, dateDepenseInput;
let categorieDepenseSelect, commentairesDepenseTextarea;
let depenseRecurrenteCheckbox, depenseFrequenceSelect, depenseProchainePaiementInput, recurrenceOptionsDiv;
let depensesContainer, depensesStats;

// Éléments de sous-navigation
let depensesListTabBtn, templatesListTabBtn, upcomingExpensesTabBtn;
let depensesListContent, templatesListContent, upcomingExpensesContent;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM chargé, configuration des dépenses...');
    initializeDepenseElements();
    setupDepenseEventListeners();
});

// Initialisation des éléments DOM pour les dépenses
function initializeDepenseElements() {
    console.log('🔧 Initialisation des éléments DOM des dépenses...');
    
    // Boutons principaux
    newDepenseBtn = document.getElementById('newDepenseBtn');
    refreshDepensesBtn = document.getElementById('refreshDepensesBtn');
    searchDepensesBox = document.getElementById('searchDepensesBox');
    
    // Modal
    depenseModal = document.getElementById('depenseModal');
    closeDepenseModal = document.getElementById('closeDepenseModal');
    cancelDepenseBtn = document.getElementById('cancelDepenseBtn');
    depenseModalTitle = document.getElementById('depenseModalTitle');
    
    // Formulaire
    depenseForm = document.getElementById('depenseForm');
    labelDepenseInput = document.getElementById('labelDepense');
    descriptionDepenseInput = document.getElementById('descriptionDepense');
    prixDepenseInput = document.getElementById('prixDepense');
    statutDepenseSelect = document.getElementById('statutDepense');
    dateDepenseInput = document.getElementById('dateDepense');
    categorieDepenseSelect = document.getElementById('categorieDepense');
    commentairesDepenseTextarea = document.getElementById('commentairesDepense');
    
    // Champs de récurrence
    depenseRecurrenteCheckbox = document.getElementById('depenseRecurrente');
    depenseFrequenceSelect = document.getElementById('depenseFrequence');
    depenseProchainePaiementInput = document.getElementById('depenseProchainePaiement');
    recurrenceOptionsDiv = document.getElementById('recurrenceOptions');
    
    // Debug des éléments de récurrence
    console.log('🔍 Debug récurrence:');
    console.log('  - depenseRecurrenteCheckbox:', !!depenseRecurrenteCheckbox);
    console.log('  - depenseFrequenceSelect:', !!depenseFrequenceSelect);
    console.log('  - depenseProchainePaiementInput:', !!depenseProchainePaiementInput);
    console.log('  - recurrenceOptionsDiv:', !!recurrenceOptionsDiv);
    
    // Container des dépenses et stats
    depensesContainer = document.getElementById('depenses-container');
    depensesStats = document.getElementById('depenses-stats');
    
    // Éléments de sous-navigation
    depensesListTabBtn = document.getElementById('depensesListTabBtn');
    templatesListTabBtn = document.getElementById('templatesListTabBtn');
    upcomingExpensesTabBtn = document.getElementById('upcomingExpensesTabBtn');
    
    // Contenus des sous-onglets
    depensesListContent = document.getElementById('depenses-list');
    templatesListContent = document.getElementById('templates-list');
    upcomingExpensesContent = document.getElementById('upcoming-expenses');
    
    console.log('🔍 Debug sous-navigation:');
    console.log('  - depensesListTabBtn:', !!depensesListTabBtn);
    console.log('  - templatesListTabBtn:', !!templatesListTabBtn);
    console.log('  - upcomingExpensesTabBtn:', !!upcomingExpensesTabBtn);
    console.log('  - depensesListContent:', !!depensesListContent);
    console.log('  - templatesListContent:', !!templatesListContent);
    console.log('  - upcomingExpensesContent:', !!upcomingExpensesContent);
    
    console.log('✅ Éléments DOM des dépenses initialisés');
}

// Configuration des événements pour les dépenses
function setupDepenseEventListeners() {
    console.log('🔧 Configuration des événements des dépenses...');
    
    // Bouton Nouvelle Dépense
    if (newDepenseBtn) {
        newDepenseBtn.addEventListener('click', function() {
            console.log('➕ Bouton Nouvelle Dépense cliqué');
            openDepenseModal();
        });
        console.log('✅ Bouton Nouvelle Dépense configuré');
    }
    
    // Gestion de la checkbox récurrence
    if (depenseRecurrenteCheckbox && recurrenceOptionsDiv) {
        depenseRecurrenteCheckbox.addEventListener('change', function() {
            if (this.checked) {
                recurrenceOptionsDiv.style.display = 'block';
                // Définir une date par défaut pour le prochain paiement (dans 1 mois)
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                if (depenseProchainePaiementInput) {
                    depenseProchainePaiementInput.value = nextMonth.toISOString().slice(0, 16);
                }
            } else {
                recurrenceOptionsDiv.style.display = 'none';
            }
        });
        console.log('✅ Gestion récurrence configurée');
    }
    
    // Bouton Actualiser
    if (refreshDepensesBtn) {
        refreshDepensesBtn.addEventListener('click', function() {
            console.log('🔄 Bouton Actualiser Dépenses cliqué');
            refreshDepenses();
        });
        console.log('✅ Bouton Actualiser Dépenses configuré');
    }
    
    // Barre de recherche
    if (searchDepensesBox) {
        searchDepensesBox.addEventListener('input', function(e) {
            console.log('🔍 Recherche dépenses:', e.target.value);
            filterDepenses(e.target.value);
        });
        console.log('✅ Barre de recherche dépenses configurée');
    }
    
    // Fermeture du modal
    if (closeDepenseModal) {
        closeDepenseModal.addEventListener('click', function() {
            console.log('🔒 Fermeture du modal dépense (X)');
            closeDepenseModalFunc();
        });
        console.log('✅ Bouton fermeture modal dépense configuré');
    }
    
    // Bouton Annuler
    if (cancelDepenseBtn) {
        cancelDepenseBtn.addEventListener('click', function() {
            console.log('❌ Bouton Annuler dépense cliqué');
            closeDepenseModalFunc();
        });
        console.log('✅ Bouton Annuler dépense configuré');
    }
    
    // Fermeture du modal en cliquant à l'extérieur
    if (depenseModal) {
        depenseModal.addEventListener('click', function(e) {
            if (e.target === depenseModal) {
                console.log('🔒 Fermeture du modal dépense (extérieur)');
                closeDepenseModalFunc();
            }
        });
        console.log('✅ Event listener extérieur dépense configuré');
    }
    
    // Formulaire
    if (depenseForm) {
        depenseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Soumission du formulaire dépense');
            handleDepenseFormSubmit();
        });
        console.log('✅ Formulaire dépense configuré');
    }
    
    // Fermeture du modal en cliquant à l'extérieur
    if (depenseModal) {
        depenseModal.addEventListener('click', function(e) {
            if (e.target === depenseModal) {
                console.log('🔒 Fermeture du modal dépense (extérieur)');
                closeDepenseModalFunc();
            }
        });
        console.log('✅ Fermeture modal dépense extérieur configurée');
    }
    
    // Configuration des boutons de sous-navigation
    setupSubNavigationEventListeners();
    
    console.log('✅ Tous les événements des dépenses configurés');
}

// Configuration des événements de sous-navigation
function setupSubNavigationEventListeners() {
    console.log('🔧 Configuration des événements de sous-navigation...');
    
    // Bouton "Dépenses" (onglet principal)
    if (depensesListTabBtn) {
        depensesListTabBtn.addEventListener('click', function() {
            console.log('📋 Onglet Dépenses cliqué');
            showSubTab('depenses-list');
        });
        console.log('✅ Bouton Dépenses configuré');
    }
    
    // Bouton "Modèles récurrents"
    if (templatesListTabBtn) {
        templatesListTabBtn.addEventListener('click', function() {
            console.log('🔄 Onglet Modèles récurrents cliqué');
            showSubTab('templates-list');
        });
        console.log('✅ Bouton Modèles récurrents configuré');
    }
    
    // Bouton "À venir"
    if (upcomingExpensesTabBtn) {
        upcomingExpensesTabBtn.addEventListener('click', function() {
            console.log('📅 Onglet À venir cliqué');
            showSubTab('upcoming-expenses');
        });
        console.log('✅ Bouton À venir configuré');
    }
    
    // Boutons d'actualisation des sous-onglets
    const refreshTemplatesBtn = document.getElementById('refreshTemplatesBtn');
    const refreshUpcomingBtn = document.getElementById('refreshUpcomingBtn');
    
    if (refreshTemplatesBtn) {
        refreshTemplatesBtn.addEventListener('click', function() {
            console.log('🔄 Actualisation des modèles récurrents');
            loadTemplatesRecurrents();
            showMessage('Modèles récurrents actualisés!', 'success');
        });
    }
    
    if (refreshUpcomingBtn) {
        refreshUpcomingBtn.addEventListener('click', function() {
            console.log('🔄 Actualisation des dépenses à venir');
            loadUpcomingExpenses();
            showMessage('Dépenses à venir actualisées!', 'success');
        });
    }
    
    // Afficher l'onglet par défaut (Dépenses)
    showSubTab('depenses-list');
    
    console.log('✅ Événements de sous-navigation configurés');
}

// Affichage d'un sous-onglet
function showSubTab(tabId) {
    console.log('🔄 Affichage du sous-onglet:', tabId);
    
    // Masquer tous les contenus de sous-onglets
    const allSubTabs = ['depenses-list', 'templates-list', 'upcoming-expenses'];
    allSubTabs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Retirer la classe active de tous les boutons
    const allSubButtons = [depensesListTabBtn, templatesListTabBtn, upcomingExpensesTabBtn];
    allSubButtons.forEach(btn => {
        if (btn) {
            btn.classList.remove('active');
        }
    });
    
    // Afficher le contenu sélectionné
    const targetElement = document.getElementById(tabId);
    if (targetElement) {
        targetElement.style.display = 'block';
    }
    
    // Activer le bouton correspondant
    let activeButton = null;
    switch(tabId) {
        case 'depenses-list':
            activeButton = depensesListTabBtn;
            break;
        case 'templates-list':
            activeButton = templatesListTabBtn;
            loadTemplatesRecurrents();
            break;
        case 'upcoming-expenses':
            activeButton = upcomingExpensesTabBtn;
            loadUpcomingExpenses();
            break;
    }
    
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    console.log('✅ Sous-onglet affiché:', tabId);
}

// Variables pour les templates
let templates = [];
let currentTemplateId = null;
let isTemplateEditMode = false;

// Chargement des modèles récurrents
async function loadTemplatesRecurrents() {
    console.log('🔄 Chargement des modèles récurrents...');
    
    const templatesContainer = document.getElementById('templates-container');
    if (!templatesContainer) {
        console.error('❌ Container des modèles non trouvé');
        return;
    }
    
    try {
        const response = await fetch('/api/templates');
        if (!response.ok) throw new Error('Erreur lors du chargement des templates');
        
        templates = await response.json();
        console.log(`✅ ${templates.length} templates chargés`);
        
        if (templates.length === 0) {
            templatesContainer.innerHTML = `
                <div class="loading">
                    <i class="fas fa-sync-alt"></i> Aucun modèle récurrent trouvé
                </div>
            `;
            return;
        }
        
        // Afficher les modèles récurrents
        const templatesHTML = templates.map(template => renderTemplateCard(template)).join('');
        templatesContainer.innerHTML = `
            <div class="templates-header">
                <h3>Modèles Récurrents</h3>
            </div>
            <div class="depenses-grid">
                ${templatesHTML}
            </div>
        `;
        
        // Ajouter les gestionnaires d'événements avec un délai pour s'assurer que le DOM est prêt
        setTimeout(() => {
            setupTemplateEventListeners();
        }, 50);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des templates:', error);
        templatesContainer.innerHTML = `
            <div class="loading error">
                <i class="fas fa-exclamation-triangle"></i> Erreur lors du chargement des modèles
            </div>
        `;
    }
}

// Chargement des dépenses à venir
function loadUpcomingExpenses() {
    console.log('📅 Chargement des dépenses à venir...');
    
    const upcomingContainer = document.getElementById('upcoming-container');
    if (!upcomingContainer) {
        console.error('❌ Container des dépenses à venir non trouvé');
        return;
    }
    
    // Filtrer les dépenses à venir
    const depensesAVenir = depenses.filter(depense => depense.statut === 'à_venir');
    
    if (depensesAVenir.length === 0) {
        upcomingContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-calendar-alt"></i> Aucune dépense à venir trouvée
            </div>
        `;
        return;
    }
    
    // Trier par date (plus proche en premier)
    const sortedUpcoming = depensesAVenir.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Afficher les dépenses à venir
    const upcomingHTML = sortedUpcoming.map(depense => renderUpcomingCard(depense)).join('');
    upcomingContainer.innerHTML = `
        <div class="depenses-grid">
            ${upcomingHTML}
        </div>
    `;
    
    console.log(`✅ ${depensesAVenir.length} dépenses à venir affichées`);
}

// Rendu d'une carte de modèle récurrent
function renderTemplateCard(template) {
    const frequenceText = {
        'hebdomadaire': 'Hebdomadaire',
        'mensuel': 'Mensuel',
        'trimestriel': 'Trimestriel',
        'semestriel': 'Semestriel',
        'annuel': 'Annuel'
    }[template.frequence] || template.frequence;
    
    return `
        <div class="depense-card recurrente template-card">
            <div class="depense-content">
                <div class="depense-header">
                    <div class="depense-title">🔄 ${template.label}</div>
                    <div class="depense-prix">${template.prix}€</div>
                </div>
                
                ${template.description ? `
                    <div class="depense-description">${template.description}</div>
                ` : ''}
                
                <div class="depense-meta">
                    <div class="recurrence-info">
                        <span class="recurrence-badge">${frequenceText}</span>
                        ${template.prochainePaiement ? `
                            <div class="next-payment">
                                Prochain : ${formatDate(template.prochainePaiement)}
                            </div>
                        ` : ''}
                    </div>
                    ${template.categorie ? `<span class="depense-categorie">${template.categorie}</span>` : ''}
                </div>
            </div>
            
            <div class="depense-actions">
                <button class="btn btn-primary btn-sm create-from-template-btn" data-template-id="${template.idDepense}">
                    <i class="fas fa-plus"></i> Créer
                </button>
                <button class="btn btn-warning btn-sm edit-depense-btn" data-depense-id="${template.idDepense}">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-danger btn-sm delete-depense-btn" data-depense-id="${template.idDepense}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `;
}

// Rendu d'une carte de dépense à venir
function renderUpcomingCard(depense) {
    const today = new Date();
    const depenseDate = new Date(depense.date);
    const diffTime = depenseDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let urgencyClass = '';
    let urgencyText = '';
    
    if (diffDays <= 0) {
        urgencyClass = 'urgent-today';
        urgencyText = "Aujourd'hui";
    } else if (diffDays <= 3) {
        urgencyClass = 'urgent-soon';
        urgencyText = `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays <= 7) {
        urgencyClass = 'urgent-week';
        urgencyText = `Dans ${diffDays} jours`;
    } else {
        urgencyText = `Dans ${diffDays} jours`;
    }
    
    return `
        <div class="depense-card a_venir upcoming-card ${urgencyClass}">
            <div class="depense-content">
                <div class="depense-header">
                    <div class="depense-title">📅 ${depense.label}</div>
                    <div class="depense-prix">${depense.prix}€</div>
                </div>
                
                ${depense.description ? `
                    <div class="depense-description">${depense.description}</div>
                ` : ''}
                
                <div class="depense-meta">
                    <div class="depense-date">
                        <i class="fas fa-calendar"></i> ${formatDate(depense.date)}
                    </div>
                    <div class="urgency-info ${urgencyClass}">
                        ${urgencyText}
                    </div>
                    ${depense.categorie ? `<span class="depense-categorie">${depense.categorie}</span>` : ''}
                </div>
                
                ${depense.recurrente ? `
                    <div class="recurrence-info">
                        <span class="recurrence-badge">🔄 Récurrente</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="depense-actions">
                <button class="btn btn-success btn-sm mark-paid-btn" data-depense-id="${depense.idDepense}">
                    <i class="fas fa-check"></i> Marquer payé
                </button>
                <button class="btn btn-warning btn-sm edit-depense-btn" data-depense-id="${depense.idDepense}">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-danger btn-sm delete-depense-btn" data-depense-id="${depense.idDepense}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `;
}

// Chargement des dépenses
// Fonction pour charger les dépenses (appelée par le système d'authentification)
window.loadDepenses = async function loadDepenses() {
    console.log('📥 Chargement des dépenses...');
    try {
        const response = await fetch('/api/depenses');
        if (!response.ok) throw new Error('Erreur lors du chargement');
        
        const data = await response.json();
        depenses = data.depenses || [];
        console.log(`✅ ${depenses.length} dépenses chargées`);
        
        renderDepenses();
        updateDepensesStats();
    } catch (error) {
        console.error('❌ Erreur lors du chargement des dépenses:', error);
        showMessage('Erreur lors du chargement des dépenses', 'error');
    }
}

// Rendre la fonction accessible globalement
window.loadDepenses = loadDepenses;

// Rendu des dépenses
function renderDepenses() {
    console.log('🎨 Rendu des dépenses...');
    
    if (!depensesContainer) {
        console.error('❌ Container des dépenses non trouvé');
        return;
    }
    
    if (depenses.length === 0) {
        depensesContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-receipt"></i> Aucune dépense trouvée
            </div>
        `;
        return;
    }
    
    // Trier les dépenses par statut et date
    const sortedDepenses = [...depenses].sort((a, b) => {
        // D'abord par statut (à venir, passé)
        const statusOrder = { 'à_venir': 0, 'passé': 1 };
        if (statusOrder[a.statut] !== statusOrder[b.statut]) {
            return statusOrder[a.statut] - statusOrder[b.statut];
        }
        // Puis par date (plus récent en premier)
        return new Date(b.date) - new Date(a.date);
    });
    
    const depensesHTML = sortedDepenses.map(depense => renderDepenseCard(depense)).join('');
    depensesContainer.innerHTML = `
        <div class="depenses-grid">
            ${depensesHTML}
        </div>
    `;
    
    // Ajouter les gestionnaires d'événements aux boutons générés
    setupDepenseCardEventListeners();
    
    console.log(`✅ ${depenses.length} dépenses rendues`);
}

// Configuration des événements pour les cartes de dépenses
function setupDepenseCardEventListeners() {
    console.log('🔧 Configuration des événements des cartes de dépenses...');
    
    // Boutons Modifier
    const editButtons = document.querySelectorAll('.edit-depense-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const depenseId = parseInt(this.getAttribute('data-depense-id'));
            console.log('✏️ Bouton Modifier cliqué pour la dépense:', depenseId);
            editDepense(depenseId);
        });
    });
    
    // Boutons Supprimer
    const deleteButtons = document.querySelectorAll('.delete-depense-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const depenseId = parseInt(this.getAttribute('data-depense-id'));
            console.log('🗑️ Bouton Supprimer cliqué pour la dépense:', depenseId);
            deleteDepense(depenseId);
        });
    });
    
    // Boutons "Créer depuis modèle"
    const createFromTemplateButtons = document.querySelectorAll('.create-from-template-btn');
    createFromTemplateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const templateId = parseInt(this.getAttribute('data-template-id'));
            console.log('➕ Bouton Créer depuis modèle cliqué:', templateId);
            createFromTemplate(templateId);
        });
    });
    
    // Boutons "Marquer payé"
    const markPaidButtons = document.querySelectorAll('.mark-paid-btn');
    markPaidButtons.forEach(button => {
        button.addEventListener('click', function() {
            const depenseId = parseInt(this.getAttribute('data-depense-id'));
            console.log('✅ Bouton Marquer payé cliqué:', depenseId);
            markDepensePaid(depenseId);
        });
    });
    
    console.log('✅ Événements des cartes de dépenses configurés');
}

// Rendu d'une carte de dépense
function renderDepenseCard(depense) {
    const statutClass = `statut-${depense.statut.replace('_', '_')}`;
    const cardClass = depense.statut.replace('é', 'e').replace('_', '_');
    const statutText = {
        'passé': 'Passé',
        'à_venir': 'À venir'
    }[depense.statut] || 'Inconnu';
    
    // Ajouter la classe récurrente si applicable
    const recurrenteClass = depense.recurrente ? 'recurrente' : '';
    
    // Générer l'affichage des informations de récurrence
    let recurrenceInfo = '';
    if (depense.recurrente) {
        const frequenceText = {
            'hebdomadaire': 'Hebdomadaire',
            'mensuel': 'Mensuel',
            'trimestriel': 'Trimestriel',
            'semestriel': 'Semestriel',
            'annuel': 'Annuel'
        }[depense.frequence] || depense.frequence;
        
        recurrenceInfo = `
            <div class="recurrence-info">
                <span class="recurrence-badge">🔄 ${frequenceText}</span>
                ${depense.prochainePaiement ? `
                    <div class="next-payment">
                        Prochain paiement : ${formatDate(depense.prochainePaiement)}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    return `
        <div class="depense-card ${cardClass} ${recurrenteClass}">
            <div class="depense-content">
                <div class="depense-header">
                    <div class="depense-title">${depense.label}</div>
                    <div class="depense-prix">${depense.prix}€</div>
                </div>
                
                ${depense.description ? `
                    <div class="depense-description">${depense.description}</div>
                ` : ''}
                
                <div class="depense-meta">
                    <div class="depense-date">
                        <i class="fas fa-calendar"></i> ${formatDate(depense.date)}
                    </div>
                    <div>
                        ${depense.categorie ? `<span class="depense-categorie">${depense.categorie}</span>` : ''}
                        <span class="depense-statut ${statutClass}">${statutText}</span>
                    </div>
                </div>
                
                ${recurrenceInfo}
            </div>
            
            <div class="depense-actions">
                <button class="btn btn-warning btn-sm edit-depense-btn" data-depense-id="${depense.idDepense}">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-danger btn-sm delete-depense-btn" data-depense-id="${depense.idDepense}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
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
        year: 'numeric'
    });
}

// Mise à jour des statistiques
function updateDepensesStats() {
    if (!depensesStats) return;
    
    const totalMontant = depenses.reduce((sum, depense) => sum + depense.prix, 0);
    const depensesPassees = depenses.filter(d => d.statut === 'passé').length;
    const depensesAVenir = depenses.filter(d => d.statut === 'à_venir').length;
    
    document.getElementById('totalDepenses').textContent = `${totalMontant.toFixed(2)}€`;
    document.getElementById('depensesPassees').textContent = depensesPassees;
    document.getElementById('depensesAVenir').textContent = depensesAVenir;
}

// Ouverture du modal de dépense
function openDepenseModal(depense = null) {
    console.log('🔓 Ouverture du modal dépense, dépense:', depense);
    
    if (!depenseModal || !depenseModalTitle) {
        console.error('❌ Éléments du modal dépense non trouvés');
        return;
    }
    
    isDepenseEditMode = !!depense;
    currentDepenseId = depense ? depense.idDepense : null;
    
    depenseModalTitle.textContent = isDepenseEditMode ? 'Modifier la Dépense' : 'Nouvelle Dépense';
    depenseModal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    // Remettre le scroll de la modale au début
    const modalBody = depenseModal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
    
    if (depense) {
        populateDepenseForm(depense);
    } else {
        clearDepenseForm();
    }
    
    console.log('✅ Modal dépense ouvert');
}

// Fermeture du modal de dépense
function closeDepenseModalFunc() {
    console.log('🔒 Fermeture du modal dépense');
    
    if (depenseModal) {
        depenseModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        clearDepenseForm();
        isDepenseEditMode = false;
        currentDepenseId = null;
        console.log('✅ Modal dépense fermé');
    }
}

// Remplissage du formulaire de dépense
function populateDepenseForm(depense) {
    console.log('📝 Remplissage du formulaire dépense avec:', depense);
    
    if (labelDepenseInput) labelDepenseInput.value = depense.label || '';
    if (descriptionDepenseInput) descriptionDepenseInput.value = depense.description || '';
    if (prixDepenseInput) prixDepenseInput.value = depense.prix || '';
    if (statutDepenseSelect) statutDepenseSelect.value = depense.statut || '';
    if (dateDepenseInput) dateDepenseInput.value = depense.date ? depense.date.slice(0, 16) : '';
    if (categorieDepenseSelect) categorieDepenseSelect.value = depense.categorie || '';
    if (commentairesDepenseTextarea) commentairesDepenseTextarea.value = depense.commentaires || '';
    
    // Remplir les champs de récurrence
    if (depenseRecurrenteCheckbox) {
        depenseRecurrenteCheckbox.checked = depense.recurrente || false;
        
        if (depense.recurrente && recurrenceOptionsDiv) {
            recurrenceOptionsDiv.style.display = 'block';
            
            if (depenseFrequenceSelect) {
                depenseFrequenceSelect.value = depense.frequence || '';
            }
            
            if (depenseProchainePaiementInput && depense.prochainePaiement) {
                depenseProchainePaiementInput.value = depense.prochainePaiement.slice(0, 16);
            }
        } else if (recurrenceOptionsDiv) {
            recurrenceOptionsDiv.style.display = 'none';
        }
    }
}

// Nettoyage du formulaire de dépense
function clearDepenseForm() {
    console.log('🧹 Nettoyage du formulaire dépense');
    
    if (depenseForm) depenseForm.reset();
    if (commentairesDepenseTextarea) commentairesDepenseTextarea.value = '';
    
    // Réinitialiser les champs de récurrence
    if (depenseRecurrenteCheckbox) {
        depenseRecurrenteCheckbox.checked = false;
    }
    
    if (recurrenceOptionsDiv) {
        recurrenceOptionsDiv.style.display = 'none';
    }
}

// Gestion de la soumission du formulaire de dépense
async function handleDepenseFormSubmit() {
    console.log('📝 Traitement du formulaire dépense...');
    
    const formData = getDepenseFormData();
    
    if (!formData.label.trim() || !formData.prix || !formData.statut || !formData.date) {
        showMessage('Le label, le prix, le statut et la date sont obligatoires', 'error');
        return;
    }
    
    console.log('📊 Données du formulaire dépense:', formData);
    await saveDepense(formData);
}

// Récupération des données du formulaire de dépense
function getDepenseFormData() {
    console.log('🔍 Récupération des données du formulaire dépense...');
    
    const isRecurrente = depenseRecurrenteCheckbox ? depenseRecurrenteCheckbox.checked : false;
    
    const formData = {
        label: labelDepenseInput ? labelDepenseInput.value.trim() : '',
        description: descriptionDepenseInput ? descriptionDepenseInput.value.trim() : '',
        prix: prixDepenseInput ? parseFloat(prixDepenseInput.value) : 0,
        statut: statutDepenseSelect ? statutDepenseSelect.value : '',
        date: dateDepenseInput && dateDepenseInput.value ? new Date(dateDepenseInput.value).toISOString() : null,
        categorie: categorieDepenseSelect ? categorieDepenseSelect.value : '',
        commentaires: commentairesDepenseTextarea ? commentairesDepenseTextarea.value.trim() : '',
        recurrente: isRecurrente,
        frequence: isRecurrente ? (depenseFrequenceSelect ? depenseFrequenceSelect.value : null) : null,
        prochainePaiement: isRecurrente ? (depenseProchainePaiementInput && depenseProchainePaiementInput.value ? new Date(depenseProchainePaiementInput.value).toISOString() : null) : null,
        depenseParente: null
    };
    
    console.log('📊 Données complètes du formulaire dépense:', formData);
    return formData;
}

// Sauvegarde d'une dépense
async function saveDepense(depenseData) {
    console.log('💾 Sauvegarde de la dépense:', depenseData);
    console.log('🔍 Validation des données:');
    console.log('  - Label:', depenseData.label);
    console.log('  - Prix:', depenseData.prix);
    console.log('  - Statut:', depenseData.statut);
    console.log('  - Date:', depenseData.date);
    console.log('  - Récurrente:', depenseData.recurrente);
    console.log('  - Fréquence:', depenseData.frequence);
    console.log('  - Prochain paiement:', depenseData.prochainePaiement);
    
    try {
        const url = isDepenseEditMode ? `/api/depenses/${currentDepenseId}` : '/api/depenses';
        const method = isDepenseEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(depenseData)
        });
        
        if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
        
        const result = await response.json();
        showMessage(
            isDepenseEditMode ? 'Dépense modifiée avec succès!' : 'Dépense ajoutée avec succès!', 
            'success'
        );
        
        await loadDepenses();
        closeDepenseModalFunc();
        return result;
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        showMessage('Erreur lors de la sauvegarde', 'error');
        throw error;
    }
}

// Suppression d'une dépense
async function deleteDepense(depenseId) {
    console.log('🗑️ Suppression de la dépense:', depenseId);
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;
    
    try {
        const response = await fetch(`/api/depenses/${depenseId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        
        showMessage('Dépense supprimée avec succès!', 'success');
        await loadDepenses();
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showMessage('Erreur lors de la suppression', 'error');
    }
}

// Édition d'une dépense
function editDepense(depenseId) {
    console.log('✏️ Édition de la dépense:', depenseId);
    
    const depense = depenses.find(d => d.idDepense === depenseId);
    if (depense) {
        openDepenseModal(depense);
    } else {
        console.error('❌ Dépense non trouvée:', depenseId);
    }
}

// Filtrage des dépenses
function filterDepenses(searchTerm) {
    console.log('🔍 Filtrage des dépenses:', searchTerm);
    
    if (!depensesContainer) return;
    
    const searchLower = searchTerm.toLowerCase();
    const filteredDepenses = depenses.filter(depense => 
        depense.label.toLowerCase().includes(searchLower) ||
        depense.description.toLowerCase().includes(searchLower) ||
        (depense.categorie && depense.categorie.toLowerCase().includes(searchLower))
    );
    
    if (filteredDepenses.length === 0) {
        depensesContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-search"></i> Aucune dépense trouvée pour "${searchTerm}"
            </div>
        `;
        return;
    }
    
    const depensesHTML = filteredDepenses.map(depense => renderDepenseCard(depense)).join('');
    depensesContainer.innerHTML = `
        <div class="depenses-grid">
            ${depensesHTML}
        </div>
    `;
    
    // Reconfigurer les événements après le filtrage
    setupDepenseCardEventListeners();
}

// Actualisation des dépenses
async function refreshDepenses() {
    console.log('🔄 Actualisation des dépenses...');
    await loadDepenses();
    showMessage('Liste des dépenses actualisée!', 'success');
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

// Créer une dépense depuis un modèle
function createFromTemplate(templateId) {
    console.log('➕ Création d\'une dépense depuis le modèle:', templateId);
    
    const template = depenses.find(d => d.idDepense === templateId);
    if (!template) {
        console.error('❌ Modèle non trouvé:', templateId);
        showMessage('Modèle non trouvé', 'error');
        return;
    }
    
    // Créer une nouvelle dépense basée sur le modèle
    const newDepense = {
        ...template,
        idDepense: null, // Nouvel ID sera généré
        statut: 'à_venir',
        date: new Date().toISOString(),
        recurrente: false, // La nouvelle dépense n'est pas récurrente par défaut
        frequence: null,
        prochainePaiement: null,
        depenseParente: templateId
    };
    
    // Ouvrir le modal avec les données pré-remplies
    openDepenseModal(newDepense);
    showMessage('Modèle chargé dans le formulaire', 'success');
}

// Marquer une dépense comme payée
async function markDepensePaid(depenseId) {
    console.log('✅ Marquage de la dépense comme payée:', depenseId);
    
    const depense = depenses.find(d => d.idDepense === depenseId);
    if (!depense) {
        console.error('❌ Dépense non trouvée:', depenseId);
        return;
    }
    
    if (!confirm(`Marquer "${depense.label}" comme payée ?`)) return;
    
    try {
        // Mettre à jour le statut
        const updatedDepense = {
            ...depense,
            statut: 'passé',
            date: new Date().toISOString() // Date de paiement = maintenant
        };
        
        const response = await fetch(`/api/depenses/${depenseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedDepense)
        });
        
        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
        
        showMessage('Dépense marquée comme payée!', 'success');
        await loadDepenses();
        
        // Si c'est une dépense récurrente, créer la prochaine occurrence
        if (depense.recurrente && depense.frequence && depense.prochainePaiement) {
            await createNextRecurrence(depense);
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du marquage:', error);
        showMessage('Erreur lors du marquage', 'error');
    }
}

// Créer la prochaine occurrence d'une dépense récurrente
async function createNextRecurrence(depense) {
    console.log('🔄 Création de la prochaine occurrence récurrente:', depense.idDepense);
    
    const nextDate = calculateNextDate(depense.prochainePaiement, depense.frequence);
    const futureDate = calculateNextDate(nextDate, depense.frequence);
    
    const nextDepense = {
        label: depense.label,
        description: depense.description,
        prix: depense.prix,
        statut: 'à_venir',
        date: nextDate,
        categorie: depense.categorie,
        commentaires: depense.commentaires,
        recurrente: true,
        frequence: depense.frequence,
        prochainePaiement: futureDate,
        depenseParente: depense.idDepense
    };
    
    try {
        const response = await fetch('/api/depenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(nextDepense)
        });
        
        if (!response.ok) throw new Error('Erreur lors de la création de la récurrence');
        
        console.log('✅ Prochaine occurrence créée');
        showMessage('Prochaine occurrence créée automatiquement', 'success');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création de la récurrence:', error);
        showMessage('Erreur lors de la création de la récurrence', 'error');
    }
}

// Calculer la prochaine date selon la fréquence
function calculateNextDate(currentDate, frequence) {
    const date = new Date(currentDate);
    
    switch (frequence) {
        case 'hebdomadaire':
            date.setDate(date.getDate() + 7);
            break;
        case 'mensuel':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'trimestriel':
            date.setMonth(date.getMonth() + 3);
            break;
        case 'semestriel':
            date.setMonth(date.getMonth() + 6);
            break;
        case 'annuel':
            date.setFullYear(date.getFullYear() + 1);
            break;
        default:
            date.setMonth(date.getMonth() + 1); // Par défaut mensuel
    }
    
    return date.toISOString();
}

// Fonctions pour les templates récurrents
function renderTemplateCard(template) {
    const statusClass = template.actif ? 'status-actif' : 'status-inactif';
    const statusText = template.actif ? 'Actif' : 'Inactif';
    
    const prochainePaiement = template.prochainePaiement ? new Date(template.prochainePaiement).toLocaleDateString('fr-FR') : 'Non définie';
    const dateExpiration = template.dateExpiration ? new Date(template.dateExpiration).toLocaleDateString('fr-FR') : 'Jamais';
    
    const frequenceText = {
        'mensuel': 'Mensuel',
        'annuel': 'Annuel',
        'hebdomadaire': 'Hebdomadaire',
        'trimestriel': 'Trimestriel'
    }[template.frequence] || template.frequence;
    
    return `
        <div class="depense-card template-card ${statusClass}">
            <div class="depense-content">
                <div class="depense-header">
                    <div class="depense-title">${template.label}</div>
                    <div class="depense-price">${template.prix}€</div>
                </div>
                
                <div class="depense-description">${template.description}</div>
                
                <div class="template-info">
                    <div class="info-row">
                        <span class="info-label">Fréquence:</span>
                        <span class="info-value">${frequenceText}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Prochain paiement:</span>
                        <span class="info-value">${prochainePaiement}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Expiration:</span>
                        <span class="info-value">${dateExpiration}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Statut:</span>
                        <span class="info-value ${statusClass}">${statusText}</span>
                    </div>
                </div>
            </div>
            
            <div class="depense-actions">
                <button class="btn btn-warning btn-sm edit-template-btn" data-template-id="${template.idTemplate}">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn ${template.actif ? 'btn-secondary' : 'btn-success'} btn-sm toggle-template-btn" data-template-id="${template.idTemplate}">
                    <i class="fas fa-${template.actif ? 'pause' : 'play'}"></i> ${template.actif ? 'Désactiver' : 'Activer'}
                </button>
                <button class="btn btn-danger btn-sm delete-template-btn" data-template-id="${template.idTemplate}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `;
}

function setupTemplateEventListeners() {
    console.log('🔧 Configuration des événements des templates...');
    
    // Boutons Modifier
    const editButtons = document.querySelectorAll('.edit-template-btn');
    console.log(`📝 Boutons Modifier trouvés: ${editButtons.length}`);
    editButtons.forEach((button, index) => {
        const templateId = button.getAttribute('data-template-id');
        console.log(`🔘 Bouton ${index + 1}: template ID ${templateId}`);
        button.addEventListener('click', function() {
            const templateId = parseInt(this.getAttribute('data-template-id'));
            console.log('🖱️ Clic sur bouton Modifier, template ID:', templateId);
            editTemplate(templateId);
        });
    });
    
    // Boutons Activer/Désactiver
    const toggleButtons = document.querySelectorAll('.toggle-template-btn');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const templateId = parseInt(this.getAttribute('data-template-id'));
            toggleTemplate(templateId);
        });
    });
    
    // Boutons Supprimer
    const deleteButtons = document.querySelectorAll('.delete-template-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const templateId = parseInt(this.getAttribute('data-template-id'));
            deleteTemplate(templateId);
        });
    });
}



function openTemplateModal(template = null) {
    console.log('🔓 openTemplateModal appelée avec template:', template);
    
    // Créer le modal HTML s'il n'existe pas
    let modal = document.getElementById('templateModal');
    if (!modal) {
        console.log('📝 Création du modal template...');
        modal = document.createElement('div');
        modal.id = 'templateModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="templateModalTitle">Nouveau Modèle Récurrent</h2>
                    <span class="close" id="closeTemplateModalBtn">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="templateForm">
                        <div class="form-group">
                            <label for="templateLabel">Nom du modèle *</label>
                            <input type="text" id="templateLabel" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="templateDescription">Description</label>
                            <textarea id="templateDescription" class="form-input" rows="3"></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="templatePrix">Prix *</label>
                                <input type="number" id="templatePrix" class="form-input" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label for="templateCategorie">Catégorie</label>
                                <select id="templateCategorie" class="form-input">
                                    <option value="serveur">Serveur</option>
                                    <option value="outils">Outils</option>
                                    <option value="publicite">Publicité</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="templateFrequence">Fréquence *</label>
                                <select id="templateFrequence" class="form-input" required>
                                    <option value="mensuel">Mensuel</option>
                                    <option value="annuel">Annuel</option>
                                    <option value="hebdomadaire">Hebdomadaire</option>
                                    <option value="trimestriel">Trimestriel</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="templateProchainePaiement">Prochain paiement *</label>
                                <input type="datetime-local" id="templateProchainePaiement" class="form-input" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="templateDateExpiration">Date d'expiration (optionnel)</label>
                            <input type="datetime-local" id="templateDateExpiration" class="form-input">
                            <small>Laissez vide pour un modèle sans expiration</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="templateCommentaires">Commentaire</label>
                            <textarea id="templateCommentaires" class="form-input" rows="2"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelTemplateBtn">Annuler</button>
                    <button type="submit" form="templateForm" class="btn btn-primary">Sauvegarder</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Ajouter les événements du modal
        document.getElementById('templateForm').addEventListener('submit', handleTemplateFormSubmit);
    }
    
    // Toujours réattacher les événements (au cas où ils seraient perdus)
    const closeBtn = document.getElementById('closeTemplateModalBtn');
    const cancelBtn = document.getElementById('cancelTemplateBtn');
    
    if (closeBtn) {
        // Supprimer les anciens listeners pour éviter les doublons
        closeBtn.replaceWith(closeBtn.cloneNode(true));
        document.getElementById('closeTemplateModalBtn').addEventListener('click', function() {
            console.log('🔒 Bouton fermer (X) cliqué');
            closeTemplateModal();
        });
    }
    
    if (cancelBtn) {
        // Supprimer les anciens listeners pour éviter les doublons
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        document.getElementById('cancelTemplateBtn').addEventListener('click', function() {
            console.log('❌ Bouton Annuler cliqué');
            closeTemplateModal();
        });
    }
    
    // Fermeture en cliquant à l'extérieur
    modal.onclick = function(e) {
        if (e.target === modal) {
            console.log('🔒 Clic extérieur - fermeture modal');
            closeTemplateModal();
        }
    };
    
    isTemplateEditMode = !!template;
    currentTemplateId = template ? template.idTemplate : null;
    
    document.getElementById('templateModalTitle').textContent = 
        isTemplateEditMode ? 'Modifier le Modèle Récurrent' : 'Nouveau Modèle Récurrent';
    
    // Attendre que le DOM soit prêt avant de remplir le formulaire
    setTimeout(() => {
        if (template) {
            populateTemplateForm(template);
        } else {
            clearTemplateForm();
        }
    }, 100);
    
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

function closeTemplateModal() {
    console.log('🔒 closeTemplateModal appelée');
    const modal = document.getElementById('templateModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        clearTemplateForm();
        isTemplateEditMode = false;
        currentTemplateId = null;
        console.log('✅ Modal fermée avec succès');
    } else {
        console.error('❌ Modal non trouvée pour fermeture');
    }
}

function populateTemplateForm(template) {
    const labelInput = document.getElementById('templateLabel');
    const descriptionInput = document.getElementById('templateDescription');
    const prixInput = document.getElementById('templatePrix');
    const categorieSelect = document.getElementById('templateCategorie');
    const frequenceSelect = document.getElementById('templateFrequence');
    const prochainePaiementInput = document.getElementById('templateProchainePaiement');
    const dateExpirationInput = document.getElementById('templateDateExpiration');
    
    if (labelInput) labelInput.value = template.label || '';
    if (descriptionInput) descriptionInput.value = template.description || '';
    if (prixInput) prixInput.value = template.prix || '';
    if (categorieSelect) categorieSelect.value = template.categorie || 'autre';
    if (frequenceSelect) frequenceSelect.value = template.frequence || 'mensuel';
    
    if (template.prochainePaiement && prochainePaiementInput) {
        const date = new Date(template.prochainePaiement);
        prochainePaiementInput.value = date.toISOString().slice(0, 16);
    }
    
    if (template.dateExpiration && dateExpirationInput) {
        const date = new Date(template.dateExpiration);
        dateExpirationInput.value = date.toISOString().slice(0, 16);
    }
}

function clearTemplateForm() {
    const form = document.getElementById('templateForm');
    if (form) {
        form.reset();
    }
}

async function handleTemplateFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        label: document.getElementById('templateLabel').value.trim(),
        description: document.getElementById('templateDescription').value.trim(),
        prix: parseFloat(document.getElementById('templatePrix').value),
        categorie: document.getElementById('templateCategorie').value,
        frequence: document.getElementById('templateFrequence').value,
        prochainePaiement: document.getElementById('templateProchainePaiement').value,
        dateExpiration: document.getElementById('templateDateExpiration').value || null,
        commentaires: document.getElementById('templateCommentaires').value.trim()
    };
    
    if (!formData.label || !formData.prix || !formData.frequence || !formData.prochainePaiement) {
        showMessage('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    try {
        const url = isTemplateEditMode ? `/api/templates/${currentTemplateId}` : '/api/templates';
        const method = isTemplateEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
        
        const result = await response.json();
        showMessage(
            isTemplateEditMode ? 'Modèle mis à jour avec succès!' : 'Modèle créé avec succès!', 
            'success'
        );
        
        closeTemplateModal();
        await loadTemplatesRecurrents();
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du template:', error);
        showMessage('Erreur lors de la sauvegarde', 'error');
    }
}

function editTemplate(templateId) {
    console.log('✏️ editTemplate appelée avec ID:', templateId);
    const template = templates.find(t => t.idTemplate === templateId);
    console.log('📋 Template trouvé:', template);
    if (template) {
        openTemplateModal(template);
    } else {
        console.error('❌ Template non trouvé pour ID:', templateId);
    }
}

async function toggleTemplate(templateId) {
    const template = templates.find(t => t.idTemplate === templateId);
    if (!template) return;
    
    try {
        const response = await fetch(`/api/templates/${templateId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                label: template.label,
                description: template.description,
                prix: template.prix,
                devise: template.devise,
                categorie: template.categorie,
                frequence: template.frequence,
                prochainePaiement: template.prochainePaiement,
                dateExpiration: template.dateExpiration,
                actif: !template.actif
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Erreur API:', errorData);
            throw new Error(errorData.error || 'Erreur lors de la mise à jour');
        }
        
        showMessage(
            template.actif ? 'Modèle désactivé' : 'Modèle activé', 
            'success'
        );
        
        await loadTemplatesRecurrents();
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du template:', error);
        showMessage('Erreur lors de la mise à jour', 'error');
    }
}

async function deleteTemplate(templateId) {
    const template = templates.find(t => t.idTemplate === templateId);
    if (!template) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le modèle "${template.label}" ?`)) return;
    
    try {
        const response = await fetch(`/api/templates/${templateId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        
        showMessage('Modèle supprimé avec succès!', 'success');
        await loadTemplatesRecurrents();
    } catch (error) {
        console.error('❌ Erreur lors de la suppression du template:', error);
        showMessage('Erreur lors de la suppression', 'error');
    }
}

async function generateRecurringExpenses() {
    try {
        const response = await fetch('/api/templates/generate', {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la génération');
        
        const result = await response.json();
        showMessage('Génération des dépenses récurrentes terminée!', 'success');
        
        // Recharger les dépenses pour voir les nouvelles
        await loadDepenses();
    } catch (error) {
        console.error('❌ Erreur lors de la génération:', error);
        showMessage('Erreur lors de la génération des dépenses récurrentes', 'error');
    }
}

// Rendre les fonctions accessibles globalement
window.closeTemplateModal = closeTemplateModal;
window.openTemplateModal = openTemplateModal;

console.log('✅ TeamApp V1 - Initialisation des dépenses terminée !');
