// Vérifie si un morceau est disponible (fichier local OU Dropbox)
export const isSongAvailable = (song) => {
    if (!song) return false;
    // Fichier local toujours dispo
    if (song.file) return true;
    // Dropbox : vérifier dropboxAvailable si défini, sinon présumer disponible
    if (song.dropboxPath) {
        // Si dropboxAvailable est explicitement false, le fichier n'existe plus sur Dropbox
        if (song.dropboxAvailable === false) return false;
        return true;
    }
    return false;
  };