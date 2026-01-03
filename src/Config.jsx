import React from 'react';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║              SAFE AREA INSETS (lus au démarrage via JavaScript)            ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// Fonction pour lire env(safe-area-inset-bottom) en pixels
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

    return height;
};

// Variable globale avec la valeur de safe-area-inset-bottom en pixels
export const SAFE_AREA_BOTTOM = getSafeAreaBottom();

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║              PARAMÈTRES UNIFIÉS (partagés entre tous les composants)       ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

export const UNIFIED_CONFIG = {
    // Capsules
    CAPSULE_HEIGHT: '2.0rem',           // Hauteur unifiée de toutes les capsules
    ICON_SIZE_PERCENT: 50,              // Taille des icônes = 50% de la hauteur capsule

    // Roue du lecteur - hauteur des éléments (% hauteur écran)
    WHEEL_ITEM_HEIGHT_MAIN_VH: 5.8,     // Taille élément roue lecteur principal
    WHEEL_ITEM_HEIGHT_MINI_VH: 5.5,     // Taille élément roue lecteur dashboard

    // Capsules beacon et contrôle (hauteur en % de l'écran)
    PLAYER_CAPSULE_HEIGHT_VH: 6.5,      // Hauteur capsule beacon + capsule de lecture (unifié)

    // Titres (espace entre safe area iOS et le titre)
    TITLE_MARGIN_TOP: '1rem',           // Marge au-dessus du titre (après la safe area)
    TITLE_MARGIN_BOTTOM: '0.5rem',      // Marge sous le titre (avant les boutons/contenu)
    TITLE_FONT_SIZE: '1.125rem',        // Taille police des titres (18px)
    TITLE_ICON_SIZE: 20,                // Taille icône à côté du titre (px)
    TITLE_ICON_GAP: '0.5rem',           // Espace entre icône et texte

    // Handles (barres grises de drag)
    HANDLE_HEIGHT_REAL_PX: 18,           // Hauteur en VRAIS pixels physiques (divisé par devicePixelRatio dans le code)
    HANDLE_COLOR: '#d1d5db',            // gray-300

    // Écrans d'import (SmartImport + DropboxBrowser)
    IMPORT_SCREEN_WIDTH: 92,             // % de la largeur totale de l'écran
    IMPORT_SCREEN_HEIGHT: 80,            // % de la hauteur totale de l'écran

    // Footer
    FOOTER_PADDING_TOP: '0.5rem',        // Padding entre le haut du footer et les éléments
    FOOTER_BTN_HEIGHT: 40,               // Hauteur des boutons du footer (px)
};

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