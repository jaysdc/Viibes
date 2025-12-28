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
};
