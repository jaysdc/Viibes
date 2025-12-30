import React from 'react';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║              PARAMÈTRES UNIFIÉS (partagés entre tous les composants)       ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

export const UNIFIED_CONFIG = {
    // Capsules
    CAPSULE_HEIGHT: '2.0rem',           // Hauteur unifiée de toutes les capsules
    ICON_SIZE_PERCENT: 50,              // Taille des icônes = 50% de la hauteur capsule

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
// ║              HAUTEUR DU FOOTER (CSS avec safe-area)                        ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

export const FOOTER_HEIGHT_CSS = `calc(env(safe-area-inset-bottom, 0px) + ${UNIFIED_CONFIG.FOOTER_BTN_HEIGHT}px + ${UNIFIED_CONFIG.FOOTER_PADDING_TOP})`;

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║              COMPOSANT SAFE AREA SPACER                                    ║
// ║  Ajoute un espace vide de la hauteur de la safe-area iOS en bas            ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// TEST: 150 vrais pixels = 50px CSS sur iPhone (devicePixelRatio = 3)
export const SafeAreaSpacer = () => (
    <div
        style={{
            height: `${150 / (typeof window !== 'undefined' ? window.devicePixelRatio : 3)}px`,
            flexShrink: 0,
            width: '100%',
            background: 'magenta'
        }}
    />
);