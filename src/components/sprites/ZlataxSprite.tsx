// Chasseur de démon — silhouette agile, capuche sombre, deux lames courbes, énergie violette.
export function ZlataxSprite() {
  return (
    <svg viewBox="0 0 140 180" className="sprite-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="demonAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#aa44ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#aa44ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cloak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a1a4a" />
          <stop offset="50%" stopColor="#1a0a26" />
          <stop offset="100%" stopColor="#0a0410" />
        </linearGradient>
        <linearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a1a26" />
          <stop offset="50%" stopColor="#aa44ff" />
          <stop offset="100%" stopColor="#1a1a26" />
        </linearGradient>
        <linearGradient id="bodySuit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1a3a" />
          <stop offset="100%" stopColor="#0e0618" />
        </linearGradient>
      </defs>

      {/* Aura démoniaque */}
      <ellipse cx="70" cy="100" rx="56" ry="68" fill="url(#demonAura)" />

      {/* Cape qui flotte */}
      <path d="M 36 56 Q 18 110, 32 168 L 56 162 Q 48 110, 58 60 Z" fill="url(#cloak)" />
      <path d="M 104 56 Q 122 110, 108 168 L 84 162 Q 92 110, 82 60 Z" fill="url(#cloak)" />

      {/* Capuche large */}
      <path d="M 44 56 Q 38 18, 70 14 Q 102 18, 96 56 L 92 60 L 48 60 Z" fill="#0a0410" />
      <path d="M 50 56 Q 46 32, 70 26 Q 94 32, 90 56 Z" fill="#1a0a26" />

      {/* Visage dans l'ombre */}
      <ellipse cx="70" cy="44" rx="13" ry="14" fill="#3a2a3a" />
      <path d="M 57 42 Q 70 38, 83 42 L 83 50 Q 70 52, 57 50 Z" fill="#1a0a18" opacity="0.6" />

      {/* Yeux luisants violets */}
      <ellipse cx="64" cy="42" rx="2.2" ry="3" fill="#ff44ff" />
      <ellipse cx="76" cy="42" rx="2.2" ry="3" fill="#ff44ff" />
      <ellipse cx="64" cy="42" rx="0.8" ry="1.2" fill="#fff" />
      <ellipse cx="76" cy="42" rx="0.8" ry="1.2" fill="#fff" />

      {/* Cornes qui dépassent de la capuche */}
      <path d="M 50 24 Q 44 12, 52 8 L 56 16 Z" fill="#1a0a18" />
      <path d="M 90 24 Q 96 12, 88 8 L 84 16 Z" fill="#1a0a18" />

      {/* Cou */}
      <rect x="64" y="56" width="12" height="6" fill="#3a2a3a" />

      {/* Torse fin — combinaison ajustée */}
      <path d="M 50 60 Q 44 100, 50 128 L 90 128 Q 96 100, 90 60 L 70 58 Z" fill="url(#bodySuit)" />

      {/* Sangles en X */}
      <path d="M 50 70 L 90 110 M 90 70 L 50 110" stroke="#5a3a6a" strokeWidth="2.5" />

      {/* Glyphe lumineux centre */}
      <circle cx="70" cy="92" r="6" fill="none" stroke="#aa44ff" strokeWidth="1.5" />
      <circle cx="70" cy="92" r="2" fill="#ff44ff" />

      {/* Bras gauche */}
      <rect x="36" y="76" width="11" height="40" rx="4" fill="#1a0a18" />
      <rect x="35" y="114" width="13" height="6" rx="2" fill="#5a3a6a" />

      {/* Bras droit */}
      <rect x="93" y="76" width="11" height="40" rx="4" fill="#1a0a18" />
      <rect x="92" y="114" width="13" height="6" rx="2" fill="#5a3a6a" />

      {/* Lame gauche (warglaive courbe) */}
      <path d="M 32 116 Q 12 100, 6 70 Q 14 92, 30 100 Q 24 108, 32 116 Z" fill="url(#bladeGrad)" />
      <path d="M 6 70 Q 14 80, 22 80" stroke="#ff66ff" strokeWidth="0.8" fill="none" opacity="0.8" />

      {/* Lame droite */}
      <path d="M 108 116 Q 128 100, 134 70 Q 126 92, 110 100 Q 116 108, 108 116 Z" fill="url(#bladeGrad)" />
      <path d="M 134 70 Q 126 80, 118 80" stroke="#ff66ff" strokeWidth="0.8" fill="none" opacity="0.8" />

      {/* Jambes serrées */}
      <path d="M 54 128 L 58 168 L 68 168 L 68 128 Z" fill="#0e0618" />
      <path d="M 72 128 L 72 168 L 82 168 L 86 128 Z" fill="#0e0618" />
      <rect x="54" y="162" width="16" height="10" rx="2" fill="#1a0a18" />
      <rect x="70" y="162" width="16" height="10" rx="2" fill="#1a0a18" />

      {/* Petites flammes violettes au sol */}
      <ellipse cx="56" cy="172" rx="6" ry="2" fill="#aa44ff" opacity="0.5" />
      <ellipse cx="84" cy="172" rx="6" ry="2" fill="#aa44ff" opacity="0.5" />
    </svg>
  );
}
