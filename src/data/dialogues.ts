// Dialogues et narration environnementale — data-driven.

export interface DialogueLine {
  speaker: string;      // '' = narrateur
  text: string;
  color?: string;
}

export interface DialogueDef {
  id: string;
  lines: DialogueLine[];
}

export const DIALOGUES: Record<string, DialogueDef> = {
  // === Boss : introduction (avant le combat) ===
  'boss-intro': {
    id: 'boss-intro',
    lines: [
      { speaker: '', text: 'Le silence des Archives se fait plus épais. Derrière le bureau monumental, une silhouette se lève lentement.' },
      { speaker: '???', text: 'Vous n\'avez pas pris rendez-vous.', color: '#c44dff' },
      { speaker: 'Datpaloof', text: 'Nous venons mettre un terme à tes classements maudits, Archiviste.', color: '#e74c3c' },
      { speaker: 'Le Champion', text: 'Champion. Champion des Collectivités Territoriales, élu au douzième tour des dimensions oubliées.', color: '#c44dff' },
      { speaker: 'Le Champion', text: 'Vos existences ne sont que des pièces justificatives manquantes. Je vais y remédier.', color: '#c44dff' },
      { speaker: 'Baghaar', text: 'Les esprits me soufflent que ce type adore s\'écouter parler.', color: '#27ae60' },
      { speaker: 'Zlatax', text: 'Alors abrégeons la réunion.', color: '#8e44ad' },
      { speaker: 'Le Champion', text: 'TAMPON RÉGLEMENTAIRE. DOSSIER OUVERT. Que la séance commence.', color: '#c44dff' },
    ],
  },
  // === Boss : victoire ===
  'boss-outro': {
    id: 'boss-outro',
    lines: [
      { speaker: 'Le Champion', text: 'Impossible… mon classement… mes circulaires…', color: '#c44dff' },
      { speaker: '', text: 'L\'écharpe tricolore se consume en flammes violettes. Les livres flottants retombent un à un, inertes.' },
      { speaker: 'Datpaloof', text: 'Dossier clos. Définitivement.', color: '#e74c3c' },
      { speaker: '', text: 'Les Archives Infinies s\'apaisent. Quelque part dans les rayonnages, une lampe verte se rallume doucement.' },
      { speaker: 'Baghaar', text: 'Les esprits des lieux vous remercient. Je crois même en avoir entendu un applaudir.', color: '#27ae60' },
      { speaker: 'Zlatax', text: 'On récupère le trésor et on file. Cet endroit me donne des envies de brûler du papier.', color: '#8e44ad' },
    ],
  },
  // === Porte de la salle du boss (sceau incomplet) ===
  'boss-door-locked': {
    id: 'boss-door-locked',
    lines: [
      { speaker: '', text: 'Une porte massive scellée par un emblème de balance. Deux cavités vides attendent des fragments de sceau.' },
      { speaker: 'Datpaloof', text: 'Le Sceau de l\'Archiviste… Il nous faut les deux fragments gardés dans les ailes est et ouest.', color: '#e74c3c' },
    ],
  },
  'boss-door-open': {
    id: 'boss-door-open',
    lines: [
      { speaker: '', text: 'Les deux fragments s\'assemblent. La balance s\'illumine, et la porte s\'ouvre dans un souffle de poussière ancienne.' },
    ],
  },
  // === Lore des Archives (narration environnementale) ===
  'lore-registre': {
    id: 'lore-registre',
    lines: [
      { speaker: '', text: '« Registre des entrées — An 743 du Classement. Aujourd\'hui, 4 812 âmes archivées. Le Champion est satisfait. Le Champion est toujours satisfait. »' },
      { speaker: 'Baghaar', text: 'Ces pages… elles respirent. Ne traînons pas.', color: '#27ae60' },
    ],
  },
  'lore-circulaire': {
    id: 'lore-circulaire',
    lines: [
      { speaker: '', text: '« CIRCULAIRE 88-B : tout document tentant de fuir les rayonnages sera reclassé de force. Les grimoires récalcitrants seront reliés. »' },
      { speaker: 'Zlatax', text: 'Ils ont donné vie aux livres pour qu\'ils se gardent tout seuls. Malin. Tordu, mais malin.', color: '#8e44ad' },
    ],
  },
  'lore-plainte': {
    id: 'lore-plainte',
    lines: [
      { speaker: '', text: '« Plainte n°44 201 — Motif : disparition d\'un collègue entre les rayons 12 et 13. Statut : CLASSÉE SANS SUITE (le plaignant a également disparu). »' },
      { speaker: 'Datpaloof', text: 'Que la Lumière garde ceux qui dorment entre ces pages.', color: '#e74c3c' },
    ],
  },
  'lore-fragment-ouest': {
    id: 'lore-fragment-ouest',
    lines: [
      { speaker: '', text: 'Au fond d\'un tiroir verrouillé par la patrouille, un éclat de métal froid : le premier fragment du Sceau de l\'Archiviste.' },
    ],
  },
  'lore-fragment-est': {
    id: 'lore-fragment-est',
    lines: [
      { speaker: '', text: 'Le Budget dévorant protégeait un coffret poussiéreux. À l\'intérieur, le second fragment du Sceau de l\'Archiviste.' },
    ],
  },
  // === Point de sauvegarde ===
  'save-point': {
    id: 'save-point',
    lines: [
      { speaker: '', text: 'La pierre de mémoire pulse d\'une lueur apaisante. L\'équipe reprend son souffle. (PV/MP restaurés, partie sauvegardée)' },
    ],
  },
  // === Secret ===
  'secret-cafe': {
    id: 'secret-cafe',
    lines: [
      { speaker: '', text: 'Derrière une pile de registres, une réserve secrète : la cachette à café du greffier de nuit.' },
      { speaker: 'Baghaar', text: 'Le vrai trésor des Archives.', color: '#27ae60' },
    ],
  },

  // ============================================================
  // Ramees — PNJ et lieux
  // ============================================================
  'ramees-fontaine': {
    id: 'ramees-fontaine',
    lines: [
      { speaker: '', text: 'La fontaine de Ramees. Une plaque gravée indique : « Inaugurée en l\'an 12 du Classement, sous réserve d\'approbation du budget communal. » L\'approbation n\'est jamais arrivée, mais l\'eau coule quand même.' },
    ],
  },
  'npc-juiffy': {
    id: 'npc-juiffy',
    lines: [
      { speaker: 'Juiffy', text: 'Bienvenue au Tampon Doré ! La seule auberge de Ramees où les chopes sont certifiées conformes.', color: '#e8b04a' },
      { speaker: 'Juiffy', text: 'Vous partez pour les Archives ? Alors prenez donc un café du greffier. Serré comme une convocation, efficace comme un rappel à l\'ordre.', color: '#e8b04a' },
      { speaker: 'Juiffy', text: 'Et si vous croisez Cubique là-bas au fond… ne le laissez pas commander une tournée générale. Il ne paie jamais.', color: '#e8b04a' },
    ],
  },
  'npc-cubique': {
    id: 'npc-cubique',
    lines: [
      { speaker: 'Cubique', text: 'HÉÉÉ ! Vous tombez bien, c\'est ma soirée ! Enfin… toutes mes soirées sont mes soirées.', color: '#ff7ad4' },
      { speaker: 'Cubique', text: 'On dit que le Champion des Collectivités a interdit la danse dans les Archives. INTERDIT. LA. DANSE. Vous vous rendez compte ?', color: '#ff7ad4' },
      { speaker: 'Cubique', text: 'Allez lui régler son compte, et à votre retour : fiesta réglementaire. J\'apporte le tambour, Juiffy apporte les cafés !', color: '#ff7ad4' },
    ],
  },
  'npc-pretre': {
    id: 'npc-pretre',
    lines: [
      { speaker: 'Père Célestin', text: 'Que la Sainte Réglementation veille sur vous, mes enfants.', color: '#f0e6c8' },
      { speaker: 'Père Célestin', text: 'Les Archives Infinies étaient jadis une bibliothèque bénie. Puis le Champion y a instauré le Classement Éternel… et les âmes des documents se sont mises à hurler.', color: '#f0e6c8' },
      { speaker: 'Père Célestin', text: 'Rappelez-vous : quand il lèvera son Tampon du Jugement Dernier, ne fuyez pas. Priez… et GARDEZ. La posture défensive est une forme de prière.', color: '#f0e6c8' },
    ],
  },
  'npc-greffiere': {
    id: 'npc-greffiere',
    lines: [
      { speaker: 'Greffière Ordonna', text: 'La mairie de Ramees vous écoute. Prenez un ticket. Ah, plus de tickets. Revenez jeudi.', color: '#c9a0ff' },
      { speaker: 'Greffière Ordonna', text: '…Vous allez aux Archives ? Alors écoutez. Le Champion était notre élu, autrefois. Douzième tour de scrutin, année maudite. Il n\'a jamais accepté la fin de son mandat.', color: '#c9a0ff' },
      { speaker: 'Greffière Ordonna', text: 'Il a emporté le Sceau de l\'Archiviste en partant. Si ses fragments existent encore, ils sont gardés dans les ailes est et ouest des Archives. C\'est tout ce que je peux déclassifier.', color: '#c9a0ff' },
    ],
  },
  'npc-forgeron': {
    id: 'npc-forgeron',
    lines: [
      { speaker: 'Bragnar', text: 'Hmpf. Une épée runique, une masse-totem et des lames démoniaques. Du beau matériel. C\'est pas d\'ici.', color: '#d89060' },
      { speaker: 'Bragnar', text: 'Contre du papier, l\'acier ne suffit pas toujours. Visez les faiblesses : le feu et la lumière sacrée font des merveilles contre les grimoires.', color: '#d89060' },
      { speaker: 'Bragnar', text: 'Repassez me voir quand j\'aurai fini la commande de la mairie : trois cents agrafeuses de guerre. Me demandez pas.', color: '#d89060' },
    ],
  },
  'npc-steven': {
    id: 'npc-steven',
    lines: [
      { speaker: 'Steven', text: 'Chuuut… les plantes dorment. Enfin, sauf la menthe hurlante, elle ne dort jamais.', color: '#7ad47a' },
      { speaker: 'Steven', text: 'Vous avez une mine affreuse. Tenez, des dossiers de soin tamponnés de ma réserve personnelle. Double cachet, triple efficacité.', color: '#7ad47a' },
      { speaker: 'Steven', text: 'Et si vous trouvez des herbes entre les rayonnages des Archives, ne les cueillez pas. Là-bas, ce sont les herbes qui vous cueillent.', color: '#7ad47a' },
    ],
  },
  'npc-clemodin': {
    id: 'npc-clemodin',
    lines: [
      { speaker: 'Clemodin', text: 'AAAH ! …Oh, pardon. Des clients. J\'ai cru que c\'était encore un contrôle fiscal.', color: '#8ad48a' },
      { speaker: 'Clemodin', text: 'P-prenez ce que vous voulez ! Enfin non, payez ! Enfin… tenez, un formulaire A-38 certifié, c-cadeau de la maison. Ne me faites pas de mal.', color: '#8ad48a' },
      { speaker: 'Clemodin', text: 'Le Champion ? CHUT ! Ne prononcez pas son nom ici ! La dernière fois, j\'ai reçu un redressement rétroactif sur trois vies antérieures.', color: '#8ad48a' },
    ],
  },
  'npc-quenticast': {
    id: 'npc-quenticast',
    lines: [
      { speaker: 'Quenticast', text: 'Noraj. Tu regardes ma machine arcanique ? Refroidissement liquide à eau bénite, cristaux overclockés. Elle fait tourner Donjons & Décrets en ultra.', color: '#6bb8ff' },
      { speaker: 'Quenticast', text: 'J\'ai calculé le combat optimal contre le Champion, en théorie : tu marques, tu buffes Zlatax, et tu GARDES quand il télégraphe. C\'est du niveau spé-run, noraj.', color: '#6bb8ff' },
      { speaker: 'Quenticast', text: '…Sortir de ma chambre pour t\'aider ? Impossible, je suis en pleine partie classée. Mais moralement je suis avec toi. Noraj.', color: '#6bb8ff' },
    ],
  },
};

export function getDialogue(id: string): DialogueDef | null {
  return DIALOGUES[id] ?? null;
}
