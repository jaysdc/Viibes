# Blueprint de l'Application Vibes

## 1. Concept Général

*   **Nom :** Vibes
*   **Objectif :** Un lecteur de fichiers MP3 locaux pour mobile (design type iPhone), offrant une expérience utilisateur riche et très stylisée.
*   **Esthétique :** Moderne, audacieuse, basée sur des couleurs néon/fluo et des interactions fluides.
*   **Playlists (Vibes) :** Les playlists sont appelées "Vibes". Elles sont principalement créées en important des dossiers de musique locaux. Chaque dossier devient une Vibe.

## 2. Écran d'Accueil (Bibliothèque)

*   **Affichage Principal :** Présente les Vibes existantes sous forme de cartes (`VibeCard`) visuellement distinctes.
*   **Création de Vibes :**
    *   **Automatique :** L'utilisateur peut importer un dossier entier. Tous les fichiers MP3 trouvés sont regroupés pour créer une nouvelle Vibe. La fonction `handleFileImport` gère cela.
    *   **Manuelle :** Un "Vibe Builder" (`VibeBuilder`) permet à l'utilisateur de composer une Vibe personnalisée en sélectionnant des morceaux spécifiques parmi toutes les sources disponibles.
*   **Lecteur Tiroir (Dashboard) :** Lorsqu'une Vibe est en cours de lecture et que l'utilisateur revient à l'écran d'accueil, un mini-lecteur persistant apparaît en bas de l'écran sous forme de tiroir.

## 3. Lecteur Principal ("Vibes")

*   **Lancement :** Un clic sur une carte de Vibe mélange immédiatement son contenu, lance la lecture du premier morceau et ouvre l'interface du lecteur principal.
*   **Interface Principale :** L'élément central est une "roue" de morceaux (`SongWheel`) qui affiche la file d'attente de manière verticale et interactive.
    *   **Navigation :** L'utilisateur peut faire défiler la roue pour naviguer dans la file d'attente.
    *   **Interactions par Gestes (sur les morceaux) :**
        *   **Swipe vers la gauche :** "Archiver" un morceau. Cette action le déplace au début de la file d'attente, l'excluant de la lecture en cours. Géré par `onSwipeLeft`.
        *   **Swipe vers la droite :** "Play Next". Cette action insère le morceau juste après celui qui est en cours de lecture. Géré par `onSwipeRight`.
*   **Contrôles et Modules :**
    *   **Capsule de Contrôle (`ControlCartridge`) :** Intégrée dans la roue pour le morceau actuel, elle fournit les contrôles essentiels : Play/Pause, Précédent, Suivant.
    *   **Capsule de Tri Vivante (`LiveHeaderCartridge`) :**
        *   **Tri :** Permet de réorganiser la file d'attente actuelle selon plusieurs modes : mélange initial, ordre alphabétique (titre/artiste), popularité (plus/moins écoutés).
        *   **Nouveau Mélange :** Un bouton dédié permet de générer un nouveau mélange aléatoire de la Vibe.
        *   **Feedback :** Cette capsule sert également de zone de notification pour confirmer des actions comme "ARCHIVE" ou "PLAY NEXT".
    *   **Contrôle du Volume ("Marée Rose") :**
        *   Un appui long sur l'icône de volume active un mode plein écran.
        *   L'écran entier devient un slider de volume vertical.
        *   Le niveau de volume est visualisé par une jauge de couleur rose qui "inonde" l'écran et par un indicateur de pourcentage géant dont la taille est proportionnelle au volume (monstrueux à 100%). Géré par le composant `VolumeOverlay`.

## 4. Lecteur Tiroir (Dashboard)

*   **Contexte d'Apparition :** S'affiche sur l'écran d'accueil uniquement lorsqu'une Vibe est active.
*   **Interactions :**
    *   Le tiroir peut être redimensionné verticalement par un geste de glissement.
    *   Si l'utilisateur étire le tiroir au-delà d'un certain seuil, l'application bascule vers l'interface du lecteur principal en plein écran.
*   **Fonctionnalités :** C'est une version compacte et dynamique du lecteur principal. Il conserve toutes les fonctionnalités (Play/Pause, navigation, swipes, etc.). Son affichage, notamment le nombre d'éléments visibles dans la roue (`visibleItems`), s'adapte en temps réel à la hauteur du tiroir.
*   **Capsule Vivante :** Dans ce mode, la barre de progression du temps (`TimeCapsule`) peut être utilisée pour afficher des feedbacks, maintenant la philosophie d'interface dynamique.
