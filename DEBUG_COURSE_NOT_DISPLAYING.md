# 🔍 Débogage : Cours publié ne s'affiche pas

## ✅ Checklist de vérification

### 1. Vérifier le statut du cours dans la base de données

Le cours doit avoir le statut `'published'` (pas `'draft'`).

**Vérification dans l'interface admin :**
- Allez sur `/admin/courses`
- Vérifiez que le cours affiche "✅ Published" (pas "📝 Draft")
- Si c'est "Draft", cliquez sur le bouton pour le publier

**Vérification via l'API :**
```bash
# Tester l'API directement
curl https://votre-site.vercel.app/api/courses
```

Vous devriez voir votre cours dans la liste si son statut est `'published'`.

---

### 2. Vérifier que le cours a des modules

Un cours sans modules ne s'affichera pas correctement.

**Vérification :**
- Allez sur `/admin/courses/[id]/edit`
- Vérifiez que le cours a au moins un module assigné
- Si pas de module, créez-en un dans `/admin/modules`

---

### 3. Vérifier que les modules ont des quiz publiés

Les modules doivent avoir au moins un quiz avec le statut `'published'`.

**Vérification :**
- Allez sur `/admin/modules`
- Vérifiez que chaque module a des quiz assignés
- Vérifiez que les quiz ont le statut `'published'`

---

### 4. Vérifier le cache ISR (Incremental Static Regeneration)

Next.js utilise un cache ISR avec une revalidation de 3600 secondes (1 heure).

**Solutions :**

**Option A : Attendre 1 heure**
- Le cache se mettra à jour automatiquement après 1 heure

**Option B : Forcer la revalidation (recommandé)**

Ajoutez une route API pour forcer la revalidation :

```typescript
// src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { path, secret } = await request.json();

    // Vérifier le secret pour la sécurité
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    // Revalider les chemins
    revalidatePath('/quiz');
    revalidatePath('/');
    revalidatePath(`/quiz/course/${path}`);

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
```

Puis appelez cette API après avoir publié un cours :

```bash
curl -X POST https://votre-site.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"path": "votre-course-slug", "secret": "votre-secret"}'
```

**Option C : Redéployer sur Vercel**
- Allez sur Vercel → Deployments
- Cliquez sur "Redeploy" sur le dernier déploiement

---

### 5. Vérifier les filtres sur la page d'accueil

La page d'accueil (`/`) n'affiche que les cours qui correspondent à :
- **ACT** : titre ou slug contient "act"
- **SAT** : titre ou slug contient "sat" (mais pas "psat")
- **PSAT/NMSQT** : titre ou slug contient "psat"

**Si votre cours ne correspond à aucun de ces filtres :**
- Il ne s'affichera pas sur la page d'accueil
- Mais il devrait s'afficher sur `/quiz`

**Solution :**
- Vérifiez que le titre ou le slug de votre cours contient l'un de ces mots-clés
- Ou modifiez le titre/slug pour correspondre

---

### 6. Vérifier les logs de la console

Ouvrez la console du navigateur (F12) et vérifiez :
- Erreurs JavaScript
- Requêtes API qui échouent
- Messages d'erreur dans la console

---

### 7. Vérifier la base de données directement

Si vous avez accès à la base de données :

```sql
-- Vérifier le statut du cours
SELECT id, title, slug, status FROM "Course" WHERE slug = 'votre-slug';

-- Vérifier les modules du cours
SELECT m.id, m.title, m."courseId", COUNT(q.id) as quiz_count
FROM "Module" m
LEFT JOIN "Quiz" q ON q."moduleId" = m.id AND q.status = 'published'
WHERE m."courseId" = 'votre-course-id'
GROUP BY m.id, m.title, m."courseId";

-- Vérifier les quiz publiés
SELECT id, title, slug, status, "moduleId"
FROM "Quiz"
WHERE "moduleId" IN (
  SELECT id FROM "Module" WHERE "courseId" = 'votre-course-id'
)
AND status = 'published';
```

---

## 🚀 Solution rapide

1. **Vérifiez le statut dans l'admin** : `/admin/courses`
2. **Assurez-vous que le cours a des modules avec des quiz publiés**
3. **Redéployez sur Vercel** pour forcer la mise à jour du cache
4. **Vérifiez sur `/quiz`** (pas seulement sur la page d'accueil)

---

## 📝 Notes importantes

- **Page d'accueil (`/`)** : Affiche uniquement les cours ACT/SAT/PSAT
- **Page `/quiz`** : Affiche TOUS les cours publiés
- **Cache ISR** : Les pages sont mises en cache pendant 1 heure
- **Statut requis** : Le cours ET les quiz doivent être `'published'`

---

## 🔧 Si le problème persiste

1. Vérifiez les logs Vercel pour voir les erreurs serveur
2. Vérifiez que la base de données est accessible depuis Vercel
3. Vérifiez que `DATABASE_URL` est correctement configurée dans Vercel
4. Contactez le support avec les détails de votre problème
