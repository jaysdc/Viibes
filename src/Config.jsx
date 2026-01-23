import React from 'react';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║              DÉGRADÉS (GRADIENTS) - Liste complète                        ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

export const ALL_GRADIENTS = [
    // ===== BICOLORES =====
    // 1. Miami Vice
    ['#f472b6', '#fb923c'],
    // 2. Lava Flow
    ['#f43f5e', '#b91c1c'],
    // 3. Coral Neon
    ['#fffC00', '#ff07a3'],
    // 4. Glitch City
    ['#1d4ed8', '#22d3ee'],
    // 5. Galactic Haze
    ['#a21caf', '#312e81'],
    // 6. Arcade Glow
    ['#a855f7', '#3b82f6'],
    // 7. Radioactive Pulse
    ['#4ade80', '#fde047'],
    // 8. Overload
    ['#00FFFF', '#FF00FF'],
    // 9. Bio-Luminescence
    ['#67e8f9', '#4ade80'],
    // 10. 8-bit Dream
    ['#38bdf8', '#a855f7'],
    // 11. Fuchsia Overdose
    ['#ec4899', '#ff07a3'],
    // ===== TRICOLORES =====
    // 12. Solar Flare
    ['#facc15', '#f97316', '#dc2626'],
    // 13. Cosmic Twilight
    ['#ec4899', '#9333ea', '#3730a3'],
    // 14. Jungle Rave
    ['#a3e635', '#22c55e', '#0d9488'],
    // 15. Electric Lagoon
    ['#01ffe5', '#57a9ed', '#a855f7'],
    // 16. Synthwave Dream
    ['#c026d3', '#7e22ce', '#fb923c'],
    // 17. Aurora Borealis
    ['#0f766e', '#06b6d4', '#c084fc'],
    // 18. Neo-Tokyo Nights
    ['#3b82f6', '#d946ef', '#f97316'],
    // 19. Circuit Grid
    ['#7e22ce', '#22d3ee', '#84cc16'],
    // ===== 5-COLORS =====
    // 20. Dawn Sky
    ['#1e3a8a', '#60a5fa', '#f9a8d4', '#fde047', '#fed7aa'],
];

// Noms des dégradés (même ordre que ALL_GRADIENTS)
export const GRADIENT_NAMES = [
    'Miami Vice',
    'Lava Flow',
    'Coral Neon',
    'Glitch City',
    'Galactic Haze',
    'Arcade Glow',
    'Radioactive Pulse',
    'Overload',
    'Bio-Luminescence',
    '8-bit Dream',
    'Fuchsia Overdose',
    'Solar Flare',
    'Cosmic Twilight',
    'Jungle Rave',
    'Electric Lagoon',
    'Synthwave Dream',
    'Aurora Borealis',
    'Neo-Tokyo Nights',
    'Circuit Grid',
    'Dawn Sky',
];

// Fonction pour obtenir un gradient par index (avec wrapping)
export const getGradientByIndex = (index) => {
    const safeIndex = ((index % ALL_GRADIENTS.length) + ALL_GRADIENTS.length) % ALL_GRADIENTS.length;
    return ALL_GRADIENTS[safeIndex];
};

// Fonction pour obtenir le nom d'un gradient par index
export const getGradientName = (index) => {
    const safeIndex = ((index % GRADIENT_NAMES.length) + GRADIENT_NAMES.length) % GRADIENT_NAMES.length;
    return GRADIENT_NAMES[safeIndex];
};

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║              SAFE AREA INSETS (lus au démarrage via JavaScript)           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// Fonction pour lire env(safe-area-inset-bottom) en VRAIS pixels
const getSafeAreaBottom = () => {
    if (typeof window === 'undefined') return 0;

    // Créer un élément temporaire pour lire la valeur CSS
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.bottom = '0';
    div.style.height = 'env(safe-area-inset-bottom, 0px)';
    div.style.visibility = 'hidden';
    document.body.appendChild(div);

    const height = div.getBoundingClientRect().height;
    document.body.removeChild(div);

    return height * window.devicePixelRatio;
};

// Variable globale avec la valeur de safe-area-inset-bottom en pixels
export const SAFE_AREA_BOTTOM = getSafeAreaBottom();

// Fonction pour lire env(safe-area-inset-top) en VRAIS pixels
const getSafeAreaTop = () => {
    if (typeof window === 'undefined') return 0;

    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.height = 'env(safe-area-inset-top, 0px)';
    div.style.visibility = 'hidden';
    document.body.appendChild(div);

    const height = div.getBoundingClientRect().height;
    document.body.removeChild(div);

    return height * window.devicePixelRatio;
};

// Variable globale avec la valeur de safe-area-inset-top en pixels
export const SAFE_AREA_TOP = getSafeAreaTop();

// Fonction pour convertir une valeur CSS (rem, px, etc.) en VRAIS pixels
const cssToPixels = (cssValue) => {
    if (typeof window === 'undefined') return 0;

    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.visibility = 'hidden';
    div.style.height = cssValue;
    document.body.appendChild(div);

    const height = div.getBoundingClientRect().height;
    document.body.removeChild(div);

    return height * window.devicePixelRatio;
};

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║              MASQUE CYLINDRIQUE 3D (30 tranches d'opacité)                 ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// Valeurs d'ajustement d'opacité pour simuler un effet cylindrique 3D
// Chaque valeur représente un delta d'opacité (-0.35 à +0.25) appliqué à une tranche
export const CAPSULE_CYLINDER_SLICES = [
    -0.10,
    -0.05,
    0.00,
    0.08,
    0.15,
    0.25,
    0.35,
    0.60,
    0.35,
    0.25,
    0.15,
    0.08,
    0.00,
    0.00,
    0.00,
    -0.02,
    -0.04,
    -0.06,
    -0.08,
    -0.10,
    -0.12,
    -0.14,
    -0.16,
    -0.18,
    -0.20,
    -0.22,
    -0.24,
    -0.27,
    -0.31,
    -0.32
];

// Composant masque cylindre 3D réutilisable
// intensity: 0-1 (force de l'effet)
// className: classes CSS additionnelles (ex: 'rounded-full' pour les capsules)
// is3DMode: contrôle l'affichage du masque
export const CylinderMask = ({ intensity = 0.6, className = '', is3DMode = false }) => {
    if (!is3DMode || intensity === 0) return null;
    return (
        <div
            className={`absolute inset-0 pointer-events-none z-0 overflow-hidden flex flex-col ${className}`}
            style={{ transform: 'translateZ(0)' }}
        >
            {CAPSULE_CYLINDER_SLICES.map((opacity, i) => (
                <div
                    key={i}
                    className="flex-1"
                    style={{
                        backgroundColor: opacity > 0
                            ? `rgba(255, 255, 255, ${opacity * intensity})`
                            : opacity < 0
                                ? `rgba(0, 0, 0, ${Math.abs(opacity) * intensity})`
                                : 'transparent'
                    }}
                />
            ))}
        </div>
    );
};

// Composant masque cylindre 3D INVERSÉ (concave) - miroir vertical
// Crée un effet de creux au lieu d'une bosse
export const CylinderMaskInverted = ({ intensity = 0.6, className = '', is3DMode = false }) => {
    if (!is3DMode || intensity === 0) return null;
    // Inverser les slices pour l'effet concave
    const invertedSlices = [...CAPSULE_CYLINDER_SLICES].reverse();
    return (
        <div
            className={`absolute inset-0 pointer-events-none z-0 overflow-hidden flex flex-col ${className}`}
            style={{ transform: 'translateZ(0)' }}
        >
            {invertedSlices.map((opacity, i) => (
                <div
                    key={i}
                    className="flex-1"
                    style={{
                        backgroundColor: opacity > 0
                            ? `rgba(255, 255, 255, ${opacity * intensity})`
                            : opacity < 0
                                ? `rgba(0, 0, 0, ${Math.abs(opacity) * intensity})`
                                : 'transparent'
                    }}
                />
            ))}
        </div>
    );
};

// Composant masque sphère 3D - Effet réaliste avec highlight excentré
// Basé sur un éclairage venant du haut-gauche
// intensity: 0-1 (force de l'effet) - par défaut 0.6 pour matcher CylinderMask
// lightAngle: position de la source lumineuse (0-360°, 315 = haut-gauche par défaut)
export const SphereMask = ({ intensity = 0.6, className = '', is3DMode = false, lightAngle = 315 }) => {
    if (!is3DMode || intensity === 0) return null;

    // Calculer la position du highlight basée sur l'angle de lumière
    // Convention horloge: 0° = haut, 90° = droite, 180° = bas, 270° = gauche
    // 315° = haut-gauche (entre haut et gauche)
    // En CSS: X=0 gauche, X=100 droite, Y=0 haut, Y=100 bas
    const angleRad = ((lightAngle - 90) * Math.PI) / 180; // -90 pour convertir en convention CSS
    const highlightX = 50 + Math.cos(angleRad) * 30; // 30 au lieu de 25 pour highlight plus excentré
    const highlightY = 50 + Math.sin(angleRad) * 30;

    return (
        <div
            className={`absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-full ${className}`}
            style={{ transform: 'translateZ(0)' }}
        >
            {/* Couche 1: Highlight principal intense (point de lumière excentré en haut) */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `radial-gradient(ellipse 70% 50% at ${highlightX}% ${highlightY}%, rgba(255,255,255,${0.65 * intensity}) 0%, rgba(255,255,255,${0.25 * intensity}) 40%, transparent 70%)`
                }}
            />
            {/* Couche 2: Zone claire étendue en haut */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `linear-gradient(to bottom, rgba(255,255,255,${0.35 * intensity}) 0%, transparent 50%)`
                }}
            />
            {/* Couche 3: Assombrissement en bas (ombre progressive) */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,${0.35 * intensity}) 100%)`
                }}
            />
        </div>
    );
};

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║              PARAMÈTRES UNIFIÉS (partagés entre tous les composants)      ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

export const UNIFIED_CONFIG = {
    // Orientation Lock (overlay mode paysage)
    ORIENTATION_LOCK_ENABLED: false,     // Afficher l'overlay en mode paysage (true = bloqué, false = autorisé)

    // Capsules
    CAPSULE_HEIGHT: '2.0rem',           // Hauteur unifiée de toutes les capsules
    ICON_SIZE_PERCENT: 50,              // Taille des icônes = 50% de la hauteur capsule

    // Roue du lecteur - hauteur des éléments (% hauteur écran)
    WHEEL_ITEM_HEIGHT_MAIN_VH: 6.5,     // Taille élément roue lecteur principal
    WHEEL_ITEM_HEIGHT_MINI_VH: 6.5,     // Taille élément roue lecteur dashboard

    // Roue - hauteur variable selon distance du centre
    WHEEL_VARIABLE_HEIGHT_ENABLED: true, // Activer la hauteur variable
    WHEEL_CENTER_FULL_SIZE_COUNT: 3,     // Nombre d'éléments centraux à 100% (3 = centre + 1 dessus + 1 dessous)
    WHEEL_HEIGHT_RATIO_STEP_1: 0.50,     // Ratio hauteur palier 1 (distance 2) - 50%
    WHEEL_HEIGHT_RATIO_STEP_2: 0.20,     // Ratio hauteur palier 2 (distance 3+) - 20%

    // Capsules beacon et contrôle (hauteur en % de l'écran)
    PLAYER_CAPSULE_HEIGHT_VH: 6.5,      // Hauteur capsule beacon + capsule de lecture (unifié)

    // LECTEUR PRINCIPAL : taille texte (px)
    WHEEL_TITLE_SIZE_MAIN: 18,          // Taille titre chanson sélectionnée (centre roue)
    WHEEL_ARTIST_SIZE_MAIN: 14,         // Taille artiste chanson sélectionnée (centre roue)
    WHEEL_TITLE_SIZE_MAIN_OTHER: 16,    // Taille titre autres chansons (hors centre)
    WHEEL_ARTIST_SIZE_MAIN_OTHER: 12,   // Taille artiste autres chansons (hors centre)
    CAPSULE_TITLE_SIZE_MAIN: 20,        // Taille titre capsule cyan (mode principal)
    CAPSULE_ARTIST_SIZE_MAIN: 15,       // Taille artiste capsule cyan (mode principal)

    // LECTEUR DASHBOARD : taille texte (px)
    WHEEL_TITLE_SIZE_MINI: 16,          // Taille titre chanson sélectionnée (centre roue)
    WHEEL_ARTIST_SIZE_MINI: 13,         // Taille artiste chanson sélectionnée (centre roue)
    WHEEL_TITLE_SIZE_MINI_OTHER: 14,    // Taille titre autres chansons (hors centre)
    WHEEL_ARTIST_SIZE_MINI_OTHER: 11,    // Taille artiste autres chansons (hors centre)
    CAPSULE_TITLE_SIZE_DASHBOARD: 18,   // Taille titre capsule cyan (mode dashboard)
    CAPSULE_ARTIST_SIZE_DASHBOARD: 15,  // Taille artiste capsule cyan (mode dashboard)

    // Titres (espace entre safe area iOS et le titre)
    TITLE_MARGIN_TOP: '0.3rem',           // Marge au-dessus du titre (après la safe area)
    TITLE_MARGIN_BOTTOM: '0.5rem',      // Marge sous le titre (avant les boutons/contenu)
    TITLE_FONT_SIZE: '1.125rem',        // Taille police des titres (18px)
    TITLE_ICON_SIZE: 20,                // Taille icône à côté du titre (px)
    TITLE_ICON_GAP: '0.5rem',           // Espace entre icône et texte

    // Handles (barres grises de drag)
    HANDLE_HEIGHT: 6,                    // Hauteur en pixels CSS
    HANDLE_COLOR: '#d1d5db',            // gray-300

    // Cartes Vibes
    VIBECARD_HEIGHT_VH: 10.5,               // Hauteur des cartes vibes du dashboard (% hauteur écran)
    VIBECARD_BUILDER_HEIGHT_VH: 12,       // Hauteur de la carte vibe du VibeBuilder (% hauteur écran)
    COLOR_SWIPE_PERCENT: 33,              // Distance de swipe pour parcourir tous les dégradés (% de la largeur de l'élément)

    // Écrans d'import (SmartImport + DropboxBrowser)
    IMPORT_SCREEN_WIDTH: 92,             // % de la largeur totale de l'écran
    IMPORT_SCREEN_HEIGHT: 75,            // % de la hauteur totale de l'écran

    // Footer
    FOOTER_PADDING_TOP: '0.5rem',        // Padding entre le haut du footer et les éléments
    FOOTER_BTN_HEIGHT: 40,               // Hauteur des boutons du footer (px)
    FOOTER_BORDER_WIDTH: 1,              // Largeur bordure haut du footer (px)

    // Player Header
    PLAYER_HEADER_BORDER_WIDTH: 1,       // Largeur bordure bas du header (px)
    PLAYER_HEADER_HANDLE_MARGIN_BOTTOM: '0.5rem',  // Marge sous le handle du header
    PLAYER_HEADER_TITLE_HEIGHT: 47,      // Hauteur du titre "Viibing" (100 * 0.47 = 47px CSS)
};

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║              HAUTEURS EN PIXELS (fonctions à appeler après mount)         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// Hauteur du header du player en VRAIS pixels
// Structure: paddingTop + titre + gap + capsule + gap + handle + paddingBottom + border
export const getPlayerHeaderHeightPx = () => {
    const dpr = window.devicePixelRatio;
    return getSafeAreaTop() +                                                            // env(safe-area-inset-top) - déjà en vrais px
        cssToPixels(UNIFIED_CONFIG.TITLE_MARGIN_TOP) +                                   // paddingTop - déjà en vrais px
        UNIFIED_CONFIG.PLAYER_HEADER_TITLE_HEIGHT * dpr +                                  // titre "Vibing" (37px CSS)
        cssToPixels(UNIFIED_CONFIG.TITLE_MARGIN_BOTTOM) +                                // gap entre titre et capsule - déjà en vrais px
        cssToPixels(UNIFIED_CONFIG.CAPSULE_HEIGHT) +                                     // capsule de tri - déjà en vrais px
        cssToPixels(UNIFIED_CONFIG.TITLE_MARGIN_BOTTOM) +                                // gap entre capsule et handle - déjà en vrais px
        UNIFIED_CONFIG.HANDLE_HEIGHT * dpr +                                             // handle
        cssToPixels(UNIFIED_CONFIG.PLAYER_HEADER_HANDLE_MARGIN_BOTTOM) +                 // paddingBottom - déjà en vrais px
        UNIFIED_CONFIG.PLAYER_HEADER_BORDER_WIDTH * dpr;                                 // border
};

// Hauteur du footer du player en VRAIS pixels (border + padding + boutons + safe-area-bottom)
export const getPlayerFooterHeightPx = () => {
    const dpr = window.devicePixelRatio;
    return UNIFIED_CONFIG.FOOTER_BORDER_WIDTH * dpr +
        cssToPixels(UNIFIED_CONFIG.FOOTER_PADDING_TOP) +                                 // déjà en vrais px
        UNIFIED_CONFIG.FOOTER_BTN_HEIGHT * dpr +
        getSafeAreaBottom();                                                             // déjà en vrais px
};

// Hauteur du beacon en VRAIS pixels (6.5vh converti)
export const getBeaconHeightPx = () => cssToPixels(`${UNIFIED_CONFIG.PLAYER_CAPSULE_HEIGHT_VH}vh`);

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║              HAUTEUR DU FOOTER (CSS sans safe-area)                       ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// Hauteur du footer SANS la safe area (boutons + padding seulement)
export const FOOTER_CONTENT_HEIGHT_CSS = `calc(${UNIFIED_CONFIG.FOOTER_BTN_HEIGHT}px + ${UNIFIED_CONFIG.FOOTER_PADDING_TOP})`;

// Hauteur de la safe area corrigée (env + 16px de compensation)
export const SAFE_AREA_HEIGHT_CSS = `calc(env(safe-area-inset-bottom, 0px) + 16px)`;

// Hauteur totale du footer (contenu + safe area) - pour positionnement des éléments au-dessus
export const FOOTER_TOTAL_HEIGHT_CSS = `calc(${UNIFIED_CONFIG.FOOTER_BTN_HEIGHT}px + ${UNIFIED_CONFIG.FOOTER_PADDING_TOP} + env(safe-area-inset-bottom, 0px) + 16px)`;

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║              COMPOSANT SAFE AREA SPACER                                   ║
// ║  Ajoute un espace vide de la hauteur de la safe-area iOS en bas           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// env(safe-area-inset-bottom) retourne 34px CSS (102 vrais pixels) mais la vraie zone fait 150 vrais pixels mais on n'a jamais reussi a trouver pourquoi, a voir avec les autres iphones que 13 mini...
// Donc on ajoute 16px CSS manuellement pour compenser
export const SafeAreaSpacer = () => (
    <div
        style={{
            height: SAFE_AREA_HEIGHT_CSS,
            flexShrink: 0,
            width: '100%'
        }}
    />
);