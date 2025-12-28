import React, { useState, useRef, useEffect } from 'react';
import { X, Folder, Music, ChevronLeft, FolderDown, LogOut, Loader2 } from 'lucide-react';
import { DropboxLogoVector } from './Assets.jsx';
import { UNIFIED_CONFIG } from './Config.js';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    DROPBOX BROWSER - PARAMÈTRES                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

const CONFIG = {
    // Couleurs
    DROPBOX_BLUE: '#0061FE',

    // Cartes dossiers (représentent des vibes)
    CARD_HEIGHT: '2.0rem',              // Comme ROW_HEIGHT du VibeBuilder
    CARD_RADIUS: '0.5rem',
    CARD_GAP: '0.25rem',

    // Fichiers MP3 - mêmes styles que VibeBuilder
    FILE_HEIGHT: '2.0rem',              // Comme ROW_HEIGHT du VibeBuilder
    FILE_GAP: '0',                      // Pas de gap, juste border-b

    // Tailles de police (comme VibeBuilder)
    ROW_TITLE_SIZE: '0.75rem',          // 12px
    ROW_SUBTITLE_SIZE: '0.625rem',      // 10px

    // Dialog - plus grand
    DIALOG_WIDTH: '92vw',
    DIALOG_MAX_WIDTH: '360px',
    DIALOG_HEIGHT: '80vh',
    DIALOG_MAX_HEIGHT: '600px',

    // Scrollbar rose (comme neon beacon)
    SCROLLBAR_WIDTH: 6,
    SCROLLBAR_COLOR: 'rgba(236, 72, 153, 0.8)',
    SCROLLBAR_GLOW: '0 0 8px rgba(236, 72, 153, 0.6)',

    // Zone de scrubbing à droite (comme VibeBuilder sidebar)
    SCRUB_ZONE_WIDTH: '3.75rem',

    // Padding horizontal unifié (header + boutons)
    HORIZONTAL_PADDING: '0.75rem',

    // Scroll fade indicators (comme SmartImport)
    FADE_HEIGHT: '3rem',
    FADE_OPACITY: 0.75,
    FADE_DISTANCE: 30,                   // Distance en px où le fade commence à disparaître

    // Animation
    BUTTON_ANIM_DURATION: 400,
    MORPH_DURATION: 400,
};

// Styles CSS pour les animations (réutilise le style SmartImport)
const dropboxStyles = `
  @keyframes dropbox-neon-ignite-blue {
    0% { opacity: 0.3; box-shadow: 0 0 8px rgba(0, 97, 254, 0.2); }
    15% { opacity: 1; box-shadow: 0 0 15px rgba(0, 97, 254, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 0 10px rgba(0, 97, 254, 0.3); }
    40% { opacity: 1; box-shadow: 0 0 18px rgba(0, 97, 254, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 0 12px rgba(0, 97, 254, 0.5); }
    70% { opacity: 1; box-shadow: 0 0 14px rgba(0, 97, 254, 0.7); }
    100% { opacity: 1; box-shadow: 0 0 12px rgba(0, 97, 254, 0.5); }
  }
  @keyframes dropbox-neon-ignite-red {
    0% { opacity: 0.3; box-shadow: 0 0 8px rgba(239, 68, 68, 0.2); }
    15% { opacity: 1; box-shadow: 0 0 15px rgba(239, 68, 68, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 0 10px rgba(239, 68, 68, 0.3); }
    40% { opacity: 1; box-shadow: 0 0 18px rgba(239, 68, 68, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 0 12px rgba(239, 68, 68, 0.5); }
    70% { opacity: 1; box-shadow: 0 0 14px rgba(239, 68, 68, 0.7); }
    100% { opacity: 1; box-shadow: 0 0 12px rgba(239, 68, 68, 0.5); }
  }
  @keyframes dropbox-neon-ignite-pink {
    0% { opacity: 0.3; box-shadow: 0 0 8px rgba(236, 72, 153, 0.2); }
    15% { opacity: 1; box-shadow: 0 0 15px rgba(236, 72, 153, 0.8); }
    25% { opacity: 0.4; box-shadow: 0 0 10px rgba(236, 72, 153, 0.3); }
    40% { opacity: 1; box-shadow: 0 0 18px rgba(236, 72, 153, 0.9); }
    55% { opacity: 0.7; box-shadow: 0 0 12px rgba(236, 72, 153, 0.5); }
    70% { opacity: 1; box-shadow: 0 0 14px rgba(236, 72, 153, 0.7); }
    100% { opacity: 1; box-shadow: 0 0 12px rgba(236, 72, 153, 0.5); }
  }
  @keyframes dropbox-fade-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  .dropbox-ignite-blue { animation: dropbox-neon-ignite-blue 0.4s ease-out forwards; }
  .dropbox-ignite-red { animation: dropbox-neon-ignite-red 0.4s ease-out forwards; }
  .dropbox-ignite-pink { animation: dropbox-neon-ignite-pink 0.4s ease-out forwards; }
  .dropbox-fade-out { animation: dropbox-fade-out 0.15s ease-out forwards; }
`;

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
const DropboxBrowser = ({
    isVisible,
    onClose,
    onDisconnect,
    onImport,
    dropboxToken,
    getValidDropboxToken,
    refreshDropboxToken,
    clearDropboxTokens,
    sourceRect, // Position du bouton source pour l'animation morph
}) => {
    // États
    const [currentPath, setCurrentPath] = useState('');
    const [currentFolderDisplayName, setCurrentFolderDisplayName] = useState(''); // Nom avec casse originale
    const [folderNameHistory, setFolderNameHistory] = useState([]); // Historique des noms pour le retour
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scrollPercent, setScrollPercent] = useState(0);
    const [showScrollbar, setShowScrollbar] = useState(false);
    const [closingButton, setClosingButton] = useState(null); // 'close' | 'disconnect' | null
    const [isFadingOut, setIsFadingOut] = useState(false);

    // États pour les fades bidirectionnels
    const [listNeedsScroll, setListNeedsScroll] = useState(false);
    const [fadeTopOpacity, setFadeTopOpacity] = useState(0);     // Fade en haut
    const [fadeBottomOpacity, setFadeBottomOpacity] = useState(1); // Fade en bas

    // États pour l'animation morph
    const [morphProgress, setMorphProgress] = useState(0); // 0 = bouton, 1 = dialog
    const [backdropVisible, setBackdropVisible] = useState(false);
    const [dialogDimensions, setDialogDimensions] = useState(null);

    const listRef = useRef(null);
    const dialogRef = useRef(null);
    const animationRef = useRef(null);

    // Gérer le scroll pour la scrollbar rose et les fades bidirectionnels
    const handleScroll = () => {
        if (!listRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        const maxScroll = scrollHeight - clientHeight;

        if (maxScroll > 0) {
            setScrollPercent(scrollTop / maxScroll);
            setShowScrollbar(true);
            setListNeedsScroll(true);

            // Fade en haut : apparaît quand on scroll vers le bas
            const topOpacity = Math.min(1, scrollTop / CONFIG.FADE_DISTANCE);
            setFadeTopOpacity(topOpacity);

            // Fade en bas : disparaît quand on approche du bas
            const distanceFromBottom = maxScroll - scrollTop;
            const bottomOpacity = Math.min(1, distanceFromBottom / CONFIG.FADE_DISTANCE);
            setFadeBottomOpacity(bottomOpacity);
        } else {
            setShowScrollbar(false);
            setListNeedsScroll(false);
            setFadeTopOpacity(0);
            setFadeBottomOpacity(0);
        }
    };

    // Charger le contenu d'un dossier
    const loadFolder = async (path) => {
        setLoading(true);
        try {
            let token = await getValidDropboxToken();
            if (!token) token = dropboxToken;

            let allEntries = [];
            let hasMore = true;
            let cursor = null;

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
                const refreshed = await refreshDropboxToken();
                if (refreshed) {
                    setLoading(false);
                    return loadFolder(path);
                } else {
                    clearDropboxTokens();
                    alert('Session Dropbox expirée. Veuillez vous reconnecter.');
                    onClose();
                    return;
                }
            }

            let data = await firstResponse.json();

            if (data.entries) {
                allEntries = [...data.entries];
                hasMore = data.has_more;
                cursor = data.cursor;
            }

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
            const sorted = allEntries
                .filter(f => f['.tag'] === 'folder' || f.name.toLowerCase().endsWith('.mp3'))
                .sort((a, b) => {
                    if (a['.tag'] === 'folder' && b['.tag'] !== 'folder') return -1;
                    if (a['.tag'] !== 'folder' && b['.tag'] === 'folder') return 1;
                    return a.name.localeCompare(b.name);
                });

            setFiles(sorted);

        } catch (error) {
            console.error('Erreur Dropbox:', error);
            alert('Erreur de connexion à Dropbox');
        }
        setLoading(false);
    };

    // Scanner récursivement un dossier Dropbox
    const scanDropboxRecursive = async (basePath, rootName) => {
        const result = {};
        let token = await getValidDropboxToken();
        if (!token) token = dropboxToken;

        const scanFolder = async (path, folderName) => {
            try {
                let allEntries = [];
                let hasMore = true;
                let cursor = null;

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
                    throw new Error('Token expiré');
                }

                let data = await firstResponse.json();

                if (data.entries) {
                    allEntries = [...data.entries];
                    hasMore = data.has_more;
                    cursor = data.cursor;
                }

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

                // Séparer dossiers et fichiers MP3
                const subfolders = allEntries.filter(f => f['.tag'] === 'folder');
                const mp3Files = allEntries.filter(f =>
                    f['.tag'] === 'file' && f.name.toLowerCase().endsWith('.mp3')
                );

                // Ajouter les MP3 de ce dossier
                if (mp3Files.length > 0) {
                    result[folderName] = mp3Files.map(f => ({
                        name: f.name,
                        size: f.size,
                        path_lower: f.path_lower,
                    }));
                }

                // Scanner récursivement les sous-dossiers
                for (const subfolder of subfolders) {
                    await scanFolder(subfolder.path_lower, subfolder.name);
                }

            } catch (error) {
                console.error('Erreur scan:', error);
            }
        };

        await scanFolder(basePath, rootName);
        return result;
    };

    // Handler pour l'import
    const handleImport = async () => {
        if (!currentPath) {
            alert('Sélectionne un dossier à importer');
            return;
        }

        setScanning(true);

        try {
            const folderName = currentFolderDisplayName || currentPath.split('/').pop() || 'Dropbox Import';
            const scannedFolders = await scanDropboxRecursive(currentPath, folderName);

            if (Object.keys(scannedFolders).length === 0) {
                alert('Aucun fichier MP3 trouvé dans ce dossier ou ses sous-dossiers.');
                setScanning(false);
                return;
            }

            // Passer les données à SmartImport via onImport
            onImport(scannedFolders, folderName);

        } catch (error) {
            console.error('Erreur import:', error);
            alert('Erreur lors du scan du dossier');
        }

        setScanning(false);
    };

    // Handler fermeture avec animation
    const handleClose = () => {
        setClosingButton('close');
        setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
                onClose();
            }, 150);
        }, CONFIG.BUTTON_ANIM_DURATION);
    };

    // Handler déconnexion avec animation
    const handleDisconnect = () => {
        setClosingButton('disconnect');
        setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
                onDisconnect();
                onClose();
            }, 150);
        }, CONFIG.BUTTON_ANIM_DURATION);
    };

    // Naviguer vers un dossier
    const navigateToFolder = (path, displayName) => {
        // Sauvegarder le nom actuel dans l'historique avant de naviguer
        if (currentFolderDisplayName) {
            setFolderNameHistory(prev => [...prev, currentFolderDisplayName]);
        }
        setCurrentPath(path);
        setCurrentFolderDisplayName(displayName);
        loadFolder(path);
    };

    // Retour au dossier parent
    const navigateBack = () => {
        if (!currentPath) return;
        const parentPath = currentPath.split('/').slice(0, -1).join('/');
        // Récupérer le nom du dossier parent depuis l'historique
        const previousName = folderNameHistory[folderNameHistory.length - 1] || '';
        setFolderNameHistory(prev => prev.slice(0, -1));
        setCurrentPath(parentPath);
        setCurrentFolderDisplayName(previousName);
        loadFolder(parentPath);
    };

    // Charger la racine au montage et lancer l'animation morph
    useEffect(() => {
        if (isVisible) {
            loadFolder('');
            setCurrentPath('');
            setCurrentFolderDisplayName('');
            setFolderNameHistory([]);
            setClosingButton(null);
            setIsFadingOut(false);
            setScanning(false);

            // Calculer les dimensions finales du dialog
            const dialogMaxWidth = parseFloat(CONFIG.DIALOG_MAX_WIDTH);
            const dialogMaxHeight = parseFloat(CONFIG.DIALOG_MAX_HEIGHT);
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Calculer la taille réelle du dialog (prend en compte vw/vh et max)
            const dialogWidth = Math.min(viewportWidth * 0.92, dialogMaxWidth);
            const dialogHeight = Math.min(viewportHeight * 0.8, dialogMaxHeight);

            // Position centrée
            const finalLeft = (viewportWidth - dialogWidth) / 2;
            const finalTop = (viewportHeight - dialogHeight) / 2;

            setDialogDimensions({
                finalLeft,
                finalTop,
                finalWidth: dialogWidth,
                finalHeight: dialogHeight
            });

            // Lancer l'animation morph si on a un sourceRect
            if (sourceRect) {
                setMorphProgress(0);
                setBackdropVisible(true);

                requestAnimationFrame(() => {
                    const startTime = performance.now();
                    const animate = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / CONFIG.MORPH_DURATION, 1);
                        // Easing cubic ease-in-out
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
            } else {
                // Pas de sourceRect, affichage direct
                setMorphProgress(1);
                setBackdropVisible(true);
            }
        } else {
            // Reset quand on ferme
            setMorphProgress(0);
            setBackdropVisible(false);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        }
    }, [isVisible]);

    // Détecter automatiquement si le contenu déborde (pour afficher le point rose et les fades)
    useEffect(() => {
        if (!listRef.current || loading) return;

        // Petit délai pour laisser le DOM se mettre à jour
        const timer = setTimeout(() => {
            if (listRef.current) {
                const { scrollHeight, clientHeight, scrollTop } = listRef.current;
                const maxScroll = scrollHeight - clientHeight;

                if (maxScroll > 0) {
                    setShowScrollbar(true);
                    setListNeedsScroll(true);
                    // Initialiser les fades : au départ on est en haut, donc fade top = 0, fade bottom = 1
                    setFadeTopOpacity(Math.min(1, scrollTop / CONFIG.FADE_DISTANCE));
                    setFadeBottomOpacity(Math.min(1, (maxScroll - scrollTop) / CONFIG.FADE_DISTANCE));
                } else {
                    setShowScrollbar(false);
                    setListNeedsScroll(false);
                    setFadeTopOpacity(0);
                    setFadeBottomOpacity(0);
                }
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [files, loading]);

    if (!isVisible) return null;

    const isAtRoot = !currentPath;
    const canImport = !isAtRoot && !loading && !scanning;
    const currentFolderName = currentFolderDisplayName || 'Dropbox';

    // Compter les éléments
    const folderCount = files.filter(f => f['.tag'] === 'folder').length;
    const mp3Count = files.filter(f => f['.tag'] === 'file').length;

    // Calculer les dimensions interpolées pour le morph
    const getMorphStyles = () => {
        if (!sourceRect || !dialogDimensions) {
            // Pas d'animation morph, retourner les styles normaux
            return {
                position: 'relative',
                width: CONFIG.DIALOG_WIDTH,
                maxWidth: CONFIG.DIALOG_MAX_WIDTH,
                height: CONFIG.DIALOG_HEIGHT,
                maxHeight: CONFIG.DIALOG_MAX_HEIGHT,
                borderRadius: '1rem',
            };
        }

        const p = morphProgress;

        // Position et taille de départ (bouton)
        const startLeft = sourceRect.left;
        const startTop = sourceRect.top;
        const startWidth = sourceRect.width;
        const startHeight = sourceRect.height;

        // Position et taille finale (dialog centré)
        const { finalLeft, finalTop, finalWidth, finalHeight } = dialogDimensions;

        // Interpolation
        const currentLeft = startLeft + (finalLeft - startLeft) * p;
        const currentTop = startTop + (finalTop - startTop) * p;
        const currentWidth = startWidth + (finalWidth - startWidth) * p;
        const currentHeight = startHeight + (finalHeight - startHeight) * p;

        // BorderRadius: de capsule (height/2) vers dialog radius (16px)
        const startRadius = startHeight / 2;
        const finalRadius = 16;
        const currentRadius = startRadius + (finalRadius - startRadius) * p;

        return {
            position: 'fixed',
            left: currentLeft,
            top: currentTop,
            width: currentWidth,
            height: currentHeight,
            borderRadius: currentRadius,
        };
    };

    const morphStyles = getMorphStyles();

    return (
        <>
            <style>{dropboxStyles}</style>
            <div
                className={`fixed inset-0 z-[9999] ${isFadingOut ? 'dropbox-fade-out' : ''} ${!sourceRect ? 'flex items-center justify-center' : ''}`}
                style={{
                    backgroundColor: backdropVisible ? 'rgba(0, 0, 0, 0.85)' : 'transparent',
                    backdropFilter: backdropVisible ? 'blur(8px)' : 'none',
                    transition: `background-color ${CONFIG.MORPH_DURATION}ms, backdrop-filter ${CONFIG.MORPH_DURATION}ms`,
                }}
                onClick={(e) => { if (e.target === e.currentTarget && !closingButton && morphProgress === 1) handleClose(); }}
            >
                {/* Dialog principal avec animation morph */}
                <div
                    ref={dialogRef}
                    className="flex flex-col overflow-hidden"
                    style={{
                        ...morphStyles,
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                        paddingLeft: 0,
                        paddingRight: 0,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                        // Cacher le contenu pendant l'animation initiale
                        opacity: morphProgress > 0.3 ? 1 : morphProgress / 0.3,
                    }}
                >
                    {/* Header - capsule pleine largeur avec padding horizontal */}
                    <div
                        className="mb-2"
                        style={{
                            flexShrink: 0,
                            paddingLeft: CONFIG.HORIZONTAL_PADDING,
                            paddingRight: CONFIG.HORIZONTAL_PADDING
                        }}
                    >
                        <div
                            className="flex items-center rounded-full px-3 border border-gray-200 w-full"
                            style={{
                                background: 'white',
                                height: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                                minHeight: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                            }}
                        >
                            {/* Bouton retour ou logo Dropbox */}
                            {isAtRoot ? (
                                <DropboxLogoVector size={18} color={CONFIG.DROPBOX_BLUE} />
                            ) : (
                                <button
                                    onClick={navigateBack}
                                    className="flex items-center justify-center -ml-1 mr-1"
                                    style={{ color: CONFIG.DROPBOX_BLUE }}
                                >
                                    <ChevronLeft size={18} strokeWidth={2.5} />
                                </button>
                            )}

                            {/* Nom du dossier + icône Folder au lieu de "dossiers" */}
                            <div className="flex items-center gap-2 ml-2">
                                <span
                                    className="font-bold text-gray-700 truncate"
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    {currentFolderName}
                                </span>
                                {folderCount > 0 && (
                                    <span className="flex items-center gap-0.5 text-gray-400">
                                        <span className="text-xs">{folderCount}</span>
                                        <Folder size={12} />
                                    </span>
                                )}
                                {mp3Count > 0 && (
                                    <span className="flex items-center gap-0.5 text-gray-400">
                                        <span className="text-xs">{mp3Count}</span>
                                        <Music size={12} />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Liste des fichiers avec zone scrubbing à droite - pas de gap entre liste et scrub zone */}
                    <div className="flex-1 flex mb-2" style={{ paddingLeft: 0, paddingRight: 0 }}>
                        {/* Zone liste - padding gauche inclus, pas de padding droit */}
                        <div className="flex-1 relative">
                            <div
                                ref={listRef}
                                className="absolute inset-0 overflow-y-auto overflow-x-hidden"
                                style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                    paddingLeft: '0.75rem',
                                    paddingRight: 0,
                                }}
                                onScroll={handleScroll}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 size={24} className="animate-spin" style={{ color: CONFIG.DROPBOX_BLUE }} />
                                    </div>
                                ) : files.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        Dossier vide
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {files.map((file, index) => {
                                            const isFolder = file['.tag'] === 'folder';

                                            if (isFolder) {
                                                // Dossiers = cartes blanches (représentent des vibes)
                                                return (
                                                    <div
                                                        key={file.path_lower || index}
                                                        onClick={() => navigateToFolder(file.path_lower, file.name)}
                                                        className="flex items-center pl-3 pr-2 cursor-pointer"
                                                        style={{
                                                            height: CONFIG.CARD_HEIGHT,
                                                            background: 'white',
                                                            borderRadius: CONFIG.CARD_RADIUS,
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                            marginBottom: CONFIG.CARD_GAP,
                                                        }}
                                                    >
                                                        {/* Pas d'icône folder à gauche - on sait que ce sont des dossiers */}
                                                        <span
                                                            className="flex-1 truncate font-bold text-gray-900"
                                                            style={{ fontSize: CONFIG.ROW_TITLE_SIZE }}
                                                        >
                                                            {file.name}
                                                        </span>
                                                    </div>
                                                );
                                            } else {
                                                // Fichiers audio - style VibeBuilder (titre + artiste sur deux lignes)
                                                const fileName = file.name.replace(/\.mp3$/i, '');
                                                // Essayer d'extraire artiste - titre si format "Artiste - Titre"
                                                const parts = fileName.split(' - ');
                                                const title = parts.length > 1 ? parts.slice(1).join(' - ') : fileName;
                                                const artist = parts.length > 1 ? parts[0] : '';

                                                return (
                                                    <div
                                                        key={file.path_lower || index}
                                                        className="flex items-center pl-3 border-b border-gray-100"
                                                        style={{
                                                            height: CONFIG.FILE_HEIGHT,
                                                        }}
                                                    >
                                                        <div className="flex-1 flex flex-col justify-center overflow-hidden">
                                                            <span
                                                                className="font-bold truncate text-gray-900"
                                                                style={{ fontSize: CONFIG.ROW_TITLE_SIZE, lineHeight: 1.2 }}
                                                            >
                                                                {title}
                                                            </span>
                                                            {artist && (
                                                                <span
                                                                    className="truncate font-medium text-gray-500"
                                                                    style={{ fontSize: CONFIG.ROW_SUBTITLE_SIZE, lineHeight: 1.2 }}
                                                                >
                                                                    {artist}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Fade indicator en HAUT - visible quand on a scrollé vers le bas */}
                            {listNeedsScroll && fadeTopOpacity > 0 && (
                                <div
                                    className="absolute left-0 right-0 top-0 pointer-events-none"
                                    style={{
                                        height: CONFIG.FADE_HEIGHT,
                                        background: `linear-gradient(to bottom, rgba(255,255,255,${CONFIG.FADE_OPACITY}) 0%, rgba(255,255,255,0) 100%)`,
                                        opacity: fadeTopOpacity
                                    }}
                                />
                            )}

                            {/* Fade indicator en BAS - visible quand il y a du contenu en dessous */}
                            {listNeedsScroll && fadeBottomOpacity > 0 && (
                                <div
                                    className="absolute left-0 right-0 bottom-0 pointer-events-none"
                                    style={{
                                        height: CONFIG.FADE_HEIGHT,
                                        background: `linear-gradient(to top, rgba(255,255,255,${CONFIG.FADE_OPACITY}) 0%, rgba(255,255,255,0) 100%)`,
                                        opacity: fadeBottomOpacity
                                    }}
                                />
                            )}
                        </div>

                        {/* Zone scrubbing à droite - touche le bord droit de la fenêtre */}
                        <div
                            className="relative"
                            style={{ width: CONFIG.SCRUB_ZONE_WIDTH, flexShrink: 0 }}
                        >
                            {showScrollbar && files.length > 0 && (
                                <div
                                    className="absolute"
                                    style={{
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: CONFIG.SCROLLBAR_WIDTH,
                                        height: CONFIG.SCROLLBAR_WIDTH,
                                        top: `${scrollPercent * 100}%`,
                                        background: CONFIG.SCROLLBAR_COLOR,
                                        borderRadius: '50%',
                                        boxShadow: CONFIG.SCROLLBAR_GLOW,
                                        transition: 'top 0.05s ease-out',
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* 3 boutons en bas - avec padding horizontal identique au header */}
                    <div
                        className="flex items-center"
                        style={{
                            gap: '0.5rem',
                            flexShrink: 0,
                            paddingLeft: CONFIG.HORIZONTAL_PADDING,
                            paddingRight: CONFIG.HORIZONTAL_PADDING
                        }}
                    >
                        {/* Bouton FERMER */}
                        <button
                            onClick={handleClose}
                            disabled={!!closingButton || scanning}
                            className="flex-1 flex items-center justify-center rounded-full relative"
                            style={{
                                height: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                                background: closingButton === 'close' ? 'transparent' : 'white',
                                border: '1px solid rgba(0,0,0,0.1)',
                            }}
                        >
                            {closingButton === 'close' && (
                                <div
                                    className="absolute rounded-full dropbox-ignite-pink"
                                    style={{
                                        inset: 0,
                                        background: '#ec4899',
                                    }}
                                />
                            )}
                            <X size={18} className="relative z-10" style={{ color: closingButton === 'close' ? 'white' : '#9ca3af' }} />
                        </button>

                        {/* Bouton DÉCONNECTER */}
                        <button
                            onClick={handleDisconnect}
                            disabled={!!closingButton || scanning}
                            className="flex-1 flex items-center justify-center rounded-full relative"
                            style={{
                                height: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                                background: closingButton === 'disconnect' ? 'transparent' : 'white',
                                border: '1px solid rgba(0,0,0,0.1)',
                            }}
                        >
                            {closingButton === 'disconnect' && (
                                <div
                                    className="absolute rounded-full dropbox-ignite-red"
                                    style={{
                                        inset: 0,
                                        background: '#ef4444',
                                    }}
                                />
                            )}
                            <LogOut size={18} className="relative z-10" style={{ color: closingButton === 'disconnect' ? 'white' : '#ef4444' }} />
                        </button>

                        {/* Bouton IMPORTER */}
                        <button
                            onClick={handleImport}
                            disabled={!canImport || !!closingButton}
                            className="flex-1 flex items-center justify-center rounded-full relative"
                            style={{
                                height: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                                background: scanning ? 'transparent' : (canImport ? CONFIG.DROPBOX_BLUE : 'white'),
                                border: canImport ? 'none' : '1px solid rgba(0,0,0,0.1)',
                                opacity: canImport ? 1 : 0.4,
                                boxShadow: canImport && !scanning ? '0 0 15px rgba(0, 97, 254, 0.4)' : 'none',
                            }}
                        >
                            {scanning && (
                                <div
                                    className="absolute rounded-full dropbox-ignite-blue"
                                    style={{
                                        inset: 0,
                                        background: CONFIG.DROPBOX_BLUE,
                                    }}
                                />
                            )}
                            {scanning ? (
                                <Loader2 size={18} className="animate-spin text-white relative z-10" />
                            ) : (
                                <FolderDown size={18} className="relative z-10" style={{ color: canImport ? 'white' : '#9CA3AF' }} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DropboxBrowser;
