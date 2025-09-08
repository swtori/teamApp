// TeamApp V1 - Module de Sécurité Avancée
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

// Configuration de sécurité
const SECURITY_CONFIG = {
    // Chiffrement AES-256
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltRounds: 12, // Pour bcrypt
    
    // Clés de chiffrement (en production, utilisez des variables d'environnement)
    masterKey: process.env.MASTER_KEY || 'teamapp-master-encryption-key-2025-ultra-secure',
    authSalt: process.env.AUTH_SALT || 'teamapp-auth-salt-2025'
};

class SecurityManager {
    constructor() {
        this.masterKey = crypto.scryptSync(SECURITY_CONFIG.masterKey, SECURITY_CONFIG.authSalt, SECURITY_CONFIG.keyLength);
    }

    // ==========================================
    // CHIFFREMENT DES DONNÉES
    // ==========================================

    /**
     * Chiffrer des données sensibles
     */
    encryptData(data) {
        try {
            const iv = crypto.randomBytes(SECURITY_CONFIG.ivLength);
            const cipher = crypto.createCipher(SECURITY_CONFIG.algorithm, this.masterKey, { iv });
            
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const tag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                tag: tag.toString('hex')
            };
        } catch (error) {
            console.error('❌ Erreur de chiffrement:', error);
            throw new Error('Erreur de chiffrement des données');
        }
    }

    /**
     * Déchiffrer des données
     */
    decryptData(encryptedData) {
        try {
            const { encrypted, iv, tag } = encryptedData;
            
            const decipher = crypto.createDecipher(
                SECURITY_CONFIG.algorithm, 
                this.masterKey, 
                { iv: Buffer.from(iv, 'hex') }
            );
            
            decipher.setAuthTag(Buffer.from(tag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('❌ Erreur de déchiffrement:', error);
            throw new Error('Erreur de déchiffrement des données');
        }
    }

    // ==========================================
    // HASHAGE DES CLÉS D'AUTHENTIFICATION
    // ==========================================

    /**
     * Hasher une clé d'authentification
     */
    async hashAuthKey(key) {
        try {
            return await bcrypt.hash(key, SECURITY_CONFIG.saltRounds);
        } catch (error) {
            console.error('❌ Erreur de hashage:', error);
            throw new Error('Erreur de hashage de la clé');
        }
    }

    /**
     * Vérifier une clé d'authentification
     */
    async verifyAuthKey(key, hashedKey) {
        try {
            return await bcrypt.compare(key, hashedKey);
        } catch (error) {
            console.error('❌ Erreur de vérification:', error);
            return false;
        }
    }

    // ==========================================
    // GESTION SÉCURISÉE DES FICHIERS
    // ==========================================

    /**
     * Lire un fichier chiffré
     */
    async readSecureFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const encryptedData = JSON.parse(data);
            
            // Si le fichier n'est pas chiffré (ancien format), le retourner tel quel
            if (!encryptedData.encrypted) {
                return encryptedData;
            }
            
            return this.decryptData(encryptedData);
        } catch (error) {
            console.error(`❌ Erreur lecture sécurisée ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Écrire un fichier chiffré
     */
    async writeSecureFile(filePath, data) {
        try {
            const encryptedData = this.encryptData(data);
            await fs.writeFile(filePath, JSON.stringify(encryptedData, null, 2), 'utf8');
        } catch (error) {
            console.error(`❌ Erreur écriture sécurisée ${filePath}:`, error);
            throw error;
        }
    }

    // ==========================================
    // SÉCURITÉ DES SESSIONS
    // ==========================================

    /**
     * Générer un token de session sécurisé
     */
    generateSecureToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    /**
     * Générer une clé d'authentification sécurisée
     */
    generateSecureAuthKey(prefix = 'teamapp') {
        const timestamp = Date.now();
        const randomBytes = crypto.randomBytes(32).toString('hex');
        return `${prefix}-${timestamp}-${randomBytes}`;
    }

    // ==========================================
    // VALIDATION ET SANITISATION
    // ==========================================

    /**
     * Nettoyer les données d'entrée
     */
    sanitizeInput(input) {
        if (typeof input === 'string') {
            return input.trim().replace(/[<>\"']/g, '');
        }
        return input;
    }

    /**
     * Valider un email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valider la force d'une clé
     */
    isStrongKey(key) {
        return key.length >= 20 && 
               /[a-z]/.test(key) && 
               /[A-Z]/.test(key) && 
               /[0-9]/.test(key) && 
               /[^a-zA-Z0-9]/.test(key);
    }
}

// ==========================================
// CLASSE DE MONITORING DE SÉCURITÉ
// ==========================================

class SecurityMonitor {
    constructor() {
        this.loginAttempts = new Map(); // IP -> { count, lastAttempt }
        this.maxAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
    }

    /**
     * Enregistrer une tentative de connexion
     */
    recordLoginAttempt(ip, success) {
        const now = Date.now();
        const attempts = this.loginAttempts.get(ip) || { count: 0, lastAttempt: now };
        
        if (success) {
            // Réinitialiser les tentatives en cas de succès
            this.loginAttempts.delete(ip);
        } else {
            attempts.count++;
            attempts.lastAttempt = now;
            this.loginAttempts.set(ip, attempts);
        }
        
        // Log de sécurité
        this.logSecurityEvent('LOGIN_ATTEMPT', {
            ip,
            success,
            attempts: attempts.count,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Vérifier si une IP est bloquée
     */
    isBlocked(ip) {
        const attempts = this.loginAttempts.get(ip);
        if (!attempts || attempts.count < this.maxAttempts) {
            return false;
        }
        
        const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
        if (timeSinceLastAttempt > this.lockoutTime) {
            // Débloquer après le délai
            this.loginAttempts.delete(ip);
            return false;
        }
        
        return true;
    }

    /**
     * Logger les événements de sécurité
     */
    async logSecurityEvent(event, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            data
        };
        
        console.log(`🔒 [SECURITY] ${event}:`, data);
        
        // En production, écrire dans un fichier de log sécurisé
        try {
            const logFile = path.join(__dirname, 'security.log');
            await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('❌ Erreur d\'écriture du log de sécurité:', error);
        }
    }
}

// Export des classes
module.exports = {
    SecurityManager,
    SecurityMonitor,
    SECURITY_CONFIG
};
