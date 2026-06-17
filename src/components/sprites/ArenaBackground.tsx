// Décor de la salle des archives infinies : étagères, bureau massif, vitrail vert,
// piles de dossiers, lampe de bureau, particules.

export function ArenaBackground() {
  return (
    <svg
      viewBox="0 0 800 480"
      className="arena-svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1610" />
          <stop offset="100%" stopColor="#070504" />
        </linearGradient>
        <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16201a" />
          <stop offset="100%" stopColor="#0a0c0a" />
        </linearGradient>
        <linearGradient id="shelfWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2614" />
          <stop offset="100%" stopColor="#1a0e08" />
        </linearGradient>
        <linearGradient id="deskWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a3a1c" />
          <stop offset="100%" stopColor="#2a1a0c" />
        </linearGradient>
        <radialGradient id="windowGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#88ff88" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#22aa44" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0a1a10" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe080" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffe080" stopOpacity="0" />
        </radialGradient>

        {/* Pattern d'étagère de livres */}
        <pattern id="bookRow" x="0" y="0" width="22" height="40" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="6" height="40" fill="#5a1818" />
          <rect x="7" y="0" width="5" height="40" fill="#2a1a4a" />
          <rect x="13" y="0" width="4" height="40" fill="#4a3a0a" />
          <rect x="18" y="0" width="4" height="40" fill="#1a3a2a" />
          <rect x="0" y="6" width="22" height="1.5" fill="#c8a040" opacity="0.6" />
          <rect x="0" y="32" width="22" height="1.5" fill="#c8a040" opacity="0.6" />
        </pattern>
      </defs>

      {/* Sol */}
      <rect x="0" y="320" width="800" height="160" fill="url(#floorGrad)" />
      {/* Mur */}
      <rect x="0" y="0" width="800" height="320" fill="url(#wallGrad)" />

      {/* Vitrail circulaire central — lumière verte surnaturelle */}
      <circle cx="400" cy="140" r="120" fill="url(#windowGlow)" />
      <circle cx="400" cy="140" r="70" fill="#0a2010" stroke="#22aa44" strokeWidth="2" />
      {/* Croisillons du vitrail */}
      <line x1="330" y1="140" x2="470" y2="140" stroke="#0a0a08" strokeWidth="3" />
      <line x1="400" y1="70" x2="400" y2="210" stroke="#0a0a08" strokeWidth="3" />
      <circle cx="400" cy="140" r="20" fill="#88ff88" opacity="0.7" />
      <circle cx="400" cy="140" r="8" fill="#fff" opacity="0.9" />

      {/* Étagères gauche */}
      <rect x="0" y="0" width="140" height="320" fill="url(#shelfWood)" />
      <rect x="6" y="20" width="128" height="200" fill="url(#bookRow)" />
      {/* Planches */}
      <rect x="0" y="20" width="140" height="4" fill="#1a0e08" />
      <rect x="0" y="60" width="140" height="4" fill="#1a0e08" />
      <rect x="0" y="100" width="140" height="4" fill="#1a0e08" />
      <rect x="0" y="140" width="140" height="4" fill="#1a0e08" />
      <rect x="0" y="180" width="140" height="4" fill="#1a0e08" />
      <rect x="0" y="220" width="140" height="4" fill="#1a0e08" />

      {/* Étagères droite */}
      <rect x="660" y="0" width="140" height="320" fill="url(#shelfWood)" />
      <rect x="666" y="20" width="128" height="200" fill="url(#bookRow)" />
      <rect x="660" y="20" width="140" height="4" fill="#1a0e08" />
      <rect x="660" y="60" width="140" height="4" fill="#1a0e08" />
      <rect x="660" y="100" width="140" height="4" fill="#1a0e08" />
      <rect x="660" y="140" width="140" height="4" fill="#1a0e08" />
      <rect x="660" y="180" width="140" height="4" fill="#1a0e08" />
      <rect x="660" y="220" width="140" height="4" fill="#1a0e08" />

      {/* Colonnes / encadrement */}
      <rect x="140" y="0" width="14" height="320" fill="#0a0a06" />
      <rect x="646" y="0" width="14" height="320" fill="#0a0a06" />

      {/* Bureau massif au centre */}
      <rect x="200" y="280" width="400" height="50" fill="url(#deskWood)" />
      <rect x="200" y="280" width="400" height="6" fill="#7a5a2c" />
      {/* Pieds du bureau */}
      <rect x="206" y="328" width="16" height="50" fill="#2a1a0c" />
      <rect x="578" y="328" width="16" height="50" fill="#2a1a0c" />

      {/* Piles de dossiers sur le bureau */}
      <g>
        <rect x="220" y="252" width="40" height="28" fill="#d8c8a0" stroke="#5a4020" strokeWidth="1" />
        <rect x="222" y="248" width="40" height="6" fill="#a88840" />
        <rect x="225" y="244" width="40" height="6" fill="#c8a868" />
        <rect x="228" y="240" width="40" height="6" fill="#a88840" />
      </g>
      <g>
        <rect x="540" y="248" width="44" height="32" fill="#c8b890" stroke="#5a4020" strokeWidth="1" />
        <rect x="538" y="244" width="44" height="6" fill="#8a6830" />
        <rect x="536" y="240" width="44" height="6" fill="#c8a868" />
      </g>
      {/* Petits papiers qui dépassent */}
      <rect x="280" y="270" width="30" height="10" fill="#f4ecd4" transform="rotate(-4 295 275)" />
      <rect x="500" y="272" width="26" height="8" fill="#e8e0c8" transform="rotate(3 513 276)" />

      {/* Tampon officiel sur le bureau */}
      <rect x="380" y="260" width="14" height="14" fill="#3a2a14" />
      <rect x="376" y="270" width="22" height="6" fill="#5a3a20" />
      <rect x="374" y="274" width="26" height="4" fill="#1a1010" />

      {/* Lampes de bureau (vert occulte) */}
      <g>
        <rect x="260" y="220" width="3" height="40" fill="#3a3a3a" />
        <ellipse cx="261" cy="218" rx="14" ry="6" fill="#1a3a2a" />
        <ellipse cx="261" cy="218" rx="10" ry="3" fill="#88ff88" opacity="0.8" />
        <circle cx="261" cy="232" r="32" fill="url(#lampGlow)" />
      </g>
      <g>
        <rect x="540" y="220" width="3" height="40" fill="#3a3a3a" />
        <ellipse cx="541" cy="218" rx="14" ry="6" fill="#1a3a2a" />
        <ellipse cx="541" cy="218" rx="10" ry="3" fill="#88ff88" opacity="0.8" />
        <circle cx="541" cy="232" r="32" fill="url(#lampGlow)" />
      </g>

      {/* Bougies au sol */}
      <g>
        <rect x="170" y="346" width="6" height="20" fill="#e8e0c0" />
        <ellipse cx="173" cy="342" rx="3" ry="6" fill="#ffaa44">
          <animate attributeName="ry" values="6;7;5;6" dur="0.8s" repeatCount="indefinite" />
        </ellipse>
        <circle cx="173" cy="342" r="14" fill="url(#lampGlow)" />
      </g>
      <g>
        <rect x="624" y="346" width="6" height="20" fill="#e8e0c0" />
        <ellipse cx="627" cy="342" rx="3" ry="6" fill="#ffaa44">
          <animate attributeName="ry" values="6;5;7;6" dur="0.9s" repeatCount="indefinite" />
        </ellipse>
        <circle cx="627" cy="342" r="14" fill="url(#lampGlow)" />
      </g>

      {/* Particules de poussière / papier qui flottent */}
      <g opacity="0.4">
        <circle cx="180" cy="60" r="1.5" fill="#fff4c8">
          <animate attributeName="cy" values="60;30;60" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="620" cy="80" r="1" fill="#fff4c8">
          <animate attributeName="cy" values="80;50;80" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="300" cy="160" r="1.5" fill="#88ff88">
          <animate attributeName="cy" values="160;130;160" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="500" cy="180" r="1" fill="#88ff88">
          <animate attributeName="cy" values="180;150;180" dur="6s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Halo central sur le sol — d'où émerge le boss */}
      <ellipse cx="400" cy="340" rx="180" ry="20" fill="#88ff88" opacity="0.18" />
    </svg>
  );
}
