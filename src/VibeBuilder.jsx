import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Plus, ChevronDown, ChevronUp, User, ArrowDownAZ, ArrowUpZA, ArrowDownUp, RotateCcw, Headphones, Flame, Snowflake, Dices, Maximize2, ListPlus, Archive, RotateCw, ChevronLeft, ChevronRight, Volume2, VolumeX, ChevronsUpDown, Check, FolderPlus, Sparkles, X, FolderDown, Folder, ListMusic, Search, ListChecks, LocateFixed, Music2, ArrowRight, MinusCircle, Bomb, ListOrdered, CheckCircle2, XCircle, Trash2, ChevronsUp, ChevronsDown, Ghost, Pointer, Hand, Disc3, Copy, Type, MoveDown, MoveUp, AudioLines, Pencil } from 'lucide-react';
import { isSongAvailable } from './utils.js';
import { UNIFIED_CONFIG, SafeAreaSpacer, CylinderMask, SphereMask, SAFE_AREA_HEIGHT_CSS } from './Config.jsx';
import { VibesWave } from './Assets.jsx';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    VIBEBUILDER - PARAMÈTRES TWEAKABLES                    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// Fonction utilitaire pour extraire RGB d'une couleur RGBA (pour le glow dynamique)
const extractRGB = (rgbaColor) => {
    const match = rgbaColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
        return `${match[1]}, ${match[2]}, ${match[3]}`;
    }
    return '236, 72, 153'; // Rose par défaut
};

const CONFIG = {
    // ══════════════════════════════════════════════════════════════════════════
    // COULEURS DES BOUTONS DE LA CAPSULE (RGBA)
    // ══════════════════════════════════════════════════════════════════════════
    
    // BOUTON TITRE (A-Z / Z-A)
    BTN_TITLE_COLOR: 'rgba(236, 72, 153, 1)',           // Rose
    
    // BOUTON ARTISTE (avec flèche)
    BTN_ARTIST_COLOR: 'rgba(236, 72, 153, 1)',          // Rose
    
    // BOUTON NOMBRE D'ÉCOUTES - Moins écoutés (flocon)
    BTN_PLAYCOUNT_LEAST_COLOR: 'rgba(236, 72, 153, 1)', // Rose
    
    // BOUTON NOMBRE D'ÉCOUTES - Plus écoutés (flamme)
    BTN_PLAYCOUNT_MOST_COLOR: 'rgba(236, 72, 153, 1)',   // Rose
    
    // BOUTON FILTRE - Disponibles
    BTN_FILTER_AVAILABLE_COLOR: 'rgba(16, 185, 129, 1)', // Vert
    
    // BOUTON FILTRE - Pas disponibles
    BTN_FILTER_UNAVAILABLE_COLOR: 'rgb(255, 170, 72)', // Orange
    
    // BOUTON FILTRE - Tous
    BTN_FILTER_ALL_COLOR: 'rgba(59, 130, 246, 1)',       // Bleu
    
    // BOUTON RECHERCHE (croix active)
    BTN_SEARCH_COLOR: 'rgba(236, 72, 153, 1)',           // Rose
    
    // GLOW - Paramètres généraux
    GLOW_VERTICAL: 7,
    GLOW_BLUR: 12,
    GLOW_OPACITY: 0.5,
    
    // BOUTON RECHERCHE (plus large)
    SEARCH_BTN_FLEX: 1.5,                 // Facteur de largeur (1.5x les autres)
    CLOSE_BTN_FLEX: 0.25,                    // Facteur de largeur du bouton X (plus petit)
    SEARCH_BTN_ICON_SIZE: '1.25rem',      // Icône légèrement plus grande
    
    // PRÉ-ÉCOUTE
    PREVIEW_DURATION: 15,
    PREVIEW_START_TIME: 30,               // Temps de départ de la pré-écoute (secondes)
    PREVIEW_LONG_PRESS_DELAY: 500,
    
    // BOUTON ADD ALL
    ADDALL_PADDING_TOP: '13px',
    ADDALL_HEIGHT: 'h-7',
    ADDALL_FONT_SIZE: 'text-lg',
    ADDALL_BG_COLOR: '#8CFF00',

    // SWIPE VIBECARD PREVIEW
    COLOR_SWIPE_PERCENT: UNIFIED_CONFIG.COLOR_SWIPE_PERCENT,  // Distance de swipe pour parcourir les dégradés (% largeur élément)
    
    // SWIPE TITRE (fermeture)
    TITLE_SWIPE_THRESHOLD: 100,           // Seuil de swipe pour confirmer/annuler (px)
    SWIPE_MAX_ROTATION: 8,                // Rotation max de l'éventail au seuil (degrés)
    SWIPE_OVERLAY_OPACITY: 0.85,          // Opacité max du fond noir lors du swipe
    HEADER_TITLE_GAP: '0.75rem',           // Espacement entre titre et boutons de tri

    // INDICATEUR DOUBLON (bordure pointillée)
    DUPLICATE_BORDER_WIDTH: 5,            // Épaisseur de la bordure (px)
    DUPLICATE_BORDER_OPACITY: 0.5,        // Opacité de la bordure (0-1)
    DUPLICATE_DASH_ARRAY: '8,6',          // Pattern pointillés: "longueur-tiret,espacement"
 
    // BOUTON CREATE (+)
    CREATE_BTN_SIZE: 44,                  // Taille du cercle (px)
    CREATE_BTN_PLUS_LENGTH: 50,           // Longueur du + en % du viewBox (0-100)
    CREATE_BTN_ICON_STROKE: 8,            // Épaisseur du + en % du viewBox
    CREATE_BTN_GLOW_SPREAD: 20,           // Spread du glow (px)
    CREATE_BTN_GLOW_OPACITY: 0.6,         // Opacité du glow blanc (0-1)
    
    // Couleurs néon (format RGB)
    NEON_COLOR_PINK: '236, 72, 153',      // Rose (mode ajout)
    NEON_COLOR_ORANGE: '255, 103, 0',     // Orange (mode retrait)
    CREATE_BTN_RIGHT: 16,                 // Position depuis la droite (px)

    // CAPSULE LIQUID GLASS
    CAPSULE_BOTTOM: 12,                   // Position depuis le bas (px)
    CAPSULE_LEFT: 16,                     // Position depuis la gauche (px)
    
    // ICONE DRAG
    DRAG_TOP: 4,                          // Position depuis le haut (px)

    // FADE SCROLL (indicateur de contenu non visible)
    LIST_FADE_HEIGHT: '6rem',             // Hauteur du fade (3 lignes de chansons)
    LIST_FADE_OPACITY: 0.95,              // Opacité max du fade blanc

    // BOTTOM BAR (carte preview en bas)
    BOTTOM_CARD_PADDING_TOP: 12,          // Padding au-dessus de la carte preview (px)

    // ══════════════════════════════════════════════════════════════════════════
    // ÉCRAN PRÉ-ÉCOUTE
    // ══════════════════════════════════════════════════════════════════════════
    PREVIEW_BLUR: 20,                     // Blur du fond (px)
    PREVIEW_BG_OVERLAY: 'transparent',    // Pas de couleur de fond, juste le blur

    PREVIEW_DISC_SIZE: 128,               // Taille du disque qui tourne (px)
    PREVIEW_DISC_ICON_SIZE: 72,           // Taille de l'icône dans le disque (px)
    PREVIEW_DISC_MARGIN_BOTTOM: 32,       // Marge sous le disque (px)
    PREVIEW_DISC_COLOR: '#06b6d4',        // Couleur du disque (cyan)
    PREVIEW_DISC_BG: 'rgba(6, 182, 212, 0.15)', // Fond du disque (cyan transparent)

    PREVIEW_TITLE_SIZE: 28,               // Taille du titre (px)
    PREVIEW_ARTIST_SIZE: 20,              // Taille de l'artiste (px)
    PREVIEW_TEXT_MARGIN_BOTTOM: 40,       // Marge sous le texte avant les boutons (px)

    // PILL DE CONFIRMATION (style identique à kill/nuke)
    PREVIEW_PILL_HEIGHT_PERCENT: 25,             // Hauteur du pill (% largeur écran)
    PREVIEW_PILL_WIDTH_PERCENT: 80,              // Largeur du pill (% largeur écran)
    PREVIEW_PILL_ICON_SIZE_PERCENT: 50,          // Taille icônes (% hauteur pill)
    PREVIEW_PILL_CURSOR_SIZE_PERCENT: 80,        // Taille du curseur (% hauteur pill)
    PREVIEW_PILL_BG_COLOR: 'rgba(110, 110, 110, 0.15)', // Fond du pill
    PREVIEW_PILL_CURSOR_COLOR: 'rgba(255, 255, 255, 0.9)', // Couleur du curseur
    PREVIEW_PILL_BLUR: 20,                       // Blur du pill (px)
    PREVIEW_PILL_THRESHOLD: 0.85,                // Seuil de déclenchement (85%) - pas de zone morte
    
    PREVIEW_FADEIN_DURATION: 200,         // Durée du fade in en ms (0 = pas de fade)
    PREVIEW_FADEOUT_DURATION: 300,        // Durée du fade out en ms (0 = pas de fade)

    // ══════════════════════════════════════════════════════════════════════════
    // BUILDER ROW (ligne de chanson)
    // ══════════════════════════════════════════════════════════════════════════
    ROW_HEIGHT: '2.0rem',               // Hauteur de la ligne (34px)
    VIRTUALIZATION_BUFFER: 10,          // Nombre de lignes à rendre au-dessus/en-dessous du visible
    ROW_LEFT_COLUMN_WIDTH: '3.75rem',     // Largeur couloir gauche (60px)
    ROW_CHECKBOX_SIZE: '0.875rem',        // Taille checkbox (14px)
    ROW_CHECKBOX_ICON_SIZE: '0.5625rem',  // Taille icône check/plus (9px)
    ROW_LINE_HEIGHT: '0.875rem',          // Interligne titre/artiste (14px)
    ROW_TITLE_SIZE: '0.75rem',            // Taille titre (12px = text-xs)
    ROW_SUBTITLE_SIZE: '0.625rem',        // Taille sous-titre (10px)
    ROW_PLAYCOUNT_SIZE: '0.5625rem',      // Taille compteur écoutes (9px)
    ROW_SLIDER_HEIGHT: '3.5rem',          // Hauteur slider filtres (56px)

    // ══════════════════════════════════════════════════════════════════════════
    // HEADER & NAVIGATION
    // ══════════════════════════════════════════════════════════════════════════
    HEADER_STATUS_HEIGHT: '2rem',         // Hauteur barre de statut (32px = h-8)
    HEADER_NOTCH_HEIGHT: '1.75rem',       // Hauteur encoche (28px = h-7)
    HEADER_NOTCH_WIDTH: '8rem',           // Largeur encoche (128px = w-32)
    HEADER_BTN_SIZE: UNIFIED_CONFIG.CAPSULE_HEIGHT,           // Taille boutons close/search (depuis config.js)
    HEADER_BTN_ICON_SIZE: '0.875rem',     // Taille icône dans boutons (14px)
    HEADER_TOOLBAR_HEIGHT: UNIFIED_CONFIG.CAPSULE_HEIGHT,     // Hauteur barre de tri (depuis config.js)
    HEADER_SORT_ICON_SIZE: '0.875rem',    // Taille icônes tri (14px)
    HEADER_FILTER_ICON_SIZE: '1rem',      // Taille icône filtre (16px)
    HEADER_SEARCH_ICON_SIZE: '1rem',      // Taille icône search (16px)
    SEARCH_CLOSE_SPIN_DURATION: 500,      // Durée du spin de fermeture (ms)
    SEARCH_CLOSE_SPIN_ACCEL: 1,           // Accélération: négatif = rapide→lent, positif = lent→rapide (de -5 à 5)
    SEARCH_CLOSE_FADE_DURATION: 500,      // Durée du fade out (ms)
    SEARCH_BOX_GLOW_COLOR: 'rgba(236, 72, 153, 0.5)', // Couleur du glow de la boîte de recherche

    // ══════════════════════════════════════════════════════════════════════════
    // NEON GLOW (Effet néon)
    // ══════════════════════════════════════════════════════════════════════════
    NEON_FLICKER_MIN_DELAY: 8000,         // Délai minimum entre flickers (ms)
    NEON_FLICKER_MAX_DELAY: 20000,        // Délai maximum entre flickers (ms)
    NEON_FLICKER_DURATION: 125,           // Durée d'un flicker (ms)
    NEON_FLICKER_MIN_OPACITY: 0.8,        // Opacité minimum pendant le flicker (0-1)

    NEON_BREATHE_DURATION: 3500,          // Durée d'un cycle de respiration (ms)
    NEON_BREATHE_MIN_OPACITY: 0.45,       // Opacité minimum de la respiration
    NEON_BREATHE_MAX_OPACITY: 0.57,        // Opacité maximum de la respiration
    NEON_IGNITE_DURATION: 400,            // Durée de l'animation d'allumage (ms)
    
    // Effet cylindre 3D sur la capsule de tri - 30 tranches du haut vers le bas - masque d'opacité
    CAPSULE_CYLINDER_ENABLED: false,
    CAPSULE_CYLINDER_INTENSITY_ON: 1,     // Intensité du masque sur boutons actifs (0 = aucun, 1 = plein)
    CAPSULE_CYLINDER_INTENSITY_OFF: 0.60,  // Intensité du masque sur boutons inactifs (0 = aucun, 1 = plein)
    CAPSULE_BG_COLOR: '228, 243, 255',    // Couleur de fond de la capsule (RGB)
    CAPSULE_BG_OPACITY: 0.30,              // Opacité du fond de la capsule (0 = transparent, 1 = opaque)

    // Animation rotation 3D de la capsule (entrée/sortie recherche)
    SEARCH_FADE_IN_DURATION: 275,         // Durée fade in recherche (ms)
    SEARCH_FADE_OUT_DURATION: 275,        // Durée fade out recherche (ms)

    HEADER_DRAGMODE_ICON_SIZE: '1.25rem', // Taille icônes Let's Vibe/Ghosting (20px)

    // ══════════════════════════════════════════════════════════════════════════
    // SMART WAVE
    // ══════════════════════════════════════════════════════════════════════════
    SIDEBAR_WIDTH: '3.75rem',             // Largeur barre latérale (60px)
    SIDEBAR_ICON_SIZE: '1.25rem',         // Taille icônes navigation (20px)
    SIDEBAR_ICON_GAP: '10px',             // Espacement entre icônes

    // ══════════════════════════════════════════════════════════════════════════
    // DIVERS UI
    // ══════════════════════════════════════════════════════════════════════════
    VIBELOGO_SIZE: '2.5rem',              // Taille par défaut VibeLogo
    VIBING_TITLE_SIZE: '1.5rem',          // Taille par défaut VibingTitle
    HEADER_PADDING_X: '0.75rem',          // Padding horizontal header (12px = px-3)
    HEADER_PADDING_BOTTOM: '0.75rem',     // Padding bottom header (12px = pb-3)
    HEADER_PADDING_BOTTOM_ADDALL: '0.5rem', // Padding bottom quand AddAll visible (8px = pb-2)
    SEARCH_PADDING_X: '1rem',             // Padding horizontal search bar (16px = px-4)
    CAPSULE_PADDING_X: '1rem',            // Padding horizontal capsule (16px = px-4)
    CAPSULE_PADDING_Y: '0.5rem',          // Padding vertical capsule (8px = py-2)
    CAPSULE_RIGHT_MARGIN: '4.5rem',       // Espacement entre la capsule et l'icône + (rem)
    CAPSULE_BORDER_RADIUS: '0.75rem',     // Border radius vibecard (12px)
    NAME_WIDTH_FACTOR: 0.7,               // Facteur largeur par caractère
    NAME_MIN_WIDTH: '3.75rem',            // Largeur minimale du nom
    ADDALL_ICON_SIZE: '0.75rem',          // Taille icône Music2 dans AddAll
    BLINK_ANIMATION_DURATION: 400,        // Durée de l'animation ignite (ms)
    LONG_PRESS_DURATION: 500,             // Durée avant déclenchement du long press (ms)
    BOTTOM_BAR_HEIGHT: 'calc(9vh + 24px + env(safe-area-inset-bottom, 0px))', // Hauteur bottom bar (carte + padding + safe area)
};

// --- 1. STYLE CSS ---
const styles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  /* Bloquer menu contextuel sur appui long */
  .no-context-menu {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
  @keyframes marquee {
    0%, 20% { transform: translateX(0%); }
    80%, 100% { transform: translateX(-50%); }
  }
  
  .animate-marquee {
    display: inline-block;
    white-space: nowrap;
    animation: marquee var(--marquee-speed, 8s) linear infinite alternate;
  }

  @keyframes appear-ease {
    0% { opacity: 0; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }

  .animate-appear {
    animation: appear-ease 0.2s ease-out forwards;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ANIMATION NÉON UNIFIÉE - Utilise --neon-color (format: "R, G, B")
     ═══════════════════════════════════════════════════════════════════════════ */
  @keyframes neon-glow {
    0%, 100% {
      box-shadow: 0 0 15px rgba(var(--neon-color), 0.7), 0 0 30px rgba(var(--neon-color), 0.4);
    }
    50% {
      box-shadow: 0 0 30px rgba(var(--neon-color), 1), 0 0 60px rgba(var(--neon-color), 0.7);
    }
  }

  .animate-neon-glow {
    animation: neon-glow 0.5s ease-in-out infinite;
  }

  .animate-neon-glow-once {
    animation: neon-glow 0.5s ease-in-out;
  }

  @keyframes pulse-purple {
    0%, 100% { background-color: #f3e8ff; transform: scale(0.98); }
    50% { background-color: #d8b4fe; transform: scale(1); }
  }
  
  .animate-preview {
    animation: pulse-purple 1s infinite ease-in-out;
  }

  @keyframes pulse-flame {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.9; }
  }

  .animate-pulse-flame {
    animation: pulse-flame 1.5s infinite ease-in-out;
  }

  /* Animation ignite pour bouton X (fermer) - Rouge (#f43f5e → #b91c1c) */
  @keyframes ignite-btn-red {
    0% { transform: translateY(-50%) scale(1.15); box-shadow: 0 0 10px rgba(244, 63, 94, 0.4), 0 0 20px rgba(185, 28, 28, 0.2); }
    15% { transform: translateY(-50%) scale(1.12); box-shadow: 0 0 25px rgba(244, 63, 94, 1), 0 0 50px rgba(185, 28, 28, 0.8); }
    25% { transform: translateY(-50%) scale(1.09); box-shadow: 0 0 15px rgba(244, 63, 94, 0.5), 0 0 30px rgba(185, 28, 28, 0.4); }
    40% { transform: translateY(-50%) scale(1.06); box-shadow: 0 0 35px rgba(244, 63, 94, 1), 0 0 70px rgba(185, 28, 28, 0.9); }
    55% { transform: translateY(-50%) scale(1.03); box-shadow: 0 0 20px rgba(244, 63, 94, 0.6), 0 0 40px rgba(185, 28, 28, 0.5); }
    70% { transform: translateY(-50%) scale(1.01); box-shadow: 0 0 30px rgba(244, 63, 94, 0.9), 0 0 60px rgba(185, 28, 28, 0.7); }
    100% { transform: translateY(-50%) scale(1); box-shadow: 0 0 ${CONFIG.CREATE_BTN_GLOW_SPREAD}px rgba(255,255,255,${CONFIG.CREATE_BTN_GLOW_OPACITY}), 0 4px 12px rgba(0,0,0,0.15); }
  }
  .animate-ignite-btn-red {
    animation: ignite-btn-red 0.5s ease-out forwards;
  }

  /* Animation shake latéral pour bouton + quand aucune chanson sélectionnée */
  @keyframes shake-error {
    0%, 100% { transform: translateY(-50%) translateX(0); }
    20%, 60% { transform: translateY(-50%) translateX(-2px); }
    40%, 80% { transform: translateY(-50%) translateX(2px); }
  }
  .animate-shake-error {
    animation: shake-error 0.3s ease-out forwards;
  }

  /* Animation ignite pour bouton + (créer) - Vert (#00ff88 → #00cc6a) */
  @keyframes ignite-btn-green {
    0% { transform: translateY(-50%) scale(1.15); box-shadow: 0 0 10px rgba(0, 255, 136, 0.4), 0 0 20px rgba(0, 204, 106, 0.2); }
    15% { transform: translateY(-50%) scale(1.12); box-shadow: 0 0 25px rgba(0, 255, 136, 1), 0 0 50px rgba(0, 204, 106, 0.8); }
    25% { transform: translateY(-50%) scale(1.09); box-shadow: 0 0 15px rgba(0, 255, 136, 0.5), 0 0 30px rgba(0, 204, 106, 0.4); }
    40% { transform: translateY(-50%) scale(1.06); box-shadow: 0 0 35px rgba(0, 255, 136, 1), 0 0 70px rgba(0, 204, 106, 0.9); }
    55% { transform: translateY(-50%) scale(1.03); box-shadow: 0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 204, 106, 0.5); }
    70% { transform: translateY(-50%) scale(1.01); box-shadow: 0 0 30px rgba(0, 255, 136, 0.9), 0 0 60px rgba(0, 204, 106, 0.7); }
    100% { transform: translateY(-50%) scale(1); box-shadow: 0 0 ${CONFIG.CREATE_BTN_GLOW_SPREAD}px rgba(255,255,255,${CONFIG.CREATE_BTN_GLOW_OPACITY}), 0 4px 12px rgba(0,0,0,0.15); }
  }
  .animate-ignite-btn-green {
    animation: ignite-btn-green 0.5s ease-out forwards;
  }

  @keyframes jiggle {
    0% { transform: rotate(-1deg); }
    50% { transform: rotate(1deg); }
    100% { transform: rotate(-1deg); }
  }

  .animate-jiggle {
    animation: jiggle 0.25s infinite ease-in-out;
  }
  
  @keyframes slide-up {
    0% { transform: translateY(1.25rem); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out forwards;
  }
  
  @keyframes pop-in {
    0% { transform: scale(0.9); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  
.animate-pop {
    animation: pop-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes neon-ignite-card {
    0% { opacity: 0.3; box-shadow: 0 0 8px var(--glow-color), 0 0 16px var(--glow-color); }
    15% { opacity: 1; box-shadow: 0 0 20px var(--glow-color), 0 0 40px var(--glow-color), 0 0 60px var(--glow-color); }
    25% { opacity: 0.4; box-shadow: 0 0 10px var(--glow-color), 0 0 20px var(--glow-color); }
    40% { opacity: 1; box-shadow: 0 0 25px var(--glow-color), 0 0 50px var(--glow-color), 0 0 75px var(--glow-color); }
    55% { opacity: 0.7; box-shadow: 0 0 15px var(--glow-color), 0 0 30px var(--glow-color); }
    70% { opacity: 1; box-shadow: 0 0 20px var(--glow-color), 0 0 40px var(--glow-color), 0 0 60px var(--glow-color); }
    100% { opacity: 1; box-shadow: 0 0 20px var(--glow-color), 0 0 40px var(--glow-color); }
  }

  .animate-blink {
    animation: neon-ignite-card 0.4s ease-out forwards;
  }
  
  @keyframes fade-out {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
  
  .animate-fade-out {
    animation: fade-out 0.3s ease-out forwards;
  }

  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }

  @keyframes hint-left {
    0%, 100% { transform: translateX(0); opacity: 1; }
    50% { transform: translateX(-4px); opacity: 0.6; }
  }

  @keyframes hint-right {
    0%, 100% { transform: translateX(0); opacity: 1; }
    50% { transform: translateX(4px); opacity: 0.6; }
  }

  .swipe-hint-left {
    animation: hint-left 2s ease-in-out infinite;
  }

  .swipe-hint-right {
    animation: hint-right 2s ease-in-out infinite;
  }

  @keyframes threshold-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
  }

  .threshold-reached {
    animation: threshold-pulse 0.3s ease-in-out infinite;
  }

  /* Animation néon violet pour pré-écoute */
  @keyframes neon-flicker-purple {
    0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(168, 85, 247, 0.4), 0 0 60px rgba(168, 85, 247, 0.2); }
    50% { box-shadow: 0 0 30px rgba(168, 85, 247, 1), 0 0 60px rgba(168, 85, 247, 0.7), 0 0 90px rgba(168, 85, 247, 0.4); }
  }

  .animate-neon-purple {
    animation: neon-flicker-purple 0.3s ease-in-out infinite;
  }

  /* ========== ANIMATIONS NÉON - ALLUMAGE (FLICKER) ========== */
  @keyframes neon-ignite-pink {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(236, 72, 153, 0.2), 0 4px 8px rgba(236, 72, 153, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(236, 72, 153, 0.8), 0 7px 15px rgba(236, 72, 153, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(236, 72, 153, 0.3), 0 5px 10px rgba(236, 72, 153, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(236, 72, 153, 0.9), 0 8px 18px rgba(236, 72, 153, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(236, 72, 153, 0.5), 0 6px 12px rgba(236, 72, 153, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(236, 72, 153, 0.7), 0 7px 14px rgba(236, 72, 153, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(236, 72, 153, 0.5), 0 7px 12px rgba(236, 72, 153, 0.5); }
  }
  @keyframes neon-ignite-green {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(16, 185, 129, 0.2), 0 4px 8px rgba(16, 185, 129, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(16, 185, 129, 0.8), 0 7px 15px rgba(16, 185, 129, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(16, 185, 129, 0.3), 0 5px 10px rgba(16, 185, 129, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(16, 185, 129, 0.9), 0 8px 18px rgba(16, 185, 129, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(16, 185, 129, 0.5), 0 6px 12px rgba(16, 185, 129, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(16, 185, 129, 0.7), 0 7px 14px rgba(16, 185, 129, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(16, 185, 129, 0.5), 0 7px 12px rgba(16, 185, 129, 0.5); }
  }
  @keyframes neon-ignite-orange {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(249, 115, 22, 0.2), 0 4px 8px rgba(249, 115, 22, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(249, 115, 22, 0.8), 0 7px 15px rgba(249, 115, 22, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(249, 115, 22, 0.3), 0 5px 10px rgba(249, 115, 22, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(249, 115, 22, 0.9), 0 8px 18px rgba(249, 115, 22, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(249, 115, 22, 0.5), 0 6px 12px rgba(249, 115, 22, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(249, 115, 22, 0.7), 0 7px 14px rgba(249, 115, 22, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(249, 115, 22, 0.5), 0 7px 12px rgba(249, 115, 22, 0.5); }
  }
  @keyframes neon-ignite-cyan {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(6, 182, 212, 0.2), 0 4px 8px rgba(6, 182, 212, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(6, 182, 212, 0.8), 0 7px 15px rgba(6, 182, 212, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(6, 182, 212, 0.3), 0 5px 10px rgba(6, 182, 212, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(6, 182, 212, 0.9), 0 8px 18px rgba(6, 182, 212, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(6, 182, 212, 0.5), 0 6px 12px rgba(6, 182, 212, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(6, 182, 212, 0.7), 0 7px 14px rgba(6, 182, 212, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(6, 182, 212, 0.5), 0 7px 12px rgba(6, 182, 212, 0.5); }
  }  
  .animate-neon-ignite-pink { animation: neon-ignite-pink 0.4s ease-out forwards; }
  .animate-neon-ignite-green { animation: neon-ignite-green 0.4s ease-out forwards; }
  .animate-neon-ignite-orange { animation: neon-ignite-orange 0.4s ease-out forwards; }
  .animate-neon-ignite-cyan { animation: neon-ignite-cyan 0.4s ease-out forwards; }

  /* Animation néon LIME (couleur flamme #8CFF00) */
  @keyframes neon-ignite-lime {
    0% { opacity: 0.3; box-shadow: 0 0 8px rgba(140, 255, 0, 0.2), 0 0 16px rgba(140, 255, 0, 0.1); }
    15% { opacity: 1; box-shadow: 0 0 15px rgba(140, 255, 0, 0.8), 0 0 30px rgba(140, 255, 0, 0.4); }
    25% { opacity: 0.4; box-shadow: 0 0 10px rgba(140, 255, 0, 0.3), 0 0 20px rgba(140, 255, 0, 0.15); }
    40% { opacity: 1; box-shadow: 0 0 18px rgba(140, 255, 0, 0.9), 0 0 36px rgba(140, 255, 0, 0.5); }
    55% { opacity: 0.7; box-shadow: 0 0 12px rgba(140, 255, 0, 0.5), 0 0 24px rgba(140, 255, 0, 0.25); }
    70% { opacity: 1; box-shadow: 0 0 14px rgba(140, 255, 0, 0.7), 0 0 28px rgba(140, 255, 0, 0.35); }
    100% { opacity: 1; box-shadow: 0 0 12px rgba(140, 255, 0, 0.5), 0 0 24px rgba(140, 255, 0, 0.25); }
  }
  .animate-neon-ignite-lime { animation: neon-ignite-lime 0.4s ease-out forwards; }

  /* Animation néon WHITE (bouton fermer - discret) */
  @keyframes neon-breathe-white {
    0%, 100% { box-shadow: 0 0 8px rgba(255, 255, 255, 0.2), 0 0 16px rgba(255, 255, 255, 0.1); }
    50% { box-shadow: 0 0 12px rgba(255, 255, 255, 0.3), 0 0 24px rgba(255, 255, 255, 0.15); }
  }
  .animate-neon-breathe-white { animation: neon-breathe-white 2.5s ease-in-out infinite; }

  @keyframes hint-left {
    0%, 100% { transform: translateX(0); opacity: 1; }
    50% { transform: translateX(-4px); opacity: 0.6; }
  }
  @keyframes hint-right {
    0%, 100% { transform: translateX(0); opacity: 1; }
    50% { transform: translateX(4px); opacity: 0.6; }
  }
  .swipe-hint-left {
    animation: hint-left 2s ease-in-out infinite;
  }
  .swipe-hint-right {
    animation: hint-right 2s ease-in-out infinite;
  }

  @keyframes neon-pulse-lime {
    0%, 100% { 
      text-shadow: 0 0 10px rgba(192, 255, 0, 0.8), 0 0 20px rgba(192, 255, 0, 0.6), 0 0 40px rgba(192, 255, 0, 0.4);
      filter: brightness(1);
    }
    50% { 
      text-shadow: 0 0 20px rgba(192, 255, 0, 1), 0 0 40px rgba(192, 255, 0, 0.8), 0 0 80px rgba(192, 255, 0, 0.6);
      filter: brightness(1.2);
    }
  }
  .animate-neon-lime {
    animation: neon-pulse-lime 0.5s ease-in-out infinite;
    color: #C0FF00 !important;
  }

  @keyframes bounce-neon-lime {
    0%, 100% {
      transform: translateY(-25%);
      filter: drop-shadow(0 0 10px rgba(192, 255, 0, 0.6)) brightness(1);
    }
    25%, 75% {
      filter: drop-shadow(0 0 30px rgba(192, 255, 0, 1)) brightness(1.2);
    }
    50% {
      transform: translateY(0);
      filter: drop-shadow(0 0 10px rgba(192, 255, 0, 0.6)) brightness(1);
    }
  }
  .animate-bounce-neon-lime {
    animation: bounce-neon-lime 1s ease-in-out infinite;
    color: #C0FF00 !important;
  }

  /* ========== ANIMATIONS NÉON - RESPIRATION STABLE ========== */
  @keyframes neon-breathe-pink {
    0%, 100% { box-shadow: 0 -7px 12px rgba(236, 72, 153, 0.35), 0 7px 12px rgba(236, 72, 153, 0.35); }
    50% { box-shadow: 0 -9px 16px rgba(236, 72, 153, 0.6), 0 9px 16px rgba(236, 72, 153, 0.6); }
  }
  @keyframes neon-breathe-green {
    0%, 100% { box-shadow: 0 -7px 12px rgba(16, 185, 129, 0.35), 0 7px 12px rgba(16, 185, 129, 0.35); }
    50% { box-shadow: 0 -9px 16px rgba(16, 185, 129, 0.6), 0 9px 16px rgba(16, 185, 129, 0.6); }
  }
  @keyframes neon-breathe-orange {
    0%, 100% { box-shadow: 0 -7px 12px rgba(249, 115, 22, 0.35), 0 7px 12px rgba(249, 115, 22, 0.35); }
    50% { box-shadow: 0 -9px 16px rgba(249, 115, 22, 0.6), 0 9px 16px rgba(249, 115, 22, 0.6); }
  }
  @keyframes neon-breathe-cyan {
    0%, 100% { box-shadow: 0 -7px 12px rgba(6, 182, 212, 0.35), 0 7px 12px rgba(6, 182, 212, 0.35); }
    50% { box-shadow: 0 -9px 16px rgba(6, 182, 212, 0.6), 0 9px 16px rgba(6, 182, 212, 0.6); }
  }
  @keyframes neon-breathe-lime {
    0%, 100% { box-shadow: 0 0 12px rgba(140, 255, 0, 0.5), 0 0 24px rgba(140, 255, 0, 0.25); transform: scale(1); }
    50% { box-shadow: 0 0 16px rgba(140, 255, 0, 0.6), 0 0 32px rgba(140, 255, 0, 0.35); transform: scale(1.02); }
  }
  .animate-neon-breathe-pink { animation: neon-breathe-pink 2s ease-in-out infinite; }
  .animate-neon-ignite-cyan { animation: neon-ignite-cyan 0.4s ease-out forwards; }
  .animate-neon-breathe-green { animation: neon-breathe-green 2s ease-in-out infinite; }
  .animate-neon-breathe-orange { animation: neon-breathe-orange 2s ease-in-out infinite; }
  .animate-neon-breathe-cyan { animation: neon-breathe-cyan 2s ease-in-out infinite; }
  .animate-neon-breathe-lime { animation: neon-breathe-lime 2.5s ease-in-out infinite; }

  .animate-neon-breathe-dynamic {
    animation: neon-ignite-dynamic 0.4s ease-out forwards, neon-breathe-dynamic 2s ease-in-out 0.4s infinite;
  }
  
  @keyframes neon-ignite-dynamic {
    0% { opacity: 0; transform: scale(0.95); }
    50% { opacity: 1; transform: scale(1.02); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes neon-breathe-dynamic {
    0%, 100% { opacity: 0.85; }
    50% { opacity: 1; }
  }

@keyframes capsule-flip-out {
    0% { transform: rotateX(0deg); }
    100% { transform: rotateX(${CONFIG.CAPSULE_FLIP_ANGLE}deg); }
  }
  @keyframes capsule-flip-in {
    0% { transform: rotateX(-${CONFIG.CAPSULE_FLIP_ANGLE}deg); }
    100% { transform: rotateX(0deg); }
  }
  @keyframes search-fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes search-fade-out {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
`;

// --- NEON GLOW WRAPPER (Composant réutilisable) ---
const NeonGlow = ({ 
    children, 
    colorName = 'pink',
    glowRGB = null,
    enabled = true,
    igniteOnMount = true,
    flickerEnabled = true,
    className = '',
    style = {}
  }) => {
    const [isIgniting, setIsIgniting] = useState(igniteOnMount);
    const [isFlickering, setIsFlickering] = useState(false);
    const flickerTimeoutRef = useRef(null);
    
    useEffect(() => {
        if (igniteOnMount) {
            setIsIgniting(true);
            const timer = setTimeout(() => setIsIgniting(false), CONFIG.NEON_IGNITE_DURATION);
            return () => clearTimeout(timer);
        }
    }, [igniteOnMount]);
    
    useEffect(() => {
        if (!enabled || !flickerEnabled) return;
        
        const scheduleNextFlicker = () => {
            const delay = CONFIG.NEON_FLICKER_MIN_DELAY + 
                Math.random() * (CONFIG.NEON_FLICKER_MAX_DELAY - CONFIG.NEON_FLICKER_MIN_DELAY);
            
            flickerTimeoutRef.current = setTimeout(() => {
                setIsFlickering(true);
                setTimeout(() => {
                    setIsFlickering(false);
                    scheduleNextFlicker();
                }, CONFIG.NEON_FLICKER_DURATION);
            }, delay);
        };
        
        scheduleNextFlicker();
        
        return () => {
            if (flickerTimeoutRef.current) {
                clearTimeout(flickerTimeoutRef.current);
            }
        };
    }, [enabled, flickerEnabled]);
    
    if (!enabled) return children;
    
    let dynamicStyle = { ...style };
    
    // Si glowRGB fourni, utiliser le glow dynamique
    if (glowRGB) {
        dynamicStyle.boxShadow = `0 -${CONFIG.GLOW_VERTICAL}px ${CONFIG.GLOW_BLUR}px rgba(${glowRGB}, ${CONFIG.GLOW_OPACITY}), 0 ${CONFIG.GLOW_VERTICAL}px ${CONFIG.GLOW_BLUR}px rgba(${glowRGB}, ${CONFIG.GLOW_OPACITY})`;
    }
    
    if (isIgniting) {
        dynamicStyle.animation = `neon-ignite-${colorName} ${CONFIG.NEON_IGNITE_DURATION}ms ease-out forwards`;
    } else if (isFlickering) {
        dynamicStyle.opacity = CONFIG.NEON_FLICKER_MIN_OPACITY;
        dynamicStyle.transition = `opacity ${CONFIG.NEON_FLICKER_DURATION / 2}ms ease-in-out`;
    } else {
        dynamicStyle.animation = `neon-breathe-${colorName} ${CONFIG.NEON_BREATHE_DURATION}ms ease-in-out infinite`;
    }
    
    return (
        <div className={className} style={dynamicStyle}>
            {children}
        </div>
    );
  };

// Convertit un paramètre simple (-5 à 5) en courbe cubic-bezier
const getAccelEasing = (accel) => {
    // accel négatif = ease-out (rapide au début, lent à la fin)
    // accel positif = ease-in (lent au début, rapide à la fin)
    // 0 = linéaire
    const clamped = Math.max(-5, Math.min(5, accel));
    if (clamped === 0) return 'linear';
    if (clamped > 0) {
        // ease-in : plus accel est grand, plus c'est lent au début
        const strength = clamped / 5;
        return `cubic-bezier(${0.4 + strength * 0.4}, 0, 1, 1)`;
    } else {
        // ease-out : plus accel est négatif, plus c'est rapide au début
        const strength = Math.abs(clamped) / 5;
        return `cubic-bezier(0, 0, ${0.6 - strength * 0.4}, 1)`;
    }
};

// --- 2. ASSETS & UI ATOMS ---

const VibeLogo = ({ size = CONFIG.VIBELOGO_SIZE }) => (
    <div className="flex items-baseline tracking-tighter select-none relative" style={{ fontSize: size }}>
        <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 pr-1 mr-[-0.1em]" style={{ fontSize: '140%', lineHeight: 1 }}>V</span>
        <div className="font-bold text-gray-900 tracking-tight flex items-baseline">
            <span className="relative">
                ı
                <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: '-0.3em' }}>
                     <Flame style={{ width: '0.4em', height: '0.4em' }} className="text-pink-500 fill-pink-500" /> 
                </div>
            </span>
            <span>bes</span>
        </div>
    </div>
);

const VibeBuilderTitle = () => (
    <div className="flex items-center select-none justify-center" style={{ gap: UNIFIED_CONFIG.TITLE_ICON_GAP }}>
        <VibesWave size={UNIFIED_CONFIG.TITLE_ICON_SIZE * 2} />
        <span
            className="font-black text-gray-900"
            style={{
                fontSize: UNIFIED_CONFIG.TITLE_FONT_SIZE,
                fontVariant: 'small-caps',
                textTransform: 'lowercase'
            }}
        >
            Builder
        </span>
    </div>
);

const VibingTitle = ({ size = CONFIG.VIBING_TITLE_SIZE }) => (
    <div className="flex items-baseline tracking-tighter select-none justify-center" style={{ fontSize: size }}>
        <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 pr-1 mr-[-0.1em]" style={{ fontSize: '140%', lineHeight: 1 }}>V</span>
        <span className="font-bold text-gray-900 tracking-tight" style={{ lineHeight: 1 }}>ibing</span>
    </div>
);

// Bouton de tri avec toggle de direction (A→Z / Z→A ou moins/plus)
const ToggleSortBtn = ({
    type,           // 'title' | 'artist' | 'playCount'
    sortMode,
    setSortMode,
    sortDirection,  // 'asc' | 'desc'
    setSortDirection,
    isFirst,
    hideGlow = false,
    is3DMode = false
}) => {
    const [justActivated, setJustActivated] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const prevActiveRef = useRef(false);
    
    // Déterminer si ce bouton est actif
    const isActive = (type === 'title' && sortMode === 'alphaTitle') ||
                     (type === 'artist' && sortMode === 'alphaArtist') ||
                     (type === 'playCount' && (sortMode === 'leastPlayed' || sortMode === 'mostPlayed'));
    
    useEffect(() => {
        if (isActive && !prevActiveRef.current) {
            setJustActivated(true);
            const timer = setTimeout(() => setJustActivated(false), CONFIG.NEON_IGNITE_DURATION);
            return () => clearTimeout(timer);
        }
        prevActiveRef.current = isActive;
    }, [isActive]);
    
    // Déterminer l'icône et la couleur selon le type et la direction
    let Icon, bgColor, glowRGB;
    if (type === 'title') {
        // Icône change seulement si ce bouton est actif
        Icon = (isActive && sortDirection === 'desc') ? ArrowUpZA : ArrowDownAZ;
        bgColor = CONFIG.BTN_TITLE_COLOR;
        glowRGB = extractRGB(CONFIG.BTN_TITLE_COLOR);
    } else if (type === 'artist') {
        Icon = User;
        bgColor = CONFIG.BTN_ARTIST_COLOR;
        glowRGB = extractRGB(CONFIG.BTN_ARTIST_COLOR);
    } else if (type === 'playCount') {
        if (sortMode === 'leastPlayed') {
            Icon = Snowflake;
            bgColor = CONFIG.BTN_PLAYCOUNT_LEAST_COLOR;
            glowRGB = extractRGB(CONFIG.BTN_PLAYCOUNT_LEAST_COLOR);
        } else if (sortMode === 'mostPlayed') {
            Icon = Flame;
            bgColor = CONFIG.BTN_PLAYCOUNT_MOST_COLOR;
            glowRGB = extractRGB(CONFIG.BTN_PLAYCOUNT_MOST_COLOR);
        } else {
            // Inactif - afficher flocon par défaut
            Icon = Snowflake;
            bgColor = CONFIG.BTN_PLAYCOUNT_LEAST_COLOR;
            glowRGB = extractRGB(CONFIG.BTN_PLAYCOUNT_LEAST_COLOR);
        }
    }
    
    const handleClick = () => {
        // Toujours déclencher l'animation (key force le remount)
        setAnimKey(k => k + 1);
        setJustActivated(true);
        setTimeout(() => setJustActivated(false), CONFIG.NEON_IGNITE_DURATION);
        
        if (type === 'title') {
            if (sortMode === 'alphaTitle') {
                // Toggle direction
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
                setSortMode('alphaTitle');
                setSortDirection('asc');
            }
        } else if (type === 'artist') {
            if (sortMode === 'alphaArtist') {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
                setSortMode('alphaArtist');
                setSortDirection('asc');
            }
        } else if (type === 'playCount') {
            if (sortMode === 'leastPlayed') {
                setSortMode('mostPlayed');
            } else if (sortMode === 'mostPlayed') {
                setSortMode('leastPlayed');
            } else {
                setSortMode('leastPlayed');
            }
        }
    };
    
    const roundedClass = isFirst ? 'rounded-l-full' : '';
    
    return (
        <div className={`flex-1 h-full relative overflow-visible ${roundedClass}`} style={{ transform: 'translateZ(0)' }}>
            {/* Masque cylindre pour boutons OFF (sans NeonGlow) */}
            {!isActive && (
                <CylinderMask intensity={CONFIG.CAPSULE_CYLINDER_INTENSITY_OFF} className={roundedClass} is3DMode={is3DMode} />
            )}
            {isActive && !hideGlow && (
                <NeonGlow
                    key={animKey}
                    colorName={'pink'}
                    glowRGB={glowRGB}
                    enabled={true}
                    igniteOnMount={true}
                    flickerEnabled={true}
                    className={`absolute inset-0 ${roundedClass}`}
                    style={{
                        background: bgColor,
                        zIndex: 0
                    }}
                />
            )}
            {/* Masque cylindre pour boutons ON (par-dessus le NeonGlow) */}
            {isActive && (
                <CylinderMask intensity={CONFIG.CAPSULE_CYLINDER_INTENSITY_ON} className={roundedClass} is3DMode={is3DMode} />
            )}
            <button
                onClick={handleClick}
                className={`relative z-10 w-full h-full flex items-center justify-center transition-all duration-200 ${roundedClass} ${isActive ? 'text-white' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
            > 
                {type === 'artist' ? (
                    <div className="flex items-center" style={{ gap: '1px' }}>
                        {(isActive ? sortDirection : 'asc') === 'asc' ? (
                            <MoveDown style={{ width: '0.85rem', height: '0.85rem' }} />
                        ) : (
                            <MoveUp style={{ width: '0.85rem', height: '0.85rem' }} />
                        )}
                        <Icon style={{ width: CONFIG.HEADER_SORT_ICON_SIZE, height: CONFIG.HEADER_SORT_ICON_SIZE }} />
                    </div>
                ) : (
                    <Icon style={{ width: CONFIG.HEADER_SORT_ICON_SIZE, height: CONFIG.HEADER_SORT_ICON_SIZE }} />
                )}
            </button>
        </div>
    );
};

// Bouton filtre fichiers (cycle: available -> all -> unavailable -> available)
const FileFilterBtn = ({ fileFilter, setFileFilter, hideGlow = false, is3DMode = false }) => {
    const [justActivated, setJustActivated] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const prevFilterRef = useRef(fileFilter);
    
    useEffect(() => {
        if (fileFilter !== prevFilterRef.current) {
            setJustActivated(true);
            const timer = setTimeout(() => setJustActivated(false), CONFIG.NEON_IGNITE_DURATION);
            prevFilterRef.current = fileFilter;
            return () => clearTimeout(timer);
        }
    }, [fileFilter]);
    
    // Cycle: available -> all -> unavailable -> available
    const cycleFilter = () => {
        // Toujours déclencher l'animation (animKey force le remount)
        setAnimKey(k => k + 1);
        setJustActivated(true);
        setTimeout(() => setJustActivated(false), CONFIG.NEON_IGNITE_DURATION);
        
        if (fileFilter === 'available') setFileFilter('all');
        else if (fileFilter === 'all') setFileFilter('unavailable');
        else setFileFilter('available');
    };
    
    // Icône et couleur selon l'état
    let Icon, bgColor, glowRGB;
    if (fileFilter === 'all') {
        Icon = ListChecks;
        bgColor = CONFIG.BTN_FILTER_ALL_COLOR;
        glowRGB = extractRGB(CONFIG.BTN_FILTER_ALL_COLOR);
    } else if (fileFilter === 'available') {
        Icon = CheckCircle2;
        bgColor = CONFIG.BTN_FILTER_AVAILABLE_COLOR;
        glowRGB = extractRGB(CONFIG.BTN_FILTER_AVAILABLE_COLOR);
    } else {
        Icon = Ghost;
        bgColor = CONFIG.BTN_FILTER_UNAVAILABLE_COLOR;
        glowRGB = extractRGB(CONFIG.BTN_FILTER_UNAVAILABLE_COLOR);
    }
    
    return (
        <div className="flex-1 h-full relative overflow-visible rounded-r-full" style={{ transform: 'translateZ(0)' }}>
            {!hideGlow && (
                <NeonGlow
                    key={animKey}
                    colorName={fileFilter === 'available' ? 'green' : fileFilter === 'unavailable' ? 'orange' : 'cyan'}
                    glowRGB={glowRGB}
                    enabled={true}
                    igniteOnMount={true}
                    flickerEnabled={true}
                    className="absolute inset-0 rounded-r-full"
                    style={{
                        background: bgColor,
                        zIndex: 0
                    }}
                />
            )}
            {/* Masque cylindre - toujours actif car ce bouton est toujours coloré (par-dessus le NeonGlow) */}
            <CylinderMask intensity={CONFIG.CAPSULE_CYLINDER_INTENSITY_ON} className="rounded-r-full" is3DMode={is3DMode} />
            <button
                onClick={cycleFilter}
                className="relative z-10 w-full h-full flex items-center justify-center text-white rounded-r-full"
            >
                <Icon style={{ width: CONFIG.HEADER_FILTER_ICON_SIZE, height: CONFIG.HEADER_FILTER_ICON_SIZE }} />
            </button>
        </div>
    );
};

// --- 3. BUILDER ROW (2.125rem = 34px - TITRE/ARTISTE REGROUPÉS) ---

const BuilderRow = ({ song, isSelected, onToggle, onLongPress, sortMode }) => {
    const isArtistSort = sortMode === 'alphaArtist';
    const longPressTimer = useRef(null);
    const touchMoved = useRef(false);
    const longPressTriggered = useRef(false);
    const songAvailable = isSongAvailable(song);

    const handleTouchStart = (e) => {
        // Ne pas activer le long press si le morceau n'est pas disponible
        if (!songAvailable) return;

        touchMoved.current = false;
        longPressTriggered.current = false;
        longPressTimer.current = setTimeout(() => {
            if (!touchMoved.current && onLongPress) {
                longPressTriggered.current = true;
                onLongPress(song);
            }
        }, CONFIG.LONG_PRESS_DURATION);
    };
    
    const handleTouchMove = () => {
        touchMoved.current = true;
        clearTimeout(longPressTimer.current);
    };
    
    const handleTouchEnd = () => {
        clearTimeout(longPressTimer.current);
    };
    
    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };
    
    return (
        <div 
            data-song-id={song.id}
            className={`flex items-center justify-between transition-all select-none bg-white active:bg-gray-50 relative w-full no-context-menu`}
            style={{ height: CONFIG.ROW_HEIGHT }}
            onContextMenu={handleContextMenu}
        >
            {/* COULOIR GAUCHE (VIDE) */}
            <div className="h-full flex-shrink-0 border-r border-gray-100" style={{ width: CONFIG.ROW_LEFT_COLUMN_WIDTH }}></div>

            {/* CONTENU DROIT - avec détection long press */}
            <div 
                className="flex-1 flex items-center gap-2 overflow-hidden w-full pl-3 pr-4 h-full border-b border-gray-100"
                onClick={() => { if (!touchMoved.current && !longPressTriggered.current) onToggle(song); }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onContextMenu={handleContextMenu}
                onMouseDown={(e) => { if (e.button === 2) e.preventDefault(); }}
            >
                {/* Checkbox */}
                <div
                    className={`rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 ${isSelected ? 'text-white scale-110' : 'bg-gray-100 text-gray-300'}`}
                    style={{ width: CONFIG.ROW_CHECKBOX_SIZE, height: CONFIG.ROW_CHECKBOX_SIZE, backgroundColor: isSelected ? '#ec4899' : undefined }}
                >
                    {isSelected ? <Check style={{ width: CONFIG.ROW_CHECKBOX_ICON_SIZE, height: CONFIG.ROW_CHECKBOX_ICON_SIZE }} strokeWidth={3} /> : <Plus style={{ width: CONFIG.ROW_CHECKBOX_ICON_SIZE, height: CONFIG.ROW_CHECKBOX_ICON_SIZE }} />}
                </div>
                
                {/* TITRE & ARTISTE */}
                <div className="flex flex-col overflow-hidden min-w-0 flex-1 justify-center h-full pt-px" style={{ lineHeight: CONFIG.ROW_LINE_HEIGHT }}>
                <div className="flex flex-col w-full">
                        {isArtistSort ? (
                            <>
                                <span className={`font-bold truncate ${!isSongAvailable(song) ? 'text-gray-400' : !isSelected ? 'text-gray-900' : ''}`} style={{ fontSize: CONFIG.ROW_TITLE_SIZE, lineHeight: CONFIG.ROW_LINE_HEIGHT, color: isSelected && isSongAvailable(song) ? '#ec4899' : undefined }}>{song.title}</span>
                                <span className={`truncate font-medium ${!isSongAvailable(song) ? 'text-gray-300' : 'text-gray-500'}`} style={{ fontSize: CONFIG.ROW_SUBTITLE_SIZE, lineHeight: CONFIG.ROW_LINE_HEIGHT }}>{song.artist}</span>
                            </>
                        ) : (
                            <>
                                <span className={`font-bold truncate ${!isSongAvailable(song) ? 'text-gray-400' : !isSelected ? 'text-gray-900' : ''}`} style={{ fontSize: CONFIG.ROW_TITLE_SIZE, lineHeight: CONFIG.ROW_LINE_HEIGHT, color: isSelected && isSongAvailable(song) ? '#ec4899' : undefined }}>{song.title}</span>
                                <span className={`truncate font-medium ${!isSongAvailable(song) ? 'text-gray-300' : 'text-gray-500'}`} style={{ fontSize: CONFIG.ROW_SUBTITLE_SIZE, lineHeight: CONFIG.ROW_LINE_HEIGHT }}>{song.artist}</span>
                            </>
                        )}
                    </div>
                </div>
                
                {/* PLAY COUNT */}
                <div className="flex items-center gap-0.5 text-gray-300 font-mono pl-2" style={{ fontSize: CONFIG.ROW_PLAYCOUNT_SIZE }}>
                    <Headphones style={{ width: CONFIG.ROW_PLAYCOUNT_SIZE, height: CONFIG.ROW_PLAYCOUNT_SIZE }} /> 
                    <span>{song.playCount || 0}</span>
                </div>
            </div>
        </div>
    );
};

// --- 4. VIBE BUILDER COMPONENT ---

const VibeBuilder = ({ allGlobalSongs = [], onClose, onSaveVibe, onDeleteVibe, onPlayNext, fadeMainAudio, hasActiveQueue, vibeCardConfig, initialGradientIndex, getGradientByIndex, getGradientName, usedGradientIndices = [], totalGradients = 20, cardAnimConfig = { openDuration: 400, openDecel: 0.85, closeDuration: 300, closeRotation: 15, radius: '2rem', borderColor: '#e5e7eb', borderWidth: 2 }, editMode = false, editVibeId = null, editVibeName = '', editVibeSongs = [], editVibeGradientIndex = 0, showTitles = true, is3DMode = false }) => {
    // Animation d'ouverture/fermeture (comme Tweaker)
    const [isVisible, setIsVisible] = useState(false);
    const [isOpenAnimating, setIsOpenAnimating] = useState(true);
    const [closingDirection, setClosingDirection] = useState(null);
    const [titleSwipeX, setTitleSwipeX] = useState(0);
    const titleStartX = useRef(0);
    const [selectedSongs, setSelectedSongs] = useState(editMode ? editVibeSongs : []);
    const [vibeName, setVibeName] = useState(editMode ? editVibeName : '');
    const [nameWasEdited, setNameWasEdited] = useState(editMode); // En mode édition, on ne génère pas de nom auto
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef(null);
    const [isCreatingVibe, setIsCreatingVibe] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmSwipeX, setDeleteConfirmSwipeX] = useState(0);
    const deleteConfirmStartX = useRef(null);
    const [closeBtnAnimating, setCloseBtnAnimating] = useState(false);
    const [createBtnAnimating, setCreateBtnAnimating] = useState(false);
    const [createBtnErrorAnimating, setCreateBtnErrorAnimating] = useState(false);
    
    const [sortMode, setSortMode] = useState('alphaTitle');
    const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
    const [fileFilter, setFileFilter] = useState(editMode ? 'all' : 'available'); // 'available', 'all', 'unavailable' - en mode édition, afficher tout
    
    const listRef = useRef(null);
    // IMPORTANT : On utilise une ref pour stocker la hauteur réelle d'une ligne
    // mesurée au montage pour garantir la précision de la SmartWave quel que soit l'écran/zoom.
    const rowHeightRef = useRef(34); // Valeur par défaut en px, sera mise à jour
    const colWidthRef = useRef(60);

    const stateRef = useRef({
        selectedSongs,
        displaySongs: [],
        dragState: null
    });

    const [dragState, setDragState] = useState(null);
    const [listScrollTop, setListScrollTop] = useState(0);
    const [listContainerHeight, setListContainerHeight] = useState(0); 
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchOverlayAnim, setSearchOverlayAnim] = useState('none'); // 'none' | 'opening' | 'closing'
    const [closeBtnAnimKey, setCloseBtnAnimKey] = useState(0);
    const [isAnimatingAddAll, setIsAnimatingAddAll] = useState(false);
    const [isAnimatingCreate, setIsAnimatingCreate] = useState(false);
    
    const [vibingSong, setVibingSong] = useState(null);
    const [previewSwipeX, setPreviewSwipeX] = useState(0);
    const [previewSwipeStart, setPreviewSwipeStart] = useState(null);
    const [previewFeedback, setPreviewFeedback] = useState(null); // { type: 'add' | 'queue' | 'cancel' }
    const [previewHasDragged, setPreviewHasDragged] = useState(false); // True dès qu'on commence à drag

    // État pour le gradient de la future Vibe (fixe au montage, modifiable par swipe)
    const [chosenGradientIndex, setChosenGradientIndex] = useState(editMode ? editVibeGradientIndex : (initialGradientIndex || 0));
    const [cardSwipeOffset, setCardSwipeOffset] = useState(0);
    const [cardSwipeDirection, setCardSwipeDirection] = useState(null);
    const [previewGradientIndex, setPreviewGradientIndex] = useState(null);
    const [isCardSwipeCatchingUp, setIsCardSwipeCatchingUp] = useState(false); // Animation de rattrapage
    const cardTouchStartX = useRef(null);
    const cardTouchStartY = useRef(null);
    const cardWidthRef = useRef(300);
    
    // Nombre total de dégradés pour le cycle
    const gradientCount = totalGradients || 20;
    
    // Calculer le gradient (preview si swipe en cours, sinon choisi)
    const displayGradientIndex = previewGradientIndex !== null ? previewGradientIndex : chosenGradientIndex;
    const futureGradientColors = getGradientByIndex ? getGradientByIndex(displayGradientIndex) : ['#ec4899', '#8b5cf6', '#6366f1'];
    const futureGradientStep = 100 / (futureGradientColors.length - 1);
    const futureGradient = `linear-gradient(135deg, ${futureGradientColors.map((c, i) => `${c} ${Math.round(i * futureGradientStep)}%`).join(', ')})`;
    const futurePrimaryColor = futureGradientColors[0];
    
    // Vérifier si cette couleur est déjà utilisée par une autre Vibe
    const isColorAlreadyUsed = usedGradientIndices.includes(displayGradientIndex);
    // Vérifier si TOUTES les couleurs sont déjà utilisées
    const allColorsUsed = usedGradientIndices.length >= totalGradients;
    
    // Liste ordonnée des indices de gradients (0, 1, 2, ..., totalGradients-1)
    const orderedGradientIndices = useMemo(() => 
        Array.from({ length: totalGradients }, (_, i) => i), 
        [totalGradients]
    );
    // Position actuelle dans la liste ordonnée
    const currentPositionInOrder = orderedGradientIndices.indexOf(chosenGradientIndex); 

    // Animation d'ouverture au montage
    useEffect(() => {
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
        const timer = setTimeout(() => {
            setIsOpenAnimating(false);
        }, cardAnimConfig.openDuration);
        return () => clearTimeout(timer);
    }, []);

    // Mettre à jour le nom par défaut au montage
    React.useEffect(() => {
        if (getGradientName && vibeName === '') {
            setVibeName(getGradientName(initialGradientIndex || 0));
        }
    }, []);
    
    // Mettre à jour le nom quand on swipe (si le nom n'a pas été modifié manuellement)
    React.useEffect(() => {
        if (getGradientName && !nameWasEdited) {
            setVibeName(getGradientName(displayGradientIndex));
        }
    }, [displayGradientIndex]);
    

    // Handlers de swipe pour la carte de prévisualisation
    const handleCardTouchStart = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        cardTouchStartX.current = clientX;
        cardTouchStartY.current = clientY;
        setCardSwipeDirection(null);
        if (e.currentTarget) cardWidthRef.current = e.currentTarget.offsetWidth;
    };
    
    const handleCardTouchMove = (e) => {
        if (cardTouchStartX.current === null || cardTouchStartY.current === null) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clienY = e.touches ? e.touches[0].clientY : e.clientY;
        const diffX = clientX - cardTouchStartX.current;
        const diffY = clientY - cardTouchStartY.current;
        
        if (cardSwipeDirection === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
            const newDirection = Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical';
            setCardSwipeDirection(newDirection);

            // Si horizontal, activer l'animation de rattrapage
            if (newDirection === 'horizontal') {
                setIsCardSwipeCatchingUp(true);
                setTimeout(() => setIsCardSwipeCatchingUp(false), 120);
            }
        }

        if (cardSwipeDirection === 'vertical') return;

        if (cardSwipeDirection === 'horizontal') {
            const maxSwipeDistance = cardWidthRef.current * CONFIG.COLOR_SWIPE_PERCENT / 100;

            if (Math.abs(diffX) < maxSwipeDistance) {
                setCardSwipeOffset(diffX);

                // Calculer la preview du gradient en temps réel (en utilisant la liste ordonnée)
                if (diffX !== 0) {
                    const direction = diffX > 0 ? -1 : 1;
                    // Calculer combien de couleurs on a parcouru (0 à totalGradients)
                    const stepsTraversed = Math.floor((Math.abs(diffX) / maxSwipeDistance) * orderedGradientIndices.length);
                    const newPositionInOrder = ((currentPositionInOrder + (direction * stepsTraversed)) % orderedGradientIndices.length + orderedGradientIndices.length) % orderedGradientIndices.length;
                    setPreviewGradientIndex(orderedGradientIndices[newPositionInOrder]);
                } else {
                    setPreviewGradientIndex(null);
                }
            }
        }
    };
    
    const handleCardTouchEnd = () => {
        if (cardSwipeDirection === 'horizontal' && Math.abs(cardSwipeOffset) > 30) {
            const direction = cardSwipeOffset > 0 ? -1 : 1;
            const maxSwipeDistance = cardWidthRef.current * CONFIG.COLOR_SWIPE_PERCENT / 100;
            const stepsTraversed = Math.max(1, Math.floor((Math.abs(cardSwipeOffset) / maxSwipeDistance) * orderedGradientIndices.length));
            const newPositionInOrder = ((currentPositionInOrder + (direction * stepsTraversed)) % orderedGradientIndices.length + orderedGradientIndices.length) % orderedGradientIndices.length;
            setChosenGradientIndex(orderedGradientIndices[newPositionInOrder]);
        }
        setCardSwipeOffset(0);
        setPreviewGradientIndex(null);
        cardTouchStartX.current = null;
        cardTouchStartY.current = null;
        setCardSwipeDirection(null);
    };
    
    const [touchY, setTouchY] = useState(0); 
    const sliderHeightRef = useRef(56); 
    const previewAudioRef = useRef(new Audio()); 
    const previewTimeoutRef = useRef(null);
    
    // ========== PARAMÈTRES PRÉ-ÉCOUTE ==========
    const PREVIEW_DURATION = 15; // Durée en secondes
    // =========================================== 

    // === FORMAT BIBLIOTHÈQUE - allGlobalSongs est déjà dédupliqué depuis la library ===
    const allSongs = allGlobalSongs;

    const displaySongs = useMemo(() => { 
        let results = [...allSongs]; 
        
        // Filtre par accessibilité des fichiers
        if (fileFilter === 'available') {
            results = results.filter(s => isSongAvailable(s));
        } else if (fileFilter === 'unavailable') {
            results = results.filter(s => !isSongAvailable(s));
        }
        
        // Filtre par recherche
        if (searchQuery) { 
            const lowerQ = searchQuery.toLowerCase(); 
            results = results.filter(s => s.title.toLowerCase().includes(lowerQ) || s.artist.toLowerCase().includes(lowerQ)); 
        } 
        
        // Tri
        switch (sortMode) { 
            case 'alphaTitle': 
                results.sort((a, b) => sortDirection === 'asc' 
                    ? a.title.localeCompare(b.title) 
                    : b.title.localeCompare(a.title)); 
                break; 
            case 'alphaArtist': 
                results.sort((a, b) => sortDirection === 'asc' 
                    ? a.artist.localeCompare(b.artist) 
                    : b.artist.localeCompare(a.artist)); 
                break; 
                case 'leastPlayed': results.sort((a, b) => (a.playCount || 0) - (b.playCount || 0)); break; 
                case 'mostPlayed': results.sort((a, b) => (b.playCount || 0) - (a.playCount || 0)); break; 
            }
            return results;
        }, [allSongs, sortMode, sortDirection, searchQuery, fileFilter]);

    // Garder les refs à jour
    useEffect(() => {
        stateRef.current.selectedSongs = selectedSongs;
        stateRef.current.displaySongs = displaySongs;
        stateRef.current.dragState = dragState;
    }, [selectedSongs, displaySongs, dragState]);

    // Calcul des opacités des fades (indicateurs de scroll)
    const listFades = useMemo(() => {
        const totalContentHeight = displaySongs.length * rowHeightRef.current;
        const maxScroll = Math.max(0, totalContentHeight - listContainerHeight);

        // Fade du haut : visible si on n'est pas tout en haut
        const topFadeOpacity = listScrollTop > 10 ? 1 : listScrollTop / 10;

        // Fade du bas : visible si on n'est pas tout en bas
        const distanceFromBottom = maxScroll - listScrollTop;
        const bottomFadeOpacity = distanceFromBottom > 10 ? 1 : Math.max(0, distanceFromBottom / 10);

        return { topFadeOpacity, bottomFadeOpacity };
    }, [displaySongs.length, listContainerHeight, listScrollTop]);

    // Initialiser la hauteur du conteneur au montage
    useEffect(() => {
        if (listRef.current && listContainerHeight === 0) {
            setListContainerHeight(listRef.current.clientHeight);
        }
    }, [listContainerHeight]);

    // MESURE DE LA HAUTEUR RÉELLE POUR SMARTWAVE RESPONSIVE
    useEffect(() => {
        const dummyRow = document.createElement('div');
        dummyRow.style.height = CONFIG.ROW_HEIGHT;
        dummyRow.style.width = CONFIG.ROW_LEFT_COLUMN_WIDTH;
        dummyRow.style.position = 'absolute';
        dummyRow.style.visibility = 'hidden';
        document.body.appendChild(dummyRow);
        
        const rect = dummyRow.getBoundingClientRect();
        rowHeightRef.current = rect.height;
        colWidthRef.current = rect.width;
        
        document.body.removeChild(dummyRow);

        const dummySlider = document.createElement('div');
        dummySlider.style.height = CONFIG.ROW_SLIDER_HEIGHT;
        dummySlider.style.position = 'absolute';
        dummySlider.style.visibility = 'hidden';
        document.body.appendChild(dummySlider);
        sliderHeightRef.current = dummySlider.getBoundingClientRect().height;
        document.body.removeChild(dummySlider);
    }, []);

    const toggleSong = (song) => { 
        if (selectedSongs.find(s => s.id === song.id)) { 
            setSelectedSongs(prev => prev.filter(s => s.id !== song.id)); 
        } else { 
            setSelectedSongs(prev => [...prev, song]); 
        } 
    };

    // PRÉ-ÉCOUTE LOGIC
    const startVibing = (song) => {
        console.log("startVibing called with:", song.title, "file:", song.file);

        // Baisser le volume principal (ducking) au lieu de couper
        if (fadeMainAudio) fadeMainAudio('duck', 0.25);
        setVibingSong(song);
        
        if (isSongAvailable(song)) {
            // Pour Dropbox, il faudrait récupérer le lien temporaire - pour l'instant on ne supporte que les fichiers locaux
            if (song.file) {
                console.log("Attempting to play:", song.file);
                previewAudioRef.current.src = song.file;
            } else {
                console.log("Dropbox preview not yet supported");
                return;
            }
            previewAudioRef.current.currentTime = CONFIG.PREVIEW_START_TIME;
            
            // Fade in
            const fadeDuration = CONFIG.PREVIEW_FADEIN_DURATION;
            if (fadeDuration > 0) {
                previewAudioRef.current.volume = 0;
                previewAudioRef.current.play()
                    .then(() => {
                        console.log("Audio playing with fade in!");
                        const steps = 20;
                        const interval = fadeDuration / steps;
                        const volumeStep = 1 / steps;
                        let currentStep = 0;
                        const fadeInterval = setInterval(() => {
                            currentStep++;
                            previewAudioRef.current.volume = Math.min(1, currentStep * volumeStep);
                            if (currentStep >= steps) {
                                clearInterval(fadeInterval);
                            }
                        }, interval);
                    })
                    .catch(e => console.log("Preview error:", e.message));
                } else {
                    previewAudioRef.current.volume = 1;
                    previewAudioRef.current.play()
                        .catch(e => console.log("Preview error:", e.message));
                }
                
                // Auto-stop après PREVIEW_DURATION secondes
            previewTimeoutRef.current = setTimeout(() => {
                stopVibing(false);
            }, PREVIEW_DURATION * 1000);
        }
    };

    const stopVibing = (action) => {
        // Nettoyer le timeout auto-stop
        if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current);
            previewTimeoutRef.current = null;
        }
        
        const songToProcess = vibingSong;
        setVibingSong(null);
        
        // Fade out de l'audio preview
        const audio = previewAudioRef.current;
        const fadeDuration = CONFIG.PREVIEW_FADEOUT_DURATION;
        
        if (fadeDuration > 0 && audio.volume > 0) {
            const steps = 20;
            const stepTime = fadeDuration / steps;
            const volumeStep = audio.volume / steps;
            let currentStep = 0;
            
            const fadeInterval = setInterval(() => {
                currentStep++;
                audio.volume = Math.max(0, audio.volume - volumeStep);
                
                if (currentStep >= steps) {
                    clearInterval(fadeInterval);
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = 1; // Reset pour la prochaine lecture
                }
            }, stepTime);
        } else {
            audio.pause();
            audio.currentTime = 0;
        }

        // Restaurer le volume principal
        if (fadeMainAudio) fadeMainAudio('in');

        if (action === 'add' && songToProcess) {
            if (!selectedSongs.find(s => s.id === songToProcess.id)) {
                setSelectedSongs(prev => [...prev, songToProcess]);
            }
        } else if (action === 'playNext' && songToProcess && onPlayNext) {
            onPlayNext(songToProcess);
        }
    };
    
    // SMARTWAVE LOGIC (Utilise rowHeightRef.current)
    // Refs pour le scroll continu
    const scrollIntervalRef = useRef(null);
    const touchYRelativeRef = useRef(0);

    useEffect(() => {
        const container = listRef.current;
        if (!container) return;

        const SCROLL_ZONE = rowHeightRef.current * 3; // 3 lignes de chansons du bord
        const SCROLL_SPEED = 15;
        const SCROLL_INTERVAL = 25; // ms entre chaque scroll

        // Fonction pour mettre à jour la sélection basée sur la position actuelle
        const updateSelection = (currentDragState) => {
            const currentScrollTop = container.scrollTop;
            const currentYAbsolute = Math.max(0, touchYRelativeRef.current + currentScrollTop);

            setDragState(prev => prev ? ({ ...prev, currentYAbsolute: currentYAbsolute }) : null);

            const paintStart = Math.min(currentDragState.startYAbsolute, currentYAbsolute);
            const paintEnd = Math.max(currentDragState.startYAbsolute, currentYAbsolute);

            const startIndex = Math.floor(paintStart / rowHeightRef.current);
            const endIndex = Math.floor(paintEnd / rowHeightRef.current);

            const songsTouched = stateRef.current.displaySongs.slice(Math.max(0, startIndex), endIndex + 1);
            const touchedIds = new Set(songsTouched.map(s => s.id));

            setSelectedSongs(prev => {
                let newSelection = prev.filter(s => !touchedIds.has(s.id));
                if (currentDragState.isAddingMode) {
                    const songsToAdd = songsTouched;
                    const combinedIds = new Set([...newSelection.map(s => s.id), ...songsToAdd.map(s => s.id)]);
                    return stateRef.current.displaySongs.filter(s => combinedIds.has(s.id));
                } else {
                    return newSelection;
                }
            });
        };

        // Fonction de scroll continu appelée par setInterval
        const continuousScroll = () => {
            const currentDragState = stateRef.current.dragState;
            if (!currentDragState) return;

            const containerHeight = container.clientHeight;
            const touchY = touchYRelativeRef.current;

            // Scroll si dans les zones de bord
            if (touchY < SCROLL_ZONE) {
                container.scrollTop -= SCROLL_SPEED;
                updateSelection(currentDragState);
            } else if (touchY > containerHeight - SCROLL_ZONE) {
                container.scrollTop += SCROLL_SPEED;
                updateSelection(currentDragState);
            }
        };

        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            const rect = container.getBoundingClientRect();

            // ZONE GAUCHE RESPONSIVE
            if (touch.clientX - rect.left <= colWidthRef.current) {
                if (e.cancelable) e.preventDefault();
                const scrollTop = container.scrollTop;
                const startY = touch.clientY - rect.top;

                // CALCUL ABSOLU DU DÉPART (ANCRE)
                const startYAbsolute = startY + scrollTop;

                // Utilisation de la hauteur mesurée dynamiquement
                const startIndex = Math.floor(startYAbsolute / rowHeightRef.current);
                const currentDisplaySongs = stateRef.current.displaySongs;
                const startSong = currentDisplaySongs[startIndex];

                let isAddingMode = true;
                if (startSong && stateRef.current.selectedSongs.find(s => s.id === startSong.id)) {
                    isAddingMode = false;
                }

                touchYRelativeRef.current = startY;
                setDragState({ startYAbsolute: startYAbsolute, currentYAbsolute: startYAbsolute, rectTop: rect.top, isAddingMode: isAddingMode });

                // Démarrer le scroll continu
                scrollIntervalRef.current = setInterval(continuousScroll, SCROLL_INTERVAL);
            }
        };

        const handleTouchMove = (e) => {
            const currentDragState = stateRef.current.dragState;
            if (currentDragState) {
                if (e.cancelable) e.preventDefault();
                const touch = e.touches[0];
                const touchYRelative = touch.clientY - currentDragState.rectTop;

                // Stocker la position Y pour le scroll continu
                touchYRelativeRef.current = touchYRelative;

                // Mettre à jour la sélection immédiatement
                updateSelection(currentDragState);
            }
        };

        const handleTouchEnd = () => {
            // Arrêter le scroll continu
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }
            setDragState(null);
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
            }
        };
    }, []); 

    const handleAddAll = () => { 
        setIsAnimatingAddAll(true);
        const songsToAdd = displaySongs.filter(s => !selectedSongs.find(sel => sel.id === s.id)); 
        setSelectedSongs(prev => [...prev, ...songsToAdd]); 
        setTimeout(() => {
            setIsAnimatingAddAll(false);
            setSearchQuery(''); 
            setIsSearching(false); 
        }, CONFIG.BLINK_ANIMATION_DURATION);
    };
    const handleSave = () => {
        if (isCreatingVibe) return;

        // Si aucun morceau sélectionné
        if (selectedSongs.length === 0) {
            if (editMode) {
                // Mode édition : proposer de supprimer la vibe
                setShowDeleteConfirm(true);
            }
            return;
        }

        setIsCreatingVibe(true);

        // Après le blink, lancer l'animation de fermeture vers la droite
        setTimeout(() => {
            onSaveVibe(vibeName, selectedSongs, chosenGradientIndex);
            handleClose('right');
        }, CONFIG.BLINK_ANIMATION_DURATION);
    };

    const handleDeleteConfirm = () => {
        setIsCreatingVibe(true);
        if (onDeleteVibe) {
            onDeleteVibe();
        }
        handleClose('right');
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setDeleteConfirmSwipeX(0);
    };
    
    // Handlers SIMPLIFIÉS pour la carte (swipe direct partout sauf + et capsule)
    const handleCardSwipeStart = (e) => {
        // Ignorer si on touche le bouton + ou la capsule
        if (e.target.closest('[data-create-btn]') || e.target.closest('[data-capsule]')) {
            return;
        }
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        cardTouchStartX.current = clientX;
        cardTouchStartY.current = clientY;
        setCardSwipeDirection(null);
        if (e.currentTarget) cardWidthRef.current = e.currentTarget.offsetWidth;
    };

    const handleCardSwipeMove = (e) => {
        if (cardTouchStartX.current === null || cardTouchStartY.current === null) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const diffX = clientX - cardTouchStartX.current;
        const diffY = clientY - cardTouchStartY.current;
        
        // Déterminer la direction
        if (cardSwipeDirection === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
            const newDirection = Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical';
            setCardSwipeDirection(newDirection);

            // Si horizontal, activer l'animation de rattrapage
            if (newDirection === 'horizontal') {
                setIsCardSwipeCatchingUp(true);
                setTimeout(() => setIsCardSwipeCatchingUp(false), 120);
            }
        }

        if (cardSwipeDirection === 'vertical') return;

        if (cardSwipeDirection === 'horizontal') {
            const maxSwipeDistance = cardWidthRef.current * CONFIG.COLOR_SWIPE_PERCENT / 100;
            if (Math.abs(diffX) < maxSwipeDistance) {
                setCardSwipeOffset(diffX);

                // Calculer la preview : cycle simple sur les indices
                const stepsTraversed = Math.floor((Math.abs(diffX) / maxSwipeDistance) * gradientCount);
                if (stepsTraversed >= 1 || diffX !== 0) {
                    const direction = diffX > 0 ? -1 : 1; // droite = précédent, gauche = suivant
                    const newIndex = ((chosenGradientIndex + (direction * stepsTraversed)) % gradientCount + gradientCount) % gradientCount;
                    setPreviewGradientIndex(newIndex);
                } else {
                    setPreviewGradientIndex(null);
                }
            }
        }
    };
    
    const handleCardSwipeEnd = () => {
        // Appliquer le changement de couleur si swipe suffisant
        const maxSwipeDistance = cardWidthRef.current * CONFIG.COLOR_SWIPE_PERCENT / 100;
        const stepsTraversed = Math.floor((Math.abs(cardSwipeOffset) / maxSwipeDistance) * gradientCount);
        if (cardSwipeDirection === 'horizontal' && stepsTraversed >= 1) {
            const direction = cardSwipeOffset > 0 ? -1 : 1;
            const newIndex = ((chosenGradientIndex + (direction * stepsTraversed)) % gradientCount + gradientCount) % gradientCount;
            setChosenGradientIndex(newIndex);
        }
        
        setCardSwipeOffset(0);
        setPreviewGradientIndex(null);
        cardTouchStartX.current = null;
        cardTouchStartY.current = null;
        setCardSwipeDirection(null);
    };
    
    // Condition d'affichage du bouton ADD ALL
    const showAddAll = isSearching && searchQuery && displaySongs.length > 0;

    // Handlers pour le swipe du titre
    const handleTitleTouchStart = (e) => {
        titleStartX.current = e.touches[0].clientX;
    };
    const handleTitleTouchMove = (e) => {
        const diff = e.touches[0].clientX - titleStartX.current;
        setTitleSwipeX(diff);
    };
    const handleTitleTouchEnd = () => {
        if (titleSwipeX > CONFIG.TITLE_SWIPE_THRESHOLD) {
            // Swipe droite = fermer (retour library)
            handleClose('right');
        } else if (titleSwipeX < -CONFIG.TITLE_SWIPE_THRESHOLD) {
            // Swipe gauche = fermer (retour library)
            handleClose('left');
        }
        setTitleSwipeX(0);
    };

    // Fonction pour fermer avec animation
    const handleClose = (direction = 'left') => {
        setClosingDirection(direction);
        setTimeout(() => {
            onClose();
        }, cardAnimConfig.closeDuration);
    };

    return (
        <>
        <div
            className="absolute inset-0 bg-white z-50 flex flex-col"
            style={{
                paddingBottom: 0,
                transformOrigin: `center ${cardAnimConfig.originY}`,
                transform: closingDirection
                    ? `rotateZ(${closingDirection === 'right' ? '' : '-'}${cardAnimConfig.closeRotation}deg)`
                    : titleSwipeX !== 0
                        ? `rotateZ(${titleSwipeX / CONFIG.TITLE_SWIPE_THRESHOLD * CONFIG.SWIPE_MAX_ROTATION}deg)`
                        : isVisible ? 'rotateZ(0deg)' : `rotateZ(-${cardAnimConfig.closeRotation}deg)`,
                borderRadius: (closingDirection || !isVisible || titleSwipeX !== 0) ? cardAnimConfig.radius : '0',
                outline: (closingDirection || !isVisible || isOpenAnimating || titleSwipeX !== 0) ? `${cardAnimConfig.borderWidth}px solid ${cardAnimConfig.borderColor}` : 'none',
                overflow: 'hidden',
                transition: titleSwipeX !== 0
                    ? 'none'
                    : closingDirection
                        ? `transform ${cardAnimConfig.closeDuration}ms linear, border-radius ${cardAnimConfig.closeDuration}ms linear, outline ${cardAnimConfig.closeDuration}ms linear`
                        : `transform ${cardAnimConfig.openDuration}ms cubic-bezier(0, ${cardAnimConfig.openDecel}, ${1 - cardAnimConfig.openDecel}, 1), border-radius ${cardAnimConfig.openDuration}ms cubic-bezier(0, ${cardAnimConfig.openDecel}, ${1 - cardAnimConfig.openDecel}, 1), outline ${cardAnimConfig.openDuration}ms cubic-bezier(0, ${cardAnimConfig.openDecel}, ${1 - cardAnimConfig.openDecel}, 1)`
            }}
        >
            <style>{styles}</style>

            {/* OVERLAY PRÉ-ÉCOUTE */}
            {vibingSong && (() => {
                const screenWidth = window.innerWidth;
                const pillHeight = screenWidth * CONFIG.PREVIEW_PILL_HEIGHT_PERCENT / 100;
                const pillWidth = screenWidth * CONFIG.PREVIEW_PILL_WIDTH_PERCENT / 100;
                const cursorSize = pillHeight * CONFIG.PREVIEW_PILL_CURSOR_SIZE_PERCENT / 100;
                const iconSize = pillHeight * CONFIG.PREVIEW_PILL_ICON_SIZE_PERCENT / 100;
                const pillPadding = (pillHeight - cursorSize) / 2;
                const pulseScaleMax = pillHeight / cursorSize;
                const maxBubbleSize = pillHeight;
                const maxSlide = (pillWidth / 2) - (maxBubbleSize / 2);
                const clampedX = Math.max(-maxSlide, Math.min(maxSlide, previewSwipeX));
                const slideProgress = maxSlide > 0 ? clampedX / maxSlide : 0;

                // Seuils unifiés - l'action se déclenche dès que le pulse s'active
                const threshold = CONFIG.PREVIEW_PILL_THRESHOLD;
                const isAtLeftThreshold = hasActiveQueue && slideProgress <= -threshold;
                const isAtRightThreshold = slideProgress >= threshold;
                const isAtCenter = Math.abs(slideProgress) < 0.2;

                return (
                <div
                    className="absolute inset-0 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300"
                    style={{
                        backdropFilter: `blur(${CONFIG.PREVIEW_BLUR}px)`,
                        WebkitBackdropFilter: `blur(${CONFIG.PREVIEW_BLUR}px)`,
                        backgroundColor: CONFIG.PREVIEW_BG_OVERLAY
                    }}
                >
                    {/* Titre et artiste */}
                    <h2
                        className="font-black text-black text-center px-8 mb-1 tracking-tight"
                        style={{ fontSize: CONFIG.PREVIEW_TITLE_SIZE }}
                    >
                        {vibingSong.title}
                    </h2>
                    <p
                        className="text-pink-500 font-bold text-center px-8"
                        style={{ fontSize: CONFIG.PREVIEW_ARTIST_SIZE, marginBottom: CONFIG.PREVIEW_TEXT_MARGIN_BOTTOM }}
                    >
                        {vibingSong.artist}
                    </p>

                    {/* Disc qui tourne avec glow cyan */}
                    <div style={{ marginBottom: CONFIG.PREVIEW_DISC_MARGIN_BOTTOM }}>
                        <div
                            className="rounded-full flex items-center justify-center animate-neon-breathe-cyan"
                            style={{
                                width: CONFIG.PREVIEW_DISC_SIZE,
                                height: CONFIG.PREVIEW_DISC_SIZE,
                                background: CONFIG.PREVIEW_DISC_BG
                            }}
                        >
                            <Disc3
                                size={CONFIG.PREVIEW_DISC_ICON_SIZE}
                                className="animate-spin-slow"
                                style={{ color: CONFIG.PREVIEW_DISC_COLOR }}
                            />
                        </div>
                    </div>

                    {/* Pill de confirmation à 3 zones */}
                    <div
                        className="relative flex items-center justify-between"
                        style={{
                            width: pillWidth,
                            height: pillHeight,
                            borderRadius: pillHeight / 2,
                            backgroundColor: CONFIG.PREVIEW_PILL_BG_COLOR,
                            backdropFilter: `blur(${CONFIG.PREVIEW_PILL_BLUR}px)`,
                            WebkitBackdropFilter: `blur(${CONFIG.PREVIEW_PILL_BLUR}px)`,
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            padding: pillPadding,
                        }}
                        onTouchStart={(e) => {
                            e.stopPropagation();
                            setPreviewSwipeStart(e.touches[0].clientX - previewSwipeX);
                        }}
                        onTouchMove={(e) => {
                            if (previewSwipeStart === null) return;
                            if (!previewHasDragged) setPreviewHasDragged(true);
                            const newX = e.touches[0].clientX - previewSwipeStart;
                            setPreviewSwipeX(newX);
                        }}
                        onTouchEnd={() => {
                            if (isAtRightThreshold) {
                                // Droite = Ajouter à la vibe
                                setPreviewFeedback({ type: 'add' });
                                setTimeout(() => {
                                    stopVibing('add');
                                    setPreviewSwipeX(0);
                                    setPreviewFeedback(null);
                                    setPreviewHasDragged(false);
                                }, 400);
                            } else if (isAtLeftThreshold) {
                                // Gauche = Queue Next (si disponible)
                                setPreviewFeedback({ type: 'queue' });
                                setTimeout(() => {
                                    stopVibing('playNext');
                                    setPreviewSwipeX(0);
                                    setPreviewFeedback(null);
                                    setPreviewHasDragged(false);
                                }, 400);
                            } else if (isAtCenter && previewHasDragged) {
                                // Centre = Annuler avec animation ignite rouge (seulement si on a dragué)
                                setPreviewFeedback({ type: 'cancel' });
                                setTimeout(() => {
                                    stopVibing(false);
                                    setPreviewSwipeX(0);
                                    setPreviewFeedback(null);
                                    setPreviewHasDragged(false);
                                }, 400);
                            } else {
                                // Retour au centre
                                setPreviewSwipeX(0);
                                setPreviewHasDragged(false);
                            }
                            setPreviewSwipeStart(null);
                        }}
                    >
                        {/* Icône gauche - Queue Next (cyan) */}
                        <div
                            className={`flex items-center justify-center ${hasActiveQueue ? 'cursor-pointer' : ''}`}
                            style={{
                                width: cursorSize,
                                height: cursorSize,
                                opacity: isAtLeftThreshold ? 0 : (hasActiveQueue ? 0.5 : 0.2),
                                transition: 'opacity 150ms ease-out',
                            }}
                            onClick={() => {
                                if (!hasActiveQueue || isAtLeftThreshold) return;
                                // Animer le curseur vers la gauche
                                setPreviewSwipeX(-maxSlide);
                                // Après l'animation, exécuter l'action queue
                                setTimeout(() => {
                                    setPreviewFeedback({ type: 'queue' });
                                    setTimeout(() => {
                                        stopVibing('playNext');
                                        setPreviewSwipeX(0);
                                        setPreviewFeedback(null);
                                        setPreviewHasDragged(false);
                                    }, 400);
                                }, 200);
                            }}
                        >
                            <ListPlus
                                size={iconSize}
                                className={hasActiveQueue ? "text-cyan-400" : "text-gray-400"}
                                strokeWidth={2.5}
                            />
                        </div>

                        {/* X rouge au centre de la pill (fixe, disparaît quand bulle arrive) */}
                        <div
                            className="absolute flex items-center justify-center cursor-pointer"
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: cursorSize,
                                height: cursorSize,
                                borderRadius: '50%',
                                opacity: (isAtCenter && previewHasDragged) || previewFeedback?.type === 'cancel' ? 0 : 1,
                                transition: 'opacity 150ms ease-out',
                            }}
                            onClick={() => {
                                // Activer hasDragged pour que le curseur devienne rouge, puis déclencher l'annulation
                                setPreviewSwipeX(0);
                                setPreviewHasDragged(true);
                                // Petit délai pour que le curseur devienne rouge avant l'animation ignite
                                setTimeout(() => {
                                    setPreviewFeedback({ type: 'cancel' });
                                    setTimeout(() => {
                                        stopVibing(false);
                                        setPreviewSwipeX(0);
                                        setPreviewFeedback(null);
                                        setPreviewHasDragged(false);
                                    }, 400);
                                }, 50);
                            }}
                        >
                            <X
                                size={iconSize}
                                className="text-red-400"
                                strokeWidth={2.5}
                            />
                        </div>

                        {/* Curseur transparent draggable */}
                        <div
                            className={`absolute flex items-center justify-center ${
                                previewFeedback
                                    ? (previewFeedback.type === 'add' ? 'animate-ignite-pill-green' : previewFeedback.type === 'queue' ? 'animate-ignite-pill-cyan' : previewFeedback.type === 'cancel' ? 'animate-ignite-pill-red' : '')
                                    : (isAtLeftThreshold ? 'animate-pulse-pill-cyan' : isAtRightThreshold ? 'animate-pulse-pill-green' : (isAtCenter && previewHasDragged) ? 'animate-pulse-pill-red' : '')
                            }`}
                            style={{
                                '--pulse-scale-min': 1,
                                '--pulse-scale-max': pulseScaleMax,
                                width: cursorSize,
                                height: cursorSize,
                                borderRadius: '50%',
                                backgroundColor: previewFeedback?.type === 'cancel' || (isAtCenter && previewHasDragged)
                                    ? 'rgba(244, 63, 94, 0.9)'  // Rouge
                                    : isAtLeftThreshold
                                        ? 'rgba(6, 182, 212, 0.9)'  // Cyan
                                        : isAtRightThreshold
                                            ? 'rgba(0, 255, 136, 0.9)'  // Vert néon
                                            : 'rgba(255, 255, 255, 0.15)',  // Transparent
                                border: (isAtLeftThreshold || isAtRightThreshold || (isAtCenter && previewHasDragged)) ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                                left: `calc(50% - ${cursorSize / 2}px + ${isAtLeftThreshold ? -maxSlide : isAtRightThreshold ? maxSlide : (isAtCenter && previewHasDragged) ? 0 : clampedX}px)`,
                                transition: previewSwipeStart !== null ? 'none' : 'left 200ms ease-out, background-color 150ms ease-out',
                                pointerEvents: (!previewHasDragged && isAtCenter) ? 'none' : 'auto',
                            }}
                        >
                            {/* Icône X quand au centre ET qu'on a dragué */}
                            {isAtCenter && previewHasDragged && (
                                <X size={iconSize * 0.7} className="text-white absolute" strokeWidth={2.5} />
                            )}
                            {/* Icône ListPlus quand au seuil gauche */}
                            {isAtLeftThreshold && (
                                <ListPlus size={iconSize * 0.7} className="text-white absolute" strokeWidth={2.5} />
                            )}
                            {/* Icône Check quand au seuil droite */}
                            {isAtRightThreshold && (
                                <Check size={iconSize * 0.7} className="text-white absolute" strokeWidth={2.5} />
                            )}
                        </div>

                        {/* Icône droite - Check (vert) */}
                        <div
                            className="flex items-center justify-center cursor-pointer"
                            style={{
                                width: cursorSize,
                                height: cursorSize,
                                opacity: isAtRightThreshold ? 0 : 0.5,
                                transition: 'opacity 150ms ease-out',
                            }}
                            onClick={() => {
                                if (isAtRightThreshold) return;
                                // Animer le curseur vers la droite
                                setPreviewSwipeX(maxSlide);
                                // Après l'animation, exécuter l'action add
                                setTimeout(() => {
                                    setPreviewFeedback({ type: 'add' });
                                    setTimeout(() => {
                                        stopVibing('add');
                                        setPreviewSwipeX(0);
                                        setPreviewFeedback(null);
                                        setPreviewHasDragged(false);
                                    }, 400);
                                }, 200);
                            }}
                        >
                            <Check
                                size={iconSize}
                                className="text-green-400"
                                strokeWidth={2.5}
                            />
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* HEADER */}
            <div
                className="bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm z-20 sticky top-0 transition-all duration-200 ease-out cursor-grab active:cursor-grabbing select-none"
                style={{
                    paddingLeft: CONFIG.HEADER_PADDING_X,
                    paddingRight: CONFIG.HEADER_PADDING_X,
                    paddingTop: `calc(env(safe-area-inset-top, 0px) + ${UNIFIED_CONFIG.TITLE_MARGIN_TOP})`,
                    paddingBottom: showAddAll ? CONFIG.HEADER_PADDING_BOTTOM_ADDALL : CONFIG.HEADER_PADDING_BOTTOM
                }}
                onTouchStart={handleTitleTouchStart}
                onTouchMove={handleTitleTouchMove}
                onTouchEnd={handleTitleTouchEnd}
            >
            <div
                className="flex justify-between items-center"
                style={{ marginBottom: UNIFIED_CONFIG.TITLE_MARGIN_BOTTOM }}
            >
                {/* Indicateur gauche - chevrons seuls */}
                <div className="flex items-center gap-0.5 swipe-hint-left">
                    <ChevronLeft size={14} className="text-gray-300" strokeWidth={2} />
                    <ChevronLeft size={14} className="text-gray-200 -ml-2.5" strokeWidth={2} />
                </div>

                {/* Titre central */}
                <div className="text-center"><VibeBuilderTitle size={16} /></div>

                {/* Indicateur droite - chevrons seuls */}
                <div className="flex items-center gap-0.5 swipe-hint-right">
                    <ChevronRight size={14} className="text-gray-200 -mr-2.5" strokeWidth={2} />
                    <ChevronRight size={14} className="text-gray-300" strokeWidth={2} />
                </div>
                </div>
                <div className="flex items-center gap-2 relative z-20">
                    <div className="flex-1 relative overflow-visible" style={{ height: CONFIG.HEADER_TOOLBAR_HEIGHT }}>
                    {/* OVERLAY NOM DU DÉGRADÉ (pendant swipe sur la carte) */}
                    {cardSwipeOffset !== 0 && !showDeleteConfirm && !dragState && !isSearching && searchOverlayAnim === 'none' && (() => {
                        const gradientName = getGradientName ? getGradientName(displayGradientIndex) : `Gradient ${displayGradientIndex}`;
                        const progress = Math.min(1, Math.abs(cardSwipeOffset) / 100);
                        return (
                            <div
                                className="absolute inset-0 rounded-full flex items-center justify-center z-40 overflow-hidden"
                                style={{
                                    background: futureGradient,
                                    opacity: 1,
                                    boxShadow: `0 0 25px ${futureGradientColors[Math.floor(futureGradientColors.length / 2)]}66, 0 0 50px ${futureGradientColors[Math.floor(futureGradientColors.length / 2)]}33`
                                }}
                            >
                                <CylinderMask is3DMode={is3DMode} intensity={CONFIG.CAPSULE_CYLINDER_INTENSITY_ON} className="rounded-full" />
                                <div
                                    className="flex items-center gap-2 text-white font-black tracking-widest text-lg uppercase"
                                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                                >
                                    <ChevronLeft size={16} />
                                    <span>{gradientName}</span>
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        );
                    })()}
                    {/* OVERLAY CONFIRMATION SUPPRESSION */}
                    {showDeleteConfirm && (
                        <div
                            className="absolute inset-0 rounded-full flex items-center justify-center z-50"
                            style={{
                                background: '#ef4444',
                                boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
                                transform: `translateX(${deleteConfirmSwipeX}px)`,
                                transition: deleteConfirmStartX.current === null ? 'transform 0.2s ease-out' : 'none'
                            }}
                            onTouchStart={(e) => {
                                deleteConfirmStartX.current = e.touches[0].clientX;
                            }}
                            onTouchMove={(e) => {
                                if (deleteConfirmStartX.current === null) return;
                                const diff = e.touches[0].clientX - deleteConfirmStartX.current;
                                setDeleteConfirmSwipeX(diff);
                            }}
                            onTouchEnd={() => {
                                if (deleteConfirmSwipeX > 80) {
                                    // Swipe droite = confirmer suppression
                                    handleDeleteConfirm();
                                } else if (deleteConfirmSwipeX < -80) {
                                    // Swipe gauche = annuler
                                    handleDeleteCancel();
                                } else {
                                    setDeleteConfirmSwipeX(0);
                                }
                                deleteConfirmStartX.current = null;
                            }}
                        >
                            <div className="flex items-center gap-2 text-white font-black text-sm">
                                <Trash2 size={18} strokeWidth={2.5} />
                                <span>SUPPRIMER VIBE ?</span>
                            </div>
                        </div>
                    )}
                    {dragState ? (
                        <>
                            {/* GLOW PULSANT - même taille que la capsule */}
                            <div
                                className="absolute inset-0 rounded-full animate-neon-glow"
                                style={{
                                    '--neon-color': dragState.isAddingMode ? CONFIG.NEON_COLOR_PINK : CONFIG.NEON_COLOR_ORANGE,
                                    backgroundColor: 'transparent',
                                    boxShadow: `0 0 15px 5px rgba(${dragState.isAddingMode ? CONFIG.NEON_COLOR_PINK : CONFIG.NEON_COLOR_ORANGE}, 0.6)`,
                                }}
                            />
                            {/* CAPSULE COLORÉE - taille exacte du parent */}
                            <div
                                className="absolute inset-0 rounded-full flex items-center justify-center animate-pop border-2"
                                style={{
                                    backgroundColor: dragState.isAddingMode ? '#ec4899' : '#FF6700',
                                    borderColor: dragState.isAddingMode ? '#ec4899' : '#FF6700',
                                }}
                            >
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                    <CylinderMask is3DMode={is3DMode} intensity={CONFIG.CAPSULE_CYLINDER_INTENSITY_ON} className="rounded-full" />
                                </div>
                                <div className={`flex items-center gap-2 font-black tracking-widest text-lg drop-shadow-sm text-white`}>
                                {dragState.isAddingMode ? (
                                        <>
                                            <Sparkles style={{ width: CONFIG.HEADER_DRAGMODE_ICON_SIZE, height: CONFIG.HEADER_DRAGMODE_ICON_SIZE }} className="animate-pulse" fill="white" />
                                            <span className="uppercase">LET'S VIBE!</span>
                                            <Sparkles style={{ width: CONFIG.HEADER_DRAGMODE_ICON_SIZE, height: CONFIG.HEADER_DRAGMODE_ICON_SIZE }} className="animate-pulse" fill="white" />
                                        </>
                                    ) : (
                                        <>
                                            <Ghost style={{ width: CONFIG.HEADER_DRAGMODE_ICON_SIZE, height: CONFIG.HEADER_DRAGMODE_ICON_SIZE }} className="animate-pulse" fill="none" stroke="white" strokeWidth={2} />
                                            <span className="uppercase">GHOSTING...</span>
                                            <Ghost style={{ width: CONFIG.HEADER_DRAGMODE_ICON_SIZE, height: CONFIG.HEADER_DRAGMODE_ICON_SIZE }} className="animate-pulse" fill="none" stroke="white" strokeWidth={2} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                        ) : (
                            <div className="w-full h-full flex items-center gap-2 overflow-visible relative">
                                {/* CAPSULE TRI (4 boutons égaux) */}
                                <div
                                    className="flex-1 h-full rounded-full border border-gray-100 shadow-sm flex items-center overflow-visible relative"
                                    style={{ backgroundColor: `rgba(${CONFIG.CAPSULE_BG_COLOR}, ${CONFIG.CAPSULE_BG_OPACITY})` }}
                                >
                                    <ToggleSortBtn type="title" sortMode={sortMode} setSortMode={setSortMode} sortDirection={sortDirection} setSortDirection={setSortDirection} isFirst={true} hideGlow={isSearching || searchOverlayAnim !== 'none' || dragState || cardSwipeOffset !== 0} is3DMode={is3DMode} />
                                    <div className="w-px h-full bg-gray-200"></div>
                                    <ToggleSortBtn type="artist" sortMode={sortMode} setSortMode={setSortMode} sortDirection={sortDirection} setSortDirection={setSortDirection} hideGlow={isSearching || searchOverlayAnim !== 'none' || dragState || cardSwipeOffset !== 0} is3DMode={is3DMode} />
                                    <div className="w-px h-full bg-gray-200"></div>
                                    <ToggleSortBtn type="playCount" sortMode={sortMode} setSortMode={setSortMode} sortDirection={sortDirection} setSortDirection={setSortDirection} hideGlow={isSearching || searchOverlayAnim !== 'none' || dragState || cardSwipeOffset !== 0} is3DMode={is3DMode} />
                                    <div className="w-px h-full bg-gray-200"></div>
                                    <FileFilterBtn fileFilter={fileFilter} setFileFilter={setFileFilter} hideGlow={isSearching || searchOverlayAnim !== 'none' || dragState || cardSwipeOffset !== 0} is3DMode={is3DMode} />
                                </div>

                                {/* BOUTON LOUPE ROND (séparé) */}
                                <button
                                    onClick={() => {
                                        if (searchOverlayAnim !== 'none') return;
                                        setCloseBtnAnimKey(0);
                                        setSearchOverlayAnim('opening');
                                        setTimeout(() => {
                                            setIsSearching(true);
                                            setSearchOverlayAnim('none');
                                        }, CONFIG.SEARCH_FADE_IN_DURATION);
                                    }}
                                    className="h-full aspect-square rounded-full border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 relative overflow-hidden"
                                    style={{ backgroundColor: `rgba(${CONFIG.CAPSULE_BG_COLOR}, ${CONFIG.CAPSULE_BG_OPACITY})` }}
                                >
                                    <SphereMask is3DMode={is3DMode} intensity={CONFIG.CAPSULE_CYLINDER_INTENSITY_OFF} className="rounded-full" />
                                    <Search style={{ width: `calc(${UNIFIED_CONFIG.CAPSULE_HEIGHT} * ${UNIFIED_CONFIG.ICON_SIZE_PERCENT} / 100)`, height: `calc(${UNIFIED_CONFIG.CAPSULE_HEIGHT} * ${UNIFIED_CONFIG.ICON_SIZE_PERCENT} / 100)` }} />
                                </button>
                                
                                {/* OVERLAY BARRE DE RECHERCHE (fade in/out) */}
                                {(isSearching || searchOverlayAnim !== 'none') && (
                                    <div 
                                        className="absolute inset-0 w-full h-full rounded-full border border-gray-100 shadow-sm flex items-center"
                                        style={{
                                            backgroundColor: `rgba(${CONFIG.CAPSULE_BG_COLOR}, 1)`,
                                            boxShadow: `0 -5px 12px ${CONFIG.SEARCH_BOX_GLOW_COLOR}, 0 5px 12px ${CONFIG.SEARCH_BOX_GLOW_COLOR}`,
                                            zIndex: 10,
                                            animation: searchOverlayAnim === 'opening'
                                                ? `search-fade-in ${CONFIG.SEARCH_FADE_IN_DURATION}ms ease-out forwards`
                                                : searchOverlayAnim === 'closing'
                                                    ? `search-fade-out ${CONFIG.SEARCH_FADE_OUT_DURATION}ms ease-in forwards`
                                                    : 'none'
                                        }}
                                    >
                                        <div 
                                            className="flex-1 h-full flex items-center rounded-l-full relative overflow-hidden"
                                            style={{
                                                paddingLeft: CONFIG.SEARCH_PADDING_X,
                                                paddingRight: CONFIG.SEARCH_PADDING_X
                                            }}
                                        >
                                            <CylinderMask intensity={CONFIG.CAPSULE_CYLINDER_INTENSITY_OFF} className="rounded-l-full" is3DMode={is3DMode} />
                                            <Search style={{ width: `calc(${UNIFIED_CONFIG.CAPSULE_HEIGHT} * ${UNIFIED_CONFIG.ICON_SIZE_PERCENT} / 100)`, height: `calc(${UNIFIED_CONFIG.CAPSULE_HEIGHT} * ${UNIFIED_CONFIG.ICON_SIZE_PERCENT} / 100)` }} className="text-gray-400 mr-3" />
                                            <input
                                                autoFocus
                                                type="search"
                                                inputMode="search"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder=""
                                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 placeholder-gray-400 p-0 outline-none"
                                                spellCheck={false}
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                autoComplete="off"
                                                enterKeyHint="search"
                                                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                                            />
                                        </div>
                                        <div className="h-full relative overflow-visible rounded-r-full" style={{ flex: CONFIG.CLOSE_BTN_FLEX }}>
                                            <NeonGlow
                                                key={closeBtnAnimKey}
                                                colorName="pink"
                                                glowRGB={extractRGB(CONFIG.BTN_SEARCH_COLOR)}
                                                enabled={true}
                                                igniteOnMount={closeBtnAnimKey > 0}
                                                flickerEnabled={searchOverlayAnim !== 'closing'}
                                                className="absolute inset-0 rounded-r-full"
                                                style={{
                                                    background: CONFIG.BTN_SEARCH_COLOR,
                                                    zIndex: 0
                                                }}
                                            />
                                            <CylinderMask intensity={CONFIG.CAPSULE_CYLINDER_INTENSITY_ON} className="rounded-r-full" is3DMode={is3DMode} />
                                            <button 
                                                onClick={() => {
                                                    if (searchOverlayAnim !== 'none') return;
                                                    setCloseBtnAnimKey(k => k + 1);
                                                    setSearchOverlayAnim('closing');
                                                    setTimeout(() => {
                                                        setIsSearching(false);
                                                        setSearchQuery('');
                                                        setSearchOverlayAnim('none');
                                                    }, CONFIG.SEARCH_FADE_OUT_DURATION);
                                                }}
                                                className="relative z-10 w-full h-full flex items-center justify-center text-white rounded-r-full"
                                            >
                                                <X style={{ width: CONFIG.SEARCH_BTN_ICON_SIZE, height: CONFIG.SEARCH_BTN_ICON_SIZE }} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* ADD ALL BUTTON */}
                {/* ========== PARAMÈTRE PADDING ADD ALL ========== */}
                {showAddAll && (
                    <div className="w-full animate-in fade-in slide-in-from-top-2" style={{ paddingTop: CONFIG.ADDALL_PADDING_TOP }}>
                        {(() => {
                            return (
                                <button 
                                    onClick={handleAddAll} 
                                    className={`w-full ${CONFIG.ADDALL_HEIGHT} text-white rounded-full font-black flex items-center justify-center gap-2 transition-transform ${CONFIG.ADDALL_FONT_SIZE}`}
                                    style={{
                                        backgroundColor: futurePrimaryColor,
                                        boxShadow: `0 0 12px ${futurePrimaryColor}66, 0 0 24px ${futurePrimaryColor}33`
                                    }}
                                >
                                    <div className={`flex items-center gap-2 ${isAnimatingAddAll ? 'animate-blink' : ''}`}>
                                        <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>ADD ALL</span>
                                        <span className="font-normal opacity-70 text-xs" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>({displaySongs.length} <Music2 size={10} className="inline -mt-0.5" />)</span>
                                    </div>
                                </button>
                            );
                        })()}
                    </div>
                )}
            </div>
            
            {/* LIST CONTAINER */}
            <div className="relative flex-1 overflow-hidden">
                
                {/* ICONES FANTOMES GAUCHE (STATIQUE - GRIS 33%) - Centré sur zone de liste */}
                <div
                    className="absolute left-0 z-10 pointer-events-none flex flex-col items-center justify-center text-gray-300"
                    style={{
                        width: CONFIG.SIDEBAR_WIDTH,
                        gap: CONFIG.SIDEBAR_ICON_GAP,
                        top: 0,
                        bottom: CONFIG.BOTTOM_BAR_HEIGHT // Exclure la zone de la bottom bar
                    }}
                >
                    <ChevronsUp style={{ width: CONFIG.SIDEBAR_ICON_SIZE, height: CONFIG.SIDEBAR_ICON_SIZE }} strokeWidth={2.5} />
                    <Pointer style={{ width: CONFIG.SIDEBAR_ICON_SIZE, height: CONFIG.SIDEBAR_ICON_SIZE }} strokeWidth={2} className="text-gray-300" />
                    <ChevronsDown style={{ width: CONFIG.SIDEBAR_ICON_SIZE, height: CONFIG.SIDEBAR_ICON_SIZE }} strokeWidth={2.5} />
                </div>

                {/* MARÉE (Cyan=ajout, Orange=retrait) */}
                {dragState && listRef.current && (
                    <div
                        className="absolute left-0 z-20 pointer-events-none transition-none"
                        style={{
                            width: CONFIG.SIDEBAR_WIDTH,
                            top: Math.min(dragState.startYAbsolute, dragState.currentYAbsolute) - listRef.current.scrollTop,
                            height: Math.abs(dragState.currentYAbsolute - dragState.startYAbsolute),
                            backgroundColor: dragState.isAddingMode ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255, 103, 0, 0.3)'
                        }}
                    ></div>
                )}

<div
                    ref={listRef}
                    className={`absolute left-0 right-0 top-0 no-scrollbar z-0 ${dragState ? 'overflow-hidden' : 'overflow-y-auto'}`}
                    style={{
                        bottom: `calc(${CONFIG.BOTTOM_CARD_PADDING_TOP}px + ${vibeCardConfig?.height || '9vh'} + ${SAFE_AREA_HEIGHT_CSS})`
                    }}
                    onScroll={(e) => {
                        setListScrollTop(e.target.scrollTop);
                        if (e.target.clientHeight !== listContainerHeight) {
                            setListContainerHeight(e.target.clientHeight);
                        }
                    }}
                >
                    {/* Conteneur avec hauteur totale pour le scroll */}
                    <div style={{ height: displaySongs.length * rowHeightRef.current, position: 'relative' }}>
                        {(() => {
                            const containerHeight = listRef.current?.clientHeight || 500;
                            const visibleCount = Math.ceil(containerHeight / rowHeightRef.current);
                            const buffer = CONFIG.VIRTUALIZATION_BUFFER;
                            const baseIndex = Math.floor(listScrollTop / rowHeightRef.current);
                            const startIndex = Math.max(0, baseIndex - buffer);
                            const endIndex = Math.min(displaySongs.length - 1, baseIndex + visibleCount + buffer);
                            
                            const elements = [];
                            for (let i = startIndex; i <= endIndex; i++) {
                                const song = displaySongs[i];
                                elements.push(
                                    <div
                                        key={song.id}
                                        style={{
                                            position: 'absolute',
                                            top: i * rowHeightRef.current,
                                            left: 0,
                                            right: 0,
                                            height: rowHeightRef.current
                                        }}
                                    >
                                        <BuilderRow 
                                            song={song} 
                                            isSelected={!!selectedSongs.find(s => s.id === song.id)} 
                                            onToggle={toggleSong}
                                            onLongPress={startVibing}
                                            sortMode={sortMode}
                                        />
                                    </div>
                                );
                            }
                            return elements;
                        })()}
                    </div>
                </div>

                {/* FADE HAUT - Indicateur de contenu non visible en haut */}
                {listFades.topFadeOpacity > 0 && (
                    <div
                        className="absolute left-0 right-0 top-0 pointer-events-none z-30 transition-opacity duration-150"
                        style={{
                            height: CONFIG.LIST_FADE_HEIGHT,
                            background: `linear-gradient(to bottom, rgba(255,255,255,${CONFIG.LIST_FADE_OPACITY}) 0%, rgba(255,255,255,0) 100%)`,
                            opacity: listFades.topFadeOpacity
                        }}
                    />
                )}

                {/* FADE BAS - Indicateur de contenu non visible en bas */}
                {listFades.bottomFadeOpacity > 0 && (
                    <div
                        className="absolute left-0 right-0 pointer-events-none z-30 transition-opacity duration-150"
                        style={{
                            height: CONFIG.LIST_FADE_HEIGHT,
                            bottom: `calc(${CONFIG.BOTTOM_CARD_PADDING_TOP}px + ${vibeCardConfig?.height || '9vh'} + ${SAFE_AREA_HEIGHT_CSS})`,
                            background: `linear-gradient(to top, rgba(255,255,255,${CONFIG.LIST_FADE_OPACITY}) 0%, rgba(255,255,255,0) 100%)`,
                            opacity: listFades.bottomFadeOpacity
                        }}
                    />
                )}
            </div>

            {/* BOTTOM BAR - VIBECARD PREVIEW - TOUJOURS VISIBLE */}
            {(() => {
                // Calculer dispo/pas dispo
                const availableCount = selectedSongs.filter(s => isSongAvailable(s)).length;
                const unavailableCount = selectedSongs.length - availableCount;
                const isNameLong = vibeName.length > (vibeCardConfig?.marqueeThreshold || 12);
                
                return (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 30,
                            background: 'white',
                            borderTop: '1px solid #e5e7eb',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Padding au-dessus de la carte */}
                        <div style={{ height: CONFIG.BOTTOM_CARD_PADDING_TOP, flexShrink: 0 }} />
                        
                        {/* Future VibeCard - Swipable pour changer couleur */}
                        <div
                            style={{
                                marginLeft: is3DMode ? 0 : 16,
                                marginRight: is3DMode ? 0 : 16,
                            }}
                        >
                        <div
                                onTouchStart={handleCardSwipeStart}
                                onTouchMove={handleCardSwipeMove}
                                onTouchEnd={handleCardSwipeEnd}
                                onMouseDown={handleCardSwipeStart}
                                onMouseMove={handleCardSwipeMove}
                                onMouseUp={handleCardSwipeEnd}
                                className={`w-full cursor-pointer relative overflow-hidden ${is3DMode ? 'rounded-full' : 'rounded-xl'} ${isCreatingVibe && !isFadingOut ? 'animate-blink' : ''} ${isFadingOut ? 'animate-fade-out' : ''}`}
                                style={{
                                    height: is3DMode ? `${UNIFIED_CONFIG.PLAYER_CAPSULE_HEIGHT_VH}vh` : (vibeCardConfig?.height || '9vh'),
                                    background: futureGradient,
                                    '--glow-color': futurePrimaryColor,
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                                }}
                            >
                            {/* Masque cylindre 3D */}
                            <CylinderMask is3DMode={is3DMode} intensity={CONFIG.CAPSULE_CYLINDER_INTENSITY_OFF} className={is3DMode ? 'rounded-full' : 'rounded-xl'} />
                            {/* Indication swipe - EN HAUT AU CENTRE */}
                            <div
                                className="absolute flex items-center gap-0.5 text-white/50 z-10"
                                style={{
                                    top: CONFIG.DRAG_TOP,
                                    left: '50%',
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                <ChevronLeft size={10} />
                                <Pointer size={12} />
                                <ChevronRight size={10} />
                            </div>
                            
                            {/* Bordure mobile pendant le swipe (pointillée si dégradé déjà utilisé) */}
                            {cardSwipeOffset !== 0 && (
                                <div
                                    className={`absolute inset-0 pointer-events-none ${is3DMode ? 'rounded-full' : 'rounded-[10px]'}`}
                                    style={{
                                        transform: `translateX(${cardSwipeOffset}px)`,
                                        transition: isCardSwipeCatchingUp ? 'transform 0.12s ease-out' : 'none',
                                        border: `${CONFIG.DUPLICATE_BORDER_WIDTH}px ${isColorAlreadyUsed && !allColorsUsed ? 'dashed' : 'solid'} rgba(255,255,255,${CONFIG.DUPLICATE_BORDER_OPACITY})`
                                    }}
                                />
                            )}
                            
                            {/* Bouton CLOSE (X) - Centré verticalement à gauche */}
                            <div
                                data-close-btn
                                className={`absolute rounded-full flex items-center justify-center ${closeBtnAnimating ? 'animate-ignite-btn-red' : 'hover:scale-110 transition-transform'}`}
                                style={{
                                    left: CONFIG.CREATE_BTN_RIGHT,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: CONFIG.CREATE_BTN_SIZE,
                                    height: CONFIG.CREATE_BTN_SIZE,
                                    boxShadow: `0 0 ${CONFIG.CREATE_BTN_GLOW_SPREAD}px rgba(255,255,255,${CONFIG.CREATE_BTN_GLOW_OPACITY}), 0 4px 12px rgba(0,0,0,0.15)`,
                                    background: 'white',
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCloseBtnAnimating(true);
                                    setTimeout(() => {
                                        handleClose('left');
                                    }, 500);
                                }}
                            >
                                <X
                                    size={parseInt(CONFIG.CREATE_BTN_SIZE) * 0.5}
                                    strokeWidth={3}
                                    style={{ color: closeBtnAnimating ? '#f43f5e' : futureGradientColors[0] }}
                                />
                            </div>

                            {/* Bouton CREATE/EDIT - Centré verticalement à droite */}
                            <div
                                data-create-btn
                                className={`absolute rounded-full flex items-center justify-center ${createBtnAnimating ? 'animate-ignite-btn-green' : createBtnErrorAnimating ? 'animate-shake-error' : 'hover:scale-110 transition-transform'}`}
                                style={{
                                    right: CONFIG.CREATE_BTN_RIGHT,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: CONFIG.CREATE_BTN_SIZE,
                                    height: CONFIG.CREATE_BTN_SIZE,
                                    boxShadow: `0 0 ${CONFIG.CREATE_BTN_GLOW_SPREAD}px rgba(255,255,255,${CONFIG.CREATE_BTN_GLOW_OPACITY}), 0 4px 12px rgba(0,0,0,0.15)`,
                                    background: 'white',
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (selectedSongs.length > 0) {
                                        setCreateBtnAnimating(true);
                                        handleSave(); // Lance immédiatement (animations simultanées)
                                    } else {
                                        // Pas de chansons : animation shake rouge
                                        setCreateBtnErrorAnimating(true);
                                        setTimeout(() => setCreateBtnErrorAnimating(false), 400);
                                        handleSave(); // Gère le mode édition (delete confirm)
                                    }
                                }}
                            >
                                {editMode ? (
                                    <Pencil
                                        size={parseInt(CONFIG.CREATE_BTN_SIZE) * 0.5}
                                        strokeWidth={3}
                                        style={{ color: createBtnAnimating ? '#00ff88' : createBtnErrorAnimating ? '#f43f5e' : futureGradientColors[futureGradientColors.length - 1] }}
                                    />
                                ) : (
                                    <Plus
                                        size={parseInt(CONFIG.CREATE_BTN_SIZE) * 0.5}
                                        strokeWidth={3}
                                        style={{ color: createBtnAnimating ? '#00ff88' : createBtnErrorAnimating ? '#f43f5e' : futureGradientColors[futureGradientColors.length - 1] }}
                                    />
                                )}
                            </div>

                            {/* Titre et compteurs - 3 modes différents */}
                            {showTitles && !is3DMode ? (
                                /* Mode normal: Capsule Liquid Glass en bas centrée */
                                <div
                                    data-capsule
                                    className={`absolute rounded-full border shadow-lg flex items-baseline gap-2 ${isEditingName ? 'border-white/40' : 'border-white/20'}`}
                                    style={{
                                        paddingLeft: CONFIG.CAPSULE_PADDING_X,
                                        paddingRight: CONFIG.CAPSULE_PADDING_X,
                                        paddingTop: CONFIG.CAPSULE_PADDING_Y,
                                        paddingBottom: CONFIG.CAPSULE_PADDING_Y,
                                        bottom: CONFIG.CAPSULE_BOTTOM,
                                        left: '50%',
                                        transform: `translateX(-50%) translateZ(${displayGradientIndex * 0.001}px)`,
                                        maxWidth: `calc(100% - ${CONFIG.CREATE_BTN_RIGHT * 2 + CONFIG.CREATE_BTN_SIZE * 2 + 16}px)`,
                                        backdropFilter: `blur(${vibeCardConfig?.liquidGlassBlur || 12}px)`,
                                        WebkitBackdropFilter: `blur(${vibeCardConfig?.liquidGlassBlur || 12}px)`,
                                        background: isEditingName ? 'rgba(255,255,255,0.15)' : 'transparent',
                                        transition: 'background 0.2s, border-color 0.2s'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingName(true);
                                        setTimeout(() => nameInputRef.current?.focus(), 0);
                                    }}
                                >
                                    {/* Nom éditable avec scrolling si trop long ET pas en édition */}
                                    <div className="overflow-hidden flex-shrink min-w-0" style={{ maxWidth: `${vibeCardConfig?.capsuleNameMaxWidth || 9}rem` }}>
                                        <div
                                            className={`whitespace-nowrap ${isNameLong && !isEditingName ? 'animate-marquee' : ''}`}
                                            style={{ '--marquee-speed': `${vibeCardConfig?.marqueeSpeed || 8}s` }}
                                        >
                                            <input
                                                ref={nameInputRef}
                                                type="text"
                                                value={vibeName}
                                                onChange={(e) => { setVibeName(e.target.value); setNameWasEdited(true); }}
                                                onFocus={() => setIsEditingName(true)}
                                                onBlur={() => setIsEditingName(false)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.target.blur(); } }}
                                                className="bg-transparent border-none outline-none font-black leading-tight text-white"
                                                style={{
                                                    fontSize: `${vibeCardConfig?.capsuleFontSize || 1.125}rem`,
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                                    width: `${Math.max(vibeName.length * CONFIG.NAME_WIDTH_FACTOR, parseFloat(CONFIG.NAME_MIN_WIDTH))}rem`
                                                }}
                                                spellCheck={false}
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                autoComplete="off"
                                                enterKeyHint="done"
                                            />
                                        </div>
                                    </div>

                                    {/* Compteur dispo/pas dispo */}
                                    <span
                                        className="text-xs font-normal text-white/70 flex items-center gap-1.5 flex-shrink-0"
                                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                                    >
                                        <span className="flex items-center gap-0.5"><CheckCircle2 size={10} />{availableCount}</span>
                                        {unavailableCount > 0 && <span className="flex items-center gap-0.5 opacity-60"><Ghost size={10} />{unavailableCount}</span>}
                                    </span>
                                </div>
                            ) : showTitles && is3DMode ? (
                                /* Mode 3D avec titres: Titre centré directement dans la carte, ENTRE les boutons X et + */
                                <div
                                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden"
                                    style={{
                                        paddingLeft: CONFIG.CREATE_BTN_RIGHT + CONFIG.CREATE_BTN_SIZE + 12,
                                        paddingRight: CONFIG.CREATE_BTN_RIGHT + CONFIG.CREATE_BTN_SIZE + 12
                                    }}
                                >
                                    <div
                                        className="flex items-center gap-2 pointer-events-auto overflow-hidden max-w-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditingName(true);
                                            setTimeout(() => nameInputRef.current?.focus(), 0);
                                        }}
                                    >
                                        {/* Nom éditable - contraint à l'espace disponible */}
                                        <div className="overflow-hidden flex-shrink min-w-0">
                                            <div
                                                className={`whitespace-nowrap ${isNameLong && !isEditingName ? 'animate-marquee' : ''}`}
                                                style={{ '--marquee-speed': `${vibeCardConfig?.marqueeSpeed || 8}s` }}
                                            >
                                                <input
                                                    ref={nameInputRef}
                                                    type="text"
                                                    value={vibeName}
                                                    onChange={(e) => { setVibeName(e.target.value); setNameWasEdited(true); }}
                                                    onFocus={() => setIsEditingName(true)}
                                                    onBlur={() => setIsEditingName(false)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.target.blur(); } }}
                                                    className="bg-transparent border-none outline-none font-black leading-tight text-white text-center"
                                                    style={{
                                                        fontSize: `${vibeCardConfig?.capsuleFontSize || 1.125}rem`,
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                                        width: `${Math.max(vibeName.length * CONFIG.NAME_WIDTH_FACTOR, parseFloat(CONFIG.NAME_MIN_WIDTH))}rem`,
                                                        maxWidth: '100%'
                                                    }}
                                                    spellCheck={false}
                                                    autoCorrect="off"
                                                    autoCapitalize="off"
                                                    autoComplete="off"
                                                    enterKeyHint="done"
                                                />
                                            </div>
                                        </div>

                                        {/* Compteur dispo/pas dispo */}
                                        <span
                                            className="text-[10px] font-semibold text-white/90 flex items-center gap-1.5 flex-shrink-0"
                                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                                        >
                                            <span className="flex items-center gap-0.5"><CheckCircle2 size={10} />{availableCount}</span>
                                            {unavailableCount > 0 && <span className="flex items-center gap-0.5 opacity-60"><Ghost size={10} />{unavailableCount}</span>}
                                        </span>
                                    </div>
                                </div>
                            ) : is3DMode ? (
                                /* Mode 3D sans titres: compteurs centrés entre les boutons */
                                <div
                                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                                    style={{
                                        paddingLeft: CONFIG.CREATE_BTN_RIGHT + CONFIG.CREATE_BTN_SIZE + 12,
                                        paddingRight: CONFIG.CREATE_BTN_RIGHT + CONFIG.CREATE_BTN_SIZE + 12
                                    }}
                                >
                                    <span
                                        className="text-[10px] font-semibold text-white/50 flex items-center gap-1.5"
                                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                                    >
                                        <span className="flex items-center gap-0.5"><CheckCircle2 size={10} />{availableCount}</span>
                                        {unavailableCount > 0 && <span className="flex items-center gap-0.5 opacity-60"><Ghost size={10} />{unavailableCount}</span>}
                                    </span>
                                </div>
                            ) : (
                                /* Mode normal sans titres: compteurs en bas à gauche */
                                <span
                                    className="absolute text-[10px] font-semibold text-white/80 flex items-center gap-1.5"
                                    style={{ bottom: CONFIG.CAPSULE_BOTTOM, left: CONFIG.CAPSULE_LEFT }}
                                >
                                    <span className="flex items-center gap-0.5"><CheckCircle2 size={10} />{availableCount}</span>
                                    {unavailableCount > 0 && <span className="flex items-center gap-0.5 opacity-60"><Ghost size={10} />{unavailableCount}</span>}
                                </span>
                            )}
                        </div>
                        </div>
                        <SafeAreaSpacer />
                    </div>
                );
            })()}
            
            </div>
        
        {/* Overlay de swipe style BACK TO VIBES - AU DESSUS DE TOUT */}
        {Math.abs(titleSwipeX) > 20 && (
            <div 
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-[100] text-white"
                style={{ 
                    backgroundColor: `rgba(0, 0, 0, ${Math.min(CONFIG.SWIPE_OVERLAY_OPACITY, Math.abs(titleSwipeX) / CONFIG.TITLE_SWIPE_THRESHOLD * CONFIG.SWIPE_OVERLAY_OPACITY)})`
                }}
            >
                <Maximize2 
                    size={Math.abs(titleSwipeX) >= CONFIG.TITLE_SWIPE_THRESHOLD ? 64 : 48} 
                    className={`mb-4 transition-all duration-150 ${Math.abs(titleSwipeX) >= CONFIG.TITLE_SWIPE_THRESHOLD ? 'animate-bounce-neon-lime' : ''}`}
                />
                <span 
                    className={`font-black tracking-widest transition-all duration-150 ${Math.abs(titleSwipeX) >= CONFIG.TITLE_SWIPE_THRESHOLD ? 'animate-neon-lime' : ''}`}
                    style={{ fontSize: Math.abs(titleSwipeX) >= CONFIG.TITLE_SWIPE_THRESHOLD ? '1.66rem' : '1.25rem' }}
                >
                    BACK TO VIBES
                </span>
            </div>
        )}
        </>
    );
};

export default VibeBuilder;