# TeamApp V1 - Interface CRUD pour la Gestion des Agents

## 🚀 Vue d'ensemble

Cette application web moderne permet de gérer complètement votre équipe avec une interface utilisateur intuitive et des fonctionnalités CRUD complètes. Elle utilise TypeScript, Node.js et stocke les données dans des fichiers JSON.

## ✨ Fonctionnalités

### 🔧 Opérations CRUD Complètes
- **Create** : Ajouter de nouveaux agents
- **Read** : Consulter la liste des agents avec recherche
- **Update** : Modifier les informations des agents existants
- **Delete** : Supprimer des agents

### 🎨 Interface Moderne
- Design responsive et moderne
- Cartes d'agents avec statuts visuels
- Modal d'édition/ajout
- Recherche en temps réel
- Notifications de succès/erreur

### 📊 Gestion des Agents
- Pseudo et ID Discord
- Rôles multiples (Apprenti, Manager, Admin)
- Statut actif/inactif
- Commentaires avec horodatage
- Gestion des permissions

## 🛠️ Technologies Utilisées

- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Backend** : Node.js avec Express
- **TypeScript** : Support complet avec types stricts
- **Stockage** : Fichiers JSON
- **Sécurité** : Helmet, CORS, validation des données

## 📁 Structure du Projet

```
TeamAppV1/
├── public/
│   ├── index.html          # Interface principale
│   └── js/
│       └── app.js          # Logique frontend
├── server.js               # Serveur Node.js (CommonJS)
├── server.ts               # Serveur TypeScript
├── agents.json             # Données des agents
├── package.json            # Dépendances
└── README-CRUD.md          # Ce fichier
```

## 🚀 Installation et Démarrage

### 1. Installation des dépendances
```bash
npm install
```

### 2. Démarrage du serveur
```bash
# Version JavaScript
npm start

# Version TypeScript (avec nodemon)
npm run dev

# Version TypeScript compilée
npm run build && npm start
```

### 3. Accès à l'application
- **Interface** : http://localhost:3000
- **API** : http://localhost:3000/api/agents

## 🔌 API REST

### Endpoints disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/agents` | Récupérer tous les agents |
| `GET` | `/api/agents/:id` | Récupérer un agent par ID |
| `POST` | `/api/agents` | Créer un nouvel agent |
| `PUT` | `/api/agents/:id` | Mettre à jour un agent |
| `PATCH` | `/api/agents/:id` | Mise à jour partielle |
| `DELETE` | `/api/agents/:id` | Supprimer un agent |

### Exemple de création d'agent
```json
POST /api/agents
{
  "pseudo": "NouvelAgent",
  "discordAgent": "123456789012345678",
  "role": ["apprentice", "manager"],
  "actif": true,
  "comments": "Agent prometteur"
}
```

## 💻 Utilisation de l'Interface

### 1. Ajouter un Agent
- Cliquer sur "Nouvel Agent"
- Remplir le formulaire (pseudo obligatoire)
- Sélectionner les rôles
- Sauvegarder

### 2. Modifier un Agent
- Cliquer sur "Modifier" sur une carte d'agent
- Modifier les informations
- Sauvegarder les changements

### 3. Gérer le Statut
- Utiliser le bouton Activer/Désactiver
- Changement immédiat du statut

### 4. Rechercher des Agents
- Utiliser la barre de recherche
- Recherche en temps réel par pseudo, Discord ou rôle

### 5. Supprimer un Agent
- Cliquer sur "Supprimer"
- Confirmer la suppression

## 🔒 Sécurité et Validation

- **Validation des données** : Vérification des champs obligatoires
- **Sanitisation** : Nettoyage des entrées utilisateur
- **Gestion d'erreurs** : Messages d'erreur informatifs
- **CSP** : Content Security Policy configuré
- **CORS** : Configuration sécurisée

## 📱 Responsive Design

L'interface s'adapte automatiquement à tous les écrans :
- **Desktop** : Grille multi-colonnes
- **Tablet** : Grille adaptative
- **Mobile** : Affichage en colonne unique

## 🎯 Fonctionnalités Avancées

### Gestion des Rôles
- Rôles multiples par agent
- Tags visuels pour chaque rôle
- Filtrage par rôle

### Système de Commentaires
- Commentaires horodatés
- Historique des évaluations
- Interface intuitive

### Statuts Visuels
- Indicateurs de statut actif/inactif
- Couleurs distinctives
- Badges de statut

## 🚧 Développement

### Scripts disponibles
```bash
npm run dev          # Démarrage avec nodemon (TypeScript)
npm run build        # Compilation TypeScript
npm run start        # Démarrage du serveur compilé
npm run dev:local    # Version locale avec base de données locale
```

### Structure TypeScript
- Types stricts pour les agents
- Interfaces pour les formulaires
- Gestion d'erreurs typée

## 🔮 Évolutions Futures

- [ ] Base de données MongoDB/PostgreSQL
- [ ] Authentification utilisateur
- [ ] Gestion des permissions avancées
- [ ] Statistiques et rapports
- [ ] Intégration Discord en temps réel
- [ ] API GraphQL
- [ ] Tests automatisés

## 🐛 Dépannage

### Problèmes courants

1. **Port déjà utilisé**
   ```bash
   # Changer le port dans server.js
   const PORT = process.env.PORT || 3001;
   ```

2. **Erreur de lecture du fichier JSON**
   - Vérifier que `agents.json` existe
   - Vérifier les permissions du fichier

3. **CORS errors**
   - Vérifier la configuration CORS dans server.js
   - Ajouter les domaines autorisés si nécessaire

## 📞 Support

Pour toute question ou problème :
- Vérifier les logs du serveur
- Consulter la console du navigateur
- Vérifier la validité du fichier JSON

---

**TeamApp V1** - Gestion d'équipe moderne et intuitive 🚀
