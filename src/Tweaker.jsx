import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, Wrench, Trash2, Disc3, Undo2, CheckCircle2, Ghost, ChevronLeft, ChevronRight, BetweenHorizontalEnd } from 'lucide-react';
import { isSongAvailable } from './utils.js';
import { UNIFIED_CONFIG } from './Config.js';

// --- CONFIG ---
export const TWEAKER_CONFIG = {
    HEADER_GAP: 0.5,              // Espacement entre le titre et les boutons (rem)
    HEADER_MARGIN_BOTTOM: 0.75,   // Espacement entre les boutons et le bas (rem)
    HEADER_BTN_HEIGHT: UNIFIED_CONFIG.CAPSULE_HEIGHT, // Hauteur des boutons (depuis config.js)
    HEADER_BTN_SHOW_TEXT: false,   // Afficher les textes "Undo", "Reorder", "Delete"
    HEADER_BTN_ICON_SIZE: UNIFIED_CONFIG.ICON_SIZE_PERCENT,     // Taille icône en % de la hauteur du bouton (depuis config.js)
    SWIPE_THRESHOLD: 100,         // Seuil de swipe pour confirmer/annuler (px)
    
    // Animation d'ouverture (tiroir)
    SWIPE_OVERLAY_OPACITY: 0.85,       // Opacité max du fond noir lors du swipe
    DRAWER_TOP_SPACING: 16,            // Espacement entre la dernière carte et le haut du tiroir (px)
    
    // Feedback Overlay
    FEEDBACK_FADEIN_DURATION: 75,
    FEEDBACK_TEXT_OPACITY: 100,
    FEEDBACK_BLINK_COUNT: 3,
    FEEDBACK_BLINK_DURATIONS: [100, 80, 200],
    FEEDBACK_BLINK_MIN_OPACITIES: [40, 20, 50],
    FEEDBACK_FADEOUT_DURATION: 150,
    FEEDBACK_GLOW_FADEOUT_DURATION: 150,
    FEEDBACK_GLOW_FLASH_ENABLED: true,
    FEEDBACK_GLOW_FLASH_INTENSITY: 140,
    FEEDBACK_GLOW_FLASH_DURATION: 40,
    FEEDBACK_VALIDATION_FLASH_ENABLED: true,
    FEEDBACK_VALIDATION_FLASH_INTENSITY: 200,
    FEEDBACK_VALIDATION_FLASH_DURATION: 40,
    FEEDBACK_BLINK_TRANSITION: 40,
    NEON_COLOR_ORANGE: '255, 180, 0',
    NEON_COLOR_RED: '255, 7, 58',
    NEON_COLOR_CYAN: '0, 212, 255',
    
    // Animation DELETE
    DELETE_ANIMATION_DURATION: 400,           // Durée totale de l'animation (ms)
    DELETE_ANIMATION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',  // Courbe d'animation
    DELETE_SCALE_START: 1,                    // Échelle de départ
    DELETE_SCALE_END: 0.15,                   // Échelle finale (taille du bouton)
    DELETE_OPACITY_START: 1,                  // Opacité de départ
    DELETE_OPACITY_END: 0,                    // Opacité finale
    DELETE_ROTATION_END: 10,                  // Rotation finale (degrés)
    DELETE_DELAY_BEFORE_HIDE: 350,            // Délai avant de cacher la carte (ms)
    
    // REORDER TOP LIST
    REORDER_ROW_HEIGHT: '2.5rem',              // Hauteur des cartes dans la top liste (rem)
    REORDER_ROW_TITLE_SIZE: '0.875rem',        // Taille du nom (rem)
    REORDER_ROW_COUNT_SIZE: '0.625rem',        // Taille du compteur (rem)
    REORDER_GAP_BOTTOM: '1rem',                // Marge entre top list et liste principale (rem)
    REORDER_CONFIRM_HEIGHT: '4rem',            // Hauteur du bouton de confirmation (rem)
    REORDER_CONFIRM_FONT_SIZE: '1rem',         // Taille du texte du bouton (rem)
};

// --- STYLES CSS ---
const TweakerStyles = `
  @keyframes wiggle {
    0%, 100% { transform: rotate(-0.5deg); }
    50% { transform: rotate(0.5deg); }
  }
  
  .animate-wiggle {
    animation: wiggle 0.2s infinite ease-in-out;
  }
  
  @keyframes shake-delete {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  .animate-shake-delete {
    animation: shake-delete 0.3s ease-in-out;
  }
  
  @keyframes neon-pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
  
  .neon-active {
    animation: neon-pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes feedback-flash {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  .feedback-flash {
    animation: feedback-flash 0.4s ease-out;
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
  
  @keyframes threshold-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.7; }
  }
  
  .threshold-reached {
    animation: threshold-pulse 0.3s ease-in-out infinite;
  }
`;

// Composant FeedbackOverlay pour le Tweaker
const TweakerFeedbackOverlay = ({ isActive, onAnimationComplete, neonColor, bgClass, bgGradient, borderClass, children }) => {
    const [phase, setPhase] = useState('idle');
    const [textOpacity, setTextOpacity] = useState(0);
    const [glowIntensity, setGlowIntensity] = useState(0);
    const [bgOpacity, setBgOpacity] = useState(0);
    const timeoutsRef = useRef([]);
    
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
            setPhase('idle');
            setTextOpacity(0);
            setGlowIntensity(0);
            setBgOpacity(0);
            return;
        }
        
        // Phase 1: Fade in + Flash
        setPhase('fadein');
        requestAnimationFrame(() => {
            setTextOpacity(TWEAKER_CONFIG.FEEDBACK_TEXT_OPACITY);
            setBgOpacity(100);
            setGlowIntensity(TWEAKER_CONFIG.FEEDBACK_GLOW_FLASH_INTENSITY);
        });
        
        // Phase 2: Flash -> Idle -> Validation -> Fade out
        addTimeout(() => {
            setGlowIntensity(100);
            setPhase('validating');
            
            let currentDelay = 0;
            
            // Validation flash
            if (TWEAKER_CONFIG.FEEDBACK_VALIDATION_FLASH_ENABLED) {
                setGlowIntensity(TWEAKER_CONFIG.FEEDBACK_VALIDATION_FLASH_INTENSITY);
                currentDelay += TWEAKER_CONFIG.FEEDBACK_VALIDATION_FLASH_DURATION;
                addTimeout(() => setGlowIntensity(100), currentDelay);
            }
            
            // Blinks
            for (let i = 0; i < TWEAKER_CONFIG.FEEDBACK_BLINK_COUNT; i++) {
                const blinkDuration = TWEAKER_CONFIG.FEEDBACK_BLINK_DURATIONS[i] || TWEAKER_CONFIG.FEEDBACK_BLINK_DURATIONS[TWEAKER_CONFIG.FEEDBACK_BLINK_DURATIONS.length - 1];
                const minOpacity = TWEAKER_CONFIG.FEEDBACK_BLINK_MIN_OPACITIES[i] || TWEAKER_CONFIG.FEEDBACK_BLINK_MIN_OPACITIES[TWEAKER_CONFIG.FEEDBACK_BLINK_MIN_OPACITIES.length - 1];
                
                addTimeout(() => setTextOpacity(minOpacity), currentDelay);
                currentDelay += blinkDuration / 2;
                addTimeout(() => setTextOpacity(TWEAKER_CONFIG.FEEDBACK_TEXT_OPACITY), currentDelay);
                currentDelay += blinkDuration / 2;
            }
            
            // Fade out
            addTimeout(() => {
                setPhase('fadeout');
                setTextOpacity(0);
                setGlowIntensity(0);
                setBgOpacity(0);
            }, currentDelay);
            
            // Animation complete
            addTimeout(() => {
                if (onAnimationComplete) onAnimationComplete();
            }, currentDelay + TWEAKER_CONFIG.FEEDBACK_FADEOUT_DURATION);
            
        }, TWEAKER_CONFIG.FEEDBACK_FADEIN_DURATION + TWEAKER_CONFIG.FEEDBACK_GLOW_FLASH_DURATION);
        
        return () => clearAllTimeouts();
    }, [isActive]); // onAnimationComplete volontairement exclu pour éviter de reset l'animation en cours
    
    if (!isActive && phase === 'idle') return null;
    
    const getTransitionDuration = () => {
        switch (phase) {
            case 'fadein': return `${TWEAKER_CONFIG.FEEDBACK_FADEIN_DURATION}ms`;
            case 'fadeout': return `${TWEAKER_CONFIG.FEEDBACK_FADEOUT_DURATION}ms`;
            default: return '150ms';
        }
    };
    
    const glowStyle = {
        boxShadow: `0 0 ${20 * glowIntensity / 100}px rgba(${neonColor}, ${0.8 * glowIntensity / 100}), 0 0 ${40 * glowIntensity / 100}px rgba(${neonColor}, ${0.4 * glowIntensity / 100})`,
        transition: `box-shadow ${getTransitionDuration()} ease-out`
    };
    
    const containerStyle = {
        ...glowStyle,
        opacity: bgOpacity / 100,
        transition: `opacity ${getTransitionDuration()} ease-out, ${glowStyle.transition}`
    };
    
    return (
        <div 
            className={`absolute inset-0 z-10 rounded-full flex items-center justify-center border ${bgClass || ''} ${borderClass}`}
            style={{
                ...containerStyle,
                background: bgGradient || undefined
            }}
        >
            <div 
                className="flex items-center gap-2 text-white font-black tracking-widest uppercase text-lg"
                style={{ 
                    opacity: textOpacity / 100,
                    transition: `opacity ${phase === 'validating' ? `${TWEAKER_CONFIG.FEEDBACK_BLINK_TRANSITION}ms` : getTransitionDuration()} ease-out`
                }}
            >
                {children}
            </div>
        </div>
    );
};

// Composant principal Tweaker
const Tweaker = ({
    playlists, 
    vibeColorIndices, 
    setVibeColorIndices, 
    onSave, 
    onCancel,
    onCloseStart = () => {},
    VibeCardComponent,
    getInitialGradientIndex,
    getGradientName,
    getGradientByIndex,
    dashboardHeight = 0,
    footerHeight = 0,
    hasSong = false,
    capsuleHeightVh = 5.8,
    onSwipeProgress = () => {},
    cardAnimConfig = {}
}) => {
    // Animation d'ouverture
    const [isVisible, setIsVisible] = useState(false);
    const [isOpenAnimating, setIsOpenAnimating] = useState(true);
    
    // Animation de fermeture ('left', 'right', ou null)
    const [closingDirection, setClosingDirection] = useState(null);
    
    // Lancer l'animation d'ouverture au montage
    useEffect(() => {
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
        // Désactiver le flag après la fin de l'animation
        const timer = setTimeout(() => {
            setIsOpenAnimating(false);
        }, cardAnimConfig.openDuration);
        return () => clearTimeout(timer);
    }, []);
    
    // État local des vibes (copie pour modifications)
    const [vibes, setVibes] = useState(() => 
        Object.keys(playlists).map(name => ({
            name,
            originalName: name,
            songs: playlists[name]
        }))
    );
    
    // Vibes supprimées (pour annulation)
    const [deletedVibes, setDeletedVibes] = useState([]);
    
    // Ordre personnalisé
    const [orderedVibes, setOrderedVibes] = useState([]);
    
    // Ordre validé (mémorisé après chaque validation de reorder)
    const [lastValidatedOrder, setLastValidatedOrder] = useState([]);
    
    // Animation de suppression
    const [deletingVibe, setDeletingVibe] = useState(null);
    
    // Vibes marquées pour suppression (mode delete)
    const [markedForDeletion, setMarkedForDeletion] = useState([]);
    
    // Animations de delete en cours (permet plusieurs en parallèle)
    const [deletingAnimations, setDeletingAnimations] = useState([]);
    const deleteButtonRef = useRef(null);
    const cardRefsMap = useRef(new Map());
    
    // Swipe preview pour les cartes
    const [vibeSwipePreview, setVibeSwipePreview] = useState(null);
    
    // Mode actif (reorder ou delete)
    const [activeMode, setActiveMode] = useState(null);
    
    // Swipe du titre
    const [titleSwipeX, setTitleSwipeX] = useState(0);
    const [titleTouchStart, setTitleTouchStart] = useState(null);
    
    // Feedback Undo
    const [undoFeedback, setUndoFeedback] = useState(false);
    
    // Feedback Delete
    const [deleteFeedback, setDeleteFeedback] = useState(false);
    
    // Feedback Reorder
    const [reorderFeedback, setReorderFeedback] = useState(false);
    
    // Édition du nom de vibe
    const [editingVibeName, setEditingVibeName] = useState(null);
    const [editedName, setEditedName] = useState('');
    
    // Sauvegarder l'état original complet pour pouvoir annuler
    const [originalColorIndices] = useState(() => ({ ...vibeColorIndices }));
    const [originalVibes] = useState(() => 
        Object.keys(playlists).map(name => ({
            name,
            originalName: name,
            songs: playlists[name]
        }))
    );
    
    const toggleMode = (mode) => {
        // Si on clique sur Reorder alors qu'on est déjà en mode reorder, annuler
        if (mode === 'reorder' && activeMode === 'reorder') {
            setOrderedVibes([]);
            setActiveMode(null);
            return;
        }
        
        // Si on entre en mode reorder, toujours commencer avec un tableau vide
        if (mode === 'reorder' && activeMode !== 'reorder') {
            setOrderedVibes([]);
        }
        
        setActiveMode(prev => prev === mode ? null : mode);
    };
    
    const handleUndo = () => {
        // Lancer l'animation ET le undo simultanément
        setUndoFeedback(true);
        
        // Restaurer tout l'état original immédiatement
        setVibes(originalVibes);
        setVibeColorIndices(originalColorIndices);
        setOrderedVibes([]);
        setLastValidatedOrder([]);
        setDeletedVibes([]);
        setMarkedForDeletion([]);
        setActiveMode(null);
    };
    
    const handleUndoAnimationComplete = () => {
        setUndoFeedback(false);
    };
    
    const handleDeleteAnimationComplete = () => {
        setDeleteFeedback(false);
    };
    
    const handleReorderAnimationComplete = () => {
        setReorderFeedback(false);
    };
    
    // Gérer l'édition du nom de vibe
    const handleNameEdit = (oldName) => {
        if (activeMode !== null) return; // Ne pas éditer en mode reorder/delete
        setEditingVibeName(oldName);
        setEditedName(oldName);
    };
    
    // Confirmer le changement de nom
    const confirmNameChange = (oldName) => {
        if (editedName.trim() && editedName !== oldName) {
            setVibes(prev => prev.map(v => 
                v.name === oldName ? { ...v, name: editedName.trim() } : v
            ));
            // Mettre à jour orderedVibes si nécessaire
            setOrderedVibes(prev => prev.map(n => n === oldName ? editedName.trim() : n));
            // Mettre à jour vibeColorIndices
            if (vibeColorIndices[oldName] !== undefined) {
                setVibeColorIndices(prev => {
                    const newIndices = { ...prev };
                    newIndices[editedName.trim()] = newIndices[oldName];
                    delete newIndices[oldName];
                    return newIndices;
                });
            }
        }
        setEditingVibeName(null);
        setEditedName('');
    };
    
    // Quitter automatiquement le mode reorder quand toutes les cartes sont ordonnées
    useEffect(() => {
        if (activeMode === 'reorder') {
            const remainingVibes = vibes.filter(v => !markedForDeletion.includes(v.name));
            if (orderedVibes.length > 0 && orderedVibes.length === remainingVibes.length) {
                // Sauvegarder l'ordre validé pour le rappeler plus tard
                setLastValidatedOrder([...orderedVibes]);
                setReorderFeedback(true);
                setActiveMode(null);
            }
        }
    }, [orderedVibes, vibes, markedForDeletion, activeMode]);
    
    // Lancer l'animation de delete pour une carte
    const startDeleteAnimation = (vibeName, cardElement) => {
        if (!deleteButtonRef.current || !cardElement) return;
        
        const cardRect = cardElement.getBoundingClientRect();
        const buttonRect = deleteButtonRef.current.getBoundingClientRect();
        
        const animationId = `${vibeName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}-${Date.now()}`;
        
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;
        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;
        
        const animationData = {
            id: animationId,
            vibeName,
            startX: cardRect.left,
            startY: cardRect.top,
            startWidth: cardRect.width,
            startHeight: cardRect.height,
            deltaX: buttonCenterX - cardCenterX,
            deltaY: buttonCenterY - cardCenterY,
        };
        
        // Ajouter l'animation à la liste
        setDeletingAnimations(prev => [...prev, animationData]);
        
        // Déclencher le feedback overlay après que la carte arrive sur le bouton
        setTimeout(() => {
            setDeleteFeedback(true);
        }, TWEAKER_CONFIG.DELETE_DELAY_BEFORE_HIDE);
        
        // Cacher la carte après le délai
        setTimeout(() => {
            setMarkedForDeletion(prev => [...prev, vibeName]);
        }, TWEAKER_CONFIG.DELETE_DELAY_BEFORE_HIDE);
        
        // Supprimer l'animation de la liste après qu'elle soit terminée
        setTimeout(() => {
            setDeletingAnimations(prev => prev.filter(a => a.id !== animationId));
        }, TWEAKER_CONFIG.DELETE_ANIMATION_DURATION);
    };
    
    // Handlers pour le swipe du titre
    const handleTitleTouchStart = (e) => {
        setTitleTouchStart(e.touches[0].clientX);
    };
    
    const handleTitleTouchMove = (e) => {
        if (titleTouchStart === null) return;
        const diff = e.touches[0].clientX - titleTouchStart;
        setTitleSwipeX(diff);
    };
    
    const handleTitleTouchEnd = () => {
        if (titleSwipeX > TWEAKER_CONFIG.SWIPE_THRESHOLD) {
            // Swipe droite = confirmer
            handleConfirm();
        } else if (titleSwipeX < -TWEAKER_CONFIG.SWIPE_THRESHOLD) {
            // Swipe gauche = annuler
            handleCancel();
        }
        setTitleSwipeX(0);
        setTitleTouchStart(null);
    };
    
    const handleCardClick = (vibeName) => {
        if (activeMode === 'delete') {
            // Mode delete : lancer l'animation et marquer pour suppression
            if (!markedForDeletion.includes(vibeName)) {
                const cardElement = cardRefsMap.current.get(vibeName);
                if (cardElement) {
                    startDeleteAnimation(vibeName, cardElement);
                }
            }
        } else if (activeMode === 'reorder') {
            // Mode reorder : toggle l'ordre
            if (orderedVibes.includes(vibeName)) {
                setOrderedVibes(prev => prev.filter(n => n !== vibeName));
            } else {
                setOrderedVibes(prev => [...prev, vibeName]);
            }
        }
    };
    
    const handleSwipeDelete = (vibeName) => {
        setDeletingVibe(vibeName);
        
        setTimeout(() => {
            const vibeToDelete = vibes.find(v => v.name === vibeName);
            if (vibeToDelete) {
                setDeletedVibes(prev => [...prev, vibeToDelete]);
                setVibes(prev => prev.filter(v => v.name !== vibeName));
                setOrderedVibes(prev => prev.filter(n => n !== vibeName));
            }
            setDeletingVibe(null);
        }, 300);
    };
    
    const handleConfirm = () => {
        // Construire le nouvel objet playlists
        // D'abord, filtrer les cartes marquées pour suppression
        let finalVibes = vibes.filter(v => !markedForDeletion.includes(v.name));
        
        // Utiliser orderedVibes si défini, sinon lastValidatedOrder
        const orderToApply = orderedVibes.length > 0 ? orderedVibes : lastValidatedOrder;
        
        // Si un ordre a été défini, l'appliquer
        if (orderToApply.length > 0) {
            const orderedSet = new Set(orderToApply);
            const unordered = finalVibes.filter(v => !orderedSet.has(v.name));
            const ordered = orderToApply.map(name => finalVibes.find(v => v.name === name)).filter(Boolean);
            finalVibes = [...ordered, ...unordered];
        }
        
        // Créer le nouvel objet
        const newPlaylists = {};
        finalVibes.forEach(vibe => {
            newPlaylists[vibe.name] = vibe.songs;
        });
        
        // APPLIQUER LES CHANGEMENTS IMMÉDIATEMENT (avant l'animation)
        onSave(newPlaylists);
        
        // PUIS lancer l'animation de fermeture vers la droite
        setClosingDirection('right');
        onCloseStart(); // Reset les cartes pendant l'animation
        setTimeout(() => {
            onCancel();
        }, cardAnimConfig.closeDuration);

    };
    
    const handleCancel = () => {
        // Restaurer tout l'état original
        setVibeColorIndices(originalColorIndices);
        setVibes(originalVibes);
        setOrderedVibes([]);
        setDeletedVibes([]);
        
        // Lancer l'animation de fermeture vers la gauche
        setClosingDirection('left');
        onCloseStart(); // Reset les cartes pendant l'animation
        setTimeout(() => {
            onCancel();
        }, cardAnimConfig.closeDuration);
    };
    
    // Trier les vibes pour l'affichage
    // En mode reorder, utiliser lastValidatedOrder pour les vibes non encore sélectionnées
    const displayVibes = [...vibes].sort((a, b) => {
        const aIndexOrdered = orderedVibes.indexOf(a.name);
        const bIndexOrdered = orderedVibes.indexOf(b.name);
        
        // Si les deux sont dans orderedVibes, trier par cet ordre
        if (aIndexOrdered !== -1 && bIndexOrdered !== -1) {
            return aIndexOrdered - bIndexOrdered;
        }
        
        // Si un seul est dans orderedVibes, il passe en premier
        if (aIndexOrdered !== -1) return -1;
        if (bIndexOrdered !== -1) return 1;
        
        // Sinon, utiliser lastValidatedOrder pour trier
        const aIndexLast = lastValidatedOrder.indexOf(a.name);
        const bIndexLast = lastValidatedOrder.indexOf(b.name);
        
        if (aIndexLast === -1 && bIndexLast === -1) return 0;
        if (aIndexLast === -1) return 1;
        if (bIndexLast === -1) return -1;
        return aIndexLast - bIndexLast;
    });
    
    return (
        <>
        <div 
            className="absolute inset-0 bg-white z-[55] flex flex-col"
            style={{ 
                paddingBottom: hasSong ? `${dashboardHeight + footerHeight}px` : 0,
                transformOrigin: `center ${cardAnimConfig.originY}`,
                transform: closingDirection 
                    ? `rotateZ(${closingDirection === 'right' ? '' : '-'}${cardAnimConfig.closeRotation}deg)`
                    : titleSwipeX !== 0 
                        ? `rotateZ(${titleSwipeX / TWEAKER_CONFIG.SWIPE_THRESHOLD * 15}deg)`
                        : isVisible ? 'rotateZ(0deg)' : `rotateZ(-${cardAnimConfig.closeRotation}deg)`,
                        borderRadius: (closingDirection || !isVisible || titleSwipeX !== 0) ? cardAnimConfig.radius : '0',
                        outline: (closingDirection || !isVisible || isOpenAnimating || titleSwipeX !== 0) ? `${cardAnimConfig.borderWidth}px solid ${cardAnimConfig.borderColor}` : 'none',
                transition: titleSwipeX !== 0
                ? 'none'
                : closingDirection
                    ? `transform ${cardAnimConfig.closeDuration}ms linear, border-radius ${cardAnimConfig.closeDuration}ms linear, outline ${cardAnimConfig.closeDuration}ms linear`
                        : `transform ${cardAnimConfig.openDuration}ms cubic-bezier(0, ${cardAnimConfig.openDecel}, ${1 - cardAnimConfig.openDecel}, 1), border-radius ${cardAnimConfig.openDuration}ms cubic-bezier(0, ${cardAnimConfig.openDecel}, ${1 - cardAnimConfig.openDecel}, 1), outline ${cardAnimConfig.openDuration}ms cubic-bezier(0, ${cardAnimConfig.openDecel}, ${1 - cardAnimConfig.openDecel}, 1)`
            }}
        >
            <style>{TweakerStyles}</style>
            
            {/* Header swipeable (titre + boutons) */}
            <div
                className="cursor-grab active:cursor-grabbing select-none relative"
                style={{
                    paddingTop: `calc(env(safe-area-inset-top, 0px) + ${UNIFIED_CONFIG.TITLE_MARGIN_TOP})`,
                }}
                onTouchStart={handleTitleTouchStart}
                onTouchMove={handleTitleTouchMove}
                onTouchEnd={handleTitleTouchEnd}
            >
                {/* Contenu swipeable (titre + boutons) */}
                <div>
                    {/* Titre avec indicateurs de swipe */}
                    <div className="px-4 flex items-center justify-between">
                        {/* Indicateur gauche - Annuler */}
                        <div className="flex items-center gap-0.5 swipe-hint-left">
                            <X size={14} className="text-red-400" strokeWidth={2.5} />
                            <ChevronLeft size={14} className="text-gray-300 -ml-1" strokeWidth={2} />
                            <ChevronLeft size={14} className="text-gray-200 -ml-2.5" strokeWidth={2} />
                        </div>

                        {/* Titre central */}
                        <div className="flex items-center" style={{ gap: UNIFIED_CONFIG.TITLE_ICON_GAP }}>
                            <Wrench size={UNIFIED_CONFIG.TITLE_ICON_SIZE} className="text-pink-500" />
                            <span
                                className="font-black text-gray-900"
                                style={{
                                    fontSize: UNIFIED_CONFIG.TITLE_FONT_SIZE,
                                    fontVariant: 'small-caps',
                                    textTransform: 'lowercase'
                                }}
                            >
                                Tweaker
                            </span>
                        </div>

                        {/* Indicateur droite - Valider */}
                        <div className="flex items-center gap-0.5 swipe-hint-right">
                            <ChevronRight size={14} className="text-gray-200 -mr-2.5" strokeWidth={2} />
                            <ChevronRight size={14} className="text-gray-300 -mr-1" strokeWidth={2} />
                            <Check size={14} className="text-lime-500" strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Boutons capsule mode */}
                    <div className="px-4" style={{ paddingTop: `${TWEAKER_CONFIG.HEADER_GAP}rem`, paddingBottom: `${TWEAKER_CONFIG.HEADER_MARGIN_BOTTOM}rem` }}>
                        <div className="flex gap-2 relative">
                            {/* FeedbackOverlay pour UNDO */}
                            <TweakerFeedbackOverlay
                                isActive={undoFeedback}
                                onAnimationComplete={handleUndoAnimationComplete}
                                neonColor={TWEAKER_CONFIG.NEON_COLOR_ORANGE}
                                bgGradient="linear-gradient(135deg, #FFD600 0%, #FF6B00 100%)"
                                borderClass="border-orange-600"
                            >
                                <Undo2 size={18} strokeWidth={3} />
                                <span>UNDO</span>
                            </TweakerFeedbackOverlay>
                            
                            {/* FeedbackOverlay pour DELETE */}
                            <TweakerFeedbackOverlay
                                isActive={deleteFeedback}
                                onAnimationComplete={handleDeleteAnimationComplete}
                                neonColor={TWEAKER_CONFIG.NEON_COLOR_RED}
                                bgGradient="linear-gradient(135deg, #FF073A 0%, #FF00FF 100%)"
                                borderClass="border-rose-600"
                            >
                                <Trash2 size={18} strokeWidth={3} />
                                <span>DELETED</span>
                            </TweakerFeedbackOverlay>
                            
                            {/* FeedbackOverlay pour REORDER */}
                            <TweakerFeedbackOverlay
                                isActive={reorderFeedback}
                                onAnimationComplete={handleReorderAnimationComplete}
                                neonColor={TWEAKER_CONFIG.NEON_COLOR_CYAN}
                                bgGradient="linear-gradient(135deg, #00D4FF 0%, #FF00FF 100%)"
                                borderClass="border-cyan-600"
                            >
                                <BetweenHorizontalEnd size={18} strokeWidth={3} />
                                <span>APPLIED</span>
                            </TweakerFeedbackOverlay>
                            
                {/* Bouton UNDO - Jaune/Orange */}
                <button
                    onClick={handleUndo}
                    className="flex-1 rounded-full flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all duration-300 overflow-hidden"
                    style={{
                        height: TWEAKER_CONFIG.HEADER_BTN_HEIGHT,
                        background: undoFeedback ? 'linear-gradient(135deg, #FFD600 0%, #FF6B00 100%)' : '#F3F4F6',
                        color: undoFeedback ? 'white' : '#9CA3AF',
                        boxShadow: undoFeedback 
                            ? '0 0 20px rgba(255, 214, 0, 0.5), 0 0 40px rgba(255, 107, 0, 0.3)' 
                            : 'inset 0 0 0 1px #E5E7EB'
                    }}
                >
                    <Undo2 style={{ width: `calc(${TWEAKER_CONFIG.HEADER_BTN_HEIGHT} * ${TWEAKER_CONFIG.HEADER_BTN_ICON_SIZE} / 100)`, height: `calc(${TWEAKER_CONFIG.HEADER_BTN_HEIGHT} * ${TWEAKER_CONFIG.HEADER_BTN_ICON_SIZE} / 100)` }} />
                    {TWEAKER_CONFIG.HEADER_BTN_SHOW_TEXT && <span>Undo</span>}
                </button>

                {/* Bouton REORDER - Cyan/Magenta */}
                <button
                    onClick={() => toggleMode('reorder')}
                    className="flex-1 rounded-full flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all duration-300 overflow-hidden"
                    style={{
                        height: TWEAKER_CONFIG.HEADER_BTN_HEIGHT,
                        background: activeMode === 'reorder' ? 'linear-gradient(135deg, #00D4FF 0%, #FF00FF 100%)' : '#F3F4F6',
                        color: activeMode === 'reorder' ? 'white' : '#9CA3AF',
                        boxShadow: activeMode === 'reorder' 
                            ? '0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)' 
                            : 'inset 0 0 0 1px #E5E7EB'
                    }}
                >
                    <BetweenHorizontalEnd style={{ width: `calc(${TWEAKER_CONFIG.HEADER_BTN_HEIGHT} * ${TWEAKER_CONFIG.HEADER_BTN_ICON_SIZE} / 100)`, height: `calc(${TWEAKER_CONFIG.HEADER_BTN_HEIGHT} * ${TWEAKER_CONFIG.HEADER_BTN_ICON_SIZE} / 100)` }} />
                    {TWEAKER_CONFIG.HEADER_BTN_SHOW_TEXT && <span>Reorder</span>}
                </button>
                
                {/* Bouton DELETE - Rouge/Rose */}
                <button
                    ref={deleteButtonRef}
                    onClick={() => toggleMode('delete')}
                    className="flex-1 rounded-full flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all duration-300 overflow-hidden"
                    style={{
                        height: TWEAKER_CONFIG.HEADER_BTN_HEIGHT,
                        background: activeMode === 'delete' ? 'linear-gradient(135deg, #FF073A 0%, #FF00FF 100%)' : '#F3F4F6',
                        color: activeMode === 'delete' ? 'white' : '#9CA3AF',
                        boxShadow: activeMode === 'delete' 
                            ? '0 0 20px rgba(255, 7, 58, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)' 
                            : 'inset 0 0 0 1px #E5E7EB'
                    }}
                >
                    <Trash2 style={{ width: `calc(${TWEAKER_CONFIG.HEADER_BTN_HEIGHT} * ${TWEAKER_CONFIG.HEADER_BTN_ICON_SIZE} / 100)`, height: `calc(${TWEAKER_CONFIG.HEADER_BTN_HEIGHT} * ${TWEAKER_CONFIG.HEADER_BTN_ICON_SIZE} / 100)` }} />
                    {TWEAKER_CONFIG.HEADER_BTN_SHOW_TEXT && <span>Delete</span>}
                </button>
                        </div>
                    </div>
                </div>
                
                </div>
            
            {/* Animations de delete en cours - Rendu dans un portail pour positionnement absolu sur l'écran */}
            {deletingAnimations.map(anim => {
                const vibe = originalVibes.find(v => v.name === anim.vibeName);
                if (!vibe) return null;
                
                const songs = vibe.songs;
                const isVibe = songs[0]?.type === 'vibe' || vibe.name.includes('Vibe');
                const availableCount = songs.filter(s => isSongAvailable(s)).length;
                const unavailableCount = songs.length - availableCount;
                const isExpired = availableCount === 0;
                
                return createPortal(
                    <div
                        key={anim.id}
                        className="fixed pointer-events-none"
                        style={{
                            left: anim.startX,
                            top: anim.startY,
                            width: anim.startWidth,
                            height: anim.startHeight,
                            zIndex: 9999,
                            animation: `deleteCardAnim-${anim.id} ${TWEAKER_CONFIG.DELETE_ANIMATION_DURATION}ms ${TWEAKER_CONFIG.DELETE_ANIMATION_EASING} forwards`,
                        }}
                    >
                        <style>{`
                            @keyframes deleteCardAnim-${anim.id} {
                                0% {
                                    transform: translate(0px, 0px) scale(${TWEAKER_CONFIG.DELETE_SCALE_START}) rotate(0deg);
                                    opacity: ${TWEAKER_CONFIG.DELETE_OPACITY_START};
                                }
                                100% {
                                    transform: translate(${anim.deltaX}px, ${anim.deltaY}px) scale(${TWEAKER_CONFIG.DELETE_SCALE_END}) rotate(${TWEAKER_CONFIG.DELETE_ROTATION_END}deg);
                                    opacity: ${TWEAKER_CONFIG.DELETE_OPACITY_END};
                                }
                            }
                        `}</style>
                        <VibeCardComponent 
                            folderName={vibe.name} 
                            availableCount={availableCount}
                            unavailableCount={unavailableCount}
                            isVibe={isVibe}
                            isExpired={isExpired}
                            onClick={() => {}}
                            colorIndex={vibeColorIndices[vibe.name] !== undefined ? vibeColorIndices[vibe.name] : getInitialGradientIndex(vibe.name)}
                            onColorChange={() => {}}
                            onSwipeProgress={() => {}}
                        />
                    </div>,
                    document.body
                );
            })}

            {/* TOP LISTE - Vibes ordonnées (mode reorder) */}
            {activeMode === 'reorder' && orderedVibes.length > 0 && (
                <div className="flex flex-col" style={{ marginBottom: TWEAKER_CONFIG.REORDER_GAP_BOTTOM }}>
                    {orderedVibes.map((vibeName, index) => {
                        const vibe = vibes.find(v => v.name === vibeName);
                        if (!vibe) return null;
                        
                        const songs = vibe.songs;
                        const availableCount = songs.filter(s => isSongAvailable(s)).length;
                        const unavailableCount = songs.length - availableCount;
                        const colorIndex = vibeColorIndices[vibe.name] !== undefined 
                            ? vibeColorIndices[vibe.name] 
                            : getInitialGradientIndex(vibe.name);
                        const gradient = getGradientByIndex ? getGradientByIndex(colorIndex) : ['#ec4899', '#f472b6', '#f9a8d4'];
                        const step = 100 / (gradient.length - 1);
                        const gradientBg = `linear-gradient(135deg, ${gradient.map((c, i) => `${c} ${Math.round(i * step)}%`).join(', ')})`;
                        
                        return (
                            <div
                                key={`ordered-${vibe.name}`}
                                className="w-full flex items-center border-b border-white/20 cursor-pointer active:opacity-80"
                                style={{
                                    height: TWEAKER_CONFIG.REORDER_ROW_HEIGHT,
                                    background: gradientBg,
                                }}
                                onClick={() => {
                                    setOrderedVibes(prev => prev.filter(n => n !== vibeName));
                                }}
                            >
                                {/* Tout sur une ligne, centré verticalement */}
                                <div className="w-10 flex-shrink-0 flex items-center justify-center text-white/60 font-black text-sm">
                                    {index + 1}
                                </div>
                                <span 
                                    className="font-black text-white truncate"
                                    style={{ 
                                        fontSize: TWEAKER_CONFIG.REORDER_ROW_TITLE_SIZE,
                                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    {vibe.name}
                                </span>
                                <span 
                                    className="text-white/90 font-semibold flex items-center gap-1 ml-2"
                                    style={{ fontSize: TWEAKER_CONFIG.REORDER_ROW_COUNT_SIZE }}
                                >
                                    <CheckCircle2 size={10} />
                                    <span>{availableCount}</span>
                                    {unavailableCount > 0 && (
                                        <>
                                            <Ghost size={10} className="ml-1 opacity-60" />
                                            <span className="opacity-60">{unavailableCount}</span>
                                        </>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

<div className="flex-1 overflow-y-auto px-6 no-scrollbar" style={{ paddingBottom: `${TWEAKER_CONFIG.DRAWER_TOP_SPACING}px` }}>
<div className="flex flex-col" style={{ gap: '1.2vh' }}>
                    {displayVibes.map((vibe) => {
                        const songs = vibe.songs;
                        const isVibe = songs[0]?.type === 'vibe' || vibe.name.includes('Vibe');
                        const availableCount = songs.filter(s => isSongAvailable(s)).length;
                        const unavailableCount = songs.length - availableCount;
                        const isExpired = availableCount === 0;
                        const orderNumber = orderedVibes.indexOf(vibe.name);
                        
                        // Ne pas afficher les vibes marquées pour suppression
                        if (markedForDeletion.includes(vibe.name)) return null;
                        
                        // Ne pas afficher les vibes déjà dans la top liste (mode reorder)
                        if (activeMode === 'reorder' && orderedVibes.includes(vibe.name)) return null;
                        
                        const isMarkedDelete = markedForDeletion.includes(vibe.name);
                        
                        return (
                            <div 
                                key={vibe.originalName}
                                ref={(el) => { if (el) cardRefsMap.current.set(vibe.name, el); }}
                                className={`relative ${deletingVibe === vibe.name ? 'animate-shake-delete opacity-50' : ''} ${orderNumber !== -1 && activeMode === 'reorder' ? 'animate-wiggle' : ''}`}
                            >
                                
                                <VibeCardComponent 
                                    folderName={vibe.name} 
                                    availableCount={availableCount}
                                    unavailableCount={unavailableCount}
                                    isVibe={isVibe}
                                    isExpired={isExpired}
                                    onClick={() => handleCardClick(vibe.name)}
                                    colorIndex={vibeColorIndices[vibe.name] !== undefined ? vibeColorIndices[vibe.name] : getInitialGradientIndex(vibe.name)}
                                    onColorChange={(direction) => {
                                        setVibeColorIndices(prev => ({
                                            ...prev,
                                            [vibe.name]: (prev[vibe.name] !== undefined ? prev[vibe.name] : getInitialGradientIndex(vibe.name)) + direction
                                        }));
                                    }}
                                    onSwipeProgress={(preview) => {
                                        setVibeSwipePreview(preview);
                                        onSwipeProgress(preview);
                                    }}
                                    onNameEdit={activeMode === null ? () => {
                                        setEditingVibeName(vibe.name);
                                        setEditedName(vibe.name);
                                    } : undefined}
                                    isEditingName={editingVibeName === vibe.name}
                                    editedName={editedName}
                                    onEditedNameChange={setEditedName}
                                    onConfirmNameChange={() => confirmNameChange(vibe.name)}
                                />
                            </div>
                        );
                    })}
                </div>
                </div>
        </div>
        
        {/* Overlay de swipe (au même niveau que le Tweaker, indépendant de la rotation) */}
        {Math.abs(titleSwipeX) > 20 && (
            <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]"
                style={{ 
                    backgroundColor: `rgba(0, 0, 0, ${Math.min(TWEAKER_CONFIG.SWIPE_OVERLAY_OPACITY, Math.abs(titleSwipeX) / TWEAKER_CONFIG.SWIPE_THRESHOLD * TWEAKER_CONFIG.SWIPE_OVERLAY_OPACITY)})`
                }}
            >
                <div className={Math.abs(titleSwipeX) >= TWEAKER_CONFIG.SWIPE_THRESHOLD ? 'threshold-reached' : ''}>
                {titleSwipeX < 0 ? (
                        <X 
                            size={Math.abs(titleSwipeX) >= TWEAKER_CONFIG.SWIPE_THRESHOLD ? 225 : 150} 
                            strokeWidth={3}
                            className={Math.abs(titleSwipeX) >= TWEAKER_CONFIG.SWIPE_THRESHOLD ? 'text-red-500' : 'text-gray-300'}
                            style={{ 
                                filter: Math.abs(titleSwipeX) >= TWEAKER_CONFIG.SWIPE_THRESHOLD 
                                    ? 'drop-shadow(0 0 30px rgba(239, 68, 68, 0.8))' 
                                    : 'none'
                            }} 
                        />
                    ) : (
                        <Check 
                            size={titleSwipeX >= TWEAKER_CONFIG.SWIPE_THRESHOLD ? 225 : 150} 
                            strokeWidth={3}
                            className={titleSwipeX >= TWEAKER_CONFIG.SWIPE_THRESHOLD ? 'text-lime-500' : 'text-gray-300'}
                            style={{ 
                                filter: titleSwipeX >= TWEAKER_CONFIG.SWIPE_THRESHOLD 
                                    ? 'drop-shadow(0 0 30px rgba(132, 204, 22, 0.8))' 
                                    : 'none'
                            }} 
                        />
                    )}
                </div>
            </div>
        )}
        </>
    );
};

export default Tweaker;