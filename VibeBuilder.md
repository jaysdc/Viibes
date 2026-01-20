# VibeBuilder - Journal des Modifications

## Vue d'ensemble

Le VibeBuilder est le composant qui permet de créer des Vibes personnalisées en sélectionnant des morceaux spécifiques parmi toutes les sources disponibles.

---

## Modifications Effectuées

### 1. Fix du Glow Néon sur les Capsules LET'S VIBE / GHOSTING

**Problème:** Le glow CSS (`box-shadow`) était coupé par `overflow-hidden` sur le conteneur parent.

**Solution:**
- Ajout de `overflow-visible` sur le conteneur parent
- Utilisation de valeurs d'inset négatives sur la capsule pour lui permettre de déborder

```jsx
<div
  className="absolute rounded-full flex items-center justify-center animate-pop border-2 animate-neon-glow"
  style={{
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    '--neon-color': dragState.isAddingMode ? CONFIG.NEON_COLOR_CYAN : CONFIG.NEON_COLOR_ORANGE,
    backgroundColor: dragState.isAddingMode ? '#00D5FF' : '#FF6700',
    borderColor: dragState.isAddingMode ? '#00D5FF' : '#FF6700',
  }}
>
```

---

### 2. Masquage du Glow des Boutons Header pendant les Overlays

**Ajout de conditions pour masquer le glow:**
- Pendant le drag SmartWave (`dragState`)
- Pendant le swipe de preview gradient (`cardSwipeOffset !== 0`)

```jsx
hideGlow={showSortDropdown || showFilterDropdown || isFullscreen || dragState || cardSwipeOffset !== 0}
```

---

### 3. SmartWave - Défilement Continu avec setInterval

**Ancien comportement:** Scroll uniquement sur touchmove
**Nouveau comportement:** Scroll continu basé sur setInterval

**Configuration:**
```javascript
const SCROLL_ZONE = rowHeightRef.current * 3;  // 3 lignes du bord = déclenchement
const SCROLL_SPEED = 15;                        // Pixels par tick
const SCROLL_INTERVAL = 25;                     // ms entre chaque scroll
```

**Nouveaux refs:**
- `scrollIntervalRef` - Référence de l'interval
- `touchYRelativeRef` - Position Y relative au viewport

**Logique:**
1. Au touchstart, on enregistre la position Y relative
2. Au touchmove, on met à jour la position Y relative
3. Un setInterval vérifie continuellement si on est dans une zone de scroll
4. Le scroll continue tant que le doigt reste dans la zone

---

### 4. Bouton Fermer (X) avec Animation Ignite

**Nouvel état:**
```javascript
const [isClosingWithX, setIsClosingWithX] = useState(false);
```

**Animation CSS ajoutée:**
```css
@keyframes ignite {
  0% { box-shadow: 0 0 10px rgba(244, 63, 94, 0.4), 0 0 20px rgba(185, 28, 28, 0.2); }
  15% { box-shadow: 0 0 25px rgba(244, 63, 94, 1), 0 0 50px rgba(185, 28, 28, 0.8); }
  30% { box-shadow: 0 0 40px rgba(244, 63, 94, 1), 0 0 80px rgba(185, 28, 28, 1), 0 0 120px rgba(234, 88, 12, 0.6); }
  50% { box-shadow: 0 0 50px rgba(244, 63, 94, 1), 0 0 100px rgba(185, 28, 28, 1), 0 0 150px rgba(234, 88, 12, 0.8); }
  70% { box-shadow: 0 0 40px rgba(244, 63, 94, 0.9), 0 0 80px rgba(185, 28, 28, 0.8), 0 0 120px rgba(234, 88, 12, 0.5); }
  100% { box-shadow: 0 0 25px rgba(244, 63, 94, 0.7), 0 0 50px rgba(185, 28, 28, 0.5); }
}
.animate-ignite {
  animation: ignite 0.3s ease-out forwards;
}
```

**Comportement:** Au tap sur X, l'animation ignite se joue pendant 300ms puis `handleClose('left')` est appelé.

---

### 5. Capsule Liquid Glass Centrée

**Ancien:** Position fixe à gauche
```jsx
left: CONFIG.CAPSULE_LEFT
```

**Nouveau:** Centrage avec transform
```jsx
left: '50%',
transform: 'translateX(-50%)'
```

---

### 6. Effet Knockout/Cutout sur Boutons X et +

**Technique:** Utilisation de `mix-blend-mode: multiply` avec icônes noires

```jsx
<div style={{ isolation: 'isolate' }}>
  <svg style={{ mixBlendMode: 'multiply' }} fill="black">
    {/* icône */}
  </svg>
</div>
```

**Résultat:** Les icônes créent un effet d'évidement dans le fond coloré.

---

### 7. Indicateurs de Fade Dynamiques (Scroll)

**Configuration:**
```javascript
LIST_FADE_HEIGHT: '6rem',      // Hauteur du fade (~3 lignes)
LIST_FADE_OPACITY: 0.95,       // Opacité max du blanc
```

**Implémentation:**
- Fade supérieur: visible quand `scrollTop > 10`
- Fade inférieur: visible quand pas tout en bas

```jsx
{/* Fade supérieur */}
<div
  className="absolute top-0 left-0 right-0 pointer-events-none z-10 transition-opacity duration-300"
  style={{
    height: CONFIG.LIST_FADE_HEIGHT,
    background: `linear-gradient(to bottom, rgba(255,255,255,${CONFIG.LIST_FADE_OPACITY}) 0%, rgba(255,255,255,0) 100%)`,
    opacity: showTopFade ? 1 : 0
  }}
/>

{/* Fade inférieur */}
<div
  className="absolute bottom-0 left-0 right-0 pointer-events-none z-10 transition-opacity duration-300"
  style={{
    height: CONFIG.LIST_FADE_HEIGHT,
    background: `linear-gradient(to top, rgba(255,255,255,${CONFIG.LIST_FADE_OPACITY}) 0%, rgba(255,255,255,0) 100%)`,
    opacity: showBottomFade ? 1 : 0
  }}
/>
```

---

### 8. Liste ne Chevauche Plus le Footer

**Problème:** La liste avec `inset-0` passait sous la carte preview en bas.

**Solution:** Calcul explicite de `bottom` excluant le footer.

**Import ajouté:**
```javascript
import { UNIFIED_CONFIG, SafeAreaSpacer, CylinderMask, SAFE_AREA_HEIGHT_CSS } from './Config.jsx';
```

**Configuration:**
```javascript
BOTTOM_CARD_PADDING_TOP: 12,  // Padding au-dessus de la carte preview (px)
```

**Implémentation:**
```jsx
<div
  ref={listRef}
  className="absolute left-0 right-0 top-0 no-scrollbar z-0 overflow-y-auto"
  style={{
    bottom: `calc(${CONFIG.BOTTOM_CARD_PADDING_TOP}px + ${vibeCardConfig?.height || '9vh'} + ${SAFE_AREA_HEIGHT_CSS})`
  }}
>
```

---

### 9. Unification des Couleurs SmartWave

**Thème de couleurs:**
- **Ajout (Adding):** Cyan `#00D5FF`
- **Retrait (Removing):** Orange `#FF6700`

**Éléments concernés:**

#### Marée (zone de sélection)
```jsx
backgroundColor: dragState.isAddingMode
  ? 'rgba(0, 213, 255, 0.3)'   // Cyan transparent
  : 'rgba(255, 103, 0, 0.3)'   // Orange transparent
```
*Note: Bordure retirée*

#### Capsule LET'S VIBE / GHOSTING
```jsx
backgroundColor: dragState.isAddingMode ? '#00D5FF' : '#FF6700'
borderColor: dragState.isAddingMode ? '#00D5FF' : '#FF6700'
'--neon-color': dragState.isAddingMode ? CONFIG.NEON_COLOR_CYAN : CONFIG.NEON_COLOR_ORANGE
```

#### Checkboxes sélectionnées
```jsx
style={{
  backgroundColor: isSelected ? '#00D5FF' : undefined
}}
```

#### Titres des chansons sélectionnées
```jsx
className={`font-bold truncate ${!isSongAvailable(song) ? 'text-gray-400' : !isSelected ? 'text-gray-900' : ''}`}
style={{ color: isSelected && isSongAvailable(song) ? '#1f76a4' : undefined }}
```
*Couleur: `#1f76a4` (bleu-vert foncé)*

---

## Configuration Complète Ajoutée

```javascript
// Dans CONFIG du VibeBuilder

// FADE SCROLL (indicateur de contenu non visible)
LIST_FADE_HEIGHT: '6rem',
LIST_FADE_OPACITY: 0.95,

// BOTTOM BAR (carte preview en bas)
BOTTOM_CARD_PADDING_TOP: 12,

// COULEURS NEON (pour animation glow)
NEON_COLOR_CYAN: '0, 213, 255',
NEON_COLOR_ORANGE: '255, 103, 0',
```

---

## Fichiers Modifiés

| Fichier | Modifications |
|---------|---------------|
| `src/VibeBuilder.jsx` | Toutes les modifications listées ci-dessus |
| `src/App.jsx` | `DRAWER_INERTIA_MULTIPLIER`: 20 → 30 |

---

## Notes Techniques

### Glow et Overflow
Le `box-shadow` CSS est coupé par `overflow: hidden`. Pour contourner:
1. Mettre `overflow: visible` sur le parent
2. Utiliser des valeurs d'inset négatives pour que l'élément déborde

### Calcul de Hauteur Footer
```
bottom = BOTTOM_CARD_PADDING_TOP (12px)
       + vibeCardConfig.height (12vh = UNIFIED_CONFIG.VIBECARD_BUILDER_HEIGHT_VH)
       + SAFE_AREA_HEIGHT_CSS (env(safe-area-inset-bottom))
```

### Mix-Blend-Mode Multiply
Pour créer un effet knockout/cutout:
1. Ajouter `isolation: isolate` au conteneur
2. Appliquer `mix-blend-mode: multiply` à l'élément noir
3. Le noir "perce" le fond coloré

---

## Session du 20 Janvier 2026 - Modifications

### 10. Changement de l'Inertie du Drawer (Dashboard)

**Fichier:** `src/App.jsx`

**Modification:**
```javascript
DRAWER_INERTIA_MULTIPLIER: 30 → 25
```

---

### 11. Animation de Création de Vibe (Carte Future)

**Problème:** L'animation `blink-3` n'était pas assez impactante.

**Solution:** Remplacement par `neon-ignite-card` - 3 pulsations avec glow.

```css
@keyframes neon-ignite-card {
  0% { opacity: 0.3; box-shadow: 0 0 8px var(--glow-color), 0 0 16px var(--glow-color); }
  15% { opacity: 1; box-shadow: 0 0 20px var(--glow-color), 0 0 40px var(--glow-color), 0 0 60px var(--glow-color); }
  25% { opacity: 0.4; box-shadow: 0 0 10px var(--glow-color), 0 0 20px var(--glow-color); }
  40% { opacity: 1; box-shadow: 0 0 25px var(--glow-color), 0 0 50px var(--glow-color), 0 0 75px var(--glow-color); }
  55% { opacity: 0.7; box-shadow: 0 0 15px var(--glow-color), 0 0 30px var(--glow-color); }
  70% { opacity: 1; box-shadow: 0 0 20px var(--glow-color), 0 0 40px var(--glow-color), 0 0 60px var(--glow-color); }
  100% { opacity: 1; box-shadow: 0 0 20px var(--glow-color), 0 0 40px var(--glow-color); }
}
```

---

### 12. Animation Ignite Unifiée pour Boutons X et +

**Objectif:** Les deux boutons (fermer X et créer +) utilisent la MÊME animation avec des couleurs différentes via variables CSS.

**Animation CSS (version finale - EN COURS D'AMÉLIORATION):**
```css
/* Animation ignite - Double scale, couleur reste jusqu'à 70% puis retour blanc */
@keyframes ignite {
  0% { transform: translateY(-50%) scale(1.2); background: var(--ignite-color); box-shadow: 0 0 20px var(--ignite-glow), 0 0 40px var(--ignite-glow-soft); }
  20% { transform: translateY(-50%) scale(1); background: var(--ignite-color); box-shadow: 0 0 20px var(--ignite-glow), 0 0 40px var(--ignite-glow-soft); }
  40% { transform: translateY(-50%) scale(1.2); background: var(--ignite-color); box-shadow: 0 0 20px var(--ignite-glow), 0 0 40px var(--ignite-glow-soft); }
  70% { transform: translateY(-50%) scale(1); background: var(--ignite-color); box-shadow: 0 0 20px var(--ignite-glow), 0 0 40px var(--ignite-glow-soft); }
  100% { transform: translateY(-50%) scale(1); background: white; box-shadow: none; }
}
.animate-ignite {
  animation: ignite 0.8s ease-out forwards;
}
```

**Comportement visuel:**
- 0% : scale 1.2 + couleur
- 20% : scale 1 + couleur
- 40% : scale 1.2 + couleur (2ème grossissement)
- 70% : scale 1 + couleur
- 100% : scale 1 + blanc (retour progressif sur les 30 derniers %)

**Variables CSS par bouton:**

#### Bouton X (fermer) - Bleu glacial
```jsx
style={{
  '--ignite-color': '#F0F8FF',
  '--ignite-glow': 'rgba(173, 216, 230, 0.8)',
  '--ignite-glow-soft': 'rgba(173, 216, 230, 0.4)',
}}
```
- L'icône X devient rouge (`#ef4444`) pendant l'animation
- Après 800ms, `handleClose('left')` est appelé

#### Bouton + (créer) - Rouge
```jsx
style={{
  '--ignite-color': '#ef4444',
  '--ignite-glow': 'rgba(239, 68, 68, 0.8)',
  '--ignite-glow-soft': 'rgba(239, 68, 68, 0.4)',
}}
```
- Se déclenche quand on tap + sans avoir sélectionné de morceaux
- L'icône + garde sa couleur originale (PAS de changement de couleur)
- Timeout de 800ms pour correspondre à la durée de l'animation

**Commentaire utilisateur:** "c'est nul à chier" - L'animation nécessite encore des ajustements. Le paroxysme de la taille doit être EXACTEMENT synchronisé avec le paroxysme de la couleur.

---

### 13. Suppression du Hover sur la Loupe (Search)

**Modification:** Retrait de `hover:text-gray-600` pour que la loupe reste `text-gray-400` en permanence.

---

### 14. Correction du Glow des Capsules LET'S VIBE / GHOSTING

**Problème initial:** Le glow n'apparaissait pas malgré `overflow-visible`.

**Analyse:** La version précédente avait une div SÉPARÉE transparente avec `boxShadow` explicite pour le glow. Cette div avait été supprimée par erreur lors d'une simplification.

**Solution:** Remettre la div séparée pour le glow :
```jsx
{/* Div séparée pour le glow */}
<div
  style={{
    position: 'absolute',
    inset: 0,
    backgroundColor: 'transparent',
    boxShadow: `0 0 20px rgba(${neonColor}, 0.8), 0 0 40px rgba(${neonColor}, 0.4)`,
  }}
/>
```

---

## Problèmes Identifiés (À Résoudre)

### Animation Ignite - Désynchronisation

**Symptôme:** Sur le bouton +, le changement de taille (scale) et le changement de couleur ne sont pas parfaitement synchronisés frame par frame.

**Attendu:** Le PAROXYSME de la taille (scale 1.2) doit être EXACTEMENT au même moment que le PAROXYSME de la couleur rouge.

**Tentatives:**
1. Deux animations séparées (ignite et ignite-red) → Même problème
2. Une seule animation avec variables CSS → Même problème
3. Ajustement des keyframes → En cours

**Note:** L'utilisateur a vérifié frame par frame et confirme la désynchronisation.

---

## Fichiers Modifiés (Session du 20 Janvier)

| Fichier | Modifications |
|---------|---------------|
| `src/VibeBuilder.jsx` | Animation ignite unifiée, variables CSS, timeout 800ms |
| `src/App.jsx` | `DRAWER_INERTIA_MULTIPLIER`: 30 → 25 |

---

*Dernière mise à jour: 20 Janvier 2026*
