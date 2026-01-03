// Vérifie si un morceau est disponible (fichier local OU Dropbox)
export const isSongAvailable = (song) => {
    if (!song) return false;
    return !!song.file || (song.type === 'dropbox' && !!song.dropboxPath);
  };