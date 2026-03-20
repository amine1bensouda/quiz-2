# 📋 Ce Qui Reste À Faire

## ✅ Déjà Fait (100% du code)

- ✅ **Code Next.js complet** : Tous les composants et pages créés
- ✅ **Design moderne** : Animations, effets, responsive
- ✅ **TypeScript** : Types complets
- ✅ **Configuration** : Next.js, Tailwind, ESLint
- ✅ **Documentation** : Guides complets créés

---

## 🔴 À Faire - Configuration WordPress (PRIORITÉ 1)

### Installation WordPress
- [ ] **Installer WordPress** en local ou sur serveur
  - Local : Voir `INSTALLATION_WORDPRESS_LOCAL.md`
  - Serveur : Voir `DEPLOYMENT.md`
- [ ] **Accéder à l'interface** WordPress (`/wp-admin`)
- [ ] **Vérifier** que WordPress fonctionne

### Plugins WordPress (OBLIGATOIRE)
- [ ] **Custom Post Type UI** (Gratuit)
  - Installer depuis Extensions → Ajouter
  - Créer type "Quiz" avec REST API activé
  - Créer type "Question" avec REST API activé
  
- [ ] **Advanced Custom Fields Pro** ($49/an)
  - Acheter sur https://www.advancedcustomfields.com/pro/
  - Installer et activer
  - Créer groupe de champs "Quiz Details" avec tous les champs requis
  - Activer "Show in REST API" pour chaque groupe

- [ ] **ACF to REST API** (Gratuit)
  - Installer depuis Extensions → Ajouter
  - Activer
  - Vérifier que les champs ACF apparaissent dans l'API

- [ ] **WP All Import Pro** (Optionnel - $99/an)
  - Pour importer les 3000 questions
  - OU utiliser version gratuite (limite 50 par import)

### Configuration WordPress
- [ ] **Configurer CORS** dans `functions.php`
  - Ajouter le code pour autoriser Next.js à accéder à l'API
  - Voir `WORDPRESS_SETUP.md` section "Configuration CORS"
  
- [ ] **Tester l'API WordPress**
  - Visiter : `http://localhost/admin/wp-json/wp/v2/quiz`
  - Vérifier que l'API répond en JSON
  - Vérifier que les champs ACF sont présents

---

## 🟡 À Faire - Création de Contenu (PRIORITÉ 2)

### Quiz de Test
- [ ] **Créer 3-5 quiz de test** dans WordPress
  - Titre, description, image à la une
  - Remplir tous les champs ACF :
    - Durée estimée
    - Niveau de difficulté
    - Catégorie
    - Nombre de questions
    - Score minimum
    - Ordre des questions
  
- [ ] **Créer 10-20 questions de test**
  - Texte de la question
  - 2-4 réponses par question
  - Marquer la bonne réponse
  - Ajouter des explications
  
- [ ] **Lier les questions aux quiz**
  - Utiliser le champ ACF "Questions" (Relationship)
  - Assigner les questions créées

- [ ] **Créer des catégories**
  - Histoire, Géographie, Science, etc.
  - Assigner aux quiz

### Import des 3000 Questions (Optionnel)
- [ ] **Préparer le fichier CSV/XML**
  - Exporter depuis Tutor LMS
  - Nettoyer et formater les données
  - Voir `WORDPRESS_SETUP.md` section "Migration"
  
- [ ] **Importer via WP All Import**
  - Configurer le mapping des champs
  - Lancer l'import
  - Vérifier que toutes les questions sont importées

---

## 🟢 À Faire - Configuration Next.js (PRIORITÉ 3)

### Variables d'Environnement
- [ ] **Mettre à jour `.env.local`** avec la vraie URL WordPress
  ```env
  WORDPRESS_API_URL=http://localhost/admin
  # OU
  WORDPRESS_API_URL=https://admin.votresite.com
  ```

### Test de Connexion
- [ ] **Tester la connexion** Next.js ↔ WordPress
  - Lancer `npm run dev`
  - Vérifier que les quiz apparaissent sur le site
  - Tester un quiz complet (jouer, répondre, voir résultats)
  
- [ ] **Vérifier les erreurs**
  - Console du navigateur (F12)
  - Terminal Next.js
  - Corriger les erreurs éventuelles

---

## 🔵 À Faire - Configuration AdSense (PRIORITÉ 4)

### Compte AdSense
- [ ] **Créer un compte** Google AdSense
  - Aller sur https://www.google.com/adsense
  - Remplir les informations
  - Valider l'email

### Configuration
- [ ] **Ajouter le code de vérification** dans `src/app/layout.tsx`
- [ ] **Créer les blocs publicitaires** dans AdSense
  - Display Ad
  - In-Article Ad
  - Sidebar Ad
  
- [ ] **Mettre à jour `.env.local`** avec votre ID client
  ```env
  NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
  ```

- [ ] **Mettre à jour `public/ads.txt`** avec votre ID
- [ ] **Attendre l'approbation** (1-2 semaines)

---

## 🟣 À Faire - Déploiement Production (PRIORITÉ 5)

### Préparation
- [ ] **Build de production**
  ```bash
  npm run build
  ```
  - Vérifier qu'il n'y a pas d'erreurs
  
- [ ] **Tester en local** avec `npm start`
  - Vérifier que tout fonctionne

### Déploiement sur Hostinger
- [ ] **Transférer les fichiers** sur le serveur
  - Via FTP ou SSH
  - Voir `DEPLOYMENT.md`
  
- [ ] **Configurer Node.js** sur Hostinger
  - Créer l'application Node.js
  - Configurer les variables d'environnement
  
- [ ] **Configurer le domaine**
  - Sous-domaine pour WordPress (admin.votresite.com)
  - Domaine principal pour Next.js (www.votresite.com)
  
- [ ] **Configurer SSL/HTTPS**
  - Activer via Hostinger
  
- [ ] **Tester en production**
  - Vérifier que le site est accessible
  - Tester toutes les fonctionnalités

---

## 🟠 À Faire - Optimisations Finales (PRIORITÉ 6)

### SEO
- [ ] **Soumettre le sitemap** à Google Search Console
- [ ] **Configurer Google Analytics** (optionnel)
- [ ] **Vérifier** que tous les meta tags sont présents
- [ ] **Tester** les rich snippets avec Google Rich Results Test

### Performance
- [ ] **Tester** avec PageSpeed Insights
  - Objectif : Score 90+
- [ ] **Optimiser** les images si nécessaire
- [ ] **Vérifier** Core Web Vitals

### Sécurité
- [ ] **Configurer** les headers de sécurité
- [ ] **Activer** Wordfence Security sur WordPress
- [ ] **Protéger** wp-admin (IP whitelist)
- [ ] **Configurer** les backups automatiques

---

## 📊 Résumé des Priorités

### 🔴 URGENT (Pour que le site fonctionne)
1. Installer WordPress
2. Installer les plugins requis
3. Configurer ACF et les Custom Post Types
4. Créer quelques quiz de test
5. Tester la connexion API

### 🟡 IMPORTANT (Pour avoir du contenu)
1. Créer 10-20 quiz complets
2. Créer 100+ questions
3. Organiser par catégories
4. Importer les 3000 questions (si disponible)

### 🟢 NÉCESSAIRE (Pour la monétisation)
1. Configurer AdSense
2. Ajouter les blocs publicitaires
3. Tester l'affichage des publicités

### 🔵 RECOMMANDÉ (Pour la production)
1. Déployer sur serveur
2. Configurer SSL
3. Optimiser SEO
4. Configurer monitoring

---

## ⏱️ Estimation du Temps

- **Configuration WordPress** : 2-3 heures
- **Création de contenu** : 5-10 heures (selon nombre de quiz)
- **Import des questions** : 1-2 heures
- **Configuration AdSense** : 30 minutes
- **Déploiement** : 2-3 heures
- **Tests et optimisations** : 2-3 heures

**Total estimé** : 12-20 heures de travail

---

## 🎯 Prochaines Actions Immédiates

1. **Installer WordPress** (si pas encore fait)
   - Voir `INSTALLATION_WORDPRESS_LOCAL.md`
   
2. **Installer les plugins**
   - Custom Post Type UI (gratuit)
   - ACF Pro (à acheter)
   - ACF to REST API (gratuit)
   
3. **Configurer les Custom Post Types**
   - Créer "Quiz" et "Question"
   
4. **Créer un quiz de test**
   - Pour vérifier que tout fonctionne

Une fois ces 4 étapes faites, vous pourrez voir vos quiz sur le site Next.js ! 🎉





