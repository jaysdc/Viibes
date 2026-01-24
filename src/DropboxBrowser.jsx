import React, { useState, useRef, useEffect } from 'react';
import { X, Folder, Music, ChevronLeft, FolderDown, LogOut, Loader2 } from 'lucide-react';
import { DropboxLogoVector } from './Assets.jsx';
import { UNIFIED_CONFIG, CylinderMask, SphereMask } from './Config.jsx';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    DROPBOX BROWSER - PARAMÈTRES                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

const CONFIG = {
    // Couleurs
    DROPBOX_BLUE: '#0061FE',
    DIALOG_BG_COLOR: '#FAFAFA',     // Fond du dialog (comme SmartImport)

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

    // Dialog - dimensions depuis UNIFIED_CONFIG (en %)
    // Note: les valeurs vw/vh sont calculées depuis UNIFIED_CONFIG.IMPORT_SCREEN_WIDTH/HEIGHT

    // Scrollbar rose (comme neon beacon)
    SCROLLBAR_WIDTH: 6,
    SCROLLBAR_COLOR: 'rgba(236, 72, 153, 0.8)',
    SCROLLBAR_GLOW: '0 0 8px rgba(236, 72, 153, 0.6)',

    // Zone de scrubbing à droite (comme VibeBuilder sidebar)
    SCRUB_ZONE_WIDTH: '3.75rem',

    // Padding horizontal unifié (header + boutons)
    HORIZONTAL_PADDING: '0.75rem',

    // Scroll fade indicators - plus prononcé que SmartImport
    FADE_HEIGHT: '6.65rem',              // +33% de 5rem
    FADE_OPACITY: 0.95,
    FADE_DISTANCE: 67,                   // +33% de 50px - Distance en px où le fade commence à disparaître

    // Animation
    BUTTON_ANIM_DURATION: 400,
    MORPH_DURATION: 400,

    // Transition entre phases (browse/import)
    PHASE_TRANSITION_DURATION: 300,

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
  /* Fuchsia Overdose gradient (#ec4899 → #ff07a3) */
  @keyframes dropbox-neon-ignite-pink {
    0% { opacity: 0.3; box-shadow: 0 0 8px rgba(236, 72, 153, 0.2), 0 0 16px rgba(255, 7, 163, 0.1); }
    15% { opacity: 1; box-shadow: 0 0 15px rgba(236, 72, 153, 0.8), 0 0 30px rgba(255, 7, 163, 0.6); }
    25% { opacity: 0.4; box-shadow: 0 0 10px rgba(236, 72, 153, 0.3), 0 0 20px rgba(255, 7, 163, 0.2); }
    40% { opacity: 1; box-shadow: 0 0 18px rgba(236, 72, 153, 0.9), 0 0 36px rgba(255, 7, 163, 0.7); }
    55% { opacity: 0.7; box-shadow: 0 0 12px rgba(236, 72, 153, 0.5), 0 0 24px rgba(255, 7, 163, 0.4); }
    70% { opacity: 1; box-shadow: 0 0 14px rgba(236, 72, 153, 0.7), 0 0 28px rgba(255, 7, 163, 0.5); }
    100% { opacity: 1; box-shadow: 0 0 12px rgba(236, 72, 153, 0.5), 0 0 24px rgba(255, 7, 163, 0.4); }
  }
  @keyframes dropbox-fade-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes dropbox-beacon-pulse {
    0%, 100% {
      transform: translateX(-50%) scale(1);
      box-shadow: 0 0 8px rgba(236, 72, 153, 0.6);
    }
    50% {
      transform: translateX(-50%) scale(1.3);
      box-shadow: 0 0 12px rgba(236, 72, 153, 0.8);
    }
  }
  .dropbox-ignite-blue { animation: dropbox-neon-ignite-blue 0.4s ease-out forwards; }
  .dropbox-ignite-red { animation: dropbox-neon-ignite-red 0.4s ease-out forwards; }
  .dropbox-ignite-pink { animation: dropbox-neon-ignite-pink 0.4s ease-out forwards; }
  .dropbox-ignite-orange { animation: dropbox-neon-ignite-orange 0.4s ease-out forwards; }
  .dropbox-fade-out { animation: dropbox-fade-out 0.15s ease-out forwards; }
  .dropbox-beacon-pulse { animation: dropbox-beacon-pulse 1.5s ease-in-out infinite; }

  @keyframes dropbox-neon-ignite-orange {
    0% { opacity: 0.3; box-shadow: 0 0 8px rgba(249, 115, 22, 0.2), 0 0 8px rgba(220, 38, 38, 0.2); }
    15% { opacity: 1; box-shadow: 0 0 15px rgba(249, 115, 22, 0.8), 0 0 15px rgba(220, 38, 38, 0.6); }
    25% { opacity: 0.4; box-shadow: 0 0 10px rgba(249, 115, 22, 0.3), 0 0 10px rgba(220, 38, 38, 0.3); }
    40% { opacity: 1; box-shadow: 0 0 18px rgba(249, 115, 22, 0.9), 0 0 18px rgba(220, 38, 38, 0.7); }
    55% { opacity: 0.7; box-shadow: 0 0 12px rgba(249, 115, 22, 0.5), 0 0 12px rgba(220, 38, 38, 0.5); }
    70% { opacity: 1; box-shadow: 0 0 14px rgba(249, 115, 22, 0.7), 0 0 14px rgba(220, 38, 38, 0.6); }
    100% { opacity: 1; box-shadow: 0 0 12px rgba(249, 115, 22, 0.5), 0 0 12px rgba(220, 38, 38, 0.5); }
  }

  @keyframes dropbox-header-marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
`;

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
const DropboxBrowser = ({
    isVisible,
    onClose,
    onDisconnect,
    onScanComplete,    // Callback quand le scan est terminé - passe les données à SmartImport
    onMenuClose,       // Callback pour ranger la barre d'import
    dropboxToken,
    getValidDropboxToken,
    refreshDropboxToken,
    clearDropboxTokens,
    // Props pour calculer la position du bouton Dropbox (vient de App.jsx CONFIG)
    headerLogoSize,
    headerPaddingX,
    headerButtonsGap,
    is3DMode,
}) => {
    // Calculer la position du bouton Dropbox (constante basée sur la config)
    const computeDropboxButtonRect = () => {
        const cssToPixels = (value) => {
            if (typeof value === 'string') {
                const div = document.createElement('div');
                div.style.position = 'fixed';
                div.style.visibility = 'hidden';
                div.style.height = value;
                document.body.appendChild(div);
                const px = div.getBoundingClientRect().height;
                document.body.removeChild(div);
                return px;
            }
            return value * 16;
        };

        const safeAreaTop = cssToPixels('env(safe-area-inset-top, 0px)');
        const screenWidth = window.innerWidth;
        const titleMarginTop = cssToPixels(UNIFIED_CONFIG.TITLE_MARGIN_TOP);
        const logoHeight = headerLogoSize * 3 * 0.4;
        const titleMarginBottom = cssToPixels(UNIFIED_CONFIG.TITLE_MARGIN_BOTTOM);
        const top = safeAreaTop + titleMarginTop + logoHeight + titleMarginBottom;

        const paddingX = cssToPixels(headerPaddingX + 'rem');
        const gap = cssToPixels(headerButtonsGap);
        const availableWidth = screenWidth - (2 * paddingX);
        const buttonWidth = (availableWidth - (2 * gap)) / 3;
        const left = paddingX + buttonWidth + gap;
        const height = cssToPixels(UNIFIED_CONFIG.CAPSULE_HEIGHT);

        return { left, top, width: buttonWidth, height };
    };

    const dropboxButtonRect = computeDropboxButtonRect();

    // États
    const [currentPath, setCurrentPath] = useState('');
    const [currentFolderDisplayName, setCurrentFolderDisplayName] = useState(''); // Nom avec casse originale
    const [folderNameHistory, setFolderNameHistory] = useState([]); // Historique des noms pour le retour
    const [scrollPositionHistory, setScrollPositionHistory] = useState([]); // Historique des positions de scroll
    const [pendingScrollRestore, setPendingScrollRestore] = useState(null); // Position à restaurer après chargement
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scanPhase, setScanPhase] = useState(null); // 'counting' | 'processing' | null
    const [totalFilesToProcess, setTotalFilesToProcess] = useState(0);
    const [processedFiles, setProcessedFiles] = useState(0);
    const [smoothedProcessedFiles, setSmoothedProcessedFiles] = useState(0); // Progression lissée pour l'UI
    const [scrollPercent, setScrollPercent] = useState(0);
    const [showScrollbar, setShowScrollbar] = useState(false);
    const [closingButton, setClosingButton] = useState(null); // 'close' | 'disconnect' | null
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [isScrubbing, setIsScrubbing] = useState(false);

    // États pour les fades bidirectionnels
    const [listNeedsScroll, setListNeedsScroll] = useState(false);
    const [fadeTopOpacity, setFadeTopOpacity] = useState(0);     // Fade en haut
    const [fadeBottomOpacity, setFadeBottomOpacity] = useState(1); // Fade en bas

    // États pour l'animation morph
    const [morphProgress, setMorphProgress] = useState(0); // 0 = bouton, 1 = dialog
    const [backdropVisible, setBackdropVisible] = useState(false);
    const [dialogDimensions, setDialogDimensions] = useState(null);

    const listRef = useRef(null);
    const abortControllerRef = useRef(null); // Pour annuler les requêtes en cours
    const loadingPathRef = useRef(null); // Pour tracker quel path est en cours de chargement
    const dialogRef = useRef(null);
    const animationRef = useRef(null);
    const scrubZoneRef = useRef(null);

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

    // Handlers pour le scrubbing
    const handleScrubStart = (e) => {
        if (!listRef.current || !showScrollbar) return;
        setIsScrubbing(true);
        handleScrubMove(e);
    };

    const handleScrubMove = (e) => {
        if (!listRef.current || !scrubZoneRef.current) return;
        if (!isScrubbing && e.type !== 'touchstart') return;

        const touch = e.touches?.[0] || e;
        const rect = scrubZoneRef.current.getBoundingClientRect();
        const y = touch.clientY - rect.top;
        const percent = Math.max(0, Math.min(1, y / rect.height));

        const { scrollHeight, clientHeight } = listRef.current;
        const maxScroll = scrollHeight - clientHeight;
        listRef.current.scrollTop = percent * maxScroll;
    };

    const handleScrubEnd = () => {
        setIsScrubbing(false);
    };

    // Charger le contenu d'un dossier
    const loadFolder = async (path) => {
        // Annuler toute requête précédente en cours
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Créer un nouveau AbortController pour cette requête
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        loadingPathRef.current = path;

        setLoading(true);
        setFiles([]); // Vider les fichiers immédiatement pour éviter d'afficher l'ancien contenu

        try {
            let token = await getValidDropboxToken();
            if (!token) token = dropboxToken;

            // Vérifier si cette requête a été annulée
            if (abortController.signal.aborted) {
                console.log('[DropboxBrowser] Request aborted for path:', path);
                return;
            }

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
                signal: abortController.signal,
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

            // Vérifier si cette requête a été annulée ou si le path a changé
            if (abortController.signal.aborted || loadingPathRef.current !== path) {
                console.log('[DropboxBrowser] Request superseded for path:', path);
                return;
            }

            if (data.entries) {
                allEntries = [...data.entries];
                hasMore = data.has_more;
                cursor = data.cursor;
            }

            while (hasMore && cursor) {
                // Vérifier avant chaque requête de pagination
                if (abortController.signal.aborted || loadingPathRef.current !== path) {
                    console.log('[DropboxBrowser] Pagination aborted for path:', path);
                    return;
                }

                const continueResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder/continue', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ cursor }),
                    signal: abortController.signal,
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

            // Vérification finale avant de mettre à jour l'état
            if (abortController.signal.aborted || loadingPathRef.current !== path) {
                console.log('[DropboxBrowser] Final check failed for path:', path);
                return;
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
            setLoading(false);

        } catch (error) {
            // Ignorer les erreurs d'abort (c'est normal)
            if (error.name === 'AbortError') {
                console.log('[DropboxBrowser] Fetch aborted for path:', path);
                return;
            }
            console.error('Erreur Dropbox:', error);
            // Ne pas afficher d'alerte si la requête a été annulée
            if (!abortController.signal.aborted) {
                alert('Erreur de connexion à Dropbox');
            }
            setLoading(false);
        }
    };

    // Helper: liste un dossier Dropbox (avec pagination)
    const listDropboxFolder = async (path, token) => {
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

        return allEntries;
    };

    // Phase 1: Compter les fichiers MP3 récursivement
    const countFilesRecursive = async (basePath) => {
        let count = 0;
        let token = await getValidDropboxToken();
        if (!token) token = dropboxToken;

        const countFolder = async (path) => {
            try {
                const allEntries = await listDropboxFolder(path, token);
                const subfolders = allEntries.filter(f => f['.tag'] === 'folder');
                const mp3Files = allEntries.filter(f =>
                    f['.tag'] === 'file' && f.name.toLowerCase().endsWith('.mp3')
                );

                count += mp3Files.length;

                for (const subfolder of subfolders) {
                    await countFolder(subfolder.path_lower);
                }
            } catch (error) {
                console.error('Erreur comptage:', error);
            }
        };

        await countFolder(basePath);
        return count;
    };

    // Phase 2: Scanner récursivement avec callback de progression
    const scanDropboxRecursive = async (basePath, rootName, onFileProcessed) => {
        const result = {};
        let token = await getValidDropboxToken();
        if (!token) token = dropboxToken;

        const scanFolder = async (path, folderName) => {
            try {
                const allEntries = await listDropboxFolder(path, token);
                const subfolders = allEntries.filter(f => f['.tag'] === 'folder');
                const mp3Files = allEntries.filter(f =>
                    f['.tag'] === 'file' && f.name.toLowerCase().endsWith('.mp3')
                );

                // Ajouter les MP3 de ce dossier avec progression
                if (mp3Files.length > 0) {
                    result[folderName] = mp3Files.map(f => {
                        if (onFileProcessed) onFileProcessed();
                        return {
                            name: f.name,
                            size: f.size,
                            path_lower: f.path_lower,
                        };
                    });
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

    // Handler pour l'import - scanne et passe les données à SmartImport via onScanComplete
    const handleImport = async () => {
        if (!currentPath) {
            alert('Sélectionne un dossier à importer');
            return;
        }

        setScanning(true);

        try {
            const folderName = currentFolderDisplayName || currentPath.split('/').pop() || 'Dropbox Import';

            // Phase 1: Compter les fichiers (loader circulaire, fond blanc)
            setScanPhase('counting');
            setProcessedFiles(0);
            setTotalFilesToProcess(0);

            const totalFiles = await countFilesRecursive(currentPath);

            if (totalFiles === 0) {
                alert('Aucun fichier MP3 trouvé dans ce dossier ou ses sous-dossiers.');
                setScanning(false);
                setScanPhase(null);
                return;
            }

            // Phase 2: Scanner avec progression (barre de progression)
            setScanPhase('processing');
            setTotalFilesToProcess(totalFiles);
            setProcessedFiles(0);

            let processed = 0;
            const scannedFolders = await scanDropboxRecursive(currentPath, folderName, () => {
                processed++;
                setProcessedFiles(processed);
            });

            // Laisser la barre de progression finir son animation vers 100%
            // avant de fermer le dialog
            setTimeout(() => {
                setScanning(false);
                setScanPhase(null);
                setProcessedFiles(0);
                setTotalFilesToProcess(0);

                // Fermer le browser avec animation
                setIsFadingOut(true);
                setTimeout(() => {
                    onClose();
                    // Passer les données scannées à SmartImport via le callback
                    if (onScanComplete) {
                        onScanComplete({
                            folders: scannedFolders,
                            rootName: folderName
                        });
                    }
                }, 150);
            }, 400); // Délai pour que l'animation atteigne 100%

        } catch (error) {
            console.error('Erreur import:', error);
            alert('Erreur lors du scan du dossier');
            setScanning(false);
            setScanPhase(null);
            setProcessedFiles(0);
            setTotalFilesToProcess(0);
        }
    };

    // Handler fermeture avec animation
    const handleClose = () => {
        setClosingButton('close');
        setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
                onClose();
                if (onMenuClose) onMenuClose(); // Ranger la barre d'import APRÈS fermeture
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
                if (onMenuClose) onMenuClose(); // Ranger la barre d'import APRÈS fermeture
            }, 150);
        }, CONFIG.BUTTON_ANIM_DURATION);
    };

    // Naviguer vers un dossier
    const navigateToFolder = (path, displayName) => {
        // Sauvegarder le nom et la position de scroll actuels dans l'historique
        if (currentFolderDisplayName) {
            setFolderNameHistory(prev => [...prev, currentFolderDisplayName]);
        }
        const currentScrollPos = listRef.current?.scrollTop || 0;
        setScrollPositionHistory(prev => [...prev, currentScrollPos]);
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
        const previousScrollPos = scrollPositionHistory[scrollPositionHistory.length - 1] || 0;
        setFolderNameHistory(prev => prev.slice(0, -1));
        setScrollPositionHistory(prev => prev.slice(0, -1));
        setPendingScrollRestore(previousScrollPos);
        setCurrentPath(parentPath);
        setCurrentFolderDisplayName(previousName);
        loadFolder(parentPath);
    };

    // Charger la racine au montage et lancer l'animation morph
    useEffect(() => {
        if (isVisible) {
            // IMPORTANT: Annuler toute animation précédente AVANT de commencer
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }

            // Reset tous les états immédiatement
            setIsFadingOut(false);
            setClosingButton(null);
            setScanning(false);
            setScanPhase(null);
            setProcessedFiles(0);
            setTotalFilesToProcess(0);
            setCurrentPath('');
            setCurrentFolderDisplayName('');
            setFolderNameHistory([]);
            setScrollPositionHistory([]);
            setPendingScrollRestore(null);
            loadFolder('');

            // Calculer les dimensions finales du dialog (en % de l'écran)
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Calculer la taille réelle du dialog depuis UNIFIED_CONFIG
            const dialogWidth = viewportWidth * (UNIFIED_CONFIG.IMPORT_SCREEN_WIDTH / 100);
            const dialogHeight = viewportHeight * (UNIFIED_CONFIG.IMPORT_SCREEN_HEIGHT / 100);

            // Position centrée
            const finalLeft = (viewportWidth - dialogWidth) / 2;
            const finalTop = (viewportHeight - dialogHeight) / 2;

            setDialogDimensions({
                finalLeft,
                finalTop,
                finalWidth: dialogWidth,
                finalHeight: dialogHeight
            });

            // Afficher immédiatement le backdrop et le dialog à position initiale
            setBackdropVisible(true);
            setMorphProgress(0);

            // Lancer l'animation après un micro-délai pour que le DOM soit prêt
            requestAnimationFrame(() => {
                setMorphProgress(1);
            });
        } else {
            // Reset quand on ferme
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            setMorphProgress(0);
            setBackdropVisible(false);
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

    // Restaurer la position de scroll après chargement
    useEffect(() => {
        if (!loading && pendingScrollRestore !== null && listRef.current) {
            const timer = setTimeout(() => {
                if (listRef.current) {
                    listRef.current.scrollTop = pendingScrollRestore;
                }
                setPendingScrollRestore(null);
            }, 60);
            return () => clearTimeout(timer);
        }
    }, [loading, pendingScrollRestore]);

    // Interpolation fluide de la progression de l'import
    useEffect(() => {
        if (scanPhase !== 'processing' || totalFilesToProcess === 0) {
            setSmoothedProcessedFiles(0);
            return;
        }

        const targetProgress = (processedFiles / totalFilesToProcess) * 100;

        const interval = setInterval(() => {
            setSmoothedProcessedFiles(current => {
                const diff = targetProgress - current;
                // Si très proche, snap à la cible
                if (Math.abs(diff) < 0.1) return targetProgress;
                // Easing: avancer de 8% de la distance restante (ralentit vers la fin)
                const next = current + diff * 0.08;
                return next;
            });
        }, 16); // ~60fps

        return () => clearInterval(interval);
    }, [processedFiles, totalFilesToProcess, scanPhase]);

    // NOTE: Le return null est maintenant juste avant le JSX, plus bas

    const isAtRoot = !currentPath;
    const canImport = !isAtRoot && !loading && !scanning;
    const currentFolderName = currentFolderDisplayName || 'Dropbox';

    // Compter les éléments
    const folderCount = files.filter(f => f['.tag'] === 'folder').length;
    const mp3Count = files.filter(f => f['.tag'] === 'file').length;

    // Calculer les styles pour le morph - utilise CSS transition au lieu de JS animation
    const getMorphStyles = () => {
        // morphProgress: 0 = position capsule, 1 = position dialog final
        if (morphProgress === 0) {
            // Position initiale = capsule (utilise dropboxButtonRect calculé au début)
            return {
                position: 'fixed',
                left: dropboxButtonRect.left,
                top: dropboxButtonRect.top,
                width: dropboxButtonRect.width,
                height: dropboxButtonRect.height,
                borderRadius: dropboxButtonRect.height / 2,
                transition: `all ${CONFIG.MORPH_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            };
        } else {
            // Position finale = dialog centré
            return {
                position: 'fixed',
                left: dialogDimensions.finalLeft,
                top: dialogDimensions.finalTop,
                width: dialogDimensions.finalWidth,
                height: dialogDimensions.finalHeight,
                borderRadius: 16,
                transition: `all ${CONFIG.MORPH_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            };
        }
    };

    const morphStyles = getMorphStyles();

    if (!isVisible) return null;

    return (
        <>
            <style>{dropboxStyles}</style>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center"
                style={{
                    backgroundColor: backdropVisible ? 'rgba(0, 0, 0, 0)' : 'transparent',
                    backdropFilter: backdropVisible ? 'blur(8px)' : 'none',
                }}
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                {/* Dialog principal avec animation morph CSS */}
                <div
                    ref={dialogRef}
                    className="flex flex-col overflow-hidden"
                    style={{
                        ...morphStyles,
                        paddingTop: '0.75rem',
                        paddingBottom: 0,
                        paddingLeft: 0,
                        paddingRight: 0,
                        background: CONFIG.DIALOG_BG_COLOR,
                        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                        opacity: 1,
                    }}
                >
                    {/* Navigation Dropbox */}
                    <div
                        className="flex-1 flex flex-col"
                        style={{
                            paddingTop: '0.75rem',
                            paddingBottom: 0,
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
                                className={`flex items-center ${is3DMode ? '' : 'rounded-full'} px-3 border border-gray-200 w-full relative overflow-hidden`}
                                style={{
                                    background: 'white',
                                    height: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                                    minHeight: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                                    borderRadius: is3DMode ? '0.5rem' : undefined,
                                }}
                            >
                                {/* Masque cylindrique 3D sur le header */}
                                <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                                {/* Barre de progression - se remplit de gauche à droite */}
                                {scanPhase === 'processing' && totalFilesToProcess > 0 && (
                                    <div
                                        className="absolute left-0 top-0 bottom-0 z-0"
                                        style={{
                                            width: `${smoothedProcessedFiles}%`,
                                            background: CONFIG.DROPBOX_BLUE,
                                            opacity: 0.15,
                                        }}
                                    />
                                )}
                                {/* Bouton retour ou logo Dropbox */}
                                {isAtRoot ? (
                                    <DropboxLogoVector size={18} color={CONFIG.DROPBOX_BLUE} />
                                ) : (
                                    <button
                                        onClick={() => !loading && navigateBack()}
                                        className="flex items-center justify-center -ml-1 mr-1"
                                        style={{
                                            color: CONFIG.DROPBOX_BLUE,
                                            opacity: loading ? 0.5 : 1,
                                            pointerEvents: loading ? 'none' : 'auto',
                                        }}
                                        disabled={loading}
                                    >
                                        <ChevronLeft size={18} strokeWidth={2.5} />
                                    </button>
                                )}

                                {/* Nom du dossier + compteurs (MP3 d'abord, puis dossiers) */}
                                <div className="flex items-center gap-2 ml-2 relative z-10">
                                    <span
                                        className="font-bold text-gray-700 truncate"
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        {currentFolderName}
                                    </span>
                                    {mp3Count > 0 && (
                                        <span className="flex items-center gap-0.5 text-gray-400">
                                            <span className="text-xs">{mp3Count}</span>
                                            <Music size={12} />
                                        </span>
                                    )}
                                    {folderCount > 0 && (
                                        <span className="flex items-center gap-0.5 text-gray-400">
                                            <span className="text-xs">{folderCount}</span>
                                            <Folder size={12} />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Liste des fichiers avec zone scrubbing à droite - pas de gap entre liste et scrub zone */}
                        <div className="flex-1 flex" style={{ paddingLeft: 0, paddingRight: 0 }}>
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
                                    {files.length === 0 && !loading ? (
                                        <div className="text-center py-12 text-gray-300 font-medium text-2xl">—</div>
                                    ) : (
                                        <div className="flex flex-col">
                                            {files.map((file, index) => {
                                                const isFolder = file['.tag'] === 'folder';

                                                if (isFolder) {
                                                    return (
                                                        <div
                                                            key={file.path_lower || index}
                                                            onClick={() => !loading && navigateToFolder(file.path_lower, file.name)}
                                                            className="flex items-center pl-3 pr-2 cursor-pointer relative overflow-hidden"
                                                            style={{
                                                                height: CONFIG.CARD_HEIGHT,
                                                                background: 'white',
                                                                borderRadius: CONFIG.CARD_RADIUS,
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                                marginBottom: CONFIG.CARD_GAP,
                                                                opacity: loading ? 0.5 : 1,
                                                                pointerEvents: loading ? 'none' : 'auto',
                                                            }}
                                                        >
                                                            {/* Masque cylindrique 3D sur les cartes dossiers */}
                                                            <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                                                            <span
                                                                className="flex-1 truncate font-bold text-gray-900 relative z-10"
                                                                style={{ fontSize: CONFIG.ROW_TITLE_SIZE }}
                                                            >
                                                                {file.name}
                                                            </span>
                                                        </div>
                                                    );
                                                } else {
                                                    const fileName = file.name.replace(/\.mp3$/i, '');
                                                    const parts = fileName.split(' - ');
                                                    const title = parts.length > 1 ? parts.slice(1).join(' - ') : fileName;
                                                    const artist = parts.length > 1 ? parts[0] : '';

                                                    return (
                                                        <div
                                                            key={file.path_lower || index}
                                                            className="flex items-center pl-3 border-b border-gray-100"
                                                            style={{ height: CONFIG.FILE_HEIGHT }}
                                                        >
                                                            <Music size={12} className="text-gray-300 mr-2 flex-shrink-0" />
                                                            <div className="flex-1 flex flex-col justify-center overflow-hidden">
                                                                <span className="font-bold truncate text-gray-900" style={{ fontSize: CONFIG.ROW_TITLE_SIZE, lineHeight: 1.2 }}>
                                                                    {title}
                                                                </span>
                                                                {artist && (
                                                                    <span className="truncate font-medium text-gray-500" style={{ fontSize: CONFIG.ROW_SUBTITLE_SIZE, lineHeight: 1.2 }}>
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

                                {listNeedsScroll && fadeTopOpacity > 0 && (
                                    <div className="absolute left-0 right-0 top-0 pointer-events-none" style={{ height: CONFIG.FADE_HEIGHT, background: `linear-gradient(to bottom, rgba(255,255,255,${CONFIG.FADE_OPACITY}) 0%, rgba(255,255,255,0) 100%)`, opacity: fadeTopOpacity }} />
                                )}
                                {listNeedsScroll && fadeBottomOpacity > 0 && (
                                    <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ height: CONFIG.FADE_HEIGHT, background: `linear-gradient(to top, rgba(255,255,255,${CONFIG.FADE_OPACITY}) 0%, rgba(255,255,255,0) 100%)`, opacity: fadeBottomOpacity }} />
                                )}
                            </div>

                            <div ref={scrubZoneRef} className="relative" style={{ width: CONFIG.SCRUB_ZONE_WIDTH, flexShrink: 0, touchAction: 'none' }} onTouchStart={handleScrubStart} onTouchMove={handleScrubMove} onTouchEnd={handleScrubEnd}>
                                {showScrollbar && files.length > 0 && (
                                    <div className={`absolute ${isScrubbing ? '' : 'dropbox-beacon-pulse'}`} style={{ left: '50%', transform: isScrubbing ? 'translateX(-50%) scale(1.5)' : undefined, width: CONFIG.SCROLLBAR_WIDTH, height: CONFIG.SCROLLBAR_WIDTH, top: `${scrollPercent * 100}%`, background: CONFIG.SCROLLBAR_COLOR, borderRadius: '50%', boxShadow: isScrubbing ? '0 0 16px rgba(236, 72, 153, 1)' : CONFIG.SCROLLBAR_GLOW, transition: isScrubbing ? 'transform 0.1s, box-shadow 0.1s' : 'top 0.05s ease-out' }} />
                                )}
                            </div>
                        </div>

                        {/* Boutons browse */}
                        <div className="relative" style={{ flexShrink: 0, paddingLeft: CONFIG.HORIZONTAL_PADDING, paddingRight: CONFIG.HORIZONTAL_PADDING, paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                            <div className="flex items-center gap-2" style={{ opacity: scanPhase === 'processing' ? 0 : 1 }}>
                                {/* Bouton Close (X) - cercle */}
                                <div className="relative overflow-visible rounded-full flex-shrink-0" style={{ height: UNIFIED_CONFIG.CAPSULE_HEIGHT, width: UNIFIED_CONFIG.CAPSULE_HEIGHT }}>
                                    {closingButton === 'close' && <div className="absolute inset-0 rounded-full dropbox-ignite-red" style={{ background: '#ef4444', zIndex: 0 }} />}
                                    <button onClick={handleClose} disabled={!!closingButton || scanning} className="relative z-10 w-full h-full rounded-full font-bold text-sm flex items-center justify-center overflow-hidden" style={{ background: closingButton === 'close' ? 'transparent' : 'rgba(0,0,0,0.05)', color: closingButton === 'close' ? 'white' : '#9ca3af' }}>
                                        <SphereMask is3DMode={is3DMode} intensity={0.6} />
                                        <span className="relative z-10"><X size={18} /></span>
                                    </button>
                                </div>
                                {/* Bouton Logout - capsule */}
                                <div className={`flex-1 relative overflow-visible ${is3DMode ? '' : 'rounded-full'}`} style={{ height: UNIFIED_CONFIG.CAPSULE_HEIGHT, borderRadius: is3DMode ? '0.5rem' : undefined }}>
                                    {closingButton === 'disconnect' && <div className={`absolute inset-0 ${is3DMode ? '' : 'rounded-full'} dropbox-ignite-red`} style={{ background: '#ef4444', zIndex: 0, borderRadius: is3DMode ? '0.5rem' : undefined }} />}
                                    <button onClick={handleDisconnect} disabled={!!closingButton || scanning} className={`relative z-10 w-full h-full ${is3DMode ? '' : 'rounded-full'} font-bold text-sm flex items-center justify-center gap-1 overflow-hidden`} style={{ background: closingButton === 'disconnect' ? 'transparent' : 'rgba(0,0,0,0.05)', color: closingButton === 'disconnect' ? 'white' : '#ef4444', borderRadius: is3DMode ? '0.5rem' : undefined }}>
                                        <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                                        <span className="relative z-10 flex items-center gap-1"><LogOut size={14} /><span>LOGOUT</span></span>
                                    </button>
                                </div>
                                {/* Bouton Import - capsule */}
                                <div className={`flex-1 relative overflow-hidden ${is3DMode ? '' : 'rounded-full'}`} style={{ height: UNIFIED_CONFIG.CAPSULE_HEIGHT, borderRadius: is3DMode ? '0.5rem' : undefined }}>
                                    <button onClick={handleImport} disabled={!canImport || !!closingButton} className={`relative z-10 w-full h-full ${is3DMode ? '' : 'rounded-full'} font-bold text-sm flex items-center justify-center gap-1 overflow-hidden`} style={{ background: scanPhase === 'counting' ? 'white' : (canImport ? CONFIG.DROPBOX_BLUE : 'rgba(0,0,0,0.05)'), border: scanPhase === 'counting' ? '1px solid rgba(0,0,0,0.05)' : 'none', color: scanPhase === 'counting' ? CONFIG.DROPBOX_BLUE : (canImport ? 'white' : '#9CA3AF'), opacity: canImport || scanning ? 1 : 0.4, boxShadow: canImport && !scanning ? '0 0 15px rgba(0, 97, 254, 0.4)' : 'none', borderRadius: is3DMode ? '0.5rem' : undefined }}>
                                        <CylinderMask is3DMode={is3DMode} intensity={0.6} />
                                        <span className="relative z-10 flex items-center gap-1">{scanPhase === 'counting' ? <Loader2 size={14} className="animate-spin" /> : <FolderDown size={14} />}<span>IMPORT</span></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loading overlay centré sur toute la fenêtre */}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(250, 250, 250, 0.8)', zIndex: 100 }}>
                            <Loader2 size={32} className="animate-spin" style={{ color: CONFIG.DROPBOX_BLUE }} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default DropboxBrowser;
