import React, { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { Play, Pause, Disc3, CirclePause, SkipForward, SkipBack, Music, Plus, ChevronDown, ChevronUp, User, ArrowDownAZ, ArrowUpZA, MoveDown, MoveUp, RotateCcw, Headphones, Flame, Snowflake, Dices, Maximize2, ListPlus, Archive, RotateCw, ChevronLeft, ChevronRight, Volume2, VolumeX, Check, FolderPlus, Sparkles, X, FolderDown, Folder, ListMusic, Search, ListChecks, LocateFixed, Music2, ArrowRight, CloudDownload, Radiation, CheckCircle2, Ghost, Skull, AlertTriangle, Clock, Layers, Star } from 'lucide-react';
import VibeBuilder from './VibeBuilder.jsx';
import Tweaker, { TWEAKER_CONFIG } from './Tweaker.jsx';
import SmartImport from './SmartImport.jsx';
import DropboxBrowser from './DropboxBrowser.jsx';
import { DropboxLogoVector, VibesLogoVector, VibeLogoVector, VibingLogoVector, FlameLogoVector } from './Assets.jsx';
import { isSongAvailable } from './utils.js';
import { UNIFIED_CONFIG, FOOTER_CONTENT_HEIGHT_CSS, getPlayerHeaderHeightPx, getPlayerFooterHeightPx, getBeaconHeightPx } from './Config.jsx';

// ══════════════════════════════════════════════════════════════════════════
// DROPBOX PKCE HELPERS
// ══════════════════════════════════════════════════════════════════════════

// Génère une chaîne aléatoire pour le code_verifier (43-128 caractères)
const generateCodeVerifier = () => {
    const array = new Uint8Array(64);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 128);
};

// Génère le code_challenge à partir du code_verifier (SHA-256 + base64url)
const generateCodeChallenge = async (verifier) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
    // Convertir en base64url (remplacer + par -, / par _, supprimer =)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Stockage des tokens Dropbox
const DROPBOX_STORAGE_KEYS = {
    ACCESS_TOKEN: 'dropbox_access_token',
    REFRESH_TOKEN: 'dropbox_refresh_token',
    EXPIRES_AT: 'dropbox_expires_at',
    CODE_VERIFIER: 'dropbox_code_verifier'
};

// Sauvegarder les tokens
const saveDropboxTokens = (accessToken, refreshToken, expiresIn) => {
    const expiresAt = Date.now() + (expiresIn * 1000) - 60000; // 1 minute de marge
    localStorage.setItem(DROPBOX_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(DROPBOX_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(DROPBOX_STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
    // Nettoyer l'ancien token (migration)
    localStorage.removeItem('dropbox_token');
};

// Récupérer le token d'accès (ou null si expiré/absent)
const getDropboxAccessToken = () => {
    const accessToken = localStorage.getItem(DROPBOX_STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAt = localStorage.getItem(DROPBOX_STORAGE_KEYS.EXPIRES_AT);

    if (!accessToken || !expiresAt) {
        // Migration : vérifier l'ancien format
        const oldToken = localStorage.getItem('dropbox_token');
        if (oldToken) return oldToken; // Ancien token (expirera dans 4h max)
        return null;
    }

    // Vérifier si expiré
    if (Date.now() >= parseInt(expiresAt)) {
        return null; // Expiré, besoin de refresh
    }

    return accessToken;
};

// Vérifier si un refresh est nécessaire
const needsTokenRefresh = () => {
    const expiresAt = localStorage.getItem(DROPBOX_STORAGE_KEYS.EXPIRES_AT);
    if (!expiresAt) return false;
    return Date.now() >= parseInt(expiresAt);
};

// Récupérer le refresh token
const getRefreshToken = () => {
    return localStorage.getItem(DROPBOX_STORAGE_KEYS.REFRESH_TOKEN);
};

// Nettoyer tous les tokens Dropbox
const clearDropboxTokens = () => {
    console.log('=== CLEARING ALL DROPBOX TOKENS ===');
    console.log('Before clear - ACCESS_TOKEN:', localStorage.getItem(DROPBOX_STORAGE_KEYS.ACCESS_TOKEN));
    console.log('Before clear - dropbox_token:', localStorage.getItem('dropbox_token'));

    localStorage.removeItem(DROPBOX_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(DROPBOX_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(DROPBOX_STORAGE_KEYS.EXPIRES_AT);
    localStorage.removeItem(DROPBOX_STORAGE_KEYS.CODE_VERIFIER);
    localStorage.removeItem('dropbox_token'); // Ancien format

    console.log('After clear - ACCESS_TOKEN:', localStorage.getItem(DROPBOX_STORAGE_KEYS.ACCESS_TOKEN));
    console.log('After clear - dropbox_token:', localStorage.getItem('dropbox_token'));
    console.log('=== TOKENS CLEARED ===');
};

// Détection automatique : vrai mobile/PWA vs desktop
const isRealDevice = () => {
  if (typeof window === 'undefined') return false;
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return isStandalone || isMobile;
};

// Obtenir la safe area bottom en pixels (pour les calculs JS)
const getSafeAreaBottom = () => {
  if (typeof window === 'undefined') return 0;
  const div = document.createElement('div');
  div.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  document.body.appendChild(div);
  const safeArea = parseInt(getComputedStyle(div).paddingBottom) || 0;
  document.body.removeChild(div);
  return safeArea;
};

// Calculer la hauteur totale du footer (safe area + boutons + padding)
const getFooterHeight = () => {
  const safeArea = getSafeAreaBottom();
  const paddingTop = parseFloat(UNIFIED_CONFIG.FOOTER_PADDING_TOP) * 16; // rem to px
  return safeArea + UNIFIED_CONFIG.FOOTER_BTN_HEIGHT + paddingTop;
};

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        TOUS LES PARAMÈTRES TWEAKABLES                     ║
// ║                                                                           ║
// ║  Modifie les valeurs ci-dessous pour personnaliser l'apparence de l'app   ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

const CONFIG = {
    
    // ══════════════════════════════════════════════════════════════════════════
    // PARAMÈTRES UNIFIÉS (importés depuis config.js)
    // ══════════════════════════════════════════════════════════════════════════
    UNIFIED_CAPSULE_HEIGHT: UNIFIED_CONFIG.CAPSULE_HEIGHT,
    UNIFIED_ICON_SIZE_PERCENT: UNIFIED_CONFIG.ICON_SIZE_PERCENT,

    // ══════════════════════════════════════════════════════════════════════════
    // DÉGRADÉS & COULEURS
    // ══════════════════════════════════════════════════════════════════════════
    GRADIENT_OPACITY: 1,              // Opacité des dégradés (0 = transparent, 1 = opaque)
    MAX_SWIPE_DISTANCE: 300,          // Distance max pour parcourir les 20 couleurs en swipant

    // ══════════════════════════════════════════════════════════════════════════
    // VIBE CARDS (Dashboard)
    // ══════════════════════════════════════════════════════════════════════════
    VIBECARD_HEIGHT_VH: 9,            // Hauteur des cartes (% de la hauteur écran)
    VIBECARD_GAP_VH: 1.2,                 // Espacement entre les cartes (% de la hauteur écran)
    VIBECARD_STAGGER_DELAY: 80,           // Délai entre chaque carte (ms)
    VIBECARD_SLIDE_DURATION: 400,         // Durée de l'animation slide (ms)
    VIBECARD_SLIDE_DISTANCE: 100,         // Distance de départ depuis la gauche (px)

    // ══════════════════════════════════════════════════════════════════════════
    // CAPSULE CONTRÔLE (Titre/Artiste au-dessus du player)
    // ══════════════════════════════════════════════════════════════════════════
    CAPSULE_HEIGHT_VH: UNIFIED_CONFIG.PLAYER_CAPSULE_HEIGHT_VH,  // Hauteur capsule mode principal (depuis Config.jsx)
    CAPSULE_WIDTH_PERCENT: 92,          // Largeur capsule (% largeur conteneur)

    CAPSULE_TITLE_SIZE_MAIN: UNIFIED_CONFIG.CAPSULE_TITLE_SIZE_MAIN,        // Taille titre en mode principal (depuis Config.jsx)
    CAPSULE_ARTIST_SIZE_MAIN: UNIFIED_CONFIG.CAPSULE_ARTIST_SIZE_MAIN,       // Taille artiste en mode principal (depuis Config.jsx)

    CAPSULE_TITLE_LINEHEIGHT_MAIN: 1.15,  // Taille ligne titre en mode principal (px)
    CAPSULE_ARTIST_LINEHEIGHT_MAIN: 1.15,    // Taille ligne artist en mode principal (px)
    CAPSULE_GAP_MAIN: 0,                // Écart titre/artiste mode principal (px)

    CAPSULE_HEIGHT_MINI_VH: UNIFIED_CONFIG.PLAYER_CAPSULE_HEIGHT_VH,  // Même hauteur que principal (unifié depuis Config.jsx)

    CAPSULE_TITLE_SIZE_DASHBOARD: UNIFIED_CONFIG.CAPSULE_TITLE_SIZE_DASHBOARD,   // Taille titre en mode dashboard (depuis Config.jsx)
    CAPSULE_ARTIST_SIZE_DASHBOARD: UNIFIED_CONFIG.CAPSULE_ARTIST_SIZE_DASHBOARD,  // Taille artiste en mode dashboard (depuis Config.jsx)

    CAPSULE_TITLE_LINEHEIGHT_DASHBOARD: 1.1, // Taille ligne titre en mode dashboard (px)
    CAPSULE_ARTIST_LINEHEIGHT_DASHBOARD: 1.1,  // Taille ligne artist en mode dashboard (px)
    CAPSULE_GAP_DASHBOARD: 0,           // Écart titre/artiste mode dashboard (px)
    
    CAPSULE_BG_COLOR: '235, 250, 255',  // Couleur de fond de la capsule titre (RGB) - cyan très clair
    CAPSULE_BG_OPACITY: 0,            // Opacité du fond (0-1)
    CAPSULE_CYLINDER_ENABLED: false,     // Activer le masque d'opacité 3D
    CAPSULE_CYLINDER_INTENSITY: 0.6,    // Intensité du masque (0-1)
    CAPSULE_CYLINDER_SLICES: [
        -0.15, -0.10, -0.05, 0, 0, 
        0.05, 0.10, 0.15, 0.20, 0.25,
        0.20, 0.15, 0.10, 0.05, 0,
        0, -0.02, -0.04, -0.06, -0.08,
        -0.10, -0.12, -0.10, -0.08, -0.05,
        -0.03, 0, 0, -0.05, -0.10
    ],
    
    // ══════════════════════════════════════════════════════════════════════════
    // ROUE DE SÉLECTION (Liste des chansons)
    // ══════════════════════════════════════════════════════════════════════════
    WHEEL_TITLE_SIZE_MAIN_CENTER: UNIFIED_CONFIG.WHEEL_TITLE_SIZE_MAIN,   // Titre chanson centrale (depuis Config.jsx)
    WHEEL_ARTIST_SIZE_MAIN: UNIFIED_CONFIG.WHEEL_ARTIST_SIZE_MAIN,       // Artiste en mode principal (depuis Config.jsx)

    WHEEL_TITLE_SIZE_MAIN_OTHER: UNIFIED_CONFIG.WHEEL_TITLE_SIZE_MAIN_OTHER,    // Titre autres chansons (depuis Config.jsx)
    WHEEL_ARTIST_SIZE_MAIN_OTHER: UNIFIED_CONFIG.WHEEL_ARTIST_SIZE_MAIN_OTHER,  // Artiste autres chansons (depuis Config.jsx)

    WHEEL_TITLE_LINEHEIGHT_MAIN: 1.25,   // Taille ligne titre en mode principal
    WHEEL_ARTIST_LINEHEIGHT_MAIN: 1.25,  // Taille ligne artist en mode principal
    WHEEL_GAP_MAIN: 0,                  // Écart titre/artiste mode principal (px)

    WHEEL_ITEM_HEIGHT_MAIN_VH: UNIFIED_CONFIG.WHEEL_ITEM_HEIGHT_MAIN_VH,  // Taille élément mode principal (depuis Config.jsx)

    WHEEL_TITLE_SIZE_MINI_CENTER: UNIFIED_CONFIG.WHEEL_TITLE_SIZE_MINI,   // Titre chanson centrale dashboard (depuis Config.jsx)
    WHEEL_ARTIST_SIZE_MINI: UNIFIED_CONFIG.WHEEL_ARTIST_SIZE_MINI,       // Artiste en mode dashboard (depuis Config.jsx)

    WHEEL_TITLE_SIZE_MINI_OTHER: UNIFIED_CONFIG.WHEEL_TITLE_SIZE_MINI_OTHER,    // Titre autres chansons dashboard (depuis Config.jsx)
    WHEEL_ARTIST_SIZE_MINI_OTHER: UNIFIED_CONFIG.WHEEL_ARTIST_SIZE_MINI_OTHER,  // Artiste autres chansons dashboard (depuis Config.jsx)

    WHEEL_TITLE_LINEHEIGHT_MINI: 1.2,   // Taille ligne titre en mode dashboard
    WHEEL_ARTIST_LINEHEIGHT_MINI: 1.2,  // Taille ligne artist en mode dashboard
    WHEEL_GAP_MINI: 0,                  // Écart titre/artiste mode dashboard (px)

    WHEEL_ITEM_HEIGHT_MINI_VH: UNIFIED_CONFIG.WHEEL_ITEM_HEIGHT_MINI_VH,  // Taille élément mode dashboard (depuis Config.jsx)

    WHEEL_CENTER_THRESHOLD: 0.5,        // Seuil de changement de sélection (0.1 = tôt, 0.5 = milieu, 0.9 = tard)

    // EFFET CYLINDRE (style iOS)
    WHEEL_CYLINDER_ENABLED: true,       // Activer/désactiver l'effet cylindre
    WHEEL_CYLINDER_MIN_SCALE_Y: 0.7,    // scaleY aux extrémités (1 = pas de compression, 0.5 = moitié)
    WHEEL_CYLINDER_CURVE_Y: 2,          // Courbe du drop Y (0 = linéaire, 1 = marqué, 2+ = très marqué)
    WHEEL_CYLINDER_PERSPECTIVE: 900,    // Distance de perspective (px) - plus petit = effet 3D plus fort
    WHEEL_CYLINDER_MAX_ROTATE_X: 75,    // Angle max de rotation X aux extrémités (degrés)
    WHEEL_CYLINDER_CURVE_X: 1.5,          // Courbe du drop X (0 = linéaire, 1 = marqué, 2+ = très marqué)
    WHEEL_CYLINDER_SIDE_INSET: 12,      // Déplacement max des colonnes latérales vers le centre (px)
    WHEEL_CYLINDER_SIDE_ROTATE_Y: 25,   // Rotation Y max des colonnes latérales (degrés)

    // MASQUE DE FONDU (haut/bas de la roue)
    WHEEL_MASK_ENABLED: false,          // Masque de fondu désactivé
    WHEEL_MASK_EDGE_OPACITY: 0.5,      // Opacité aux bords (0 = invisible, 1 = visible)
    WHEEL_MASK_CENTER_SIZE: 70,         // Taille zone centrale 100% opaque (% de la hauteur)
    WHEEL_MASK_CURVE: 2,                // Courbe du fondu (1 = linéaire, 2+ = reste net plus longtemps au centre)

    // VIRTUALISATION (performance)
    WHEEL_VIRTUALIZATION_BUFFER: 5,     // Nombre d'éléments à rendre au-dessus/en-dessous du visible
    WHEEL_SNAP_DELAY: 100,              // Délai avant snap après arrêt du scroll (ms)
    WHEEL_SNAP_DURATION_PER_PX: 75,      // Durée de l'animation par pixel de distance (ms)
    WHEEL_SNAP_DURATION_MIN: 50,        // Durée minimum de l'animation (ms)
    WHEEL_SNAP_DURATION_MAX: 300,       // Durée maximum de l'animation (ms)
    
    // ══════════════════════════════════════════════════════════════════════════
    // NEON BEACON (Capsule loupe + indicateur de position)
    // ══════════════════════════════════════════════════════════════════════════
    // NEON (bordure jaune autour de la capsule)
    BEACON_NEON_WIDTH: 1,               // Épaisseur du neon (px)
    BEACON_NEON_COLOR: '50, 50, 50',   // Couleur du neon (RGB jaune)
    BEACON_NEON_OPACITY: 0.6,           // Opacité du neon
    BEACON_NEON_GLOW_SIZE: 10,          // Taille du glow du neon (px)
    BEACON_NEON_GLOW_OPACITY: 0.3,      // Opacité du glow du neon
    
    // PULSE (point rose qui bouge)
    BEACON_PULSE_SIZE: 5,               // Diamètre du pulse (px)
    BEACON_PULSE_COLOR: '236, 72, 153', // Couleur du pulse (RGB rose)
    BEACON_PULSE_GLOW_SIZE: 8,          // Taille du glow du pulse (px)
    BEACON_PULSE_GLOW_OPACITY: 0.8,     // Opacité du glow du pulse
    
    // Z-INDEX BEACON (ordre d'empilement)
    BEACON_NEON_Z: 30,                  // Z-index du neon (bordure) - au-dessus de la capsule
    BEACON_PULSE_Z: 10,                 // Z-index du pulse (point) - en-dessous de la capsule
    
    // TRAIT NÉON CAPSULE (glow cyan animé autour de ControlCapsule)
    CAPSULE_NEON_ENABLED: true,         // Activer le trait néon autour de la capsule
    CAPSULE_NEON_WIDTH: 1,              // Épaisseur du trait (px)
    CAPSULE_NEON_COLOR: '6, 182, 212',  // Couleur cyan néon (RGB)
    CAPSULE_NEON_OPACITY_MIN: 0.1,      // Opacité minimum de l'animation
    CAPSULE_NEON_OPACITY_MAX: 1,        // Opacité maximum de l'animation
    CAPSULE_NEON_GLOW_SIZE: 8,          // Taille du glow (px)
    CAPSULE_NEON_SPEED: 2,            // Vitesse animation (secondes) - IGNORÉ si audio réactif
    
    // RECENTER CAPSULE - Bordure et glow cyan
    RECENTER_NEON_ENABLED: true,          // Activer la bordure cyan
    RECENTER_NEON_WIDTH: 1,               // Épaisseur de la bordure (px)
    RECENTER_NEON_COLOR: 'rgba(6, 182, 212, 0.8)', // Couleur bordure (RGBA)
    RECENTER_GLOW_ENABLED: true,          // Activer le glow pulsant
    RECENTER_GLOW_COLOR: '6, 182, 212',   // Couleur glow (RGB pour opacité variable)
    RECENTER_GLOW_SIZE: 6,                // Taille du glow (px)
    RECENTER_GLOW_INTENSITY: 0.5,         // Intensité max du glow (0-1)
    RECENTER_GLOW_SPEED: 2,               // Vitesse du pulse (secondes)

    // TIMECAPSULE - Bordure et glow rose
    TIMECAPSULE_NEON_ENABLED: true,       // Activer la bordure rose
    TIMECAPSULE_NEON_WIDTH: 1,            // Épaisseur de la bordure (px)
    TIMECAPSULE_NEON_COLOR: 'rgba(236, 72, 153, 0.8)', // Couleur bordure (RGBA)
    TIMECAPSULE_GLOW_ENABLED: true,       // Activer le glow pulsant
    TIMECAPSULE_GLOW_COLOR: '236, 72, 153', // Couleur glow (RGB pour opacité variable)
    TIMECAPSULE_GLOW_SIZE: 6,             // Taille du glow (px)
    TIMECAPSULE_GLOW_INTENSITY: 0.5,      // Intensité max du glow (0-1)
    TIMECAPSULE_GLOW_SPEED: 2,            // Vitesse du pulse (secondes)

    // VOLUME BEACON - Bordure et glow jaune
    VOLUME_NEON_ENABLED: true,            // Activer la bordure jaune
    VOLUME_NEON_WIDTH: 1,                 // Épaisseur de la bordure (px)
    VOLUME_NEON_COLOR: 'rgba(255, 191, 0, 0.8)', // Couleur bordure (RGBA)
    VOLUME_GLOW_ENABLED: true,            // Activer le glow pulsant
    VOLUME_GLOW_COLOR: '255, 191, 0',     // Couleur glow (RGB pour opacité variable)
    VOLUME_GLOW_SIZE: 6,                  // Taille du glow (px)
    VOLUME_GLOW_INTENSITY: 0.5,           // Intensité max du glow (0-1)
    VOLUME_GLOW_SPEED: 2,                 // Vitesse du pulse (secondes)
    
    // VOLUME TUBE - Bordure et glow du tube qui apparaît
    VOLUME_TUBE_BORDER_ENABLED: true,             // Activer la bordure du tube
    VOLUME_TUBE_BORDER_WIDTH: 1,                  // Épaisseur de la bordure (px)
    VOLUME_TUBE_BORDER_COLOR: 'rgba(255, 208, 0, 1)', // Couleur de la bordure (RGBA)
    VOLUME_TUBE_IGNITE_ENABLED: true,                 // Activer l'animation ignite sur la bordure jaune
    VOLUME_FILL_IGNITE_ENABLED: true,                 // Activer l'animation ignite sur le tube cyan
    VOLUME_TUBE_GLOW_ENABLED: true,               // Activer le glow du tube
    VOLUME_TUBE_GLOW_SIZE: 15,                     // Taille du glow (px)
    VOLUME_TUBE_GLOW_COLOR: 'rgba(255, 208, 0, 0.5)',   // Couleur du glow (RGBA)
    
    // ══════════════════════════════════════════════════════════════════════════
    // NEON GLOW (Effet néon réutilisable)
    // ══════════════════════════════════════════════════════════════════════════
    NEON_GLOW_FLICKER_MIN_DELAY: 3000,    // Délai minimum entre flickers (ms)
    NEON_GLOW_FLICKER_MAX_DELAY: 8000,    // Délai maximum entre flickers (ms)
    NEON_GLOW_FLICKER_DURATION: 225,      // Durée d'un flicker (ms)
    NEON_GLOW_IGNITE_DURATION: 400,       // Durée de l'animation d'allumage (ms)
    NEON_GLOW_BREATHE_DURATION: 2500,     // Durée d'un cycle de respiration (ms)
    NEON_GLOW_FLICKER_MIN_OPACITY: 0.75,   // Opacité minimum pendant le flicker (0-1)
    
    // GLOW BOUTONS CAPSULE
    SORTBTN_GLOW_VERTICAL: 7,             // Spread vertical du glow (px)
    SORTBTN_GLOW_BLUR: 12,                // Blur du glow (px)
    SORTBTN_GLOW_OPACITY: 0.5,            // Opacité du glow (0-1)
    SORTBTN_COLOR: '236, 72, 153',        // Couleur des boutons actifs (RGB rose)

    // ══════════════════════════════════════════════════════════════════════════
    // NEON BEACON - Mode Scrubbing (navigation rapide)
    // ══════════════════════════════════════════════════════════════════════════
    BEACON_SCRUB_MIN_SONGS: 21,           // Nombre minimum de chansons pour activer le scrubbing
    BEACON_SCRUB_LONG_PRESS_DELAY: 300,   // Durée appui long pour activer (ms)
    BEACON_SCRUB_ARC_SIZE: 50,            // Taille de l'arc zoomé (% de la hauteur écran)
    BEACON_SCRUB_ARC_X: 30,               // Position X du centre de l'arc (% écran, 50 = centré)
    BEACON_SCRUB_ARC_Y: 50,               // Position Y du centre de l'arc (% écran, 50 = centré)
    BEACON_SCRUB_ARC_THICKNESS: 24,        // Épaisseur de l'arc zoomé (px)
    BEACON_SCRUB_TUBE_COLOR: 'rgba(85, 226, 226, 1)',  // Couleur du tube rempli
    BEACON_SCRUB_TUBE_GLOW_COLOR: 'rgba(85, 226, 226, 0.5)',  // Couleur du glow du tube
    BEACON_SCRUB_TUBE_GLOW_SIZE: 8,                            // Taille du glow autour du tube (px)
    BEACON_SCRUB_TUBE_PULSE_SPEED: 1,                          // Vitesse pulsation tube (secondes)
    BEACON_SCRUB_OVERLAY_OPACITY: 0.85,   // Opacité du fond gris
    
    // Bulles début/fin sur le tube
    BEACON_SCRUB_BUBBLE_SIZE: 0,                              // Taille des bulles 1 et N (px)
    BEACON_SCRUB_BUBBLE_FONT_SIZE: 11,                         // Taille police dans les bulles (px)
    BEACON_SCRUB_BUBBLE_COLOR: 'rgb(85, 255, 255, 1)',     // Couleur fond des bulles
    BEACON_SCRUB_BUBBLE_TEXT_COLOR: 'rgb(0, 0, 0)',  // Couleur texte des bulles
    
    // Points indicateurs sur l'arc (scrubbing)
    BEACON_SCRUB_SELECTED_COLOR: 'rgba(236, 72, 153, 1)',       // Couleur point sélection (scrubber)
    BEACON_SCRUB_SELECTED_GLOW: 'rgba(236, 72, 153, 0.8)',      // Glow du point sélection
    BEACON_SCRUB_SELECTED_SIZE: 24,                            // Taille point sélection (px)
    
    BEACON_SCRUB_PLAYING_COLOR: 'rgb(172, 172, 172, 0.75)',       // Couleur point chanson en lecture
    BEACON_SCRUB_PLAYING_GLOW: 'rgba(226, 226, 226, 0)',      // Glow du point chanson en lecture
    BEACON_SCRUB_PLAYING_SIZE: 24,                             // Taille point lecture (px)
    
    // Feedback texte (scrubbing)
    BEACON_SCRUB_TEXT_SIZE: 16,           // Taille du nom de chanson (px)
    BEACON_SCRUB_COUNTER_SIZE: 12,        // Taille du compteur "47/378" (px)

    // ══════════════════════════════════════════════════════════════════════════
    // GLOW CAPSULE CONTRÔLE (TimeCapsule)
    // ══════════════════════════════════════════════════════════════════════════
    CAPSULE_GLOW_VERTICAL: 7,           // Spread vertical du glow (px)
    CAPSULE_GLOW_HORIZONTAL: 0,         // Spread horizontal du glow (px)
    CAPSULE_GLOW_BLUR: 9,               // Flou du glow (px)
    CAPSULE_GLOW_OPACITY: 0.5,          // Opacité du glow (0 à 1)
    CAPSULE_GLOW_COLOR: '236, 72, 153', // Rose pink-500
    
    // ══════════════════════════════════════════════════════════════════════════
    // GLOW ROUE DE SÉLECTION (SwipeableSongRow)
    // ══════════════════════════════════════════════════════════════════════════
    WHEEL_GLOW_VERTICAL: 9,
    WHEEL_GLOW_HORIZONTAL: 0,
    WHEEL_GLOW_BLUR: 16,
    WHEEL_GLOW_SPREAD: 0,
    WHEEL_GLOW_OPACITY: 0.45,
    WHEEL_GLOW_COLOR: '236, 72, 153',   // RGB rose (pink-500)
    
    // ══════════════════════════════════════════════════════════════════════════
    // SLIDER VOLUME
    // ══════════════════════════════════════════════════════════════════════════
    VOLUME_LONG_PRESS_DELAY: 125,       // Durée appui long pour activer (ms)
    VOLUME_OVERLAY_OPACITY: 0.85,       // Opacité du fond sombre
    VOLUME_BAR_X: 50,                   // Position X du centre (% écran)
    VOLUME_BAR_Y: 60,                   // Position Y du centre (% écran)
    
    // Dimensions du tube (% de l'écran)
    VOLUME_BAR_HEIGHT_PERCENT: 50,      // Hauteur du tube (% de la hauteur écran)
    VOLUME_BAR_WIDTH_PERCENT: 25,        // Largeur du tube (% de la largeur écran)
    VOLUME_BAR_BORDER_RADIUS: 9999,       // Arrondi du tube (px)
    
    // Tube - fond (vide)
    VOLUME_TUBE_BG_COLOR: 'rgba(110, 110, 110, 0.2)',  // Couleur du fond du tube
    
    // Tube - remplissage (niveau de volume)
    VOLUME_FILL_COLOR: 'rgba(85, 226, 226, 1)',        // Couleur du remplissage
    VOLUME_FILL_GLOW_COLOR: 'rgba(85, 226, 226, 0.5)', // Couleur du glow du remplissage
    VOLUME_FILL_GLOW_SIZE: 50,           // Taille du glow du remplissage (px)
    
    // Curseur (thumb)
    VOLUME_THUMB_ENABLED: false,         // Afficher le curseur (true/false)
    VOLUME_THUMB_SIZE: 28,              // Taille du curseur (px)
    VOLUME_THUMB_COLOR: 'rgba(236, 72, 153, 1)',       // Couleur du curseur
    VOLUME_THUMB_GLOW_COLOR: 'rgba(236, 72, 153, 0.8)', // Couleur du glow du curseur
    VOLUME_THUMB_GLOW_SIZE: 12,         // Taille du glow du curseur (px)
    
    // Texte
    VOLUME_TEXT_SIZE: 48,               // Taille du pourcentage (px)
    
    // Fade mute/unmute
    VOLUME_FADE_DURATION: 150,          // Durée du fade mute/unmute (ms)
    VOLUME_FADE_STEPS: 10,              // Nombre d'étapes du fade
    
    // Animation morph (beacon → tube)
    VOLUME_MORPH_DURATION: 400,         // Durée de l'animation morph (ms)

    // Masque cylindre 3D sur le tube volume
    VOLUME_CYLINDER_ENABLED: false,      // Activer/désactiver l'effet cylindre
    VOLUME_CYLINDER_INTENSITY: 0.7,       // Puissance du masque (0 = invisible, 1 = normal, 2 = intense)
    VOLUME_CYLINDER_FADE_DURATION: 300, // Durée du fade-in du masque (ms)
    VOLUME_CYLINDER_SLICES: [
        0.05,
        0.10,
        0.05,
        0.00,
        0.05,
        0.10,
        0.30,
        0.20,
        0.10,
        0.00,
        0.02,
        0.04,
        0.06,
        0.08,
        0.06,
        0.04,
        0.02,
        0.00,
        0.00,
        0.00,
        0.00,
        0.02,
        0.05,
        0.07,
        0.10,
        0.13,
        0.14,
        0.17,
        0.20,
        0.10
    ],

    VOLUME_MORPH_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)', // Courbe d'animation du tube
    VOLUME_OVERLAY_EASING: 'cubic-bezier(0.7, 0, 1, 1)', // Courbe du fond (lent début, rapide fin)
    
    // Animation morph scrubbing (beacon → arc)
    BEACON_SCRUB_MORPH_DURATION: 400,   // Durée de l'animation morph (ms)
    BEACON_SCRUB_MORPH_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)', // Courbe d'animation

    // ══════════════════════════════════════════════════════════════════════════
    // FOOTER
    // ══════════════════════════════════════════════════════════════════════════
    FOOTER_SLIDE_DURATION: 400,          // Durée de l'animation slide du footer (ms)

    // ══════════════════════════════════════════════════════════════════════════
    // BARRE DE CONTRÔLE (TimeCapsule + Recenter + Volume)
    // ══════════════════════════════════════════════════════════════════════════
    CONTROL_BAR_Y: 50,                  // Position verticale dans le footer (0=bas, 100=haut)
    CONTROL_BAR_HEIGHT_PERCENT: 10,     // Hauteur des éléments (% du footer)
    CONTROL_BAR_SPACING_PERCENT: 15,     // Espacement total (% largeur écran)

    // ══════════════════════════════════════════════════════════════════════════
    // TIROIR (Dashboard Drawer)
    // ══════════════════════════════════════════════════════════════════════════
    DRAWER_HANDLE_HEIGHT_PERCENT: 4.5,    // Hauteur de la zone draggable (% de l'écran)
    DRAWER_SEPARATOR_HEIGHT: 1,         // Hauteur du trait de séparation (px)
    DRAWER_TOP_MARGIN: 0,              // Marge en haut quand tiroir ouvert au max (px) XXXXXXXXXX

    // ══════════════════════════════════════════════════════════════════════════
    // HEADER IMPORT
    // ══════════════════════════════════════════════════════════════════════════
    IMPORT_HEADER_FADE_IN_DURATION: 275,        // Durée fade in (ms)
    IMPORT_HEADER_FADE_OUT_DURATION: 275,       // Durée fade out (ms)
    IMPORT_HEADER_HEIGHT: '3rem',             // Hauteur de la barre
    IMPORT_HEADER_GAP: '0.5rem',                // Espace entre les capsules
    IMPORT_HEADER_BG_COLOR: '#ffffff',          // Couleur de fond du header temporaire
    IMPORT_ICON_SIZE_PERCENT: UNIFIED_CONFIG.ICON_SIZE_PERCENT,               // % de la hauteur de la capsule (unifié)
    IMPORT_FLICKER_TOTAL_DURATION: 400,         // Durée totale des animations flicker (ms)
    IMPORT_IGNITE_DURATION: 400,                // Durée de l'animation ignite (ms) - utilisé dans CSS et JS
    IMPORT_NUKE_COLOR: '#FF0000',               // Rouge
    IMPORT_NUKE_GLOW: 'rgba(255, 0, 0, 0.6)',
    IMPORT_DROPBOX_COLOR: '#0061FE',            // Bleu Dropbox
    DROPBOX_APP_KEY: '8iszj93vaacb78g',         // App Key Dropbox
    DROPBOX_REDIRECT_URI: 'https://jaysdc.github.io/Viibes/', // Redirect URI
    IMPORT_DROPBOX_GLOW: 'rgba(0, 97, 254, 0.6)',
    IMPORT_FOLDER_COLOR: '#F0F8FF',             // Bleu glacial
    IMPORT_NUKE_GLOW_RGB: '255, 0, 0',          // RGB pour glow rouge
    IMPORT_DROPBOX_GLOW_RGB: '0, 97, 254',      // RGB pour glow bleu
    IMPORT_FOLDER_GLOW_RGB: '0, 191, 255',      // RGB pour glow cyan
    IMPORT_FOLDER_ICON_COLOR: '#4b5563',        // Couleur de l'icône dossier (gray-600)
    IMPORT_FOLDER_GLOW: 'rgba(173, 216, 230, 0.8)',
    IMPORT_HANDLE_WIDTH_PERCENT: 15,            // % de la largeur du header
    // IMPORT_HANDLE_HEIGHT -> utilise UNIFIED_CONFIG.HANDLE_HEIGHT
    
    // CONTRÔLES - Couleur de fond commune
    CONTROL_BG_COLOR: '249, 250, 251',          // RGB - gris très clair (TimeCapsule, Volume, Recenter, Import OFF)

    // ══════════════════════════════════════════════════════════════════════════
    // GLOW RECHERCHE LIBRARY
    // ══════════════════════════════════════════════════════════════════════════
    SEARCH_LIBRARY_GLOW_VERTICAL: 5,
    SEARCH_LIBRARY_GLOW_BLUR: 12,
    SEARCH_LIBRARY_GLOW_OPACITY: 0.5,
    SEARCH_LIBRARY_GLOW_COLOR: '236, 72, 153',  // RGB rose (comme VibeBuilder)
    SEARCH_LIBRARY_FADE_IN_DURATION: 275,       // Durée fade in (ms)
    SEARCH_LIBRARY_FADE_OUT_DURATION: 275,      // Durée fade out (ms)
    SEARCH_LIBRARY_HEIGHT: UNIFIED_CONFIG.CAPSULE_HEIGHT,                // Hauteur de la barre de recherche library (unifiée)
    PLAYER_SORT_CAPSULE_HEIGHT: UNIFIED_CONFIG.CAPSULE_HEIGHT,            // Hauteur unique: capsule tri + recherche + bouton loupe (unifiée)
    SEARCH_LIBRARY_CLOSE_BTN_FLEX: 0.25,        // Flex du bouton X (comme VibeBuilder)
    SEARCH_LIBRARY_PADDING_X: '1rem',           // Padding horizontal (comme VibeBuilder)
    SEARCH_LIBRARY_ICON_SIZE: `calc(${UNIFIED_CONFIG.CAPSULE_HEIGHT} * ${UNIFIED_CONFIG.ICON_SIZE_PERCENT} / 100)`,           // Taille icône loupe (unifiée)
    SEARCH_LIBRARY_X_ICON_SIZE: `calc(${UNIFIED_CONFIG.CAPSULE_HEIGHT} * ${UNIFIED_CONFIG.ICON_SIZE_PERCENT} / 100)`,      // Taille icône X (unifiée)
    SEARCH_PLAYER_FADE_IN_DURATION: 275,        // Durée fade in (ms)
    SEARCH_PLAYER_FADE_OUT_DURATION: 275,        // Durée fade in (ms)

    // ══════════════════════════════════════════════════════════════════════════
    // GLOW BOUTON VIBE THESE
    // ══════════════════════════════════════════════════════════════════════════
    VIBE_THIS_GLOW_VERTICAL: 5,
    VIBE_THIS_GLOW_BLUR: 9,
    VIBE_THIS_GLOW_OPACITY: 0.4,
    VIBE_THIS_GLOW_COLOR: '138, 255, 8',
    VIBE_THIS_BG_COLOR: '#8CFF00',       // Couleur de fond bouton VIBE THESE
    
    // ══════════════════════════════════════════════════════════════════════════
    // LIQUID GLASS (Effet bande horizontale)
    // ══════════════════════════════════════════════════════════════════════════
    LIQUID_GLASS_BLUR: 12,                // Blur de la capsule liquid glass des VibeCards
    VIBECARD_MIN_OPACITY: 0.4,            // Opacité minimale d'une carte (quand 0 morceaux dispo)
    VIBECARD_OPACITY_GRADIENT_WIDTH: 13,  // Largeur du dégradé d'opacité (% de la largeur de la carte)
    
    // ══════════════════════════════════════════════════════════════════════════
    // DASHBOARD SCROLL PADDING
    // ══════════════════════════════════════════════════════════════════════════
    DASHBOARD_HEADER_HEIGHT_VH: 15,       // Hauteur approximative du header sticky (% hauteur écran)
    
    // ══════════════════════════════════════════════════════════════════════════
    // HEADER DASHBOARD (Logo + icônes + Search bar)
    // ══════════════════════════════════════════════════════════════════════════
    HEADER_STATUS_HEIGHT: '2rem',         // Hauteur zone encoche/heure/batterie
    HEADER_BASIC_HEIGHT: '5rem',       // Hauteur du contenu du header (logo + boutons)
    HEADER_PADDING_TOP: 3,                // Padding entre l'encoche et le header (rem)
    HEADER_PADDING_BOTTOM: 1,           // Padding sous le header (rem) = 8px
    HEADER_PADDING_X: 1.5,                // Padding horizontal du header (rem) = 24px
    HEADER_BG_OPACITY: 0.97,              // Opacité du fond blanc (0-1)
    HEADER_BLUR: 12,                      // Flou du backdrop (px)
    HEADER_Z_INDEX: 40,                   // Z-index du header sticky
    HEADER_VIBETHIS_MARGIN_TOP: 0,      // Marge au-dessus du bouton VIBE THIS (rem)
    HEADER_CARDS_GAP: 0.5,              // Espace entre le bas du header et la première carte (rem)
    HEADER_BUTTONS_HEIGHT: UNIFIED_CONFIG.CAPSULE_HEIGHT,   // Hauteur des boutons du header (unifiée)
    HEADER_BUTTONS_GAP: '1rem',       // Espace entre les boutons

    // ══════════════════════════════════════════════════════════════════════════
    // BACK TO VIBES (Overlay quand on étire le tiroir)
    // ══════════════════════════════════════════════════════════════════════════
    BACK_TO_VIBES_BG_OPACITY: 0.95,       // Opacité du fond noir (0-1)
    BACK_TO_VIBES_START_PERCENT: 25,      // % depuis le HAUT de l'écran où on COMMENCE à afficher (opacité 0)
    BACK_TO_VIBES_FULL_PERCENT: 8,        // % depuis le HAUT de l'écran où opacité = 100%
    BACK_TO_VIBES_TRIGGER_PERCENT: 17,    // % depuis le HAUT de l'écran où on switch au lecteur principal

    // CARD ANIMATION - Animation éventail (Player, Tweaker, etc.)
    CARD_ANIM_OPEN_DURATION: 800,            // Durée de l'animation d'ouverture (ms)
    CARD_ANIM_OPEN_DECEL: 0.99,              // Ralentissement à l'arrivée (0 = linéaire, 1 = freine fort)
    CARD_ANIM_CLOSE_DURATION: 650,           // Durée de l'animation de fermeture (ms)
    CARD_ANIM_CLOSE_ROTATION: 180,           // Angle de rotation pour fermeture (degrés)
    CARD_ANIM_RADIUS: '4rem',                // Coins arrondis pendant l'animation
    CARD_ANIM_BORDER_COLOR: 'rgba(71, 71, 71, 0.8)',  // Couleur bordure pendant animations
    CARD_ANIM_BORDER_WIDTH: 3,               // Épaisseur bordure pendant animations (px)
    CARD_ANIM_ORIGIN_Y: '120%',              // Point Y d'origine de la rotation (100% = bas de l'écran, 150% = en dessous)

    // PLAYER - Swipe down pour fermer
    PLAYER_SWIPE_CLOSE_THRESHOLD_PERCENT: 25, // % de l'écran à swiper pour fermer
    PLAYER_SLIDE_DURATION: 400,               // Durée de l'animation slide (ms)
    PLAYER_FADE_OUT_ENABLED: true,            // Activer le fade out à la fermeture
    PLAYER_FADE_OUT_DURATION: 500,            // Durée du fade out (ms)
    PLAYER_FADE_OUT_MIN_OPACITY: 0,           // Opacité finale (0 = invisible, 0.5 = semi-transparent)

    // PLAYER HEADER - Espacements
    PLAYER_HEADER_TITLE_MARGIN_TOP: '0.5rem',        // Marge au-dessus du titre (px)
    PLAYER_HEADER_TITLE_MARGIN_BOTTOM: '0.5rem',     // Marge sous le titre (px)
    PLAYER_HEADER_CONTROLS_MARGIN_BOTTOM: '0.5rem',  // Marge sous la barre de contrôle (px)
    PLAYER_HEADER_HANDLE_WIDTH: 48,           // Largeur du handle (px)
    PLAYER_HEADER_HANDLE_MARGIN_BOTTOM: '0.5rem',   // Marge sous le handle (px)
    PLAYER_WHEEL_OFFSET_PERCENT: 5,              // Décalage vertical de la roue vers le bas (% de l'espace disponible)

    // ══════════════════════════════════════════════════════════════════════════
    // DRAWER (Tiroir dashboard)
    // ══════════════════════════════════════════════════════════════════════════
    DRAWER_DEFAULT_HEIGHT_PERCENT: 28,    // Hauteur par défaut du drawer (% de l'écran)
    DRAWER_TWEAKER_HEIGHT_PERCENT: 0,    // Hauteur du drawer quand Tweaker ouvert (% de l'écran)
    DRAWER_TOP_SPACING: 32,               // Espacement entre la dernière carte et le haut du tiroir (px)
    FOOTER_TOP_SPACING: 32,               // Espacement entre la dernière carte et le haut du footer (px)
    DRAWER_TWEAKER_ANIMATION_DURATION: 3000, // Durée de l'animation du drawer vers Tweaker (ms)
    DRAWER_TWEAKER_ANIMATION_DECEL: 0.99,   // Ralentissement à l'arrivée (0 = linéaire, 1 = freine fort)

    // ══════════════════════════════════════════════════════════════════════════
    // COULEURS NÉON (format RGB pour variable CSS)
    // ══════════════════════════════════════════════════════════════════════════
    NEON_COLOR_LIME: '192, 255, 0',       // Vert lime (BACK TO VIBES, Check)
    NEON_COLOR_EMERALD: '16, 185, 129',   // Vert émeraude (PLAY NEXT)
    NEON_COLOR_ROSE: '244, 63, 94',       // Rose (ARCHIVE)
    NEON_COLOR_ORANGE: '255, 103, 0',     // Orange (KILL VIBE)
    NEON_COLOR_RED: '255, 7, 58',         // Rouge (NUKE ALL)

    // ══════════════════════════════════════════════════════════════════════════
    // FEEDBACK ANIMATION (apparition, blinks, fade out)
    // ══════════════════════════════════════════════════════════════════════════
    FEEDBACK_FADEIN_DURATION: 75,                 // Durée du fade in à l'apparition (ms)
    FEEDBACK_TEXT_OPACITY: 100,                   // Opacité normale du texte (%)
    FEEDBACK_BLINK_COUNT: 3,                      // Nombre de blinks
    FEEDBACK_BLINK_DURATIONS: [100, 80, 200],    // Durée de chaque blink (ms) - tableau
    FEEDBACK_BLINK_MIN_OPACITIES: [40, 20, 50],   // Opacité min de chaque blink (%) - absolu
    FEEDBACK_FADEOUT_DURATION: 150,               // Durée du fade out final texte (ms)
    FEEDBACK_GLOW_FADEOUT_DURATION: 150,          // Durée du fade out final glow (ms)
    FEEDBACK_SPEED_MULTIPLIER: 1,                 // Multiplicateur vitesse (1=normal, 2=2x, 0.5=0.5x)
    
    // Glow à l'activation (flash initial)
    FEEDBACK_GLOW_FLASH_ENABLED: true,            // Activer le flash à l'apparition
    FEEDBACK_GLOW_FLASH_INTENSITY: 140,           // Intensité du flash (% du glow normal)
    FEEDBACK_GLOW_FLASH_DURATION: 40,            // Durée du flash avant idle (ms)
    
    // Flash à la validation (punch avant fade out)
    FEEDBACK_VALIDATION_FLASH_ENABLED: true,      // Activer le flash de validation
    FEEDBACK_VALIDATION_FLASH_INTENSITY: 200,     // Intensité du punch (% du glow normal)
    FEEDBACK_VALIDATION_FLASH_DURATION: 40,       // Durée du punch (ms)
    
    // Idle et transitions
    FEEDBACK_IDLE_DELAY: 0,                     // Délai en idle avant de lancer la validation (ms)
    FEEDBACK_BLINK_TRANSITION: 40,                // Durée de transition entre opacités pendant blink (ms)
    
    // Glow pulse pendant idle
    FEEDBACK_GLOW_PULSE_ENABLED: true,            // Activer le pulse du glow pendant idle
    FEEDBACK_GLOW_PULSE_MIN: 80,                  // Intensité min du pulse (%)
    FEEDBACK_GLOW_PULSE_MAX: 120,                 // Intensité max du pulse (%)
    FEEDBACK_GLOW_PULSE_DURATION: 600,            // Durée d'un cycle de pulse (ms)
    
    // ══════════════════════════════════════════════════════════════════════════
    // CARD BLINK ANIMATION (animation opacité pour éléments non-texte)
    // ══════════════════════════════════════════════════════════════════════════
    CARD_BLINK_COUNT: 3,                          // Nombre de blinks
    CARD_BLINK_DURATIONS: [100, 80, 200],             // Durée de chaque blink (ms) - tableau
    CARD_BLINK_MIN_OPACITIES: [40, 20, 50],           // Opacité min de chaque blink (%)
    CARD_BLINK_TRANSITION: 40,                    // Durée de transition entre opacités (ms)
    CARD_BLINK_IDLE_DELAY: 0,                     // Délai avant de lancer l'animation (ms)
    CARD_BLINK_FADEOUT_DURATION: 100,             // Durée après le dernier blink avant callback (ms)
    CARD_BLINK_SPEED_MULTIPLIER: 1,               // Multiplicateur vitesse (1=normal, 2=2x, 0.5=0.5x)

    // ══════════════════════════════════════════════════════════════════════════
    // TEXTES CONFIRMATION KILL / NUKE
    // ══════════════════════════════════════════════════════════════════════════
    KILL_TEXT: 'KILL VIBE?',                     // Texte unique Kill
    NUKE_TEXT: 'NUKE ALL?!',                      // Texte unique Nuke

    // ══════════════════════════════════════════════════════════════════════════
    // CONFIRMATION PILL (slide to confirm)
    // ══════════════════════════════════════════════════════════════════════════
    CONFIRM_PILL_HEIGHT_PERCENT: 25,             // Hauteur du pill (% largeur écran, comme volume)
    CONFIRM_PILL_WIDTH_PERCENT: 80,              // Largeur du pill (% largeur écran)
    CONFIRM_PILL_ICON_SIZE_PERCENT: 50,          // Taille icônes X/Check (% hauteur pill)
    CONFIRM_PILL_CURSOR_SIZE_PERCENT: 80,        // Taille du curseur (% hauteur pill)
    CONFIRM_PILL_BG_COLOR: 'rgba(110, 110, 110, 0.15)', // Fond du pill
    CONFIRM_PILL_CURSOR_COLOR: 'rgba(255, 255, 255, 0.9)', // Couleur du curseur
    CONFIRM_PILL_BLUR: 20,                       // Blur du pill (px)
    CONFIRM_BACKDROP_BLUR: 8,                    // Blur du fond quand pill visible (px) - fixe = performant
    CONFIRM_FADE_DURATION: 150,                  // Durée du fade in/out du pill (ms)

    // ══════════════════════════════════════════════════════════════════════════
    // CAPSULE LIQUID GLASS DES VIBECARDS
    // ══════════════════════════════════════════════════════════════════════════
    VIBECARD_CAPSULE_PX: 1,               // Padding horizontal (rem)
    VIBECARD_CAPSULE_PY: 0.5,             // Padding vertical (rem)
    VIBECARD_CAPSULE_RIGHT_MARGIN: 0.5,   // Marge entre capsule et icône droite (rem)
    VIBECARD_CAPSULE_NAME_MAX_WIDTH: 15,   // Largeur max du nom (rem) ~150px
    VIBECARD_CAPSULE_FONT_SIZE: 1.125,    // Taille police du nom (rem) ~18px
    MARQUEE_CHARS_PER_SECOND: 8,            // Vitesse du scrolling (caractères par seconde)
    MARQUEE_MIN_DURATION: 5,                // Durée minimum du scrolling (secondes)
    
    // ══════════════════════════════════════════════════════════════════════════
    // TIME CAPSULE - Boutons Skip
    // ══════════════════════════════════════════════════════════════════════════
    TC_SKIP_BUTTON_SIZE: 2.25,             // Taille boutons skip (rem)
    TC_SKIP_ICON_SIZE: 1.5,               // Taille icône dans bouton (rem)
    TC_SKIP_LABEL_SIZE: 0.50,             // Taille du "10" (rem)
    TC_SKIP_BACK_X_PERCENT: 0,            // Position X bouton -10s (% depuis la gauche)
    TC_SKIP_FORWARD_X_PERCENT: 0,         // Position X bouton +10s (% depuis la droite)
    TC_SKIP_Y_PERCENT: 50,                // Position Y boutons skip (% depuis le haut, 50 = centré)
    
    // ══════════════════════════════════════════════════════════════════════════
    // TIME CAPSULE - Progress Bar (position relative à la capsule)
    // ══════════════════════════════════════════════════════════════════════════
    TC_PROGRESS_HEIGHT: 0.5,              // Hauteur progress bar (rem)
    TC_PROGRESS_THUMB_SIZE: 16,           // Taille du thumb rose (px)
    TC_PROGRESS_TOP_PERCENT: 40,          // Position Y en % (50 = centré verticalement)
    TC_PROGRESS_LEFT_PERCENT: 20,         // Distance depuis la gauche en %
    TC_PROGRESS_RIGHT_PERCENT: 20,        // Distance depuis la droite en %
    
    // ══════════════════════════════════════════════════════════════════════════
    // TIME CAPSULE - Indicateurs Temps (position relative à la progress bar)
    // ══════════════════════════════════════════════════════════════════════════
    TC_TIME_FONT_SIZE: 0.6,              // Taille police temps (rem)
    TC_TIME_Y_PERCENT: 95,               // Position Y en % par rapport à la progress bar
    TC_TIME_ELAPSED_X_PERCENT: 0,         // Position X temps écoulé (0 = gauche)
    TC_TIME_REMAINING_X_PERCENT: 100,     // Position X temps restant (100 = droite)
};


// --- 1. STYLE CSS ---
const styles = `
  /* Orientation lock - bloque le mode paysage (TEMPORAIREMENT DÉSACTIVÉ)
  @media screen and (orientation: landscape) {
    .orientation-lock-overlay {
      display: flex !important;
    }
  }
  */

  .orientation-lock-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: #000;
    z-index: 99999;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: white;
    font-weight: bold;
    gap: 1rem;
  }

  .orientation-lock-icon {
    font-size: 4rem;
    animation: rotate-phone 1.5s ease-in-out infinite;
  }

  @keyframes rotate-phone {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-90deg); }
  }

  /* Safe area iOS - utilise la vraie valeur de l'encoche */
  .safe-area-top {
    padding-top: env(safe-area-inset-top, 0px);
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  @keyframes beacon-pulse {
    0%, 100% { 
      opacity: 0.7;
      transform: scale(1);
      box-shadow: 0 0 ${CONFIG.BEACON_PULSE_GLOW_SIZE}px rgba(${CONFIG.BEACON_PULSE_COLOR}, ${CONFIG.BEACON_PULSE_GLOW_OPACITY});
    }
    50% { 
      opacity: 1;
      transform: scale(1.3);
      box-shadow: 0 0 ${CONFIG.BEACON_PULSE_GLOW_SIZE * 1.5}px rgba(${CONFIG.BEACON_PULSE_COLOR}, 1);
    }
  }
  
  .beacon-dot {
    animation: beacon-pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes capsule-neon-breathe {
    0%, 100% { 
      opacity: ${CONFIG.CAPSULE_NEON_OPACITY_MIN};
      box-shadow: 0 0 ${CONFIG.CAPSULE_NEON_GLOW_SIZE}px rgba(${CONFIG.CAPSULE_NEON_COLOR}, ${CONFIG.CAPSULE_NEON_OPACITY_MIN});
    }
    50% { 
      opacity: ${CONFIG.CAPSULE_NEON_OPACITY_MAX};
      box-shadow: 0 0 ${CONFIG.CAPSULE_NEON_GLOW_SIZE * 2}px rgba(${CONFIG.CAPSULE_NEON_COLOR}, ${CONFIG.CAPSULE_NEON_OPACITY_MAX});
    }
  }
  
  .capsule-neon-glow {
    animation: capsule-neon-breathe ${CONFIG.CAPSULE_NEON_SPEED}s ease-in-out infinite;
  }
  
  @keyframes capsule-neon-pulse {
    0%, 100% { 
      box-shadow: 0 0 4px rgba(${CONFIG.CAPSULE_NEON_COLOR}, 0.2);
    }
    25% { 
      box-shadow: 0 0 8px rgba(${CONFIG.CAPSULE_NEON_COLOR}, 0.7);
    }
    50% { 
      box-shadow: 0 0 5px rgba(${CONFIG.CAPSULE_NEON_COLOR}, 0.35);
    }
    75% { 
      box-shadow: 0 0 10px rgba(${CONFIG.CAPSULE_NEON_COLOR}, 0.75);
    }
  }
  
  .capsule-neon-glow-playing {
    animation: capsule-neon-pulse 2.0s ease-in-out infinite;
  }
  
  @keyframes recenter-glow-pulse {
    0%, 100% { 
      box-shadow: 0 0 ${CONFIG.RECENTER_GLOW_SIZE * 0.5}px rgba(${CONFIG.RECENTER_GLOW_COLOR}, ${CONFIG.RECENTER_GLOW_INTENSITY * 0.3});
    }
    50% { 
      box-shadow: 0 0 ${CONFIG.RECENTER_GLOW_SIZE}px rgba(${CONFIG.RECENTER_GLOW_COLOR}, ${CONFIG.RECENTER_GLOW_INTENSITY});
    }
  }
  
  .recenter-glow {
    animation: recenter-glow-pulse ${CONFIG.RECENTER_GLOW_SPEED}s ease-in-out infinite;
  }
  
  @keyframes timecapsule-glow-pulse {
    0%, 100% { 
      box-shadow: 0 0 ${CONFIG.TIMECAPSULE_GLOW_SIZE * 0.5}px rgba(${CONFIG.TIMECAPSULE_GLOW_COLOR}, ${CONFIG.TIMECAPSULE_GLOW_INTENSITY * 0.3});
    }
    50% { 
      box-shadow: 0 0 ${CONFIG.TIMECAPSULE_GLOW_SIZE}px rgba(${CONFIG.TIMECAPSULE_GLOW_COLOR}, ${CONFIG.TIMECAPSULE_GLOW_INTENSITY});
    }
  }
  
  .timecapsule-glow {
    animation: timecapsule-glow-pulse ${CONFIG.TIMECAPSULE_GLOW_SPEED}s ease-in-out infinite;
  }
  
  @keyframes volume-glow-pulse {
    0%, 100% { 
      box-shadow: 0 0 ${CONFIG.VOLUME_GLOW_SIZE * 0.5}px rgba(${CONFIG.VOLUME_GLOW_COLOR}, ${CONFIG.VOLUME_GLOW_INTENSITY * 0.3});
    }
    50% { 
      box-shadow: 0 0 ${CONFIG.VOLUME_GLOW_SIZE}px rgba(${CONFIG.VOLUME_GLOW_COLOR}, ${CONFIG.VOLUME_GLOW_INTENSITY});
    }
  }
  
  .volume-glow {
    animation: volume-glow-pulse ${CONFIG.VOLUME_GLOW_SPEED}s ease-in-out infinite;
  }
  
  @keyframes scrub-tube-pulse {
    0%, 100% { 
      opacity: 0.3;
      filter: blur(4px);
    }
    50% { 
      opacity: 0.6;
      filter: blur(6px);
    }
  }
  
  .scrub-tube-glow {
    animation: scrub-tube-pulse ${CONFIG.BEACON_SCRUB_TUBE_PULSE_SPEED}s ease-in-out infinite;
  }
  
  @keyframes marquee {
    0%, 20% { transform: translateX(0%); }
    80%, 100% { transform: translateX(-50%); }
  }
  
  .animate-marquee {
    display: inline-block;
    white-space: nowrap;
    animation: marquee var(--marquee-duration, 6s) linear infinite alternate;
  }

  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
    }

    .animate-spin-slow {
        animation: spin-slow 7.5s linear infinite;
    }

  @keyframes appear-ease {
    0% { opacity: 0; transform: scale(1); }
    100% { opacity: 1; transform: scale(1); }
  }

  .animate-appear {
    animation: appear-ease 0.2s ease-out forwards;
  }

  .drawer-optimized {
    will-change: height;
    contain: layout style;
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

  @keyframes bounce-neon-red {
    0%, 100% {
      transform: translateY(-25%);
      filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.6)) brightness(1);
    }
    25%, 75% {
      filter: drop-shadow(0 0 30px rgba(239, 68, 68, 1)) brightness(1.2);
    }
    50% {
      transform: translateY(0);
      filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.6)) brightness(1);
    }
  }
  .animate-bounce-neon-red {
    animation: bounce-neon-red 1s ease-in-out infinite;
    color: #ef4444 !important;
  }

  /* Animation pulse pour le pill de confirmation - grossit jusqu'au diamètre du tube */
  @keyframes pulse-pill-lime {
    0%, 100% {
      transform: scale(var(--pulse-scale-min, 1));
      box-shadow: 0 0 15px rgba(132, 204, 22, 0.6);
    }
    50% {
      transform: scale(var(--pulse-scale-max, 1.25));
      box-shadow: 0 0 30px rgba(132, 204, 22, 1);
    }
  }
  .animate-pulse-pill-lime {
    animation: pulse-pill-lime 0.6s ease-in-out infinite;
  }

  @keyframes pulse-pill-red {
    0%, 100% {
      transform: scale(var(--pulse-scale-min, 1));
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
    }
    50% {
      transform: scale(var(--pulse-scale-max, 1.25));
      box-shadow: 0 0 30px rgba(239, 68, 68, 1);
    }
  }
  .animate-pulse-pill-red {
    animation: pulse-pill-red 0.6s ease-in-out infinite;
  }

  /* Animation ignite pour le curseur de confirmation pill - lime (kill vibe) */
  @keyframes ignite-pill-lime {
    0% { box-shadow: 0 0 10px rgba(132, 204, 22, 0.4); }
    15% { box-shadow: 0 0 25px rgba(132, 204, 22, 1), 0 0 50px rgba(132, 204, 22, 0.8); }
    25% { box-shadow: 0 0 15px rgba(132, 204, 22, 0.5); }
    40% { box-shadow: 0 0 35px rgba(132, 204, 22, 1), 0 0 70px rgba(132, 204, 22, 0.9); }
    55% { box-shadow: 0 0 20px rgba(132, 204, 22, 0.6); }
    70% { box-shadow: 0 0 30px rgba(132, 204, 22, 0.9), 0 0 60px rgba(132, 204, 22, 0.7); }
    100% { box-shadow: 0 0 25px rgba(132, 204, 22, 0.7), 0 0 50px rgba(132, 204, 22, 0.5); }
  }
  .animate-ignite-pill-lime {
    animation: ignite-pill-lime 0.5s ease-out forwards;
  }

  /* Animation ignite pour le curseur de confirmation pill - red (nuke) */
  @keyframes ignite-pill-red {
    0% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
    15% { box-shadow: 0 0 25px rgba(239, 68, 68, 1), 0 0 50px rgba(239, 68, 68, 0.8); }
    25% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); }
    40% { box-shadow: 0 0 35px rgba(239, 68, 68, 1), 0 0 70px rgba(239, 68, 68, 0.9); }
    55% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.6); }
    70% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.9), 0 0 60px rgba(239, 68, 68, 0.7); }
    100% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.7), 0 0 50px rgba(239, 68, 68, 0.5); }
  }
  .animate-ignite-pill-red {
    animation: ignite-pill-red 0.5s ease-out forwards;
  }

  @keyframes appear-then-fade {
    0% { opacity: 0; transform: scale(1); }
    15% { opacity: 1; transform: scale(1); }
    75% { opacity: 1; }
    100% { opacity: 0; }
  }
  .animate-appear-fade {
    animation: appear-then-fade 1.2s ease-out forwards;
  }

  /* ========== PARAMÈTRES ANIMATION MENU RADIAL ========== 
   * 
   * POUR CHAQUE ICÔNE TU PEUX TWEAKER :
   * --move-duration     : vitesse déplacement (ex: 0.15s)
   * --flicker-duration  : vitesse clignotement (ex: 0.6s)
   * --glow-intensity    : intensité du glow (ex: 1 = normal, 2 = double, 0.5 = moitié)
   * --flicker-count     : nombre de clignotements (1, 2, ou 3)
   * --glow-rest         : glow permanent après animation (ex: 8px)
   * animation-delay     : délai avant apparition (ex: 80ms)
   *
   * ==================================================== */

  /* Animation de déplacement */
  @keyframes radial-move {
    0% { transform: translate(0px, 0px) scale(0); }
    100% { transform: translate(var(--target-x), var(--target-y)) scale(1); }
  }

  /* Flicker avec 1 clignotement */
  @keyframes flicker-x1 {
    0% { opacity: 0; box-shadow: 0 0 0px var(--glow-color); }
    25% { opacity: 1; box-shadow: 0 0 calc(30px * var(--glow-intensity)) var(--glow-color), 0 0 calc(50px * var(--glow-intensity)) var(--glow-color); }
    50% { opacity: 0.6; box-shadow: 0 0 calc(10px * var(--glow-intensity)) var(--glow-color); }
    75% { opacity: 1; box-shadow: 0 0 calc(25px * var(--glow-intensity)) var(--glow-color); }
    100% { opacity: 1; box-shadow: 0 0 var(--glow-rest) var(--glow-color); }
  }

  /* Flicker avec 2 clignotements */
  @keyframes flicker-x2 {
    0% { opacity: 0; box-shadow: 0 0 0px var(--glow-color); }
    20% { opacity: 1; box-shadow: 0 0 calc(20px * var(--glow-intensity)) var(--glow-color); }
    30% { opacity: 0.3; box-shadow: 0 0 calc(5px * var(--glow-intensity)) var(--glow-color); }
    45% { opacity: 1; box-shadow: 0 0 calc(25px * var(--glow-intensity)) var(--glow-color); }
    55% { opacity: 0.5; box-shadow: 0 0 calc(8px * var(--glow-intensity)) var(--glow-color); }
    70% { opacity: 1; box-shadow: 0 0 calc(20px * var(--glow-intensity)) var(--glow-color); }
    100% { opacity: 1; box-shadow: 0 0 var(--glow-rest) var(--glow-color); }
  }

  /* Flicker avec 3 clignotements */
  @keyframes flicker-x3 {
    0% { opacity: 0; box-shadow: 0 0 0px var(--glow-color); }
    15% { opacity: 1; box-shadow: 0 0 calc(15px * var(--glow-intensity)) var(--glow-color); }
    22% { opacity: 0.2; box-shadow: 0 0 calc(3px * var(--glow-intensity)) var(--glow-color); }
    32% { opacity: 0.9; box-shadow: 0 0 calc(20px * var(--glow-intensity)) var(--glow-color); }
    40% { opacity: 0.4; box-shadow: 0 0 calc(6px * var(--glow-intensity)) var(--glow-color); }
    50% { opacity: 1; box-shadow: 0 0 calc(25px * var(--glow-intensity)) var(--glow-color); }
    62% { opacity: 0.6; box-shadow: 0 0 calc(10px * var(--glow-intensity)) var(--glow-color); }
    75% { opacity: 1; box-shadow: 0 0 calc(18px * var(--glow-intensity)) var(--glow-color); }
    100% { opacity: 1; box-shadow: 0 0 var(--glow-rest) var(--glow-color); }
  }

  .animate-flicker-1 {
    --flicker-duration: 0.5s;
    --glow-intensity: 1;
    --glow-rest: 8px;
    animation: flicker-x3 var(--flicker-duration) ease-out forwards;
    animation-delay: 0ms;
  }

  .animate-flicker-2 {
    --flicker-duration: 0.4s;
    --glow-intensity: 1;
    --glow-rest: 8px;
    animation: flicker-x2 var(--flicker-duration) ease-out forwards;
    animation-delay: 80ms;
  }

  .animate-flicker-3 {
    --flicker-duration: 0.6s;
    --glow-intensity: 2;
    --glow-rest: 12px;
    animation: flicker-x1 var(--flicker-duration) ease-out forwards;
    animation-delay: 160ms;
  }

  /* Pulsation douce du glow (respiration) */
  @keyframes import-btn-pulse {
    0%, 100% { 
      box-shadow: 0 0 var(--glow-rest) var(--glow-color);
      opacity: 1;
    }
    50% { 
      box-shadow: 0 0 calc(var(--glow-rest) * 1.8) var(--glow-color);
      opacity: 0.95;
    }
  }

  /* Sautillement rapide (vacillement néon) */
  @keyframes import-btn-flicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .animate-import-pulse {
    animation: import-btn-pulse 2s ease-in-out infinite;
  }

  .animate-import-flicker-once {
    animation: import-btn-flicker 0.1s ease-in-out;
  }

  /* Animation slide du handle */
 @keyframes import-handle-slide-in {
    0% { max-height: 0; }
    100% { max-height: calc(${UNIFIED_CONFIG.HANDLE_HEIGHT}px + ${CONFIG.HEADER_PADDING_BOTTOM}rem); }
  }

  @keyframes import-handle-slide-out {
    0% { max-height: calc(${UNIFIED_CONFIG.HANDLE_HEIGHT}px + ${CONFIG.HEADER_PADDING_BOTTOM}rem); }
    100% { max-height: 0; }
  }

  /* Animation slide du handle player */
  @keyframes player-handle-slide-in {
    0% { max-height: 0; opacity: 0; }
    100% { max-height: calc(${UNIFIED_CONFIG.HANDLE_HEIGHT}px + ${CONFIG.PLAYER_HEADER_HANDLE_MARGIN_BOTTOM}); opacity: 1; }
  }

  @keyframes player-handle-slide-out {
    0% { max-height: calc(${UNIFIED_CONFIG.HANDLE_HEIGHT}px + ${CONFIG.PLAYER_HEADER_HANDLE_MARGIN_BOTTOM}); opacity: 1; }
    100% { max-height: 0; opacity: 0; }
  }

  @keyframes blink-3 {
    0%, 50%, 100% { opacity: 1; }
    25%, 75% { opacity: 0.3; }
  }

  .animate-blink {
    animation: blink-3 0.5s linear; 
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

  /* ═══════════════════════════════════════════════════════════════════════════
     ANIMATION NÉON UNIFIÉE - Utilise --neon-color (format: "R, G, B")
     ═══════════════════════════════════════════════════════════════════════════ */
  @keyframes neon-glow {
    0%, 100% { 
      box-shadow: 0 0 20px rgba(var(--neon-color), 0.8), 0 0 40px rgba(var(--neon-color), 0.4);
    }
    50% { 
      box-shadow: 0 0 35px rgba(var(--neon-color), 1), 0 0 70px rgba(var(--neon-color), 0.6);
    }
  }
  
  .animate-neon-glow {
    animation: neon-glow 0.3s ease-in-out infinite;
  }

  /* Variantes de durée */
  .animate-neon-glow-once {
    animation: neon-glow 0.3s ease-in-out;
  }
  
  .animate-neon-glow-slow {
    animation: neon-glow 0.5s ease-in-out infinite;
  }

  @keyframes fade-out {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
  
  .animate-fade-out {
    animation: fade-out 0.3s ease-out forwards;
  }

  .animate-glow-pulse {
    animation: glow-pulse 0.3s ease-in-out 2;
  }

  @keyframes neon-ignite-pink {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(236, 72, 153, 0.2), 0 4px 8px rgba(236, 72, 153, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(236, 72, 153, 0.8), 0 7px 15px rgba(236, 72, 153, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(236, 72, 153, 0.3), 0 5px 10px rgba(236, 72, 153, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(236, 72, 153, 0.9), 0 8px 18px rgba(236, 72, 153, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(236, 72, 153, 0.5), 0 6px 12px rgba(236, 72, 153, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(236, 72, 153, 0.7), 0 7px 14px rgba(236, 72, 153, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(236, 72, 153, 0.5), 0 7px 12px rgba(236, 72, 153, 0.5); }
  }
  .animate-neon-ignite-pink { animation: neon-ignite-pink 0.4s ease-out forwards; }

  @keyframes neon-ignite-orange {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(255, 107, 0, 0.2), 0 4px 8px rgba(255, 107, 0, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(255, 107, 0, 0.8), 0 7px 15px rgba(255, 107, 0, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(255, 107, 0, 0.3), 0 5px 10px rgba(255, 107, 0, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(255, 107, 0, 0.9), 0 8px 18px rgba(255, 107, 0, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(255, 107, 0, 0.5), 0 6px 12px rgba(255, 107, 0, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(255, 107, 0, 0.7), 0 7px 14px rgba(255, 107, 0, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(255, 107, 0, 0.5), 0 7px 12px rgba(255, 107, 0, 0.5); }
  }
  .animate-neon-ignite-orange { animation: neon-ignite-orange 0.4s ease-out forwards; }

  @keyframes neon-ignite-red {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(255, 0, 0, 0.2), 0 4px 8px rgba(255, 0, 0, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(255, 0, 0, 0.8), 0 7px 15px rgba(255, 0, 0, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(255, 0, 0, 0.3), 0 5px 10px rgba(255, 0, 0, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(255, 0, 0, 0.9), 0 8px 18px rgba(255, 0, 0, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(255, 0, 0, 0.5), 0 6px 12px rgba(255, 0, 0, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(255, 0, 0, 0.7), 0 7px 14px rgba(255, 0, 0, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(255, 0, 0, 0.5), 0 7px 12px rgba(255, 0, 0, 0.5); }
  }
  .animate-neon-ignite-red { animation: neon-ignite-red var(--ignite-duration, 0.4s) ease-out forwards; }

  @keyframes neon-ignite-blue {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(0, 97, 254, 0.2), 0 4px 8px rgba(0, 97, 254, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(0, 97, 254, 0.8), 0 7px 15px rgba(0, 97, 254, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(0, 97, 254, 0.3), 0 5px 10px rgba(0, 97, 254, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(0, 97, 254, 0.9), 0 8px 18px rgba(0, 97, 254, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(0, 97, 254, 0.5), 0 6px 12px rgba(0, 97, 254, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(0, 97, 254, 0.7), 0 7px 14px rgba(0, 97, 254, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(0, 97, 254, 0.5), 0 7px 12px rgba(0, 97, 254, 0.5); }
  }
  .animate-neon-ignite-blue { animation: neon-ignite-blue var(--ignite-duration, 0.4s) ease-out forwards; }

  @keyframes neon-ignite-iceblue {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(173, 216, 230, 0.2), 0 4px 8px rgba(173, 216, 230, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(173, 216, 230, 0.8), 0 7px 15px rgba(173, 216, 230, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(173, 216, 230, 0.3), 0 5px 10px rgba(173, 216, 230, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(173, 216, 230, 0.9), 0 8px 18px rgba(173, 216, 230, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(173, 216, 230, 0.5), 0 6px 12px rgba(173, 216, 230, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(173, 216, 230, 0.7), 0 7px 14px rgba(173, 216, 230, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(173, 216, 230, 0.5), 0 7px 12px rgba(173, 216, 230, 0.5); }
  }
  .animate-neon-ignite-iceblue { animation: neon-ignite-iceblue var(--ignite-duration, 0.4s) ease-out forwards; }

  @keyframes neon-ignite-yellow {
    0% { 
      border-color: rgba(80, 80, 80, 0.3);
      box-shadow: none;
    }
    30% { 
      border-color: rgba(255, 240, 150, 1);
      box-shadow: 0 0 20px rgba(255, 208, 0, 0.8), inset 0 0 10px rgba(255, 208, 0, 0.3);
    }
    100% { 
      border-color: rgba(255, 208, 0, 1);
      box-shadow: 0 0 15px rgba(255, 208, 0, 0.5);
    }
  }
  .animate-neon-ignite-yellow { animation: neon-ignite-yellow 0.5s ease-out forwards; }

  @keyframes neon-ignite-cyan {
    0% { 
      background-color: rgba(50, 50, 50, 0.3);
      filter: drop-shadow(0 0 0px transparent);
    }
    30% { 
      background-color: rgba(150, 255, 255, 1);
      filter: drop-shadow(0 0 30px rgba(85, 226, 226, 0.9));
    }
    100% { 
      background-color: rgba(85, 226, 226, 1);
      filter: drop-shadow(0 0 50px rgba(85, 226, 226, 0.5));
    }
  }
  .animate-neon-ignite-cyan { animation: neon-ignite-cyan 0.5s ease-out forwards; }

  @keyframes neon-breathe-orange {
    0%, 100% { box-shadow: 0 -7px 12px rgba(255, 107, 0, 0.45), 0 7px 12px rgba(255, 107, 0, 0.45); transform: scale(1); }
    50% { box-shadow: 0 -8px 14px rgba(255, 107, 0, 0.55), 0 8px 14px rgba(255, 107, 0, 0.55); transform: scale(1.01); }
  }
  .animate-neon-breathe-orange { animation: neon-breathe-orange 2.5s ease-in-out infinite; }

  @keyframes neon-breathe-pink {
    0%, 100% { box-shadow: 0 -7px 12px rgba(236, 72, 153, 0.45), 0 7px 12px rgba(236, 72, 153, 0.45); transform: scale(1); }
    50% { box-shadow: 0 -8px 14px rgba(236, 72, 153, 0.55), 0 8px 14px rgba(236, 72, 153, 0.55); transform: scale(1.01); }
  }
  .animate-neon-breathe-pink { animation: neon-breathe-pink 2.5s ease-in-out infinite; }

  @keyframes neon-flicker-pink {
    0% { opacity: 1; box-shadow: 0 -7px 12px rgba(236, 72, 153, 0.5), 0 7px 12px rgba(236, 72, 153, 0.5); }
    25% { opacity: 0.4; box-shadow: 0 -4px 8px rgba(236, 72, 153, 0.2), 0 4px 8px rgba(236, 72, 153, 0.2); }
    50% { opacity: 0.9; box-shadow: 0 -6px 10px rgba(236, 72, 153, 0.4), 0 6px 10px rgba(236, 72, 153, 0.4); }
    75% { opacity: 0.3; box-shadow: 0 -3px 6px rgba(236, 72, 153, 0.15), 0 3px 6px rgba(236, 72, 153, 0.15); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(236, 72, 153, 0.5), 0 7px 12px rgba(236, 72, 153, 0.5); }
  }
  .animate-neon-flicker-pink { animation: neon-flicker-pink 0.15s ease-in-out; }

  @keyframes neon-flicker-green {
    0% { opacity: 1; box-shadow: 0 -7px 12px rgba(16, 185, 129, 0.5), 0 7px 12px rgba(16, 185, 129, 0.5); }
    25% { opacity: 0.4; box-shadow: 0 -4px 8px rgba(16, 185, 129, 0.2), 0 4px 8px rgba(16, 185, 129, 0.2); }
    50% { opacity: 0.9; box-shadow: 0 -6px 10px rgba(16, 185, 129, 0.4), 0 6px 10px rgba(16, 185, 129, 0.4); }
    75% { opacity: 0.3; box-shadow: 0 -3px 6px rgba(16, 185, 129, 0.15), 0 3px 6px rgba(16, 185, 129, 0.15); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(16, 185, 129, 0.5), 0 7px 12px rgba(16, 185, 129, 0.5); }
  }
  .animate-neon-flicker-green { animation: neon-flicker-green 0.15s ease-in-out; }

  @keyframes neon-flicker-orange {
    0% { opacity: 1; box-shadow: 0 -7px 12px rgba(249, 115, 22, 0.5), 0 7px 12px rgba(249, 115, 22, 0.5); }
    25% { opacity: 0.4; box-shadow: 0 -4px 8px rgba(249, 115, 22, 0.2), 0 4px 8px rgba(249, 115, 22, 0.2); }
    50% { opacity: 0.9; box-shadow: 0 -6px 10px rgba(249, 115, 22, 0.4), 0 6px 10px rgba(249, 115, 22, 0.4); }
    75% { opacity: 0.3; box-shadow: 0 -3px 6px rgba(249, 115, 22, 0.15), 0 3px 6px rgba(249, 115, 22, 0.15); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(249, 115, 22, 0.5), 0 7px 12px rgba(249, 115, 22, 0.5); }
  }
  .animate-neon-flicker-orange { animation: neon-flicker-orange 0.15s ease-in-out; }

  @keyframes neon-flicker-cyan {
    0% { opacity: 1; box-shadow: 0 -7px 12px rgba(6, 182, 212, 0.5), 0 7px 12px rgba(6, 182, 212, 0.5); }
    25% { opacity: 0.4; box-shadow: 0 -4px 8px rgba(6, 182, 212, 0.2), 0 4px 8px rgba(6, 182, 212, 0.2); }
    50% { opacity: 0.9; box-shadow: 0 -6px 10px rgba(6, 182, 212, 0.4), 0 6px 10px rgba(6, 182, 212, 0.4); }
    75% { opacity: 0.3; box-shadow: 0 -3px 6px rgba(6, 182, 212, 0.15), 0 3px 6px rgba(6, 182, 212, 0.15); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(6, 182, 212, 0.5), 0 7px 12px rgba(6, 182, 212, 0.5); }
  }
  .animate-neon-flicker-cyan { animation: neon-flicker-cyan 0.15s ease-in-out; }

  @keyframes neon-flicker-lime {
    0% { opacity: 1; box-shadow: 0 0 12px rgba(140, 255, 0, 0.5), 0 0 24px rgba(140, 255, 0, 0.25); }
    25% { opacity: 0.4; box-shadow: 0 0 6px rgba(140, 255, 0, 0.2), 0 0 12px rgba(140, 255, 0, 0.1); }
    50% { opacity: 0.9; box-shadow: 0 0 10px rgba(140, 255, 0, 0.4), 0 0 20px rgba(140, 255, 0, 0.2); }
    75% { opacity: 0.3; box-shadow: 0 0 5px rgba(140, 255, 0, 0.15), 0 0 10px rgba(140, 255, 0, 0.08); }
    100% { opacity: 1; box-shadow: 0 0 12px rgba(140, 255, 0, 0.5), 0 0 24px rgba(140, 255, 0, 0.25); }
  }
  .animate-neon-flicker-lime { animation: neon-flicker-lime 0.15s ease-in-out; }

  @keyframes neon-cyan-to-pink {
    0% { 
      opacity: 0.3;
      background: rgb(6, 182, 212); 
      box-shadow: 0 -4px 8px rgba(6, 182, 212, 0.2), 0 4px 8px rgba(6, 182, 212, 0.2); 
    }
    15% { 
      opacity: 1;
      background: rgb(6, 182, 212); 
      box-shadow: 0 -7px 15px rgba(6, 182, 212, 0.8), 0 7px 15px rgba(6, 182, 212, 0.8); 
    }
    25% { 
      opacity: 0.4;
      background: rgb(80, 150, 190); 
      box-shadow: 0 -5px 10px rgba(80, 150, 190, 0.3), 0 5px 10px rgba(80, 150, 190, 0.3); 
    }
    40% { 
      opacity: 1;
      background: rgb(150, 110, 170); 
      box-shadow: 0 -8px 18px rgba(150, 110, 170, 0.9), 0 8px 18px rgba(150, 110, 170, 0.9); 
    }
    55% { 
      opacity: 0.7;
      background: rgb(200, 90, 160); 
      box-shadow: 0 -6px 12px rgba(200, 90, 160, 0.5), 0 6px 12px rgba(200, 90, 160, 0.5); 
    }
    70% { 
      opacity: 1;
      background: rgb(230, 80, 155); 
      box-shadow: 0 -7px 14px rgba(230, 80, 155, 0.7), 0 7px 14px rgba(230, 80, 155, 0.7); 
    }
    100% { 
      opacity: 1;
      background: #ec4899; 
      box-shadow: 0 -7px 12px rgba(236, 72, 153, 0.5), 0 7px 12px rgba(236, 72, 153, 0.5); 
    }
  }
  .animate-neon-cyan-to-pink { animation: neon-cyan-to-pink 0.4s ease-out forwards; }
  
  @keyframes search-overlay-in {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(0%); }
  }
  
  @keyframes search-overlay-out {
    0% { transform: translateY(0%); }
    100% { transform: translateY(-100%); }
  }
  
  @keyframes search-fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  @keyframes threshold-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.7; }
  }
  
  .threshold-reached {
    animation: threshold-pulse 0.3s ease-in-out infinite;
  }

  @keyframes hint-left {
    0%, 100% { transform: translateX(0); opacity: 0.4; }
    50% { transform: translateX(-3px); opacity: 0.7; }
  }

  @keyframes hint-right {
    0%, 100% { transform: translateX(0); opacity: 0.4; }
    50% { transform: translateX(3px); opacity: 0.7; }
  }

  .swipe-hint-left {
    animation: hint-left 2s ease-in-out infinite;
  }

  .swipe-hint-right {
    animation: hint-right 2s ease-in-out infinite;
  }

  @keyframes handle-pulse {
    0%, 100% { opacity: 0.5; transform: scaleX(1); }
    50% { opacity: 0.8; transform: scaleX(1.1); }
  }

  .handle-pulse {
    animation: handle-pulse 2s ease-in-out infinite;
  }

  
  @keyframes search-fade-out {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
`;

// Composant pour les boutons de la barre d'import
const ImportButton = ({ 
  type, // 'folder' | 'dropbox' | 'nuke'
  ready, // importButtonsReady
  children,
  className = '',
  style = {}
}) => {
  const [phase, setPhase] = useState('off'); // 'off' | 'igniting' | 'on'
  const [isFlickering, setIsFlickering] = useState(false);
  const flickerTimeoutRef = useRef(null);
  
  // Couleurs selon le type
  const colors = {
    folder: { bg: CONFIG.IMPORT_FOLDER_COLOR, glow: `rgba(${CONFIG.IMPORT_FOLDER_GLOW_RGB}, 0.6)` },
    dropbox: { bg: CONFIG.IMPORT_DROPBOX_COLOR, glow: `rgba(${CONFIG.IMPORT_DROPBOX_GLOW_RGB}, 0.6)` },
    nuke: { bg: CONFIG.IMPORT_NUKE_COLOR, glow: `rgba(${CONFIG.IMPORT_NUKE_GLOW_RGB}, 0.6)` }
  };
  
  // Classe d'animation flicker selon le type
  const flickerClass = {
    folder: 'animate-flicker-1',
    dropbox: 'animate-flicker-2',
    nuke: 'animate-flicker-3'
  };
  
  // Durée de l'animation flicker selon le type (delay + durée)
  const flickerDuration = {
    folder: 0 + 500,      // delay 0ms + 0.5s
    dropbox: 80 + 400,    // delay 80ms + 0.4s
    nuke: 160 + 600       // delay 160ms + 0.6s
  };
  
  // Glow rest selon le type
  const glowRest = {
    folder: '8px',
    dropbox: '8px',
    nuke: '12px'
  };
  
  // Quand ready passe à true, lancer l'animation d'allumage
  useEffect(() => {
    if (ready && phase === 'off') {
      setPhase('igniting');
      // Après la durée de l'animation, passer en mode "on"
      const timer = setTimeout(() => {
        setPhase('on');
      }, flickerDuration[type]);
      return () => clearTimeout(timer);
    }
    if (!ready) {
      setPhase('off');
    }
  }, [ready]);
  
  // Sautillements aléatoires en phase "on"
  useEffect(() => {
    if (phase !== 'on') return;
    
    const scheduleNextFlicker = () => {
      const delay = CONFIG.NEON_GLOW_FLICKER_MIN_DELAY + 
        Math.random() * (CONFIG.NEON_GLOW_FLICKER_MAX_DELAY - CONFIG.NEON_GLOW_FLICKER_MIN_DELAY);
      
      flickerTimeoutRef.current = setTimeout(() => {
        setIsFlickering(true);
        setTimeout(() => {
          setIsFlickering(false);
          scheduleNextFlicker();
        }, 100); // durée du sautillement
      }, delay);
    };
    
    scheduleNextFlicker();
    
    return () => {
      if (flickerTimeoutRef.current) {
        clearTimeout(flickerTimeoutRef.current);
      }
    };
  }, [phase]);
  
  // Construire les styles
  const isOn = phase === 'igniting' || phase === 'on';
  const bgColor = isOn ? colors[type].bg : '#e5e7eb';
  
  let animClass = '';
  if (phase === 'igniting') {
    animClass = flickerClass[type];
  } else if (phase === 'on') {
    animClass = isFlickering ? 'animate-import-flicker-once' : 'animate-import-pulse';
  }
  
  return (
    <div 
      className={`${className} ${animClass}`}
      style={{
        ...style,
        background: bgColor,
        '--glow-color': colors[type].glow,
        '--glow-rest': glowRest[type],
        '--glow-intensity': type === 'nuke' ? 2 : 1
      }}
    >
      {children}
    </div>
  );
};

// --- NEON GLOW WRAPPER (Composant réutilisable) ---
const NeonGlow = ({ 
  children, 
  color = '236, 72, 153',  // RGB rose par défaut
  colorName = 'pink',      // Nom de la couleur pour les animations (pink, green, orange, cyan, lime)
  glowRGB = null,          // RGB pour le glow dynamique (ex: '236, 72, 153')
  enabled = true,
  igniteOnMount = true,
  flickerEnabled = true,
  className = '',
  style = {},
  glowOpacity = 1,         // Opacité du glow (0-1), permet les transitions progressives
  transitionDuration = 0   // Durée de la transition d'opacité (ms)
}) => {
  const [isIgniting, setIsIgniting] = useState(igniteOnMount);
  const [isFlickering, setIsFlickering] = useState(false);
  const flickerTimeoutRef = useRef(null);
  
  // Animation d'allumage au montage
  useEffect(() => {
      if (igniteOnMount) {
          const timer = setTimeout(() => setIsIgniting(false), CONFIG.NEON_GLOW_IGNITE_DURATION);
          return () => clearTimeout(timer);
      }
  }, []);
  
  // Flickers aléatoires
  useEffect(() => {
      if (!enabled || !flickerEnabled) return;
      
      const scheduleNextFlicker = () => {
          const delay = CONFIG.NEON_GLOW_FLICKER_MIN_DELAY + 
              Math.random() * (CONFIG.NEON_GLOW_FLICKER_MAX_DELAY - CONFIG.NEON_GLOW_FLICKER_MIN_DELAY);
          
          flickerTimeoutRef.current = setTimeout(() => {
              setIsFlickering(true);
              setTimeout(() => {
                  setIsFlickering(false);
                  scheduleNextFlicker();
              }, CONFIG.NEON_GLOW_FLICKER_DURATION);
          }, delay);
      };
      
      scheduleNextFlicker();
      
      return () => {
          if (flickerTimeoutRef.current) {
              clearTimeout(flickerTimeoutRef.current);
          }
      };
  }, [enabled, flickerEnabled]);
  
  if (!enabled) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  
  let dynamicStyle = { ...style };
  
  // Si glowRGB fourni et pas en train d'ignite, ajouter le glow dynamique
  if (glowRGB && !isIgniting) {
    dynamicStyle.boxShadow = `0 -${CONFIG.SORTBTN_GLOW_VERTICAL}px ${CONFIG.SORTBTN_GLOW_BLUR}px rgba(${glowRGB}, ${CONFIG.SORTBTN_GLOW_OPACITY}), 0 ${CONFIG.SORTBTN_GLOW_VERTICAL}px ${CONFIG.SORTBTN_GLOW_BLUR}px rgba(${glowRGB}, ${CONFIG.SORTBTN_GLOW_OPACITY})`;
}
  
  // Si flicker, réduire l'opacité
  if (isFlickering) {
      dynamicStyle.opacity = CONFIG.NEON_GLOW_FLICKER_MIN_OPACITY;
      dynamicStyle.transition = `opacity ${CONFIG.NEON_GLOW_FLICKER_DURATION / 2}ms ease-in-out`;
  }
  
  let animationClass = '';
  if (isIgniting) {
      animationClass = `animate-neon-ignite-${colorName}`;
  } else if (isFlickering) {
      animationClass = `animate-neon-flicker-${colorName}`;
  } else {
      animationClass = `animate-neon-breathe-${colorName}`;
  }
  
  // Appliquer l'opacité avec transition
  const finalStyle = {
    ...dynamicStyle,
    opacity: glowOpacity * (isFlickering ? CONFIG.NEON_GLOW_FLICKER_MIN_OPACITY : 1),
    transition: transitionDuration > 0 
      ? `opacity ${transitionDuration}ms ease-out` 
      : (isFlickering ? `opacity ${CONFIG.NEON_GLOW_FLICKER_DURATION / 2}ms ease-in-out` : undefined)
  };

  return (
    <div className={`${className} ${animationClass}`} style={finalStyle}>
        {children}
    </div>
);
};

// --- 2. ASSETS & UI ATOMS ---
// Logo "Vibes"
const VibesLogo = ({ size = 40 }) => <VibesLogoVector size={size * 3} />;

const VibingTitle = ({ size = 24 }) => (
    <div className="flex items-center justify-center">
        <VibingLogoVector size={size * 5} />
    </div>
);

// ========== LES 20 DÉGRADÉS FIXES ==========
// Bicolores : [couleur1, couleur2] - Le code gère automatiquement 2, 3 ou + couleurs
// L'ordre est fixe et le cycle revient au début après le dernier
const ALL_GRADIENTS = [
    // ===== BICOLORES =====
    // 1. Miami Vice
    ['#f472b6', '#fb923c'],
    // 2. Lava Flow
    ['#f43f5e', '#b91c1c'],
    // 3. Afterburner
    ['#facc15', '#ef4444'],
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
    // ===== TRICOLORES =====
    // 11. Solar Flare
    ['#facc15', '#f97316', '#dc2626'],
    // 12. Cosmic Twilight
    ['#ec4899', '#9333ea', '#3730a3'],
    // 13. Jungle Rave
    ['#a3e635', '#22c55e', '#0d9488'],
    // 14. Electric Lagoon
    ['#01ffe5', '#57a9ed', '#a855f7'],
    // 15. Synthwave Dream
    ['#c026d3', '#7e22ce', '#fb923c'],
    // 16. Aurora Borealis
    ['#0f766e', '#06b6d4', '#c084fc'],
    // 17. Fuchsia Sunrise
    ['#ec4899', '#d946ef', '#f97316'],
    // 18. Neo-Tokyo Nights
    ['#3b82f6', '#d946ef', '#f97316'],
    // 19. Circuit Grid
    ['#7e22ce', '#22d3ee', '#84cc16'],
    // ===== 5-COLORS =====
    // 20. Dawn Sky
    ['#1e3a8a', '#60a5fa', '#f9a8d4', '#fde047', '#fed7aa'],
];

// Noms des dégradés (même ordre que ALL_GRADIENTS)
const GRADIENT_NAMES = [
    'Miami Vice',
    'Lava Flow',
    'Afterburner',
    'Glitch City',
    'Galactic Haze',
    'Arcade Glow',
    'Radioactive Pulse',
    'Overload',
    'Bio-Luminescence',
    '8-bit Dream',
    'Solar Flare',
    'Cosmic Twilight',
    'Jungle Rave',
    'Electric Lagoon',
    'Synthwave Dream',
    'Aurora Borealis',
    'Fuchsia Sunrise',
    'Neo-Tokyo Nights',
    'Circuit Grid',
    'Dawn Sky',
];

const getGradientByIndex = (index) => {
    // Cycle entre 0 et 18 (19 dégradés)
    const safeIndex = ((index % ALL_GRADIENTS.length) + ALL_GRADIENTS.length) % ALL_GRADIENTS.length;
    return ALL_GRADIENTS[safeIndex];
};

const getGradientName = (index) => {
    const safeIndex = ((index % GRADIENT_NAMES.length) + GRADIENT_NAMES.length) % GRADIENT_NAMES.length;
    return GRADIENT_NAMES[safeIndex];
};

// Compteur d'utilisation des dégradés (sera mis à jour par App)
let gradientUsageCount = new Array(ALL_GRADIENTS.length).fill(0);

const getNextAvailableGradientIndex = () => {
    // Trouver le minimum d'utilisations
    const minUsage = Math.min(...gradientUsageCount);
    // Filtrer les indices qui ont ce minimum
    const availableIndices = gradientUsageCount
        .map((count, index) => ({ count, index }))
        .filter(item => item.count === minUsage)
        .map(item => item.index);
    // Choisir aléatoirement parmi les disponibles
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    // Incrémenter le compteur
    gradientUsageCount[randomIndex]++;
    return randomIndex;
};

const initializeGradientUsage = (playlists) => {
    // Réinitialiser le compteur
    gradientUsageCount = new Array(ALL_GRADIENTS.length).fill(0);
    // Compter les utilisations actuelles
    if (playlists) {
        Object.keys(playlists).forEach(name => {
            const index = playlists[name]?.[0]?.gradientIndex;
            if (index !== undefined && index >= 0 && index < gradientUsageCount.length) {
                gradientUsageCount[index]++;
            }
        });
    }
};

const getInitialGradientIndex = (folderName) => {
    const hash = folderName.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    return Math.abs(hash) % ALL_GRADIENTS.length;
};

const generateVibeColors = (seed) => {
    const gradientColors = getGradientByIndex(getInitialGradientIndex(seed));
    
    // Convertir hex en rgba
    const hexToRgba = (hex, opacity) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
    
    // Génère le gradient dynamiquement selon le nombre de couleurs
    const colors = gradientColors.map(c => hexToRgba(c, CONFIG.GRADIENT_OPACITY));
    const step = 100 / (colors.length - 1);
    const stops = colors.map((c, i) => `${c} ${Math.round(i * step)}%`).join(', ');
    return `linear-gradient(135deg, ${stops})`;
};

const VibeCard = ({ folderName, availableCount, unavailableCount, isVibe, onClick, isExpired, onReimport, colorIndex, onColorChange, onSwipeProgress, isBlinking, onBlinkComplete, onNameEdit, isEditingName, editedName, onEditedNameChange, onConfirmNameChange, animationIndex = 0, animationKey = 0, animationDelay = 0 }) => {
    const gradientColors = getGradientByIndex(colorIndex !== undefined ? colorIndex : getInitialGradientIndex(folderName));
    const step = 100 / (gradientColors.length - 1);
    const baseGradient = `linear-gradient(135deg, ${gradientColors.map((c, i) => `${c} ${Math.round(i * step)}%`).join(', ')})`;

    const [touchStartX, setTouchStartX] = useState(null);
    const [touchStartY, setTouchStartY] = useState(null);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [swipeDirection, setSwipeDirection] = useState(null); // 'horizontal', 'vertical', ou null
    
    // Animation d'entrée stagger
    const [hasAnimated, setHasAnimated] = useState(false);
    const prevAnimKeyRef = useRef(animationKey);
    
    useEffect(() => {
        // Reset l'animation quand animationKey change
        if (animationKey !== prevAnimKeyRef.current) {
            setHasAnimated(false);
            prevAnimKeyRef.current = animationKey;
        }
        // Déclencher l'animation avec délai initial + délai stagger
        const timer = setTimeout(() => {
            setHasAnimated(true);
        }, animationDelay + animationIndex * CONFIG.VIBECARD_STAGGER_DELAY);
        return () => clearTimeout(timer);
    }, [animationKey, animationIndex, animationDelay]);
    
    const handleTouchStart = (e) => {
        if (!e.touches || !e.touches[0]) return;
        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
        setSwipeDirection(null);
    };
    
    const handleTouchMove = (e) => {
        if (touchStartX === null || touchStartY === null) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const diffX = clientX - touchStartX;
        const diffY = clientY - touchStartY;
        
        // Déterminer la direction au premier mouvement significatif
        if (swipeDirection === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
                setSwipeDirection('horizontal');
            } else {
                setSwipeDirection('vertical');
            }
        }
        
        // Si c'est un swipe vertical, on ignore (laisser le scroll se faire)
        if (swipeDirection === 'vertical') return;
        
        // Si direction pas encore déterminée ou si c'est horizontal, on gère le swipe couleur
        if (swipeDirection === 'horizontal') {
            if (Math.abs(diffX) < CONFIG.MAX_SWIPE_DISTANCE) {
                setSwipeOffset(diffX);
                
                if (Math.abs(diffX) > 10 && onSwipeProgress) {
                    const direction = diffX > 0 ? 1 : -1;
                    
                    // Calculer combien de couleurs on a parcouru (0 à 19)
                    const colorsTraversed = Math.floor((Math.abs(diffX) / CONFIG.MAX_SWIPE_DISTANCE) * 20);
                    const currentIdx = colorIndex !== undefined ? colorIndex : getInitialGradientIndex(folderName);
                    const previewIdx = currentIdx + (direction * colorsTraversed);
                    const previewGradient = getGradientByIndex(previewIdx);
                    
                    // Progress pour l'opacité (0 à 1)
                    const progress = Math.min(Math.abs(diffX) / 50, 1);
                    
                    onSwipeProgress({ direction, progress, nextGradient: previewGradient, colorsTraversed, previewIndex: ((previewIdx % 20) + 20) % 20 });
                }
            }
        }
    };
        
    const handleTouchEnd = () => {
        // Ne changer la couleur que si c'était un swipe horizontal
        const colorsTraversed = Math.floor((Math.abs(swipeOffset) / CONFIG.MAX_SWIPE_DISTANCE) * 20);
        if (swipeDirection === 'horizontal' && colorsTraversed >= 1) {
            const direction = swipeOffset > 0 ? 1 : -1;
            if (onColorChange) onColorChange(direction * colorsTraversed);
        }
        setSwipeOffset(0);
        setTouchStartX(null);
        setTouchStartY(null);
        setSwipeDirection(null);
        
        if (onSwipeProgress) onSwipeProgress(null);
    };

    let IconComponent;
    if (isExpired) {
        IconComponent = CloudDownload;
    } else if (isVibe) {
        IconComponent = ListMusic;
    } else {
        IconComponent = Folder;
    }
    
    const handleClick = () => {
        if (isExpired && onReimport) {
            onReimport();
        } else {
            onClick();
        }
    };
    
// ========== LAYOUT BANDE HORIZONTALE ==========
return (
  <FeedbackCardOverlay isActive={isBlinking} onAnimationComplete={onBlinkComplete}>
      <div
          onClick={() => { if (Math.abs(swipeOffset) < 10) handleClick(); }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}

          // Événements de souris
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          
          className="w-full rounded-xl px-4 py-3 flex items-end justify-between shadow-lg cursor-pointer relative overflow-hidden"
          style={{ 
            height: `${CONFIG.VIBECARD_HEIGHT_VH}vh`,
            background: baseGradient,
            isolation: 'isolate',
              transform: hasAnimated 
                  ? `translateX(${swipeOffset * 0.8}px)` 
                  : `translateX(-${CONFIG.VIBECARD_SLIDE_DISTANCE}px)`,
              opacity: hasAnimated ? 1 : 0,
              transition: hasAnimated 
                  ? (swipeOffset === 0 ? 'transform 0.2s ease-out, opacity 0.2s ease-out' : 'none')
                  : `transform ${CONFIG.VIBECARD_SLIDE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${CONFIG.VIBECARD_SLIDE_DURATION}ms ease-out`
          }}
      >
          {/* Overlay de transparence progressif (proportionnel aux morceaux indisponibles) */}
          {unavailableCount > 0 && (() => {
              const ratio = (availableCount / (availableCount + unavailableCount)) * 100;
              const fadeWidth = CONFIG.VIBECARD_OPACITY_GRADIENT_WIDTH;
              const maxOpacity = 1 - CONFIG.VIBECARD_MIN_OPACITY;
              
              // Si aucun morceau dispo, opacité uniforme sur toute la carte
              if (availableCount === 0) {
                  return (
                      <div 
                          className="absolute inset-0 pointer-events-none rounded-xl"
                          style={{ backgroundColor: `rgba(255,255,255,${maxOpacity})` }}
                      />
                  );
              }
              
              return (
                  <div 
                      className="absolute inset-0 pointer-events-none rounded-xl"
                      style={{
                          background: `linear-gradient(to right, 
                              rgba(255,255,255,0) 0%, 
                              rgba(255,255,255,0) ${ratio}%, 
                              rgba(255,255,255,${maxOpacity * 0.5}) ${ratio + fadeWidth * 0.3}%, 
                              rgba(255,255,255,${maxOpacity * 0.8}) ${ratio + fadeWidth * 0.5}%, 
                              rgba(255,255,255,${maxOpacity * 0.95}) ${ratio + fadeWidth * 0.8}%,
                              rgba(255,255,255,${maxOpacity}) ${ratio + fadeWidth}%, 
                              rgba(255,255,255,${maxOpacity}) 100%)`
                      }}
                  />
              );
          })()}

          {/* Icône en haut à droite */}
          <div className="absolute top-3 right-3">
              <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-[2px] flex items-center justify-center text-white shadow-inner">
              <IconComponent style={{ width: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)`, height: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)` }} />
              </div>
          </div>

          {/* Capsule Liquid Glass en bas à gauche */}
          <div 
                className={`relative z-10 rounded-full border flex items-baseline gap-2 ${isEditingName ? 'border-white/40' : 'border-white/20'}`}
                style={{ 
                  padding: `${CONFIG.VIBECARD_CAPSULE_PY}rem ${CONFIG.VIBECARD_CAPSULE_PX}rem`,
                  maxWidth: `calc(100% - ${CONFIG.VIBECARD_CAPSULE_RIGHT_MARGIN}rem - 2.75rem)`,
                  background: isEditingName ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)',
                    transition: 'background 0.2s, border-color 0.2s'
                }}
                onClick={(e) => {
                    if (onNameEdit && !isEditingName) {
                        e.stopPropagation();
                        onNameEdit();
                    }
                }}
            >
                <div key={isEditingName ? 'editing' : 'display'} className="overflow-hidden" style={{ maxWidth: `${CONFIG.VIBECARD_CAPSULE_NAME_MAX_WIDTH}rem`, height: `${CONFIG.VIBECARD_CAPSULE_FONT_SIZE * 1.25}rem` }}>
                {isEditingName ? (
                        <input
                        type="text"
                        value={editedName}
                        onChange={(e) => onEditedNameChange(e.target.value)}
                        onBlur={onConfirmNameChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onConfirmNameChange();
                            if (e.key === 'Escape') onConfirmNameChange();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="font-black text-white bg-transparent border-none outline-none whitespace-nowrap"
                        style={{ 
                            fontSize: `${CONFIG.VIBECARD_CAPSULE_FONT_SIZE}rem`, 
                            lineHeight: 1.25,
                            width: `${Math.max(editedName.length, 1) * 0.65 + 0.5}rem`,
                            paddingLeft: '0.25rem',
                            paddingRight: '0.25rem',
                            marginLeft: '-0.25rem',
                            marginRight: '-0.25rem'
                        }}
                    />
                  ) : (
                    <MarqueeText 
                        text={folderName}
                        className="font-black leading-tight text-white"
                        style={{ 
                            fontSize: `${CONFIG.VIBECARD_CAPSULE_FONT_SIZE}rem`
                        }}
                    />
                  )}
                </div>
                <span 
                    className="text-[10px] font-semibold text-white/90 flex items-center gap-1.5 flex-shrink-0"
                >
                    <span className="flex items-center gap-0.5"><CheckCircle2 size={10} />{availableCount}</span>
                    {unavailableCount > 0 && <span className="flex items-center gap-0.5 opacity-60"><Ghost size={10} />{unavailableCount}</span>}
                </span>
                </div>
        </div>
    </FeedbackCardOverlay>
    );
};

const MarqueeText = ({ text, className, style }) => {
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  
  useEffect(() => {
      const checkOverflow = () => {
          if (textRef.current) {
              setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
          }
      };
      checkOverflow();
      window.addEventListener('resize', checkOverflow);
      return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);
  
  const calculatedDuration = text.length / CONFIG.MARQUEE_CHARS_PER_SECOND;
  const duration = Math.max(calculatedDuration, CONFIG.MARQUEE_MIN_DURATION);
  
  if (isOverflowing) {
      return (
          <h3 
              className={`whitespace-nowrap animate-marquee ${className}`}
              style={{ 
                  ...style,
                  '--marquee-duration': `${duration}s`
              }}
          >
              {text}
          </h3>
      );
  }
  
  return (
      <h3 
          ref={textRef}
          className={`whitespace-nowrap ${className}`}
          style={style}
      >
          {text}
      </h3>
  );
};

const ScrollingText = ({ text, isCenter, className, style }) => {
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  
  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);
  
  if (isCenter && isOverflowing) {
    return (
      <div className="w-full overflow-hidden">
         <div className={`whitespace-nowrap ${className} animate-marquee`} style={style}>
           {text} <span className="opacity-0">___</span> {text}
         </div>
      </div>
    );
  }
  
  return (
    <span 
      ref={textRef} 
      className={`whitespace-nowrap text-center w-full ${className}`} 
      style={{...style, overflow: 'hidden', textOverflow: 'ellipsis'}}
    >
      {text}
    </span>
  );
};

  const SkipButton = ({ direction, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-center text-gray-400 rounded-full"
        style={{ width: `${CONFIG.TC_SKIP_BUTTON_SIZE}rem`, height: `${CONFIG.TC_SKIP_BUTTON_SIZE}rem`, WebkitTapHighlightColor: 'transparent' }}
    >
        <div className="relative" style={{ width: `${CONFIG.TC_SKIP_ICON_SIZE}rem`, height: `${CONFIG.TC_SKIP_ICON_SIZE}rem` }}>
            {direction === 'back'
                ? <RotateCcw style={{ width: '100%', height: '100%' }} strokeWidth={1.5} />
                : <RotateCw style={{ width: '100%', height: '100%' }} strokeWidth={1.5} />
            }
            <span
                className="absolute inset-0 flex items-center justify-center font-bold"
                style={{ fontSize: `${CONFIG.TC_SKIP_LABEL_SIZE}rem` }}
            >10</span>
        </div>
    </button>
);

const RecenterCapsule = ({ onClick }) => (
  <button
      onClick={onClick}
      className={`bg-gray-50 rounded-full flex-shrink-0 flex items-center justify-between px-1 shadow-sm transition-all hover:bg-gray-100 overflow-hidden ${CONFIG.RECENTER_GLOW_ENABLED ? 'recenter-glow' : ''}`}
      style={{
        height: UNIFIED_CONFIG.FOOTER_BTN_HEIGHT,
        width: UNIFIED_CONFIG.FOOTER_BTN_HEIGHT * 1.6,
        border: CONFIG.RECENTER_NEON_ENABLED
            ? `${CONFIG.RECENTER_NEON_WIDTH}px solid ${CONFIG.RECENTER_NEON_COLOR}`
            : '1px solid rgb(229, 231, 235)'
    }}
  >
      <div className="w-4 h-full flex justify-center items-center text-gray-400"><SkipBack size={10} fill="currentColor" /></div>
      <div className="w-px h-full bg-gray-200"></div>
      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 px-1">
          <div className="w-4 h-0.5 bg-gray-800 rounded-full"></div>
          <div className="w-3 h-0.5 bg-pink-400 rounded-full"></div>
      </div>
      <div className="w-px h-full bg-gray-200"></div>
      <div className="w-4 h-full flex justify-center items-center text-gray-400"><SkipForward size={10} fill="currentColor" /></div>
  </button>
);

// Barre de contrôle unifiée (TimeCapsule + RecenterCapsule + Volume)
const ControlBar = ({
  // TimeCapsule props
  currentTime, duration, onSeek, onSkipBack, onSkipForward, confirmMode, confirmType, vibeSwipePreview,
  // RecenterCapsule props
  onRecenter,
  // Volume props
  volume, onVolumeTouchStart, onVolumeTouchMove, onVolumeTouchEnd,
  // Overlay props
  isVolumeActive, mainContainerRef, volumeMorphProgress, volumePreview, beaconNeonRef, capsuleHeightVh, volumeBeaconRect
}) => {
    return (
        <div
            className="absolute left-0 right-0 flex items-start"
            style={{
                top: UNIFIED_CONFIG.FOOTER_PADDING_TOP,
                padding: `0 ${CONFIG.CONTROL_BAR_SPACING_PERCENT / 4}%`,
                gap: `${CONFIG.CONTROL_BAR_SPACING_PERCENT / 4}%`
            }}
        >
            <TimeCapsule 
                currentTime={currentTime} 
                duration={duration} 
                onSeek={onSeek} 
                onSkipBack={onSkipBack} 
                onSkipForward={onSkipForward} 
                isMini={true} 
                isLive={true} 
                confirmMode={confirmMode}
                confirmType={confirmType}
                vibeSwipePreview={vibeSwipePreview}
            />
            {!vibeSwipePreview && (
                <>
                    <RecenterCapsule onClick={onRecenter} />
                    <div
                        className={`bg-gray-50 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm transition-all hover:bg-gray-100 ${CONFIG.VOLUME_GLOW_ENABLED ? 'volume-glow' : ''}`}
                        style={{
                          height: UNIFIED_CONFIG.FOOTER_BTN_HEIGHT,
                          width: UNIFIED_CONFIG.FOOTER_BTN_HEIGHT,
                          border: CONFIG.VOLUME_NEON_ENABLED
                              ? `${CONFIG.VOLUME_NEON_WIDTH}px solid ${CONFIG.VOLUME_NEON_COLOR}`
                              : '1px solid rgb(229, 231, 235)'
                      }}
                        onTouchStart={onVolumeTouchStart}
                        onTouchMove={onVolumeTouchMove}
                        onTouchEnd={onVolumeTouchEnd}
                    >
                        {volume === 0 ? <VolumeX size={20} className="text-gray-400" /> : <Volume2 size={20} className="text-gray-400" />}
                    </div>
                    
                    {/* OVERLAY VOLUME SLIDER */}
                    {isVolumeActive && ReactDOM.createPortal((() => {
                        // Dimensions du tube : centré sur l'écran
                        const tubeHeight = window.innerHeight * CONFIG.VOLUME_BAR_HEIGHT_PERCENT / 100;
                        const tubeWidth = window.innerWidth * CONFIG.VOLUME_BAR_WIDTH_PERCENT / 100;
                        const tubeTop = (window.innerHeight - tubeHeight) / 2;
                        const tubeLeft = (window.innerWidth - tubeWidth) / 2;

                        // Coordonnées du beacon (point de départ du morph)
                        const beaconHeight = volumeBeaconRect ? volumeBeaconRect.height : window.innerHeight * capsuleHeightVh / 100;
                        const beaconWidth = volumeBeaconRect ? volumeBeaconRect.width : window.innerWidth * CONFIG.CAPSULE_WIDTH_PERCENT / 100;
                        const beaconTop = volumeBeaconRect ? volumeBeaconRect.top : (window.innerHeight - beaconHeight) / 2;
                        const beaconLeft = volumeBeaconRect ? volumeBeaconRect.left : (window.innerWidth - beaconWidth) / 2;
                        
                        const p = volumeMorphProgress;
                        const currentWidth = beaconWidth + (tubeWidth - beaconWidth) * p;
                        const currentHeight = beaconHeight + (tubeHeight - beaconHeight) * p;
                        const currentTop = beaconTop + (tubeTop - beaconTop) * p;
                        const currentLeft = beaconLeft + (tubeLeft - beaconLeft) * p;
                        const currentRadius = Math.min(currentWidth, currentHeight) / 2;
                        
                        const fillHeight = 100 - (100 - volumePreview) * p;
                        const thumbY = tubeTop + tubeHeight * (1 - volumePreview / 100);
                        
                        return (
                            <div
                                className="z-[100] flex items-center justify-center"
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: `rgba(0, 0, 0, ${CONFIG.VOLUME_OVERLAY_OPACITY * volumeMorphProgress})`,
                                    transition: `background-color ${CONFIG.VOLUME_MORPH_DURATION}ms ${CONFIG.VOLUME_OVERLAY_EASING}`,
                                }}
                                onTouchMove={onVolumeTouchMove}
                                onTouchEnd={onVolumeTouchEnd}
                                >
                                <div
                                    className={`absolute overflow-hidden ${CONFIG.VOLUME_TUBE_IGNITE_ENABLED ? 'animate-neon-ignite-yellow' : ''}`}
                                    style={{
                                        left: currentLeft,
                                        top: currentTop,
                                        width: currentWidth,
                                        height: currentHeight,
                                        backgroundColor: CONFIG.VOLUME_TUBE_BG_COLOR,
                                        borderRadius: currentRadius,
                                        border: CONFIG.VOLUME_TUBE_BORDER_ENABLED 
                                            ? `${CONFIG.VOLUME_TUBE_BORDER_WIDTH}px solid ${CONFIG.VOLUME_TUBE_BORDER_COLOR}` 
                                            : 'none',
                                        boxShadow: CONFIG.VOLUME_TUBE_GLOW_ENABLED 
                                            ? `0 0 ${CONFIG.VOLUME_TUBE_GLOW_SIZE}px ${CONFIG.VOLUME_TUBE_GLOW_COLOR}` 
                                            : 'none',
                                        transition: `left ${CONFIG.VOLUME_MORPH_DURATION}ms ${CONFIG.VOLUME_MORPH_EASING}, top ${CONFIG.VOLUME_MORPH_DURATION}ms ${CONFIG.VOLUME_MORPH_EASING}, width ${CONFIG.VOLUME_MORPH_DURATION}ms ${CONFIG.VOLUME_MORPH_EASING}, height ${CONFIG.VOLUME_MORPH_DURATION}ms ${CONFIG.VOLUME_MORPH_EASING}, border-radius ${CONFIG.VOLUME_MORPH_DURATION}ms ${CONFIG.VOLUME_MORPH_EASING}`,
                                    }}
                                >
                                    {/* Masque cylindre sur le tube de fond */}
                                    {CONFIG.VOLUME_CYLINDER_ENABLED && (
                                        <div 
                                            className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex flex-row" 
                                            style={{ 
                                                borderRadius: currentRadius,
                                                opacity: volumeMorphProgress,
                                                transition: `opacity ${CONFIG.VOLUME_CYLINDER_FADE_DURATION}ms ease-out`,
                                            }}
                                        >
                                            {CONFIG.VOLUME_CYLINDER_SLICES.map((opacity, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 h-full"
                                                    style={{
                                                        backgroundColor: opacity > 0 
                                                            ? `rgba(255, 255, 255, ${opacity * CONFIG.VOLUME_CYLINDER_INTENSITY})` 
                                                            : opacity < 0 
                                                                ? `rgba(0, 0, 0, ${Math.abs(opacity) * CONFIG.VOLUME_CYLINDER_INTENSITY})`
                                                                : 'transparent'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <div
                                        className={`absolute left-0 right-0 bottom-0 ${CONFIG.VOLUME_FILL_IGNITE_ENABLED ? 'animate-neon-ignite-cyan' : ''}`}
                                        style={{
                                            height: '100%',
                                            backgroundColor: CONFIG.VOLUME_FILL_COLOR,
                                            boxShadow: `0 0 ${CONFIG.VOLUME_FILL_GLOW_SIZE}px ${CONFIG.VOLUME_FILL_GLOW_COLOR}`,
                                            borderRadius: currentRadius,
                                            transformOrigin: 'bottom',
                                            transform: `scaleY(${(volumeMorphProgress < 1 ? fillHeight : volumePreview) / 100}) translateZ(0)`,
                                            transition: volumeMorphProgress < 1 ? `transform ${CONFIG.VOLUME_MORPH_DURATION}ms ${CONFIG.VOLUME_MORPH_EASING}` : 'none',
                                            willChange: 'transform',
                                        }}
                                    >
                                        {/* Masque cylindre sur le tube cyan */}
                                        {CONFIG.VOLUME_CYLINDER_ENABLED && (
                                            <div 
                                                className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex flex-row" 
                                                style={{ 
                                                    opacity: volumeMorphProgress,
                                                    transition: `opacity ${CONFIG.VOLUME_CYLINDER_FADE_DURATION}ms ease-out`,
                                                }}
                                            >
                                                {CONFIG.VOLUME_CYLINDER_SLICES.map((opacity, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex-1 h-full"
                                                        style={{
                                                            backgroundColor: opacity > 0 
                                                                ? `rgba(255, 255, 255, ${opacity * CONFIG.VOLUME_CYLINDER_INTENSITY})` 
                                                                : opacity < 0 
                                                                    ? `rgba(0, 0, 0, ${Math.abs(opacity) * CONFIG.VOLUME_CYLINDER_INTENSITY})`
                                                                    : 'transparent'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {CONFIG.VOLUME_THUMB_ENABLED && (
                                    <div
                                        className="absolute rounded-full"
                                        style={{
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            top: thumbY - CONFIG.VOLUME_THUMB_SIZE / 2,
                                            width: CONFIG.VOLUME_THUMB_SIZE,
                                            height: CONFIG.VOLUME_THUMB_SIZE,
                                            backgroundColor: CONFIG.VOLUME_THUMB_COLOR,
                                            boxShadow: `0 0 ${CONFIG.VOLUME_THUMB_GLOW_SIZE}px ${CONFIG.VOLUME_THUMB_GLOW_COLOR}`,
                                            opacity: volumeMorphProgress,
                                            transition: `opacity ${CONFIG.VOLUME_MORPH_DURATION}ms ${CONFIG.VOLUME_MORPH_EASING}`,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })(), document.body)}
                </>
            )}
        </div>
    );
};

const SortButton = ({ icon: Icon, mode, currentMode, onClick, isFirst, isLast, isWide, hideGlow = false, glowOpacity = 1, transitionDuration = 0, retrigger = false }) => {
  const isActive = currentMode === mode;
  const [justActivated, setJustActivated] = useState(false);
  const [isRetriggering, setIsRetriggering] = useState(false);
  const [skipNextIgnite, setSkipNextIgnite] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const prevActiveRef = useRef(isActive);
  
  useEffect(() => {
      if (isActive && !prevActiveRef.current) {
          setJustActivated(true);
          const timer = setTimeout(() => setJustActivated(false), 400);
          return () => clearTimeout(timer);
      }
      prevActiveRef.current = isActive;
  }, [isActive]);
  
  const handleClick = () => {
      // Si retrigger est activé et le bouton est déjà actif, lancer l'animation cyan → rose
      if (retrigger && isActive) {
          setAnimKey(k => k + 1);
          setIsRetriggering(true);
          setSkipNextIgnite(true);
          setTimeout(() => setIsRetriggering(false), 500);
      }
      onClick(mode);
  };
  
  let roundedClass = '';
  if (isFirst) roundedClass = 'rounded-l-full';
  if (isLast) roundedClass = 'rounded-r-full';
  
  // Si isWide, le bouton prend 1.5x plus de place
  const widthClass = isWide ? 'flex-[1.5]' : 'flex-1';
  
  let animationClass = '';
  if (!hideGlow) {
      if (isRetriggering) {
          animationClass = 'animate-neon-cyan-to-pink';
      } else if (justActivated) {
          animationClass = 'animate-neon-ignite-pink';
      } else {
          animationClass = 'animate-neon-breathe-pink';
      }
  }
  
  return (
    <div className={`${widthClass} h-full relative overflow-visible ${roundedClass}`}>
        {isActive && (
            isRetriggering ? (
              <div 
                  key={animKey}
                  className={`absolute inset-0 ${roundedClass} animate-neon-cyan-to-pink`}
                  style={{ zIndex: 0 }}
              />
          ) : (
            <NeonGlow
            key={`glow-${isActive}-${skipNextIgnite}`}
            colorName="pink"
            glowRGB={CONFIG.SORTBTN_COLOR}
            enabled={true}
            igniteOnMount={!skipNextIgnite}
            flickerEnabled={!hideGlow && glowOpacity > 0}
            glowOpacity={hideGlow ? 0 : glowOpacity}
            transitionDuration={transitionDuration}
            className={`absolute inset-0 ${roundedClass}`}
            style={{
                background: `rgba(${CONFIG.SORTBTN_COLOR}, 1)`,
                zIndex: 0
            }}
            onAnimationEnd={() => setSkipNextIgnite(false)}
      />
          )
        )}
        <button 
            onClick={handleClick}
            className={`relative z-10 w-full h-full flex items-center justify-center transition-all duration-200 ${roundedClass} ${isActive ? 'text-white' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
        >
            <Icon size={isWide ? 18 : 16} />
        </button>
    </div>
);
};

// Bouton Tri Toggle (pour titre, artiste, playCount)
const ToggleSortButton = ({ 
    type, 
    currentMode, 
    sortDirection, 
    onToggle, 
    isFirst = false, 
    hideGlow = false, 
    glowOpacity = 1, 
    transitionDuration = 0 
}) => {
    const [justActivated, setJustActivated] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const prevActiveRef = useRef(false);
    
    // Déterminer si ce bouton est actif
    const isActive = (type === 'title' && currentMode === 'alphaTitle') ||
                     (type === 'artist' && currentMode === 'alphaArtist') ||
                     (type === 'playCount' && (currentMode === 'leastPlayed' || currentMode === 'mostPlayed'));
    
    useEffect(() => {
        if (isActive && !prevActiveRef.current) {
            setJustActivated(true);
            const timer = setTimeout(() => setJustActivated(false), 400);
            return () => clearTimeout(timer);
        }
        prevActiveRef.current = isActive;
    }, [isActive]);
    
    const handleClick = () => {
        setAnimKey(k => k + 1);
        setJustActivated(true);
        setTimeout(() => setJustActivated(false), 400);
        onToggle(type);
    };
    
    // Déterminer l'icône selon le type et la direction
    let IconComponent;
    if (type === 'title') {
        IconComponent = (isActive && sortDirection === 'desc') ? ArrowUpZA : ArrowDownAZ;
    } else if (type === 'artist') {
        IconComponent = User;
    } else if (type === 'playCount') {
        if (currentMode === 'mostPlayed') {
            IconComponent = Flame;
        } else {
            IconComponent = Snowflake;
        }
    }
    
    const roundedClass = isFirst ? 'rounded-l-full' : '';
    
    return (
        <div className={`flex-1 h-full relative overflow-visible ${roundedClass}`}>
            {isActive && (
                <NeonGlow
                    key={animKey}
                    colorName="pink"
                    glowRGB={CONFIG.SORTBTN_COLOR}
                    enabled={true}
                    igniteOnMount={true}
                    flickerEnabled={!hideGlow && glowOpacity > 0}
                    glowOpacity={hideGlow ? 0 : glowOpacity}
                    transitionDuration={transitionDuration}
                    className={`absolute inset-0 ${roundedClass}`}
                    style={{
                        background: `rgba(${CONFIG.SORTBTN_COLOR}, 1)`,
                        zIndex: 0
                    }}
                />
            )}
            <button 
                onClick={handleClick}
                className={`relative z-10 w-full h-full flex items-center justify-center transition-all duration-200 ${roundedClass} ${isActive ? 'text-white' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
            >
                {type === 'artist' ? (
                    <div className="flex items-center" style={{ gap: '1px' }}>
                    {(isActive ? sortDirection : 'asc') === 'asc' ? (
                        <MoveDown style={{ width: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100 * 0.7)`, height: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100 * 0.7)` }} />
                    ) : (
                        <MoveUp style={{ width: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100 * 0.7)`, height: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100 * 0.7)` }} />
                    )}
                        <IconComponent style={{ width: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)`, height: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)` }} />
                    </div>
                ) : (
                  <IconComponent style={{ width: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)`, height: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)` }} />
                )}
            </button>
        </div>
    );
};

// Bouton Tri Mini (Builder)
const BuilderSortBtn = ({ icon: Icon, mode, sortMode, setSortMode }) => {
    const isActive = sortMode === mode;
    
    return (
        <div className="flex-1 h-full relative overflow-visible">
            {isActive && (
              <div 
                  key={animKey}
                  className={`absolute inset-0 ${roundedClass} ${animationClass}`}
                  style={{
                      background: isRetriggering ? undefined : '#ec4899',
                      zIndex: 0
                  }}
              />
          )}
            <button 
                onClick={() => setSortMode(mode)} 
                className={`relative z-10 w-full h-full flex items-center justify-center transition-all duration-200 ${isActive ? 'text-white' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
            > 
                <Icon size={14} /> 
            </button>
        </div>
    );
};

// Composant pour les résultats de recherche dans la bibliothèque
const LibrarySongRow = ({ song, onClick }) => (
    <div 
        onClick={onClick}
        className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 active:bg-gray-50 transition-colors cursor-pointer"
    >
        <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                <Music2 size={20} />
            </div>
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-gray-900 truncate">{song.title}</span>
                <span className="text-xs text-gray-500 truncate">{song.artist}</span>
            </div>
        </div>
        <div className="text-gray-300">
            <Play size={16} fill="currentColor" />
        </div>
    </div>
);

// --- 3. COMPLEX COMPONENTS ---

const TimeCapsule = ({ currentTime, duration, onSeek, onSkipBack, onSkipForward, isLive, isMini, confirmMode, confirmType, vibeSwipePreview }) => {
    const formatTime = (time) => { if (!time || isNaN(time)) return "0:00"; const min = Math.floor(time / 60); const sec = Math.floor(time % 60); return `${min}:${sec.toString().padStart(2, '0')}`; };
    
    // MODE SWIPE PREVIEW - affichage progressif NEXT/PREVIOUS COLOR (PLEINE LARGEUR)
    if (vibeSwipePreview && vibeSwipePreview.progress > 0) {
        const { direction, progress, nextGradient, previewIndex } = vibeSwipePreview;
        const gradientName = getGradientName(previewIndex);
        const step = 100 / (nextGradient.length - 1);
        const gradientBg = `linear-gradient(135deg, ${nextGradient.map((c, i) => `${c} ${Math.round(i * step)}%`).join(', ')})`;
        
        return (
            <div
                className="flex-1 rounded-full flex items-center justify-center border-none shadow-lg relative overflow-hidden"
                style={{
                    height: UNIFIED_CONFIG.FOOTER_BTN_HEIGHT,
                    background: gradientBg,
                    opacity: 0.3 + (progress * 0.7),
                    boxShadow: `0 0 25px ${nextGradient[Math.floor(nextGradient.length / 2)]}66, 0 0 50px ${nextGradient[Math.floor(nextGradient.length / 2)]}33`
                }}
            >
<div 
                    className="flex items-center gap-2 text-white font-black tracking-widest text-lg uppercase"
                    style={{ 
                        opacity: progress,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}
                >
                    <ChevronLeft size={16} />
                    <span>{gradientName}</span>
                    <ChevronRight size={16} />
                </div>
            </div>
        );
    }

    // MODE CONFIRMATION - priorité maximale
    if (confirmMode) {
        const isKill = confirmType === 'kill';
        const bgColor = isKill ? '#FF6700' : '#FF073A';
        const borderColor = isKill ? '#CC5200' : '#CC0530';
        const glowColor = isKill ? 'rgba(255, 103, 0, 0.7)' : 'rgba(255, 7, 58, 0.7)';
        const glowColor2 = isKill ? 'rgba(255, 103, 0, 0.4)' : 'rgba(255, 7, 58, 0.4)';
        const text = isKill ? 'KILL CURRENT VIBE?!' : 'NUKE ALL???';
        const Icon = isKill ? Skull : Radiation;
        const isAnimating = feedback && (feedback.type === 'kill' || feedback.type === 'nuke');
        const animClass = isAnimating ? 'animate-neon-glow' : '';
        const neonColor = isKill ? '255, 103, 0' : '255, 7, 58';
        
        return (
            <div
            className={`flex-1 rounded-full flex items-center justify-center border animate-appear overflow-hidden ${animClass}`}
                style={{
                    height: UNIFIED_CONFIG.FOOTER_BTN_HEIGHT,
                    '--neon-color': neonColor,
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    boxShadow: `0 0 25px ${glowColor}, 0 0 50px ${glowColor2}`
                }}
            >
                <div className={`flex items-center gap-2 text-white font-black tracking-widest text-xs ${isAnimating ? 'animate-blink' : ''}`}>
                    {isAnimating && <Icon size={20} strokeWidth={3} />}
                    <span>{isAnimating ? (isKill ? 'KILL!' : 'NUKE!') : text}</span>
                </div>
            </div>
        );
    }
    
    const feedbackStyle = "bg-gray-50 border-gray-200";
    const glowStyle = {};

    return (
      <div
          className={`flex-1 rounded-full flex items-center px-2 gap-2 shadow-sm relative transition-colors duration-300 overflow-hidden ${feedbackStyle} ${CONFIG.TIMECAPSULE_GLOW_ENABLED ? 'timecapsule-glow' : ''}`}
          style={{
            height: UNIFIED_CONFIG.FOOTER_BTN_HEIGHT,
            ...glowStyle,
            border: CONFIG.TIMECAPSULE_NEON_ENABLED
                ? `${CONFIG.TIMECAPSULE_NEON_WIDTH}px solid ${CONFIG.TIMECAPSULE_NEON_COLOR}`
                : '1px solid rgb(229, 231, 235)'
        }}
      >
            <div className="w-full h-full relative">
                {/* Bouton -10s */}
                <div 
                    className="absolute z-20"
                    style={{ 
                        left: `${CONFIG.TC_SKIP_BACK_X_PERCENT}%`,
                        top: `${CONFIG.TC_SKIP_Y_PERCENT}%`,
                        transform: 'translateY(-50%)'
                    }}
                >
                    <SkipButton direction="back" onClick={onSkipBack} />
                </div>
                
                {/* Progress bar - positionnée en % par rapport à la capsule */}
                <div 
                    className="absolute z-10"
                    style={{
                        top: `${CONFIG.TC_PROGRESS_TOP_PERCENT}%`,
                        left: `${CONFIG.TC_PROGRESS_LEFT_PERCENT}%`,
                        right: `${CONFIG.TC_PROGRESS_RIGHT_PERCENT}%`,
                        transform: 'translateY(-50%)',
                    }}
                >
                    <input 
                        type="range" 
                        min="0" 
                        max={duration || 100} 
                        value={currentTime} 
                        onChange={onSeek}
                        onInput={onSeek}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="w-full bg-gray-200 rounded-lg appearance-none cursor-pointer slider-rose transition-all"
                        style={{ touchAction: 'none', height: `${CONFIG.TC_PROGRESS_HEIGHT}rem`, '--slider-thumb-size': `${CONFIG.TC_PROGRESS_THUMB_SIZE}px` }}
                    />
                    {/* Temps - positionnés en % par rapport à la progress bar */}
                    <div 
                        className="absolute text-gray-400 font-bold font-mono pointer-events-none leading-none"
                        style={{ 
                            fontSize: `${CONFIG.TC_TIME_FONT_SIZE}rem`,
                            top: `${CONFIG.TC_TIME_Y_PERCENT}%`,
                            left: `${CONFIG.TC_TIME_ELAPSED_X_PERCENT}%`,
                        }}
                    >
                        {formatTime(currentTime)}
                    </div>
                    <div 
                        className="absolute text-gray-400 font-bold font-mono pointer-events-none leading-none"
                        style={{ 
                            fontSize: `${CONFIG.TC_TIME_FONT_SIZE}rem`,
                            top: `${CONFIG.TC_TIME_Y_PERCENT}%`,
                            right: `${100 - CONFIG.TC_TIME_REMAINING_X_PERCENT}%`,
                        }}
                    >
                        -{formatTime(duration - currentTime)}
                    </div>
                </div>
                
                {/* Bouton +10s */}
                <div 
                    className="absolute z-20"
                    style={{ 
                        right: `${CONFIG.TC_SKIP_FORWARD_X_PERCENT}%`,
                        top: `${CONFIG.TC_SKIP_Y_PERCENT}%`,
                        transform: 'translateY(-50%)'
                    }}
                >
                    <SkipButton direction="forward" onClick={onSkipForward} />
                </div>
            </div>
        </div>
    );
};

const FeedbackOverlay = ({ feedback, onAnimationComplete, neonColor, bgClass, borderClass, children, roundedClass = 'rounded-full' }) => {
    const [phase, setPhase] = useState('fadein'); // fadein, flash, idle, validating, fadeout
    const [textOpacity, setTextOpacity] = useState(0);
    const [glowIntensity, setGlowIntensity] = useState(0);
    const [bgOpacity, setBgOpacity] = useState(0);
    const [isPulsing, setIsPulsing] = useState(false);
    const phaseRef = useRef('fadein');
    const timeoutsRef = useRef([]);
    const pulseIntervalRef = useRef(null);
    
    // Calculer les durées avec le multiplicateur
    const speed = CONFIG.FEEDBACK_SPEED_MULTIPLIER;
    const fadeInDuration = CONFIG.FEEDBACK_FADEIN_DURATION / speed;
    const flashDuration = CONFIG.FEEDBACK_GLOW_FLASH_DURATION / speed;
    const blinkDurations = CONFIG.FEEDBACK_BLINK_DURATIONS.map(d => d / speed);
    const validationFlashDuration = CONFIG.FEEDBACK_VALIDATION_FLASH_DURATION / speed;
    const fadeOutDuration = CONFIG.FEEDBACK_FADEOUT_DURATION / speed;
    const glowFadeOutDuration = CONFIG.FEEDBACK_GLOW_FADEOUT_DURATION / speed;
    const idleDelay = CONFIG.FEEDBACK_IDLE_DELAY / speed;
    const blinkTransition = CONFIG.FEEDBACK_BLINK_TRANSITION / speed;
    const pulseDuration = CONFIG.FEEDBACK_GLOW_PULSE_DURATION / speed;
    
    const clearAllTimeouts = () => {
        timeoutsRef.current.forEach(t => clearTimeout(t));
        timeoutsRef.current = [];
    };
    
    const stopPulse = () => {
        if (pulseIntervalRef.current) {
            clearInterval(pulseIntervalRef.current);
            pulseIntervalRef.current = null;
        }
        setIsPulsing(false);
    };
    
    const addTimeout = (fn, delay) => {
        const t = setTimeout(fn, delay);
        timeoutsRef.current.push(t);
        return t;
    };
    
    // Glow pulse pendant idle
    const startPulse = useCallback(() => {
        if (!CONFIG.FEEDBACK_GLOW_PULSE_ENABLED) return;
        
        setIsPulsing(true);
        let goingUp = true;
        
        pulseIntervalRef.current = setInterval(() => {
            setGlowIntensity(prev => {
                if (goingUp) {
                    if (prev >= CONFIG.FEEDBACK_GLOW_PULSE_MAX) {
                        goingUp = false;
                        return CONFIG.FEEDBACK_GLOW_PULSE_MAX;
                    }
                    return prev + 2;
                } else {
                    if (prev <= CONFIG.FEEDBACK_GLOW_PULSE_MIN) {
                        goingUp = true;
                        return CONFIG.FEEDBACK_GLOW_PULSE_MIN;
                    }
                    return prev - 2;
                }
            });
        }, pulseDuration / ((CONFIG.FEEDBACK_GLOW_PULSE_MAX - CONFIG.FEEDBACK_GLOW_PULSE_MIN) * 2));
    }, [pulseDuration]);
    
    // Phase 1: Fade in + Flash initial
    useEffect(() => {
        if (!feedback) return;
        
        phaseRef.current = 'fadein';
        setPhase('fadein');
        setTextOpacity(0);
        setGlowIntensity(0);
        setBgOpacity(0);
        stopPulse();
        
        // Fade in
        requestAnimationFrame(() => {
            setTextOpacity(CONFIG.FEEDBACK_TEXT_OPACITY);
            setBgOpacity(100);
            if (CONFIG.FEEDBACK_GLOW_FLASH_ENABLED) {
                setGlowIntensity(CONFIG.FEEDBACK_GLOW_FLASH_INTENSITY);
            } else {
                setGlowIntensity(100);
            }
        });
        
        // Après fade in, passer en flash puis idle
        addTimeout(() => {
            if (CONFIG.FEEDBACK_GLOW_FLASH_ENABLED) {
                phaseRef.current = 'flash';
                setPhase('flash');
                addTimeout(() => {
                    setGlowIntensity(100);
                    phaseRef.current = 'idle';
                    setPhase('idle');
                    startPulse(); // Démarrer le pulse en idle
                }, flashDuration);
            } else {
                phaseRef.current = 'idle';
                setPhase('idle');
                startPulse(); // Démarrer le pulse en idle
            }
        }, fadeInDuration);
        
        return () => {
            clearAllTimeouts();
            stopPulse();
        };
    }, [feedback?.text, feedback?.type, startPulse]);
    
    // Fonction pour lancer la séquence de validation (blinks + fade out)
    const startValidationSequence = useCallback(() => {
        if (phaseRef.current === 'validating' || phaseRef.current === 'fadeout') return;
        
        stopPulse(); // Arrêter le pulse
        phaseRef.current = 'validating';
        setPhase('validating');
        
        let currentDelay = 0;
        
        // Validation flash (punch)
        if (CONFIG.FEEDBACK_VALIDATION_FLASH_ENABLED) {
            setGlowIntensity(CONFIG.FEEDBACK_VALIDATION_FLASH_INTENSITY);
            currentDelay += validationFlashDuration;
            addTimeout(() => setGlowIntensity(100), currentDelay);
        }
        
        // Blinks
        for (let i = 0; i < CONFIG.FEEDBACK_BLINK_COUNT; i++) {
            const blinkDuration = blinkDurations[i] || blinkDurations[blinkDurations.length - 1];
            const minOpacity = CONFIG.FEEDBACK_BLINK_MIN_OPACITIES[i] || CONFIG.FEEDBACK_BLINK_MIN_OPACITIES[CONFIG.FEEDBACK_BLINK_MIN_OPACITIES.length - 1];
            
            // Descendre à l'opacité min
            addTimeout(() => setTextOpacity(minOpacity), currentDelay);
            currentDelay += blinkDuration / 2;
            
            // Remonter à l'opacité normale
            addTimeout(() => setTextOpacity(CONFIG.FEEDBACK_TEXT_OPACITY), currentDelay);
            currentDelay += blinkDuration / 2;
        }
        
        // Fade out
        addTimeout(() => {
            phaseRef.current = 'fadeout';
            setPhase('fadeout');
            setTextOpacity(0);
            setGlowIntensity(0);
            setBgOpacity(0);
        }, currentDelay);
        
        // Animation complete
        addTimeout(() => {
            if (onAnimationComplete) onAnimationComplete();
        }, currentDelay + Math.max(fadeOutDuration, glowFadeOutDuration));
        
    }, [blinkDurations, validationFlashDuration, fadeOutDuration, glowFadeOutDuration, onAnimationComplete]);
    
    // Pour PLAY NEXT et ARCHIVE, lancer la validation après le délai idle
    useEffect(() => {
      if (phase === 'idle' && feedback && (feedback.type === 'next' || feedback.type === 'archive' || feedback.type === 'vibe')) {
            addTimeout(() => startValidationSequence(), idleDelay);
        }
    }, [phase, feedback, startValidationSequence, idleDelay]);
    
    // Exposer la fonction pour déclencher la validation depuis l'extérieur
    useEffect(() => {
        if (feedback && feedback.triggerValidation) {
            startValidationSequence();
        }
    }, [feedback?.triggerValidation, startValidationSequence]);
    
    if (!feedback) return null;
    
    const getTransitionDuration = () => {
        switch (phase) {
            case 'fadein': return `${fadeInDuration}ms`;
            case 'flash': return `${flashDuration}ms`;
            case 'fadeout': return `${Math.max(fadeOutDuration, glowFadeOutDuration)}ms`;
            case 'idle': return `${pulseDuration / 2}ms`;
            default: return '150ms';
        }
    };
    
    // Opacité du fond (container)
    const glowStyle = {
        boxShadow: `0 0 ${20 * glowIntensity / 100}px rgba(${neonColor}, ${0.8 * glowIntensity / 100}), 0 0 ${40 * glowIntensity / 100}px rgba(${neonColor}, ${0.4 * glowIntensity / 100})`,
        transition: isPulsing ? `box-shadow ${pulseDuration / 2}ms ease-in-out` : `box-shadow ${getTransitionDuration()} ease-out`
    };
    
    const containerStyle = {
        ...glowStyle,
        opacity: bgOpacity / 100,
        transition: `opacity ${phase === 'fadeout' ? fadeOutDuration : fadeInDuration}ms ease-out, ${glowStyle.transition}`
    };
    
    return (
        <div 
        className={`absolute inset-0 z-10 ${roundedClass} flex items-center justify-center border ${bgClass} ${borderClass}`}
            style={containerStyle}
        >
            <div 
                className="flex items-center gap-2 text-white font-black tracking-widest"
                style={{ 
                    opacity: textOpacity / 100,
                    transition: `opacity ${phase === 'validating' ? `${blinkTransition}ms` : getTransitionDuration()} ease-out`
                }}
            >
                {children}
            </div>
        </div>
    );
  };

  // FEEDBACK CARD OVERLAY - Anime l'opacité d'un élément (pas du texte)
  const FeedbackCardOverlay = ({ isActive, onAnimationComplete, children }) => {
    const [cardOpacity, setCardOpacity] = useState(100);
    const timeoutsRef = useRef([]);
    const onAnimationCompleteRef = useRef(onAnimationComplete);
    
    // Garder la ref à jour
    useEffect(() => {
        onAnimationCompleteRef.current = onAnimationComplete;
    }, [onAnimationComplete]);
    
    const speed = CONFIG.CARD_BLINK_SPEED_MULTIPLIER;
    const blinkDurations = CONFIG.CARD_BLINK_DURATIONS.map(d => d / speed);
    const idleDelay = CONFIG.CARD_BLINK_IDLE_DELAY / speed;
    const fadeOutDuration = CONFIG.CARD_BLINK_FADEOUT_DURATION / speed;
    const blinkTransition = CONFIG.CARD_BLINK_TRANSITION / speed;
    
    const clearAllTimeouts = () => {
        timeoutsRef.current.forEach(t => clearTimeout(t));
        timeoutsRef.current = [];
    };
    
    const addTimeout = (fn, delay) => {
        const t = setTimeout(fn, delay);
        timeoutsRef.current.push(t);
        return t;
    };
    
    useEffect(() => {
        if (!isActive) {
            clearAllTimeouts();
            setCardOpacity(100);
            return;
        }
        
        let currentDelay = idleDelay;
        
        for (let i = 0; i < CONFIG.CARD_BLINK_COUNT; i++) {
            const blinkDuration = blinkDurations[i] || blinkDurations[blinkDurations.length - 1];
            const minOpacity = CONFIG.CARD_BLINK_MIN_OPACITIES[i] || CONFIG.CARD_BLINK_MIN_OPACITIES[CONFIG.CARD_BLINK_MIN_OPACITIES.length - 1];
            
            addTimeout(() => setCardOpacity(minOpacity), currentDelay);
            currentDelay += blinkDuration / 2;
            
            addTimeout(() => setCardOpacity(100), currentDelay);
            currentDelay += blinkDuration / 2;
        }
        
        addTimeout(() => {
            if (onAnimationCompleteRef.current) onAnimationCompleteRef.current();
        }, currentDelay + fadeOutDuration);
        
        return () => clearAllTimeouts();
    }, [isActive]);
      
      return (
          <div style={{ opacity: cardOpacity / 100, transition: `opacity ${blinkTransition}ms ease-out` }}>
              {children}
          </div>
      );
  };
  
  // LIVING CAPSULE
  const LiveHeaderCapsule = ({ activeFilter, setActiveFilter, sortDirection, onToggleSort, isSearching, setIsSearching, searchQuery, setSearchQuery, hideGlow = false, glowOpacity = 1, transitionDuration = 0 }) => {
    
    const GLOW_VERTICAL_SPREAD = CONFIG.WHEEL_GLOW_VERTICAL;
    const GLOW_HORIZONTAL_SPREAD = CONFIG.WHEEL_GLOW_HORIZONTAL;
    const GLOW_BLUR = CONFIG.WHEEL_GLOW_BLUR;
    const GLOW_SPREAD = CONFIG.WHEEL_GLOW_SPREAD;
    const GLOW_OPACITY = CONFIG.WHEEL_GLOW_OPACITY;
    const GLOW_COLOR = CONFIG.WHEEL_GLOW_COLOR;
    const GLOW_COLOR_RED = '244, 63, 94';      // Rose/Rouge
    const GLOW_COLOR_GREEN = '16, 185, 129';   // Vert émeraude
    const GLOW_COLOR_SEARCH = '138, 255, 8';   // Vert lime

    // SEARCH MODE avec glow vert
    if (isSearching) {
        const searchGlowStyle = {
            boxShadow: `0 -${GLOW_VERTICAL_SPREAD}px ${GLOW_BLUR}px rgba(${GLOW_COLOR_SEARCH}, ${GLOW_OPACITY}), 0 ${GLOW_VERTICAL_SPREAD}px ${GLOW_BLUR}px rgba(${GLOW_COLOR_SEARCH}, ${GLOW_OPACITY})`
        };
        return (
            <div 
            className="flex-1 bg-gray-50 rounded-full flex items-center border border-gray-100 overflow-visible shadow-sm animate-in fade-in zoom-in duration-200"
            style={{ ...searchGlowStyle, height: CONFIG.PLAYER_SORT_CAPSULE_HEIGHT }}
            >
                <div className="w-full h-full flex items-center px-4">
                <Search style={{ width: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)`, height: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)` }} className="text-gray-400 mr-3" />
                    <input 
                        autoFocus
                        className="flex-1 bg-transparent border-none text-sm font-bold text-gray-900 placeholder-gray-400 focus:ring-0 p-0 outline-none"
                        placeholder=""
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        );
    }

    // DEFAULT - Sort buttons
    return (
      <div className="flex-1 bg-gray-50 rounded-full flex items-center border border-gray-100 overflow-visible shadow-sm animate-in fade-in zoom-in duration-200" style={{ height: CONFIG.PLAYER_SORT_CAPSULE_HEIGHT }}>
          <SortButton mode="initialShuffle" currentMode={activeFilter} onClick={setActiveFilter} icon={RotateCcw} isFirst={true} hideGlow={hideGlow} glowOpacity={glowOpacity} transitionDuration={transitionDuration} />
          <div className="w-px h-full bg-gray-200"></div>
          <ToggleSortButton type="title" currentMode={activeFilter} sortDirection={sortDirection} onToggle={onToggleSort} hideGlow={hideGlow} glowOpacity={glowOpacity} transitionDuration={transitionDuration} />
          <div className="w-px h-full bg-gray-200"></div>
          <ToggleSortButton type="artist" currentMode={activeFilter} sortDirection={sortDirection} onToggle={onToggleSort} hideGlow={hideGlow} glowOpacity={glowOpacity} transitionDuration={transitionDuration} />
          <div className="w-px h-full bg-gray-200"></div>
          <ToggleSortButton type="playCount" currentMode={activeFilter} sortDirection={sortDirection} onToggle={onToggleSort} hideGlow={hideGlow} glowOpacity={glowOpacity} transitionDuration={transitionDuration} />
          
          {/* Séparateur plus court (50% de la hauteur) */}
          <div className="w-px h-1/2 bg-gray-300"></div>
          
          {/* Bouton Dés plus large */}
          <SortButton mode="newShuffle" currentMode={activeFilter} onClick={setActiveFilter} icon={Dices} isLast={true} isWide={true} hideGlow={hideGlow} glowOpacity={glowOpacity} transitionDuration={transitionDuration} retrigger={true} />
      </div>
  );
};

const ControlCapsule = ({ song, isPlaying, togglePlay, playPrev, playNext, queueIndex, queueLength, variant = 'default', audioLevel = 0 }) => {
    const isMain = variant === 'main'; 
    
    const capsuleHeightVh = isMain ? CONFIG.CAPSULE_HEIGHT_VH : CONFIG.CAPSULE_HEIGHT_MINI_VH;
    const CAPSULE_TITLE_SIZE_MAIN = CONFIG.CAPSULE_TITLE_SIZE_MAIN;
    const CAPSULE_TITLE_SIZE_DASHBOARD = CONFIG.CAPSULE_TITLE_SIZE_DASHBOARD;
    const CAPSULE_ARTIST_SIZE_MAIN = CONFIG.CAPSULE_ARTIST_SIZE_MAIN;
    const CAPSULE_ARTIST_SIZE_DASHBOARD = CONFIG.CAPSULE_ARTIST_SIZE_DASHBOARD;
    const CAPSULE_TITLE_LINEHEIGHT_MAIN = CONFIG.CAPSULE_TITLE_LINEHEIGHT_MAIN;
    const CAPSULE_TITLE_LINEHEIGHT_DASHBOARD = CONFIG.CAPSULE_TITLE_LINEHEIGHT_DASHBOARD;
    const CAPSULE_ARTIST_LINEHEIGHT_MAIN = CONFIG.CAPSULE_ARTIST_LINEHEIGHT_MAIN;
    const CAPSULE_ARTIST_LINEHEIGHT_DASHBOARD = CONFIG.CAPSULE_ARTIST_LINEHEIGHT_DASHBOARD;
    const CAPSULE_GAP_MAIN = CONFIG.CAPSULE_GAP_MAIN;
    const CAPSULE_GAP_DASHBOARD = CONFIG.CAPSULE_GAP_DASHBOARD;

    const titleSizePx = isMain ? CAPSULE_TITLE_SIZE_MAIN : CAPSULE_TITLE_SIZE_DASHBOARD;
    const artistSizePx = isMain ? CAPSULE_ARTIST_SIZE_MAIN : CAPSULE_ARTIST_SIZE_DASHBOARD;
    const titleLineHeight = isMain ? CAPSULE_TITLE_LINEHEIGHT_MAIN : CAPSULE_TITLE_LINEHEIGHT_DASHBOARD;
    const artistLineHeight = isMain ? CAPSULE_ARTIST_LINEHEIGHT_MAIN : CAPSULE_ARTIST_LINEHEIGHT_DASHBOARD;
    const gapPx = isMain ? CAPSULE_GAP_MAIN : CAPSULE_GAP_DASHBOARD;
    
    const handlePlayPause = (e) => {
        e.stopPropagation();
        togglePlay();
    };

    return (
        <div className="relative transition-all duration-300 flex flex-col items-center" style={{ height: `${capsuleHeightVh}vh`, width: `${CONFIG.CAPSULE_WIDTH_PERCENT}%` }}>
            {/* Trait néon cyan - animation CSS selon état play/pause */}
            {CONFIG.CAPSULE_NEON_ENABLED && (
              <div 
                className={`absolute inset-0 rounded-full pointer-events-none ${isPlaying ? 'capsule-neon-glow-playing' : 'capsule-neon-glow'}`}
                style={{ 
                  border: `${CONFIG.CAPSULE_NEON_WIDTH}px solid rgba(${CONFIG.CAPSULE_NEON_COLOR}, ${CONFIG.CAPSULE_NEON_OPACITY_MAX})`,
                  zIndex: 20
                }}
              />
            )}
            <div 
                className={`w-full h-full rounded-full border border-gray-200 shadow-sm flex items-center overflow-hidden relative`}
                style={{ backgroundColor: `rgba(${CONFIG.CAPSULE_BG_COLOR}, ${CONFIG.CAPSULE_BG_OPACITY})` }}
            >
                {/* Masque cylindre 3D */}
                {CONFIG.CAPSULE_CYLINDER_ENABLED && (
                    <div 
                        className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex flex-col rounded-full"
                    >
                        {CONFIG.CAPSULE_CYLINDER_SLICES.map((opacity, i) => (
                            <div
                                key={i}
                                className="flex-1"
                                style={{
                                    backgroundColor: opacity > 0 
                                        ? `rgba(255, 255, 255, ${opacity * CONFIG.CAPSULE_CYLINDER_INTENSITY})` 
                                        : opacity < 0 
                                            ? `rgba(0, 0, 0, ${Math.abs(opacity) * CONFIG.CAPSULE_CYLINDER_INTENSITY})`
                                            : 'transparent'
                                }}
                            />
                        ))}
                    </div>
                )}
                <button onClick={(e) => { e.stopPropagation(); playPrev(); }} className="w-12 h-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors border-r border-gray-200 active:bg-gray-200"><SkipBack size={20} fill="currentColor" /></button>
                
                {/* Zone centrale - titre centré par rapport à TOUTE la capsule via absolute */}
                <div className="flex-1 min-w-0 h-full relative" onClick={handlePlayPause}>
                <div className="absolute top-1 left-1 text-[7px] font-mono text-gray-300 flex items-center gap-0.5 z-10"><Headphones size={8} /><span>{song.playCount || 0}</span></div>
                    {/* Titre et artiste centrés absolument */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ gap: `${gapPx}px` }}>
                        <ScrollingText text={song.title} isCenter={true} className="font-black text-gray-900" style={{ fontSize: `${titleSizePx}px`, lineHeight: titleLineHeight }} />
                        <span className="text-pink-500 font-bold truncate max-w-full px-2" style={{ fontSize: `${artistSizePx}px`, lineHeight: artistLineHeight }}>{song.artist}</span>
                    </div>
                </div>
                
                <button onClick={(e) => { e.stopPropagation(); playNext(); }} className="w-12 h-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors border-l border-gray-200 active:bg-gray-200"><SkipForward size={20} fill="currentColor" /></button>
            </div>
        </div>
    );
};

const SwipeableSongRow = ({ song, index, isVisualCenter, queueLength, onClick, onSwipeRight, onSwipeLeft, itemHeight, isMini, scrollTop, containerHeight, centerPadding }) => {
    const rowRef = useRef(null);
    const touchStartRef = useRef({ x: null, y: null });
    const swipeDirectionRef = useRef(null);
    const [offset, setOffset] = useState(0);

    // Utiliser useEffect pour ajouter le listener avec { passive: false }
    // Cela permet à preventDefault() de fonctionner sur iOS
    useEffect(() => {
        const element = rowRef.current;
        if (!element) return;

        const handleTouchMove = (e) => {
            const { x: touchStartX, y: touchStartY } = touchStartRef.current;
            if (touchStartX === null || touchStartY === null) return;

            const currentX = e.targetTouches[0].clientX;
            const currentY = e.targetTouches[0].clientY;
            const diffX = currentX - touchStartX;
            const diffY = currentY - touchStartY;

            // Déterminer la direction au premier mouvement significatif (verrouillage)
            if (swipeDirectionRef.current === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
                swipeDirectionRef.current = Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical';
            }

            // Si c'est un swipe vertical, on laisse le scroll natif faire son travail
            if (swipeDirectionRef.current === 'vertical') return;

            // Si c'est horizontal, on BLOQUE le scroll et on gère le swipe
            if (swipeDirectionRef.current === 'horizontal') {
                e.preventDefault(); // Fonctionne car passive: false
                if (Math.abs(diffX) < 150) {
                    setOffset(diffX);
                }
            }
        };

        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => element.removeEventListener('touchmove', handleTouchMove);
    }, []);

    const onTouchStart = (e) => {
        touchStartRef.current = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        };
        swipeDirectionRef.current = null;
    };

    const onTouchEnd = () => {
        if (swipeDirectionRef.current === 'horizontal' && touchStartRef.current.x !== null) {
            if (offset < -50) onSwipeLeft(song);
            else if (offset > 50) onSwipeRight(song);
        }
        setOffset(0);
        touchStartRef.current = { x: null, y: null };
        swipeDirectionRef.current = null;
    };
    const WHEEL_TITLE_SIZE_MAIN_CENTER = CONFIG.WHEEL_TITLE_SIZE_MAIN_CENTER;
    const WHEEL_TITLE_SIZE_MAIN_OTHER = CONFIG.WHEEL_TITLE_SIZE_MAIN_OTHER;
    const WHEEL_TITLE_SIZE_MINI_CENTER = CONFIG.WHEEL_TITLE_SIZE_MINI_CENTER;
    const WHEEL_TITLE_SIZE_MINI_OTHER = CONFIG.WHEEL_TITLE_SIZE_MINI_OTHER;
    const WHEEL_ARTIST_SIZE_MAIN_CENTER = CONFIG.WHEEL_ARTIST_SIZE_MAIN;
    const WHEEL_ARTIST_SIZE_MAIN_OTHER = CONFIG.WHEEL_ARTIST_SIZE_MAIN_OTHER;
    const WHEEL_ARTIST_SIZE_MINI_CENTER = CONFIG.WHEEL_ARTIST_SIZE_MINI;
    const WHEEL_ARTIST_SIZE_MINI_OTHER = CONFIG.WHEEL_ARTIST_SIZE_MINI_OTHER;
    const WHEEL_TITLE_LINEHEIGHT_MAIN = CONFIG.WHEEL_TITLE_LINEHEIGHT_MAIN;
    const WHEEL_TITLE_LINEHEIGHT_MINI = CONFIG.WHEEL_TITLE_LINEHEIGHT_MINI;
    const WHEEL_ARTIST_LINEHEIGHT_MAIN = CONFIG.WHEEL_ARTIST_LINEHEIGHT_MAIN;
    const WHEEL_ARTIST_LINEHEIGHT_MINI = CONFIG.WHEEL_ARTIST_LINEHEIGHT_MINI;
    const WHEEL_GAP_MAIN = CONFIG.WHEEL_GAP_MAIN;
    const WHEEL_GAP_MINI = CONFIG.WHEEL_GAP_MINI;

    let titleSizePx, artistSizePx, titleLineHeight, artistLineHeight, gapPx;
    if (isMini) {
        titleSizePx = isVisualCenter ? WHEEL_TITLE_SIZE_MINI_CENTER : WHEEL_TITLE_SIZE_MINI_OTHER;
        artistSizePx = isVisualCenter ? WHEEL_ARTIST_SIZE_MINI_CENTER : WHEEL_ARTIST_SIZE_MINI_OTHER;
        titleLineHeight = WHEEL_TITLE_LINEHEIGHT_MINI;
        artistLineHeight = WHEEL_ARTIST_LINEHEIGHT_MINI;
        gapPx = WHEEL_GAP_MINI;
    } else {
        titleSizePx = isVisualCenter ? WHEEL_TITLE_SIZE_MAIN_CENTER : WHEEL_TITLE_SIZE_MAIN_OTHER;
        artistSizePx = isVisualCenter ? WHEEL_ARTIST_SIZE_MAIN_CENTER : WHEEL_ARTIST_SIZE_MAIN_OTHER;
        titleLineHeight = WHEEL_TITLE_LINEHEIGHT_MAIN;
        artistLineHeight = WHEEL_ARTIST_LINEHEIGHT_MAIN;
        gapPx = WHEEL_GAP_MAIN;
    }

    const progress = Math.abs(offset);
    const showFeedback = progress > 20; 
    const progressOpacity = Math.min((progress - 20) / (180 - 20), 1.0); 

    let OverlayContent = null; 
    let overlayClass = "";

    if (offset > 0) { 
        overlayClass = "bg-emerald-500 rounded-full shadow-inner"; 
        OverlayContent = (
        <div className="absolute inset-0 flex items-center justify-start px-6 gap-3 text-white font-black text-sm tracking-widest">
            <ListPlus size={24} strokeWidth={3} />
            <div className="flex flex-col leading-none">
            <span>PLAY</span>
            <span>NEXT</span>
            </div>
        </div>
        ); 
    } else if (offset < 0) { 
        overlayClass = "bg-rose-500 rounded-full shadow-inner"; 
        OverlayContent = (
        <div className="absolute inset-0 flex items-center justify-end px-6 gap-3 text-white font-black text-sm tracking-widest">
            <span>ARCHIVE</span>
            <Archive size={24} strokeWidth={3} />
        </div>
        ); 
    }

    // Calcul de l'effet cylindre (style iOS)
    const cylinderStyle = {};
    const leftColumnStyle = {};
    const rightColumnStyle = {};
    
    if (CONFIG.WHEEL_CYLINDER_ENABLED && containerHeight) {
        const elementCenter = centerPadding + index * itemHeight + itemHeight / 2;
        const visibleCenter = scrollTop + containerHeight / 2;
        const distanceFromCenter = elementCenter - visibleCenter;
        const normalized = Math.max(-1, Math.min(1, distanceFromCenter / (containerHeight / 2)));
        const absNormalized = Math.abs(normalized);
        
        // scaleY : compression verticale
        const curvedY = Math.pow(absNormalized, 1 + CONFIG.WHEEL_CYLINDER_CURVE_Y);
        const scaleY = 1 - (1 - CONFIG.WHEEL_CYLINDER_MIN_SCALE_Y) * curvedY;
        
        // rotateX : inclinaison avec perspective
        const signX = normalized >= 0 ? -1 : 1;
        const curvedX = Math.pow(absNormalized, 1 + CONFIG.WHEEL_CYLINDER_CURVE_X);
        const rotateX = signX * CONFIG.WHEEL_CYLINDER_MAX_ROTATE_X * curvedX;
        
        cylinderStyle.transform = `perspective(${CONFIG.WHEEL_CYLINDER_PERSPECTIVE}px) rotateX(${rotateX}deg) scaleY(${scaleY})`;
        cylinderStyle.transformStyle = 'preserve-3d';
        
        // Colonnes latérales : déplacement + rotation vers le centre
        const sideInset = CONFIG.WHEEL_CYLINDER_SIDE_INSET * curvedX;
        const sideRotateY = CONFIG.WHEEL_CYLINDER_SIDE_ROTATE_Y * curvedX;
        
        leftColumnStyle.transform = `translateX(${sideInset}px) rotateY(${sideRotateY}deg)`;
        rightColumnStyle.transform = `translateX(${-sideInset}px) rotateY(${-sideRotateY}deg)`;
    }

    return (
      <div
      ref={rowRef}
      className="snap-center flex items-center justify-center px-4 cursor-pointer origin-center absolute w-full"
      style={{ height: itemHeight, top: centerPadding + index * itemHeight, ...cylinderStyle }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={() => { if(Math.abs(offset) < 5) onClick(); }}
      >
        {showFeedback && <div className={`absolute inset-0 mx-4 ${overlayClass}`} style={{ opacity: progressOpacity }}>{OverlayContent}</div>}
        
        <div className="w-full h-full flex items-center transition-transform duration-75 ease-linear relative z-10" style={{ transform: `translateX(${offset}px)` }}>
            {/* Colonne gauche : Play count - LARGEUR FIXE 40px */}
            <div className="w-10 flex flex-col items-center justify-center text-[10px] font-mono flex-shrink-0" style={leftColumnStyle}>
                <Headphones size={12} className={song.playCount > 10 ? "text-pink-500" : "text-gray-300"} />
                <span className="text-gray-400">{song.playCount || 0}</span>
            </div>
            
            {/* Centre : Titre et artiste - PREND TOUT L'ESPACE RESTANT */}
            <div className="flex-1 flex flex-col overflow-hidden items-center justify-center min-w-0" style={{ gap: `${gapPx}px` }}>
                <span 
                    className={`truncate text-center w-full transition-all ${isVisualCenter ? 'font-black text-gray-900' : 'text-gray-400 font-normal'}`}
                    style={{ fontSize: `${titleSizePx}px`, lineHeight: titleLineHeight }}
                >
                    {song.title}
                </span>
                <span 
                    className={`truncate text-center w-full ${isVisualCenter ? 'text-pink-500 font-bold' : 'text-gray-400'}`}
                    style={{ fontSize: `${artistSizePx}px`, lineHeight: artistLineHeight }}
                >
                    {song.artist}
                </span>
            </div>
            
            {/* Colonne droite : MÊME LARGEUR QUE GAUCHE = 40px */}
            <div className="w-10 flex-shrink-0" style={rightColumnStyle}></div>
        </div>
        </div>
    );
};

const SongWheel = ({ queue, currentSong, onSongSelect, isPlaying, togglePlay, playPrev, playNext, onReorder, visibleItems = 9, scrollTrigger, isMini = false, realHeight = null, audioLevel = 0, portalTarget = null, beaconNeonRef = null, onCenteredIndexChange = null, initialIndex = null }) => {
  const containerRef = useRef(null);
  const effectivePortalRef = portalTarget || containerRef;
    
    const WIDTH = CONFIG.VOLUME_WIDTH;
    const HEIGHT = CONFIG.VOLUME_HEIGHT;
    const TRACK_HEIGHT = CONFIG.VOLUME_TRACK_HEIGHT;
    const THUMB_SIZE = CONFIG.VOLUME_THUMB_SIZE;
    const BORDER_RADIUS = CONFIG.VOLUME_BAR_BORDER_RADIUS;
    const ITEM_HEIGHT_MAIN_VH = CONFIG.WHEEL_ITEM_HEIGHT_MAIN_VH;
    const ITEM_HEIGHT_MINI_VH = CONFIG.WHEEL_ITEM_HEIGHT_MINI_VH;
    const LINE_WIDTH_PERCENT = CONFIG.WHEEL_SELECTION_SEPARATOR;
    
    const itemHeightVh = isMini ? ITEM_HEIGHT_MINI_VH : ITEM_HEIGHT_MAIN_VH;
    const itemHeight = window.innerHeight * itemHeightVh / 100;
    const containerHeight = realHeight || (itemHeight * visibleItems);
    const centerPadding = (containerHeight - itemHeight) / 2;
    
    // Génération du masque de fondu
    const wheelMaskStyle = {};
    if (CONFIG.WHEEL_MASK_ENABLED) {
        const edgeOpacity = CONFIG.WHEEL_MASK_EDGE_OPACITY;
        const centerSize = CONFIG.WHEEL_MASK_CENTER_SIZE;
        const curve = CONFIG.WHEEL_MASK_CURVE;
        
        // Générer les stops du gradient avec la courbe
        const stops = [];
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const percent = (i / steps) * 50; // 0% à 50%
            const normalizedDist = 1 - (percent / 50); // 1 au bord, 0 au centre
            const adjustedDist = percent < (50 - centerSize / 2) ? normalizedDist : 0;
            const curved = Math.pow(adjustedDist, curve);
            const opacity = 1 - (1 - edgeOpacity) * curved;
            stops.push(`rgba(0,0,0,${opacity.toFixed(3)}) ${percent}%`);
        }
        // Miroir pour la moitié basse
        for (let i = steps - 1; i >= 0; i--) {
            const percent = 100 - (i / steps) * 50;
            const normalizedDist = 1 - ((100 - percent) / 50);
            const adjustedDist = percent > (50 + centerSize / 2) ? normalizedDist : 0;
            const curved = Math.pow(adjustedDist, curve);
            const opacity = 1 - (1 - edgeOpacity) * curved;
            stops.push(`rgba(0,0,0,${opacity.toFixed(3)}) ${percent}%`);
        }
        
        const gradient = `linear-gradient(to bottom, ${stops.join(', ')})`;
        wheelMaskStyle.WebkitMaskImage = gradient;
        wheelMaskStyle.maskImage = gradient;
    }
    
    const [scrollTop, setScrollTop] = useState(() => {
      if (initialIndex !== null) {
        const itemHeightCalc = window.innerHeight * (isMini ? CONFIG.WHEEL_ITEM_HEIGHT_MINI_VH : CONFIG.WHEEL_ITEM_HEIGHT_MAIN_VH) / 100;
        return initialIndex * itemHeightCalc;
      }
      return 0;
    });
    const lastScrollTopRef = useRef(0);
    const scrollDirectionRef = useRef('down');
    const pendingScrollRef = useRef(null);
    const rafIdRef = useRef(null);
    const snapTimeoutRef = useRef(null);
    const isSnappingRef = useRef(false);
    const snapAnimationRef = useRef(null);
    
    // États pour le mode Scrubbing
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [scrubIndex, setScrubIndex] = useState(0);
    const [scrubMorphProgress, setScrubMorphProgress] = useState(0);
    const [isScrubMorphing, setIsScrubMorphing] = useState(false);
    const scrubMorphTimeoutRef = useRef(null);
    const longPressTimerRef = useRef(null);
    const scrubStartYRef = useRef(0);
    const scrubCenterYRef = useRef(0);
    
    // Scroll instantané vers initialIndex au montage (sans animation)
    const hasInitialized = useRef(false);
    const initialScrollTrigger = useRef(scrollTrigger);
    
    useEffect(() => {
      if (containerRef.current && initialIndex !== null && !hasInitialized.current) {
        const targetTop = initialIndex * itemHeight;
        containerRef.current.scrollTop = targetTop; // Direct, pas de scrollTo
        setScrollTop(targetTop);
        hasInitialized.current = true;
      }
    }, [initialIndex, itemHeight]);

    useEffect(() => { 
      // Ne pas scroller au montage - seulement quand scrollTrigger change APRÈS le montage
      if (scrollTrigger === initialScrollTrigger.current) return;
      
      if (containerRef.current && currentSong) { 
        const index = queue.findIndex(s => s === currentSong); 
        if (index !== -1) { 
          const targetTop = index * itemHeight; 
          containerRef.current.scrollTo({ top: targetTop, behavior: 'smooth' }); 
          setScrollTop(targetTop); 
        } 
      } 
    }, [scrollTrigger]);

    // Notifier le parent de l'index centré
    useEffect(() => {
      if (onCenteredIndexChange) {
        const centeredIndex = Math.round(scrollTop / itemHeight);
        onCenteredIndexChange(centeredIndex);
      }
    }, [scrollTop, itemHeight, onCenteredIndexChange]);
    
    // Cleanup des timeouts au démontage
    useEffect(() => {
      return () => {
        if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        if (snapAnimationRef.current) cancelAnimationFrame(snapAnimationRef.current);
      };
    }, []);
    
    const snapToNearest = () => {
      if (!containerRef.current || isSnappingRef.current) return;
      
      // Capturer la position ACTUELLE au moment du snap
      const startScroll = containerRef.current.scrollTop;
      
      // Synchroniser immédiatement le state avec la vraie position
      // pour éviter un saut visuel au début de l'animation
      if (Math.abs(scrollTop - startScroll) > itemHeight / 2) {
        setScrollTop(startScroll);
      }
      const nearestIndex = Math.round(startScroll / itemHeight);
      const targetScroll = nearestIndex * itemHeight;
      const distance = Math.abs(startScroll - targetScroll);
      
      if (distance > 1) {
        isSnappingRef.current = true;
        
        // Stopper toute inertie du navigateur en forçant la position
        containerRef.current.style.overflow = 'hidden';
        containerRef.current.scrollTop = startScroll;
        containerRef.current.style.overflow = '';
        containerRef.current.style.overflowY = 'auto';
        
        // Calculer la durée proportionnelle à la distance
        const duration = Math.min(
          CONFIG.WHEEL_SNAP_DURATION_MAX,
          Math.max(CONFIG.WHEEL_SNAP_DURATION_MIN, distance * CONFIG.WHEEL_SNAP_DURATION_PER_PX)
        );
        
        const startTime = performance.now();
        
        const animateSnap = (currentTime) => {
          if (!containerRef.current) {
            isSnappingRef.current = false;
            return;
          }
          
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing ease-out (décélération)
          const eased = 1 - Math.pow(1 - progress, 3);
          
          const currentPosition = startScroll + (targetScroll - startScroll) * eased;
          containerRef.current.scrollTop = currentPosition;
          setScrollTop(currentPosition);
          
          if (progress < 1) {
            snapAnimationRef.current = requestAnimationFrame(animateSnap);
          } else {
            // S'assurer qu'on est exactement à la position cible
            containerRef.current.scrollTop = targetScroll;
            setScrollTop(targetScroll);
            isSnappingRef.current = false;
            snapAnimationRef.current = null;
          }
        };
        
        snapAnimationRef.current = requestAnimationFrame(animateSnap);
      }
    };

    const handleScroll = (e) => { 
      // Ignorer les events pendant le snap
      if (isSnappingRef.current) return;
      
      const newScrollTop = e.target.scrollTop;
      if (Math.abs(newScrollTop - lastScrollTopRef.current) > 2) {
        scrollDirectionRef.current = newScrollTop > lastScrollTopRef.current ? 'down' : 'up';
        lastScrollTopRef.current = newScrollTop;
      }
      pendingScrollRef.current = newScrollTop;
      
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          setScrollTop(pendingScrollRef.current);
          rafIdRef.current = null;
        });
      }
      
      // Annuler le snap précédent et en programmer un nouveau
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }
      snapTimeoutRef.current = setTimeout(snapToNearest, CONFIG.WHEEL_SNAP_DELAY);
    };
    
    // Handlers pour le mode Scrubbing
    const canScrub = queue.length >= CONFIG.BEACON_SCRUB_MIN_SONGS;
    
    const handleScrubTouchStart = (e) => {
      if (!canScrub) return;
      const touch = e.touches[0];
      scrubStartYRef.current = touch.clientY;
      const selectedIdx = Math.round(scrollTop / itemHeight);
      setScrubIndex(selectedIdx);
      
      longPressTimerRef.current = setTimeout(() => {
        setIsScrubbing(true);
        setScrubMorphProgress(0);
        setIsScrubMorphing(true);
        scrubCenterYRef.current = window.innerHeight * CONFIG.BEACON_SCRUB_ARC_Y / 100;
        requestAnimationFrame(() => {
          setScrubMorphProgress(1);
        });
        // Désactiver le morphing après la durée de l'animation
        scrubMorphTimeoutRef.current = setTimeout(() => {
          setIsScrubMorphing(false);
        }, CONFIG.BEACON_SCRUB_MORPH_DURATION);
      }, CONFIG.BEACON_SCRUB_LONG_PRESS_DELAY);
    };
    
    const handleScrubTouchMove = (e) => {
      if (!isScrubbing) {
        // Si on bouge avant la fin du long press, annuler
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        return;
      }
      
      const touch = e.touches[0];
      const containerRect = effectivePortalRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 300, height: 500 };
      const arcRadius = (containerRect.height * CONFIG.BEACON_SCRUB_ARC_SIZE / 100) / 2;
      const centerX = containerRect.left + containerRect.width * CONFIG.BEACON_SCRUB_ARC_X / 100;
      const centerY = containerRect.top + containerRect.height * CONFIG.BEACON_SCRUB_ARC_Y / 100;
      
      // Calculer l'angle du doigt par rapport au centre de l'arc
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      let angle = Math.atan2(dy, dx); // -π à π
      
      // Limiter à l'arc droit (-π/2 à +π/2)
      angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle));
      
      // Convertir l'angle en index de chanson
      const progress = (angle + Math.PI / 2) / Math.PI; // 0 à 1
      const newIndex = Math.round(progress * (queue.length - 1));
      setScrubIndex(Math.max(0, Math.min(queue.length - 1, newIndex)));
    };
    
    const handleScrubTouchEnd = () => {
      const wasLongPressActive = longPressTimerRef.current !== null;
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      // Si le long press n'a pas été déclenché, c'est un tap court → NEXT
      if (wasLongPressActive && !isScrubbing) {
        playNext();
        return;
      }
      
      if (isScrubbing) {
        // Scroll animé vers la chanson sélectionnée
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: scrubIndex * itemHeight, behavior: 'smooth' });
          setScrollTop(scrubIndex * itemHeight);
        }
        if (scrubMorphTimeoutRef.current) {
          clearTimeout(scrubMorphTimeoutRef.current);
          scrubMorphTimeoutRef.current = null;
        }
        setScrubMorphProgress(0);
        setIsScrubMorphing(false);
        setIsScrubbing(false);
      }
    };
  
    const currentIndex = queue.findIndex(s => s === currentSong);

    return (
        <div className="relative w-full flex-1" style={{ height: containerHeight, minHeight: containerHeight }}>
    
        <style>{styles}</style>
        
        {/* NEON BEACON - Capsule loupe avec indicateur de position */}
        {(() => {
          // Dimensions IDENTIQUES à ControlCapsule
          const beaconHeightVh = isMini ? CONFIG.CAPSULE_HEIGHT_MINI_VH : CONFIG.CAPSULE_HEIGHT_VH;
          const beaconHeightPx = window.innerHeight * beaconHeightVh / 100;
          const borderRadius = beaconHeightPx / 2; // Capsule = stadium shape
          const horizontalMarginPercent = (100 - CONFIG.CAPSULE_WIDTH_PERCENT) / 2;
          
          // Position de la sélection
          const selectedIndex = Math.round(scrollTop / itemHeight);
          const totalSongs = queue.length;
          
          // Notifier le parent de l'index centré
          useEffect(() => {
            if (onCenteredIndexChange) {
              onCenteredIndexChange(selectedIndex);
            }
          }, [selectedIndex, onCenteredIndexChange]);
          const progress = totalSongs > 1 ? selectedIndex / (totalSongs - 1) : 0.5;
          
          // Le point parcourt UNIQUEMENT le demi-cercle DROIT (de -90° à +90°)
          // Angle en radians : -π/2 (haut) à +π/2 (bas)
          const angle = -Math.PI / 2 + progress * Math.PI;
          
          // Coordonnées du point sur le demi-cercle droit
          // Centre du demi-cercle = bord droit de la capsule moins borderRadius
          const dotX = borderRadius * Math.cos(angle);
          const dotY = borderRadius * Math.sin(angle);
          
          return (
            <>
              {/* NEON - Bordure jaune néon (AU-DESSUS de la capsule) */}
              <div 
                ref={beaconNeonRef}
                className="absolute pointer-events-none transition-opacity duration-150"
                style={{ 
                  left: `${horizontalMarginPercent}%`,
                  right: `${horizontalMarginPercent}%`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: `${beaconHeightVh}vh`,
                  borderRadius: borderRadius,
                  border: `${CONFIG.BEACON_NEON_WIDTH}px solid rgba(${CONFIG.BEACON_NEON_COLOR}, ${CONFIG.BEACON_NEON_OPACITY})`,
                  boxShadow: `0 0 ${CONFIG.BEACON_NEON_GLOW_SIZE}px rgba(${CONFIG.BEACON_NEON_COLOR}, ${CONFIG.BEACON_NEON_GLOW_OPACITY}), 0 0 ${CONFIG.BEACON_NEON_GLOW_SIZE * 2}px rgba(${CONFIG.BEACON_NEON_COLOR}, ${CONFIG.BEACON_NEON_GLOW_OPACITY / 2})`,
                  zIndex: CONFIG.BEACON_NEON_Z,
                }}
              />
              
              {/* PULSE - Point indicateur (EN-DESSOUS de la capsule) */}
              {totalSongs > 0 && (
                <div 
                  className="absolute pointer-events-none beacon-dot rounded-full"
                  style={{ 
                    right: `calc(${horizontalMarginPercent}% + ${borderRadius - dotX - CONFIG.BEACON_PULSE_SIZE / 2}px)`,
                    top: `calc(50% + ${dotY}px - ${CONFIG.BEACON_PULSE_SIZE / 2}px)`,
                    width: CONFIG.BEACON_PULSE_SIZE,
                    height: CONFIG.BEACON_PULSE_SIZE,
                    backgroundColor: `rgb(${CONFIG.BEACON_PULSE_COLOR})`,
                    zIndex: CONFIG.BEACON_PULSE_Z
                  }}
                />
              )}
              
              {/* Zone de touch pour déclencher le scrubbing (demi-cercle droit) */}
              {canScrub && (
                <div 
                  className="absolute z-25"
                  style={{ 
                    right: `${horizontalMarginPercent}%`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: borderRadius + 20,
                    height: beaconHeightPx + 20,
                    borderRadius: `0 ${borderRadius + 10}px ${borderRadius + 10}px 0`,
                  }}
                  onTouchStart={handleScrubTouchStart}
                  onTouchMove={handleScrubTouchMove}
                  onTouchEnd={handleScrubTouchEnd}
                />
              )}
            </>
          );
        })()}
        
        {/* OVERLAY SCRUBBING - version simple sans morph */}
        {isScrubbing && effectivePortalRef.current && ReactDOM.createPortal((() => {
          const portalRect = effectivePortalRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 300, height: 500 };
          const containerRect = portalRect;

          // Position fixe au centre (pas de morph)
          const arcRadius = (containerRect.height * CONFIG.BEACON_SCRUB_ARC_SIZE / 100) / 2;
          const centerX = containerRect.width * CONFIG.BEACON_SCRUB_ARC_X / 100;
          const centerY = containerRect.height * CONFIG.BEACON_SCRUB_ARC_Y / 100;
          const thickness = CONFIG.BEACON_SCRUB_ARC_THICKNESS;

          const totalSongs = queue.length;

          // Position du point sélectionné (cyan)
          const selectedProgress = totalSongs > 1 ? scrubIndex / (totalSongs - 1) : 0.5;
          const selectedAngle = -Math.PI / 2 + selectedProgress * Math.PI;
          const selectedX = centerX + arcRadius * Math.cos(selectedAngle);
          const selectedY = centerY + arcRadius * Math.sin(selectedAngle);

          // Position du point en lecture (rose)
          const playingProgress = totalSongs > 1 ? currentIndex / (totalSongs - 1) : 0.5;
          const playingAngle = -Math.PI / 2 + playingProgress * Math.PI;
          const playingX = centerX + arcRadius * Math.cos(playingAngle);
          const playingY = centerY + arcRadius * Math.sin(playingAngle);

          // Position des extrémités (début = haut, fin = bas)
          const startX = centerX + arcRadius * Math.cos(-Math.PI / 2);
          const startY = centerY + arcRadius * Math.sin(-Math.PI / 2);
          const endX = centerX + arcRadius * Math.cos(Math.PI / 2);
          const endY = centerY + arcRadius * Math.sin(Math.PI / 2);

          const scrubSong = queue[scrubIndex];

          // Couleurs depuis CONFIG
          const tubeColor = CONFIG.BEACON_SCRUB_TUBE_COLOR;
          const tubeGlowColor = CONFIG.BEACON_SCRUB_TUBE_GLOW_COLOR;
          const bubbleColor = CONFIG.BEACON_SCRUB_BUBBLE_COLOR;

          return (
            <div
              className="absolute inset-0 z-[100] flex items-center justify-center"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${CONFIG.BEACON_SCRUB_OVERLAY_OPACITY})`,
              }}
              onTouchMove={handleScrubTouchMove}
              onTouchEnd={handleScrubTouchEnd}
            >
              {/* DEBUG: Capsule verte (test positionnement avec variables px) */}
              {(() => {
                const dpr = window.devicePixelRatio;
                const screenRealPx = window.innerHeight * dpr;
                const headerPx = getPlayerHeaderHeightPx();
                const footerPx = getPlayerFooterHeightPx();
                const beaconPx = getBeaconHeightPx();
                const zonePx = screenRealPx - headerPx - footerPx;
                // Convertir en pixels CSS pour le positionnement
                const topCss = (headerPx + zonePx / 2 - beaconPx / 2) / dpr;
                const heightCss = beaconPx / dpr;
                // Lire safe-area-inset-top directement
                const safeDiv = document.createElement('div');
                safeDiv.style.position = 'fixed';
                safeDiv.style.top = '0';
                safeDiv.style.height = 'env(safe-area-inset-top, 0px)';
                safeDiv.style.visibility = 'hidden';
                document.body.appendChild(safeDiv);
                const safeAreaTopCss = safeDiv.getBoundingClientRect().height;
                document.body.removeChild(safeDiv);
                const safeAreaTopReal = safeAreaTopCss * dpr;
                // Lire safe-area-inset-bottom
                const safeDivBottom = document.createElement('div');
                safeDivBottom.style.position = 'fixed';
                safeDivBottom.style.bottom = '0';
                safeDivBottom.style.height = 'env(safe-area-inset-bottom, 0px)';
                safeDivBottom.style.visibility = 'hidden';
                document.body.appendChild(safeDivBottom);
                const safeAreaBottomCss = safeDivBottom.getBoundingClientRect().height;
                document.body.removeChild(safeDivBottom);
                return (
                  <>
                    {/* DEBUG: Zone safe area TOP (rouge) */}
                    <div
                      className="absolute left-0 right-0 top-0"
                      style={{
                        height: safeAreaTopCss,
                        backgroundColor: 'rgba(255, 0, 0, 0.5)',
                      }}
                    />
                    {/* DEBUG: Zone safe area BOTTOM (rouge) */}
                    <div
                      className="absolute left-0 right-0 bottom-0"
                      style={{
                        height: safeAreaBottomCss,
                        backgroundColor: 'rgba(255, 0, 0, 0.5)',
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: `${(100 - CONFIG.CAPSULE_WIDTH_PERCENT) / 2}%`,
                        right: `${(100 - CONFIG.CAPSULE_WIDTH_PERCENT) / 2}%`,
                        top: topCss,
                        height: heightCss,
                        backgroundColor: 'rgba(34, 197, 94, 0.3)',
                        border: `${1 / dpr}px solid rgba(34, 197, 94, 1)`,
                      }}
                    />
                    {/* DEBUG: Overlay valeurs */}
                    <div
                      className="absolute left-4 right-4 bg-black/80 text-white text-xs p-2 rounded"
                      style={{ bottom: '25%' }}
                    >
                      <div>SafeTop: {safeAreaTopReal.toFixed(1)} real px ({safeAreaTopCss.toFixed(1)} css)</div>
                      <div>Header: {headerPx.toFixed(1)} real px</div>
                      <div>Footer: {footerPx.toFixed(1)} real px</div>
                      <div>Beacon: {beaconPx.toFixed(1)} real px</div>
                      <div>Zone: {zonePx.toFixed(1)} real px</div>
                      <div>Screen: {screenRealPx.toFixed(1)} real px</div>
                      <div>DPR: {dpr}</div>
                    </div>
                  </>
                );
              })()}
              {/* Tube rempli avec glow */}
              <svg
                className="absolute"
                style={{
                  left: centerX - arcRadius - 20,
                  top: centerY - arcRadius - 20,
                  width: arcRadius * 2 + 40,
                  height: arcRadius * 2 + 40,
                }}
              >
                <defs>
                  <filter id="tubeGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge>
                      <feMergeNode in="blur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {/* Tube externe (glow) */}
                <path
                  className="scrub-tube-glow"
                  d={`M ${arcRadius + 20} ${20} A ${arcRadius} ${arcRadius} 0 0 1 ${arcRadius + 20} ${arcRadius * 2 + 20}`}
                  fill="none"
                  stroke={tubeGlowColor}
                  strokeWidth={thickness + CONFIG.BEACON_SCRUB_TUBE_GLOW_SIZE}
                  strokeLinecap="round"
                  filter="url(#tubeGlow)"
                />
                {/* Tube interne (rempli) */}
                <path
                  d={`M ${arcRadius + 20} ${20} A ${arcRadius} ${arcRadius} 0 0 1 ${arcRadius + 20} ${arcRadius * 2 + 20}`}
                  fill="none"
                  stroke={tubeColor}
                  strokeWidth={thickness}
                  strokeLinecap="round"
                />
              </svg>

              {/* Capsule début "1" */}
              <div
                className="absolute flex items-center justify-center rounded-full font-bold"
                style={{
                  left: startX - CONFIG.BEACON_SCRUB_BUBBLE_SIZE / 2,
                  top: startY - CONFIG.BEACON_SCRUB_BUBBLE_SIZE / 2,
                  width: CONFIG.BEACON_SCRUB_BUBBLE_SIZE,
                  height: CONFIG.BEACON_SCRUB_BUBBLE_SIZE,
                  backgroundColor: bubbleColor,
                  color: CONFIG.BEACON_SCRUB_BUBBLE_TEXT_COLOR,
                  fontSize: CONFIG.BEACON_SCRUB_BUBBLE_FONT_SIZE,
                  boxShadow: `0 0 8px ${tubeGlowColor}`,
                }}
              >
                1
              </div>

              {/* Capsule fin "N" */}
              <div
                className="absolute flex items-center justify-center rounded-full font-bold"
                style={{
                  left: endX - CONFIG.BEACON_SCRUB_BUBBLE_SIZE / 2,
                  top: endY - CONFIG.BEACON_SCRUB_BUBBLE_SIZE / 2,
                  width: CONFIG.BEACON_SCRUB_BUBBLE_SIZE,
                  height: CONFIG.BEACON_SCRUB_BUBBLE_SIZE,
                  backgroundColor: bubbleColor,
                  color: CONFIG.BEACON_SCRUB_BUBBLE_TEXT_COLOR,
                  fontSize: CONFIG.BEACON_SCRUB_BUBBLE_FONT_SIZE,
                  boxShadow: `0 0 8px ${tubeGlowColor}`,
                }}
              >
                {totalSongs}
              </div>

              {/* Point chanson en lecture (rose) */}
              <div
                className="absolute rounded-full"
                style={{
                  left: playingX - CONFIG.BEACON_SCRUB_PLAYING_SIZE / 2,
                  top: playingY - CONFIG.BEACON_SCRUB_PLAYING_SIZE / 2,
                  width: CONFIG.BEACON_SCRUB_PLAYING_SIZE,
                  height: CONFIG.BEACON_SCRUB_PLAYING_SIZE,
                  backgroundColor: CONFIG.BEACON_SCRUB_PLAYING_COLOR,
                  boxShadow: `0 0 10px ${CONFIG.BEACON_SCRUB_PLAYING_GLOW}`,
                }}
              />

              {/* Point sélection (cyan) - le plus gros */}
              <div
                className="absolute rounded-full"
                style={{
                  left: selectedX - CONFIG.BEACON_SCRUB_SELECTED_SIZE / 2,
                  top: selectedY - CONFIG.BEACON_SCRUB_SELECTED_SIZE / 2,
                  width: CONFIG.BEACON_SCRUB_SELECTED_SIZE,
                  height: CONFIG.BEACON_SCRUB_SELECTED_SIZE,
                  backgroundColor: CONFIG.BEACON_SCRUB_SELECTED_COLOR,
                  boxShadow: `0 0 12px ${CONFIG.BEACON_SCRUB_SELECTED_GLOW}`,
                }}
              />

              {/* Texte au centre : titre, artiste, numéro */}
              <div
                className="absolute text-center text-white flex flex-col items-center justify-center"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  maxWidth: '70%',
                }}
              >
                <div
                  className="font-black truncate w-full"
                  style={{ fontSize: CONFIG.BEACON_SCRUB_TEXT_SIZE + 4 }}
                >
                  {scrubSong?.title || ''}
                </div>
                <div
                  className="text-pink-400 font-medium mt-1 truncate w-full"
                  style={{ fontSize: CONFIG.BEACON_SCRUB_TEXT_SIZE - 2 }}
                >
                  {scrubSong?.artist || ''}
                </div>
                <div
                  className="text-gray-400 mt-2 font-mono"
                  style={{ fontSize: CONFIG.BEACON_SCRUB_COUNTER_SIZE }}
                >
                  {scrubIndex + 1} / {totalSongs}
                </div>
              </div>
            </div>
          );
        })(), effectivePortalRef.current)}
        
        {/* Bouton Play/Pause - INDÉPENDANT pour z-index correct */}
        <button 
            onClick={() => togglePlay()} 
            className={`absolute left-1/2 z-30 w-8 h-8 rounded-full flex items-center justify-center shadow-md border border-white transition-colors duration-300 ${isPlaying ? 'bg-pink-500 text-white' : 'bg-white text-gray-400 border-gray-200'}`} 
            style={{ 
                transform: 'translateX(-50%)',
                top: `calc(50% - ${(isMini ? CONFIG.CAPSULE_HEIGHT_MINI_VH : CONFIG.CAPSULE_HEIGHT_VH) / 2}vh - 16px)`
            }}
        >
            {isPlaying ? (
                <Disc3 size={20} className="animate-spin-slow" />
            ) : (
                <Pause size={14} />
            )}
        </button>

        {/* Container scrollable avec mask CSS */}
        <div 
          ref={containerRef} 
          onScroll={handleScroll} 
          className="h-full overflow-y-auto overflow-x-hidden no-scrollbar relative z-5"
          style={{ ...wheelMaskStyle }}
        >
          {/* Conteneur avec hauteur totale pour le scroll */}
          <div style={{ height: centerPadding + queue.length * itemHeight + centerPadding, position: 'relative' }}>
          {(() => {
            const threshold = CONFIG.WHEEL_CENTER_THRESHOLD;
            const baseIndex = Math.floor(scrollTop / itemHeight);
            const scrollProgress = (scrollTop / itemHeight) - baseIndex;
            
            let nearestIndex;
            if (scrollDirectionRef.current === 'down') {
              nearestIndex = scrollProgress >= threshold ? baseIndex + 1 : baseIndex;
            } else {
              nearestIndex = scrollProgress > (1 - threshold) ? baseIndex + 1 : baseIndex;
            }
            nearestIndex = Math.max(0, Math.min(queue.length - 1, nearestIndex));
            
            // VIRTUALISATION : ne rendre que les éléments visibles + buffer
            const buffer = CONFIG.WHEEL_VIRTUALIZATION_BUFFER;
            const visibleCount = Math.ceil(containerHeight / itemHeight);
            const startIndex = Math.max(0, baseIndex - buffer);
            const endIndex = Math.min(queue.length - 1, baseIndex + visibleCount + buffer);
            
            const elements = [];
            for (let index = startIndex; index <= endIndex; index++) {
              const song = queue[index];
              const isCurrent = currentSong === song;
              const isCenter = index === nearestIndex;
              
              if (isCurrent) { 
                elements.push(
                  <div 
                    key={`${song.id}-${index}`} 
                    className="snap-center flex items-center justify-center w-full absolute"
                    style={{ height: itemHeight, top: centerPadding + index * itemHeight }}
                  >
                    <ControlCapsule 
                      song={song} 
                      isPlaying={isPlaying} 
                      togglePlay={togglePlay} 
                      playPrev={playPrev} 
                      playNext={playNext} 
                      queueIndex={index} 
                      queueLength={queue.length} 
                      variant={isMini ? 'dashboard' : 'main'}
                      audioLevel={audioLevel}
                    />
                  </div>
                ); 
              } else {
                elements.push(
                  <SwipeableSongRow 
                    key={`${song.id}-${index}`} 
                    song={song} 
                    index={index} 
                    isVisualCenter={isCenter} 
                    queueLength={queue.length} 
                    itemHeight={itemHeight} 
                    isMini={isMini} 
                    scrollTop={scrollTop}
                    containerHeight={containerHeight}
                    centerPadding={centerPadding}
                    onClick={() => onSongSelect(song)} 
                    onSwipeRight={(s) => onReorder(s, 'next')} 
                    onSwipeLeft={(s) => onReorder(s, 'archive')} 
                  />
                );
              }
            }
            return elements;
          })()}
          </div>
        </div>
      </div>
    );
  };

// --- MAIN APP ---
export default function App() {
    // ===== TOUS LES useState EN PREMIER =====
    const [playlists, setPlaylists] = useState(null);
    const [currentTime, setCurrentTime] = useState('');
    const [isOnRealDevice, setIsOnRealDevice] = useState(false);
    const [safeAreaBottom, setSafeAreaBottom] = useState(0);

    // Lire safe-area-inset-bottom au démarrage
    useEffect(() => {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.bottom = '0';
        div.style.height = 'env(safe-area-inset-bottom, 0px)';
        div.style.visibility = 'hidden';
        document.body.appendChild(div);
        const height = div.getBoundingClientRect().height;
        document.body.removeChild(div);
        setSafeAreaBottom(height);
    }, []);

    // Détecter si on est sur un vrai appareil mobile/PWA
    useEffect(() => {
        setIsOnRealDevice(isRealDevice());
    }, []);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSong, setCurrentSong] = useState(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const triggerFeedbackValidation = () => {
        if (feedback) {
            setFeedback(prev => prev ? { ...prev, triggerValidation: Date.now() } : null);
        }
    };
    const [volume, setVolume] = useState(70);
    const [isVolumeActive, setIsVolumeActive] = useState(false);
    const [volumePreview, setVolumePreview] = useState(70);
    const [volumeMorphProgress, setVolumeMorphProgress] = useState(0); // 0 = beacon, 1 = tube
    const volumeLongPressRef = useRef(null);
    const volumeStartYRef = useRef(null);
    const volumeBeforeMuteRef = useRef(70);
    const volumeFadeIntervalRef = useRef(null);
    const volumeMorphTimeoutRef = useRef(null);
    const [volumeBeaconRect, setVolumeBeaconRect] = useState(null); // Coordonnées du beacon capturées au touchStart
    const [showFullPlayer, setShowFullPlayer] = useState(false);
    const [playerVisible, setPlayerVisible] = useState(false);           // Animation d'entrée
    const [playerOpenAnimating, setPlayerOpenAnimating] = useState(false); // En cours d'ouverture
    const [playerSwipeY, setPlayerSwipeY] = useState(0);
    const [playerTouchStartY, setPlayerTouchStartY] = useState(null);
    const [isPlayerClosing, setIsPlayerClosing] = useState(false);
    const [playerStartY, setPlayerStartY] = useState(null); // Position Y de départ du player (en px)
    const [playerCloseY, setPlayerCloseY] = useState(null); // Position Y de fermeture du player (en px)
    const [playerFadeOpacity, setPlayerFadeOpacity] = useState(1); // Opacité du player (1 = visible, 0 = invisible)
    const [drawerCenteredIndex, setDrawerCenteredIndex] = useState(0); // Index de la chanson centrée dans le tiroir
    const [playerCenteredIndex, setPlayerCenteredIndex] = useState(0); // Index de la chanson centrée dans le player
    const [cardsAnimKey, setCardsAnimKey] = useState(0); // Clé pour déclencher l'animation des cartes
    const [cardsAnimDelay, setCardsAnimDelay] = useState(0); // Délai avant de démarrer l'animation (ms)
    // Fonction pour ouvrir le player avec animation (slide up)
    const openFullPlayer = useCallback((startY = null) => {
      // Si on a une position de départ (depuis le tiroir), on la stocke
      setPlayerStartY(startY);
      setShowFullPlayer(true);
      setPlayerOpenAnimating(true);
      requestAnimationFrame(() => {
          requestAnimationFrame(() => {
              setPlayerVisible(true);
              // Reset la position de départ après le début de l'animation
              setPlayerStartY(null);
          });
      });
      setTimeout(() => {
          setPlayerOpenAnimating(false);
      }, CONFIG.PLAYER_SLIDE_DURATION);
  }, []);

  // Mesurer la hauteur du header du player
  useEffect(() => {
    if (playerHeaderRef.current && showFullPlayer) {
        const measureHeader = () => {
            if (playerHeaderRef.current) {
                const height = playerHeaderRef.current.offsetHeight;
                setPlayerHeaderHeight(height);
            }
        };
        measureHeader();
        const resizeObserver = new ResizeObserver(measureHeader);
        resizeObserver.observe(playerHeaderRef.current);
        return () => resizeObserver.disconnect();
    }
  }, [showFullPlayer]);

  // Mesurer la hauteur disponible pour la roue
  useEffect(() => {
    if (songWheelWrapperRef.current && showFullPlayer) {
        const measureWrapper = () => {
            if (songWheelWrapperRef.current) {
                const height = songWheelWrapperRef.current.offsetHeight;
                setWheelWrapperHeight(height);
            }
        };
        measureWrapper();
        const resizeObserver = new ResizeObserver(measureWrapper);
        resizeObserver.observe(songWheelWrapperRef.current);
        return () => resizeObserver.disconnect();
    }
  }, [showFullPlayer]);
  
  // Fonction pour fermer le player avec animation (slide down jusqu'à position tiroir)
  const closeFullPlayer = useCallback(() => {
    // Calculer la position Y finale (là où le tiroir va apparaître)
    const containerHeight = mainContainerRef.current?.offsetHeight || window.innerHeight;
    const footerHeight = getFooterHeight();
    const drawerHeight = containerHeight * CONFIG.DRAWER_DEFAULT_HEIGHT_PERCENT / 100;
    const targetY = containerHeight - footerHeight - drawerHeight;
    
    setPlayerCloseY(targetY);
    setIsPlayerClosing(true);
    setPlayerVisible(false);
    
    // Lancer le fade out
    if (CONFIG.PLAYER_FADE_OUT_ENABLED) {
        setPlayerFadeOpacity(CONFIG.PLAYER_FADE_OUT_MIN_OPACITY);
    }
    
    // Faire apparaître le tiroir IMMÉDIATEMENT (caché par le player, révélé par le fade)
    if (mainContainerRef.current) {
        setDashboardHeight(mainContainerRef.current.offsetHeight * (CONFIG.DRAWER_DEFAULT_HEIGHT_PERCENT / 100));
    }
    
    setTimeout(() => {
        setShowFullPlayer(false);
        setIsPlayerClosing(false);
        setPlayerCloseY(null);
        setPlayerFadeOpacity(1); // Reset l'opacité pour la prochaine ouverture
    }, CONFIG.PLAYER_SLIDE_DURATION);
}, []);

// Handlers pour le swipe down du player
const handlePlayerTouchStart = (e) => {
    setPlayerTouchStartY(e.touches[0].clientY);
};

const handlePlayerTouchMove = (e) => {
    if (playerTouchStartY === null) return;
    const diff = e.touches[0].clientY - playerTouchStartY;
    // Seulement vers le bas (diff positif)
    setPlayerSwipeY(Math.max(0, diff));
};

const handlePlayerTouchEnd = () => {
    const containerHeight = mainContainerRef.current?.offsetHeight || window.innerHeight;
    const threshold = containerHeight * CONFIG.PLAYER_SWIPE_CLOSE_THRESHOLD_PERCENT / 100;
    
    if (playerSwipeY >= threshold) {
        // Seuil atteint → fermer
        closeFullPlayer();
    }
    setPlayerSwipeY(0);
    setPlayerTouchStartY(null);
};

    const [scrollTrigger, setScrollTrigger] = useState(0);
    const [showBuilder, setShowBuilder] = useState(false);
    const [builderBtnIgniting, setBuilderBtnIgniting] = useState(false);
    const [isPlayerSearching, setIsPlayerSearching] = useState(false);
    const [playerSearchQuery, setPlayerSearchQuery] = useState('');
    const [isLibrarySearching, setIsLibrarySearching] = useState(false);
    const [librarySearchQuery, setLibrarySearchQuery] = useState('');
    const [searchOverlayAnim, setSearchOverlayAnim] = useState('none'); // 'none' | 'opening' | 'closing'
    const [searchCloseBtnAnimKey, setSearchCloseBtnAnimKey] = useState(0);
    const [playerSearchOverlayAnim, setPlayerSearchOverlayAnim] = useState('none');
    const [playerSearchCloseBtnAnimKey, setPlayerSearchCloseBtnAnimKey] = useState(0);
    const folderInputRef = useRef(null);
    const folderButtonRef = useRef(null);
    const headerButtonsRef = useRef(null);
    const [folderRect, setFolderRect] = useState(null);
    
    const folderButtonCallbackRef = (el) => {
        if (el) {
            folderButtonRef.current = el;
        }
    };

    const dropboxButtonRef = useRef(null);
    const [dropboxSourceRect, setDropboxSourceRect] = useState(null);
    const [showVolumeOverlay, setShowVolumeOverlay] = useState(false);
    const [dashboardHeight, setDashboardHeight] = useState(0);
    const [showMainPlayerTrigger, setShowMainPlayerTrigger] = useState(false);
    const [mainPlayerTriggerOpacity, setMainPlayerTriggerOpacity] = useState(0);
    const drawerTopPercentRef = useRef(100);
    const [isInTriggerZone, setIsInTriggerZone] = useState(false);
    const isDraggingDrawer = useRef(false);
    const lastOpacityRef = useRef(0);
    const [activeFilter, setActiveFilter] = useState('initialShuffle');
    const [sortDirection, setSortDirection] = useState('asc');
    const [queue, setQueue] = useState([]);
    const [activeVibeName, setActiveVibeName] = useState(null);
    const [initialRandomQueue, setInitialRandomQueue] = useState([]);
    const [pendingVibe, setPendingVibe] = useState(null);
    const [showImportMenu, setShowImportMenu] = useState(false);
    const [importMenuVisible, setImportMenuVisible] = useState(false);
    const [importOverlayAnim, setImportOverlayAnim] = useState('none'); // 'none', 'opening', 'closing'
    const [importButtonsReady, setImportButtonsReady] = useState(false);
    const [pendingImportAction, setPendingImportAction] = useState(null);
    const [importBtnIgniting, setImportBtnIgniting] = useState(null); // 'nuke' | 'dropbox' | 'folder' | null
    const [showDropboxBrowser, setShowDropboxBrowser] = useState(false);
    const [dropboxToken, setDropboxToken] = useState(() => localStorage.getItem('dropbox_access_token') || localStorage.getItem('dropbox_token'));
    const [dropboxPath, setDropboxPath] = useState('');
    const [dropboxFiles, setDropboxFiles] = useState([]);
    const [dropboxLoading, setDropboxLoading] = useState(false);
    const [pendingDropboxData, setPendingDropboxData] = useState(null);
    const [nukeConfirmMode, setNukeConfirmMode] = useState(false);
    const [confirmOverlayVisible, setConfirmOverlayVisible] = useState(false);
    const [confirmFeedback, setConfirmFeedback] = useState(null); // { text, type, triggerValidation }
    const [confirmSwipeX, setConfirmSwipeX] = useState(0); // Swipe X position for confirmation overlay
    const [confirmSwipeStart, setConfirmSwipeStart] = useState(null); // Touch start X
    const [showTweaker, setShowTweaker] = useState(false);
    const [isDrawerAnimating, setIsDrawerAnimating] = useState(false);
    
    // Quand le Tweaker s'ouvre, animer le drawer vers sa hauteur Tweaker
    useEffect(() => {
      if (showTweaker && mainContainerRef.current) {
          setIsDrawerAnimating(true);
          setDashboardHeight(mainContainerRef.current.offsetHeight * (CONFIG.DRAWER_TWEAKER_HEIGHT_PERCENT / 100));
          setTimeout(() => {
            setIsDrawerAnimating(false);
        }, CONFIG.DRAWER_TWEAKER_ANIMATION_DURATION);
      }
  }, [showTweaker]);
    const [vibeColorIndices, setVibeColorIndices] = useState({});
    const [vibeSwipePreview, setVibeSwipePreview] = useState(null); // { direction, progress, nextGradient }
    const [blinkingVibe, setBlinkingVibe] = useState(null); // Nom de la vibe en cours d'animation
    const [vibeTheseGradientIndex, setVibeTheseGradientIndex] = useState(0); // Index du dégradé pour VIBE THESE
    const importMenuTimer = useRef(null);

    // ===== TOUS LES useRef ENSUITE =====
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const gainNodeRef = useRef(null);
    const mediaSourceRef = useRef(null);
    const fadeInterval = useRef(null);
    // Initialiser Web Audio API pour contrôle volume iOS
    const initAudioContext = useCallback(() => {
      if (audioContextRef.current || !audioRef.current) return;
      
      try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          audioContextRef.current = new AudioContext();
          gainNodeRef.current = audioContextRef.current.createGain();
          mediaSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          
          // Pipeline: audio element → gain node → speakers
          mediaSourceRef.current.connect(gainNodeRef.current);
          gainNodeRef.current.connect(audioContextRef.current.destination);
          
          // Appliquer le volume actuel
          gainNodeRef.current.gain.value = volume / 100;
      } catch (e) {
          console.warn('Web Audio API not supported:', e);
      }
  }, [volume]);
    const savedVolume = useRef(50);
    const dragStartY = useRef(null);
    const startHeight = useRef(0);
    const drawerRafRef = useRef(null);
    const pendingDrawerHeight = useRef(null);
    const mainContainerRef = useRef(null);
    const dashboardRef = useRef(null);
    const beaconNeonRef = useRef(null);
    const drawerBeaconRef = useRef(null);
    const songWheelWrapperRef = useRef(null);
    const playerHeaderRef = useRef(null);
    const [playerHeaderHeight, setPlayerHeaderHeight] = useState(0);
    const [wheelWrapperHeight, setWheelWrapperHeight] = useState(0);
    
    const filteredPlayerQueue = React.useMemo(() => {
        if (!playerSearchQuery) return queue;
        const lowerQ = playerSearchQuery.toLowerCase();
        return queue.filter(s => s.title.toLowerCase().includes(lowerQ) || s.artist.toLowerCase().includes(lowerQ));
    }, [queue, playerSearchQuery]);
  
    const allGlobalSongs = React.useMemo(() => {
      if (!playlists) return []; // <-- Voici la correction !
      let songs = [];
      // On s'assure que chaque "list" est bien un tableau avant de le déverser
      Object.values(playlists).forEach(list => {
          if (Array.isArray(list)) {
              songs = [...songs, ...list];
          }
      });
      return Array.from(new Map(songs.map(s => [s.id, s])).values());
    }, [playlists]);
  
  
    const librarySearchResults = React.useMemo(() => {
        if (!librarySearchQuery) return [];
        const lowerQ = librarySearchQuery.toLowerCase();
        return allGlobalSongs.filter(s => isSongAvailable(s) && (s.title.toLowerCase().includes(lowerQ) || s.artist.toLowerCase().includes(lowerQ)));
    }, [librarySearchQuery, allGlobalSongs]);
    
// 1. CHARGEMENT AU DÉMARRAGE
useEffect(() => {
  const savedPlaylists = localStorage.getItem('vibes_playlists');
  
  let initialPlaylists = {};
  if (savedPlaylists) {
    try {
      const parsed = JSON.parse(savedPlaylists);
      Object.keys(parsed).forEach(key => {
        initialPlaylists[key] = parsed[key].map(song => ({ ...song, file: null }));
      });
    } catch (e) {
      console.error("Erreur de parsing des playlists, on repart de zéro.", e);
      initialPlaylists = {};
    }
  }

  if (Object.keys(initialPlaylists).length === 0) {
    initialPlaylists = {
      "Beach": [ { id: 'd1', title: "Sunny Day", artist: "Vibe Masters", playCount: 12, file: null, duration: "3:45", type: 'folder' } ],
      "Chill Vibes": [ { id: 'c1', title: "Night Drive", artist: "Synthwave Boy", playCount: 8, file: null, duration: "3:20", type: 'folder' } ],
      "My Top": [ { id: 'v1', title: "Favorites", artist: "Various", playCount: 0, file: null, duration: "0:00", type: 'vibe' } ]
    };
  }
  setPlaylists(initialPlaylists);
  
  // Charger les playCounts sauvegardés et les merger
  const savedPlayCounts = localStorage.getItem('vibes_playcounts');
  if (savedPlayCounts) {
    try {
      const playCountsMap = JSON.parse(savedPlayCounts);
      // Merger les playCounts avec les playlists
      Object.keys(initialPlaylists).forEach(key => {
        initialPlaylists[key] = initialPlaylists[key].map(song => {
          if (playCountsMap[song.id] !== undefined) {
            return { ...song, playCount: playCountsMap[song.id] };
          }
          return song;
        });
      });
      setPlaylists({...initialPlaylists});
    } catch (e) {
      console.error("Erreur parsing playCounts", e);
    }
  }
  
  // Charger les indices de couleur sauvegardés
  const savedColorIndices = localStorage.getItem('vibes_color_indices');
  if (savedColorIndices) {
    try {
      setVibeColorIndices(JSON.parse(savedColorIndices));
    } catch (e) {
      console.error("Erreur parsing color indices", e);
    }
  } else {
    // Première fois : attribuer des couleurs uniques à chaque playlist existante
    initializeGradientUsage(null); // Reset compteur
    const initialColors = {};
    Object.keys(initialPlaylists).forEach(name => {
      initialColors[name] = getNextAvailableGradientIndex();
    });
    setVibeColorIndices(initialColors);
  }
}, []);

// 2. SAUVEGARDE AUTOMATIQUE
useEffect(() => {
    if (playlists !== null) {
    const playlistsToSave = {};
    Object.keys(playlists).forEach(key => {
      playlistsToSave[key] = playlists[key].map(song => {
        const { file, ...songWithoutFile } = song;
        return songWithoutFile;
      });
    });
    localStorage.setItem('vibes_playlists', JSON.stringify(playlistsToSave));
  }
}, [playlists]);

// 2b. SAUVEGARDE DES PLAYCOUNTS (séparée pour robustesse)
useEffect(() => {
  if (playlists !== null) {
    const playCountsMap = {};
    Object.values(playlists).forEach(playlist => {
      playlist.forEach(song => {
        if (song.playCount > 0) {
          playCountsMap[song.id] = song.playCount;
        }
      });
    });
    localStorage.setItem('vibes_playcounts', JSON.stringify(playCountsMap));
  }
}, [playlists]);

// 2c. SAUVEGARDE DES COULEURS
useEffect(() => {
  if (Object.keys(vibeColorIndices).length > 0) {
    localStorage.setItem('vibes_color_indices', JSON.stringify(vibeColorIndices));
  }
}, [vibeColorIndices]);

  // AUDIO FADING UTILS
  // Durée du fade out pour kill vibe (en secondes pour Web Audio API)
  const FADE_OUT_DURATION_SEC = 0.25;

  // Fade out avec callback quand terminé (utilise Web Audio API pour un fade lisse)
  const fadeOutAndStop = (onComplete) => {
    if (!audioRef.current) {
        onComplete?.();
        return;
    }

    if (audioRef.current.paused) {
        onComplete?.();
        return;
    }

    // Annuler tout fade précédent
    if (fadeInterval.current) {
        clearTimeout(fadeInterval.current);
        fadeInterval.current = null;
    }

    // Sauvegarder le volume actuel pour le restaurer après
    const volumeBeforeFade = gainNodeRef.current
        ? gainNodeRef.current.gain.value
        : audioRef.current.volume;
    savedVolume.current = volumeBeforeFade;

    // Utiliser Web Audio API si disponible (fade lisse natif)
    if (audioContextRef.current && gainNodeRef.current) {
        const ctx = audioContextRef.current;
        const gain = gainNodeRef.current.gain;

        // Annuler tout scheduling précédent
        gain.cancelScheduledValues(ctx.currentTime);
        // Définir la valeur actuelle comme point de départ
        const startValue = gain.value;
        const startTime = ctx.currentTime;
        gain.setValueAtTime(startValue, startTime);
        // Faire le ramp vers 0
        gain.linearRampToValueAtTime(0, startTime + FADE_OUT_DURATION_SEC);

        // Surveiller le volume en temps réel et lancer la lecture quand = 0
        const checkVolume = setInterval(() => {
            const currentGain = gain.value;

            // Quand le volume atteint 0, arrêter le check et lancer la suite
            if (currentGain <= 0.001) {
                clearInterval(checkVolume);
                if (fadeInterval.current) {
                    clearTimeout(fadeInterval.current);
                    fadeInterval.current = null;
                }

                // Pause l'audio actuel
                audioRef.current.pause();

                // Garder le gain à 0, il sera restauré après chargement nouvelle source
                gain.cancelScheduledValues(ctx.currentTime);
                gain.setValueAtTime(0, ctx.currentTime);

                onComplete?.();
            }
        }, 25); // Check toutes les 25ms pour fade court

        // Timeout de sécurité
        fadeInterval.current = setTimeout(() => {
            if (fadeInterval.current) {
                fadeInterval.current = null;
                clearInterval(checkVolume);
                audioRef.current.pause();
                gain.cancelScheduledValues(ctx.currentTime);
                gain.setValueAtTime(0, ctx.currentTime);
                onComplete?.();
            }
        }, FADE_OUT_DURATION_SEC * 1000 + 100);
    } else {
        // Fallback sans Web Audio API (fade par steps)
        const intervalTime = 20;
        const totalSteps = (FADE_OUT_DURATION_SEC * 1000) / intervalTime;
        const step = volumeBeforeFade / totalSteps;

        const doFade = () => {
            const currentVol = audioRef.current.volume;
            if (currentVol > step) {
                audioRef.current.volume = currentVol - step;
                fadeInterval.current = setTimeout(doFade, intervalTime);
            } else {
                audioRef.current.volume = 0;
                audioRef.current.pause();
                fadeInterval.current = null;
                audioRef.current.volume = volumeBeforeFade;
                onComplete?.();
            }
        };
        doFade();
    }
  };

  // Ancienne fonction pour les autres cas (duck, fade in)
  const fadeMainAudio = (direction, targetVolume = 0) => {
    if (!audioRef.current) return;

    if (fadeInterval.current) clearInterval(fadeInterval.current);

    const step = 0.05;
    const intervalTime = 50;

    if (direction === 'duck') {
        // Duck : baisser le volume SANS couper l'audio
        savedVolume.current = gainNodeRef.current ? gainNodeRef.current.gain.value : audioRef.current.volume;
        const duckTarget = targetVolume || 0.15;

        fadeInterval.current = setInterval(() => {
          const currentVol = gainNodeRef.current ? gainNodeRef.current.gain.value : audioRef.current.volume;
          if (currentVol > duckTarget + step) {
              if (gainNodeRef.current) gainNodeRef.current.gain.value = currentVol - step;
              else audioRef.current.volume = currentVol - step;
          } else {
              if (gainNodeRef.current) gainNodeRef.current.gain.value = duckTarget;
              else audioRef.current.volume = duckTarget;
              clearInterval(fadeInterval.current);
          }
        }, 20);
    } else if (direction === 'in') {
        // Fade In - restaurer le volume
        if (audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
        }
        fadeInterval.current = setInterval(() => {
          const currentVol = gainNodeRef.current ? gainNodeRef.current.gain.value : audioRef.current.volume;
          if (currentVol < savedVolume.current - step) {
              if (gainNodeRef.current) gainNodeRef.current.gain.value = currentVol + step;
              else audioRef.current.volume = currentVol + step;
          } else {
              if (gainNodeRef.current) gainNodeRef.current.gain.value = savedVolume.current;
              else audioRef.current.volume = savedVolume.current;
              clearInterval(fadeInterval.current);
          }
        }, intervalTime);
    }
  };

  const playFromLibrarySearch = (song) => {
    const doPlay = () => {
        const newQueue = [...librarySearchResults];
        setInitialRandomQueue(newQueue);
        setQueue(newQueue);
        setCurrentSong(song);
        setIsPlaying(true);
        openFullPlayer();
        setIsLibrarySearching(false);
        setLibrarySearchQuery('');
    };

    // Fade out si musique en cours, sinon jouer directement
    if (audioRef.current && !audioRef.current.paused) {
        fadeOutAndStop(doPlay);
    } else {
        doPlay();
    }
  };

  // Calculer un index de dégradé non utilisé pour VIBE THESE
  useEffect(() => {
    if (librarySearchResults.length > 0) {
        const usedIndices = Object.values(vibeColorIndices);
        const allIndices = Array.from({ length: ALL_GRADIENTS.length }, (_, i) => i);
        const unusedIndices = allIndices.filter(i => !usedIndices.includes(i));
        
        if (unusedIndices.length > 0) {
            // Choisir aléatoirement parmi les non-utilisés
            const randomIndex = unusedIndices[Math.floor(Math.random() * unusedIndices.length)];
            setVibeTheseGradientIndex(randomIndex);
        } else {
            // Tous utilisés : choisir aléatoirement parmi tous
            setVibeTheseGradientIndex(Math.floor(Math.random() * ALL_GRADIENTS.length));
        }
    }
}, [librarySearchResults.length > 0, vibeColorIndices]);

// Gérer les actions import en attente
useEffect(() => {
  if (importButtonsReady && pendingImportAction) {
      console.log('Action déclenchée:', pendingImportAction); // DEBUG
      if (pendingImportAction === 'nuke') {
          handleNukeAll();
      } else if (pendingImportAction === 'dropbox') {
          console.log('Appel handleDropboxAuth'); // DEBUG
          handleDropboxAuth();
      } else if (pendingImportAction === 'folder') {
          document.getElementById('folderInput').click();
      }
      setPendingImportAction(null);
      setImportOverlayAnim('closing');
      setTimeout(() => {
          setShowImportMenu(false);
          setImportOverlayAnim('none');
          setImportButtonsReady(false);
      }, CONFIG.IMPORT_HEADER_FADE_OUT_DURATION);
  }
}, [importButtonsReady, pendingImportAction]);

const vibeSearchResults = () => {
    if (librarySearchResults.length === 0) return;

    let songsToPlay = [...librarySearchResults];

    // Nom de la vibe = titre de la première chanson (avant mélange)
    const vibeName = songsToPlay[0].artist;

    // Créer la carte Vibe
    const vibeSongs = songsToPlay.map(s => ({...s, type: 'vibe'}));
    setPlaylists(prev => ({ ...prev, [vibeName]: vibeSongs }));

    // Attribuer le dégradé choisi à cette nouvelle vibe
    setVibeColorIndices(prev => ({ ...prev, [vibeName]: vibeTheseGradientIndex }));

    // Mélanger
    for (let i = songsToPlay.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songsToPlay[i], songsToPlay[j]] = [songsToPlay[j], songsToPlay[i]];
    }

    // Si c'est la même chanson, forcer le play car le useEffect ne se déclenchera pas
    const isSameSong = currentSong && songsToPlay[0] && currentSong.id === songsToPlay[0].id;

    setInitialRandomQueue([...songsToPlay]);
    setQueue(songsToPlay);
    setActiveFilter('initialShuffle');
    setCurrentSong(songsToPlay[0]);
    setIsPlaying(true);
    openFullPlayer();
    setIsLibrarySearching(false);
    setLibrarySearchQuery('');

    // Forcer le play si même chanson (le useEffect ne se déclenche pas)
    if (isSameSong && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
    }
  };

  const processFileImport = (foldersToImport) => {
    // foldersToImport est déjà un objet { nomDossier: [fichiers] }

    // On fait une copie modifiable des playlists actuelles (ou objet vide si null)
    const newPlaylists = playlists ? { ...playlists } : {};
  
    // On utilise directement la structure passée en paramètre
    const folders = foldersToImport;
  
    // Créer une map globale de TOUTES les chansons existantes (toutes playlists confondues)
    // Clé = fileSignature (taille + extension), Valeur = chanson
    const allExistingSongsMap = new Map();
    if (playlists) {
        Object.values(playlists).forEach(playlist => {
            playlist.forEach(song => {
                if (song.fileSignature) {
                    allExistingSongsMap.set(song.fileSignature, song);
                }
            });
        });
    }

    // On traite chaque dossier trouvé dans l'import
    Object.keys(folders).forEach(folderName => {
      const filesInFolder = folders[folderName];

      const newSongsForThisFolder = filesInFolder.map((file, index) => {
        // Créer une signature unique basée sur le fichier (taille + extension)
        const extension = file.name.split('.').pop().toLowerCase();
        const fileSignature = `${file.size}-${extension}`;
        
        // On extrait le titre et l'artiste depuis le nom du fichier
        let title = file.name.replace(/\.[^/.]+$/, "");
        let artist = "Artiste Inconnu";
        if (title.includes(" - ")) {
          const parts = title.split(" - ");
          artist = parts[0].trim();
          title = parts[1].trim();
        }
  
        // On cherche si le fichier existait déjà (par sa signature)
        const existingSong = allExistingSongsMap.get(fileSignature);
        const playCount = existingSong ? existingSong.playCount : 0;
        
        // Générer un ID unique basé sur la signature du fichier
        const id = existingSong ? existingSong.id : `file-${fileSignature}-${Date.now()}`;
        
        // On crée le nouvel objet chanson
        return {
          id: id,
          title: title,
          artist: artist,
          playCount: playCount,
          file: URL.createObjectURL(file),
          fileSignature: fileSignature,
          type: 'local'
        };
      });
      
      // On remplace l'ancienne playlist de ce dossier par la nouvelle, "réhydratée"
      newPlaylists[folderName] = newSongsForThisFolder;
    });
  
    // On met à jour l'état principal. Ceci va déclencher la sauvegarde automatique de l'Étape 1.
    // MAIS D'ABORD : propager les fichiers aux autres playlists (Vibes) qui contiennent les mêmes chansons
    
    // Créer une map ID -> file pour toutes les chansons fraîchement importées
    const newFilesMap = new Map();
    Object.keys(folders).forEach(folderName => {
        if (newPlaylists[folderName]) {
            newPlaylists[folderName].forEach(song => {
                if (song.file) {
                    newFilesMap.set(song.id, song.file);
                }
            });
        }
    });
    
    // Propager les fichiers à TOUTES les autres playlists (notamment les Vibes)
    Object.keys(newPlaylists).forEach(playlistName => {
        // Ne pas re-traiter les dossiers qu'on vient d'importer
        if (Object.keys(folders).includes(playlistName)) return;
        
        newPlaylists[playlistName] = newPlaylists[playlistName].map(song => {
            const newFile = newFilesMap.get(song.id);
            if (newFile && !song.file) {
                return { ...song, file: newFile };
            }
            return song;
        });
    });
    
    setPlaylists(newPlaylists);

    // Attribuer des couleurs uniques aux nouveaux dossiers
    const newFolderNames = Object.keys(folders);
    setVibeColorIndices(prev => {
      const updated = { ...prev };
      let needsUpdate = false;
      
      // Recalculer le compteur d'usage
      initializeGradientUsage(null);
      Object.values(updated).forEach(idx => { if (idx !== undefined) gradientUsageCount[idx]++; });
      
      newFolderNames.forEach(name => {
        if (updated[name] === undefined) {
          updated[name] = getNextAvailableGradientIndex();
          needsUpdate = true;
        }
      });
      
      return needsUpdate ? updated : prev;
    });
  };

  // Traiter l'import de fichiers Dropbox
  const processDropboxImport = (foldersToImport) => {
    const newPlaylists = playlists ? { ...playlists } : {};

    const allExistingSongsMap = new Map();
    if (playlists) {
        Object.values(playlists).forEach(playlist => {
            playlist.forEach(song => {
                if (song.fileSignature) {
                    allExistingSongsMap.set(song.fileSignature, song);
                }
            });
        });
    }

    Object.keys(foldersToImport).forEach(folderName => {
        const filesInFolder = foldersToImport[folderName];

        const newSongsForThisFolder = filesInFolder.map((file) => {
            const extension = file.name.split('.').pop().toLowerCase();
            const fileSignature = `${file.size}-${extension}`;

            let title = file.name.replace(/\.[^/.]+$/, "");
            let artist = "Artiste Inconnu";
            if (title.includes(" - ")) {
                const parts = title.split(" - ");
                artist = parts[0].trim();
                title = parts[1].trim();
            }

            const existingSong = allExistingSongsMap.get(fileSignature);
            const playCount = existingSong ? existingSong.playCount : 0;
            const id = existingSong ? existingSong.id : `dropbox-${fileSignature}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            return {
                id: id,
                title: title,
                artist: artist,
                playCount: playCount,
                file: null,
                dropboxPath: file.path_lower,
                fileSignature: fileSignature,
                type: 'dropbox'
            };
        });

        newPlaylists[folderName] = newSongsForThisFolder;
    });

    setPlaylists(newPlaylists);
    setFeedback({ text: `Import Dropbox terminé`, type: 'confirm', triggerValidation: Date.now() });
  };

    const handleDashTouchStart = (e) => { 
      dragStartY.current = e.touches[0].clientY; 
      if (dashboardRef.current) { 
        startHeight.current = dashboardRef.current.offsetHeight; 
        isDraggingDrawer.current = true;
        setIsDrawerAnimating(false);
      } 
    };
      const handleDashTouchMove = (e) => { 
        if (dragStartY.current === null || !mainContainerRef.current || !dashboardRef.current) return; 
        
        const clientY = e.touches ? e.touches[0].clientY : e.clientY; 
        const diff = dragStartY.current - clientY; 
        let newHeight = startHeight.current + diff; 
        const containerHeight = mainContainerRef.current.offsetHeight; 
        const handleHeight = containerHeight * (CONFIG.DRAWER_HANDLE_HEIGHT_PERCENT / 100);
        const minHeight = handleHeight - CONFIG.DRAWER_SEPARATOR_HEIGHT;
        const maxHeight = containerHeight - CONFIG.DRAWER_TOP_MARGIN; 
        if (newHeight < minHeight) newHeight = minHeight; 
        if (newHeight > maxHeight) newHeight = maxHeight; 
        
        // MANIPULATION DOM DIRECTE
        dashboardRef.current.style.height = `${newHeight}px`;
        
        // RAF throttle pour setState
        pendingDrawerHeight.current = newHeight;
        if (!drawerRafRef.current) {
            drawerRafRef.current = requestAnimationFrame(() => {
                setDashboardHeight(pendingDrawerHeight.current);
                drawerRafRef.current = null;
            });
        }
        
        // Calcul position (une seule fois getBoundingClientRect car on a déjà newHeight)
        const bottomBarHeight = getFooterHeight();
        const drawerTop = containerHeight - newHeight - bottomBarHeight;
        const topPositionPercent = (drawerTop / containerHeight) * 100;
        drawerTopPercentRef.current = topPositionPercent;
        
        // Trigger zone - setState seulement si changement
        const inTriggerZone = topPositionPercent <= CONFIG.BACK_TO_VIBES_TRIGGER_PERCENT;
        if (inTriggerZone !== isInTriggerZone) {
            setIsInTriggerZone(inTriggerZone);
        }
        
        // Overlay - setState seulement si changement significatif
        if (topPositionPercent <= CONFIG.BACK_TO_VIBES_START_PERCENT) { 
            if (!showMainPlayerTrigger) setShowMainPlayerTrigger(true);
            const opacity = Math.min((CONFIG.BACK_TO_VIBES_START_PERCENT - topPositionPercent) / (CONFIG.BACK_TO_VIBES_START_PERCENT - CONFIG.BACK_TO_VIBES_FULL_PERCENT), 1); 
            // setState seulement si différence > 5%
            if (Math.abs(opacity - lastOpacityRef.current) > 0.05) {
                lastOpacityRef.current = opacity;
                setMainPlayerTriggerOpacity(opacity);
            }
        } else if (showMainPlayerTrigger) { 
            setShowMainPlayerTrigger(false); 
            setMainPlayerTriggerOpacity(0);
            lastOpacityRef.current = 0;
        } 
    };
    const handleDashTouchEnd = (e) => { 
        if (dragStartY.current === null || !mainContainerRef.current) return; 
        
        isDraggingDrawer.current = false;
        
        if (showMainPlayerTrigger && drawerTopPercentRef.current <= CONFIG.BACK_TO_VIBES_TRIGGER_PERCENT) {
          // Calculer la position Y du haut du tiroir (là où le player doit commencer)
          const containerHeight = mainContainerRef.current.offsetHeight;
          const footerHeight = getFooterHeight();
          const currentDrawerHeight = dashboardRef.current?.offsetHeight || dashboardHeight;
          const drawerTopY = containerHeight - footerHeight - currentDrawerHeight;
          
          openFullPlayer(drawerTopY); 
            setDashboardHeight(mainContainerRef.current.offsetHeight * (CONFIG.DRAWER_DEFAULT_HEIGHT_PERCENT / 100));
        } else if (dashboardRef.current) {
          // Synchroniser le state avec la hauteur DOM actuelle
          setDashboardHeight(dashboardRef.current.offsetHeight);
        }
        
        dragStartY.current = null; 
        setShowMainPlayerTrigger(false); 
        setIsInTriggerZone(false); 
        drawerTopPercentRef.current = 100;
        lastOpacityRef.current = 0;
      };
      useEffect(() => { 
        if (mainContainerRef.current) { 
            setDashboardHeight(mainContainerRef.current.offsetHeight * (CONFIG.DRAWER_DEFAULT_HEIGHT_PERCENT / 100)); 
        } 
        const handleResize = () => { 
            if (mainContainerRef.current) {
                setDashboardHeight(mainContainerRef.current.offsetHeight * (CONFIG.DRAWER_DEFAULT_HEIGHT_PERCENT / 100));
            } 
        };
    window.addEventListener('resize', handleResize); 
    return () => window.removeEventListener('resize', handleResize); 
}, []);

  useEffect(() => { const updateTime = () => { const now = new Date(); setCurrentTime(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`); }; updateTime(); const interval = setInterval(updateTime, 1000); return () => clearInterval(interval); }, []);
  // UseEffect pour le volume uniquement (Web Audio API pour iOS)
  useEffect(() => {
    if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = volume / 100;
    } else if (audioRef.current) {
        audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // UseEffect pour le changement de chanson et play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setupAndPlay = async () => {
        if (currentSong) {
            // Vérifier si on doit changer la source
            const currentSrc = audio.src;
            let newSrc = null;
            
            if (currentSong.type === 'dropbox' && currentSong.dropboxPath) {
              // Pour Dropbox, on doit toujours obtenir un lien frais si la chanson change
              if (!currentSrc || !audio.dataset.songId || audio.dataset.songId !== currentSong.id) {
                  // Vérifier si on a un fichier préchargé pour ce morceau
                  if (preloadedRef.current.songId === currentSong.id && preloadedRef.current.link) {
                      console.log('Utilisation du fichier préchargé pour:', currentSong.title);
                      newSrc = preloadedRef.current.link;
                      // Nettoyer le préchargement
                      if (preloadedRef.current.audio) {
                          preloadedRef.current.audio.src = '';
                          preloadedRef.current.audio = null;
                      }
                      preloadedRef.current = { songId: null, link: null, audio: null };
                  } else {
                      const link = await getDropboxTemporaryLink(currentSong.dropboxPath);
                      if (link) {
                          newSrc = link;
                      } else {
                          console.error('Impossible d\'obtenir le lien Dropbox');
                          return;
                      }
                  }
              }
          } else if (currentSong.file) {
                if (currentSrc !== currentSong.file) {
                    newSrc = currentSong.file;
                }
            }
            
            // Ne changer le src que si nécessaire
            if (newSrc) {
                audio.src = newSrc;
                audio.dataset.songId = currentSong.id;
                // Attendre que l'audio soit prêt avant de jouer
                await new Promise((resolve) => {
                    const onCanPlay = () => {
                        audio.removeEventListener('canplay', onCanPlay);
                        audio.removeEventListener('error', onError);
                        resolve();
                    };
                    const onError = () => {
                        audio.removeEventListener('canplay', onCanPlay);
                        audio.removeEventListener('error', onError);
                        console.error('Erreur chargement audio');
                        resolve();
                    };
                    audio.addEventListener('canplay', onCanPlay);
                    audio.addEventListener('error', onError);
                    audio.load();
                });
            }
          }

          // Initialiser Web Audio API au premier play (nécessaire pour iOS)
          if (isPlaying && !audioContextRef.current && audioRef.current) {
              initAudioContext();
          }
          if (isPlaying && audioContextRef.current?.state === 'suspended') {
              audioContextRef.current.resume();
          }

          if (isPlaying && currentSong) {
              // Restaurer le volume si on vient d'un fadeOut (gain était à 0)
              // On utilise volume/100 car volume est en % (0-100) et gain en (0-1)
              if (gainNodeRef.current && audioContextRef.current) {
                  const ctx = audioContextRef.current;
                  const gain = gainNodeRef.current.gain;
                  const targetGain = volume / 100;
                  // Si le gain est proche de 0, on vient d'un fade - restaurer
                  if (gain.value < 0.01) {
                      gain.cancelScheduledValues(ctx.currentTime);
                      gain.setValueAtTime(targetGain, ctx.currentTime);
                  }
              }
              const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name !== 'AbortError') console.error("Playback error:", error);
                });
            }
        } else {
            audio.pause();
        }
    };

    setupAndPlay();
  }, [isPlaying, currentSong]);

  // Refs pour tracker les états sans closure stale (Media Session API)
  const isPlayingRef = useRef(isPlaying);
  const currentSongRef = useRef(currentSong);
  const queueRef = useRef(queue);
  const wakeLockRef = useRef(null);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentSongRef.current = currentSong; }, [currentSong]);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  // ══════════════════════════════════════════════════════════════════════════════
  // SCREEN WAKE LOCK - Empêcher l'écran de s'éteindre pendant la lecture
  // ══════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const requestWakeLock = async () => {
      if (!('wakeLock' in navigator)) return;

      if (isPlaying) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('[WakeLock] Screen wake lock acquired');
        } catch (e) {
          console.log('[WakeLock] Failed to acquire:', e.message);
        }
      } else {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          console.log('[WakeLock] Screen wake lock released');
        }
      }
    };

    requestWakeLock();

    // Re-acquire wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [isPlaying]);

  // ══════════════════════════════════════════════════════════════════════════════
  // MEDIA SESSION API - Contrôles écran de verrouillage iOS/Android
  // ══════════════════════════════════════════════════════════════════════════════

  // Enregistrer les handlers UNE SEULE FOIS au montage
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // Play: appeler directement .play() sur l'audio
    navigator.mediaSession.setActionHandler('play', async () => {
      console.log('[MediaSession] play handler called');
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.error('[MediaSession] play error:', e);
        }
      }
    });

    // Pause: appeler directement .pause() sur l'audio
    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('[MediaSession] pause handler called');
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      console.log('[MediaSession] previoustrack handler called');
      if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
      } else {
        const currentIndex = queueRef.current.findIndex(s => s === currentSongRef.current);
        if (currentIndex > 0) {
          setCurrentSong(queueRef.current[currentIndex - 1]);
        } else if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      console.log('[MediaSession] nexttrack handler called');
      const currentIndex = queueRef.current.findIndex(s => s === currentSongRef.current);
      if (currentIndex < queueRef.current.length - 1) {
        setCurrentSong(queueRef.current[currentIndex + 1]);
      } else {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      }
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      console.log('[MediaSession] seekbackward handler called');
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - (details.seekOffset || 10));
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      console.log('[MediaSession] seekforward handler called');
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(
          audioRef.current.duration || 0,
          audioRef.current.currentTime + (details.seekOffset || 10)
        );
      }
    });

    // Cleanup: retirer les handlers au démontage
    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
      }
    };
  }, []); // Dépendances vides = une seule fois

  // Mettre à jour les métadonnées quand la chanson change
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title || 'Unknown Title',
        artist: currentSong.artist || 'Unknown Artist',
        album: currentSong.vibeId || 'Vibes',
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });
    }
  }, [currentSong]);

  // Refs pour le préchargement du fichier Dropbox du morceau suivant
  const preloadedRef = useRef({ songId: null, link: null, audio: null });
  const isPreloadingRef = useRef(false);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    
    const currentTime = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 0;
    
    setProgress(currentTime);
    setDuration(duration);
    
    // Préchargement du morceau suivant 10 secondes avant la fin
    const timeRemaining = duration - currentTime;
    if (timeRemaining > 0 && timeRemaining <= 10 && !isPreloadingRef.current) {
        const currentIndex = queue.findIndex(s => s === currentSong);
        const nextSong = queue[currentIndex + 1];
        
        if (nextSong && nextSong.type === 'dropbox' && nextSong.dropboxPath) {
            if (preloadedRef.current.songId !== nextSong.id) {
                isPreloadingRef.current = true;
                console.log('Préchargement du morceau suivant:', nextSong.title);
                
                getDropboxTemporaryLink(nextSong.dropboxPath).then(link => {
                    if (link) {
                        // Créer un Audio invisible pour télécharger le fichier
                        const preloadAudio = new Audio();
                        preloadAudio.preload = 'auto';
                        preloadAudio.src = link;
                        
                        // Quand le fichier est prêt à jouer, on log
                        preloadAudio.addEventListener('canplaythrough', () => {
                            console.log('Fichier préchargé et prêt pour:', nextSong.title);
                        }, { once: true });
                        
                        // Déclencher le téléchargement
                        preloadAudio.load();
                        
                        preloadedRef.current = { songId: nextSong.id, link: link, audio: preloadAudio };
                        console.log('Préchargement lancé pour:', nextSong.title);
                    }
                    isPreloadingRef.current = false;
                }).catch(() => {
                    isPreloadingRef.current = false;
                });
            }
        }
    }
  };
  const handleSongEnd = () => {
    if (currentSong) updatePlayCount(currentSong);
    const currentIndex = queue.findIndex(s => s === currentSong);
    if (currentIndex < queue.length - 1) {
      // Passer au morceau suivant SANS faire tourner la roue
      setCurrentSong(queue[currentIndex + 1]);
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  };
  const updatePlayCount = (songToUpdate) => { const newPlaylists = { ...playlists }; Object.keys(newPlaylists).forEach(key => { newPlaylists[key] = newPlaylists[key].map(s => { if (s.id === songToUpdate.id) return { ...s, playCount: (s.playCount || 0) + 1 }; return s; }); }); setPlaylists(newPlaylists); };

  const applySort = (mode, direction = 'asc') => { 
    let newQueue = [...queue]; 
    setActiveFilter(mode); 
    switch (mode) { 
      case 'initialShuffle': 
        if (initialRandomQueue.length > 0) newQueue = [...initialRandomQueue]; 
        break; 
      case 'alphaTitle': 
        if (direction === 'asc') {
          newQueue.sort((a, b) => a.title.localeCompare(b.title)); 
        } else {
          newQueue.sort((a, b) => b.title.localeCompare(a.title)); 
        }
        break; 
      case 'alphaArtist': 
        if (direction === 'asc') {
          newQueue.sort((a, b) => a.artist.localeCompare(b.artist)); 
        } else {
          newQueue.sort((a, b) => b.artist.localeCompare(a.artist)); 
        }
        break; 
      case 'leastPlayed': 
        newQueue.sort((a, b) => (a.playCount || 0) - (b.playCount || 0)); 
        break; 
      case 'mostPlayed': 
        newQueue.sort((a, b) => (b.playCount || 0) - (a.playCount || 0)); 
        break; 
      case 'newShuffle': 
        for (let i = newQueue.length - 1; i > 0; i--) { 
          const j = Math.floor(Math.random() * (i + 1)); 
          [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]]; 
        } 
        break; 
      default: break; 
    } 
    setQueue(newQueue); 
  };

  const handleToggleSort = (type) => {
    if (type === 'title') {
      if (activeFilter === 'alphaTitle') {
        const newDir = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirection(newDir);
        applySort('alphaTitle', newDir);
      } else {
        setSortDirection('asc');
        applySort('alphaTitle', 'asc');
      }
    } else if (type === 'artist') {
      if (activeFilter === 'alphaArtist') {
        const newDir = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirection(newDir);
        applySort('alphaArtist', newDir);
      } else {
        setSortDirection('asc');
        applySort('alphaArtist', 'asc');
      }
    } else if (type === 'playCount') {
      if (activeFilter === 'leastPlayed') {
        applySort('mostPlayed');
      } else if (activeFilter === 'mostPlayed') {
        applySort('leastPlayed');
      } else {
        applySort('leastPlayed');
      }
    }
  };

  const triggerFeedback = (text, type) => { setFeedback({ text, type }); };
  const handleReorder = (song, action) => { 
    let newQueue = [...queue]; 
    const movedSongIndex = newQueue.findIndex(s => s.id === song.id); 
    if (movedSongIndex === -1) return; 
    
    // Si on déplace la chanson en cours, passer à la suivante
    if (currentSong && song.id === currentSong.id) { 
      let nextIndex = movedSongIndex + 1; 
      if (nextIndex >= newQueue.length) nextIndex = 0; 
      if (newQueue.length > 1) setCurrentSong(newQueue[nextIndex]); 
    } 
    
    const [movedSong] = newQueue.splice(movedSongIndex, 1); 
    
    if (action === 'archive') { 
      newQueue.unshift(movedSong); 
      triggerFeedback("ARCHIVE", "archive"); 
    } else if (action === 'next') { 
      const currentIdx = newQueue.findIndex(s => s.id === currentSong?.id); 
      newQueue.splice(currentIdx + 1, 0, movedSong); 
      triggerFeedback("PLAY NEXT", "next"); 
    } 
    
    setQueue(newQueue); 
  };
  const addToPlayNext = (song) => { 
    if (!currentSong || queue.length === 0) return false; 
    let newQueue = [...queue]; 
    const currentIdx = newQueue.findIndex(s => s.id === currentSong.id);
    const existingIdx = newQueue.findIndex(s => s.id === song.id);
    
    // Si le morceau est déjà dans la queue, on le retire d'abord
    if (existingIdx !== -1) {
      newQueue.splice(existingIdx, 1);
      // Recalculer l'index courant si nécessaire
      const newCurrentIdx = newQueue.findIndex(s => s.id === currentSong.id);
      newQueue.splice(newCurrentIdx + 1, 0, song);
    } else {
      // Sinon on l'ajoute simplement après le morceau en cours
      newQueue.splice(currentIdx + 1, 0, song);
      
      // Ajouter aussi à la playlist active si ce n'est pas déjà le cas
      if (activeVibeName && playlists[activeVibeName]) {
        const isInPlaylist = playlists[activeVibeName].find(s => s.id === song.id);
        if (!isInPlaylist) {
          setPlaylists(prev => ({
            ...prev,
            [activeVibeName]: [...prev[activeVibeName], { ...song, type: 'vibe' }]
          }));
        }
      }
    }
    
    setQueue(newQueue); 
    triggerFeedback("PLAY NEXT", "next"); 
    return true; 
  };

  const playFolder = (folderName) => { 
        const songs = playlists[folderName];
        if (!songs || songs.length === 0) {
            console.error("Vibe introuvable ou vide:", folderName);
            return;
        }

        // VÉRIFICATION : fichiers accessibles ?
        const firstSong = songs[0];
        const isAccessible = isSongAvailable(firstSong);
        if (!isAccessible) {
            alert(`Session expirée pour "${folderName}" ! Ré-importez le dossier.`);
            return;
        }

        // SI une vibe est déjà chargée (peu importe si elle joue ou non)
        if (currentSong) {
          setPendingVibe(folderName);
          return;
      }

      // Lancer l'animation (la vibe sera lancée par onBlinkComplete)
      setBlinkingVibe(folderName);
    };

    const launchVibe = (folderName) => {
        // Cas spécial : résultats de recherche
        if (folderName === '__SEARCH_RESULTS__') {
            if (audioRef.current && !audioRef.current.paused) {
                fadeOutAndStop(vibeSearchResults);
            } else {
                vibeSearchResults();
            }
            return;
        }

        // Fade out audio si une musique joue, puis lancer la vibe
        if (audioRef.current && !audioRef.current.paused) {
            fadeOutAndStop(() => doLaunchVibe(folderName));
            return;
        }

        doLaunchVibe(folderName);
    };

    const doLaunchVibe = (folderName) => {
      const songs = playlists[folderName];
    // Filtrer pour ne garder que les morceaux avec fichier disponible
    let songsToPlay = songs.filter(s => isSongAvailable(s));
    if (songsToPlay.length === 0) {
        alert(`Aucun morceau disponible pour "${folderName}" ! Ré-importez le dossier.`);
        return;
    }
    for (let i = songsToPlay.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songsToPlay[i], songsToPlay[j]] = [songsToPlay[j], songsToPlay[i]];
    }

    // Si c'est la même chanson, forcer le play car le useEffect ne se déclenchera pas
    const isSameSong = currentSong && songsToPlay[0] && currentSong.id === songsToPlay[0].id;

    setInitialRandomQueue([...songsToPlay]);
    setQueue(songsToPlay);
    setActiveFilter('initialShuffle');
    setCurrentSong(songsToPlay[0]);
    setIsPlaying(true);
    openFullPlayer();
    setPendingVibe(null);
    setActiveVibeName(folderName);

    // Forcer le play si même chanson (le useEffect ne se déclenche pas)
    if (isSameSong && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
    }
};

const cancelKillVibe = () => {
        // Déclencher l'animation ignite rouge sur la bulle
        setConfirmFeedback({ text: 'CANCEL', type: 'cancel', triggerValidation: Date.now() });
        // Après l'animation ignite (500ms), fermer l'overlay
        setTimeout(() => {
            setConfirmOverlayVisible(false);
            setConfirmSwipeX(0);
            setConfirmSwipeStart(null);
            setTimeout(() => {
                setPendingVibe(null);
                setConfirmFeedback(null);
            }, 150);
        }, 500);
    };

    const handleNukeAll = () => {
      setNukeConfirmMode(true);
  };

  const handleDropboxAuth = async () => {
    console.log('handleDropboxAuth appelé !'); // DEBUG
    // Toujours relire depuis localStorage pour avoir la valeur à jour
    const token = getDropboxAccessToken();
    console.log('Token from localStorage:', token); // DEBUG
    console.log('dropboxToken state:', dropboxToken); // DEBUG

    // Capturer la position du bouton pour l'animation morph (seulement si token existe)
    const captureButtonRect = () => {
        if (dropboxButtonRef.current) {
            const rect = dropboxButtonRef.current.getBoundingClientRect();
            setDropboxSourceRect({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            });
        }
    };

    if (token) {
        // Déjà connecté, capturer le rect et ouvrir le browser avec animation morph
        captureButtonRect();
        setDropboxToken(token);
        setDropboxPath('');
        setShowDropboxBrowser(true);
        loadDropboxFolder('', token);
    } else if (getRefreshToken()) {
        // Token expiré mais refresh token disponible
        const refreshed = await refreshDropboxToken();
        if (refreshed) {
            // Après refresh réussi, capturer le rect et ouvrir avec morph
            captureButtonRect();
            const newToken = getDropboxAccessToken();
            setDropboxToken(newToken);
            setDropboxPath('');
            setShowDropboxBrowser(true);
            loadDropboxFolder('', newToken);
        } else {
            // Refresh échoué, relancer OAuth (pas de morph car on quitte l'app)
            setDropboxSourceRect(null);
            startDropboxOAuth();
        }
    } else {
        // Pas de token, lancer OAuth PKCE (pas de morph car on quitte l'app)
        setDropboxSourceRect(null);
        startDropboxOAuth();
    }
  };

  // Lancer le flux OAuth PKCE
  const startDropboxOAuth = async () => {
    const codeVerifier = generateCodeVerifier();
    localStorage.setItem(DROPBOX_STORAGE_KEYS.CODE_VERIFIER, codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const authUrl = `https://www.dropbox.com/oauth2/authorize?` +
        `client_id=${CONFIG.DROPBOX_APP_KEY}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(CONFIG.DROPBOX_REDIRECT_URI)}` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256` +
        `&token_access_type=offline`; // Important: demande un refresh_token

    window.location.href = authUrl;
  };

  // Échanger le code contre des tokens
  const exchangeCodeForTokens = async (code) => {
    const codeVerifier = localStorage.getItem(DROPBOX_STORAGE_KEYS.CODE_VERIFIER);
    if (!codeVerifier) {
        console.error('Code verifier manquant');
        return false;
    }

    try {
        const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                grant_type: 'authorization_code',
                client_id: CONFIG.DROPBOX_APP_KEY,
                redirect_uri: CONFIG.DROPBOX_REDIRECT_URI,
                code_verifier: codeVerifier,
            }),
        });

        const data = await response.json();

        if (data.access_token && data.refresh_token) {
            saveDropboxTokens(data.access_token, data.refresh_token, data.expires_in);
            localStorage.removeItem(DROPBOX_STORAGE_KEYS.CODE_VERIFIER);
            return data.access_token;
        } else {
            console.error('Erreur échange tokens:', data);
            return false;
        }
    } catch (error) {
        console.error('Erreur échange tokens:', error);
        return false;
    }
  };

  // Rafraîchir le token d'accès
  const refreshDropboxToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: CONFIG.DROPBOX_APP_KEY,
            }),
        });

        const data = await response.json();

        if (data.access_token) {
            // Le refresh_token reste le même, on met juste à jour access_token et expires_at
            const expiresAt = Date.now() + (data.expires_in * 1000) - 60000;
            localStorage.setItem(DROPBOX_STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
            localStorage.setItem(DROPBOX_STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
            return true;
        } else {
            console.error('Erreur refresh token:', data);
            clearDropboxTokens();
            return false;
        }
    } catch (error) {
        console.error('Erreur refresh token:', error);
        return false;
    }
  };

  // Obtenir un token valide (avec refresh automatique si nécessaire)
  const getValidDropboxToken = async () => {
    let token = getDropboxAccessToken();

    if (!token && getRefreshToken()) {
        // Token expiré, essayer de rafraîchir
        const refreshed = await refreshDropboxToken();
        if (refreshed) {
            token = getDropboxAccessToken();
        }
    }

    return token;
  };

  // Charger le contenu d'un dossier Dropbox
  const loadDropboxFolder = async (path, token) => {
    setDropboxLoading(true);
    try {
        let allEntries = [];
        let hasMore = true;
        let cursor = null;
        
        // Première requête
        const firstResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: path || '',
                include_media_info: false,
                include_deleted: false,
                limit: 2000,
            }),
        });
        
        if (firstResponse.status === 401) {
            // Essayer de rafraîchir le token
            const refreshed = await refreshDropboxToken();
            if (refreshed) {
                const newToken = getDropboxAccessToken();
                setDropboxToken(newToken);
                // Réessayer avec le nouveau token
                setDropboxLoading(false);
                return loadDropboxFolder(path, newToken);
            } else {
                // Refresh échoué, forcer reconnexion
                clearDropboxTokens();
                setDropboxToken(null);
                alert('Session Dropbox expirée. Veuillez vous reconnecter.');
                setShowDropboxBrowser(false);
                return;
            }
        }
        
        let data = await firstResponse.json();
        
        if (data.entries) {
            allEntries = [...data.entries];
            hasMore = data.has_more;
            cursor = data.cursor;
        }
        
        // Pagination : récupérer toutes les entrées restantes
        while (hasMore && cursor) {
            const continueResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder/continue', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cursor }),
            });
            
            const continueData = await continueResponse.json();
            
            if (continueData.entries) {
                allEntries = [...allEntries, ...continueData.entries];
                hasMore = continueData.has_more;
                cursor = continueData.cursor;
            } else {
                hasMore = false;
            }
        }
        
        // Trier : dossiers d'abord, puis fichiers MP3
        const sorted = allEntries.sort((a, b) => {
            if (a['.tag'] === 'folder' && b['.tag'] !== 'folder') return -1;
            if (a['.tag'] !== 'folder' && b['.tag'] === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
        
        console.log('Total entries loaded:', sorted.length);
        setDropboxFiles(sorted);
        
    } catch (error) {
        console.error('Erreur Dropbox:', error);
        alert('Erreur de connexion à Dropbox');
    }
    setDropboxLoading(false);
};

// Importer un dossier Dropbox (stocke les chemins, pas de téléchargement)
const importDropboxFolder = async (folderPath, folderName) => {
  setDropboxLoading(true);
  try {
      // Obtenir un token valide (avec refresh si nécessaire)
      let token = await getValidDropboxToken();
      if (!token) token = dropboxToken;

      const listResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path: folderPath }),
      });

      // Si 401, essayer de rafraîchir et réessayer
      if (listResponse.status === 401) {
          const refreshed = await refreshDropboxToken();
          if (refreshed) {
              setDropboxLoading(false);
              return importDropboxFolder(folderPath, folderName);
          } else {
              clearDropboxTokens();
              setDropboxToken(null);
              alert('Session Dropbox expirée. Veuillez vous reconnecter.');
              setShowDropboxBrowser(false);
              setDropboxLoading(false);
              return;
          }
      }

      const listData = await listResponse.json();
      const mp3Files = listData.entries.filter(f => 
          f['.tag'] === 'file' && f.name.toLowerCase().endsWith('.mp3')
      );
      
      if (mp3Files.length === 0) {
          alert('Aucun fichier MP3 trouvé dans ce dossier.');
          setDropboxLoading(false);
          return;
      }
      
      const newPlaylists = playlists ? { ...playlists } : {};
      
      const newSongs = mp3Files.map((file) => {
          const extension = file.name.split('.').pop().toLowerCase();
          const fileSignature = `${file.size}-${extension}`;
          
          let title = file.name.replace(/\.[^/.]+$/, "");
          let artist = "Artiste Inconnu";
          if (title.includes(" - ")) {
              const parts = title.split(" - ");
              artist = parts[0].trim();
              title = parts[1].trim();
          }
          
          return {
              id: `dropbox-${fileSignature}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: title,
              artist: artist,
              playCount: 0,
              file: null,
              dropboxPath: file.path_lower,
              fileSignature: fileSignature,
              type: 'dropbox'
          };
      });
      
      newPlaylists[folderName] = newSongs;
      setPlaylists(newPlaylists);
      setShowDropboxBrowser(false);
      setFeedback({ text: `${mp3Files.length} titres importés depuis Dropbox`, type: 'confirm', triggerValidation: Date.now() });
      
  } catch (error) {
      console.error('Erreur import Dropbox:', error);
      alert('Erreur lors de l\'import');
  }
  setDropboxLoading(false);
};

// Obtenir un lien temporaire Dropbox pour une chanson
const getDropboxTemporaryLink = async (dropboxPath, retryCount = 0) => {
  // Utiliser getValidDropboxToken pour refresh automatique
  let token = await getValidDropboxToken();
  if (!token) {
      // Fallback sur l'ancien token si présent (localStorage uniquement, pas de state)
      token = localStorage.getItem('dropbox_token');
  }
  if (!token) return null;

  try {
      const response = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path: dropboxPath }),
      });

      // Si 401 et pas encore réessayé, tenter un refresh
      if (response.status === 401 && retryCount === 0) {
          const refreshed = await refreshDropboxToken();
          if (refreshed) {
              return getDropboxTemporaryLink(dropboxPath, 1);
          }
      }

      const data = await response.json();
      return data.link || null;
  } catch (error) {
      console.error('Erreur obtention lien Dropbox:', error);
      return null;
  }
};

  // Gestion du retour Dropbox OAuth (PKCE)
  useEffect(() => {
      const handleOAuthReturn = async () => {
          // Nouveau flux PKCE : le code est dans les query params
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');

          if (code) {
              // Échanger le code contre des tokens
              const accessToken = await exchangeCodeForTokens(code);
              if (accessToken) {
                  setDropboxToken(accessToken);
                  // Nettoyer l'URL
                  window.history.replaceState(null, '', window.location.pathname);
                  // Ouvrir le browser automatiquement
                  setShowDropboxBrowser(true);
                  loadDropboxFolder('', accessToken);
              } else {
                  alert('Erreur de connexion à Dropbox. Veuillez réessayer.');
                  window.history.replaceState(null, '', window.location.pathname);
              }
              return;
          }

          // Ancien flux (migration) : le token est dans le hash
          const hash = window.location.hash;
          if (hash && hash.includes('access_token')) {
              const params = new URLSearchParams(hash.substring(1));
              const accessToken = params.get('access_token');
              if (accessToken) {
                  // Stocker le token (ancien format, expirera dans 4h)
                  localStorage.setItem('dropbox_token', accessToken);
                  setDropboxToken(accessToken);
                  // Nettoyer l'URL
                  window.history.replaceState(null, '', window.location.pathname);
                  // Ouvrir le browser automatiquement
                  setShowDropboxBrowser(true);
                  loadDropboxFolder('', accessToken);
              }
          }
      };

      handleOAuthReturn();
  }, []);
    
    const cancelNuke = () => {
        // Déclencher l'animation ignite rouge sur la bulle
        setConfirmFeedback({ text: 'CANCEL', type: 'cancel', triggerValidation: Date.now() });
        // Après l'animation ignite (500ms), fermer l'overlay
        setTimeout(() => {
            setConfirmOverlayVisible(false);
            setConfirmSwipeX(0);
            setConfirmSwipeStart(null);
            setTimeout(() => {
                setNukeConfirmMode(false);
                setConfirmFeedback(null);
            }, 150);
        }, 500);
    };

    // Fade-in de l'overlay quand on entre en mode confirmation
    useEffect(() => {
        if (pendingVibe || nukeConfirmMode) {
            // Délai pour permettre le rendu avant le fade-in
            requestAnimationFrame(() => {
                setConfirmOverlayVisible(true);
            });
        }
    }, [pendingVibe, nukeConfirmMode]);

    // Callback quand l'animation ignite est terminée
    const onConfirmAnimationComplete = () => {
        if (confirmFeedback?.type === 'kill') {
            // KILL VIBE - lancer la vibe DIRECTEMENT (pas d'animation sur la carte vibe)
            setConfirmOverlayVisible(false);
            setTimeout(() => {
                const vibeToLaunch = pendingVibe;
                setPendingVibe(null);
                setConfirmFeedback(null);
                setConfirmSwipeX(0); // Reset position curseur pour la prochaine fois
                // Lancer directement la vibe sans animation de carte
                launchVibe(vibeToLaunch);
            }, 150);
        } else if (confirmFeedback?.type === 'nuke') {
            // NUKE ALL - tout supprimer puis retour dashboard
            setConfirmOverlayVisible(false);
            setTimeout(() => {
                setNukeConfirmMode(false);
                setConfirmFeedback(null);
                setConfirmSwipeX(0); // Reset position curseur pour la prochaine fois
                setPlaylists({});
                localStorage.removeItem('vibes_playlists');
                setVibeColorIndices({});
                localStorage.removeItem('vibes_color_indices');
                setCurrentSong(null);
                setQueue([]);
                setIsPlaying(false);
                setActiveVibeName(null);
                setIsLibrarySearching(false);
                setLibrarySearchQuery('');
                setIsPlayerSearching(false);
                setPlayerSearchQuery('');
                // Fade out audio si en cours
                if (audioRef.current && !audioRef.current.paused) {
                    fadeOutAndStop();
                }
            }, 150);
        }
    };
  
    const playNext = () => { const currentIndex = queue.findIndex(s => s === currentSong); if (currentIndex < queue.length - 1) { setCurrentSong(queue[currentIndex + 1]); setScrollTrigger(t => t + 1); } else setIsPlaying(false); };
    const playPrev = () => { if (audioRef.current && audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; return; } const currentIndex = queue.findIndex(s => s === currentSong); if (currentIndex > 0) { setCurrentSong(queue[currentIndex - 1]); setScrollTrigger(t => t + 1); } else audioRef.current.currentTime = 0; };
    const skipForward10 = () => { if (audioRef.current) audioRef.current.currentTime += 10; };
    const skipBackward10 = () => { if (audioRef.current) audioRef.current.currentTime -= 10; };
    // === HANDLERS VOLUME SLIDER ===
    const handleVolumeTouchStart = (e) => {
      const touch = e.touches[0];
      volumeStartYRef.current = touch.clientY;
      setVolumePreview(volume);
      
      // Capturer les coordonnées du beacon MAINTENANT (avant que l'UI change)
      const beaconEl = showFullPlayer ? beaconNeonRef.current : drawerBeaconRef.current;
      const containerEl = mainContainerRef.current;
      if (beaconEl && containerEl) {
          const beaconRect = beaconEl.getBoundingClientRect();
          const containerRect = containerEl.getBoundingClientRect();
          const containerBorderWidth = 8;
          const beaconBorderWidth = CONFIG.BEACON_NEON_WIDTH;
          setVolumeBeaconRect({
              width: beaconRect.width - beaconBorderWidth * 2,
              height: beaconRect.height - beaconBorderWidth * 2,
              top: beaconRect.top - containerRect.top - containerBorderWidth + beaconBorderWidth,
              left: beaconRect.left - containerRect.left - containerBorderWidth + beaconBorderWidth
          });
      }
      
      volumeLongPressRef.current = setTimeout(() => {
          setIsVolumeActive(true);
          setVolumeMorphProgress(0);
          // Déclencher l'animation vers le tube après un court délai (pour que React render d'abord)
          setTimeout(() => {
              setVolumeMorphProgress(1);
          }, 20);
      }, CONFIG.VOLUME_LONG_PRESS_DELAY);
    };

  const handleVolumeTouchMove = (e) => {
      if (!isVolumeActive) {
          if (volumeLongPressRef.current) {
              clearTimeout(volumeLongPressRef.current);
              volumeLongPressRef.current = null;
          }
          return;
      }
      
      const touch = e.touches[0];

      // Dimensions du tube : centré sur l'écran
      const tubeHeight = window.innerHeight * CONFIG.VOLUME_BAR_HEIGHT_PERCENT / 100;
      const tubeTop = (window.innerHeight - tubeHeight) / 2;
      const tubeBottom = tubeTop + tubeHeight;

      // Calculer le volume basé sur la position Y dans le tube (inversé : haut = 100%)
      const clampedY = Math.max(tubeTop, Math.min(tubeBottom, touch.clientY));
      const progress = 1 - (clampedY - tubeTop) / tubeHeight;
      const newVolume = Math.round(progress * 100);

      setVolumePreview(newVolume);
      // Appliquer le volume directement via Web Audio API (fonctionne sur iOS)
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = newVolume / 100;
    } else if (audioRef.current) {
        audioRef.current.volume = newVolume / 100;
      }
  };

  const handleVolumeTouchEnd = () => {
    const wasLongPressActive = volumeLongPressRef.current !== null;
    
    if (volumeLongPressRef.current) {
        clearTimeout(volumeLongPressRef.current);
        volumeLongPressRef.current = null;
    }
    
    if (isVolumeActive) {
      // C'était un drag, appliquer le volume final
      setVolume(volumePreview);
      if (volumePreview > 0) {
          volumeBeforeMuteRef.current = volumePreview;
      }
      // Animation inverse : tube → beacon, puis fermer
      setVolumeMorphProgress(0);
      setTimeout(() => {
          setIsVolumeActive(false);
      }, CONFIG.VOLUME_MORPH_DURATION);
  } else if (wasLongPressActive) {
        // C'était un tap court → toggle mute/unmute avec fade
        if (volumeFadeIntervalRef.current) {
            clearInterval(volumeFadeIntervalRef.current);
        }
        
        const currentVol = volume;
        const targetVol = currentVol > 0 ? 0 : volumeBeforeMuteRef.current;
        const steps = CONFIG.VOLUME_FADE_STEPS;
        const stepDuration = CONFIG.VOLUME_FADE_DURATION / steps;
        const stepSize = (targetVol - currentVol) / steps;
        let currentStep = 0;
        
        if (currentVol > 0) {
            volumeBeforeMuteRef.current = currentVol;
        }
        
        volumeFadeIntervalRef.current = setInterval(() => {
            currentStep++;
            const newVol = Math.round(currentVol + stepSize * currentStep);
            setVolume(newVol);
            if (audioRef.current) {
              if (gainNodeRef.current) {
                gainNodeRef.current.gain.value = newVol / 100;
            } else {
                audioRef.current.volume = newVol / 100;
            }
            }
            
            if (currentStep >= steps) {
                clearInterval(volumeFadeIntervalRef.current);
                volumeFadeIntervalRef.current = null;
                setVolume(targetVol);
                if (audioRef.current) {
                  if (gainNodeRef.current) {
                    gainNodeRef.current.gain.value = targetVol / 100;
                } else {
                    audioRef.current.volume = targetVol / 100;
                }
                }
            }
        }, stepDuration);
    }
};
  const triggerRecenter = () => { setScrollTrigger(prev => prev + 1); };
  const saveNewVibe = (name, songs) => { 
    const vibeSongs = songs.map(s => ({...s, type: 'vibe'})); 
    setPlaylists(prev => ({ ...prev, [name]: vibeSongs })); 
    // Attribuer une couleur unique si cette vibe n'en a pas encore
    setVibeColorIndices(prev => {
      if (prev[name] === undefined) {
        initializeGradientUsage(null);
        Object.values(prev).forEach(idx => { if (idx !== undefined) gradientUsageCount[idx]++; });
        return { ...prev, [name]: getNextAvailableGradientIndex() };
      }
      return prev;
    });
  };

  // ÉCRAN DE CHARGEMENT
    if (playlists === null) {
        return (
            <div className="w-full h-screen sm:h-[800px] sm:w-[390px] bg-white sm:rounded-[3rem] flex justify-center items-center">
                <VibesLogo size={60} />
            </div>
        );
    }

  return (
    <div className={isOnRealDevice ? "min-h-screen bg-white font-sans" : "min-h-screen bg-gray-100 flex justify-center items-center py-8 font-sans"}>
      {/* Orientation lock overlay */}
      <div className="orientation-lock-overlay">
        <div className="orientation-lock-icon">📱</div>
      </div>
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={handleSongEnd} crossOrigin="anonymous" />

      <div ref={mainContainerRef} className={isOnRealDevice ? "w-full h-screen bg-white relative overflow-hidden flex flex-col" : "w-[390px] h-[95vh] max-h-[844px] bg-white rounded-[3rem] border-[8px] border-gray-900 relative overflow-hidden shadow-2xl flex flex-col"} style={{ '--ignite-duration': `${CONFIG.IMPORT_IGNITE_DURATION}ms` }}>

      {!isOnRealDevice && (
          <div className="h-8 w-full bg-white/90 backdrop-blur-md flex justify-between items-center px-4 text-[10px] font-medium z-50 absolute top-0 left-0 right-0">
            <div className="w-1/3">{currentTime}</div>
            <div className="w-1/3 flex justify-center">
              <div className="h-7 w-32 bg-black rounded-b-2xl absolute top-0 sm:block"></div>
            </div>
            <div className="w-1/3 flex justify-end gap-1">5G <span className="ml-1">100%</span></div>
          </div>
        )}

        <style>{styles}</style>

        {/* HEADER - Indépendant */}
        <div
            className="px-6 bg-white border-b border-gray-200 safe-area-top"
            style={{
                zIndex: CONFIG.HEADER_Z_INDEX,
                paddingTop: `calc(env(safe-area-inset-top, 0px) + ${UNIFIED_CONFIG.TITLE_MARGIN_TOP})`,
                paddingBottom: `${CONFIG.HEADER_PADDING_BOTTOM}rem`,
            }}
        >
          
          {/* Logo centré */}
          <div className="flex justify-center items-center" style={{ marginBottom: UNIFIED_CONFIG.TITLE_MARGIN_BOTTOM }}>
             <VibesLogo size={36} />
             <span className="text-[10px] text-gray-300 ml-1 font-bold">v72</span>
          </div>

          {/* Input file caché (toujours présent) */}
          <input 
              ref={folderInputRef}
              id="folderInput"
              type="file" 
              webkitdirectory="true" 
              directory="true" 
              multiple 
              accept="audio/*,.mp3,.m4a,.wav,.flac,.aac,.ogg"
              className="hidden" 
          />
          
          {/* 3 boutons capsules OU barre de recherche OU barre d'import */}
          <div ref={headerButtonsRef} className="flex flex-col items-center">
          {(isLibrarySearching || searchOverlayAnim !== 'none') ? (
                <div 
                    className="w-full rounded-full border border-gray-100 shadow-sm flex items-center overflow-visible"
                    style={{
                        height: CONFIG.HEADER_BUTTONS_HEIGHT,
                        backgroundColor: `rgba(${CONFIG.CAPSULE_BG_COLOR}, 1)`,
                        boxShadow: `0 -${CONFIG.SEARCH_LIBRARY_GLOW_VERTICAL}px ${CONFIG.SEARCH_LIBRARY_GLOW_BLUR}px rgba(${CONFIG.SEARCH_LIBRARY_GLOW_COLOR}, ${CONFIG.SEARCH_LIBRARY_GLOW_OPACITY}), 0 ${CONFIG.SEARCH_LIBRARY_GLOW_VERTICAL}px ${CONFIG.SEARCH_LIBRARY_GLOW_BLUR}px rgba(${CONFIG.SEARCH_LIBRARY_GLOW_COLOR}, ${CONFIG.SEARCH_LIBRARY_GLOW_OPACITY})`,
                        animation: searchOverlayAnim === 'opening'
                            ? `search-fade-in ${CONFIG.SEARCH_LIBRARY_FADE_IN_DURATION}ms ease-out forwards`
                            : searchOverlayAnim === 'closing'
                                ? `search-fade-out ${CONFIG.SEARCH_LIBRARY_FADE_OUT_DURATION}ms ease-in forwards`
                                : 'none'
                    }}
                >
                    <div 
                        className="flex-1 h-full flex items-center rounded-l-full relative overflow-hidden"
                        style={{
                            paddingLeft: CONFIG.SEARCH_LIBRARY_PADDING_X,
                            paddingRight: CONFIG.SEARCH_LIBRARY_PADDING_X
                        }}
                    >
                        <Search style={{ width: CONFIG.SEARCH_LIBRARY_ICON_SIZE, height: CONFIG.SEARCH_LIBRARY_ICON_SIZE }} className="text-gray-400 mr-3" />
                        <input 
                            autoFocus 
                            type="text" 
                            value={librarySearchQuery} 
                            onChange={(e) => setLibrarySearchQuery(e.target.value)} 
                            placeholder="" 
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 placeholder-gray-400 p-0 outline-none" 
                        />
                    </div>
                    <div className="h-full relative overflow-visible rounded-r-full" style={{ flex: CONFIG.SEARCH_LIBRARY_CLOSE_BTN_FLEX }}>
                        <NeonGlow
                            key={searchCloseBtnAnimKey}
                            colorName="pink"
                            glowRGB={CONFIG.SEARCH_LIBRARY_GLOW_COLOR}
                            enabled={true}
                            igniteOnMount={searchCloseBtnAnimKey > 0}
                            flickerEnabled={searchOverlayAnim !== 'closing'}
                            className="absolute inset-0 rounded-r-full"
                            style={{
                                background: `rgba(${CONFIG.SORTBTN_COLOR}, 1)`,
                                zIndex: 0
                            }}
                        />
                        <button 
                            onClick={() => {
                                if (searchOverlayAnim !== 'none') return;
                                setSearchCloseBtnAnimKey(k => k + 1);
                                setSearchOverlayAnim('closing');
                                setTimeout(() => {
                                    setIsLibrarySearching(false);
                                    setLibrarySearchQuery('');
                                    setSearchOverlayAnim('none');
                                }, CONFIG.SEARCH_LIBRARY_FADE_OUT_DURATION);
                            }}
                            className="relative z-10 w-full h-full flex items-center justify-center text-white rounded-r-full"
                        >
                            <X style={{ width: CONFIG.SEARCH_LIBRARY_X_ICON_SIZE, height: CONFIG.SEARCH_LIBRARY_X_ICON_SIZE }} />
                        </button>
                    </div>
                </div>
            ) : (
              <>
              {/* Conteneur relatif pour superposer boutons normaux et boutons import */}
              <div className="relative w-full" style={{ height: CONFIG.HEADER_BUTTONS_HEIGHT }}>
                  {/* Boutons normaux - fade out quand import ouvert */}
                  <div 
                        className="absolute inset-0 flex items-center"
                        style={{ 
                            gap: CONFIG.HEADER_BUTTONS_GAP,
                            opacity: (showImportMenu || importOverlayAnim !== 'none') ? (importMenuVisible ? 0 : 1) : 1,
                            transition: `opacity ${importOverlayAnim === 'closing' ? CONFIG.IMPORT_HEADER_FADE_OUT_DURATION : CONFIG.IMPORT_HEADER_FADE_IN_DURATION}ms ease-out`
                        }}
                    >
                      {/* Bouton Recherche */}
                      <button 
                          onClick={() => {
                            if (searchOverlayAnim !== 'none' || showImportMenu) return;
                            setSearchCloseBtnAnimKey(0);
                            setSearchOverlayAnim('opening');
                            setTimeout(() => {
                                setIsLibrarySearching(true);
                                setSearchOverlayAnim('none');
                            }, CONFIG.SEARCH_LIBRARY_FADE_IN_DURATION);
                        }}
                          className="flex-1 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200"
                          style={{ height: CONFIG.HEADER_BUTTONS_HEIGHT }}
                      >
                          <Search style={{ width: `calc(${CONFIG.HEADER_BUTTONS_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)`, height: `calc(${CONFIG.HEADER_BUTTONS_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)` }} />
                      </button>
                  
                      {/* Bouton Import */}
                      <button 
                          data-import-btn
                          onClick={() => {
                            if (showImportMenu) return;
                            setShowImportMenu(true);
                            setImportMenuVisible(false);
                            setImportButtonsReady(false);
                            // Attendre 2 frames pour que le fade in commence
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    setImportMenuVisible(true);
                                    // Déclencher les animations ON après le fade in
                                    setTimeout(() => {
                                        setImportButtonsReady(true);
                                    }, CONFIG.IMPORT_HEADER_FADE_IN_DURATION);
                                });
                            });
                        }}
                          className="flex-1 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          style={{ height: CONFIG.HEADER_BUTTONS_HEIGHT }}
                      >
                          <FolderDown style={{ width: `calc(${CONFIG.HEADER_BUTTONS_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)`, height: `calc(${CONFIG.HEADER_BUTTONS_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)` }} />
                      </button>

                      {/* Bouton Créer Vibe */}
                      <div className="flex-1 relative" style={{ height: CONFIG.HEADER_BUTTONS_HEIGHT }}>
                          <NeonGlow
                              key={`builder-glow-${builderBtnIgniting}`}
                              colorName="pink"
                              glowRGB="236, 72, 153"
                              enabled={!showImportMenu && importOverlayAnim === 'none'}
                              igniteOnMount={builderBtnIgniting}
                              flickerEnabled={false}
                              className="absolute inset-0 rounded-full"
                              style={{
                                  background: '#ec4899',
                                  zIndex: 0
                              }}
                          />
                          <button 
                              onClick={() => {
                                  if (showImportMenu) return;
                                  setBuilderBtnIgniting(true);
                                  setShowBuilder(true);
                                  setTimeout(() => setBuilderBtnIgniting(false), CONFIG.IMPORT_IGNITE_DURATION);
                              }} 
                              className="relative z-10 w-full h-full rounded-full flex items-center justify-center"
                          >
                              <Plus style={{ width: `calc(${CONFIG.HEADER_BUTTONS_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)`, height: `calc(${CONFIG.HEADER_BUTTONS_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)` }} strokeWidth={2.5} className="text-white" />
                          </button>
                      </div>
                  </div>

                  {/* Boutons d'import - par-dessus avec fade in */}
                    {(showImportMenu || importOverlayAnim !== 'none') && (
                        <div 
                            className="absolute inset-0 flex items-center"
                            style={{
                                gap: CONFIG.HEADER_BUTTONS_GAP,
                                opacity: importMenuVisible ? 1 : 0,
                                transition: `opacity ${importOverlayAnim === 'closing' ? CONFIG.IMPORT_HEADER_FADE_OUT_DURATION : CONFIG.IMPORT_HEADER_FADE_IN_DURATION}ms ease-out`
                            }}
                        >
                            {/* Bouton NUKE */}
                            <div className="flex-1 relative" style={{ height: CONFIG.HEADER_BUTTONS_HEIGHT }}>
                                <ImportButton
                                    key={`nuke-${importButtonsReady}`}
                                    type="nuke"
                                    ready={importButtonsReady}
                                    className="absolute inset-0 rounded-full"
                                    style={{ zIndex: 0 }}
                                />
                                <button 
                                    onClick={() => {
                                        setImportBtnIgniting('nuke');
                                        setImportMenuVisible(false);
                                        setImportOverlayAnim('closing');
                                        setTimeout(() => {
                                            setShowImportMenu(false);
                                            setImportOverlayAnim('none');
                                            setImportButtonsReady(false);
                                            setImportBtnIgniting(null);
                                            handleNukeAll();
                                        }, CONFIG.IMPORT_HEADER_FADE_OUT_DURATION);
                                    }}
                                    className="relative z-10 w-full h-full rounded-full flex items-center justify-center"
                                >
                                    <Radiation style={{
                                        width: `calc(${CONFIG.HEADER_BUTTONS_HEIGHT} * ${CONFIG.IMPORT_ICON_SIZE_PERCENT} / 100)`,
                                        height: `calc(${CONFIG.HEADER_BUTTONS_HEIGHT} * ${CONFIG.IMPORT_ICON_SIZE_PERCENT} / 100)`
                                    }} className="text-white" />
                                </button>
                            </div>
                            
                            {/* Bouton DROPBOX */}
                            <div className="flex-1 relative" style={{ height: CONFIG.HEADER_BUTTONS_HEIGHT }}>
                                <ImportButton
                                    key={`dropbox-${importButtonsReady}`}
                                    type="dropbox"
                                    ready={importButtonsReady}
                                    className="absolute inset-0 rounded-full"
                                    style={{ zIndex: 0 }}
                                />
                                <button 
                                    ref={dropboxButtonRef}
                                    onClick={() => {
                                        setImportBtnIgniting('dropbox');
                                        handleDropboxAuth();
                                    }}
                                    className="relative z-10 w-full h-full rounded-full flex items-center justify-center"
                                >
                                    <DropboxLogoVector 
                                        size={parseFloat(CONFIG.HEADER_BUTTONS_HEIGHT) * CONFIG.IMPORT_ICON_SIZE_PERCENT / 100 * 16}
                                        fill="#ffffff"
                                    />
                                </button>
                            </div>
                            
                            {/* Bouton FOLDER */}
                            <div className="flex-1 relative" style={{ height: CONFIG.HEADER_BUTTONS_HEIGHT }}>
                                <ImportButton
                                    key={`folder-${importButtonsReady}`}
                                    type="folder"
                                    ready={importButtonsReady}
                                    className="absolute inset-0 rounded-full"
                                    style={{ zIndex: 0 }}
                                />
                                <button 
                                    ref={folderButtonCallbackRef}
                                    onClick={() => {
                                        if (folderButtonRef.current) {
                                            const rect = folderButtonRef.current.getBoundingClientRect();
                                            setFolderRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
                                        }
                                        setImportBtnIgniting('folder');
                                        folderInputRef.current?.click();
                                    }}
                                    className="relative z-10 w-full h-full rounded-full flex items-center justify-center"
                                >
                                    <FolderDown style={{
                                        width: `calc(${CONFIG.HEADER_BUTTONS_HEIGHT} * ${CONFIG.IMPORT_ICON_SIZE_PERCENT} / 100)`,
                                        height: `calc(${CONFIG.HEADER_BUTTONS_HEIGHT} * ${CONFIG.IMPORT_ICON_SIZE_PERCENT} / 100)`,
                                        color: CONFIG.IMPORT_FOLDER_ICON_COLOR
                                    }} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Handle - slide depuis le haut */}
                {(showImportMenu || importOverlayAnim !== 'none') && (
                    <div 
                        className="flex justify-center items-end w-full overflow-hidden"
                        style={{
                            animation: importOverlayAnim === 'closing' 
                                ? `import-handle-slide-out ${CONFIG.IMPORT_HEADER_FADE_OUT_DURATION}ms ease-out forwards`
                                : `import-handle-slide-in ${CONFIG.IMPORT_HEADER_FADE_IN_DURATION}ms ease-out forwards`
                        }}
                    >
                        <div
                            className="bg-gray-300 rounded-full handle-pulse cursor-pointer"
                            style={{
                                width: `${CONFIG.IMPORT_HANDLE_WIDTH_PERCENT}%`,
                                height: UNIFIED_CONFIG.HANDLE_HEIGHT,
                                marginTop: `${CONFIG.HEADER_PADDING_BOTTOM}rem`
                            }}
                            onClick={() => {
                                setImportMenuVisible(false);
                                setImportOverlayAnim('closing');
                                setTimeout(() => {
                                    setShowImportMenu(false);
                                    setImportOverlayAnim('none');
                                    setImportButtonsReady(false);
                                    setImportBtnIgniting(null);
                                }, CONFIG.IMPORT_HEADER_FADE_OUT_DURATION);
                            }}
                        />
                    </div>
                )}
                </>
            )}
          </div>

            {/* Bouton VIBE THIS - Dans le header sticky, sous la search bar */}
            {isLibrarySearching && librarySearchQuery && librarySearchResults.length > 0 && (
                <div style={{ marginTop: `${CONFIG.HEADER_VIBETHIS_MARGIN_TOP}rem` }}>
                    {(() => {
                        const gradientColors = getGradientByIndex(vibeTheseGradientIndex);
                        const step = 100 / (gradientColors.length - 1);
                        const gradient = `linear-gradient(135deg, ${gradientColors.map((c, i) => `${c} ${Math.round(i * step)}%`).join(', ')})`;
                        return (
                            <button 
                                onClick={() => {
                                    if (currentSong) {
                                        setPendingVibe('__SEARCH_RESULTS__');
                                    } else {
                                        vibeSearchResults();
                                    }
                                }}
                                className="w-full h-8 rounded-full font-black flex items-center justify-center gap-2 transition-transform text-base text-white"
                                style={{
                                    background: gradient,
                                    boxShadow: `0 4px 15px ${gradientColors[0]}66, 0 0 20px ${gradientColors[Math.floor(gradientColors.length / 2)]}44`
                                }}
                            >
                                <Flame size={18} className="fill-white" />
                                <span>VIBE THESE</span>
                                <span className="font-normal opacity-70">({librarySearchResults.length})</span>
                            </button>
                        );
                    })()}
                </div>
            )}
            
            </div>
        {/* FIN HEADER */}

        {/* LIBRARY */}
        <div
            className="flex-1 overflow-y-auto px-6 pb-6 no-scrollbar"
            style={{ paddingBottom: `calc(${FOOTER_CONTENT_HEIGHT_CSS} + ${safeAreaBottom}px + ${CONFIG.FOOTER_TOP_SPACING}px)`
          }}
            onTouchStart={(e) => {
                // Long press pour entrer en mode Tweaker
                const timer = setTimeout(() => {
                    setShowTweaker(true);
                }, 800);
                e.currentTarget.dataset.longPressTimer = timer;
            }}
            onTouchEnd={(e) => {
                clearTimeout(e.currentTarget.dataset.longPressTimer);
            }}
            onTouchMove={(e) => {
                clearTimeout(e.currentTarget.dataset.longPressTimer);
            }}
        >
          {/* CONTENT */}
          {librarySearchQuery ? (
                <div className="space-y-0 pt-2">
                    {/* Liste compacte des résultats */}
                    {librarySearchResults.length > 0 ? (
                        librarySearchResults.map((song, i) => (
                            <div 
                                key={`${song.id}-${i}`} 
                                onClick={() => playFromLibrarySearch(song)}
                                className="flex items-center justify-between h-[2.125rem] bg-white active:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
                            >
                                <div className="flex-1 flex flex-col overflow-hidden px-3 justify-center h-full leading-[0.875rem]">
                                    <span className="text-xs font-bold truncate text-gray-900" style={{ lineHeight: '0.875rem' }}>{song.title}</span>
                                    <span className="text-[0.625rem] text-gray-500 truncate font-medium" style={{ lineHeight: '0.875rem' }}>{song.artist}</span>
                                </div>
                                <div className="flex items-center gap-0.5 text-[0.5625rem] text-gray-300 font-mono pr-3">
                                    <Headphones style={{ width: '0.5625rem', height: '0.5625rem' }} /> 
                                    <span>{song.playCount || 0}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-300 font-medium text-2xl">—</div>
                    )}
                </div>
            ) : (
              <div className="flex flex-col" style={{ gap: `${CONFIG.VIBECARD_GAP_VH}vh`, marginTop: `${CONFIG.HEADER_CARDS_GAP}rem` }}>
                    {Object.keys(playlists).map((folderName, index) => {
                        const songs = playlists[folderName];
                        const isVibe = songs[0]?.type === 'vibe' || folderName.includes('Vibe'); 
                        const availableCount = songs.filter(s => isSongAvailable(s)).length;
                        const unavailableCount = songs.length - availableCount;
                        const isExpired = availableCount === 0;
                        return (
                            <VibeCard 
                                key={folderName}
                                animationIndex={index}
                                animationKey={cardsAnimKey}
                                animationDelay={cardsAnimDelay} 
                                folderName={folderName} 
                                availableCount={availableCount}
                                unavailableCount={unavailableCount}
                                isVibe={isVibe}
                                isExpired={isExpired}
                                onClick={() => playFolder(folderName)}
                                onReimport={() => document.querySelector('input[type="file"]').click()}
                                colorIndex={vibeColorIndices[folderName] !== undefined ? vibeColorIndices[folderName] : getInitialGradientIndex(folderName)}
                                onColorChange={(direction) => {
                                    setVibeColorIndices(prev => ({
                                        ...prev,
                                        [folderName]: (prev[folderName] !== undefined ? prev[folderName] : getInitialGradientIndex(folderName)) + direction
                                    }));
                                }}
                                onSwipeProgress={setVibeSwipePreview}
                                isBlinking={blinkingVibe === folderName}
                                onBlinkComplete={() => {
                                    const vibeToLaunch = blinkingVibe;
                                    setBlinkingVibe(null);
                                    launchVibe(vibeToLaunch);
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {/* Spacer dynamique pour éviter que le contenu soit caché par le drawer */}
            {currentSong && (
                <div style={{ height: `${dashboardHeight}px`, flexShrink: 0 }} />
            )}

        </div>

        {/* TWEAKER MODE */}
        {showTweaker && (
            <Tweaker
            playlists={playlists} 
            vibeColorIndices={vibeColorIndices}
            cardAnimConfig={{
              openDuration: CONFIG.CARD_ANIM_OPEN_DURATION,
              openDecel: CONFIG.CARD_ANIM_OPEN_DECEL,
              closeDuration: CONFIG.CARD_ANIM_CLOSE_DURATION,
              closeRotation: CONFIG.CARD_ANIM_CLOSE_ROTATION,
              radius: CONFIG.CARD_ANIM_RADIUS,
              borderColor: CONFIG.CARD_ANIM_BORDER_COLOR,
              borderWidth: CONFIG.CARD_ANIM_BORDER_WIDTH,
              originY: CONFIG.CARD_ANIM_ORIGIN_Y,
          }}
              setVibeColorIndices={setVibeColorIndices}
                onSave={(newPlaylists) => {
                  setPlaylists(newPlaylists);
                  // Ne PAS fermer ici - le Tweaker appellera onCancel après l'animation
            }}
            onCancel={() => setShowTweaker(false)}
            onCloseStart={() => {
              setCardsAnimDelay(CONFIG.CARD_ANIM_CLOSE_DURATION);
              setCardsAnimKey(k => k + 1);
          }}
            VibeCardComponent={VibeCard}
            getInitialGradientIndex={getInitialGradientIndex}
            getGradientName={getGradientName}
            getGradientByIndex={getGradientByIndex}
            hasSong={!!currentSong}
            capsuleHeightVh={CONFIG.CAPSULE_HEIGHT_MINI_VH}
            onSwipeProgress={setVibeSwipePreview}
        />
        )}

        {/* DASHBOARD DRAWER */}
        {(!showFullPlayer || isPlayerClosing) && currentSong && (
                    <div 
                    ref={dashboardRef} 
                    className="absolute left-0 right-0 bg-white/100 backdrop-blur-3xl border-t border-gray-200 shadow-[0_-10px_15px_-8px_rgba(0,0,0,0.15)] rounded-t-[2.5rem] p-0 z-[60] flex flex-col overflow-hidden touch-none drawer-optimized"
                    style={{ 
                      height: currentSong 
                          ? (typeof dashboardHeight === 'number' ? `${dashboardHeight}px` : dashboardHeight)
                          : `${(mainContainerRef.current?.offsetHeight || window.innerHeight) * CONFIG.DRAWER_HANDLE_HEIGHT_PERCENT / 100}px`,
                      minHeight: `${(mainContainerRef.current?.offsetHeight || window.innerHeight) * CONFIG.DRAWER_HANDLE_HEIGHT_PERCENT / 100 - CONFIG.DRAWER_SEPARATOR_HEIGHT}px`,
                      bottom: `calc(${FOOTER_CONTENT_HEIGHT_CSS} + ${safeAreaBottom}px)`,
                      transition: isDrawerAnimating 
                          ? `height ${CONFIG.DRAWER_TWEAKER_ANIMATION_DURATION}ms cubic-bezier(0, ${CONFIG.DRAWER_TWEAKER_ANIMATION_DECEL}, ${1 - CONFIG.DRAWER_TWEAKER_ANIMATION_DECEL}, 1)` 
                          : 'none'
                  }}
                >

                        {/* Handle pour drag */}
                        <div 
                            onTouchStart={currentSong ? handleDashTouchStart : undefined} 
                            onTouchMove={currentSong ? handleDashTouchMove : undefined} 
                            onTouchEnd={currentSong ? handleDashTouchEnd : undefined} 
                            className={`w-full relative flex flex-col justify-center items-center touch-none flex-shrink-0 border-b border-gray-200 ${currentSong ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                            style={{ height: `${(mainContainerRef.current?.offsetHeight || window.innerHeight) * CONFIG.DRAWER_HANDLE_HEIGHT_PERCENT / 100}px` }}
                        >
                            {currentSong && (
                                <div
                                    className="bg-gray-300 rounded-full handle-pulse"
                                    style={{
                                        width: CONFIG.PLAYER_HEADER_HANDLE_WIDTH,
                                        height: UNIFIED_CONFIG.HANDLE_HEIGHT
                                    }}
                                />
                            )}
                        </div>
                        
                        {/* Song Wheel - seulement si vibe lancée */}
                        {currentSong && (
                        <div className="flex-1 flex flex-col overflow-hidden relative bg-white/0">
                        <SongWheel 
                                queue={queue} 
                                currentSong={currentSong} 
                                onSongSelect={(song) => { setCurrentSong(song); setIsPlaying(true); setScrollTrigger(t => t + 1); }} 
                                isPlaying={isPlaying} 
                                togglePlay={() => setIsPlaying(!isPlaying)} 
                                playPrev={playPrev} 
                                playNext={playNext} 
                                onReorder={handleReorder} 
                                visibleItems={Math.max(3, Math.floor((((typeof dashboardHeight === 'number' ? dashboardHeight : window.innerHeight * (CONFIG.DRAWER_DEFAULT_HEIGHT_PERCENT / 100)) - (mainContainerRef.current?.offsetHeight || window.innerHeight) * CONFIG.DRAWER_HANDLE_HEIGHT_PERCENT / 100) / (window.innerHeight * CONFIG.WHEEL_ITEM_HEIGHT_MINI_VH / 100))))} 
                                scrollTrigger={scrollTrigger} 
                                isMini={true}
                                realHeight={(typeof dashboardHeight === 'number' ? dashboardHeight : window.innerHeight * (CONFIG.DRAWER_DEFAULT_HEIGHT_PERCENT / 100)) - (mainContainerRef.current?.offsetHeight || window.innerHeight) * CONFIG.DRAWER_HANDLE_HEIGHT_PERCENT / 100}
                                portalTarget={mainContainerRef}
                                beaconNeonRef={drawerBeaconRef}
                                onCenteredIndexChange={setDrawerCenteredIndex}
                                initialIndex={playerCenteredIndex}
                                />
                                </div>
                                )}
                            </div>
                        )}

                {/* FOOTER - BARRE DU BAS */}
                <div
                    className="z-[90] flex flex-col absolute left-0 right-0"
                    style={{
                      height: `calc(${FOOTER_CONTENT_HEIGHT_CSS} + ${safeAreaBottom}px)`,
                      paddingBottom: safeAreaBottom,
                      bottom: 0,
                      transform: (currentSong || vibeSwipePreview || pendingVibe || nukeConfirmMode) ? 'translateY(0)' : 'translateY(100%)',
                      transition: `transform ${CONFIG.FOOTER_SLIDE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
                  }}
                >
                    {/* Fond avec blur - couvre TOUTE la zone y compris safe-area */}
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 rounded-b-none"></div>
                    {/* BARRE DE CONTRÔLE */}
                    {!(pendingVibe || nukeConfirmMode) && (
                        <ControlBar
                        currentTime={progress}
                        duration={duration}
                        onSeek={(e) => { if(audioRef.current) { audioRef.current.currentTime = e.target.value; setProgress(e.target.value); }}}
                        onSkipBack={skipBackward10}
                        onSkipForward={skipForward10}
                        confirmMode={false}
                        confirmType={null}
                        vibeSwipePreview={vibeSwipePreview}
                        onRecenter={triggerRecenter}
                        volume={volume}
                        onVolumeTouchStart={handleVolumeTouchStart}
                        onVolumeTouchMove={handleVolumeTouchMove}
                        onVolumeTouchEnd={handleVolumeTouchEnd}
                        isVolumeActive={isVolumeActive}
                        mainContainerRef={mainContainerRef}
                        volumeMorphProgress={volumeMorphProgress}
                        volumePreview={volumePreview}
                        beaconNeonRef={showFullPlayer ? beaconNeonRef : drawerBeaconRef}
                        capsuleHeightVh={showFullPlayer ? CONFIG.CAPSULE_HEIGHT_VH : CONFIG.CAPSULE_HEIGHT_MINI_VH}
                        volumeBeaconRect={volumeBeaconRect}
                     />
                    )}
                    
                    {/* CAPSULE DE CONFIRMATION - RECOUVRE LA BARRE DE CONTRÔLE */}
                    {(pendingVibe || nukeConfirmMode) && (
                        <div
                            className="absolute left-0 right-0 flex items-start z-50"
                            style={{
                                top: UNIFIED_CONFIG.FOOTER_PADDING_TOP,
                                padding: `0 ${CONFIG.CONTROL_BAR_SPACING_PERCENT / 4}%`,
                                height: UNIFIED_CONFIG.FOOTER_BTN_HEIGHT
                            }}
                        >
                            <div
                                className="flex-1 h-full relative"
                                style={{
                                    opacity: confirmOverlayVisible ? 1 : 0,
                                    transition: 'opacity 150ms ease-out'
                                }}
                            >
                                {/* Capsule statique - visible tant qu'on n'a pas confirmé */}
                                {!confirmFeedback && (
                                    <div
                                        className="absolute inset-0 rounded-full flex items-center justify-center border"
                                        style={{
                                            backgroundColor: pendingVibe ? '#FF6700' : '#FF073A',
                                            borderColor: pendingVibe ? '#CC5200' : '#CC0530',
                                            boxShadow: pendingVibe
                                                ? '0 0 25px rgba(255, 103, 0, 0.7), 0 0 50px rgba(255, 103, 0, 0.4)'
                                                : '0 0 25px rgba(255, 7, 58, 0.7), 0 0 50px rgba(255, 7, 58, 0.4)'
                                        }}
                                    >
                                        <div className="flex items-center gap-2 text-white font-black tracking-widest text-xs">
                                            {pendingVibe ? <Skull size={20} strokeWidth={3} /> : <Radiation size={20} strokeWidth={3} />}
                                            <span>{pendingVibe ? CONFIG.KILL_TEXT : CONFIG.NUKE_TEXT}</span>
                                        </div>
                                    </div>
                                )}
                                {/* FeedbackOverlay avec animation ignite quand on confirme */}
                                {confirmFeedback && (
                                    <FeedbackOverlay
                                        feedback={confirmFeedback}
                                        onAnimationComplete={onConfirmAnimationComplete}
                                        neonColor={confirmFeedback.type === 'kill' ? CONFIG.NEON_COLOR_ORANGE : CONFIG.NEON_COLOR_RED}
                                        bgClass={confirmFeedback.type === 'kill' ? 'bg-orange-500' : 'bg-red-500'}
                                        borderClass={confirmFeedback.type === 'kill' ? 'border-orange-600' : 'border-red-600'}
                                    >
                                        {confirmFeedback.type === 'kill' ? <Skull size={20} strokeWidth={3} /> : <Radiation size={20} strokeWidth={3} />}
                                        <span>{confirmFeedback.text}</span>
                                    </FeedbackOverlay>
                                )}
                            </div>
                        </div>
                    )}
                </div>

{/* BACK TO VIBES OVERLAY - AU DESSUS DE TOUT */}
        {showMainPlayerTrigger && (
            <div 
                className="absolute inset-0 z-[100] flex flex-col items-center justify-center text-white pointer-events-none"
                style={{ 
                    backgroundColor: `rgba(0, 0, 0, ${CONFIG.BACK_TO_VIBES_BG_OPACITY})`,
                    opacity: mainPlayerTriggerOpacity 
                }}
            >
                <Maximize2 
                    size={isInTriggerZone ? 64 : 48} 
                    className={`mb-4 transition-all duration-150 ${isInTriggerZone ? 'animate-bounce-neon-lime' : ''}`}
                />
                <span 
                    className={`font-black tracking-widest transition-all duration-150 ${isInTriggerZone ? 'animate-neon-lime' : ''}`}
                    style={{ fontSize: isInTriggerZone ? '1.66rem' : '1.25rem' }}
                >
                    BACK TO VIBES
                </span>
            </div>
        )}

        {/* DROPBOX BROWSER */}
        <DropboxBrowser
    isVisible={showDropboxBrowser}
    onClose={() => {
        setShowDropboxBrowser(false);
        setDropboxSourceRect(null);
    }}
    onDisconnect={() => {
        clearDropboxTokens();
        setDropboxToken(null);
        setDropboxSourceRect(null);
    }}
    onImport={(scannedFolders, rootName) => {
        setShowDropboxBrowser(false);
        setDropboxSourceRect(null);
        setPendingDropboxData({ folders: scannedFolders, rootName });
    }}
    onMenuClose={() => {
        setImportOverlayAnim('closing');
        setTimeout(() => {
            setShowImportMenu(false);
            setImportOverlayAnim('none');
            setImportButtonsReady(false);
            setImportBtnIgniting(null);
        }, CONFIG.IMPORT_HEADER_FADE_OUT_DURATION);
    }}
    dropboxToken={dropboxToken}
    getValidDropboxToken={getValidDropboxToken}
    refreshDropboxToken={refreshDropboxToken}
    clearDropboxTokens={clearDropboxTokens}
    sourceRect={dropboxSourceRect}
/>

        {/* CONFIRMATION PILL (slide to confirm) */}
        {(pendingVibe || nukeConfirmMode) && mainContainerRef.current && (() => {
            const containerRect = mainContainerRef.current.getBoundingClientRect();
            const pillHeight = containerRect.width * CONFIG.CONFIRM_PILL_HEIGHT_PERCENT / 100;
            const pillWidth = containerRect.width * CONFIG.CONFIRM_PILL_WIDTH_PERCENT / 100;
            const cursorSize = pillHeight * CONFIG.CONFIRM_PILL_CURSOR_SIZE_PERCENT / 100;
            const iconSize = pillHeight * CONFIG.CONFIRM_PILL_ICON_SIZE_PERCENT / 100;

            // Padding interne du pill (espace entre le bord et le curseur)
            const pillPadding = (pillHeight - cursorSize) / 2;

            // Scale pour que le curseur grossisse jusqu'à pillHeight (diamètre du tube)
            const pulseScaleMax = pillHeight / cursorSize;

            // Taille max de la bulle quand elle pulse (= pillHeight)
            const maxBubbleSize = pillHeight;

            // Zone de déplacement du curseur - bloqué quand la TAILLE MAX touche le bord
            // La bulle peut grossir jusqu'à pillHeight, donc son centre doit rester à pillHeight/2 du bord
            const maxSlide = (pillWidth / 2) - (maxBubbleSize / 2);
            const clampedX = Math.max(-maxSlide, Math.min(maxSlide, confirmSwipeX));
            const slideProgress = clampedX / maxSlide; // -1 (cancel) to +1 (confirm)

            const isAtLeftThreshold = slideProgress <= -0.9;
            const isAtRightThreshold = slideProgress >= 0.9;

            return (
            <>
                {/* Backdrop blur fixe (pas animé = performant) */}
                <div
                    className="absolute left-0 right-0 z-[64] pointer-events-none"
                    style={{
                        top: 0,
                        bottom: `calc(${FOOTER_CONTENT_HEIGHT_CSS} + ${safeAreaBottom}px)`,
                        backdropFilter: `blur(${CONFIG.CONFIRM_BACKDROP_BLUR}px)`,
                        WebkitBackdropFilter: `blur(${CONFIG.CONFIRM_BACKDROP_BLUR}px)`,
                        opacity: confirmOverlayVisible ? 1 : 0,
                        transition: `opacity ${CONFIG.CONFIRM_FADE_DURATION}ms ease-out`,
                    }}
                />
                {/* Le pill par-dessus */}
                <div
                    className="absolute left-0 right-0 z-[65] flex items-center justify-center pointer-events-none"
                    style={{
                        top: 0,
                        bottom: `calc(${FOOTER_CONTENT_HEIGHT_CSS} + ${safeAreaBottom}px)`,
                        opacity: confirmOverlayVisible ? 1 : 0,
                        transition: `opacity ${CONFIG.CONFIRM_FADE_DURATION}ms ease-out`,
                    }}
                >
                    {/* Le pill glassmorphism */}
                    <div
                        className="relative flex items-center justify-between pointer-events-auto"
                        style={{
                            width: pillWidth,
                            height: pillHeight,
                            borderRadius: pillHeight / 2,
                            backgroundColor: CONFIG.CONFIRM_PILL_BG_COLOR,
                            backdropFilter: `blur(${CONFIG.CONFIRM_PILL_BLUR}px)`,
                            WebkitBackdropFilter: `blur(${CONFIG.CONFIRM_PILL_BLUR}px)`,
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            padding: pillPadding,
                        }}
                        onTouchStart={(e) => {
                            e.stopPropagation();
                            setConfirmSwipeStart(e.touches[0].clientX - confirmSwipeX);
                        }}
                        onTouchMove={(e) => {
                            if (confirmSwipeStart === null) return;
                            const newX = e.touches[0].clientX - confirmSwipeStart;
                            setConfirmSwipeX(newX);
                        }}
                        onTouchEnd={() => {
                            if (isAtRightThreshold) {
                                // Swipe right = validate
                                // NE PAS reset confirmSwipeX - le curseur reste à droite pendant l'animation ignite
                                if (pendingVibe) {
                                    setConfirmFeedback({ text: CONFIG.KILL_TEXT, type: 'kill', triggerValidation: Date.now() });
                                } else {
                                    setConfirmFeedback({ text: CONFIG.NUKE_TEXT, type: 'nuke', triggerValidation: Date.now() });
                                }
                            } else if (isAtLeftThreshold) {
                                // Swipe left = cancel
                                // NE PAS reset confirmSwipeX - le curseur reste à gauche pendant l'animation ignite
                                if (pendingVibe) {
                                    cancelKillVibe();
                                } else {
                                    cancelNuke();
                                }
                            } else {
                                // PAS au seuil = retour au centre
                                setConfirmSwipeX(0);
                            }
                            setConfirmSwipeStart(null);
                        }}
                    >
                        {/* X icon à gauche - cachée quand la bulle la recouvre */}
                        <div
                            className="flex items-center justify-center"
                            style={{
                                width: cursorSize,
                                height: cursorSize,
                                opacity: isAtLeftThreshold ? 0 : 0.5,
                                transition: 'opacity 150ms ease-out',
                            }}
                        >
                            <X
                                size={iconSize}
                                className="text-gray-400"
                                strokeWidth={2.5}
                            />
                        </div>

                        {/* Curseur central draggable */}
                        <div
                            className={`absolute flex items-center justify-center ${
                                confirmFeedback
                                    ? (confirmFeedback.type === 'kill' ? 'animate-ignite-pill-lime' : 'animate-ignite-pill-red')
                                    : (isAtLeftThreshold ? 'animate-pulse-pill-red' : isAtRightThreshold ? 'animate-pulse-pill-lime' : '')
                            }`}
                            style={{
                                '--pulse-scale-min': 1,
                                '--pulse-scale-max': pulseScaleMax,
                                width: cursorSize,
                                height: cursorSize,
                                borderRadius: '50%',
                                backgroundColor: isAtLeftThreshold || confirmFeedback?.type === 'nuke' || confirmFeedback?.type === 'cancel'
                                    ? 'rgba(239, 68, 68, 0.9)'
                                    : isAtRightThreshold || confirmFeedback?.type === 'kill'
                                        ? 'rgba(132, 204, 22, 0.9)'
                                        : CONFIG.CONFIRM_PILL_CURSOR_COLOR,
                                left: `calc(50% - ${cursorSize / 2}px + ${clampedX}px)`,
                                transition: confirmSwipeStart !== null ? 'none' : 'left 200ms ease-out, background-color 150ms ease-out',
                            }}
                        >
                            {/* Chevrons horizontaux (gauche/droite) - cachés au seuil */}
                            <div
                                className="flex items-center"
                                style={{
                                    opacity: (isAtLeftThreshold || isAtRightThreshold) ? 0 : 0.6,
                                    transition: 'opacity 150ms ease-out',
                                }}
                            >
                                <ChevronLeft
                                    size={iconSize * 0.5}
                                    className="text-gray-500 -mr-2"
                                    strokeWidth={2}
                                />
                                <ChevronRight
                                    size={iconSize * 0.5}
                                    className="text-gray-500"
                                    strokeWidth={2}
                                />
                            </div>
                            {/* Icône X ou Check quand au seuil (contenue dans la bulle) */}
                            {isAtLeftThreshold && (
                                <X
                                    size={iconSize * 0.7}
                                    className="text-white absolute"
                                    strokeWidth={2.5}
                                />
                            )}
                            {isAtRightThreshold && (
                                <Check
                                    size={iconSize * 0.7}
                                    className="text-white absolute"
                                    strokeWidth={2.5}
                                />
                            )}
                        </div>

                        {/* Check icon à droite - cachée quand la bulle la recouvre */}
                        <div
                            className="flex items-center justify-center"
                            style={{
                                width: cursorSize,
                                height: cursorSize,
                                opacity: isAtRightThreshold ? 0 : 0.5,
                                transition: 'opacity 150ms ease-out',
                            }}
                        >
                            <Check
                                size={iconSize}
                                className="text-gray-400"
                                strokeWidth={2.5}
                            />
                        </div>
                    </div>
                </div>
            </>
            );
        })()}

        {/* FULL SCREEN PLAYER */}
        {showFullPlayer && currentSong && (
          <div 
            className="absolute left-0 right-0 bg-white z-[70] flex flex-col overflow-hidden"
            style={{
              top: 0,
              bottom: 0,
              paddingBottom: `calc(${FOOTER_CONTENT_HEIGHT_CSS} + ${safeAreaBottom}px)`,
              opacity: playerFadeOpacity,
              transition: CONFIG.PLAYER_FADE_OUT_ENABLED 
                  ? `opacity ${CONFIG.PLAYER_FADE_OUT_DURATION}ms ease-out, transform ${CONFIG.PLAYER_SLIDE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
                  : `transform ${CONFIG.PLAYER_SLIDE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              transform: playerSwipeY > 0
                    ? `translateY(${playerSwipeY}px)`
                    : playerVisible 
                        ? 'translateY(0)' 
                        : playerStartY !== null 
                            ? `translateY(${playerStartY}px)`
                            : playerCloseY !== null
                                ? `translateY(${playerCloseY}px)`
                                : 'translateY(100%)',
                                ...(playerSwipeY > 0 && { transition: 'none' })
          }}
          >
            {/* Barre de statut iPhone (encoche) - masquée sur vrai appareil */}
            {!isOnRealDevice && (
              <div className="h-8 w-full bg-white flex justify-between items-center px-4 text-[10px] font-medium">
                  <div className="w-1/3">{currentTime}</div>
                  <div className="w-1/3 flex justify-center">
                      <div className="h-7 w-32 bg-black rounded-b-2xl absolute top-0"></div>
                  </div>
                  <div className="w-1/3 flex justify-end gap-1">5G <span className="ml-1">100%</span></div>
              </div>
            )}

            {/* ZONE DRAGGABLE - TOUT LE HEADER */}
            <div
                ref={playerHeaderRef}
                className="w-full flex flex-col items-center cursor-grab active:cursor-grabbing select-none border-b border-gray-200"
                style={{
                    paddingTop: `calc(env(safe-area-inset-top, 0px) + ${UNIFIED_CONFIG.TITLE_MARGIN_TOP})`,
                    paddingBottom: CONFIG.PLAYER_HEADER_HANDLE_MARGIN_BOTTOM,
                    gap: UNIFIED_CONFIG.TITLE_MARGIN_BOTTOM
                }}
                onTouchStart={handlePlayerTouchStart}
                onTouchMove={handlePlayerTouchMove}
                onTouchEnd={handlePlayerTouchEnd}
            >
                {/* Titre */}
                <div>
                    <VibingTitle size={20} />
                </div>

                {/* FUSION CONTROL BAR (VIVANT - Affiche les feedbacks ici) */}
                <div 
                    className="px-3 relative z-10 w-full"
                >
                <div className="relative flex items-center gap-3">
                <LiveHeaderCapsule 
                        activeFilter={activeFilter} 
                        setActiveFilter={applySort}
                        sortDirection={sortDirection}
                        onToggleSort={handleToggleSort}
                        isSearching={false} 
                        setIsSearching={setIsPlayerSearching} 
                        searchQuery={playerSearchQuery} 
                        setSearchQuery={setPlayerSearchQuery}
                        hideGlow={(feedback && (feedback.type === 'next' || feedback.type === 'archive'))}
                        glowOpacity={(isPlayerSearching || playerSearchOverlayAnim === 'opening') ? 0 : (playerSearchOverlayAnim === 'closing' ? 1 : 1)}
                        transitionDuration={playerSearchOverlayAnim === 'opening' ? CONFIG.SEARCH_PLAYER_FADE_IN_DURATION : (playerSearchOverlayAnim === 'closing' ? CONFIG.SEARCH_PLAYER_FADE_OUT_DURATION : 0)}
                    />
                    <button 
                        onClick={() => {
                            if (playerSearchOverlayAnim !== 'none') return;
                            setPlayerSearchCloseBtnAnimKey(0);
                            setPlayerSearchOverlayAnim('opening');
                            setTimeout(() => {
                                setIsPlayerSearching(true);
                                setPlayerSearchOverlayAnim('none');
                            }, CONFIG.SEARCH_PLAYER_FADE_IN_DURATION);
                        }} 
                        className="rounded-full flex-shrink-0 flex items-center justify-center shadow-sm transition-colors border border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100"
                        style={{ width: CONFIG.PLAYER_SORT_CAPSULE_HEIGHT, height: CONFIG.PLAYER_SORT_CAPSULE_HEIGHT }}
                    >
                        <Search style={{ width: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)`, height: `calc(${CONFIG.PLAYER_SORT_CAPSULE_HEIGHT} * ${CONFIG.UNIFIED_ICON_SIZE_PERCENT} / 100)` }} />
                    </button>
                    
                    {/* PLAYER SEARCH OVERLAY */}
                    {(isPlayerSearching || playerSearchOverlayAnim !== 'none') && (
                        <div 
                            className="absolute inset-0 flex items-center"
                            style={{ 
                                zIndex: 20,
                                animation: playerSearchOverlayAnim === 'opening'
                                    ? `search-fade-in ${CONFIG.SEARCH_PLAYER_FADE_IN_DURATION}ms ease-out forwards`
                                    : playerSearchOverlayAnim === 'closing'
                                        ? `search-fade-out ${CONFIG.SEARCH_PLAYER_FADE_OUT_DURATION}ms ease-in forwards`
                                        : 'none'
                            }}
                        >
                            <div 
                                className="w-full rounded-full border border-gray-100 shadow-sm flex items-center overflow-visible"
                                  style={{
                                    height: CONFIG.PLAYER_SORT_CAPSULE_HEIGHT,
                                    backgroundColor: `rgba(${CONFIG.CAPSULE_BG_COLOR}, 1)`,
                                    boxShadow: `0 -${CONFIG.SEARCH_LIBRARY_GLOW_VERTICAL}px ${CONFIG.SEARCH_LIBRARY_GLOW_BLUR}px rgba(${CONFIG.SEARCH_LIBRARY_GLOW_COLOR}, ${CONFIG.SEARCH_LIBRARY_GLOW_OPACITY}), 0 ${CONFIG.SEARCH_LIBRARY_GLOW_VERTICAL}px ${CONFIG.SEARCH_LIBRARY_GLOW_BLUR}px rgba(${CONFIG.SEARCH_LIBRARY_GLOW_COLOR}, ${CONFIG.SEARCH_LIBRARY_GLOW_OPACITY})`
                                }}
                            >
                                {/* Champ de recherche */}
                                <div 
                                    className="flex-1 h-full flex items-center rounded-l-full relative overflow-hidden"
                                    style={{
                                        paddingLeft: CONFIG.SEARCH_LIBRARY_PADDING_X,
                                        paddingRight: CONFIG.SEARCH_LIBRARY_PADDING_X
                                    }}
                                >
                                    <Search style={{ width: CONFIG.SEARCH_LIBRARY_ICON_SIZE, height: CONFIG.SEARCH_LIBRARY_ICON_SIZE }} className="text-gray-400 mr-3" />
                                    <input 
                                        autoFocus 
                                        type="text" 
                                        value={playerSearchQuery} 
                                        onChange={(e) => setPlayerSearchQuery(e.target.value)} 
                                        placeholder="" 
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 placeholder-gray-400 p-0 outline-none" 
                                    />
                                </div>
                                {/* Bouton X */}
                                <div className="h-full relative overflow-visible rounded-r-full" style={{ flex: CONFIG.SEARCH_LIBRARY_CLOSE_BTN_FLEX }}>
                                    <NeonGlow
                                        key={playerSearchCloseBtnAnimKey}
                                        colorName="pink"
                                        glowRGB={CONFIG.SEARCH_LIBRARY_GLOW_COLOR}
                                        enabled={true}
                                        igniteOnMount={playerSearchCloseBtnAnimKey > 0}
                                        flickerEnabled={playerSearchOverlayAnim !== 'closing'}
                                        className="absolute inset-0 rounded-r-full"
                                        style={{
                                            background: `rgba(${CONFIG.SORTBTN_COLOR}, 1)`,
                                            zIndex: 0
                                        }}
                                    />
                                    <button 
                                        onClick={() => {
                                            if (playerSearchOverlayAnim !== 'none') return;
                                            setPlayerSearchCloseBtnAnimKey(k => k + 1);
                                            setPlayerSearchOverlayAnim('closing');
                                            setTimeout(() => {
                                                setIsPlayerSearching(false);
                                                setPlayerSearchQuery('');
                                                setPlayerSearchOverlayAnim('none');
                                            }, CONFIG.SEARCH_PLAYER_FADE_OUT_DURATION);
                                        }}
                                        className="relative z-10 w-full h-full flex items-center justify-center text-white rounded-r-full"
                                    >
                                        <X style={{ width: CONFIG.SEARCH_LIBRARY_X_ICON_SIZE, height: CONFIG.SEARCH_LIBRARY_X_ICON_SIZE }} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {feedback && (feedback.type === 'next' || feedback.type === 'archive') && (
                        <FeedbackOverlay
                            feedback={feedback}
                            onAnimationComplete={() => setFeedback(null)}
                            neonColor={feedback.type === 'next' ? CONFIG.NEON_COLOR_EMERALD : CONFIG.NEON_COLOR_ROSE}
                            bgClass={feedback.type === 'next' ? 'bg-emerald-500' : 'bg-rose-500'}
                            borderClass={feedback.type === 'next' ? 'border-emerald-600' : 'border-rose-600'}
                        >
                            {feedback.type === 'next' ? <ListPlus size={20} strokeWidth={3} /> : <Archive size={20} strokeWidth={3} />}
                            <span>{feedback.text}</span>
                        </FeedbackOverlay>
                    )}
                </div>
                </div>

                {/* Poignée - fade out quand recherche, fade in quand on ferme */}
                <div
                    className="bg-gray-300 rounded-full"
                    style={{
                        width: CONFIG.PLAYER_HEADER_HANDLE_WIDTH,
                        height: UNIFIED_CONFIG.HANDLE_HEIGHT,
                        opacity: isPlayerSearching && playerSearchOverlayAnim === 'none' ? 0 : undefined,
                        animation: playerSearchOverlayAnim === 'opening'
                            ? `search-fade-out ${CONFIG.SEARCH_PLAYER_FADE_IN_DURATION}ms ease-out forwards`
                            : playerSearchOverlayAnim === 'closing'
                                ? `search-fade-in ${CONFIG.SEARCH_PLAYER_FADE_OUT_DURATION}ms ease-out forwards`
                                : (isPlayerSearching ? 'none' : 'handle-pulse 2s ease-in-out infinite')
                    }}
                />
            </div>

            <div 
                ref={songWheelWrapperRef} 
                className="flex-1 flex flex-col justify-center overflow-hidden relative bg-white"
            >{wheelWrapperHeight > 0 && <SongWheel queue={filteredPlayerQueue} currentSong={currentSong} onSongSelect={(song) => { setCurrentSong(song); setIsPlaying(true); setScrollTrigger(t => t + 1); if(isPlayerSearching) { setIsPlayerSearching(false); setPlayerSearchQuery(''); } }} isPlaying={isPlaying} togglePlay={() => setIsPlaying(!isPlaying)} playPrev={playPrev} playNext={playNext} onReorder={handleReorder} visibleItems={11} scrollTrigger={scrollTrigger} portalTarget={mainContainerRef} beaconNeonRef={beaconNeonRef} initialIndex={drawerCenteredIndex} onCenteredIndexChange={setPlayerCenteredIndex} realHeight={wheelWrapperHeight} />}</div>
                  </div>
                )}
        
                    {/* SMART IMPORT */}
                    <SmartImport 
                        playlists={playlists}
                        vibeColorIndices={vibeColorIndices}
                        getGradientByIndex={getGradientByIndex}
                        getGradientName={getGradientName}
                        dropboxData={pendingDropboxData}
                        onDropboxDataClear={() => setPendingDropboxData(null)}
                        onImportComplete={(folders, mode, folderGradients, isDropbox) => {
                          if (isDropbox) {
                              processDropboxImport(folders);
                          } else {
                              processFileImport(folders);
                          }
                          // Appliquer les couleurs choisies dans SmartImport
                          if (folderGradients) {
                              setVibeColorIndices(prev => ({
                                  ...prev,
                                  ...folderGradients
                              }));
                          }
                          setCardsAnimDelay(0);
                          setCardsAnimKey(k => k + 1);
                      }}
                      onMenuClose={() => {
                        setImportOverlayAnim('closing');
                        setTimeout(() => {
                            setShowImportMenu(false);
                            setImportOverlayAnim('none');
                            setImportButtonsReady(false);
                            setImportBtnIgniting(null);
                        }, CONFIG.IMPORT_HEADER_FADE_OUT_DURATION);
                    }}
                    inputRef={folderInputRef}
                    folderButtonRef={folderButtonRef}
                    dropboxButtonRef={dropboxButtonRef}
                    slideOutDuration={CONFIG.IMPORT_HEADER_FADE_OUT_DURATION}
                    folderButtonColor={CONFIG.IMPORT_FOLDER_COLOR}
                    dropboxButtonColor={CONFIG.IMPORT_DROPBOX_COLOR}
                    containerRef={mainContainerRef}
                    />

            {/* VIBE BUILDER OVERLAY */}
            {showBuilder && (() => {
                // Calculer l'index initial UNE SEULE FOIS au montage
                const usedIndices = Object.values(vibeColorIndices);
                const allIndices = Array.from({ length: ALL_GRADIENTS.length }, (_, i) => i);
                const unusedIndices = allIndices.filter(i => !usedIndices.includes(i));
                const initialIdx = unusedIndices.length > 0 ? unusedIndices[0] : 0;
                
                return (
                  <div className="absolute inset-0 z-[200]">
                  <VibeBuilder
                      sourcePlaylists={playlists}
                        onClose={() => setShowBuilder(false)}
                        cardAnimConfig={{
                          openDuration: CONFIG.CARD_ANIM_OPEN_DURATION,
                          openDecel: CONFIG.CARD_ANIM_OPEN_DECEL,
                          closeDuration: CONFIG.CARD_ANIM_CLOSE_DURATION,
                          closeRotation: CONFIG.CARD_ANIM_CLOSE_ROTATION,
                          radius: CONFIG.CARD_ANIM_RADIUS,
                          borderColor: CONFIG.CARD_ANIM_BORDER_COLOR,
                          borderWidth: CONFIG.CARD_ANIM_BORDER_WIDTH,
                          originY: CONFIG.CARD_ANIM_ORIGIN_Y,
                      }}
                        onSaveVibe={(name, songs, gradientIndex) => {
                          const vibeSongs = songs.map(s => ({...s, type: 'vibe'}));
                          
                          // Générer un nom unique si le nom existe déjà
                          let finalName = name;
                          let counter = 2;
                          setPlaylists(prev => {
                              while (prev[finalName] !== undefined) {
                                  finalName = `${name} (${counter})`;
                                  counter++;
                              }
                              return { ...prev, [finalName]: vibeSongs };
                          });
                          
                          setVibeColorIndices(prev => ({ ...prev, [finalName]: gradientIndex }));
                          // NE PAS fermer ici - le VibeBuilder appellera onClose après l'animation
                      }}
                        fadeMainAudio={fadeMainAudio}
                        onPlayNext={addToPlayNext}
                        hasActiveQueue={queue.length > 0 && currentSong !== null}
                        vibeCardConfig={{
                            height: `${CONFIG.VIBECARD_HEIGHT_VH}vh`,
                            heightPx: (mainContainerRef.current?.offsetHeight || window.innerHeight) * CONFIG.VIBECARD_HEIGHT_VH / 100,
                            gap: CONFIG.VIBECARD_GAP_VH,
                            liquidGlassBlur: CONFIG.LIQUID_GLASS_BLUR,
                            marqueeSpeed: CONFIG.MARQUEE_SPEED,
                            marqueeThreshold: CONFIG.VIBECARD_CAPSULE_MARQUEE_THRESHOLD,
                            capsuleNameMaxWidth: CONFIG.VIBECARD_CAPSULE_NAME_MAX_WIDTH,
                            capsuleFontSize: CONFIG.VIBECARD_CAPSULE_FONT_SIZE,
                            capsulePX: CONFIG.VIBECARD_CAPSULE_PX,
                            capsulePY: CONFIG.VIBECARD_CAPSULE_PY
                        }}
                        footerHeight={getFooterHeight()}
                        initialGradientIndex={initialIdx}
                        getGradientByIndex={getGradientByIndex}
                        getGradientName={getGradientName}
                        usedGradientIndices={usedIndices}
                        totalGradients={ALL_GRADIENTS.length}
                    />
                    </div>
                );
            })()}

      </div>
    </div>
  );
}

export { NeonGlow, CONFIG };