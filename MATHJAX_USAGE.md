# Guide d'utilisation de LaTeX avec MathJax

## Support MathJax ajouté

Le système supporte maintenant **MathJax** en plus de **KaTeX** pour le rendu des formules mathématiques LaTeX.

## Format des formules

### Formules inline (dans le texte)
Utilisez des simples dollars `$...$` :

```
La formule $x^2 + y^2 = r^2$ représente un cercle.
```

### Formules en bloc (centrées)
Utilisez des doubles dollars `$$...$$` :

```
La formule quadratique est :
$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
```

## Utilisation dans le code

### Par défaut : KaTeX (rapide)
Le composant `MathRenderer` utilise KaTeX par défaut :

```tsx
<MathRenderer text="La formule $x^2$ est importante." />
```

### Utiliser MathJax (meilleur support LaTeX)
Pour utiliser MathJax, passez la prop `useMathJax={true}` :

```tsx
<MathRenderer 
  text="La formule $x^2$ est importante." 
  useMathJax={true} 
/>
```

## Avantages de MathJax vs KaTeX

### MathJax
- ✅ **Meilleur support LaTeX** : Supporte plus de packages et commandes LaTeX
- ✅ **Plus complet** : Meilleur pour les formules complexes
- ✅ **Standard** : Utilisé par de nombreux sites académiques
- ⚠️ **Plus lent** : Charge depuis CDN, peut être plus lent au premier chargement

### KaTeX (par défaut)
- ✅ **Plus rapide** : Rendu instantané, pas de chargement externe
- ✅ **Léger** : Inclus dans le bundle
- ⚠️ **Support limité** : Ne supporte pas tous les packages LaTeX

## Exemples de syntaxe LaTeX

### Opérations de base
- `$x + y$` → x + y
- `$x^2$` → x²
- `$\sqrt{x}$` → √x
- `$\frac{a}{b}$` → fraction a/b
- `$\int_0^1 x^2 dx$` → intégrale
- `$\sum_{i=1}^{n} i$` → somme

### Formules complexes avec MathJax

**Matrices :**
```
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$
```

**Systèmes d'équations :**
```
$$
\begin{cases}
x + y = 5 \\
2x - y = 1
\end{cases}
$$
```

**Alignement :**
```
$$
\begin{align}
x &= 2 + 3 \\
  &= 5
\end{align}
$$
```

## Où utiliser ce format ?

Ce format fonctionne dans :
- ✅ Le texte de la question
- ✅ Les réponses (texte des options)
- ✅ Les explications
- ✅ Tous les champs de texte qui utilisent le composant `MathRenderer`

## Activation globale de MathJax

Si vous voulez utiliser MathJax partout par défaut, vous pouvez modifier les composants pour passer `useMathJax={true}` :

```tsx
// Dans Question.tsx, QuizCorrection.tsx, etc.
<MathRenderer text={questionText || ''} useMathJax={true} />
```

## Notes importantes

1. **Syntaxe LaTeX standard** : Utilisez la syntaxe LaTeX standard supportée par MathJax/KaTeX
2. **Échappement** : Les backslashes sont automatiquement gérés
3. **HTML** : Le HTML est nettoyé automatiquement, mais les formules LaTeX sont préservées
4. **Sauts de ligne** : Les sauts de ligne sont préservés pour une meilleure lisibilité

## Support des packages LaTeX

### MathJax supporte :
- `amsmath`, `amssymb`, `amsfonts`
- `mathtools`
- `cases`, `matrix`, `align`, `equation`
- Et bien plus...

### KaTeX supporte :
- Syntaxe LaTeX de base
- Quelques packages limités

Pour des formules très complexes, utilisez **MathJax** avec `useMathJax={true}`.
