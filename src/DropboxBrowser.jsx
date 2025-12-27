import React, { useState, useRef, useEffect } from 'react';
import { X, Folder, Music, ChevronRight, ChevronLeft, FolderDown, LogOut, Disc3 } from 'lucide-react';
import { DropboxLogoVector } from './Assets.jsx';
import { SMARTIMPORT_CONFIG } from './SmartImport.jsx';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    DROPBOX BROWSER - PARAMÈTRES                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

const CONFIG = {
    // Couleurs
    DROPBOX_BLUE: '#0061FE',
    DROPBOX_GLOW: 'rgba(0, 97, 254, 0.5)',
    
    // Boutons
    BUTTON_HEIGHT: '3rem',
    BUTTON_GAP: '0.5rem',
    
    // Cartes
    CARD_HEIGHT: '3.5rem',
    CARD_RADIUS: '0.75rem',
    CARD_GAP: '0.5rem',
    
    // Animations
    FADE_DURATION: 300,
    NAVIGATION_DURATION: 200,
};

// ══════════════════════════════════════════════════════════════════════════════
// STYLES CSS
// ══════════════════════════════════════════════════════════════════════════════
const dropboxBrowserStyles = `
    @keyframes dropbox-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes dropbox-slide-in {
        from { transform: translateX(20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes dropbox-slide-out {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-20px); opacity: 0; }
    }
    
    .dropbox-card-enter {
        animation: dropbox-slide-in 0.2s ease-out forwards;
    }
    
    .dropbox-glow-blue {
        box-shadow: 0 0 15px rgba(0, 97, 254, 0.5), 0 0 30px rgba(0, 97, 254, 0.3);
    }
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
}) => {
    // États
    const [currentPath, setCurrentPath] = useState('');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [navigationKey, setNavigationKey] = useState(0);
    
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
            setNavigationKey(k => k + 1);
            
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
        if (!currentPath) return;
        
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

    // Couleurs du dialog (identiques à SmartImport)
    const folderBg = SMARTIMPORT_CONFIG.DIALOG_BG_COLOR;
    const folderShadow = '0 0 40px rgba(236, 72, 153, 0.3), 0 0 80px rgba(6, 182, 212, 0.2), 0 25px 50px rgba(0,0,0,0.25)';

    return (
        <>
            <style>{dropboxBrowserStyles}</style>
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)',
                }}
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                {/* Dialog principal */}
                <div
                    className="flex flex-col overflow-hidden"
                    style={{
                        width: '90vw',
                        maxWidth: '320px',
                        height: '70vh',
                        maxHeight: '500px',
                        padding: '1rem',
                        background: folderBg,
                        borderRadius: '1.5rem',
                        boxShadow: folderShadow,
                    }}
                >
                    {/* Header capsule */}
                    <div 
                        className="flex items-center rounded-full px-4 mb-4 border border-gray-200"
                        style={{ 
                            background: 'white',
                            paddingTop: SMARTIMPORT_CONFIG.HEADER_PADDING_Y,
                            paddingBottom: SMARTIMPORT_CONFIG.HEADER_PADDING_Y,
                            minHeight: '3rem',
                        }}
                    >
                        {/* Bouton retour ou logo Dropbox */}
                        {isAtRoot ? (
                            <DropboxLogoVector size={20} color={CONFIG.DROPBOX_BLUE} />
                        ) : (
                            <button
                                onClick={navigateBack}
                                className="flex items-center justify-center -ml-1 mr-1"
                                style={{ color: CONFIG.DROPBOX_BLUE }}
                            >
                                <ChevronLeft size={20} strokeWidth={2.5} />
                            </button>
                        )}
                        
                        {/* Nom du dossier */}
                        <div className="flex-1 overflow-hidden ml-2">
                            <div 
                                className="font-bold text-gray-700 whitespace-nowrap truncate"
                                style={{ fontSize: SMARTIMPORT_CONFIG.HEADER_FONT_SIZE }}
                            >
                                {currentFolderName}
                            </div>
                        </div>
                    </div>

                    {/* Liste des fichiers */}
                    <div 
                        ref={listRef}
                        className="flex-1 overflow-y-auto overflow-x-hidden mb-4"
                        style={{ 
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Disc3 size={32} className="animate-spin" style={{ color: CONFIG.DROPBOX_BLUE }} />
                            </div>
                        ) : files.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                Dossier vide
                            </div>
                        ) : (
                            <div 
                                key={navigationKey}
                                className="flex flex-col"
                                style={{ gap: CONFIG.CARD_GAP }}
                            >
                                {files.map((file, index) => {
                                    const isFolder = file['.tag'] === 'folder';
                                    const isMp3 = file.name.toLowerCase().endsWith('.mp3');
                                    
                                    return (
                                        <div
                                            key={file.path_lower || index}
                                            onClick={() => isFolder && navigateToFolder(file.path_lower)}
                                            className={`
                                                flex items-center gap-3 px-4 dropbox-card-enter
                                                ${isFolder ? 'cursor-pointer active:scale-[0.98]' : ''}
                                            `}
                                            style={{
                                                height: CONFIG.CARD_HEIGHT,
                                                background: 'white',
                                                borderRadius: CONFIG.CARD_RADIUS,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                                opacity: isMp3 && !isFolder ? 0.5 : 1,
                                                animationDelay: `${index * 30}ms`,
                                                transition: 'transform 0.1s ease-out',
                                            }}
                                        >
                                            {isFolder ? (
                                                <Folder size={20} style={{ color: CONFIG.DROPBOX_BLUE }} />
                                            ) : (
                                                <Music size={20} className="text-pink-500" />
                                            )}
                                            <span className="flex-1 truncate text-sm font-medium text-gray-700">
                                                {file.name}
                                            </span>
                                            {isFolder && (
                                                <ChevronRight size={16} className="text-gray-300" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 3 boutons capsules en bas */}
                    <div 
                        className="flex items-center justify-center"
                        style={{ gap: CONFIG.BUTTON_GAP }}
                    >
                        {/* Bouton FERMER */}
                        <button
                            onClick={onClose}
                            className="flex-1 flex items-center justify-center rounded-full transition-transform active:scale-95"
                            style={{
                                height: CONFIG.BUTTON_HEIGHT,
                                background: 'transparent',
                                border: '1px solid rgba(0,0,0,0.1)',
                            }}
                        >
                            <X size={20} className="text-gray-400" />
                        </button>

                        {/* Bouton DÉCONNECTER */}
                        <button
                            onClick={() => {
                                onDisconnect();
                                onClose();
                            }}
                            className="flex-1 flex items-center justify-center rounded-full transition-transform active:scale-95"
                            style={{
                                height: CONFIG.BUTTON_HEIGHT,
                                background: 'transparent',
                                border: '1px solid rgba(0,0,0,0.1)',
                            }}
                        >
                            <LogOut size={20} className="text-red-500" />
                        </button>

                        {/* Bouton IMPORTER */}
                        <button
                            onClick={handleImport}
                            disabled={!canImport}
                            className={`
                                flex-1 flex items-center justify-center rounded-full transition-all
                                ${canImport ? 'active:scale-95 dropbox-glow-blue' : ''}
                            `}
                            style={{
                                height: CONFIG.BUTTON_HEIGHT,
                                background: canImport ? CONFIG.DROPBOX_BLUE : 'transparent',
                                border: canImport ? 'none' : '1px solid rgba(0,0,0,0.1)',
                                opacity: canImport ? 1 : 0.3,
                            }}
                        >
                            {scanning ? (
                                <Disc3 size={20} className="animate-spin text-white" />
                            ) : (
                                <FolderDown 
                                    size={20} 
                                    style={{ color: canImport ? 'white' : '#D1D5DB' }} 
                                />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DropboxBrowser;