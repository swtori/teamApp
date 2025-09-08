// Charger les variables d'environnement depuis le fichier .env
require('dotenv').config();

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { SecurityManager, SecurityMonitor } = require('./security');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialiser les modules de sécurité
const securityManager = new SecurityManager();
const securityMonitor = new SecurityMonitor();

// Middleware de sécurité avancée
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate limiting global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite à 100 requêtes par fenêtre par IP
    message: { error: 'Trop de requêtes, réessayez plus tard.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limite à 5 tentatives de connexion par IP
    message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(globalLimiter);
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://votre-domaine.com' : true,
    credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Chemins des fichiers JSON
const AGENTS_FILE = path.join(__dirname, 'agents.json');
const COMMISSIONS_FILE = path.join(__dirname, 'commissions.json');
const DEPENSES_FILE = path.join(__dirname, 'depenses.json');
// AUTH_FILE supprimé - utilisation des variables d'environnement

// Fonction utilitaire pour lire un fichier JSON
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Erreur lors de la lecture de ${filePath}:`, error);
        throw error;
    }
}

// Fonction utilitaire pour écrire un fichier JSON
async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Erreur lors de l'écriture de ${filePath}:`, error);
        throw error;
    }
}

// ===========================================
// SYSTÈME D'AUTHENTIFICATION
// ===========================================

// Vérifier si une clé d'authentification est valide
async function validateAuthKey(key) {
    try {
        // Lire les clés depuis les variables d'environnement
        const authKeys = getAuthKeysFromEnv();
        const authKey = authKeys.find(k => k.key === key && k.isActive);
        return authKey || null;
    } catch (error) {
        console.error('Erreur lors de la validation de la clé:', error);
        return null;
    }
}

// Récupérer les clés d'authentification depuis les variables d'environnement
function getAuthKeysFromEnv() {
    const authKeys = [];
    let keyIndex = 1;
    
    while (process.env[`AUTH_KEY_${keyIndex}`]) {
        const key = process.env[`AUTH_KEY_${keyIndex}`];
        const name = process.env[`AUTH_KEY_${keyIndex}_NAME`] || `Clé ${keyIndex}`;
        const users = process.env[`AUTH_KEY_${keyIndex}_USERS`] ? 
            process.env[`AUTH_KEY_${keyIndex}_USERS`].split(',') : ['antoi'];
        const permissions = process.env[`AUTH_KEY_${keyIndex}_PERMISSIONS`] ? 
            process.env[`AUTH_KEY_${keyIndex}_PERMISSIONS`].split(',') : ['read'];
        
        authKeys.push({
            id: keyIndex,
            key: key,
            name: name,
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            isActive: true,
            allowedUsers: users,
            permissions: {
                admin: permissions.includes('admin'),
                read: permissions.includes('read'),
                write: permissions.includes('write'),
                delete: permissions.includes('delete')
            }
        });
        
        keyIndex++;
    }
    
    return authKeys;
}

// Créer une nouvelle session (simplifié pour les variables d'environnement)
async function createSession(authKey, username) {
    try {
        const sessionId = crypto.randomBytes(32).toString('hex');
        
        const session = {
            id: sessionId,
            authKeyId: authKey.id,
            username: username,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
        };
        
        // Stocker la session en mémoire ou dans une base de données
        // Pour l'instant, on retourne juste la session
        return session;
    } catch (error) {
        console.error('Erreur lors de la création de session:', error);
        return null;
    }
}

// Valider une session (simplifié pour les variables d'environnement)
async function validateSession(sessionId) {
    try {
        // Pour l'instant, on accepte toutes les sessions valides
        // Dans une vraie application, on stockerait les sessions en base de données
        return {
            id: sessionId,
            authKeyId: 1,
            username: 'antoi',
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
    } catch (error) {
        console.error('Erreur lors de la validation de session:', error);
        return null;
    }
}

// Middleware d'authentification
async function requireAuth(req, res, next) {
    try {
        // Vérifier le header Authorization
        const authHeader = req.headers.authorization;
        const sessionCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('teamapp_session='))?.split('=')[1];
        
        let isAuthenticated = false;
        let user = null;
        
        // Vérifier par clé d'auth (header Authorization)
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const key = authHeader.substring(7);
            const authKey = await validateAuthKey(key);
            if (authKey) {
                isAuthenticated = true;
                user = { authKey, method: 'key' };
            }
        }
        
        // Vérifier par session (cookie)
        if (!isAuthenticated && sessionCookie) {
            const session = await validateSession(sessionCookie);
            if (session) {
                const authKeys = getAuthKeysFromEnv();
                const authKey = authKeys.find(k => k.id === session.authKeyId);
                if (authKey) {
                    isAuthenticated = true;
                    user = { authKey, session, method: 'session' };
                }
            }
        }
        
        if (!isAuthenticated) {
            return res.status(401).json({ error: 'Authentification requise' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Erreur dans le middleware d\'authentification:', error);
        return res.status(500).json({ error: 'Erreur d\'authentification' });
    }
}

// Middleware pour vérifier les permissions admin
async function requireAdmin(req, res, next) {
    try {
        // Vérifier si l'utilisateur a les permissions admin
        const isMasterUser = req.user.session?.username === 'antoi' || 
                           req.user.authKey?.permissions?.admin === true;
        
        if (!isMasterUser) {
            return res.status(403).json({ error: 'Permissions administrateur requises' });
        }
        
        next();
    } catch (error) {
        console.error('Erreur dans le middleware admin:', error);
        return res.status(500).json({ error: 'Erreur de permissions' });
    }
}

// Fonction pour calculer la prochaine date selon la fréquence
function calculateNextPaymentDate(currentDate, frequency) {
    const date = new Date(currentDate);
    
    switch (frequency) {
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
            throw new Error(`Fréquence inconnue: ${frequency}`);
    }
    
    return date.toISOString();
}

// Fonction pour vérifier et générer les dépenses récurrentes
async function checkAndGenerateRecurringExpenses(data) {
    const now = new Date();
    let hasChanges = false;
    
    // Vérifier les templates actifs
    for (const template of data.templates || []) {
        if (template.actif && template.prochainePaiement) {
            const prochainePaiement = new Date(template.prochainePaiement);
            
            // Vérifier si le template a expiré
            if (template.dateExpiration) {
                const dateExpiration = new Date(template.dateExpiration);
                if (now > dateExpiration) {
                    console.log(`⏰ Template expiré: ${template.label}`);
                    template.actif = false;
                    hasChanges = true;
                    continue;
                }
            }
            
            // Si la date de prochain paiement est passée
            if (prochainePaiement <= now) {
                console.log(`🔄 Génération d'une nouvelle dépense depuis template: ${template.label}`);
                
                // Générer un nouvel ID
                const newId = data.depenses.length > 0 ? Math.max(...data.depenses.map(d => d.idDepense)) + 1 : 1;
                
                // Créer la nouvelle dépense
                const nouvelleDépense = {
                    idDepense: newId,
                    label: template.label,
                    description: template.description,
                    prix: template.prix,
                    devise: template.devise || 'EUR',
                    statut: 'à_venir',
                    date: template.prochainePaiement,
                    categorie: template.categorie,
                    dateCreation: now.toISOString(),
                    commentaires: [],
                    templateId: template.idTemplate,
                    recurrente: false,
                    frequence: null,
                    prochainePaiement: null,
                    depenseParente: null
                };
                
                // Ajouter la nouvelle dépense
                data.depenses.push(nouvelleDépense);
                
                // Mettre à jour la date de prochain paiement du template
                template.prochainePaiement = calculateNextPaymentDate(template.prochainePaiement, template.frequence);
                
                hasChanges = true;
                
                console.log(`✅ Nouvelle dépense générée depuis template (ID: ${newId}), prochain paiement: ${template.prochainePaiement}`);
            }
        }
    }

    // Chercher les dépenses récurrentes dont la date de prochain paiement est passée (ancien système)
    for (const depense of data.depenses) {
        if (depense.recurrente && depense.prochainePaiement) {
            const prochainePaiement = new Date(depense.prochainePaiement);
            
            // Si la date de prochain paiement est passée
            if (prochainePaiement <= now) {
                console.log(`🔄 Génération d'une nouvelle dépense récurrente pour: ${depense.label}`);
                
                // Générer un nouvel ID
                const newId = data.depenses.length > 0 ? Math.max(...data.depenses.map(d => d.idDepense)) + 1 : 1;
                
                // Créer la nouvelle dépense
                const nouvelleDépense = {
                    idDepense: newId,
                    label: depense.label,
                    description: depense.description,
                    prix: depense.prix,
                    devise: depense.devise || 'EUR',
                    statut: 'à_venir',
                    date: depense.prochainePaiement,
                    categorie: depense.categorie,
                    dateCreation: now.toISOString(),
                    commentaires: [],
                    recurrente: false, // La dépense générée n'est pas récurrente
                    frequence: null,
                    prochainePaiement: null,
                    depenseParente: depense.idDepense
                };
                
                // Ajouter la nouvelle dépense
                data.depenses.push(nouvelleDépense);
                
                // Mettre à jour la date de prochain paiement de la dépense parente
                depense.prochainePaiement = calculateNextPaymentDate(depense.prochainePaiement, depense.frequence);
                
                hasChanges = true;
                
                console.log(`✅ Nouvelle dépense générée (ID: ${newId}), prochain paiement: ${depense.prochainePaiement}`);
            }
        }
    }
    
    // Sauvegarder les changements si nécessaire
    if (hasChanges) {
        // Mettre à jour les métadonnées
        data.metadata.lastUpdated = now.toISOString();
        data.metadata.totalDepenses = data.depenses.length;
        data.metadata.totalMontant = data.depenses.reduce((total, d) => total + (d.prix || 0), 0);
        
        await writeJsonFile(DEPENSES_FILE, data);
        console.log('💾 Données des dépenses mises à jour avec les nouvelles dépenses récurrentes');
    }
    
    return data;
}

// ===========================================
// ROUTES D'AUTHENTIFICATION
// ===========================================

// Route de connexion avec sécurité renforcée
app.post('/api/auth/login', 
    authLimiter,
    [
        body('key').isLength({ min: 10 }).withMessage('Clé trop courte'),
        body('rememberMe').isBoolean().optional()
    ],
    async (req, res) => {
    try {
        // Validation des entrées
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            securityMonitor.recordLoginAttempt(req.ip, false);
            return res.status(400).json({ 
                error: 'Données invalides', 
                details: errors.array() 
            });
        }
        
        const { key, rememberMe } = req.body;
        const clientIP = req.ip;
        
        // Vérifier si l'IP est bloquée
        if (securityMonitor.isBlocked(clientIP)) {
            securityMonitor.logSecurityEvent('BLOCKED_LOGIN_ATTEMPT', { ip: clientIP });
            return res.status(429).json({ 
                error: 'Trop de tentatives échouées. Réessayez plus tard.' 
            });
        }
        
        // Nettoyer les données d'entrée
        const sanitizedKey = securityManager.sanitizeInput(key);
        
        if (!sanitizedKey) {
            securityMonitor.recordLoginAttempt(clientIP, false);
            return res.status(400).json({ error: 'Clé d\'authentification requise' });
        }
        
        // Valider la clé d'authentification
        const authKey = await validateAuthKey(sanitizedKey);
        if (!authKey) {
            securityMonitor.recordLoginAttempt(clientIP, false);
            securityMonitor.logSecurityEvent('FAILED_LOGIN', { 
                ip: clientIP, 
                key: sanitizedKey.substring(0, 10) + '...' // Log partiel pour debug
            });
            return res.status(401).json({ error: 'Clé d\'authentification invalide' });
        }
        
        // Déduire l'utilisateur depuis la clé
        // Si c'est la clé master ou créée par antoi, c'est antoi, sinon miinéki
        let username;
        if (authKey.createdBy === 'antoi' || authKey.name.toLowerCase().includes('master') || authKey.name.toLowerCase().includes('principal')) {
            username = 'antoi';
        } else {
            username = authKey.allowedUsers.includes('miinéki') ? 'miinéki' : authKey.allowedUsers[0];
        }
        
        // Créer une session si "rester connecté" est activé
        let sessionId = null;
        if (rememberMe) {
            const session = await createSession(authKey, username);
            if (session) {
                sessionId = session.id;
            }
        }
        
        // Enregistrer la connexion réussie
        securityMonitor.recordLoginAttempt(clientIP, true);
        securityMonitor.logSecurityEvent('SUCCESSFUL_LOGIN', { 
            ip: clientIP, 
            username,
            sessionId: sessionId ? 'created' : 'none'
        });
        
        res.json({
            success: true,
            message: 'Connexion réussie',
            user: {
                username,
                permissions: authKey.permissions,
                sessionId
            }
        });
        
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
});

// Route de vérification de session
app.get('/api/auth/verify', async (req, res) => {
    try {
        const sessionCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('teamapp_session='))?.split('=')[1];
        
        if (!sessionCookie) {
            return res.status(401).json({ error: 'Aucune session trouvée' });
        }
        
        const session = await validateSession(sessionCookie);
        if (!session) {
            return res.status(401).json({ error: 'Session invalide ou expirée' });
        }
        
        const authKeys = getAuthKeysFromEnv();
        const authKey = authKeys.find(k => k.id === session.authKeyId);
        
        res.json({
            success: true,
            user: {
                username: session.username,
                permissions: authKey?.permissions || {},
                sessionExpires: session.expiresAt
            }
        });
        
    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        res.status(500).json({ error: 'Erreur lors de la vérification' });
    }
});

// Route de déconnexion
app.post('/api/auth/logout', async (req, res) => {
    try {
        // Pour l'instant, on ne fait que retourner un succès
        // Dans une vraie application, on supprimerait la session de la base de données
        
        res.json({ success: true, message: 'Déconnexion réussie' });
        
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
});

// Routes d'administration (réservées au master user)
app.get('/api/auth/keys', requireAuth, requireAdmin, async (req, res) => {
    try {
        const authKeys = getAuthKeysFromEnv();
        
        // Ne pas exposer les clés complètes, juste les métadonnées
        const keysInfo = authKeys.map(key => ({
            id: key.id,
            name: key.name,
            createdBy: key.createdBy,
            createdAt: key.createdAt,
            isActive: key.isActive,
            allowedUsers: key.allowedUsers,
            permissions: key.permissions
        }));
        
        res.json({
            keys: keysInfo,
            totalKeys: authKeys.length
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des clés:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des clés' });
    }
});

// Générer une nouvelle clé d'authentification
app.post('/api/auth/keys/generate', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, allowedUsers, permissions } = req.body;
        
        if (!name || !allowedUsers || !Array.isArray(allowedUsers)) {
            return res.status(400).json({ error: 'Nom et utilisateurs autorisés requis' });
        }
        
        // Générer une nouvelle clé sécurisée
        const newKey = `teamapp-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
        
        // Trouver le prochain index disponible
        const existingKeys = getAuthKeysFromEnv();
        const nextIndex = existingKeys.length + 1;
        
        const keyData = {
            id: nextIndex,
            key: newKey,
            name: name.trim(),
            createdBy: req.user.session?.username || 'admin',
            createdAt: new Date().toISOString(),
            isActive: true,
            allowedUsers: allowedUsers,
            permissions: permissions || {
                admin: false,
                read: true,
                write: true,
                delete: false
            }
        };
        
        // Retourner les instructions pour ajouter la clé au .env
        res.json({
            success: true,
            message: 'Clé générée avec succès. Ajoutez ces variables à votre fichier .env :',
            key: {
                id: keyData.id,
                key: newKey,
                name: keyData.name,
                allowedUsers: keyData.allowedUsers,
                permissions: keyData.permissions
            },
            envVariables: {
                [`AUTH_KEY_${nextIndex}`]: newKey,
                [`AUTH_KEY_${nextIndex}_NAME`]: name.trim(),
                [`AUTH_KEY_${nextIndex}_USERS`]: allowedUsers.join(','),
                [`AUTH_KEY_${nextIndex}_PERMISSIONS`]: Object.keys(permissions || {read: true, write: true, delete: false})
                    .filter(p => permissions[p]).join(',')
            },
            instructions: `Ajoutez ces lignes à votre fichier .env :
AUTH_KEY_${nextIndex}=${newKey}
AUTH_KEY_${nextIndex}_NAME=${name.trim()}
AUTH_KEY_${nextIndex}_USERS=${allowedUsers.join(',')}
AUTH_KEY_${nextIndex}_PERMISSIONS=${Object.keys(permissions || {read: true, write: true, delete: false}).filter(p => permissions[p]).join(',')}`
        });
        
    } catch (error) {
        console.error('Erreur lors de la génération de clé:', error);
        res.status(500).json({ error: 'Erreur lors de la génération de clé' });
    }
});

// Désactiver/Activer une clé
app.put('/api/auth/keys/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Pour les variables d'environnement, on ne peut pas modifier dynamiquement
        // Il faudrait redémarrer le serveur après modification du .env
        res.json({
            success: false,
            message: 'Pour modifier les clés, éditez le fichier .env et redémarrez le serveur',
            instructions: 'Modifiez les variables AUTH_KEY_X dans votre fichier .env et redémarrez l\'application'
        });
        
    } catch (error) {
        console.error('Erreur lors de la modification de clé:', error);
        res.status(500).json({ error: 'Erreur lors de la modification de clé' });
    }
});

// Routes pour les agents
app.get('/api/agents', requireAuth, async (req, res) => {
    try {
        const data = await readJsonFile(AGENTS_FILE);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du chargement des agents' });
    }
});

app.post('/api/agents', requireAuth, async (req, res) => {
    try {
        const { pseudo, discordAgent, role, actif, dansLaTeam, comments } = req.body;
        
        if (!pseudo || !pseudo.trim()) {
            return res.status(400).json({ error: 'Le pseudo est obligatoire' });
        }
        
        const data = await readJsonFile(AGENTS_FILE);
        
        // Logique automatique : si hors de la team, automatiquement inactif
        let finalActif = actif;
        let finalDansLaTeam = dansLaTeam;
        
        if (dansLaTeam === false) {
            finalActif = false; // Automatiquement inactif si hors de la team
            console.log(`🔄 Nouvel agent ${pseudo} hors de la team → automatiquement inactif`);
        }
        
        const newAgent = {
            idAgent: Math.max(...data.agents.map(a => a.idAgent), 0) + 1,
            pseudo: pseudo.trim(),
            discordAgent: discordAgent || null,
            actif: finalActif !== false,
            dansLaTeam: finalDansLaTeam !== false,
            role: Array.isArray(role) ? role : [],
            comments: comments ? [{ 
                texte: comments, 
                date: new Date().toISOString() 
            }] : []
        };
        
        data.agents.push(newAgent);
        data.metadata.lastUpdated = new Date().toISOString();
        data.metadata.totalAgents = data.agents.length;
        
        await writeJsonFile(AGENTS_FILE, data);
        
        res.status(201).json(newAgent);
    } catch (error) {
        console.error('Erreur lors de la création:', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'agent' });
    }
});

app.put('/api/agents/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { pseudo, discordAgent, role, actif, dansLaTeam, comments } = req.body;
        
        if (!pseudo || !pseudo.trim()) {
            return res.status(400).json({ error: 'Le pseudo est obligatoire' });
        }
        
        const data = await readJsonFile(AGENTS_FILE);
        const agentIndex = data.agents.findIndex(a => a.idAgent === parseInt(id));
        
        if (agentIndex === -1) {
            return res.status(404).json({ error: 'Agent non trouvé' });
        }
        
        // Logique automatique : si hors de la team, automatiquement inactif
        let finalActif = actif;
        let finalDansLaTeam = dansLaTeam;
        
        if (dansLaTeam === false) {
            finalActif = false; // Automatiquement inactif si hors de la team
            console.log(`🔄 Agent ${pseudo} retiré de la team → automatiquement inactif`);
        }
        
        // Mise à jour de l'agent
        data.agents[agentIndex] = {
            ...data.agents[agentIndex],
            pseudo: pseudo.trim(),
            discordAgent: discordAgent || null,
            actif: finalActif !== false,
            dansLaTeam: finalDansLaTeam !== false,
            role: Array.isArray(role) ? role : [],
            comments: comments ? [{ 
                texte: comments, 
                date: new Date().toISOString() 
            }] : []
        };
        
        data.metadata.lastUpdated = new Date().toISOString();
        
        await writeJsonFile(AGENTS_FILE, data);
        
        res.json(data.agents[agentIndex]);
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'agent' });
    }
});

app.delete('/api/agents/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await readJsonFile(AGENTS_FILE);
        
        const agentIndex = data.agents.findIndex(a => a.idAgent === parseInt(id));
        
        if (agentIndex === -1) {
            return res.status(404).json({ error: 'Agent non trouvé' });
        }
        
        data.agents.splice(agentIndex, 1);
        data.metadata.lastUpdated = new Date().toISOString();
        data.metadata.totalAgents = data.agents.length;
        
        await writeJsonFile(AGENTS_FILE, data);
        
        res.json({ message: 'Agent supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'agent' });
    }
});

// Routes pour les commissions
app.get('/api/commissions', requireAuth, async (req, res) => {
    try {
        const data = await readJsonFile(COMMISSIONS_FILE);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du chargement des commissions' });
    }
});

app.post('/api/commissions', requireAuth, async (req, res) => {
    try {
        const { nomClient, nomProjet, prix, deadline, description, participants, commentaires, acompte } = req.body;
        
        if (!nomClient || !nomProjet || !prix) {
            return res.status(400).json({ error: 'Le nom du client, le nom du projet et le prix sont obligatoires' });
        }
        
        if (prix <= 0) {
            return res.status(400).json({ error: 'Le prix doit être supérieur à 0' });
        }
        
        const data = await readJsonFile(COMMISSIONS_FILE);
        
        const newCommission = {
            idCommission: Math.max(...data.commissions.map(c => c.idCommission), 0) + 1,
            nomClient: nomClient.trim(),
            nomProjet: nomProjet.trim(),
            prix: parseFloat(prix),
            dateCreation: new Date().toISOString(),
            deadline: deadline || null,
            statut: 'planifie',
            description: description || '',
            participants: Array.isArray(participants) ? participants : [],
            commentaires: Array.isArray(commentaires) ? commentaires : []
        };
        
        // Ajouter les données d'acompte si fournies
        if (acompte) {
            newCommission.acompte = acompte;
        }
        
        data.commissions.push(newCommission);
        data.metadata.lastUpdated = new Date().toISOString();
        data.metadata.totalCommissions = data.commissions.length;
        data.metadata.totalRevenue = data.commissions.reduce((sum, c) => sum + c.prix, 0);
        
        await writeJsonFile(COMMISSIONS_FILE, data);
        
        res.status(201).json(newCommission);
    } catch (error) {
        console.error('Erreur lors de la création:', error);
        res.status(500).json({ error: 'Erreur lors de la création de la commission' });
    }
});

app.put('/api/commissions/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { nomClient, nomProjet, prix, deadline, statut, description, participants, commentaires, acompte } = req.body;
        
        if (!nomClient || !nomProjet || !prix) {
            return res.status(400).json({ error: 'Le nom du client, le nom du projet et le prix sont obligatoires' });
        }
        
        if (prix <= 0) {
            return res.status(400).json({ error: 'Le prix doit être supérieur à 0' });
        }
        
        const data = await readJsonFile(COMMISSIONS_FILE);
        const commissionIndex = data.commissions.findIndex(c => c.idCommission === parseInt(id));
        
        if (commissionIndex === -1) {
            return res.status(404).json({ error: 'Commission non trouvée' });
        }
        
        // Mise à jour de la commission
        data.commissions[commissionIndex] = {
            ...data.commissions[commissionIndex],
            nomClient: nomClient.trim(),
            nomProjet: nomProjet.trim(),
            prix: parseFloat(prix),
            deadline: deadline || null,
            statut: statut || 'planifie',
            description: description || '',
            participants: Array.isArray(participants) ? participants : [],
            commentaires: Array.isArray(commentaires) ? commentaires : []
        };
        
        // Mettre à jour les données d'acompte si fournies
        if (acompte) {
            const commission = data.commissions[commissionIndex];
            const ancienAcompte = commission.acompte || {};
            
            // Initialiser l'acompte s'il n'existe pas
            if (!commission.acompte) {
                commission.acompte = {
                    montantAcompte: 0,
                    statutAcompte: "non_demande",
                    dateAcomptePrevu: null,
                    dateAcompteRecu: null,
                    historiqueAcomptes: [],
                    historiquePaiements: []
                };
            }
            
            // S'assurer que les historiques existent
            if (!commission.acompte.historiqueAcomptes) {
                commission.acompte.historiqueAcomptes = [];
            }
            if (!commission.acompte.historiquePaiements) {
                commission.acompte.historiquePaiements = [];
            }
            
            // Mettre à jour les champs
            commission.acompte = {
                ...commission.acompte,
                ...acompte
            };
            
            // Si l'acompte est marqué comme reçu et qu'il n'était pas reçu avant, ajouter à l'historique
            if (acompte.statutAcompte === "recu" && 
                ancienAcompte.statutAcompte !== "recu" && 
                acompte.montantAcompte && 
                acompte.dateAcompteRecu) {
                
                const nouvelHistorique = {
                    montant: parseFloat(acompte.montantAcompte),
                    dateVersement: acompte.dateAcompteRecu,
                    methodeVersement: "non_specifie", // Valeur par défaut
                    commentaire: "Acompte marqué comme reçu"
                };
                
                // Éviter les doublons
                const existe = commission.acompte.historiqueAcomptes.some(h => 
                    h.dateVersement === nouvelHistorique.dateVersement && 
                    h.montant === nouvelHistorique.montant
                );
                
                if (!existe) {
                    commission.acompte.historiqueAcomptes.push(nouvelHistorique);
                    console.log(`✅ Acompte ajouté à l'historique: ${nouvelHistorique.montant}€`);
                }
            }
        }
        
        data.metadata.lastUpdated = new Date().toISOString();
        data.metadata.totalRevenue = data.commissions.reduce((sum, c) => sum + c.prix, 0);
        
        await writeJsonFile(COMMISSIONS_FILE, data);
        
        res.json(data.commissions[commissionIndex]);
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la commission' });
    }
});

app.delete('/api/commissions/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await readJsonFile(COMMISSIONS_FILE);
        
        const commissionIndex = data.commissions.findIndex(c => c.idCommission === parseInt(id));
        
        if (commissionIndex === -1) {
            return res.status(404).json({ error: 'Commission non trouvée' });
        }
        
        data.commissions.splice(commissionIndex, 1);
        data.metadata.lastUpdated = new Date().toISOString();
        data.metadata.totalCommissions = data.commissions.length;
        data.metadata.totalRevenue = data.commissions.reduce((sum, c) => sum + c.prix, 0);
        
        await writeJsonFile(COMMISSIONS_FILE, data);
        
        res.json({ message: 'Commission supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de la commission' });
    }
});

// ===========================================
// ENDPOINTS SPÉCIFIQUES POUR LES ACOMPTES
// ===========================================

// Mettre à jour l'acompte d'une commission
app.put('/api/commissions/:id/acompte', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { montantAcompte, statutAcompte, dateAcomptePrevu, dateAcompteRecu, methodeVersement, commentaire } = req.body;
        
        const data = await readJsonFile(COMMISSIONS_FILE);
        const commissionIndex = data.commissions.findIndex(c => c.idCommission === parseInt(id));
        
        if (commissionIndex === -1) {
            return res.status(404).json({ error: 'Commission non trouvée' });
        }
        
        const commission = data.commissions[commissionIndex];
        
        // Initialiser l'acompte s'il n'existe pas
        if (!commission.acompte) {
            commission.acompte = {
                montantAcompte: 0,
                statutAcompte: "non_demande",
                dateAcomptePrevu: null,
                dateAcompteRecu: null,
                historiqueAcomptes: []
            };
        }
        
        // Mettre à jour les champs de l'acompte
        if (montantAcompte !== undefined) commission.acompte.montantAcompte = parseFloat(montantAcompte);
        if (statutAcompte !== undefined) commission.acompte.statutAcompte = statutAcompte;
        if (dateAcomptePrevu !== undefined) commission.acompte.dateAcomptePrevu = dateAcomptePrevu;
        if (dateAcompteRecu !== undefined) commission.acompte.dateAcompteRecu = dateAcompteRecu;
        
        // Si l'acompte est marqué comme reçu, ajouter à l'historique
        if (statutAcompte === "recu" && dateAcompteRecu && montantAcompte) {
            const nouvelHistorique = {
                montant: parseFloat(montantAcompte),
                dateVersement: dateAcompteRecu,
                methodeVersement: methodeVersement || "non_specifie",
                commentaire: commentaire || ""
            };
            
            // Éviter les doublons
            const existe = commission.acompte.historiqueAcomptes.some(h => 
                h.dateVersement === nouvelHistorique.dateVersement && 
                h.montant === nouvelHistorique.montant
            );
            
            if (!existe) {
                commission.acompte.historiqueAcomptes.push(nouvelHistorique);
            }
        }
        
        data.metadata.lastUpdated = new Date().toISOString();
        await writeJsonFile(COMMISSIONS_FILE, data);
        
        res.json(commission);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'acompte:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'acompte' });
    }
});

// Ajouter un versement d'acompte à l'historique
app.post('/api/commissions/:id/acompte/versement', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { montant, dateVersement, methodeVersement, commentaire } = req.body;
        
        if (!montant || !dateVersement) {
            return res.status(400).json({ error: 'Le montant et la date de versement sont obligatoires' });
        }
        
        const data = await readJsonFile(COMMISSIONS_FILE);
        const commissionIndex = data.commissions.findIndex(c => c.idCommission === parseInt(id));
        
        if (commissionIndex === -1) {
            return res.status(404).json({ error: 'Commission non trouvée' });
        }
        
        const commission = data.commissions[commissionIndex];
        
        // Initialiser l'acompte s'il n'existe pas
        if (!commission.acompte) {
            commission.acompte = {
                montantAcompte: 0,
                statutAcompte: "non_demande",
                dateAcomptePrevu: null,
                dateAcompteRecu: null,
                historiqueAcomptes: []
            };
        }
        
        const nouvelHistorique = {
            montant: parseFloat(montant),
            dateVersement: dateVersement,
            methodeVersement: methodeVersement || "non_specifie",
            commentaire: commentaire || ""
        };
        
        commission.acompte.historiqueAcomptes.push(nouvelHistorique);
        
        // Calculer le total des versements
        const totalVerse = commission.acompte.historiqueAcomptes.reduce((sum, h) => sum + h.montant, 0);
        
        // Mettre à jour le statut automatiquement
        if (totalVerse >= commission.acompte.montantAcompte && commission.acompte.montantAcompte > 0) {
            commission.acompte.statutAcompte = "recu";
            commission.acompte.dateAcompteRecu = dateVersement;
        } else if (totalVerse > 0) {
            commission.acompte.statutAcompte = "partiel";
        }
        
        data.metadata.lastUpdated = new Date().toISOString();
        await writeJsonFile(COMMISSIONS_FILE, data);
        
        res.json(commission);
    } catch (error) {
        console.error('Erreur lors de l\'ajout du versement:', error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du versement' });
    }
});

// Ajouter un paiement final (solde restant) à une commission
app.post('/api/commissions/:id/paiement-final', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { montant, dateVersement, methodeVersement, commentaire } = req.body;
        
        if (!montant || !dateVersement) {
            return res.status(400).json({ error: 'Le montant et la date de versement sont obligatoires' });
        }
        
        const data = await readJsonFile(COMMISSIONS_FILE);
        const commissionIndex = data.commissions.findIndex(c => c.idCommission === parseInt(id));
        
        if (commissionIndex === -1) {
            return res.status(404).json({ error: 'Commission non trouvée' });
        }
        
        const commission = data.commissions[commissionIndex];
        
        // Initialiser l'acompte s'il n'existe pas
        if (!commission.acompte) {
            commission.acompte = {
                montantAcompte: 0,
                statutAcompte: "non_demande",
                dateAcomptePrevu: null,
                dateAcompteRecu: null,
                historiqueAcomptes: [],
                historiquePaiements: []
            };
        }
        
        // S'assurer que l'historique des paiements existe
        if (!commission.acompte.historiquePaiements) {
            commission.acompte.historiquePaiements = [];
        }
        
        // Calculer le total déjà versé (acomptes + paiements précédents)
        const totalVerse = commission.acompte.historiqueAcomptes.reduce((sum, h) => sum + h.montant, 0) +
                          commission.acompte.historiquePaiements.reduce((sum, p) => sum + p.montant, 0);
        
        const soldeRestant = commission.prix - totalVerse;
        const montantPaiement = parseFloat(montant);
        
        // Vérifier que le montant ne dépasse pas le solde restant
        if (montantPaiement > soldeRestant + 0.01) { // +0.01 pour les erreurs d'arrondi
            return res.status(400).json({ 
                error: `Le montant (${montantPaiement}€) dépasse le solde restant (${soldeRestant.toFixed(2)}€)` 
            });
        }
        
        const nouveauPaiement = {
            montant: montantPaiement,
            dateVersement: dateVersement,
            methodeVersement: methodeVersement || "non_specifie",
            commentaire: commentaire || "",
            typePaiement: "final" // Marquer comme paiement final
        };
        
        commission.acompte.historiquePaiements.push(nouveauPaiement);
        
        // Calculer le nouveau total versé
        const nouveauTotalVerse = totalVerse + montantPaiement;
        
        // Mettre à jour le statut de la commission si entièrement payée
        if (nouveauTotalVerse >= commission.prix - 0.01) { // -0.01 pour les erreurs d'arrondi
            commission.statut = 'termine'; // Marquer la commission comme terminée
        }
        
        data.metadata.lastUpdated = new Date().toISOString();
        await writeJsonFile(COMMISSIONS_FILE, data);
        
        res.json({
            success: true,
            message: 'Paiement final enregistré avec succès',
            commission: commission,
            paiementAjoute: nouveauPaiement,
            nouveauSoldeRestant: commission.prix - nouveauTotalVerse
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du paiement final:', error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du paiement final' });
    }
});

// Supprimer un paiement final
app.delete('/api/commissions/:id/paiement-final/:paiementIndex', requireAuth, async (req, res) => {
    try {
        const { id, paiementIndex } = req.params;
        
        const data = await readJsonFile(COMMISSIONS_FILE);
        const commissionIndex = data.commissions.findIndex(c => c.idCommission === parseInt(id));
        
        if (commissionIndex === -1) {
            return res.status(404).json({ error: 'Commission non trouvée' });
        }
        
        const commission = data.commissions[commissionIndex];
        
        // Vérifier que l'acompte et l'historique des paiements existent
        if (!commission.acompte || !commission.acompte.historiquePaiements) {
            return res.status(404).json({ error: 'Aucun paiement final trouvé' });
        }
        
        const index = parseInt(paiementIndex);
        if (index < 0 || index >= commission.acompte.historiquePaiements.length) {
            return res.status(404).json({ error: 'Paiement non trouvé' });
        }
        
        // Supprimer le paiement
        const paiementSupprime = commission.acompte.historiquePaiements.splice(index, 1)[0];
        
        // Recalculer le statut de la commission
        const totalVerse = commission.acompte.historiqueAcomptes.reduce((sum, h) => sum + h.montant, 0) +
                          commission.acompte.historiquePaiements.reduce((sum, p) => sum + p.montant, 0);
        
        // Si ce n'est plus entièrement payé, remettre le statut précédent
        if (totalVerse < commission.prix - 0.01 && commission.statut === 'termine') {
            commission.statut = 'en_cours'; // ou un autre statut approprié
        }
        
        data.metadata.lastUpdated = new Date().toISOString();
        await writeJsonFile(COMMISSIONS_FILE, data);
        
        res.json({
            success: true,
            message: 'Paiement final supprimé avec succès',
            paiementSupprime: paiementSupprime,
            commission: commission
        });
        
    } catch (error) {
        console.error('Erreur lors de la suppression du paiement final:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression du paiement final' });
    }
});

// Obtenir le statut financier d'une commission (acompte + solde restant)
app.get('/api/commissions/:id/finances', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await readJsonFile(COMMISSIONS_FILE);
        const commission = data.commissions.find(c => c.idCommission === parseInt(id));
        
        if (!commission) {
            return res.status(404).json({ error: 'Commission non trouvée' });
        }
        
        const finances = {
            prixTotal: commission.prix,
            acompte: commission.acompte || {
                montantAcompte: 0,
                statutAcompte: "non_demande",
                dateAcomptePrevu: null,
                dateAcompteRecu: null,
                historiqueAcomptes: [],
                historiquePaiements: []
            }
        };
        
        // S'assurer que l'historique des paiements existe
        if (!finances.acompte.historiquePaiements) {
            finances.acompte.historiquePaiements = [];
        }
        
        // Calculer le total versé (acomptes + paiements finaux)
        const totalVerseAcomptes = finances.acompte.historiqueAcomptes.reduce((sum, h) => sum + h.montant, 0);
        const totalVersePaiements = finances.acompte.historiquePaiements.reduce((sum, p) => sum + p.montant, 0);
        const totalVerse = totalVerseAcomptes + totalVersePaiements;
        
        // Calculer le solde restant
        finances.soldeRestant = commission.prix - totalVerse;
        finances.totalVerse = totalVerse;
        finances.totalVerseAcomptes = totalVerseAcomptes;
        finances.totalVersePaiements = totalVersePaiements;
        finances.pourcentageVerse = commission.prix > 0 ? (totalVerse / commission.prix) * 100 : 0;
        
        // Déterminer le statut financier global
        if (totalVerse === 0) {
            finances.statutFinancier = "aucun_versement";
        } else if (totalVerse >= commission.prix - 0.01) { // -0.01 pour les erreurs d'arrondi
            finances.statutFinancier = "entierement_paye";
        } else if (totalVerseAcomptes >= finances.acompte.montantAcompte && finances.acompte.montantAcompte > 0) {
            finances.statutFinancier = "acompte_recu";
        } else if (totalVerseAcomptes > 0) {
            finances.statutFinancier = "acompte_partiel";
        } else {
            finances.statutFinancier = "aucun_versement";
        }
        
        res.json(finances);
    } catch (error) {
        console.error('Erreur lors de la récupération des finances:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des finances' });
    }
});

// Route pour récupérer les agents (pour les participants)
app.get('/api/agents/list', requireAuth, async (req, res) => {
    try {
        const data = await readJsonFile(AGENTS_FILE);
        const agentsList = data.agents.map(agent => ({
            idAgent: agent.idAgent,
            pseudo: agent.pseudo,
            actif: agent.actif,
            dansLaTeam: agent.dansLaTeam
        }));
        res.json(agentsList);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du chargement de la liste des agents' });
    }
});

// ===== ROUTES DÉPENSES =====

// GET - Récupérer toutes les dépenses
app.get('/api/depenses', requireAuth, async (req, res) => {
    try {
        let data = await readJsonFile(DEPENSES_FILE);
        
        // Vérifier et générer les dépenses récurrentes si nécessaire
        data = await checkAndGenerateRecurringExpenses(data);
        
        res.json(data);
    } catch (error) {
        console.error('Erreur lors de la récupération des dépenses:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des dépenses' });
    }
});

// POST - Créer une nouvelle dépense
app.post('/api/depenses', requireAuth, async (req, res) => {
    try {
        const { 
            label, description, prix, statut, date, categorie, commentaires,
            recurrente, frequence, prochainePaiement, depenseParente 
        } = req.body;
        
        if (!label || prix === undefined || !statut || !date) {
            return res.status(400).json({ error: 'Le label, le prix, le statut et la date sont obligatoires' });
        }
        
        // Validation pour les dépenses récurrentes
        if (recurrente && (!frequence || !prochainePaiement)) {
            return res.status(400).json({ error: 'Pour une dépense récurrente, la fréquence et la date de prochain paiement sont obligatoires' });
        }
        
        const data = await readJsonFile(DEPENSES_FILE);
        
        // Générer un nouvel ID
        const newId = data.depenses.length > 0 ? Math.max(...data.depenses.map(d => d.idDepense)) + 1 : 1;
        
        const newDepense = {
            idDepense: newId,
            label: label.trim(),
            description: description?.trim() || '',
            prix: parseFloat(prix),
            devise: 'EUR',
            statut: statut,
            date: date,
            categorie: categorie || '',
            dateCreation: new Date().toISOString(),
            commentaires: commentaires ? [
                {
                    texte: commentaires.trim(),
                    date: new Date().toISOString(),
                    auteur: 'Admin'
                }
            ] : [],
            recurrente: recurrente || false,
            frequence: recurrente ? frequence : null,
            prochainePaiement: recurrente ? prochainePaiement : null,
            depenseParente: depenseParente || null
        };
        
        data.depenses.push(newDepense);
        data.metadata.lastUpdated = new Date().toISOString();
        data.metadata.totalDepenses = data.depenses.length;
        data.metadata.totalMontant = data.depenses.reduce((sum, d) => sum + d.prix, 0);
        
        await writeJsonFile(DEPENSES_FILE, data);
        
        console.log('✅ Nouvelle dépense créée:', newDepense.label);
        if (newDepense.recurrente) {
            console.log(`🔄 Dépense récurrente configurée: ${newDepense.frequence}, prochain paiement: ${newDepense.prochainePaiement}`);
        }
        res.json(newDepense);
    } catch (error) {
        console.error('Erreur lors de la création:', error);
        res.status(500).json({ error: 'Erreur lors de la création de la dépense' });
    }
});

// PUT - Mettre à jour une dépense
app.put('/api/depenses/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            label, description, prix, statut, date, categorie, commentaires,
            recurrente, frequence, prochainePaiement 
        } = req.body;
        
        if (!label || prix === undefined || !statut || !date) {
            return res.status(400).json({ error: 'Le label, le prix, le statut et la date sont obligatoires' });
        }
        
        // Validation pour les dépenses récurrentes
        if (recurrente && (!frequence || !prochainePaiement)) {
            return res.status(400).json({ error: 'Pour une dépense récurrente, la fréquence et la date de prochain paiement sont obligatoires' });
        }
        
        const data = await readJsonFile(DEPENSES_FILE);
        const depenseIndex = data.depenses.findIndex(d => d.idDepense === parseInt(id));
        
        if (depenseIndex === -1) {
            return res.status(404).json({ error: 'Dépense non trouvée' });
        }
        
        // Conserver les commentaires existants et ajouter le nouveau si fourni
        let updatedCommentaires = data.depenses[depenseIndex].commentaires || [];
        if (commentaires && commentaires.trim()) {
            updatedCommentaires.push({
                texte: commentaires.trim(),
                date: new Date().toISOString(),
                auteur: 'Admin'
            });
        }
        
        data.depenses[depenseIndex] = {
            ...data.depenses[depenseIndex],
            label: label.trim(),
            description: description?.trim() || '',
            prix: parseFloat(prix),
            statut: statut,
            date: date,
            categorie: categorie || '',
            commentaires: updatedCommentaires,
            recurrente: recurrente !== undefined ? recurrente : data.depenses[depenseIndex].recurrente,
            frequence: recurrente ? frequence : (recurrente === false ? null : data.depenses[depenseIndex].frequence),
            prochainePaiement: recurrente ? prochainePaiement : (recurrente === false ? null : data.depenses[depenseIndex].prochainePaiement)
        };
        
        data.metadata.lastUpdated = new Date().toISOString();
        data.metadata.totalMontant = data.depenses.reduce((sum, d) => sum + d.prix, 0);
        
        await writeJsonFile(DEPENSES_FILE, data);
        
        console.log('✅ Dépense mise à jour:', data.depenses[depenseIndex].label);
        res.json(data.depenses[depenseIndex]);
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la dépense' });
    }
});

// DELETE - Supprimer une dépense
app.delete('/api/depenses/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await readJsonFile(DEPENSES_FILE);
        
        const depenseIndex = data.depenses.findIndex(d => d.idDepense === parseInt(id));
        
        if (depenseIndex === -1) {
            return res.status(404).json({ error: 'Dépense non trouvée' });
        }
        
        const deletedDepense = data.depenses[depenseIndex];
        data.depenses.splice(depenseIndex, 1);
        data.metadata.lastUpdated = new Date().toISOString();
        data.metadata.totalDepenses = data.depenses.length;
        data.metadata.totalMontant = data.depenses.reduce((sum, d) => sum + d.prix, 0);
        
        await writeJsonFile(DEPENSES_FILE, data);
        
        console.log('✅ Dépense supprimée:', deletedDepense.label);
        res.json({ message: 'Dépense supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de la dépense' });
    }
});

// Route racine
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Routes pour les templates récurrents
app.get('/api/templates', requireAuth, async (req, res) => {
    try {
        const data = await readJsonFile(DEPENSES_FILE);
        res.json(data.templates || []);
    } catch (error) {
        console.error('Erreur lors du chargement des templates:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des templates' });
    }
});

app.post('/api/templates', requireAuth, async (req, res) => {
    try {
        const { label, description, prix, devise, categorie, frequence, prochainePaiement, dateExpiration, commentaires } = req.body;
        
        if (!label || prix === undefined || !frequence || !prochainePaiement) {
            return res.status(400).json({ error: 'Le label, le prix, la fréquence et la date de prochain paiement sont obligatoires' });
        }
        
        const data = await readJsonFile(DEPENSES_FILE);
        
        // Générer un nouvel ID pour le template
        const newId = data.templates && data.templates.length > 0 
            ? Math.max(...data.templates.map(t => t.idTemplate)) + 1 
            : 1;
        
        const newTemplate = {
            idTemplate: newId,
            label: label.trim(),
            description: description?.trim() || '',
            prix: parseFloat(prix),
            devise: devise || 'EUR',
            categorie: categorie || '',
            frequence: frequence,
            prochainePaiement: prochainePaiement,
            dateExpiration: dateExpiration || null,
            actif: true,
            dateCreation: new Date().toISOString(),
            commentaires: commentaires ? [
                {
                    texte: commentaires.trim(),
                    date: new Date().toISOString(),
                    auteur: 'Admin'
                }
            ] : []
        };
        
        if (!data.templates) data.templates = [];
        data.templates.push(newTemplate);
        
        data.metadata.lastUpdated = new Date().toISOString();
        data.metadata.totalTemplates = data.templates.length;
        
        await writeJsonFile(DEPENSES_FILE, data);
        
        console.log('✅ Template créé:', newTemplate.label);
        res.status(201).json(newTemplate);
    } catch (error) {
        console.error('Erreur lors de la création du template:', error);
        res.status(500).json({ error: 'Erreur lors de la création du template' });
    }
});

app.put('/api/templates/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { label, description, prix, devise, categorie, frequence, prochainePaiement, dateExpiration, actif, commentaires } = req.body;
        
        if (!label || prix === undefined || !frequence) {
            return res.status(400).json({ error: 'Le label, le prix et la fréquence sont obligatoires' });
        }
        
        const data = await readJsonFile(DEPENSES_FILE);
        if (!data.templates) data.templates = [];
        
        const templateIndex = data.templates.findIndex(t => t.idTemplate === parseInt(id));
        
        if (templateIndex === -1) {
            return res.status(404).json({ error: 'Template non trouvé' });
        }
        
        // Conserver les commentaires existants et ajouter le nouveau si fourni
        let updatedCommentaires = data.templates[templateIndex].commentaires || [];
        if (commentaires && commentaires.trim()) {
            updatedCommentaires.push({
                texte: commentaires.trim(),
                date: new Date().toISOString(),
                auteur: 'Admin'
            });
        }
        
        data.templates[templateIndex] = {
            ...data.templates[templateIndex],
            label: label.trim(),
            description: description?.trim() || '',
            prix: parseFloat(prix),
            devise: devise || 'EUR',
            categorie: categorie || '',
            frequence: frequence,
            prochainePaiement: prochainePaiement || data.templates[templateIndex].prochainePaiement,
            dateExpiration: dateExpiration !== undefined ? dateExpiration : data.templates[templateIndex].dateExpiration,
            actif: actif !== undefined ? actif : data.templates[templateIndex].actif,
            commentaires: updatedCommentaires
        };
        
        data.metadata.lastUpdated = new Date().toISOString();
        
        await writeJsonFile(DEPENSES_FILE, data);
        
        console.log('✅ Template mis à jour:', data.templates[templateIndex].label);
        res.json(data.templates[templateIndex]);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du template:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du template' });
    }
});

app.delete('/api/templates/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const data = await readJsonFile(DEPENSES_FILE);
        if (!data.templates) data.templates = [];
        
        const templateIndex = data.templates.findIndex(t => t.idTemplate === parseInt(id));
        
        if (templateIndex === -1) {
            return res.status(404).json({ error: 'Template non trouvé' });
        }
        
        const deletedTemplate = data.templates.splice(templateIndex, 1)[0];
        
        data.metadata.lastUpdated = new Date().toISOString();
        data.metadata.totalTemplates = data.templates.length;
        
        await writeJsonFile(DEPENSES_FILE, data);
        
        console.log('✅ Template supprimé:', deletedTemplate.label);
        res.json({ message: 'Template supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du template:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression du template' });
    }
});

// Endpoint pour forcer la génération des dépenses récurrentes
app.post('/api/templates/generate', requireAuth, async (req, res) => {
    try {
        const data = await readJsonFile(DEPENSES_FILE);
        const updatedData = await checkAndGenerateRecurringExpenses(data);
        
        res.json({ 
            message: 'Génération des dépenses récurrentes terminée',
            totalDepenses: updatedData.depenses.length 
        });
    } catch (error) {
        console.error('Erreur lors de la génération:', error);
        res.status(500).json({ error: 'Erreur lors de la génération des dépenses récurrentes' });
    }
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur TeamApp V1 démarré sur le port ${PORT}`);
    console.log(`📱 Interface disponible sur: http://localhost:${PORT}`);
    console.log(`🔌 API disponible sur: http://localhost:${PORT}/api/agents`);
    console.log(`💰 API Commissions disponible sur: http://localhost:${PORT}/api/commissions`);
});

module.exports = app;

