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
};

export function getDialogue(id: string): DialogueDef | null {
  return DIALOGUES[id] ?? null;
}
