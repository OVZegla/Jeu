// Paladin elfe — armure rouge & or, épée et bouclier, halo doré.
export function DatpaloofSprite() {
  return (
    <svg viewBox="0 0 140 180" className="sprite-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff4c8" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#fff4c8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="armorRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c43a3a" />
          <stop offset="50%" stopColor="#8b1a1a" />
          <stop offset="100%" stopColor="#5a0e0e" />
        </linearGradient>
        <linearGradient id="goldTrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4e08c" />
          <stop offset="100%" stopColor="#a8862a" />
        </linearGradient>
        <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fae8a8" />
          <stop offset="100%" stopColor="#b89148" />
        </linearGradient>
      </defs>

      {/* Halo */}
      <ellipse cx="70" cy="22" rx="34" ry="14" fill="url(#haloGrad)" />
      <ellipse cx="70" cy="22" rx="24" ry="3" fill="none" stroke="#f4e08c" strokeWidth="1" opacity="0.7" />

      {/* Cape arrière */}
      <path d="M 38 60 Q 30 110, 36 158 L 56 156 Q 50 100, 56 62 Z" fill="#3a0a0a" />
      <path d="M 102 60 Q 110 110, 104 158 L 84 156 Q 90 100, 84 62 Z" fill="#3a0a0a" />

      {/* Cou + tête */}
      <rect x="63" y="48" width="14" height="8" fill="#f0d4a8" />
      <ellipse cx="70" cy="38" rx="16" ry="18" fill="#f0d4a8" />

      {/* Oreilles pointues d'elfe */}
      <path d="M 54 38 L 48 32 L 56 42 Z" fill="#f0d4a8" />
      <path d="M 86 38 L 92 32 L 84 42 Z" fill="#f0d4a8" />

      {/* Cheveux blonds */}
      <path d="M 52 38 Q 46 10, 70 14 Q 94 10, 88 38 L 90 50 Q 88 48, 84 48 L 56 48 Q 52 48, 50 50 Z" fill="url(#hairGrad)" />
      <path d="M 88 38 Q 96 60, 92 90 L 86 88 Q 88 60, 84 42 Z" fill="url(#hairGrad)" />
      <path d="M 52 38 Q 44 60, 48 90 L 54 88 Q 52 60, 56 42 Z" fill="url(#hairGrad)" />

      {/* Yeux */}
      <ellipse cx="63" cy="38" rx="1.6" ry="2.2" fill="#1a1a2a" />
      <ellipse cx="77" cy="38" rx="1.6" ry="2.2" fill="#1a1a2a" />
      {/* Bouche sérieuse */}
      <path d="M 65 46 Q 70 48, 75 46" stroke="#7a3a3a" strokeWidth="1" fill="none" strokeLinecap="round" />

      {/* Torse / armure */}
      <path d="M 38 60 Q 32 95, 38 124 L 102 124 Q 108 95, 102 60 L 70 56 Z" fill="url(#armorRed)" />

      {/* Trim doré */}
      <path d="M 38 60 L 70 56 L 102 60 L 96 64 L 70 60 L 44 64 Z" fill="url(#goldTrim)" />
      <rect x="40" y="100" width="60" height="4" fill="url(#goldTrim)" />

      {/* Croix sacrée sur le plastron */}
      <rect x="67" y="78" width="6" height="22" fill="url(#goldTrim)" />
      <rect x="60" y="85" width="20" height="6" fill="url(#goldTrim)" />

      {/* Épaulières */}
      <ellipse cx="32" cy="68" rx="14" ry="10" fill="#5a0e0e" />
      <ellipse cx="32" cy="64" rx="10" ry="6" fill="url(#goldTrim)" />
      <ellipse cx="108" cy="68" rx="14" ry="10" fill="#5a0e0e" />
      <ellipse cx="108" cy="64" rx="10" ry="6" fill="url(#goldTrim)" />

      {/* Bras gauche (bouclier) */}
      <rect x="18" y="76" width="14" height="42" rx="4" fill="#6a1212" />
      {/* Bouclier */}
      <ellipse cx="14" cy="100" rx="14" ry="20" fill="#5a0e0e" />
      <ellipse cx="14" cy="100" rx="11" ry="16" fill="#8b1a1a" />
      <rect x="12" y="84" width="4" height="32" fill="url(#goldTrim)" />
      <rect x="4" y="98" width="20" height="4" fill="url(#goldTrim)" />
      <circle cx="14" cy="100" r="3" fill="url(#goldTrim)" />

      {/* Bras droit (épée) */}
      <rect x="108" y="76" width="14" height="42" rx="4" fill="#6a1212" />
      {/* Épée tenue vers le haut */}
      <rect x="118" y="30" width="4" height="60" fill="#e4e4e4" />
      <rect x="116" y="28" width="8" height="3" fill="#c0c0c0" />
      <rect x="112" y="88" width="16" height="4" fill="url(#goldTrim)" />
      <rect x="118" y="92" width="4" height="10" fill="#3a2a1a" />
      <circle cx="120" cy="103" r="3" fill="url(#goldTrim)" />

      {/* Jambes / cuissardes */}
      <path d="M 46 124 L 52 168 L 64 168 L 66 124 Z" fill="#4a0c0c" />
      <path d="M 74 124 L 76 168 L 88 168 L 94 124 Z" fill="#4a0c0c" />
      <rect x="48" y="160" width="20" height="10" rx="2" fill="#2a0606" />
      <rect x="72" y="160" width="20" height="10" rx="2" fill="#2a0606" />

      {/* Reflet brillant sur l'armure */}
      <path d="M 50 70 L 58 70 L 56 110 L 50 110 Z" fill="#ff8866" opacity="0.18" />
    </svg>
  );
}
