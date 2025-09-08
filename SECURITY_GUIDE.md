# 🔒 Guide de Sécurisation TeamApp V1

## ⚠️ IMPORTANT - Checklist de Sécurité

### 🔐 **1. Configuration des Variables d'Environnement**

```bash
# Créer le fichier .env à partir du modèle
cp env.production .env

# Modifier TOUTES les valeurs par défaut !
nano .env
```

**Variables CRITIQUES à changer :**
- `MASTER_KEY` : Clé de chiffrement principale (32+ caractères)
- `AUTH_SALT` : Salt pour l'authentification (32+ caractères)  
- `SESSION_SECRET` : Secret pour les sessions (32+ caractères)

### 🛡️ **2. Sécurisation des Fichiers**

```bash
# Permissions restrictives sur les fichiers sensibles
chmod 600 .env
chmod 600 *.json
chmod 600 security.log

# Propriétaire uniquement
chown $(whoami):$(whoami) .env *.json
```

### 🌐 **3. Configuration HTTPS (OBLIGATOIRE en Production)**

```bash
# Générer des certificats SSL
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# Ou utiliser Let's Encrypt (recommandé)
certbot --nginx -d votre-domaine.com
```

### 🔥 **4. Configuration Firewall**

```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3000/tcp   # Bloquer l'accès direct Node.js

# Utiliser un reverse proxy (Nginx recommandé)
```

### 📊 **5. Monitoring et Logs**

```bash
# Installer un système de monitoring
npm install pm2 -g

# Démarrer avec PM2
pm2 start server.js --name "teamapp"
pm2 startup
pm2 save

# Monitoring des logs de sécurité
tail -f security.log
```

## 🚨 **Améliorations de Sécurité Implémentées**

### ✅ **Chiffrement des Données**
- Algorithme AES-256-GCM pour les données sensibles
- Clés de chiffrement dérivées avec scrypt
- Hashage bcrypt pour les clés d'authentification

### ✅ **Protection contre les Attaques**
- Rate limiting (5 tentatives/15min pour auth)
- Protection CSRF avec headers sécurisés
- Validation et sanitisation des entrées
- Content Security Policy (CSP)

### ✅ **Monitoring de Sécurité**
- Logs détaillés des tentatives de connexion
- Blocage automatique des IPs suspectes
- Alertes en temps réel sur les événements

### ✅ **Sécurité des Sessions**
- Tokens de session cryptographiquement sécurisés
- Expiration automatique (30 jours max)
- Invalidation immédiate à la déconnexion

## 🔧 **Configuration Nginx (Recommandée)**

```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Sécurité SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}
```

## 🔍 **Tests de Sécurité**

### **Test de Rate Limiting**
```bash
# Tester les limites de connexion
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"key":"fausse-cle","rememberMe":false}'
done
```

### **Test de Validation**
```bash
# Tester la validation des entrées
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"key":"<script>alert(1)</script>","rememberMe":"invalid"}'
```

## 🚨 **Alertes et Incidents**

### **Surveillance des Logs**
```bash
# Surveiller les tentatives suspectes
grep "FAILED_LOGIN" security.log | tail -20

# Surveiller les IPs bloquées
grep "BLOCKED_LOGIN_ATTEMPT" security.log
```

### **Actions en Cas d'Incident**
1. **Tentatives de brute force** → IP automatiquement bloquée
2. **Accès non autorisé** → Générer nouvelles clés
3. **Compromission** → Révoquer toutes les sessions
4. **Attaque persistante** → Bloquer au niveau firewall

## 📈 **Améliorations Futures Recommandées**

### **Base de Données**
- Migrer vers PostgreSQL avec chiffrement
- Sauvegardes chiffrées automatiques
- Réplication pour haute disponibilité

### **Authentification Avancée**
- Authentification à deux facteurs (2FA)
- Intégration OAuth2 (Google, Microsoft)
- Certificats clients pour l'accès admin

### **Infrastructure**
- Déploiement en containers (Docker)
- Load balancer avec SSL termination
- CDN pour les assets statiques

## 🆘 **Support et Maintenance**

### **Mise à Jour de Sécurité**
```bash
# Vérifier les vulnérabilités
npm audit

# Mettre à jour les dépendances
npm update

# Redémarrer avec PM2
pm2 restart teamapp
```

### **Backup de Sécurité**
```bash
# Script de sauvegarde automatique
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "backup_teamapp_$DATE.tar.gz" *.json .env security.log
gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output "backup_teamapp_$DATE.tar.gz.gpg" "backup_teamapp_$DATE.tar.gz"
rm "backup_teamapp_$DATE.tar.gz"
```

---

⚠️ **RAPPEL CRITIQUE** : Changez TOUTES les valeurs par défaut avant la mise en production !
