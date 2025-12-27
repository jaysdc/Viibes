import React, { useState, useRef, useEffect } from 'react';
import { X, Flame, Layers, Check, AlertTriangle, Music2, CheckCircle2, ChevronLeft, ChevronRight, Pointer } from 'lucide-react';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    SMARTIMPORT - PARAMÈTRES TWEAKABLES                    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

export const SMARTIMPORT_CONFIG = {
    MAX_SWIPE_DISTANCE: 200,             // Distance max de swipe pour changer de couleur
    
    // ══════════════════════════════════════════════════════════════════════════
    // SEUILS ET LIMITES
    // ══════════════════════════════════════════════════════════════════════════
    WARNING_THRESHOLD: 600,              // Seuil de fichiers pour avertissement (warning visuel)
    AUTO_THRESHOLD: 600,                 // Seuil max pour import automatique (sans dialog)
    MIN_FILES_PER_VIBE: 5,               // Minimum de fichiers pour créer une Vibe (évite micro-Vibes)

    // ══════════════════════════════════════════════════════════════════════════
    // DIALOG - Dimensions générales
    // ══════════════════════════════════════════════════════════════════════════
    DIALOG_MAX_WIDTH: '20rem',           // Largeur max du dialog
    DIALOG_HEIGHT: '65vh',               // Hauteur max du dialog
    DIALOG_PADDING: '1.25rem',           // Padding interne du dialog
    DIALOG_RADIUS: '2rem',               // Border radius général du dialog
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

  @keyframes smartimport-neon-ignite-pink {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(236, 72, 153, 0.2), 0 4px 8px rgba(236, 72, 153, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(236, 72, 153, 0.8), 0 7px 15px rgba(236, 72, 153, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(236, 72, 153, 0.3), 0 5px 10px rgba(236, 72, 153, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(236, 72, 153, 0.9), 0 8px 18px rgba(236, 72, 153, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(236, 72, 153, 0.5), 0 6px 12px rgba(236, 72, 153, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(236, 72, 153, 0.7), 0 7px 14px rgba(236, 72, 153, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(236, 72, 153, 0.5), 0 7px 12px rgba(236, 72, 153, 0.5); }
  }

  @keyframes smartimport-neon-ignite-orange {
    0% { opacity: 0.3; box-shadow: 0 -4px 8px rgba(255, 107, 0, 0.2), 0 4px 8px rgba(255, 107, 0, 0.2); }
    15% { opacity: 1; box-shadow: 0 -7px 15px rgba(255, 107, 0, 0.8), 0 7px 15px rgba(255, 107, 0, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 -5px 10px rgba(255, 107, 0, 0.3), 0 5px 10px rgba(255, 107, 0, 0.3); }
    40% { opacity: 1; box-shadow: 0 -8px 18px rgba(255, 107, 0, 0.9), 0 8px 18px rgba(255, 107, 0, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 -6px 12px rgba(255, 107, 0, 0.5), 0 6px 12px rgba(255, 107, 0, 0.5); }
    70% { opacity: 1; box-shadow: 0 -7px 14px rgba(255, 107, 0, 0.7), 0 7px 14px rgba(255, 107, 0, 0.7); }
    100% { opacity: 1; box-shadow: 0 -7px 12px rgba(255, 107, 0, 0.5), 0 7px 12px rgba(255, 107, 0, 0.5); }
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

  .smartimport-ignite-pink { animation: smartimport-neon-ignite-pink 0.4s ease-out forwards; }
  .smartimport-ignite-orange { animation: smartimport-neon-ignite-orange 0.4s ease-out forwards; }
  .smartimport-ignite-red { animation: smartimport-neon-ignite-red 0.4s ease-out forwards; }
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
// COMPOSANT PRINCIPAL : SmartImport
// ══════════════════════════════════════════════════════════════════════════════
const SmartImport = ({ 
    playlists,
    vibeColorIndices,
    getGradientByIndex,
    getGradientName,
    onImportComplete,
    onMenuClose,           // Callback pour fermer le menu radial
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
    
    // États pour le swipe de couleur
    const [swipingCard, setSwipingCard] = useState(null); // nom de la carte en cours de swipe
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [swipeTouchStartX, setSwipeTouchStartX] = useState(null);
    const [swipeTouchStartY, setSwipeTouchStartY] = useState(null);
    const [swipeDirection, setSwipeDirection] = useState(null); // 'horizontal', 'vertical', ou null
    const [swipePreview, setSwipePreview] = useState(null); // { gradient, gradientName } pour preview locale
    const cardWidthRef = useRef(0); // Largeur de la carte pour limiter le swipe à 50%

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
        const rootName = audioFiles[0]?.webkitRelativePath?.split('/')[0] || "Musique Importée";
        
        // Grouper par dossier parent immédiat
        const folderStructure = audioFiles.reduce((acc, file) => {
            const pathParts = file.webkitRelativePath?.split('/') || [rootName, file.name];
            const folderName = pathParts.length > 2 ? pathParts[pathParts.length - 2] : pathParts[0];
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
        
        Object.keys(folders).forEach(folderName => {
            // Vérifier si la Vibe existe déjà
            if (vibeColorIndices && vibeColorIndices[folderName] !== undefined) {
                folderGradients[folderName] = vibeColorIndices[folderName];
                usedInImport.add(vibeColorIndices[folderName]);
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
        
        // Détecter les dossiers qui existent déjà
        const existingFolders = Object.keys(folders).filter(name => 
            playlists && playlists[name] !== undefined
        );
        
        // Afficher la capsule jaune immédiatement
        setShowMorphCapsule(true);
        
        // Capturer la position du bouton source ET les dimensions finales AVANT de fermer le menu
        if (containerRef?.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const dialogMaxWidth = parseFloat(SMARTIMPORT_CONFIG.DIALOG_MAX_WIDTH) * 16;
            const dialogHeight = containerRect.height * 0.65;
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
                const mergedFolders = { [importPreview.rootName]: importPreview.allFiles };
                // Pour fusion, utiliser le premier gradient disponible ou en calculer un
                const fusionGradients = { [importPreview.rootName]: importPreview.folderGradients?.[Object.keys(importPreview.folders)[0]] ?? 0 };
                onImportComplete(mergedFolders, 'fusion', fusionGradients);
                if (importPreview.event) importPreview.event.target.value = '';
            } else if (action === 'vibes') {
                onImportComplete(importPreview.folders, 'vibes', importPreview.folderGradients);
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
            
            // Lancer le rangement de la barre d'import IMMÉDIATEMENT
            if (onMenuClose) onMenuClose();
            
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

    // Handlers pour le swipe de couleur
    const handleCardSwipeStart = (e, cardName) => {
        if (!e.touches || !e.touches[0]) return;
        setSwipingCard(cardName);
        setSwipeTouchStartX(e.touches[0].clientX);
        setSwipeTouchStartY(e.touches[0].clientY);
        setSwipeDirection(null);
        
        // Capturer la largeur de la carte
        if (e.currentTarget) {
            cardWidthRef.current = e.currentTarget.offsetWidth;
        }
        // Ne PAS afficher le preview ici - attendre la détection horizontal
    };

    const handleCardSwipeMove = (e, cardName) => {
        if (swipingCard !== cardName || swipeTouchStartX === null || swipeTouchStartY === null) return;
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        const diffX = clientX - swipeTouchStartX;
        const diffY = clientY - swipeTouchStartY;
        
        // Déterminer la direction au premier mouvement significatif
        if (swipeDirection === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
                setSwipeDirection('horizontal');
                // Afficher immédiatement le dégradé actuel
                const currentIdx = importPreview?.folderGradients?.[cardName] ?? 0;
                const currentGradient = getGradientByIndex(currentIdx);
                const gradientStyle = currentGradient.length === 2
                    ? `linear-gradient(135deg, ${currentGradient[0]} 0%, ${currentGradient[1]} 100%)`
                    : `linear-gradient(135deg, ${currentGradient.join(', ')})`;
                const safeIndex = ((currentIdx % 20) + 20) % 20;
                setSwipePreview({ gradient: gradientStyle, index: safeIndex, gradientName: getGradientName(safeIndex) });
            } else {
                setSwipeDirection('vertical');
            }
        }
        
        // Si c'est un swipe vertical, on ignore (laisser le scroll se faire)
        if (swipeDirection === 'vertical') return;
        
        // Si direction pas encore déterminée ou si c'est horizontal, on gère le swipe couleur
        if (swipeDirection === 'horizontal') {
            // Limite à 50% de la largeur de la carte
            const maxSwipeDistance = cardWidthRef.current * 0.5 || 150;
            
            if (Math.abs(diffX) < maxSwipeDistance) {
                setSwipeOffset(diffX);
                
                const direction = diffX > 0 ? 1 : -1;
                const colorsTraversed = Math.floor((Math.abs(diffX) / maxSwipeDistance) * 20);
                const currentIdx = importPreview?.folderGradients?.[cardName] ?? 0;
                const previewIdx = currentIdx + (direction * colorsTraversed);
                const previewGradient = getGradientByIndex(previewIdx);
                
                // Preview locale (capsule par-dessus les boutons)
                const gradientStyle = previewGradient.length === 2
                    ? `linear-gradient(135deg, ${previewGradient[0]} 0%, ${previewGradient[1]} 100%)`
                    : `linear-gradient(135deg, ${previewGradient.join(', ')})`;
                const safeIndex = ((previewIdx % 20) + 20) % 20;
                setSwipePreview({ gradient: gradientStyle, index: safeIndex, gradientName: getGradientName(safeIndex) });
            }
        }
    };

    const handleCardSwipeEnd = (cardName) => {
        if (swipingCard !== cardName) return;
        
        const maxSwipeDistance = cardWidthRef.current * 0.5 || 150;
        const colorsTraversed = Math.floor((Math.abs(swipeOffset) / maxSwipeDistance) * 20);
        
        if (swipeDirection === 'horizontal' && colorsTraversed >= 1 && importPreview) {
            const direction = swipeOffset > 0 ? 1 : -1;
            const currentIdx = importPreview.folderGradients?.[cardName] ?? 0;
            const newIdx = currentIdx + (direction * colorsTraversed);
            
            setImportPreview(prev => ({
                ...prev,
                folderGradients: {
                    ...prev.folderGradients,
                    [cardName]: newIdx
                }
            }));
        }
        
        setSwipingCard(null);
        setSwipeOffset(0);
        setSwipeTouchStartX(null);
        setSwipeTouchStartY(null);
        setSwipeDirection(null);
        setSwipePreview(null);
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
    const existingCount = importPreview.existingFolders?.length || 0;
    const newCount = folderCount - existingCount;
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
                            padding: SMARTIMPORT_CONFIG.DIALOG_PADDING,
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
                            className="flex items-center justify-between rounded-full px-4 mb-4 border border-gray-200"
                            style={{ 
                                background: 'white',
                                paddingTop: SMARTIMPORT_CONFIG.HEADER_PADDING_Y,
                                paddingBottom: SMARTIMPORT_CONFIG.HEADER_PADDING_Y
                            }}
                        >
                            {/* Nom du dossier avec autoscroll */}
                            <div className="flex-1 overflow-hidden mr-2">
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
                                    className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
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
                        
                        {/* Header résumé : badges vibes | total fichiers + icône */}
                        <div className="flex justify-between items-center px-1 mb-2">
                            <div className="flex items-center gap-1.5">
                                {/* Badge nouvelles vibes (+X) rose */}
                                <div 
                                    className="font-bold flex items-center justify-center gap-0.5"
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
                                    <span>+{newCount}</span>
                                </div>
                                {/* Badge vibes existantes (✓X) vert */}
                                {existingCount > 0 && (
                                    <div 
                                        className="font-bold flex items-center justify-center gap-0.5"
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
                                        <Check size={12} strokeWidth={3} />
                                        <span>{existingCount}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <span 
                                    className="font-bold text-gray-400"
                                    style={{ fontSize: SMARTIMPORT_CONFIG.BADGE_FONT_SIZE }}
                                >
                                    {importPreview.totalFiles}
                                </span>
                                <Music2 
                                    className="text-gray-400" 
                                    style={{ width: SMARTIMPORT_CONFIG.BADGE_FONT_SIZE, height: SMARTIMPORT_CONFIG.BADGE_FONT_SIZE }}
                                />
                            </div>
                        </div>
                        
                        {/* Liste des vibes avec gradient sur toute la carte */}
                        <div className="relative mb-4 flex-1 min-h-0 overflow-hidden rounded-2xl">
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
                                        padding: '0.75rem 0.5rem 0.5rem 0.25rem',
                                        paddingRight: '0.75rem'
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
                                    {Object.entries(importPreview.folders).map(([name, files]) => {
                                        const gradientIndex = importPreview.folderGradients?.[name] ?? 0;
                                        const gradientColors = getGradientByIndex(gradientIndex);
                                        const gradientStyle = gradientColors.length === 2
                                            ? `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`
                                            : `linear-gradient(135deg, ${gradientColors.join(', ')})`;
                                        const isExisting = importPreview.existingFolders?.includes(name);
                                        
                                        return (
                                            <div 
                                                key={name}
                                                className="flex items-end px-3 pb-2 flex-shrink-0 relative"
                                                style={{ 
                                                    background: gradientStyle,
                                                    borderRadius: SMARTIMPORT_CONFIG.CARD_RADIUS,
                                                    height: SMARTIMPORT_CONFIG.CARD_HEIGHT,
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                    transform: swipingCard === name ? `translateX(${swipeOffset}px)` : 'translateX(0)',
                                                    transition: swipingCard === name ? 'none' : 'transform 0.2s ease-out'
                                                }}
                                                onTouchStart={(e) => handleCardSwipeStart(e, name)}
                                                onTouchMove={(e) => handleCardSwipeMove(e, name)}
                                                onTouchEnd={() => handleCardSwipeEnd(name)}
                                            >
                                                {/* Bulle check verte pour les vibes existantes */}
                                                {isExisting && (
                                                    <div 
                                                        className="absolute flex items-center justify-center rounded-full"
                                                        style={{ 
                                                            width: SMARTIMPORT_CONFIG.EXISTS_BADGE_SIZE,
                                                            height: SMARTIMPORT_CONFIG.EXISTS_BADGE_SIZE,
                                                            top: SMARTIMPORT_CONFIG.EXISTS_BADGE_TOP,
                                                            right: SMARTIMPORT_CONFIG.EXISTS_BADGE_RIGHT,
                                                            background: '#22c55e',
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                                                            zIndex: 10
                                                        }}
                                                    >
                                                        <Check size={SMARTIMPORT_CONFIG.EXISTS_BADGE_ICON_SIZE} className="text-white" strokeWidth={3} />
                                                    </div>
                                                )}
                                                {/* Indicateur de swipe - chevrons + pointer en haut centré */}
                                                <div 
                                                    className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
                                                    style={{ 
                                                        top: SMARTIMPORT_CONFIG.SWIPE_INDICATOR_TOP,
                                                        opacity: SMARTIMPORT_CONFIG.SWIPE_CHEVRON_OPACITY 
                                                    }}
                                                >
                                                    <ChevronLeft 
                                                        size={SMARTIMPORT_CONFIG.SWIPE_CHEVRON_SIZE} 
                                                        className="text-white"
                                                    />
                                                    <Pointer 
                                                        size={SMARTIMPORT_CONFIG.SWIPE_POINTER_SIZE} 
                                                        className="text-white"
                                                    />
                                                    <ChevronRight 
                                                        size={SMARTIMPORT_CONFIG.SWIPE_CHEVRON_SIZE} 
                                                        className="text-white"
                                                    />
                                                </div>
                                                
                                                {/* Capsule liquid glass avec nom + compteur */}
                                                <div 
                                                    className="rounded-full border border-white/20 shadow-lg flex items-baseline gap-2"
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
                        <div className="relative">
                        {/* Capsule preview couleur - par-dessus les boutons */}
                        {swipePreview && (
                            <div 
                                className="absolute inset-0 rounded-full z-20 flex items-center justify-center"
                                style={{ 
                                    background: swipePreview.gradient,
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                                }}
                            >
                                <div 
                                    className="flex items-center gap-2 text-white font-black tracking-widest text-lg uppercase"
                                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                                >
                                    <ChevronLeft size={16} />
                                    <span>{swipePreview.gradientName}</span>
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        )}
                        
                        {folderCount === 1 ? (
                            /* Cas 1 dossier : 2 boutons - X cercle + Vibe flex */
                            <div className="flex gap-2 items-center">
                                <div className="h-11 w-11 relative overflow-visible rounded-full flex-shrink-0">
                                    {btnIgniting === 'cancel' && (
                                        <div 
                                            className="absolute inset-0 rounded-full smartimport-ignite-red"
                                            style={{ background: '#ef4444', zIndex: 0 }}
                                        />
                                    )}
                                    <button
                                        onClick={() => handleButtonClick('cancel')}
                                        disabled={btnIgniting !== null}
                                        className="relative z-10 w-full h-full rounded-full font-bold text-sm flex items-center justify-center"
                                        style={{ 
                                            background: btnIgniting === 'cancel' ? 'transparent' : 'rgba(0,0,0,0.05)', 
                                            color: btnIgniting === 'cancel' ? 'white' : '#9ca3af' 
                                        }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="flex-1 h-11 relative overflow-visible rounded-full">
                                    {btnIgniting === 'vibes' && (
                                        <div 
                                            className="absolute inset-0 rounded-full smartimport-ignite-pink"
                                            style={{ background: '#ec4899', zIndex: 0 }}
                                        />
                                    )}
                                    <button
                                        onClick={() => handleButtonClick('vibes')}
                                        disabled={btnIgniting !== null}
                                        className="relative z-10 w-full h-full rounded-full font-bold text-sm text-white flex items-center justify-center gap-2"
                                        style={{ background: btnIgniting === 'vibes' ? 'transparent' : '#ec4899' }}
                                    >
                                        <Flame size={16} />
                                        1 VIBE
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Cas plusieurs dossiers : 3 boutons - X cercle + Fusion/Vibes flex égaux */
                            <div className="flex gap-2 items-center">
                                <div className="h-11 w-11 relative overflow-visible rounded-full flex-shrink-0">
                                    {btnIgniting === 'cancel' && (
                                        <div 
                                            className="absolute inset-0 rounded-full smartimport-ignite-red"
                                            style={{ background: '#ef4444', zIndex: 0 }}
                                        />
                                    )}
                                    <button
                                        onClick={() => handleButtonClick('cancel')}
                                        disabled={btnIgniting !== null}
                                        className="relative z-10 w-full h-full rounded-full font-bold text-sm flex items-center justify-center"
                                        style={{ 
                                            background: btnIgniting === 'cancel' ? 'transparent' : 'rgba(0,0,0,0.05)', 
                                            color: btnIgniting === 'cancel' ? 'white' : '#9ca3af' 
                                        }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="flex-1 h-11 relative overflow-visible rounded-full">
                                    {btnIgniting === 'fusion' && (
                                        <div 
                                            className="absolute inset-0 rounded-full smartimport-ignite-orange"
                                            style={{ 
                                                background: 'linear-gradient(135deg, #FFD600 0%, #FF6B00 100%)', 
                                                border: '1px solid #FF6B00',
                                                zIndex: 0 
                                            }}
                                        />
                                    )}
                                    <button
                                        onClick={() => handleButtonClick('fusion')}
                                        disabled={btnIgniting !== null}
                                        className="relative z-10 w-full h-full rounded-full font-bold text-sm flex items-center justify-center gap-1"
                                        style={{ 
                                            background: btnIgniting === 'fusion' ? 'transparent' : 'rgba(0,0,0,0.05)', 
                                            color: btnIgniting === 'fusion' ? 'white' : '#6b7280' 
                                        }}
                                    >
                                        <Layers size={14} />
                                        FUSION
                                    </button>
                                </div>
                                <div className="flex-1 h-11 relative overflow-visible rounded-full">
                                    {btnIgniting === 'vibes' && (
                                        <div 
                                            className="absolute inset-0 rounded-full smartimport-ignite-pink"
                                            style={{ background: '#ec4899', zIndex: 0 }}
                                        />
                                    )}
                                    <button
                                        onClick={() => handleButtonClick('vibes')}
                                        disabled={btnIgniting !== null}
                                        className="relative z-10 w-full h-full rounded-full font-bold text-sm text-white flex items-center justify-center gap-1"
                                        style={{ background: btnIgniting === 'vibes' ? 'transparent' : '#ec4899' }}
                                    >
                                        <Flame size={14} />
                                        {folderCount} VIBE{folderCount > 1 ? 'S' : ''}
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