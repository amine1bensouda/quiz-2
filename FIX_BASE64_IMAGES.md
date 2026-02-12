# 🔧 Résolution : Images Base64 qui s'affichent parfois

## ❌ Problème Identifié

Les images base64 dans le contenu WYSIWYG s'affichent parfois et parfois non. Cela peut être dû à plusieurs raisons :

1. **Images base64 tronquées** lors du stockage/récupération
2. **Images base64 corrompues** lors de la sérialisation JSON
3. **Images base64 trop grandes** causant des problèmes de performance
4. **Problèmes de cache** du navigateur
5. **Erreurs de chargement** non gérées

---

## ✅ Solutions Implémentées

### 1. Composant `SafeHtmlRenderer`

Un nouveau composant a été créé pour gérer correctement les images base64 :

- **Détection automatique** des images base64
- **Validation** de l'intégrité des images
- **Gestion des erreurs** avec placeholders
- **Attributs optimisés** (`loading="lazy"`, `decoding="async"`)

**Fichier :** `src/components/Common/SafeHtmlRenderer.tsx`

### 2. Utilisation dans les Pages

Le composant est maintenant utilisé dans :
- `src/app/quiz/course/[slug]/page.tsx` - Page publique du cours
- `src/app/admin/courses/page.tsx` - Page admin des cours

---

## 🔍 Diagnostic

### Vérifier si les Images sont Tronquées

Ouvrez la console du navigateur (F12) et vérifiez les erreurs :

```javascript
// Dans la console
document.querySelectorAll('img[src^="data:image"]').forEach(img => {
  console.log('Image base64:', img.src.substring(0, 100));
  console.log('Taille:', img.src.length);
  console.log('Complète:', img.complete);
});
```

### Vérifier dans la Base de Données

Si vous avez accès à la base de données :

```sql
-- Vérifier la longueur de la description
SELECT 
  id, 
  title, 
  LENGTH(description) as description_length,
  SUBSTRING(description, 1, 100) as description_preview
FROM "Course"
WHERE description LIKE '%data:image%';
```

---

## 🚀 Solutions Recommandées

### Solution 1 : Convertir les Images Base64 en URLs (Recommandé)

Au lieu de stocker les images en base64 dans le contenu, convertissez-les en fichiers et stockez les URLs :

1. **Créer une API pour uploader les images** :
```typescript
// src/app/api/admin/upload-image/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Upload vers un service de stockage (Cloudinary, AWS S3, etc.)
  // Retourner l'URL de l'image
}
```

2. **Modifier le RichTextEditor** pour uploader les images au lieu de les convertir en base64 :
```typescript
// Dans RichTextEditor.tsx
const imageHandler = () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = async () => {
    const file = input.files?.[0];
    if (file) {
      // Upload l'image et obtenir l'URL
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });
      const { url } = await response.json();
      
      // Insérer l'URL dans l'éditeur
      const quill = quillRef.current;
      const range = quill.getSelection();
      quill.insertEmbed(range.index, 'image', url);
    }
  };
};
```

### Solution 2 : Limiter la Taille des Images Base64

Si vous devez utiliser base64, limitez la taille :

```typescript
// Fonction pour compresser les images avant conversion base64
function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    };
  });
}
```

### Solution 3 : Augmenter la Limite de Taille dans Prisma

Si les images base64 sont tronquées dans la base de données :

```prisma
// prisma/schema.prisma
model Course {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String?  @db.Text // Utiliser Text au lieu de String pour les grandes chaînes
  // ...
}
```

Puis migrer :
```bash
npx prisma migrate dev --name increase_description_size
```

---

## 🔧 Améliorations Futures

### 1. Système de Cache pour les Images

Créer un système de cache pour les images base64 :

```typescript
// Cache les images base64 en localStorage
const imageCache = {
  get: (key: string) => {
    try {
      return localStorage.getItem(`img_${key}`);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(`img_${key}`, value);
    } catch {
      // Ignorer si localStorage est plein
    }
  },
};
```

### 2. Lazy Loading Amélioré

Utiliser Intersection Observer pour charger les images uniquement quand elles sont visibles :

```typescript
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  });

  containerRef.current?.querySelectorAll('img[data-src]').forEach((img) => {
    observer.observe(img);
  });

  return () => observer.disconnect();
}, [processedHtml]);
```

---

## 📝 Notes Importantes

- **Les images base64 sont très volumineuses** - 1 image de 100KB devient ~133KB en base64
- **Les images base64 ralentissent le chargement** - Elles sont incluses dans le HTML
- **Les images base64 peuvent être tronquées** - Limites de taille dans les bases de données
- **Recommandation** : Utilisez un service de stockage d'images (Cloudinary, AWS S3, etc.)

---

## ✅ Vérification

Après les corrections :

1. **Vérifiez que les images s'affichent** sur la page du cours
2. **Vérifiez la console** pour les erreurs d'images
3. **Testez avec différentes images** pour voir si le problème persiste
4. **Vérifiez les performances** - Les images base64 peuvent ralentir le chargement

---

## 🆘 Si le Problème Persiste

1. **Vérifiez les logs** du navigateur (F12 → Console)
2. **Vérifiez la taille** des images base64 dans la base de données
3. **Testez avec des images plus petites** pour voir si c'est un problème de taille
4. **Envisagez de migrer** vers un système de stockage d'images externe
