# TeamApp V2 - Gestion d'Équipe Complète 🚀

Application complète de gestion d'équipe avec suivi des performances, statistiques avancées et intégration Discord.

## 🎯 Fonctionnalités Principales

### 📊 **Dashboard & Statistiques**
- Vue d'ensemble temps réel de votre équipe
- Statistiques financières détaillées (revenus, dépenses, bénéfices)
- Comparaison des performances entre agents
- Graphiques et métriques visuelles
- Filtrage par période (jour, semaine, mois, 3-6 mois, année)

### 👥 **Gestion des Agents**
- Profils complets avec historique d'activité
- Suivi des connexions et temps de travail
- Système de notes et évaluations
- Gestion des rôles (apprentice, builder, senior, admin)
- Alertes pour agents inactifs
- Whitelist et gestion des permissions

### 💼 **Gestion des Commissions**
- Suivi complet des projets
- Attribution automatique des gains et taxes
- Historique des actions
- Gestion des échéances
- Upload de fichiers (renders, documents)
- Statuts en temps réel

### 💰 **Comptabilité Avancée**
- Suivi des revenus par période
- Gestion des dépenses (serveur, renders, publicité)
- Calcul automatique des bénéfices
- Top clients et analyses
- Export des données financières

### 🔄 **Suivi Temps Réel**
- WebSocket pour les mises à jour instantanées
- Statuts d'activité des agents
- Sessions de travail trackées
- Notifications en temps réel

### 🤖 **Intégration Discord** (À venir)
- Synchronisation des membres
- Récupération des rôles Discord
- Suivi de l'activité vocale
- Commandes bot intégrées

## 🛠️ Technologies Utilisées

### Backend
- **TypeScript** - Typage fort et code maintenable
- **Node.js + Express** - API REST performante
- **MongoDB** - Base de données NoSQL flexible
- **Socket.IO** - Communication temps réel
- **Moment.js** - Gestion des dates avancée

### Sécurité & Performance
- **Helmet** - Sécurisation des headers HTTP
- **Rate Limiting** - Protection contre les abus
- **CORS** - Gestion des origines croisées
- **Compression** - Optimisation des réponses
- **Validation** - Joi pour la validation des données

## 📦 Installation

### 1. Prérequis
```bash
# Node.js 18+ et npm
node --version
npm --version

# MongoDB accessible (votre VPS: 72.60.91.85:27017)
```

### 2. Installation des dépendances
```bash
npm install
```

### 3. Configuration
```bash
# Copier le fichier d'exemple
cp env.example .env

# Modifier les variables selon votre configuration
# MONGODB_URI=mongodb://72.60.91.85:27017/teamapp
```

### 4. Migration des données existantes
```bash
# Migrer vos données JSON vers MongoDB
npm run migrate
```

### 5. Compilation TypeScript
```bash
# Build du projet
npm run build
```

### 6. Démarrage
```bash
# Développement (avec rechargement automatique)
npm run dev

# Production
npm start
```

## 🚀 Démarrage Rapide

### Développement
```bash
npm run dev
```
Le serveur démarre sur `http://localhost:5000`

### API Endpoints Principaux

#### Agents
```
GET    /api/agents              # Liste des agents
GET    /api/agents/:id          # Détails d'un agent
POST   /api/agents              # Créer un agent
PUT    /api/agents/:id          # Modifier un agent
POST   /api/agents/:id/notes    # Ajouter une note
GET    /api/agents/top-performers # Top performers
GET    /api/agents/inactifs     # Agents inactifs
```

#### Statistiques
```
GET    /api/stats/dashboard     # Dashboard principal
GET    /api/stats/financieres   # Stats financières
GET    /api/stats/agents/:id    # Stats d'un agent
GET    /api/stats/agents/comparaison # Comparaison agents
```

#### Utilitaires
```
GET    /api/health              # Statut de l'API
GET    /api/migrate/commissions # Migration commissions
GET    /api/migrate/depenses    # Migration dépenses
```

## 📊 Structure de la Base de Données

### Collections Principales
- **agents** - Profils des membres de l'équipe
- **commissions** - Projets et leurs détails
- **depenses** - Comptabilité des dépenses
- **activites** - Historique d'activité
- **sessions** - Sessions de travail
- **notifications** - Système de notifications
- **discord_data** - Données Discord synchronisées

Voir `database-schema.md` pour les détails complets.

## 🎨 Frontend React (À implémenter)

Le backend est prêt pour un frontend React avec :
- Dashboard interactif
- Graphiques Chart.js/Recharts
- Interface de gestion des agents
- Système de notifications
- Responsive design

## 📈 Exemples d'Utilisation

### Récupérer le dashboard
```javascript
fetch('/api/stats/dashboard?periode=mois')
  .then(res => res.json())
  .then(data => {
    console.log('Revenus du mois:', data.data.commissions.totalRevenu);
    console.log('Agents actifs:', data.data.agents.actifs);
  });
```

### Créer un agent
```javascript
fetch('/api/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nom: 'NouvelAgent',
    discordId: '123456789',
    role: 'builder',
    status: 'actif'
  })
});
```

### WebSocket temps réel
```javascript
const socket = io('http://localhost:5000');

// Écouter les mises à jour de statut
socket.on('agent_status_updated', (data) => {
  console.log(`Agent ${data.agentId} status: ${data.status}`);
});

// Mettre à jour un statut
socket.emit('update_agent_status', {
  agentId: 'agent123',
  status: 'en_commission'
});
```

## 🔧 Scripts Disponibles

```bash
npm run dev      # Développement avec rechargement
npm run build    # Compilation TypeScript
npm start        # Démarrage production
npm run migrate  # Migration des données JSON
```

## 📝 Roadmap

### Phase 1 ✅ (Actuelle)
- [x] API Backend complète
- [x] Gestion des agents
- [x] Statistiques avancées
- [x] Migration des données
- [x] WebSocket temps réel

### Phase 2 🔄 (En cours)
- [ ] Interface React
- [ ] Intégration Discord
- [ ] Système de tâches
- [ ] Notifications push

### Phase 3 🎯 (Futur)
- [ ] App mobile
- [ ] IA pour prédictions
- [ ] Intégrations externes
- [ ] Rapports automatisés

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Consulter la documentation API
- Vérifier les logs serveur

## 🎉 Résultats Attendus

Avec cette application, vous pourrez :

✅ **Savoir qui fait quoi** - Suivi temps réel de l'activité  
✅ **Identifier les performants** - Stats et classements  
✅ **Détecter les inactifs** - Alertes automatiques  
✅ **Optimiser les revenus** - Analyses financières  
✅ **Prendre des décisions** - Données objectives  
✅ **Automatiser la gestion** - Moins de travail manuel  

---

**TeamApp V2** - Rendez votre équipe 100% autonome et performante ! 🚀
