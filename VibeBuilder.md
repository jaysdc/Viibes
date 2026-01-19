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

*Dernière mise à jour: Session actuelle*
