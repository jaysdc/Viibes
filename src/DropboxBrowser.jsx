import React, { useState, useRef, useEffect } from 'react';
import { X, Folder, Music, ChevronRight, ChevronLeft, FolderDown, LogOut, Disc3 } from 'lucide-react';
import { DropboxLogoVector } from './Assets.jsx';
import { UNIFIED_CONFIG } from './Config.js';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    DROPBOX BROWSER - PARAMÈTRES                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

const CONFIG = {
    // Couleurs
    DROPBOX_BLUE: '#0061FE',

    // Cartes dossiers
    CARD_HEIGHT: '2.25rem',
    CARD_RADIUS: '0.5rem',
    CARD_GAP: '0.25rem',
    CARD_FONT_SIZE: '0.75rem',
    CARD_ICON_SIZE: 16,

    // Fichiers MP3 (sans carte)
    FILE_HEIGHT: '1.5rem',
    FILE_GAP: '0.125rem',
    FILE_FONT_SIZE: '0.65rem',
    FILE_ICON_SIZE: 12,

    // Dialog - plus grand
    DIALOG_WIDTH: '92vw',
    DIALOG_MAX_WIDTH: '360px',
    DIALOG_HEIGHT: '80vh',
    DIALOG_MAX_HEIGHT: '600px',
};

// Première lettre en majuscule
const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

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
}) => {
    // États
    const [currentPath, setCurrentPath] = useState('');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);

    const listRef = useRef(null);

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

                // Ajouter les MP3 de ce dossier (nom avec majuscule)
                if (mp3Files.length > 0) {
                    result[capitalize(folderName)] = mp3Files.map(f => ({
                        name: f.name,
                        size: f.size,
                        path_lower: f.path_lower,
                    }));
                }

                // Scanner récursivement les sous-dossiers (nom avec majuscule)
                for (const subfolder of subfolders) {
                    await scanFolder(subfolder.path_lower, capitalize(subfolder.name));
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
            const folderName = currentPath.split('/').pop() || 'Dropbox Import';
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

    // Handler déconnexion - onDisconnect appelle déjà clearDropboxTokens côté App.jsx
    const handleDisconnect = () => {
        onDisconnect();
        onClose();
    };

    // Naviguer vers un dossier
    const navigateToFolder = (path) => {
        setCurrentPath(path);
        loadFolder(path);
    };

    // Retour au dossier parent
    const navigateBack = () => {
        if (!currentPath) return;
        const parentPath = currentPath.split('/').slice(0, -1).join('/');
        setCurrentPath(parentPath);
        loadFolder(parentPath);
    };

    // Charger la racine au montage
    useEffect(() => {
        if (isVisible) {
            loadFolder('');
            setCurrentPath('');
        }
    }, [isVisible]);

    if (!isVisible) return null;

    const isAtRoot = !currentPath;
    const canImport = !isAtRoot && !loading && !scanning;
    const currentFolderName = currentPath ? currentPath.split('/').pop() : 'Dropbox';

    // Compter les éléments
    const folderCount = files.filter(f => f['.tag'] === 'folder').length;
    const mp3Count = files.filter(f => f['.tag'] === 'file').length;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Dialog principal */}
            <div
                className="flex flex-col overflow-hidden"
                style={{
                    width: CONFIG.DIALOG_WIDTH,
                    maxWidth: CONFIG.DIALOG_MAX_WIDTH,
                    height: CONFIG.DIALOG_HEIGHT,
                    maxHeight: CONFIG.DIALOG_MAX_HEIGHT,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                    borderRadius: '1rem',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center rounded-full px-3 mb-2 border border-gray-200"
                    style={{
                        background: 'white',
                        height: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                        minHeight: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                        flexShrink: 0,
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

                    {/* Nom du dossier + compteurs */}
                    <div className="flex-1 overflow-hidden ml-2 flex items-center gap-2">
                        <span
                            className="font-bold text-gray-700 truncate"
                            style={{ fontSize: '0.8rem' }}
                        >
                            {currentFolderName}
                        </span>
                        <span className="text-gray-400 text-xs whitespace-nowrap">
                            {folderCount > 0 && `${folderCount} dossiers`}
                            {folderCount > 0 && mp3Count > 0 && ' · '}
                            {mp3Count > 0 && `${mp3Count} mp3`}
                        </span>
                    </div>
                </div>

                {/* Liste des fichiers */}
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden mb-2"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Disc3 size={24} className="animate-spin" style={{ color: CONFIG.DROPBOX_BLUE }} />
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
                                    // Dossier : carte avec fond blanc
                                    return (
                                        <div
                                            key={file.path_lower || index}
                                            onClick={() => navigateToFolder(file.path_lower)}
                                            className="flex items-center gap-2 px-3 cursor-pointer"
                                            style={{
                                                height: CONFIG.CARD_HEIGHT,
                                                background: 'white',
                                                borderRadius: CONFIG.CARD_RADIUS,
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                marginBottom: CONFIG.CARD_GAP,
                                            }}
                                        >
                                            <Folder size={CONFIG.CARD_ICON_SIZE} style={{ color: CONFIG.DROPBOX_BLUE, flexShrink: 0 }} />
                                            <span
                                                className="flex-1 truncate font-medium text-gray-700"
                                                style={{ fontSize: CONFIG.CARD_FONT_SIZE }}
                                            >
                                                {file.name}
                                            </span>
                                            <ChevronRight size={14} className="text-gray-300" style={{ flexShrink: 0 }} />
                                        </div>
                                    );
                                } else {
                                    // Fichier MP3 : pas de carte, juste texte compact
                                    return (
                                        <div
                                            key={file.path_lower || index}
                                            className="flex items-center gap-1 px-2"
                                            style={{
                                                height: CONFIG.FILE_HEIGHT,
                                                marginBottom: CONFIG.FILE_GAP,
                                                opacity: 0.6,
                                            }}
                                        >
                                            <Music size={CONFIG.FILE_ICON_SIZE} className="text-pink-400" style={{ flexShrink: 0 }} />
                                            <span
                                                className="flex-1 truncate text-gray-500"
                                                style={{ fontSize: CONFIG.FILE_FONT_SIZE }}
                                            >
                                                {file.name.replace(/\.mp3$/i, '')}
                                            </span>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    )}
                </div>

                {/* 3 boutons en bas */}
                <div
                    className="flex items-center justify-center"
                    style={{ gap: '0.5rem', flexShrink: 0 }}
                >
                    {/* Bouton FERMER */}
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center rounded-full"
                        style={{
                            height: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                            background: 'white',
                            border: '1px solid rgba(0,0,0,0.1)',
                        }}
                    >
                        <X size={18} className="text-gray-400" />
                    </button>

                    {/* Bouton DÉCONNECTER */}
                    <button
                        onClick={handleDisconnect}
                        className="flex-1 flex items-center justify-center rounded-full"
                        style={{
                            height: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                            background: 'white',
                            border: '1px solid rgba(0,0,0,0.1)',
                        }}
                    >
                        <LogOut size={18} className="text-red-500" />
                    </button>

                    {/* Bouton IMPORTER */}
                    <button
                        onClick={handleImport}
                        disabled={!canImport}
                        className="flex-1 flex items-center justify-center rounded-full"
                        style={{
                            height: UNIFIED_CONFIG.CAPSULE_HEIGHT,
                            background: canImport ? CONFIG.DROPBOX_BLUE : 'white',
                            border: canImport ? 'none' : '1px solid rgba(0,0,0,0.1)',
                            opacity: canImport ? 1 : 0.4,
                            boxShadow: canImport ? '0 0 15px rgba(0, 97, 254, 0.4)' : 'none',
                        }}
                    >
                        {scanning ? (
                            <Disc3 size={18} className="animate-spin text-white" />
                        ) : (
                            <FolderDown size={18} style={{ color: canImport ? 'white' : '#9CA3AF' }} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DropboxBrowser;
