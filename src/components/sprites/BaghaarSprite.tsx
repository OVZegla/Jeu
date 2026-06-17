// Chaman orc — peau brune, tresses, totem-bâton, foudre violette.
export function BaghaarSprite() {
  return (
    <svg viewBox="0 0 140 180" className="sprite-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="orcAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#88ff88" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#88ff88" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9a7050" />
          <stop offset="100%" stopColor="#5a3a26" />
        </linearGradient>
        <linearGradient id="robe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a5a4a" />
          <stop offset="50%" stopColor="#243828" />
          <stop offset="100%" stopColor="#142018" />
        </linearGradient>
        <linearGradient id="totem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a06030" />
          <stop offset="100%" stopColor="#503018" />
        </linearGradient>
      </defs>

      {/* Aura chamanique */}
      <ellipse cx="70" cy="100" rx="60" ry="70" fill="url(#orcAura)" />

      {/* Cape épaisse */}
      <path d="M 32 64 Q 24 120, 40 168 L 56 166 Q 50 110, 58 64 Z" fill="#1a2820" />
      <path d="M 108 64 Q 116 120, 100 168 L 84 166 Q 90 110, 82 64 Z" fill="#1a2820" />

      {/* Cou */}
      <rect x="62" y="50" width="16" height="10" fill="url(#skin)" />

      {/* Tête plus large */}
      <ellipse cx="70" cy="40" rx="20" ry="18" fill="url(#skin)" />

      {/* Cheveux noirs en tresses */}
      <path d="M 50 38 Q 46 18, 70 16 Q 94 18, 90 38 L 90 28 Q 70 22, 50 28 Z" fill="#1a1812" />
      {/* Tresses qui tombent */}
      <ellipse cx="48" cy="60" rx="4" ry="14" fill="#1a1812" />
      <ellipse cx="92" cy="60" rx="4" ry="14" fill="#1a1812" />
      <circle cx="48" cy="74" r="3" fill="#a06030" />
      <circle cx="92" cy="74" r="3" fill="#a06030" />

      {/* Oreilles orc pointues */}
      <path d="M 50 40 L 44 36 L 50 50 Z" fill="url(#skin)" />
      <path d="M 90 40 L 96 36 L 90 50 Z" fill="url(#skin)" />

      {/* Défenses (tusks) */}
      <path d="M 64 48 L 62 56 L 65 56 Z" fill="#f4ecd4" />
      <path d="M 76 48 L 78 56 L 75 56 Z" fill="#f4ecd4" />

      {/* Yeux jaunes */}
      <ellipse cx="62" cy="40" rx="2" ry="2.4" fill="#3a2010" />
      <ellipse cx="78" cy="40" rx="2" ry="2.4" fill="#3a2010" />
      <ellipse cx="62" cy="40" rx="1" ry="1.2" fill="#fff4a0" />
      <ellipse cx="78" cy="40" rx="1" ry="1.2" fill="#fff4a0" />

      {/* Sourcils épais */}
      <rect x="56" y="33" width="11" height="2" fill="#1a1812" />
      <rect x="73" y="33" width="11" height="2" fill="#1a1812" />

      {/* Torse / robe chaman */}
      <path d="M 38 60 Q 32 100, 38 130 L 102 130 Q 108 100, 102 60 L 70 56 Z" fill="url(#robe)" />

      {/* Bordures tribales */}
      <path d="M 38 60 L 70 56 L 102 60 L 96 66 L 70 62 L 44 66 Z" fill="#88a070" />
      <path d="M 42 100 L 98 100 L 96 106 L 44 106 Z" fill="#5a8060" opacity="0.8" />

      {/* Plastron occulte (rune) */}
      <circle cx="70" cy="86" r="9" fill="#0a1a0e" stroke="#88ff88" strokeWidth="1.4" />
      <path d="M 65 81 L 75 91 M 75 81 L 65 91" stroke="#88ff88" strokeWidth="1.4" />

      {/* Épaulières fourrure */}
      <ellipse cx="32" cy="70" rx="14" ry="11" fill="#3a2a1a" />
      <ellipse cx="32" cy="66" rx="12" ry="6" fill="#5a4a30" />
      <ellipse cx="108" cy="70" rx="14" ry="11" fill="#3a2a1a" />
      <ellipse cx="108" cy="66" rx="12" ry="6" fill="#5a4a30" />

      {/* Bras gauche */}
      <rect x="20" y="80" width="14" height="40" rx="5" fill="url(#skin)" />
      <rect x="18" y="118" width="18" height="6" rx="2" fill="#3a2a1a" />

      {/* Bras droit + bâton totem */}
      <rect x="106" y="80" width="14" height="40" rx="5" fill="url(#skin)" />
      {/* Bâton */}
      <rect x="116" y="24" width="6" height="100" fill="url(#totem)" />
      {/* Crâne au sommet */}
      <ellipse cx="119" cy="24" rx="9" ry="11" fill="#e8e0c8" />
      <ellipse cx="115" cy="24" rx="2" ry="3" fill="#1a1a1a" />
      <ellipse cx="123" cy="24" rx="2" ry="3" fill="#1a1a1a" />
      <path d="M 117 30 L 117 33 M 119 30 L 119 34 M 121 30 L 121 33" stroke="#1a1a1a" strokeWidth="1" />
      {/* Plumes accrochées */}
      <path d="M 116 36 Q 108 44, 110 56" stroke="#88ff88" strokeWidth="2" fill="none" />
      <path d="M 122 36 Q 130 44, 128 56" stroke="#aa66ff" strokeWidth="2" fill="none" />
      {/* Petit éclair sur le bâton */}
      <path d="M 119 50 L 117 56 L 120 56 L 118 64" stroke="#aa66ff" strokeWidth="1.6" fill="none" strokeLinejoin="round" />

      {/* Jambes */}
      <path d="M 46 130 L 52 170 L 64 170 L 66 130 Z" fill="#243828" />
      <path d="M 74 130 L 76 170 L 88 170 L 94 130 Z" fill="#243828" />
      <rect x="48" y="162" width="20" height="10" rx="2" fill="#3a2a1a" />
      <rect x="72" y="162" width="20" height="10" rx="2" fill="#3a2a1a" />
    </svg>
  );
}
