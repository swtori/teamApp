// TeamApp V1 - Navigation entre onglets
// Version ultra-simple et robuste

console.log('🧭 TeamApp V1 - Initialisation de la navigation...');

// Fonction pour afficher l'onglet agents - VERSION CORRIGÉE
function showAgentsTab() {
    console.log('🔄 AFFICHAGE ONGLET AGENTS - VERSION CORRIGÉE');
    
    // 1. Changer les boutons
    document.getElementById('agentsTabBtn').classList.add('active');
    document.getElementById('commissionsTabBtn').classList.remove('active');
    document.getElementById('depensesTabBtn').classList.remove('active');
    
    // 2. Utiliser les classes CSS au lieu de style.display
    document.getElementById('agents-tab').classList.add('active');
    document.getElementById('commissions-tab').classList.remove('active');
    document.getElementById('depenses-tab').classList.remove('active');
    
    console.log('✅ ONGLET AGENTS AFFICHÉ !');
}

// Fonction pour afficher l'onglet commissions - VERSION CORRIGÉE
function showCommissionsTab() {
    console.log('🔄 AFFICHAGE ONGLET COMMISSIONS - VERSION CORRIGÉE');
    
    // 1. Changer les boutons
    document.getElementById('agentsTabBtn').classList.remove('active');
    document.getElementById('commissionsTabBtn').classList.add('active');
    document.getElementById('depensesTabBtn').classList.remove('active');
    
    // 2. Utiliser les classes CSS au lieu de style.display
    document.getElementById('agents-tab').classList.remove('active');
    document.getElementById('commissions-tab').classList.add('active');
    document.getElementById('depenses-tab').classList.remove('active');
    
    // 3. Charger les commissions - attendre que la fonction soit disponible
    setTimeout(() => {
        console.log('🔍 Recherche de la fonction loadCommissions...');
        console.log('window.loadCommissions:', typeof window.loadCommissions);
        console.log('loadCommissions (global):', typeof loadCommissions);
        
        if (typeof window.loadCommissions === 'function') {
            console.log('💰 Chargement des commissions via window.loadCommissions...');
            window.loadCommissions();
        } else {
            console.log('⚠️ window.loadCommissions non trouvée - chargement manuel des commissions...');
            // Chargement manuel des commissions
            fetch('/api/commissions')
                .then(response => {
                    if (!response.ok) throw new Error('Erreur lors du chargement');
                    return response.json();
                })
                .then(data => {
                    console.log('✅ Commissions chargées manuellement:', data);
                    
                    // Afficher les commissions dans le container
                    const commissionsContainer = document.getElementById('commissions-container');
                    if (commissionsContainer && data.commissions) {
                        if (data.commissions.length === 0) {
                            commissionsContainer.innerHTML = `
                                <div class="loading">
                                    <i class="fas fa-briefcase"></i> Aucune commission trouvée
                                </div>
                            `;
                        } else {
                            // Affichage basique des commissions
                            const commissionsHTML = data.commissions.map(commission => `
                                <div class="commission-card" style="background: white; padding: 1rem; margin: 1rem 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                    <h3>${commission.nomProjet}</h3>
                                    <p><strong>Client:</strong> ${commission.nomClient}</p>
                                    <p><strong>Prix:</strong> ${commission.prix}€</p>
                                    <p><strong>Statut:</strong> ${commission.statut}</p>
                                    ${commission.description ? `<p><strong>Description:</strong> ${commission.description}</p>` : ''}
                                </div>
                            `).join('');
                            
                            commissionsContainer.innerHTML = `
                                <div class="commissions-grid">
                                    ${commissionsHTML}
                                </div>
                            `;
                            console.log(`✅ ${data.commissions.length} commissions affichées manuellement`);
                        }
                    } else {
                        console.error('❌ Container commissions non trouvé ou données manquantes');
                    }
                })
                .catch(error => {
                    console.error('❌ Erreur chargement manuel des commissions:', error);
                    const commissionsContainer = document.getElementById('commissions-container');
                    if (commissionsContainer) {
                        commissionsContainer.innerHTML = `
                            <div class="loading" style="color: red;">
                                <i class="fas fa-exclamation-triangle"></i> Erreur lors du chargement des commissions
                            </div>
                        `;
                    }
                });
        }
    }, 200); // Augmenté le délai pour s'assurer que tous les scripts sont chargés
    
    console.log('✅ ONGLET COMMISSIONS AFFICHÉ !');
}

// Fonction pour afficher l'onglet dépenses - VERSION CORRIGÉE
function showDepensesTab() {
    console.log('🔄 AFFICHAGE ONGLET DÉPENSES - VERSION CORRIGÉE');
    
    // 1. Changer les boutons
    document.getElementById('agentsTabBtn').classList.remove('active');
    document.getElementById('commissionsTabBtn').classList.remove('active');
    document.getElementById('depensesTabBtn').classList.add('active');
    
    // 2. Utiliser les classes CSS au lieu de style.display
    document.getElementById('agents-tab').classList.remove('active');
    document.getElementById('commissions-tab').classList.remove('active');
    document.getElementById('depenses-tab').classList.add('active');
    
    // 3. Charger les dépenses - attendre que la fonction soit disponible
    setTimeout(() => {
        console.log('🔍 Recherche de la fonction loadDepenses...');
        console.log('window.loadDepenses:', typeof window.loadDepenses);
        
        if (typeof window.loadDepenses === 'function') {
            console.log('💰 Chargement des dépenses via window.loadDepenses...');
            window.loadDepenses();
        } else {
            console.log('⚠️ window.loadDepenses non trouvée - chargement manuel des dépenses...');
            // Chargement manuel des dépenses
            fetch('/api/depenses')
                .then(response => {
                    if (!response.ok) throw new Error('Erreur lors du chargement');
                    return response.json();
                })
                .then(data => {
                    console.log('✅ Dépenses chargées manuellement:', data);
                    
                    // Afficher les dépenses dans le container
                    const depensesContainer = document.getElementById('depenses-container');
                    if (depensesContainer && data.depenses) {
                        if (data.depenses.length === 0) {
                            depensesContainer.innerHTML = `
                                <div class="loading">
                                    <i class="fas fa-receipt"></i> Aucune dépense trouvée
                                </div>
                            `;
                        } else {
                            // Affichage basique des dépenses
                            const depensesHTML = data.depenses.map(depense => `
                                <div class="depense-card ${depense.statut.replace('é', 'e').replace('_', '_')}">
                                    <div class="depense-content">
                                        <h3>${depense.label}</h3>
                                        <p><strong>Description:</strong> ${depense.description || 'Aucune description'}</p>
                                        <p><strong>Prix:</strong> ${depense.prix}€</p>
                                        <p><strong>Statut:</strong> ${depense.statut}</p>
                                        <p><strong>Catégorie:</strong> ${depense.categorie || 'Aucune'}</p>
                                        <p><strong>Date:</strong> ${new Date(depense.date).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                            `).join('');
                            
                            depensesContainer.innerHTML = `
                                <div class="depenses-grid">
                                    ${depensesHTML}
                                </div>
                            `;
                            console.log(`✅ ${data.depenses.length} dépenses affichées manuellement`);
                        }
                    } else {
                        console.error('❌ Container dépenses non trouvé ou données manquantes');
                    }
                })
                .catch(error => {
                    console.error('❌ Erreur chargement manuel des dépenses:', error);
                    const depensesContainer = document.getElementById('depenses-container');
                    if (depensesContainer) {
                        depensesContainer.innerHTML = `
                            <div class="loading" style="color: red;">
                                <i class="fas fa-exclamation-triangle"></i> Erreur lors du chargement des dépenses
                            </div>
                        `;
                    }
                });
        }
    }, 200);
    
    console.log('✅ ONGLET DÉPENSES AFFICHÉ !');
}

// Rendre les fonctions accessibles globalement
window.showAgentsTab = showAgentsTab;
window.showCommissionsTab = showCommissionsTab;
window.showDepensesTab = showDepensesTab;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 INITIALISATION NAVIGATION SIMPLE...');
    
    // S'assurer que l'onglet agents est visible par défaut avec les classes CSS
    document.getElementById('agents-tab').classList.add('active');
    document.getElementById('commissions-tab').classList.remove('active');
    document.getElementById('depenses-tab').classList.remove('active');
    
    // Vérifier que les boutons existent
    const agentsBtn = document.getElementById('agentsTabBtn');
    const commissionsBtn = document.getElementById('commissionsTabBtn');
    const depensesBtn = document.getElementById('depensesTabBtn');
    
    if (agentsBtn && commissionsBtn && depensesBtn) {
        console.log('✅ Boutons de navigation trouvés');
        
        // Supprimer les anciens événements s'ils existent
        agentsBtn.removeEventListener('click', showAgentsTab);
        commissionsBtn.removeEventListener('click', showCommissionsTab);
        depensesBtn.removeEventListener('click', showDepensesTab);
        
        // Ajouter les nouveaux événements de clic
        agentsBtn.addEventListener('click', showAgentsTab);
        commissionsBtn.addEventListener('click', showCommissionsTab);
        depensesBtn.addEventListener('click', showDepensesTab);
        
        console.log('✅ Événements de clic ajoutés aux boutons');
        
        // Test immédiat des boutons
        console.log('🧪 Test des boutons:');
        console.log('- Bouton Agents:', agentsBtn.id, agentsBtn.textContent.trim());
        console.log('- Bouton Commissions:', commissionsBtn.id, commissionsBtn.textContent.trim());
        console.log('- Bouton Dépenses:', depensesBtn.id, depensesBtn.textContent.trim());
    } else {
        console.error('❌ Boutons de navigation non trouvés');
        console.log('Éléments trouvés:', {
            agentsBtn: document.getElementById('agentsTabBtn'),
            commissionsBtn: document.getElementById('commissionsTabBtn'),
            depensesBtn: document.getElementById('depensesTabBtn')
        });
    }
    
    console.log('✅ NAVIGATION SIMPLE INITIALISÉE !');
});

// Test des fonctions
console.log('🧪 Test des fonctions de navigation:');
console.log('showAgentsTab:', typeof showAgentsTab);
console.log('showCommissionsTab:', typeof showCommissionsTab);
console.log('showDepensesTab:', typeof showDepensesTab);

console.log('✅ TeamApp V1 - Initialisation de la navigation terminée !');
