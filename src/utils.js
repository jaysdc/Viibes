// Vérifie si un morceau est disponible (fichier local OU Dropbox)
export const isSongAvailable = (song) => {
    if (!song) return false;
    // Fichier local avec blob URL actif = disponible
    if (song.file) return true;
    // Dropbox : vérifier dropboxAvailable si défini, sinon présumer disponible
    if (song.dropboxPath) {
        // Si dropboxAvailable est explicitement false, le fichier n'existe plus sur Dropbox
        if (song.dropboxAvailable === false) return false;
        return true;
    }
    // Fichier local sans blob (après reload) - considéré comme indisponible
    // jusqu'à ré-import, mais on sait qu'il existe (localFileName présent)
    // => Pour l'affichage, on le marque comme "unavailable" (fantôme)
    return false;
  };

// Vérifie si un morceau a été importé localement (même si blob perdu après reload)
export const isLocalSong = (song) => {
    if (!song) return false;
    return !!song.localFileName || !!song.file;
  };

// Vérifie si un morceau peut être joué maintenant
export const canPlaySong = (song) => {
    if (!song) return false;
    // Besoin d'un fichier blob OU d'un path Dropbox valide
    if (song.file) return true;
    if (song.dropboxPath && song.dropboxAvailable !== false) return true;
    return false;
  };