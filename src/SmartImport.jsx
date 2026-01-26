import React, { useState, useRef, useEffect } from 'react';
import { X, Flame, Layers, Check, AlertTriangle, Music, CheckCircle2, ChevronLeft, ChevronRight, Pointer, Copy } from 'lucide-react';
import { FlameWhiteVector } from './Assets.jsx';
import { UNIFIED_CONFIG, CylinderMask } from './Config.jsx';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    SMARTIMPORT - PARAMÈTRES TWEAKABLES                    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

export const SMARTIMPORT_CONFIG = {
    COLOR_SWIPE_PERCENT: UNIFIED_CONFIG.COLOR_SWIPE_PERCENT,  // Distance de swipe pour parcourir les dégradés (% largeur élément)
    
    // ══════════════════════════════════════════════════════════════════════════
    // SEUILS ET LIMITES
    // ══════════════════════════════════════════════════════════════════════════
    WARNING_THRESHOLD: 2000,              // Seuil de fichiers pour avertissement (warning visuel)
    AUTO_THRESHOLD: 600,                 // Seuil max pour import automatique (sans dialog)
    MIN_FILES_PER_VIBE: 5,               // Minimum de fichiers pour créer une Vibe (évite micro-Vibes)

    // ══════════════════════════════════════════════════════════════════════════
    // DIALOG - Dimensions générales
    // ══════════════════════════════════════════════════════════════════════════
    DIALOG_MAX_WIDTH: '20rem',           // Largeur max du dialog
    DIALOG_HEIGHT: '65vh',               // Hauteur max du dialog
    DIALOG_PADDING_VERTICAL: '0.75rem',  // Padding vertical du dialog (comme DropboxBrowser)
    HORIZONTAL_PADDING: '0.75rem',       // Padding horizontal header/boutons (comme DropboxBrowser)
    DIALOG_RADIUS: '1rem',               // Border radius général du dialog (unifié avec DropboxBrowser)
    DIALOG_BG_COLOR: '#FAFAFA',          // Couleur de fond du dossier (violet très pâle)
    
    // ══════════════════════════════════════════════════════════════════════════
    // DIALOG - Onglet dossier (folder tab)
    // ══════════════════════════════════════════════════════════════════════════
    FOLDER_TAB_ENABLED: false,            // Activer/désactiver l'onglet dossier
    FOLDER_TAB_WIDTH: '45%',             // Largeur de l'onglet (% du dialog)
    FOLDER_TAB_HEIGHT: '1.5rem',         // Hauteur de l'onglet
    FOLDER_TAB_RADIUS: '0.75rem',        // Arrondi du coin haut-gauche
    FOLDER_TAB_OVERLAP: '1px',           // Chevauchement avec le corps pour éviter les gaps
    FOLDER_TAB_SLANT: 15,                // Inclinaison du bord droit (% de la hauteur, 0 = vertical, 100 = très incliné)
    
    // ══════════════════════════════════════════════════════════════════════════
    // DIALOG - Zone liste
    // ══════════════════════════════════════════════════════════════════════════
    CARD_HEIGHT: '4rem',                 // Hauteur de chaque carte vibe
    CARD_RADIUS: '0.75rem',              // Border radius des cartes
    CARD_GAP: '0.5rem',                  // Espace entre les cartes
    
    // ══════════════════════════════════════════════════════════════════════════
    // DIALOG - Badge compteur vibes (en haut à gauche)
    // ══════════════════════════════════════════════════════════════════════════
    BADGE_BG: 'rgba(236,72,153,0.15)',
    BADGE_COLOR: '#ec4899',
    BADGE_RADIUS: '0.5rem',
    BADGE_HEIGHT: '1.5rem',
    BADGE_MIN_WIDTH: '4rem',
    BADGE_PADDING_X: '0.5rem',
    BADGE_FONT_SIZE: '0.75rem',
    
    // ══════════════════════════════════════════════════════════════════════════
    // DIALOG - Header capsule
    // ══════════════════════════════════════════════════════════════════════════
    HEADER_FONT_SIZE: '1rem',
    HEADER_PADDING_Y: '0.625rem',
    
    // ══════════════════════════════════════════════════════════════════════════
    // DIALOG - Scroll fade indicator
    // ══════════════════════════════════════════════════════════════════════════
    FADE_HEIGHT: '4rem',
    FADE_OPACITY: 0.75,
    FADE_DISTANCE: 30,                   // Distance en px avant le bas où le fade commence à disparaître
    
    // ══════════════════════════════════════════════════════════════════════════
    // DIALOG - Capsule liquid glass sur cartes
    // ══════════════════════════════════════════════════════════════════════════
    CAPSULE_BLUR: 12,
    CAPSULE_PX: '0.75rem',
    CAPSULE_PY: '0.25rem',
    CAPSULE_FONT_SIZE: '0.875rem',
    CAPSULE_COUNT_SIZE: '10px',          // Taille du compteur de chansons
    
    // ══════════════════════════════════════════════════════════════════════════
    // DIALOG - Badge "existe" (bulle verte)
    // ══════════════════════════════════════════════════════════════════════════
    EXISTS_BADGE_SIZE: '1.37rem',        // Taille de la bulle
    EXISTS_BADGE_TOP: '-0.6rem',         // Position verticale (négatif = déborde en haut)
    EXISTS_BADGE_RIGHT: '-0.6rem',       // Position horizontale (négatif = déborde à droite)
    EXISTS_BADGE_ICON_SIZE: 12,          // Taille de l'icône check
    
    // ══════════════════════════════════════════════════════════════════════════
    // DIALOG - Animations
    // ══════════════════════════════════════════════════════════════════════════
    IGNITE_DURATION: 300,                // Durée animation boutons (ms)
    SLIDE_DURATION: 600,                 // Durée de l'animation slide (ms)
    SLIDE_INITIAL: 0.5,                  // Vitesse initiale (0 = lent, 1 = rapide)
    SLIDE_DECEL: 0.98,                   // Ralentissement (0 = linéaire, 1 = freine fort)
    BACKDROP_OPACITY: 0.85,              // Opacité du fond noir
    
    // ══════════════════════════════════════════════════════════════════════════
    // MORPH - Animation bouton → dialog
    // ══════════════════════════════════════════════════════════════════════════
    MORPH_DURATION: 400,                 // Durée du morph (ms)
    SLIDE_OUT_DURATION: 250,             // Durée du slide de fermeture (ms)
    MORPH_EASING: 'cubic-bezier(1, 0, 0, 1)', // Courbe d'animation

    // ══════════════════════════════════════════════════════════════════════════
    // Chevrons indicateurs de swipe
    // ══════════════════════════════════════════════════════════════════════════
    SWIPE_CHEVRON_OPACITY: 0.4,           // Opacité de l'indicateur de swipe (0 à 1)
    SWIPE_CHEVRON_SIZE: 14,               // Taille des chevrons (px)
    SWIPE_POINTER_SIZE: 12,               // Taille de l'icône pointer (px)
    SWIPE_INDICATOR_TOP: '0.4rem',        // Distance depuis le haut de la carte
};

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES - Détection de vibes existantes par contenu
// ══════════════════════════════════════════════════════════════════════════════

// Calcule la signature d'une vibe existante (depuis playlists)
const getVibeSignature = (vibe) => {
    const ids = vibe.songIds || (vibe.songs ? vibe.songs.map(s => s.id) : []);
    if (ids.length === 0) return null;
    return [...ids].sort().join('|');
};

// Calcule la signature d'un dossier à importer (depuis folders)
// files peut être: File[] (import local) ou {name, path_lower}[] (Dropbox)
const getFolderSignature = (files) => {
    if (!files || files.length === 0) return null;
    const names = files.map(f => f.name).sort();
    return names.join('|');
};

// Retourne un Set de signatures de toutes les vibes existantes
const getExistingVibeSignatures = (playlists) => {
    const signatures = new Set();
    if (playlists) {
        Object.values(playlists).forEach(vibe => {
            const sig = getVibeSignature(vibe);
            if (sig) signatures.add(sig);
        });
    }
    return signatures;
};

// Retourne la liste des noms de dossiers dont le contenu existe déjà
const findExistingFoldersByContent = (folders, playlists) => {
    const existingSignatures = getExistingVibeSignatures(playlists);
    return Object.keys(folders).filter(name => {
        const folderSig = getFolderSignature(folders[name]);
        return folderSig && existingSignatures.has(folderSig);
    });
};

// Vérifie si la fusion de tous les fichiers existe déjà comme vibe
const checkFusionExists = (folders, playlists) => {
    const existingSignatures = getExistingVibeSignatures(playlists);
    // Fusionner tous les fichiers de tous les dossiers
    const allFiles = Object.values(folders).flat();
    const fusionSig = getFolderSignature(allFiles);
    return fusionSig && existingSignatures.has(fusionSig);
};

// ══════════════════════════════════════════════════════════════════════════════
// STYLES CSS
// ══════════════════════════════════════════════════════════════════════════════
const smartImportStyles = `
  @keyframes smartimport-warning-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  
  @keyframes smartimport-header-marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  @keyframes smartimport-dialog-slide-in {
    0% { transform: translateY(-120%); }
    100% { transform: translateY(0); }
  }

  @keyframes smartimport-dialog-slide-out {
    0% { transform: translateY(0); }
    100% { transform: translateY(-120%); }
  }

  @keyframes smartimport-neon-ignite-fuchsia {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(236, 72, 153, 0.2), 0 4px 8px rgba(255, 7, 163, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(236, 72, 153, 0.8), 0 7px 15px rgba(255, 7, 163, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(236, 72, 153, 0.3), 0 5px 10px rgba(255, 7, 163, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(236, 72, 153, 0.9), 0 8px 18px rgba(255, 7, 163, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(236, 72, 153, 0.5), 0 6px 12px rgba(255, 7, 163, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(236, 72, 153, 0.7), 0 7px 14px rgba(255, 7, 163, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(236, 72, 153, 0.5), 0 7px 12px rgba(255, 7, 163, 0.5); }
  }

  @keyframes smartimport-neon-ignite-solar {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(250, 204, 21, 0.2), 0 4px 8px rgba(220, 38, 38, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(250, 204, 21, 0.8), 0 7px 15px rgba(220, 38, 38, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(250, 204, 21, 0.3), 0 5px 10px rgba(220, 38, 38, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(250, 204, 21, 0.9), 0 8px 18px rgba(220, 38, 38, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(250, 204, 21, 0.5), 0 6px 12px rgba(220, 38, 38, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(250, 204, 21, 0.7), 0 7px 14px rgba(220, 38, 38, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(250, 204, 21, 0.5), 0 7px 12px rgba(220, 38, 38, 0.5); }
  }

  @keyframes smartimport-neon-ignite-red {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(239, 68, 68, 0.2), 0 4px 8px rgba(239, 68, 68, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(239, 68, 68, 0.8), 0 7px 15px rgba(239, 68, 68, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(239, 68, 68, 0.3), 0 5px 10px rgba(239, 68, 68, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(239, 68, 68, 0.9), 0 8px 18px rgba(239, 68, 68, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(239, 68, 68, 0.5), 0 6px 12px rgba(239, 68, 68, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(239, 68, 68, 0.7), 0 7px 14px rgba(239, 68, 68, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(239, 68, 68, 0.5), 0 7px 12px rgba(239, 68, 68, 0.5); }
  }

  @keyframes smartimport-neon-ignite-roseMagenta {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(255, 7, 58, 0.2), 0 4px 8px rgba(255, 0, 255, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(255, 7, 58, 0.8), 0 7px 15px rgba(255, 0, 255, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(255, 7, 58, 0.3), 0 5px 10px rgba(255, 0, 255, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(255, 7, 58, 0.9), 0 8px 18px rgba(255, 0, 255, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(255, 7, 58, 0.5), 0 6px 12px rgba(255, 0, 255, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(255, 7, 58, 0.7), 0 7px 14px rgba(255, 0, 255, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(255, 7, 58, 0.5), 0 7px 12px rgba(255, 0, 255, 0.5); }
  }

  .smartimport-ignite-fuchsia { animation: smartimport-neon-ignite-fuchsia 0.4s ease-out forwards; }
  .smartimport-ignite-solar { animation: smartimport-neon-ignite-solar 0.4s ease-out forwards; }
  .smartimport-ignite-red { animation: smartimport-neon-ignite-red 0.4s ease-out forwards; }
  .smartimport-ignite-roseMagenta { animation: smartimport-neon-ignite-roseMagenta 0.4s ease-out forwards; }
`;

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT MARQUEE TEXT (pour les noms longs)
// ══════════════════════════════════════════════════════════════════════════════
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
    
    const duration = Math.max(text.length / 8, 5); // 8 chars/sec, min 5s
    
    if (isOverflowing) {
        return (
            <div className="overflow-hidden">
                <span 
                    className={`whitespace-nowrap inline-block ${className}`}
                    style={{ 
                        ...style,
                        animation: `smartimport-header-marquee ${duration}s linear infinite alternate`
                    }}
                >
                    {text}
                </span>
            </div>
        );
    }
    
    return (
        <span 
            ref={textRef}
            className={`whitespace-nowrap ${className}`}
            style={style}
        >
            {text}
        </span>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT CARTE INDIVIDUELLE : SmartImportCard
// ══════════════════════════════════════════════════════════════════════════════
const SmartImportCard = ({
    name,
    files,
    gradientStyle,
    isExisting,
    isSelected,
    vibeCardMinOpacity,
    onToggleSelection,
    onGradientChange,
    onSwipePreview,
    getGradientByIndex,
    getGradientName,
    currentGradientIndex,
    is3DMode,
}) => {
    const cardRef = useRef(null);
    const cardWidthRef = useRef(0);
    const touchStartRef = useRef({ x: null, y: null });
    const swipeDirectionRef = useRef(null);
    const swipeOffsetRef = useRef(0);

    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwipeCatchingUp, setIsSwipeCatchingUp] = useState(false);
    const [swipePreview, setSwipePreview] = useState(null);

    // Garder swipeOffsetRef synchronisé avec swipeOffset
    useEffect(() => {
        swipeOffsetRef.current = swipeOffset;
    }, [swipeOffset]);

    // useEffect avec { passive: false } pour le touchmove
    useEffect(() => {
        const element = cardRef.current;
        if (!element) return;

        const handleTouchStart = (e) => {
            if (!e.touches || !e.touches[0]) return;
            // Bloquer si carte existante
            if (isExisting) return;

            touchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
            swipeDirectionRef.current = null;
            cardWidthRef.current = element.offsetWidth;
        };

        const handleTouchMove = (e) => {
            // Bloquer si carte existante
            if (isExisting) return;

            const { x: touchStartX, y: touchStartY } = touchStartRef.current;
            if (touchStartX === null || touchStartY === null) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = currentX - touchStartX;
            const diffY = currentY - touchStartY;

            // Déterminer la direction au premier mouvement significatif
            if (swipeDirectionRef.current === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
                swipeDirectionRef.current = Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical';

                if (swipeDirectionRef.current === 'horizontal') {
                    setIsSwipeCatchingUp(true);
                    setTimeout(() => setIsSwipeCatchingUp(false), 120);
                    // Afficher le gradient actuel
                    const currentGradient = getGradientByIndex(currentGradientIndex);
                    const gradStyle = currentGradient.length === 2
                        ? `linear-gradient(135deg, ${currentGradient[0]} 0%, ${currentGradient[1]} 100%)`
                        : `linear-gradient(135deg, ${currentGradient.join(', ')})`;
                    const safeIndex = ((currentGradientIndex % 20) + 20) % 20;
                    const preview = { gradient: gradStyle, index: safeIndex, gradientName: getGradientName(safeIndex) };
                    setSwipePreview(preview);
                    if (onSwipePreview) onSwipePreview(preview);
                }
            }

            // Si vertical, laisser le scroll natif
            if (swipeDirectionRef.current === 'vertical') return;

            // Si horizontal, bloquer le scroll et gérer le swipe couleur
            if (swipeDirectionRef.current === 'horizontal') {
                e.preventDefault(); // Fonctionne car passive: false

                const elementWidth = cardWidthRef.current || 300;
                const maxSwipeDistance = elementWidth * SMARTIMPORT_CONFIG.COLOR_SWIPE_PERCENT / 100;

                if (Math.abs(diffX) < maxSwipeDistance) {
                    setSwipeOffset(diffX);
                    swipeOffsetRef.current = diffX;

                    const direction = diffX > 0 ? 1 : -1;
                    const colorsTraversed = Math.floor((Math.abs(diffX) / maxSwipeDistance) * 20);
                    const previewIdx = currentGradientIndex + (direction * colorsTraversed);
                    const previewGradient = getGradientByIndex(previewIdx);

                    const gradStyle = previewGradient.length === 2
                        ? `linear-gradient(135deg, ${previewGradient[0]} 0%, ${previewGradient[1]} 100%)`
                        : `linear-gradient(135deg, ${previewGradient.join(', ')})`;
                    const safeIndex = ((previewIdx % 20) + 20) % 20;
                    const preview = { gradient: gradStyle, index: safeIndex, gradientName: getGradientName(safeIndex) };
                    setSwipePreview(preview);
                    if (onSwipePreview) onSwipePreview(preview);
                }
            }
        };

        const handleTouchEnd = () => {
            // Bloquer si carte existante
            if (isExisting) return;

            const { x: touchStartX } = touchStartRef.current;
            if (touchStartX === null) return;

            const elementWidth = cardWidthRef.current || 300;
            const maxSwipeDistance = elementWidth * SMARTIMPORT_CONFIG.COLOR_SWIPE_PERCENT / 100;
            const currentSwipeOffset = swipeOffsetRef.current;
            const direction = currentSwipeOffset > 0 ? 1 : -1;
            const colorsTraversed = Math.floor((Math.abs(currentSwipeOffset) / maxSwipeDistance) * 20);

            // Si c'est un tap (pas de swipe significatif)
            if (swipeDirectionRef.current === null ||
                (swipeDirectionRef.current === 'horizontal' && colorsTraversed === 0)) {
                // Toggle selection
                onToggleSelection(name);
            } else if (swipeDirectionRef.current === 'horizontal' && colorsTraversed >= 1) {
                // Appliquer le changement de gradient
                const newIndex = currentGradientIndex + (direction * colorsTraversed);
                onGradientChange(name, newIndex);
            }

            // Reset
            setSwipeOffset(0);
            swipeOffsetRef.current = 0;
            setSwipePreview(null);
            if (onSwipePreview) onSwipePreview(null);
            touchStartRef.current = { x: null, y: null };
            swipeDirectionRef.current = null;
        };

        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isExisting, currentGradientIndex, getGradientByIndex, getGradientName, name, onToggleSelection, onGradientChange, onSwipePreview]);

    return (
        <div className="relative overflow-visible" style={{ marginBottom: SMARTIMPORT_CONFIG.CARD_GAP }}>
            {/* Badge Copy - EN DEHORS de la carte pour ne pas être affecté par l'opacité */}
            {isExisting && (
                <div
                    className="absolute flex items-center justify-center rounded-full z-20"
                    style={{
                        width: SMARTIMPORT_CONFIG.EXISTS_BADGE_SIZE,
                        height: SMARTIMPORT_CONFIG.EXISTS_BADGE_SIZE,
                        top: SMARTIMPORT_CONFIG.EXISTS_BADGE_TOP,
                        right: SMARTIMPORT_CONFIG.EXISTS_BADGE_RIGHT,
                        background: '#22c55e',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                    }}
                >
                    <Copy size={SMARTIMPORT_CONFIG.EXISTS_BADGE_ICON_SIZE} className="text-white" strokeWidth={3} />
                </div>
            )}

            {/* Carte principale */}
            <div
                ref={cardRef}
                className="flex items-end px-3 pb-2 flex-shrink-0 relative overflow-hidden"
                style={{
                    background: swipePreview ? swipePreview.gradient : gradientStyle,
                    borderRadius: is3DMode ? '0.5rem' : SMARTIMPORT_CONFIG.CARD_RADIUS,
                    height: SMARTIMPORT_CONFIG.CARD_HEIGHT,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : 'translateX(0)',
                    transition: swipeOffset !== 0 ? (isSwipeCatchingUp ? 'transform 0.12s ease-out' : 'none') : 'transform 0.2s ease-out, opacity 0.2s ease-out',
                    opacity: isSelected ? 1 : (vibeCardMinOpacity ?? 0.3)
                }}
            >
                {/* Masque cylindrique 3D */}
                <CylinderMask is3DMode={is3DMode} intensity={0.6} />

                {/* Indicateur de swipe - chevrons + pointer en haut centré */}
                {!isExisting && (
                    <div
                        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
                        style={{
                            top: SMARTIMPORT_CONFIG.SWIPE_INDICATOR_TOP,
                            opacity: SMARTIMPORT_CONFIG.SWIPE_CHEVRON_OPACITY
                        }}
                    >
                        <ChevronLeft size={SMARTIMPORT_CONFIG.SWIPE_CHEVRON_SIZE} className="text-white" />
                        <Pointer size={SMARTIMPORT_CONFIG.SWIPE_POINTER_SIZE} className="text-white" />
                        <ChevronRight size={SMARTIMPORT_CONFIG.SWIPE_CHEVRON_SIZE} className="text-white" />
                    </div>
                )}

                {/* Capsule liquid glass avec nom + compteur */}
                <div
                    className="rounded-full border border-white/20 flex items-baseline gap-2"
                    style={{
                        padding: `${SMARTIMPORT_CONFIG.CAPSULE_PY} ${SMARTIMPORT_CONFIG.CAPSULE_PX}`,
                        backdropFilter: `blur(${SMARTIMPORT_CONFIG.CAPSULE_BLUR}px)`,
                        WebkitBackdropFilter: `blur(${SMARTIMPORT_CONFIG.CAPSULE_BLUR}px)`,
                        background: 'transparent',
                        maxWidth: 'calc(100% - 0.5rem)'
                    }}
                >
                    <div className="overflow-hidden">
                        <MarqueeText
                            text={name}
                            className="font-black text-white"
                            style={{
                                fontSize: SMARTIMPORT_CONFIG.CAPSULE_FONT_SIZE,
                                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                            }}
                        />
                    </div>
                    <span
                        className="font-semibold text-white/90 flex items-center gap-0.5 flex-shrink-0"
                        style={{
                            fontSize: SMARTIMPORT_CONFIG.CAPSULE_COUNT_SIZE,
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                        }}
                    >
                        <CheckCircle2 size={10} />
                        {files.length}
                    </span>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : SmartImport
// ══════════════════════════════════════════════════════════════════════════════
const SmartImport = ({
    playlists,
    vibeColorIndices,
    getGradientByIndex,
    getGradientName,
    vibeCardMinOpacity,    // Opacité des cartes désélectionnées (depuis CONFIG)
    is3DMode,              // Mode 3D (masques cylindriques)
    onImportComplete,
    onMenuClose,
    dropboxData,
    onDropboxDataClear,           // Callback pour fermer le menu radial
    inputRef,
    folderButtonRef,       // Ref du bouton Folder
    slideOutDuration,      // Durée du slide out (synchro avec barre import)
    dropboxButtonRef,      // Ref du bouton Dropbox
    folderButtonColor,     // Couleur du bouton Folder
    dropboxButtonColor,    // Couleur du bouton Dropbox
    containerRef           // Ref du container principal pour les positions
}) => {

    // ══════════════════════════════════════════════════════════════════════════
    // ÉTATS
    // ══════════════════════════════════════════════════════════════════════════
    const [importPreview, setImportPreview] = useState(null);
    const [btnIgniting, setBtnIgniting] = useState(null); // 'cancel' | 'fusion' | 'vibes' | null
    const [listNeedsScroll, setListNeedsScroll] = useState(false);
    const [listFadeOpacity, setListFadeOpacity] = useState(1);
    const [dialogClosing, setDialogClosing] = useState(false);
    const [backdropVisible, setBackdropVisible] = useState(false);
    const [morphProgress, setMorphProgress] = useState(0); // 0 = bouton, 1 = dialog
    const [sourceRect, setSourceRect] = useState(null);    // Position du bouton source
    const [slideOutProgress, setSlideOutProgress] = useState(0); // 0 = visible, 1 = sorti
    const [slideDirection, setSlideDirection] = useState('left'); // 'left' ou 'right'
    const [dialogDimensions, setDialogDimensions] = useState(null); // Dimensions finales figées
    const [showMorphCapsule, setShowMorphCapsule] = useState(false); // Capsule jaune visible
    const listRef = useRef(null);
    const dialogRef = useRef(null);
    const animationRef = useRef(null); // ID de l'animation en cours

    // État pour la sélection des cartes (toutes sélectionnées par défaut)
    const [selectedCards, setSelectedCards] = useState(new Set());

    // État pour le preview de swipe (affiché dans le header)
    const [activeSwipePreview, setActiveSwipePreview] = useState(null);

    // Initialiser selectedCards quand importPreview change
    useEffect(() => {
        if (importPreview && importPreview.folders) {
            // Toutes les cartes sont sélectionnées par défaut SAUF celles dont le contenu existe déjà
            const existingSet = new Set(importPreview.existingFolders || []);
            const selectableFolders = Object.keys(importPreview.folders).filter(name => !existingSet.has(name));
            setSelectedCards(new Set(selectableFolders));
        }
    }, [importPreview?.folders, importPreview?.existingFolders]);

    // ══════════════════════════════════════════════════════════════════════════
    // ANALYSE DES FICHIERS
    // ══════════════════════════════════════════════════════════════════════════
    const analyzeFiles = (files, event) => {
        // Filtrer les fichiers audio
        const audioFiles = files.filter(file => {
            const ext = file.name.toLowerCase().split('.').pop();
            return ['mp3', 'm4a', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(ext);
        });
        
        if (audioFiles.length === 0) {
            alert('Aucun fichier audio trouvé dans ce dossier !');
            if (event) event.target.value = '';
            return null;
        }
        
        // Scanner la structure des dossiers
        const hasWebkitPath = audioFiles[0]?.webkitRelativePath && audioFiles[0].webkitRelativePath.length > 0;

        // Fallback iOS : extraire l'artiste du nom du premier fichier (format "Artiste - Titre.mp3")
        let fallbackName = "Musique Importée";
        if (!hasWebkitPath && audioFiles[0]) {
            const fileName = audioFiles[0].name.replace(/\.[^/.]+$/, "");
            if (fileName.includes(" - ")) {
                fallbackName = fileName.split(" - ")[0].trim();
            }
        }

        const rootName = hasWebkitPath ? audioFiles[0].webkitRelativePath.split('/')[0] : fallbackName;

        // Grouper par dossier parent immédiat
        const folderStructure = audioFiles.reduce((acc, file) => {
            const hasPath = file.webkitRelativePath && file.webkitRelativePath.length > 0;
            let folderName;

            if (hasPath) {
                const pathParts = file.webkitRelativePath.split('/');
                folderName = pathParts.length > 2 ? pathParts[pathParts.length - 2] : pathParts[0];
            } else {
                // iOS : pas de chemin, tous les fichiers dans une seule vibe
                folderName = fallbackName;
            }

            if (!acc[folderName]) {
                acc[folderName] = [];
            }
            acc[folderName].push(file);
            return acc;
        }, {});
        
        // Filtrer les dossiers avec trop peu de fichiers
        const filteredFolders = {};
        let otherFiles = [];
        
        Object.entries(folderStructure).forEach(([name, folderFiles]) => {
            if (folderFiles.length >= SMARTIMPORT_CONFIG.MIN_FILES_PER_VIBE) {
                filteredFolders[name] = folderFiles;
            } else {
                otherFiles = [...otherFiles, ...folderFiles];
            }
        });
        
        // Regrouper les fichiers orphelins
        if (otherFiles.length > 0) {
            if (otherFiles.length >= SMARTIMPORT_CONFIG.MIN_FILES_PER_VIBE) {
                filteredFolders[rootName + " (Autres)"] = otherFiles;
            } else if (Object.keys(filteredFolders).length === 0) {
                filteredFolders[rootName] = audioFiles;
            } else {
                const firstFolder = Object.keys(filteredFolders)[0];
                filteredFolders[firstFolder] = [...filteredFolders[firstFolder], ...otherFiles];
            }
        }
        
        return {
            folders: filteredFolders,
            allFiles: audioFiles,
            totalFiles: audioFiles.length,
            rootName: rootName
        };
    };

    // ══════════════════════════════════════════════════════════════════════════
    // CALCUL DES GRADIENTS POUR LE PREVIEW
    // ══════════════════════════════════════════════════════════════════════════
    const calculateGradients = (folders) => {
        // Créer un compteur d'usage temporaire
        const usedIndices = Object.values(vibeColorIndices || {});
        const tempUsage = new Array(20).fill(0); // 20 gradients disponibles
        usedIndices.forEach(idx => { if (idx !== undefined && idx < 20) tempUsage[idx]++; });
        
        const usedInImport = new Set();
        const folderGradients = {};

        // Créer une map nom -> vibeId pour trouver les vibeId existants
        const nameToVibeIdMap = {};
        if (playlists) {
            Object.keys(playlists).forEach(vibeId => {
                const vibe = playlists[vibeId];
                if (vibe.name) {
                    nameToVibeIdMap[vibe.name] = vibeId;
                }
            });
        }

        Object.keys(folders).forEach(folderName => {
            // Chercher si une vibe avec ce nom existe et récupérer son gradient
            const existingVibeId = nameToVibeIdMap[folderName];
            if (existingVibeId && vibeColorIndices && vibeColorIndices[existingVibeId] !== undefined) {
                folderGradients[folderName] = vibeColorIndices[existingVibeId];
                usedInImport.add(vibeColorIndices[existingVibeId]);
            } else {
                // Trouver un gradient non utilisé
                let bestIndex = -1;
                let bestUsage = Infinity;

                for (let i = 0; i < tempUsage.length; i++) {
                    if (usedInImport.has(i)) continue;
                    if (tempUsage[i] < bestUsage) {
                        bestUsage = tempUsage[i];
                        bestIndex = i;
                    }
                }

                if (bestIndex === -1) {
                    const minUsage = Math.min(...tempUsage);
                    bestIndex = tempUsage.findIndex(count => count === minUsage);
                }

                folderGradients[folderName] = bestIndex;
                usedInImport.add(bestIndex);
                tempUsage[bestIndex]++;
            }
        });

        return folderGradients;
    };

    // ══════════════════════════════════════════════════════════════════════════
    // HANDLER PRINCIPAL : handleFileImport
    // ══════════════════════════════════════════════════════════════════════════
    const handleFileImport = (event) => {
        const allFiles = Array.from(event.target.files);
        const analysis = analyzeFiles(allFiles, event);
        
        if (!analysis) return;
        
        const { folders, allFiles: audioFiles, totalFiles, rootName } = analysis;
        const folderCount = Object.keys(folders).length;
        const hasSubfolders = folderCount > 1 || (folderCount === 1 && Object.keys(folders)[0] !== rootName);
        const exceedsAutoThreshold = totalFiles > SMARTIMPORT_CONFIG.AUTO_THRESHOLD;
        
        // Import automatique si : pas de sous-dossiers ET pas trop de fichiers
        if (!hasSubfolders && !exceedsAutoThreshold) {
            const autoGradients = calculateGradients(folders);
            onImportComplete(folders, 'vibes', autoGradients);
            if (onMenuClose) onMenuClose(); // Fermer APRÈS l'import
            event.target.value = '';
            return;
        }
        
        // Sinon, afficher le dialog de preview
        const folderGradients = calculateGradients(folders);
        
        // Détecter les dossiers dont le CONTENU existe déjà (par signature)
        const existingFolders = findExistingFoldersByContent(folders, playlists);

        // Vérifier si la fusion de tous les fichiers existe déjà
        const fusionExists = checkFusionExists(folders, playlists);

        // Si TOUT existe déjà (toutes les cartes + fusion), ne pas afficher le dialog
        const allFoldersExist = existingFolders.length === Object.keys(folders).length;
        if (allFoldersExist && fusionExists) {
            // Rien de nouveau à créer, fermer silencieusement
            event.target.value = '';
            return;
        }

        // Afficher la capsule jaune immédiatement
        setShowMorphCapsule(true);
        
        // Capturer la position du bouton source ET les dimensions finales AVANT de fermer le menu
        if (containerRef?.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            // Utiliser les dimensions depuis UNIFIED_CONFIG (en % de l'écran)
            const dialogMaxWidth = containerRect.width * (UNIFIED_CONFIG.IMPORT_SCREEN_WIDTH / 100);
            const dialogHeight = containerRect.height * (UNIFIED_CONFIG.IMPORT_SCREEN_HEIGHT / 100);
            const finalLeft = (containerRect.width - dialogMaxWidth) / 2;
            const finalTop = (containerRect.height - dialogHeight) / 2;
            
            setDialogDimensions({
                finalLeft,
                finalTop,
                finalWidth: dialogMaxWidth,
                finalHeight: dialogHeight
            });
            
            if (folderButtonRef?.current) {
                const btnRect = folderButtonRef.current.getBoundingClientRect();
                // Récupérer la taille de la bordure du container
                const containerStyle = getComputedStyle(containerRef.current);
                const borderLeft = parseFloat(containerStyle.borderLeftWidth) || 0;
                const borderTop = parseFloat(containerStyle.borderTopWidth) || 0;
                setSourceRect({
                    left: btnRect.left - containerRect.left - borderLeft,
                    top: btnRect.top - containerRect.top - borderTop,
                    width: btnRect.width,
                    height: btnRect.height
                });
            }
        }
        
        // NE PAS fermer le menu ici - il reste visible pendant le dialog
        
        setImportPreview({
            folders: folders,
            folderGradients: folderGradients,
            allFiles: audioFiles,
            totalFiles: totalFiles,
            rootName: rootName,
            existingFolders: existingFolders,
            fusionExists: fusionExists,
            event: event
        });
        
        // Déclencher le morph
        requestAnimationFrame(() => {
            setBackdropVisible(true);
            // Animer le morph de 0 à 1
            const startTime = performance.now();
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / SMARTIMPORT_CONFIG.MORPH_DURATION, 1);
                // Easing: ease-in-out cubic (lent-rapide-lent)
                const eased = progress < 0.5 
                    ? 4 * progress * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                setMorphProgress(eased);
                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    animationRef.current = null;
                }
            };
            animationRef.current = requestAnimationFrame(animate);
        });
    };

    // ══════════════════════════════════════════════════════════════════════════
    // HANDLER BOUTONS DU DIALOG
    // ══════════════════════════════════════════════════════════════════════════
    const handleButtonClick = (action) => {
        if (btnIgniting) return;
        setBtnIgniting(action);
        
        setTimeout(() => {
            // Exécuter l'action
            if (action === 'cancel') {
                if (importPreview.event) importPreview.event.target.value = '';
            } else if (action === 'fusion') {
                // Fusionner TOUS les fichiers de tous les dossiers (indépendamment de la sélection)
                const allFiles = Object.values(importPreview.folders).flat();
                const mergedFolders = { [importPreview.rootName]: allFiles };
                // Pour fusion, utiliser le premier gradient disponible
                const firstFolderName = Object.keys(importPreview.folders)[0];
                const fusionGradients = { [importPreview.rootName]: importPreview.folderGradients?.[firstFolderName] ?? 0 };
                onImportComplete(mergedFolders, 'fusion', fusionGradients, importPreview.isDropbox);
                if (importPreview.event) importPreview.event.target.value = '';
            } else if (action === 'vibes') {
                // Filtrer uniquement les dossiers sélectionnés
                const selectedFolders = {};
                const selectedGradients = {};
                Object.entries(importPreview.folders).forEach(([name, files]) => {
                    if (selectedCards.has(name)) {
                        selectedFolders[name] = files;
                        selectedGradients[name] = importPreview.folderGradients?.[name] ?? 0;
                    }
                });
                if (Object.keys(selectedFolders).length > 0) {
                    onImportComplete(selectedFolders, 'vibes', selectedGradients, importPreview.isDropbox);
                }
                if (importPreview.event) importPreview.event.target.value = '';
            }
            
            setBtnIgniting(null);
            
            // Annuler toute animation en cours
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            
            // Définir la direction du slide selon l'action
            const direction = action === 'cancel' ? 'left' : 'right';
            setSlideDirection(direction);
            setDialogClosing(true);
            setBackdropVisible(false);

            // Forcer morphProgress à 1 pour éviter le saut
            setMorphProgress(1);

            // Attendre que React applique les setState avant de démarrer l'animation
            requestAnimationFrame(() => {
                // Animer le slide de 0 à 1
                const startTime = performance.now();
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const duration = slideOutDuration || SMARTIMPORT_CONFIG.SLIDE_OUT_DURATION;
                const progress = Math.min(elapsed / duration, 1);
                // Easing: ease-in cubic (accélère en sortant)
                const eased = Math.pow(progress, 2);
                setSlideOutProgress(eased);
                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    // Animation terminée, reset tout EN UNE SEULE FOIS
                    // importPreview à null fait disparaître le dialog, les autres resets sont sans effet visuel
                    setImportPreview(null);
                    if (onDropboxDataClear) onDropboxDataClear();
                    if (onMenuClose) onMenuClose(); // Ranger la barre d'import APRÈS fermeture
                    // Reset différé pour éviter le flash
                    setTimeout(() => {
                        setDialogClosing(false);
                        setMorphProgress(0);
                        setSlideOutProgress(0);
                        setSourceRect(null);
                        setDialogDimensions(null);
                        setShowMorphCapsule(false);
                    }, 0);
                }
            };
            animationRef.current = requestAnimationFrame(animate);
            }); // Ferme le requestAnimationFrame wrapper
        }, SMARTIMPORT_CONFIG.IGNITE_DURATION);
    };

    // ══════════════════════════════════════════════════════════════════════════
    // EXPOSER handleFileImport via la ref + détection annulation (événement natif)
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (inputRef && inputRef.current) {
            const input = inputRef.current;
            
            // Handler pour le changement (sélection de fichiers confirmée)
            const handleChange = (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    handleFileImport(e);
                }
            };
            
            // Handler pour l'annulation (événement natif 'cancel')
            const handleCancel = () => {
                if (onMenuClose) onMenuClose();
            };
            
            input.addEventListener('change', handleChange);
            input.addEventListener('cancel', handleCancel);
            
            return () => {
                input.removeEventListener('change', handleChange);
                input.removeEventListener('cancel', handleCancel);
            };
        }
    }, [inputRef, playlists, vibeColorIndices, onMenuClose]);

    // Gérer l'arrivée de données Dropbox
    useEffect(() => {
        if (dropboxData && dropboxData.folders) {
            const { folders, rootName } = dropboxData;

            const totalFiles = Object.values(folders).reduce((sum, arr) => sum + arr.length, 0);
            const folderCount = Object.keys(folders).length;
            const folderGradients = calculateGradients(folders);

            // Import automatique si un seul dossier (pas de sous-dossiers avec MP3)
            // et pas trop de fichiers
            const exceedsAutoThreshold = totalFiles > SMARTIMPORT_CONFIG.AUTO_THRESHOLD;

            if (folderCount === 1 && !exceedsAutoThreshold) {
                // Import automatique - pas besoin d'afficher le dialog
                onImportComplete(folders, 'vibes', folderGradients, true);
                if (onDropboxDataClear) onDropboxDataClear();
                if (onMenuClose) onMenuClose(); // Ranger la barre d'import
                return;
            }

            // Détecter les dossiers dont le CONTENU existe déjà (par signature)
            const existingFolders = findExistingFoldersByContent(folders, playlists);

            // Vérifier si la fusion de tous les fichiers existe déjà
            const fusionExists = checkFusionExists(folders, playlists);

            // Si TOUT existe déjà (toutes les cartes + fusion), ne pas afficher le dialog
            const allFoldersExist = existingFolders.length === Object.keys(folders).length;
            if (allFoldersExist && fusionExists) {
                // Rien de nouveau à créer, fermer silencieusement
                if (onDropboxDataClear) onDropboxDataClear();
                return;
            }

            // Utiliser des valeurs fixes pour le dialog Dropbox (centré à l'écran)
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            // Utiliser les dimensions depuis UNIFIED_CONFIG (en % de l'écran)
            const dialogMaxWidth = screenWidth * (UNIFIED_CONFIG.IMPORT_SCREEN_WIDTH / 100);
            const dialogHeight = screenHeight * (UNIFIED_CONFIG.IMPORT_SCREEN_HEIGHT / 100);
            const finalLeft = (screenWidth - dialogMaxWidth) / 2;
            const finalTop = (screenHeight - dialogHeight) / 2;

            setDialogDimensions({
                finalLeft,
                finalTop,
                finalWidth: dialogMaxWidth,
                finalHeight: dialogHeight
            });

            setSourceRect({
                left: finalLeft,
                top: finalTop,
                width: dialogMaxWidth,
                height: 48
            });

            setImportPreview({
                folders: folders,
                folderGradients: folderGradients,
                allFiles: Object.values(folders).flat(),
                totalFiles: totalFiles,
                rootName: rootName,
                existingFolders: existingFolders,
                fusionExists: fusionExists,
                event: null,
                isDropbox: true
            });

            setBackdropVisible(true);
            setMorphProgress(1);
        }
    }, [dropboxData]);

    // Callback pour toggle la sélection d'une carte
    const handleCardToggle = (cardName) => {
        // Ne pas permettre de sélectionner une carte existante
        if (importPreview?.existingFolders?.includes(cardName)) return;

        setSelectedCards(prev => {
            const next = new Set(prev);
            if (next.has(cardName)) {
                next.delete(cardName);
            } else {
                next.add(cardName);
            }
            return next;
        });
    };

    // Callback pour changer le gradient d'une carte
    const handleGradientChange = (cardName, newIndex) => {
        setImportPreview(prev => ({
            ...prev,
            folderGradients: {
                ...prev.folderGradients,
                [cardName]: newIndex
            }
        }));
    };

    // ══════════════════════════════════════════════════════════════════════════
    // RENDU : Rien si pas de preview
    // ══════════════════════════════════════════════════════════════════════════
    if (!importPreview) {
        return <style>{smartImportStyles}</style>;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RENDU : Dialog de preview
    // ══════════════════════════════════════════════════════════════════════════
    const folderCount = Object.keys(importPreview.folders).length;

    // Compteurs basés sur les cartes sélectionnées
    const selectedCount = selectedCards.size;
    const selectedExistingCount = importPreview.existingFolders?.filter(name => selectedCards.has(name)).length || 0;
    const selectedNewCount = selectedCount - selectedExistingCount;

    // Total fichiers des cartes sélectionnées
    const selectedTotalFiles = Object.entries(importPreview.folders)
        .filter(([name]) => selectedCards.has(name))
        .reduce((sum, [, files]) => sum + files.length, 0);

    const isLongName = importPreview.rootName.length > 20;
    
    // Couleurs du dossier
    const folderBg = SMARTIMPORT_CONFIG.DIALOG_BG_COLOR;
    const folderShadow = '0 0 40px rgba(236, 72, 153, 0.3), 0 0 80px rgba(6, 182, 212, 0.2), 0 25px 50px rgba(0,0,0,0.25)';

    return (
        <>
            <style>{smartImportStyles}</style>
            <div 
                className="absolute inset-0 z-[100] transition-all"
                style={{ 
                    backgroundColor: `rgba(0, 0, 0, ${backdropVisible ? SMARTIMPORT_CONFIG.BACKDROP_OPACITY : 0})`, 
                    backdropFilter: backdropVisible ? 'blur(8px)' : 'blur(0px)',
                    transitionDuration: `${SMARTIMPORT_CONFIG.MORPH_DURATION}ms`
                }}
            >
                {/* Container du dossier (onglet + corps) - MORPH */}
                {(() => {
                    // Utiliser les dimensions figées (calculées une seule fois à l'ouverture)
                    const finalLeft = dialogDimensions?.finalLeft ?? 0;
                    const finalTop = dialogDimensions?.finalTop ?? 0;
                    const finalWidth = dialogDimensions?.finalWidth ?? 320;
                    const finalHeight = dialogDimensions?.finalHeight ?? 400;
                    
                    // Position initiale (depuis le bouton source)
                    const startLeft = sourceRect?.left ?? finalLeft;
                    const startTop = sourceRect?.top ?? finalTop;
                    const startWidth = sourceRect?.width ?? 40;
                    const startHeight = sourceRect?.height ?? 40;
                    
                    // Interpolation (morphProgress va de 0→1 à l'ouverture)
                    const p = morphProgress;
                    const currentLeft = startLeft + (finalLeft - startLeft) * p;
                    const currentTop = startTop + (finalTop - startTop) * p;
                    const currentWidth = startWidth + (finalWidth - startWidth) * p;
                    const currentHeight = startHeight + (finalHeight - startHeight) * p;
                    
                    // BorderRadius: de capsule (height/2) vers dialog radius
                    const startRadius = startHeight / 2;
                    const finalRadius = parseFloat(SMARTIMPORT_CONFIG.DIALOG_RADIUS) * 16; // rem vers px
                    const currentRadius = startRadius + (finalRadius - startRadius) * p;
                    
                    return (
                        <div 
                            ref={dialogRef}
                            className="absolute"
                            style={{ 
                                left: currentLeft,
                                top: currentTop,
                                width: currentWidth,
                                height: currentHeight,
                                borderRadius: currentRadius,
                                overflow: 'hidden',
                                transform: slideDirection === 'left' 
                                    ? `translateX(${-slideOutProgress * (currentWidth + 100)}px)`
                                    : `translateX(${slideOutProgress * (currentWidth + 100)}px)`,
                            }}
                        >
                    {/* Onglet du dossier */}
                    {SMARTIMPORT_CONFIG.FOLDER_TAB_ENABLED && (
                        <div 
                            className="absolute"
                            style={{
                                width: SMARTIMPORT_CONFIG.FOLDER_TAB_WIDTH,
                                height: SMARTIMPORT_CONFIG.FOLDER_TAB_HEIGHT,
                                left: 0,
                                bottom: '100%',
                                marginBottom: `-${SMARTIMPORT_CONFIG.FOLDER_TAB_OVERLAP}`,
                                background: folderBg,
                                borderRadius: `${SMARTIMPORT_CONFIG.FOLDER_TAB_RADIUS} 0 0 0`,
                                clipPath: `polygon(0 0, calc(100% - ${SMARTIMPORT_CONFIG.FOLDER_TAB_SLANT}%) 0, 100% 100%, 0 100%)`,
                            }}
                        />
                    )}
                    
                    {/* Corps du dossier */}
                    <div
                        className="w-full h-full border border-white/20 shadow-2xl flex flex-col overflow-hidden"
                        style={{
                            paddingTop: SMARTIMPORT_CONFIG.DIALOG_PADDING_VERTICAL,
                            paddingBottom: 0,
                            paddingLeft: 0,
                            paddingRight: 0,
                            background: folderBg,
                            boxShadow: folderShadow,
                            opacity: 1,
                            // Si onglet activé : coin haut-gauche moins arrondi pour se joindre à l'onglet
                            borderRadius: SMARTIMPORT_CONFIG.FOLDER_TAB_ENABLED
                            ? `0 ${SMARTIMPORT_CONFIG.DIALOG_RADIUS} ${SMARTIMPORT_CONFIG.DIALOG_RADIUS} ${SMARTIMPORT_CONFIG.DIALOG_RADIUS}`
                            : SMARTIMPORT_CONFIG.DIALOG_RADIUS,

                        }}
                    >
                        {/* Header capsule : fond blanc, bordure fine */}
                        <div
                            className="mb-2"
                            style={{
                                flexShrink: 0,
                                paddingLeft: SMARTIMPORT_CONFIG.HORIZONTAL_PADDING,
                                paddingRight: SMARTIMPORT_CONFIG.HORIZONTAL_PADDING
                            }}
                        >
                        <div
                            className={`relative flex items-center justify-between ${is3DMode ? '' : 'rounded-full'} px-4 border border-gray-200 w-full overflow-hidden`}
                            style={{
                                background: 'white',
                                height: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                                minHeight: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                                borderRadius: is3DMode ? '0.5rem' : undefined,
                            }}
                        >
                            {/* Masque cylindrique 3D sur le header */}
                            <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                            {/* Preview gradient dans la capsule du header */}
                            {activeSwipePreview && (
                                <div
                                    className="absolute inset-0 z-10 flex items-center justify-center"
                                    style={{
                                        background: activeSwipePreview.gradient,
                                    }}
                                >
                                    <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                                    <div
                                        className="flex items-center gap-2 text-white font-black tracking-widest uppercase relative z-10"
                                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontSize: SMARTIMPORT_CONFIG.HEADER_FONT_SIZE }}
                                    >
                                        <ChevronLeft size={14} />
                                        <span>{activeSwipePreview.gradientName}</span>
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            )}
                            {/* Nom du dossier avec autoscroll */}
                            <div className="flex-1 overflow-hidden mr-2 relative z-10">
                                <div
                                    className="font-bold text-gray-700 whitespace-nowrap"
                                    style={{
                                        fontSize: SMARTIMPORT_CONFIG.HEADER_FONT_SIZE,
                                        animation: isLongName ? 'smartimport-header-marquee 8s linear infinite' : 'none',
                                        display: 'inline-block',
                                        paddingRight: isLongName ? '2rem' : 0
                                    }}
                                >
                                    {importPreview.rootName}
                                    {isLongName && <span style={{ paddingLeft: '2rem' }}>{importPreview.rootName}</span>}
                                </div>
                            </div>
                            {/* Warning si > seuil */}
                            {importPreview.totalFiles > SMARTIMPORT_CONFIG.WARNING_THRESHOLD && (
                                <div
                                    className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0 relative z-10"
                                    style={{
                                        background: 'rgba(251, 146, 60, 0.15)',
                                        border: '1px solid rgba(251, 146, 60, 0.3)',
                                        animation: 'smartimport-warning-bounce 1s ease-in-out infinite'
                                    }}
                                >
                                    <AlertTriangle size={12} className="text-orange-500" />
                                    <span className="text-xs font-bold text-orange-600">{importPreview.totalFiles}</span>
                                    <AlertTriangle size={12} className="text-orange-500" />
                                </div>
                            )}
                        </div>
                        </div>

                        {/* Header résumé : badges vibes | total fichiers + icône */}
                        <div
                            className="flex justify-between items-center mb-2"
                            style={{
                                paddingLeft: SMARTIMPORT_CONFIG.HORIZONTAL_PADDING,
                                paddingRight: SMARTIMPORT_CONFIG.HORIZONTAL_PADDING
                            }}
                        >
                            <div className="flex items-center gap-1.5">
                                {/* Badge nouvelles vibes (+X) rose */}
                                <div
                                    className="font-bold flex items-center justify-center gap-0.5 relative overflow-hidden"
                                    style={{
                                        background: SMARTIMPORT_CONFIG.BADGE_BG,
                                        color: SMARTIMPORT_CONFIG.BADGE_COLOR,
                                        borderRadius: SMARTIMPORT_CONFIG.BADGE_RADIUS,
                                        height: SMARTIMPORT_CONFIG.BADGE_HEIGHT,
                                        minWidth: SMARTIMPORT_CONFIG.BADGE_MIN_WIDTH,
                                        paddingLeft: SMARTIMPORT_CONFIG.BADGE_PADDING_X,
                                        paddingRight: SMARTIMPORT_CONFIG.BADGE_PADDING_X,
                                        fontSize: SMARTIMPORT_CONFIG.BADGE_FONT_SIZE
                                    }}
                                >
                                    <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                                    <span className="relative z-10">+{selectedNewCount}</span>
                                </div>
                                {/* Badge vibes existantes (✓X) vert */}
                                {selectedExistingCount > 0 && (
                                    <div
                                        className="font-bold flex items-center justify-center gap-0.5 relative overflow-hidden"
                                        style={{
                                            background: 'rgba(34, 197, 94, 0.15)',
                                            color: '#16a34a',
                                            borderRadius: SMARTIMPORT_CONFIG.BADGE_RADIUS,
                                            height: SMARTIMPORT_CONFIG.BADGE_HEIGHT,
                                            minWidth: SMARTIMPORT_CONFIG.BADGE_MIN_WIDTH,
                                            paddingLeft: SMARTIMPORT_CONFIG.BADGE_PADDING_X,
                                            paddingRight: SMARTIMPORT_CONFIG.BADGE_PADDING_X,
                                            fontSize: SMARTIMPORT_CONFIG.BADGE_FONT_SIZE
                                        }}
                                    >
                                        <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                                        <Copy size={12} strokeWidth={3} className="relative z-10" />
                                        <span className="relative z-10">{selectedExistingCount}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <span
                                    className="font-bold text-gray-400"
                                    style={{ fontSize: SMARTIMPORT_CONFIG.BADGE_FONT_SIZE }}
                                >
                                    {selectedTotalFiles}
                                </span>
                                <Music
                                    className="text-gray-400"
                                    style={{ width: SMARTIMPORT_CONFIG.BADGE_FONT_SIZE, height: SMARTIMPORT_CONFIG.BADGE_FONT_SIZE }}
                                />
                            </div>
                        </div>
                        
                        {/* Liste des vibes avec gradient sur toute la carte */}
                        <div className="relative flex-1 min-h-0" style={{ paddingLeft: 0, paddingRight: 0, overflow: 'clip', overflowClipMargin: '1rem' }}>
                            <div
                                className="h-full"
                                style={{ overflow: 'visible' }}
                            >
                                <div
                                    ref={listRef}
                                    className="h-full overflow-y-auto overflow-x-visible"
                                    style={{
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: SMARTIMPORT_CONFIG.CARD_GAP,
                                        paddingLeft: SMARTIMPORT_CONFIG.HORIZONTAL_PADDING,
                                        paddingRight: SMARTIMPORT_CONFIG.HORIZONTAL_PADDING,
                                        paddingTop: '0.5rem',
                                        paddingBottom: '0.5rem'
                                    }}
                                    onScroll={() => {
                                        if (listRef.current) {
                                            const { scrollHeight, clientHeight, scrollTop } = listRef.current;
                                            const needsScroll = scrollHeight > clientHeight;
                                            if (needsScroll !== listNeedsScroll) {
                                                setListNeedsScroll(needsScroll);
                                            }
                                            if (needsScroll) {
                                                const distanceFromBottom = scrollHeight - clientHeight - scrollTop;
                                                const fadeOpacity = Math.min(1, distanceFromBottom / SMARTIMPORT_CONFIG.FADE_DISTANCE);
                                                setListFadeOpacity(fadeOpacity);
                                            }
                                        }
                                    }}
                                >
                                    {/* Détection initiale du scroll */}
                                    {(() => {
                                        setTimeout(() => {
                                            if (listRef.current) {
                                                const { scrollHeight, clientHeight, scrollTop } = listRef.current;
                                                const needsScroll = scrollHeight > clientHeight;
                                                if (needsScroll !== listNeedsScroll) {
                                                    setListNeedsScroll(needsScroll);
                                                }
                                                if (needsScroll) {
                                                    const distanceFromBottom = scrollHeight - clientHeight - scrollTop;
                                                    setListFadeOpacity(Math.min(1, distanceFromBottom / SMARTIMPORT_CONFIG.FADE_DISTANCE));
                                                }
                                            }
                                        }, 50);
                                        return null;
                                    })()}
                                    {Object.entries(importPreview.folders)
                                        // Trier: non-existantes en haut, existantes en bas
                                        .sort(([nameA], [nameB]) => {
                                            const aExists = importPreview.existingFolders?.includes(nameA);
                                            const bExists = importPreview.existingFolders?.includes(nameB);
                                            if (aExists && !bExists) return 1;  // a en bas
                                            if (!aExists && bExists) return -1; // a en haut
                                            return 0; // garder l'ordre original
                                        })
                                        .map(([name, files]) => {
                                            const gradientIndex = importPreview.folderGradients?.[name] ?? 0;
                                            const gradientColors = getGradientByIndex(gradientIndex);
                                            const gradientStyle = gradientColors.length === 2
                                                ? `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`
                                                : `linear-gradient(135deg, ${gradientColors.join(', ')})`;
                                            const isExisting = importPreview.existingFolders?.includes(name);
                                            const isSelected = selectedCards.has(name);

                                            return (
                                                <SmartImportCard
                                                    key={name}
                                                    name={name}
                                                    files={files}
                                                    gradientStyle={gradientStyle}
                                                    isExisting={isExisting}
                                                    isSelected={isSelected}
                                                    vibeCardMinOpacity={vibeCardMinOpacity}
                                                    onToggleSelection={handleCardToggle}
                                                    onGradientChange={handleGradientChange}
                                                    onSwipePreview={setActiveSwipePreview}
                                                    getGradientByIndex={getGradientByIndex}
                                                    getGradientName={getGradientName}
                                                    currentGradientIndex={gradientIndex}
                                                    is3DMode={is3DMode}
                                                />
                                            );
                                        })}
                                </div>
                            </div>
                            {/* Fade indicator pour scroll */}
                            {listNeedsScroll && listFadeOpacity > 0 && (
                                <div 
                                    className="absolute left-0 right-0 bottom-0 pointer-events-none transition-opacity duration-150"
                                    style={{ 
                                        height: SMARTIMPORT_CONFIG.FADE_HEIGHT,
                                        background: `linear-gradient(to top, rgba(255,255,255,${SMARTIMPORT_CONFIG.FADE_OPACITY}) 0%, rgba(255,255,255,0) 100%)`,
                                        opacity: listFadeOpacity
                                    }}
                                />
                            )}
                        </div>
                        
                        {/* Boutons */}
                        <div
                            className="relative"
                            style={{
                                flexShrink: 0,
                                paddingLeft: SMARTIMPORT_CONFIG.HORIZONTAL_PADDING,
                                paddingRight: SMARTIMPORT_CONFIG.HORIZONTAL_PADDING,
                                paddingTop: '0.5rem',
                                paddingBottom: '0.5rem'
                            }}
                        >
                        {folderCount === 1 ? (
                            /* Cas 1 dossier : 2 boutons - X cercle + Vibe flex */
                            <div className="flex gap-2 items-center">
                                {/* Bouton Cancel (X) - cercle → carré en 3D */}
                                <div className={`relative overflow-visible ${is3DMode ? '' : 'rounded-full'} flex-shrink-0`} style={{ height: UNIFIED_CONFIG.CAPSULE_HEIGHT, width: UNIFIED_CONFIG.CAPSULE_HEIGHT, borderRadius: is3DMode ? '0.5rem' : undefined }}>
                                    {btnIgniting === 'cancel' && (
                                        <div
                                            className={`absolute inset-0 ${is3DMode ? '' : 'rounded-full'} smartimport-ignite-red`}
                                            style={{ background: '#ef4444', zIndex: 0, borderRadius: is3DMode ? '0.5rem' : undefined }}
                                        />
                                    )}
                                    <button
                                        onClick={() => handleButtonClick('cancel')}
                                        disabled={btnIgniting !== null}
                                        className={`relative z-10 w-full h-full ${is3DMode ? '' : 'rounded-full'} font-bold text-sm flex items-center justify-center overflow-hidden`}
                                        style={{
                                            background: btnIgniting === 'cancel' ? 'transparent' : 'rgba(0,0,0,0.05)',
                                            color: btnIgniting === 'cancel' ? 'white' : '#9ca3af',
                                            borderRadius: is3DMode ? '0.5rem' : undefined
                                        }}
                                    >
                                        <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                                        <span className="relative z-10"><X size={18} /></span>
                                    </button>
                                </div>
                                {/* Bouton 1 VIBE - capsule */}
                                <div className={`flex-1 relative overflow-visible ${is3DMode ? '' : 'rounded-full'}`} style={{ height: UNIFIED_CONFIG.CAPSULE_HEIGHT, borderRadius: is3DMode ? '0.5rem' : undefined }}>
                                    {btnIgniting === 'vibes' && (
                                        <div
                                            className={`absolute inset-0 ${is3DMode ? '' : 'rounded-full'} smartimport-ignite-roseMagenta`}
                                            style={{
                                                background: 'linear-gradient(135deg, #FF073A 0%, #FF00FF 100%)',
                                                zIndex: 0,
                                                borderRadius: is3DMode ? '0.5rem' : undefined
                                            }}
                                        />
                                    )}
                                    <button
                                        onClick={() => handleButtonClick('vibes')}
                                        disabled={btnIgniting !== null}
                                        className={`relative z-10 w-full h-full ${is3DMode ? '' : 'rounded-full'} font-bold text-sm text-white flex items-center justify-center gap-2 overflow-hidden`}
                                        style={{
                                            background: btnIgniting === 'vibes' ? 'transparent' : 'linear-gradient(135deg, #FF073A 0%, #FF00FF 100%)',
                                            border: '1px solid #9f1239',
                                            borderRadius: is3DMode ? '0.5rem' : undefined
                                        }}
                                    >
                                        <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                                        <span className="relative z-10 flex items-center gap-2"><FlameWhiteVector size={16} />1 VIBE</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Cas plusieurs dossiers : 3 boutons - X cercle + Fusion/Vibes flex égaux */
                            <div className="flex gap-2 items-center">
                                {/* Bouton Cancel (X) - cercle → carré en 3D */}
                                <div className={`relative overflow-visible ${is3DMode ? '' : 'rounded-full'} flex-shrink-0`} style={{ height: UNIFIED_CONFIG.CAPSULE_HEIGHT, width: UNIFIED_CONFIG.CAPSULE_HEIGHT, borderRadius: is3DMode ? '0.5rem' : undefined }}>
                                    {btnIgniting === 'cancel' && (
                                        <div
                                            className={`absolute inset-0 ${is3DMode ? '' : 'rounded-full'} smartimport-ignite-red`}
                                            style={{ background: '#ef4444', zIndex: 0, borderRadius: is3DMode ? '0.5rem' : undefined }}
                                        />
                                    )}
                                    <button
                                        onClick={() => handleButtonClick('cancel')}
                                        disabled={btnIgniting !== null}
                                        className={`relative z-10 w-full h-full ${is3DMode ? '' : 'rounded-full'} font-bold text-sm flex items-center justify-center overflow-hidden`}
                                        style={{
                                            background: btnIgniting === 'cancel' ? 'transparent' : 'rgba(0,0,0,0.05)',
                                            color: btnIgniting === 'cancel' ? 'white' : '#9ca3af',
                                            borderRadius: is3DMode ? '0.5rem' : undefined
                                        }}
                                    >
                                        <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                                        <span className="relative z-10"><X size={18} /></span>
                                    </button>
                                </div>
                                {/* Bouton FUSION - capsule */}
                                <div className={`flex-1 relative overflow-visible ${is3DMode ? '' : 'rounded-full'}`} style={{ height: UNIFIED_CONFIG.CAPSULE_HEIGHT, opacity: importPreview.fusionExists ? 0.4 : 1, borderRadius: is3DMode ? '0.5rem' : undefined }}>
                                    {btnIgniting === 'fusion' && (
                                        <div
                                            className={`absolute inset-0 ${is3DMode ? '' : 'rounded-full'} smartimport-ignite-solar`}
                                            style={{
                                                background: 'linear-gradient(135deg, #facc15 0%, #f97316 50%, #dc2626 100%)',
                                                zIndex: 0,
                                                borderRadius: is3DMode ? '0.5rem' : undefined
                                            }}
                                        />
                                    )}
                                    <button
                                        onClick={() => handleButtonClick('fusion')}
                                        disabled={btnIgniting !== null || importPreview.fusionExists}
                                        className={`relative z-10 w-full h-full ${is3DMode ? '' : 'rounded-full'} font-bold text-sm flex items-center justify-center gap-1 text-white overflow-hidden`}
                                        style={{
                                            background: btnIgniting === 'fusion' ? 'transparent' : 'linear-gradient(135deg, #facc15 0%, #f97316 50%, #dc2626 100%)',
                                            borderRadius: is3DMode ? '0.5rem' : undefined
                                        }}
                                    >
                                        <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                                        <span className="relative z-10 flex items-center gap-1"><Layers size={14} />FUSION</span>
                                    </button>
                                </div>
                                {/* Bouton X VIBES - capsule */}
                                <div className={`flex-1 relative overflow-visible ${is3DMode ? '' : 'rounded-full'}`} style={{ height: UNIFIED_CONFIG.CAPSULE_HEIGHT, opacity: selectedCount === 0 ? 0.4 : 1, borderRadius: is3DMode ? '0.5rem' : undefined }}>
                                    {btnIgniting === 'vibes' && (
                                        <div
                                            className={`absolute inset-0 ${is3DMode ? '' : 'rounded-full'} smartimport-ignite-roseMagenta`}
                                            style={{
                                                background: 'linear-gradient(135deg, #FF073A 0%, #FF00FF 100%)',
                                                zIndex: 0,
                                                borderRadius: is3DMode ? '0.5rem' : undefined
                                            }}
                                        />
                                    )}
                                    <button
                                        onClick={() => handleButtonClick('vibes')}
                                        disabled={btnIgniting !== null || selectedCount === 0}
                                        className={`relative z-10 w-full h-full ${is3DMode ? '' : 'rounded-full'} font-bold text-sm text-white flex items-center justify-center gap-1 overflow-hidden`}
                                        style={{
                                            background: btnIgniting === 'vibes' ? 'transparent' : 'linear-gradient(135deg, #FF073A 0%, #FF00FF 100%)',
                                            borderRadius: is3DMode ? '0.5rem' : undefined
                                        }}
                                    >
                                        <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                                        <span className="relative z-10 flex items-center gap-1"><FlameWhiteVector size={14} />{selectedCount} VIBE{selectedCount > 1 ? 'S' : ''}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                        </div>
                    );
                })()}
            </div>
        </>
    );
};

export default SmartImport;