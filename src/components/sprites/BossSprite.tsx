// Le Champion des Collectivités Territoriales — costume sombre, écharpe tricolore corrompue,
// décret dans une main, tampon dans l'autre, livres maudits flottants, aura verte.

interface Props {
  enraged: boolean;
}

export function BossSprite({ enraged }: Props) {
  const auraColor = enraged ? '#aa44ff' : '#88ff88';
  const eyeColor = enraged ? '#ff44aa' : '#aaffaa';

  return (
    <svg viewBox="0 0 240 320" className="sprite-svg boss-sprite-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="bossAura2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={auraColor} stopOpacity="0.55" />
          <stop offset="100%" stopColor={auraColor} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bossSuit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2a36" />
          <stop offset="50%" stopColor="#16161e" />
          <stop offset="100%" stopColor="#0a0a10" />
        </linearGradient>
        <linearGradient id="sashBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a4a8a" />
          <stop offset="100%" stopColor="#16284a" />
        </linearGradient>
        <linearGradient id="sashWhite" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c8d4d0" />
          <stop offset="100%" stopColor="#8a948c" />
        </linearGradient>
        <linearGradient id="sashRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8a2030" />
          <stop offset="100%" stopColor="#4a101a" />
        </linearGradient>
        <linearGradient id="bookSpine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a2020" />
          <stop offset="100%" stopColor="#2a0808" />
        </linearGradient>
      </defs>

      {/* Aura massive */}
      <ellipse cx="120" cy="200" rx="120" ry="120" fill="url(#bossAura2)" />
      <ellipse cx="120" cy="200" rx="80" ry="80" fill="url(#bossAura2)" />

      {/* Cape / pans de costume */}
      <path d="M 50 110 Q 30 220, 50 300 L 90 296 Q 80 200, 88 110 Z" fill="#0a0a10" />
      <path d="M 190 110 Q 210 220, 190 300 L 150 296 Q 160 200, 152 110 Z" fill="#0a0a10" />

      {/* Tête */}
      <ellipse cx="120" cy="74" rx="28" ry="32" fill="#a89070" />

      {/* Chapeau haut-de-forme cassé */}
      <ellipse cx="120" cy="44" rx="36" ry="6" fill="#0a0a10" />
      <path d="M 92 44 L 96 12 Q 120 4, 144 12 L 148 44 Z" fill="#16161e" />
      <path d="M 98 14 L 100 40 L 140 40 L 142 14 Z" fill="#0a0a10" opacity="0.6" />
      {/* Ruban du chapeau */}
      <rect x="92" y="36" width="56" height="6" fill="#3a0a14" />
      {/* Bord déchiré */}
      <path d="M 88 44 L 152 44 L 150 48 L 138 46 L 130 50 L 120 46 L 108 50 L 96 46 Z" fill="#0a0a10" />

      {/* Cheveux gris en mèches */}
      <path d="M 92 60 Q 88 78, 94 96 L 100 88 Z" fill="#6a6a6a" />
      <path d="M 148 60 Q 152 78, 146 96 L 140 88 Z" fill="#6a6a6a" />

      {/* Yeux brillants */}
      <ellipse cx="108" cy="76" rx="5" ry="3.5" fill="#0a0a10" />
      <ellipse cx="132" cy="76" rx="5" ry="3.5" fill="#0a0a10" />
      <circle cx="108" cy="76" r="2.5" fill={eyeColor}>
        <animate attributeName="r" values="2;3;2" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="132" cy="76" r="2.5" fill={eyeColor}>
        <animate attributeName="r" values="2;3;2" dur="1.6s" repeatCount="indefinite" />
      </circle>

      {/* Sourcils froncés */}
      <path d="M 100 68 L 116 71" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 140 68 L 124 71" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />

      {/* Moustache */}
      <path d="M 105 92 Q 120 96, 135 92 Q 130 100, 120 100 Q 110 100, 105 92 Z" fill="#3a3a3a" />

      {/* Cou + col blanc */}
      <rect x="113" y="104" width="14" height="12" fill="#a89070" />
      <path d="M 100 116 L 120 110 L 140 116 L 140 124 L 100 124 Z" fill="#d8d4c8" />
      {/* Nœud de cravate */}
      <path d="M 116 116 L 124 116 L 122 128 L 118 128 Z" fill="#3a0a14" />

      {/* Costume (épaules + torse) */}
      <path d="M 60 122 Q 50 180, 60 240 L 180 240 Q 190 180, 180 122 L 140 116 L 120 118 L 100 116 Z" fill="url(#bossSuit)" />

      {/* Écharpe tricolore corrompue (bleu-blanc-rouge avec lueur verte) */}
      <path d="M 80 130 L 90 240 L 96 240 L 86 130 Z" fill="url(#sashBlue)" />
      <path d="M 86 130 L 96 240 L 102 240 L 92 130 Z" fill="url(#sashWhite)" />
      <path d="M 92 130 L 102 240 L 108 240 L 98 130 Z" fill="url(#sashRed)" />
      {/* Aura corrompue sur l'écharpe */}
      <path d="M 78 134 L 110 134 L 110 138 L 78 138 Z" fill={auraColor} opacity="0.35" />

      {/* Boutons dorés du costume */}
      <circle cx="130" cy="150" r="2.5" fill="#c8a040" />
      <circle cx="130" cy="170" r="2.5" fill="#c8a040" />
      <circle cx="130" cy="190" r="2.5" fill="#c8a040" />
      <circle cx="130" cy="210" r="2.5" fill="#c8a040" />

      {/* Médaille officielle */}
      <circle cx="155" cy="160" r="10" fill="#c8a040" stroke="#0a0a10" strokeWidth="1.5" />
      <path d="M 150 156 L 154 162 L 160 154" stroke="#0a0a10" strokeWidth="1.5" fill="none" />

      {/* Bras gauche tenant un décret (parchemin) */}
      <rect x="40" y="140" width="20" height="80" rx="6" fill="#16161e" />
      <rect x="36" y="216" width="28" height="10" rx="3" fill="#a89070" />
      {/* Parchemin roulé */}
      <rect x="20" y="200" width="40" height="32" rx="3" fill="#e0d4a8" />
      <rect x="20" y="200" width="40" height="6" fill="#a88840" />
      <rect x="20" y="226" width="40" height="6" fill="#a88840" />
      <path d="M 28 212 L 52 212 M 28 218 L 50 218 M 28 224 L 48 224" stroke="#3a2a14" strokeWidth="1" />
      {/* Sceau rouge */}
      <circle cx="48" cy="220" r="4" fill="#8a2030" />

      {/* Bras droit tenant un tampon officiel */}
      <rect x="180" y="140" width="20" height="80" rx="6" fill="#16161e" />
      <rect x="176" y="216" width="28" height="10" rx="3" fill="#a89070" />
      {/* Tampon */}
      <rect x="184" y="170" width="14" height="20" fill="#3a2a14" />
      <rect x="180" y="186" width="22" height="8" fill="#5a3a20" />
      <rect x="178" y="192" width="26" height="6" fill="#1a1010" />
      <text x="191" y="198" fontSize="6" fill={auraColor} textAnchor="middle" fontFamily="serif" fontWeight="bold">§</text>

      {/* Jambes / pantalon de costume */}
      <path d="M 80 240 L 88 310 L 110 310 L 116 240 Z" fill="#0a0a10" />
      <path d="M 124 240 L 130 310 L 152 310 L 160 240 Z" fill="#0a0a10" />
      {/* Chaussures cirées */}
      <ellipse cx="98" cy="312" rx="14" ry="5" fill="#1a1010" />
      <ellipse cx="142" cy="312" rx="14" ry="5" fill="#1a1010" />

      {/* Livres flottants autour */}
      <g>
        <rect x="14" y="120" width="20" height="26" rx="2" fill="url(#bookSpine)" stroke="#c8a040" strokeWidth="1">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -8; 0 0" dur="3.4s" repeatCount="indefinite" />
        </rect>
        <rect x="206" y="140" width="20" height="26" rx="2" fill="url(#bookSpine)" stroke="#c8a040" strokeWidth="1">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -10; 0 0" dur="4s" repeatCount="indefinite" />
        </rect>
        <rect x="18" y="180" width="16" height="22" rx="2" fill="url(#bookSpine)" stroke="#c8a040" strokeWidth="1">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -6; 0 0" dur="2.8s" repeatCount="indefinite" />
        </rect>
        <rect x="210" y="200" width="16" height="22" rx="2" fill="url(#bookSpine)" stroke="#c8a040" strokeWidth="1">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -8; 0 0" dur="3.2s" repeatCount="indefinite" />
        </rect>
        <rect x="6" y="240" width="18" height="22" rx="2" fill="url(#bookSpine)" stroke="#c8a040" strokeWidth="1">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -5; 0 0" dur="3.6s" repeatCount="indefinite" />
        </rect>
      </g>

      {/* Particules vertes/violettes flottantes */}
      <circle cx="60" cy="60" r="2" fill={auraColor} opacity="0.7">
        <animate attributeName="cy" values="60;30;60" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="180" cy="80" r="1.5" fill={auraColor} opacity="0.6">
        <animate attributeName="cy" values="80;50;80" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="40" cy="170" r="2" fill={auraColor} opacity="0.5">
        <animate attributeName="cy" values="170;140;170" dur="3.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="200" cy="190" r="1.5" fill={auraColor} opacity="0.7">
        <animate attributeName="cy" values="190;160;190" dur="2.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
