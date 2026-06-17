// Génération de textures pixel-art au runtime.
// Chaque sprite est dessiné dans un canvas à basse résolution (32x48 ou 64x80)
// puis ajouté comme texture Phaser. Phaser scale en NEAREST → pixel-art crisp.

type Ctx = CanvasRenderingContext2D;

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return c;
}

function px(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// === DATPALOOF — paladin, armure rouge & or, bouclier+épée ===

function drawDatpaloof(ctx: Ctx, frame: 'idle' | 'idle2' | 'attack' | 'hit') {
  const bob = frame === 'idle2' ? 1 : 0;
  const lunge = frame === 'attack' ? -4 : 0;
  const flash = frame === 'hit';
  const off = bob + lunge;

  // Cape qui dépasse derrière
  px(ctx, 14, 22 + off, 4, 26, '#3a0a0a');
  px(ctx, 30, 22 + off, 4, 26, '#3a0a0a');

  // Tête
  px(ctx, 18, 4 + off, 12, 12, '#f0d4a8');
  // Oreilles pointues d'elfe
  px(ctx, 16, 8 + off, 2, 4, '#f0d4a8');
  px(ctx, 30, 8 + off, 2, 4, '#f0d4a8');

  // Cheveux blonds
  px(ctx, 16, 2 + off, 16, 4, '#e8c46c');
  px(ctx, 16, 4 + off, 2, 10, '#e8c46c');
  px(ctx, 30, 4 + off, 2, 10, '#e8c46c');
  px(ctx, 18, 4 + off, 12, 2, '#f4dc88');

  // Yeux
  px(ctx, 20, 8 + off, 2, 2, '#1a1a2a');
  px(ctx, 26, 8 + off, 2, 2, '#1a1a2a');

  // Cou
  px(ctx, 22, 16 + off, 4, 2, '#f0d4a8');

  // Armure rouge — torse
  px(ctx, 14, 18 + off, 20, 18, flash ? '#ff4040' : '#8b1a1a');
  // Ombre / volume
  px(ctx, 30, 18 + off, 4, 18, '#5a0e0e');
  // Trim doré
  px(ctx, 14, 18 + off, 20, 2, '#e8c46c');
  px(ctx, 14, 34 + off, 20, 2, '#c8a040');
  // Croix sacrée
  px(ctx, 22, 22 + off, 4, 10, '#e8c46c');
  px(ctx, 18, 24 + off, 12, 4, '#e8c46c');

  // Épaulières
  px(ctx, 12, 18 + off, 4, 4, '#c8a040');
  px(ctx, 32, 18 + off, 4, 4, '#c8a040');

  // Bras gauche + bouclier
  px(ctx, 10, 22 + off, 4, 12, '#5a0e0e');
  // Bouclier rond
  px(ctx, 4, 24 + off, 8, 12, '#5a0e0e');
  px(ctx, 6, 22 + off, 4, 16, '#5a0e0e');
  px(ctx, 6, 28 + off, 4, 4, '#e8c46c');
  px(ctx, 4, 30 + off, 8, 2, '#e8c46c');

  // Bras droit + épée
  px(ctx, 34, 22 + off, 4, 12, '#5a0e0e');
  // Lame épée — montée à la verticale ou pointée si attack
  if (frame === 'attack') {
    // Épée horizontale (estafilade)
    px(ctx, 38, 24 + off, 12, 2, '#fff');
    px(ctx, 38, 26 + off, 12, 2, '#cfcfcf');
    px(ctx, 36, 22 + off, 2, 6, '#c8a040');
    // Flash blanc sur lame
    px(ctx, 44, 23 + off, 4, 4, '#ffffaa');
  } else {
    px(ctx, 36, 4 + off, 4, 22, '#cfcfcf');
    px(ctx, 36, 6 + off, 2, 20, '#fff');
    px(ctx, 34, 26 + off, 8, 2, '#c8a040');
    px(ctx, 36, 28 + off, 4, 4, '#3a2a1a');
  }

  // Jambes / pantalon
  px(ctx, 16, 36 + off, 6, 14, '#3a0a0a');
  px(ctx, 26, 36 + off, 6, 14, '#3a0a0a');
  // Bottes
  px(ctx, 14, 48 + off, 10, 4, '#1a0606');
  px(ctx, 24, 48 + off, 10, 4, '#1a0606');

  // Reflet brillant central
  if (!flash) {
    px(ctx, 18, 22 + off, 2, 8, '#c43a3a');
  }
}

// === BAGHAAR — chaman orc, peau verte/brune, totem-bâton ===

function drawBaghaar(ctx: Ctx, frame: 'idle' | 'idle2' | 'attack' | 'hit') {
  const bob = frame === 'idle2' ? 1 : 0;
  const lunge = frame === 'attack' ? -3 : 0;
  const flash = frame === 'hit';
  const off = bob + lunge;
  const skin = flash ? '#a08040' : '#7a5630';
  const skinDark = flash ? '#604020' : '#4a3018';

  // Cape de fourrure
  px(ctx, 12, 22 + off, 4, 24, '#1a2820');
  px(ctx, 32, 22 + off, 4, 24, '#1a2820');

  // Tête
  px(ctx, 17, 4 + off, 14, 12, skin);
  px(ctx, 31, 6 + off, 1, 6, skinDark);

  // Cheveux noirs
  px(ctx, 17, 2 + off, 14, 3, '#1a1812');
  px(ctx, 15, 4 + off, 2, 6, '#1a1812');
  px(ctx, 31, 4 + off, 2, 6, '#1a1812');
  // Tresses qui pendent
  px(ctx, 15, 10 + off, 2, 10, '#1a1812');
  px(ctx, 31, 10 + off, 2, 10, '#1a1812');
  px(ctx, 14, 18 + off, 4, 2, '#a06030');
  px(ctx, 30, 18 + off, 4, 2, '#a06030');

  // Oreilles pointues
  px(ctx, 15, 8 + off, 2, 3, skin);
  px(ctx, 31, 8 + off, 2, 3, skin);

  // Yeux jaunes
  px(ctx, 19, 8 + off, 2, 2, '#3a2010');
  px(ctx, 26, 8 + off, 2, 2, '#3a2010');
  px(ctx, 19, 9 + off, 1, 1, '#fff4a0');
  px(ctx, 26, 9 + off, 1, 1, '#fff4a0');

  // Défenses (tusks)
  px(ctx, 21, 14 + off, 1, 2, '#f4ecd4');
  px(ctx, 26, 14 + off, 1, 2, '#f4ecd4');

  // Cou
  px(ctx, 22, 16 + off, 4, 2, skin);

  // Robe chaman — torse
  px(ctx, 14, 18 + off, 20, 18, flash ? '#5a8060' : '#2a4030');
  px(ctx, 30, 18 + off, 4, 18, '#162018');
  // Bordure tribale
  px(ctx, 14, 18 + off, 20, 2, '#88a070');
  px(ctx, 14, 34 + off, 20, 2, '#5a8060');
  // Rune verte centrale
  px(ctx, 22, 24 + off, 4, 4, '#0a1a0e');
  px(ctx, 23, 23 + off, 2, 6, '#88ff88');
  px(ctx, 21, 25 + off, 6, 2, '#88ff88');

  // Épaulières fourrure
  px(ctx, 12, 18 + off, 4, 4, '#3a2a1a');
  px(ctx, 32, 18 + off, 4, 4, '#3a2a1a');

  // Bras gauche
  px(ctx, 10, 22 + off, 4, 12, skin);
  px(ctx, 10, 32 + off, 4, 4, skinDark);

  // Bras droit + bâton totem
  px(ctx, 34, 22 + off, 4, 12, skin);
  // Bâton vertical
  px(ctx, 39, 2 + off, 2, 34, '#5a3818');
  // Crâne au sommet
  px(ctx, 37, 0 + off, 6, 6, '#e8e0c8');
  px(ctx, 38, 2 + off, 1, 2, '#1a1a1a');
  px(ctx, 41, 2 + off, 1, 2, '#1a1a1a');
  // Plume colorée
  px(ctx, 36, 6 + off, 2, 4, '#aa66ff');
  // Éclair magique si attack
  if (frame === 'attack') {
    px(ctx, 38, 12 + off, 2, 2, '#aa66ff');
    px(ctx, 36, 14 + off, 6, 2, '#c084ff');
    px(ctx, 38, 16 + off, 4, 2, '#aa66ff');
    px(ctx, 40, 18 + off, 2, 4, '#aa66ff');
  }

  // Jambes
  px(ctx, 16, 36 + off, 6, 14, '#162018');
  px(ctx, 26, 36 + off, 6, 14, '#162018');
  // Bottes
  px(ctx, 14, 48 + off, 10, 4, '#3a2a1a');
  px(ctx, 24, 48 + off, 10, 4, '#3a2a1a');
}

// === ZLATAX — chasseur de démon, capuche, deux warglaives ===

function drawZlatax(ctx: Ctx, frame: 'idle' | 'idle2' | 'attack' | 'hit') {
  const bob = frame === 'idle2' ? 1 : 0;
  const lunge = frame === 'attack' ? -4 : 0;
  const flash = frame === 'hit';
  const off = bob + lunge;

  // Cape qui flotte
  px(ctx, 10, 18 + off, 4, 30, '#1a0a26');
  px(ctx, 34, 18 + off, 4, 30, '#1a0a26');
  px(ctx, 12, 44 + off, 2, 6, '#3a1a4a');
  px(ctx, 34, 44 + off, 2, 6, '#3a1a4a');

  // Capuche
  px(ctx, 14, 2 + off, 20, 18, '#0a0410');
  px(ctx, 16, 0 + off, 16, 4, '#0a0410');
  // Cornes qui dépassent
  px(ctx, 14, 0 + off, 2, 4, '#1a0a18');
  px(ctx, 32, 0 + off, 2, 4, '#1a0a18');

  // Visage dans l'ombre
  px(ctx, 18, 8 + off, 12, 10, '#2a1a2a');
  px(ctx, 30, 10 + off, 1, 4, '#1a0a18');

  // Yeux violets brillants
  px(ctx, 20, 10 + off, 2, 3, flash ? '#fff' : '#ff44ff');
  px(ctx, 26, 10 + off, 2, 3, flash ? '#fff' : '#ff44ff');
  px(ctx, 21, 11 + off, 0.5, 1, '#fff');
  px(ctx, 27, 11 + off, 0.5, 1, '#fff');

  // Cou
  px(ctx, 22, 18 + off, 4, 2, '#3a2a3a');

  // Combinaison ajustée — torse fin
  px(ctx, 16, 20 + off, 16, 16, flash ? '#7a4a8a' : '#1a0a26');
  px(ctx, 30, 20 + off, 2, 16, '#0a0410');
  // Sangles en X violettes
  px(ctx, 18, 22 + off, 2, 2, '#aa44ff');
  px(ctx, 20, 24 + off, 2, 2, '#aa44ff');
  px(ctx, 22, 26 + off, 2, 2, '#aa44ff');
  px(ctx, 24, 28 + off, 2, 2, '#aa44ff');
  px(ctx, 26, 30 + off, 2, 2, '#aa44ff');
  px(ctx, 28, 22 + off, 2, 2, '#aa44ff');
  px(ctx, 26, 24 + off, 2, 2, '#aa44ff');
  px(ctx, 22, 28 + off, 2, 2, '#aa44ff');
  px(ctx, 20, 30 + off, 2, 2, '#aa44ff');
  // Glyphe central
  px(ctx, 23, 27 + off, 2, 2, '#ff44ff');

  // Bras gauche + warglaive
  px(ctx, 12, 22 + off, 4, 12, '#1a0a26');
  // Lame courbe gauche
  if (frame === 'attack') {
    // Slash horizontal
    px(ctx, 2, 24 + off, 14, 2, '#fff');
    px(ctx, 0, 22 + off, 16, 2, '#ff66ff');
  } else {
    px(ctx, 4, 32 + off, 10, 2, '#3a1a4a');
    px(ctx, 2, 30 + off, 6, 2, '#aa44ff');
    px(ctx, 0, 28 + off, 4, 2, '#aa44ff');
  }

  // Bras droit + warglaive
  px(ctx, 32, 22 + off, 4, 12, '#1a0a26');
  if (frame === 'attack') {
    px(ctx, 32, 24 + off, 14, 2, '#fff');
    px(ctx, 32, 22 + off, 16, 2, '#ff66ff');
  } else {
    px(ctx, 34, 32 + off, 10, 2, '#3a1a4a');
    px(ctx, 40, 30 + off, 6, 2, '#aa44ff');
    px(ctx, 44, 28 + off, 4, 2, '#aa44ff');
  }

  // Jambes serrées
  px(ctx, 18, 36 + off, 5, 14, '#0e0618');
  px(ctx, 25, 36 + off, 5, 14, '#0e0618');
  px(ctx, 16, 48 + off, 9, 4, '#1a0a18');
  px(ctx, 23, 48 + off, 9, 4, '#1a0a18');

  // Petites flammes violettes au sol
  if (frame !== 'hit') {
    px(ctx, 14, 50 + off, 2, 2, '#aa44ff');
    px(ctx, 32, 50 + off, 2, 2, '#aa44ff');
  }
}

// === LE CHAMPION — boss, costume noir, écharpe tricolore, chapeau ===

function drawBoss(ctx: Ctx, frame: 'idle' | 'idle2' | 'attack' | 'hit', enraged: boolean) {
  const bob = frame === 'idle2' ? 2 : 0;
  const lunge = frame === 'attack' ? -6 : 0;
  const flash = frame === 'hit';
  const off = bob + lunge;
  const eyeColor = enraged ? '#ff44aa' : '#88ff88';

  // Aura derrière (large)
  const auraColor = enraged ? '#aa44ff' : '#22aa44';
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = `rgba(${enraged ? '170,68,255' : '34,170,68'},${0.05 + i * 0.02})`;
    ctx.fillRect(20 - i, 20 - i + off, 56 + i * 2, 60 + i * 2);
  }

  // Cape arrière
  px(ctx, 18, 36 + off, 6, 50, '#0a0a10');
  px(ctx, 72, 36 + off, 6, 50, '#0a0a10');

  // Tête
  px(ctx, 30, 8 + off, 36, 28, '#a89070');

  // Chapeau haut-de-forme
  px(ctx, 26, 6 + off, 44, 4, '#0a0a10');
  px(ctx, 30, 0 + off, 36, 6, '#16161e');
  px(ctx, 32, -8 + off, 32, 8, '#16161e');
  // Ruban du chapeau
  px(ctx, 32, -2 + off, 32, 2, '#3a0a14');

  // Cheveux gris sur les côtés
  px(ctx, 28, 14 + off, 4, 14, '#6a6a6a');
  px(ctx, 64, 14 + off, 4, 14, '#6a6a6a');

  // Yeux brillants
  px(ctx, 36, 16 + off, 6, 4, '#0a0a10');
  px(ctx, 54, 16 + off, 6, 4, '#0a0a10');
  px(ctx, 37, 17 + off, 4, 2, eyeColor);
  px(ctx, 55, 17 + off, 4, 2, eyeColor);

  // Sourcils froncés
  px(ctx, 34, 14 + off, 10, 2, '#1a1a1a');
  px(ctx, 52, 14 + off, 10, 2, '#1a1a1a');

  // Moustache
  px(ctx, 36, 26 + off, 24, 2, '#3a3a3a');
  px(ctx, 36, 28 + off, 6, 2, '#3a3a3a');
  px(ctx, 54, 28 + off, 6, 2, '#3a3a3a');

  // Col blanc + cravate
  px(ctx, 38, 36 + off, 20, 4, '#d8d4c8');
  px(ctx, 44, 36 + off, 8, 8, '#3a0a14');

  // Costume / torse
  px(ctx, 24, 38 + off, 48, 40, flash ? '#5a4a6a' : '#16161e');
  px(ctx, 66, 38 + off, 6, 40, '#0a0a10');

  // Écharpe tricolore corrompue (bleu - blanc - rouge avec aura verte)
  px(ctx, 26, 44 + off, 4, 34, '#2a4a8a');
  px(ctx, 30, 44 + off, 4, 34, '#c8d4d0');
  px(ctx, 34, 44 + off, 4, 34, '#8a2030');
  // Aura verte sur l'écharpe
  px(ctx, 26, 44 + off, 12, 2, auraColor);

  // Boutons dorés
  px(ctx, 50, 50 + off, 2, 2, '#c8a040');
  px(ctx, 50, 58 + off, 2, 2, '#c8a040');
  px(ctx, 50, 66 + off, 2, 2, '#c8a040');

  // Médaille officielle
  px(ctx, 58, 50 + off, 6, 6, '#c8a040');
  px(ctx, 60, 52 + off, 2, 2, '#0a0a10');

  // Bras gauche tenant un parchemin
  px(ctx, 18, 42 + off, 8, 30, '#16161e');
  px(ctx, 8, 60 + off, 14, 14, '#e0d4a8');
  px(ctx, 8, 60 + off, 14, 2, '#a88840');
  px(ctx, 8, 72 + off, 14, 2, '#a88840');
  px(ctx, 18, 66 + off, 2, 2, '#8a2030');

  // Bras droit tenant un tampon
  px(ctx, 70, 42 + off, 8, 30, '#16161e');
  if (frame === 'attack') {
    // Tampon en action — frappe vers le bas
    px(ctx, 74, 64 + off, 12, 12, '#3a2a14');
    px(ctx, 70, 76 + off, 20, 4, '#1a1010');
    // Onde de choc
    px(ctx, 64, 80 + off, 32, 2, auraColor);
  } else {
    px(ctx, 76, 50 + off, 8, 12, '#3a2a14');
    px(ctx, 72, 58 + off, 16, 4, '#5a3a20');
    px(ctx, 70, 60 + off, 20, 2, '#1a1010');
  }

  // Jambes de costume
  px(ctx, 32, 78 + off, 14, 30, '#0a0a10');
  px(ctx, 50, 78 + off, 14, 30, '#0a0a10');
  // Chaussures cirées
  px(ctx, 28, 106 + off, 20, 4, '#1a1010');
  px(ctx, 48, 106 + off, 20, 4, '#1a1010');
}

// === Arène pixelisée — bibliothèque administrative maudite ===

function drawArenaBackground(ctx: Ctx, w: number, h: number) {
  // Fond mur sombre vert
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
  wallGrad.addColorStop(0, '#16201a');
  wallGrad.addColorStop(1, '#0a0c0a');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h * 0.7);

  // Sol
  const floorGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
  floorGrad.addColorStop(0, '#1a1610');
  floorGrad.addColorStop(1, '#050402');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // Vitrail central
  const cx = w / 2;
  const cy = h * 0.28;
  const r = h * 0.22;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, '#88ff88');
  grad.addColorStop(0.5, 'rgba(34,170,68,0.5)');
  grad.addColorStop(1, 'rgba(34,170,68,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Croisillons
  ctx.fillStyle = '#0a0a08';
  ctx.fillRect(cx - r * 0.7, cy - 2, r * 1.4, 4);
  ctx.fillRect(cx - 2, cy - r * 0.7, 4, r * 1.4);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = '#22aa44';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Étagères gauche et droite avec livres
  drawBookshelf(ctx, 0, 0, w * 0.18, h * 0.7);
  drawBookshelf(ctx, w * 0.82, 0, w * 0.18, h * 0.7);

  // Colonnes
  ctx.fillStyle = '#0a0a06';
  ctx.fillRect(w * 0.18, 0, 6, h * 0.7);
  ctx.fillRect(w * 0.82 - 6, 0, 6, h * 0.7);

  // Bureau au sol (devant)
  const deskY = h * 0.78;
  const deskGrad = ctx.createLinearGradient(0, deskY, 0, h);
  deskGrad.addColorStop(0, '#5a3a1c');
  deskGrad.addColorStop(1, '#2a1a0c');
  ctx.fillStyle = deskGrad;
  ctx.fillRect(w * 0.22, deskY, w * 0.56, h * 0.08);
  ctx.fillStyle = '#7a5a2c';
  ctx.fillRect(w * 0.22, deskY, w * 0.56, 4);

  // Piles de dossiers
  drawFileStack(ctx, w * 0.28, deskY - 24);
  drawFileStack(ctx, w * 0.66, deskY - 28);

  // Tampon central sur le bureau
  ctx.fillStyle = '#3a2a14';
  ctx.fillRect(w * 0.48, deskY - 14, 14, 14);
  ctx.fillStyle = '#5a3a20';
  ctx.fillRect(w * 0.475, deskY - 4, 24, 6);
  ctx.fillStyle = '#1a1010';
  ctx.fillRect(w * 0.47, deskY, 28, 4);

  // Lampes vertes occultes
  drawDeskLamp(ctx, w * 0.30, deskY);
  drawDeskLamp(ctx, w * 0.66, deskY);

  // Halo central au sol
  const halo = ctx.createRadialGradient(cx, h * 0.92, 0, cx, h * 0.92, w * 0.3);
  halo.addColorStop(0, 'rgba(136,255,136,0.2)');
  halo.addColorStop(1, 'rgba(136,255,136,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
}

function drawBookshelf(ctx: Ctx, x: number, y: number, w: number, h: number) {
  // Bois de l'étagère
  ctx.fillStyle = '#2a1a0e';
  ctx.fillRect(x, y, w, h);
  // Livres
  const colors = ['#5a1818', '#2a1a4a', '#4a3a0a', '#1a3a2a', '#3a1a3a', '#4a2a14', '#2a4a3a'];
  const bookH = 28;
  const rows = Math.floor(h / bookH);
  for (let row = 0; row < rows; row++) {
    let bx = x + 4;
    while (bx < x + w - 4) {
      const bw = 5 + Math.floor(Math.random() * 4);
      const c = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillStyle = c;
      ctx.fillRect(bx, y + row * bookH + 2, bw, bookH - 4);
      // Petit liseré doré
      ctx.fillStyle = '#c8a040';
      ctx.fillRect(bx, y + row * bookH + 6, bw, 1);
      ctx.fillRect(bx, y + row * bookH + bookH - 8, bw, 1);
      bx += bw + 1;
    }
    // Planche
    ctx.fillStyle = '#1a0e08';
    ctx.fillRect(x, y + row * bookH + bookH - 2, w, 2);
  }
}

function drawFileStack(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#a88840';
  ctx.fillRect(x, y, 40, 6);
  ctx.fillStyle = '#c8a868';
  ctx.fillRect(x + 2, y + 6, 40, 6);
  ctx.fillStyle = '#d8c8a0';
  ctx.fillRect(x, y + 12, 40, 12);
  ctx.strokeStyle = '#5a4020';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y + 12, 40, 12);
}

function drawDeskLamp(ctx: Ctx, x: number, y: number) {
  // Tige
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(x, y - 30, 2, 30);
  // Abat-jour vert
  ctx.fillStyle = '#1a3a2a';
  ctx.fillRect(x - 8, y - 36, 18, 6);
  ctx.fillStyle = '#88ff88';
  ctx.fillRect(x - 6, y - 34, 14, 2);
  // Halo
  const g = ctx.createRadialGradient(x + 1, y - 28, 0, x + 1, y - 28, 40);
  g.addColorStop(0, 'rgba(136,255,136,0.4)');
  g.addColorStop(1, 'rgba(136,255,136,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 40, y - 60, 80, 60);
}

// === API publique : retourne des canvases prêts à devenir des textures Phaser ===

const CHAR_W = 50;
const CHAR_H = 56;
const BOSS_W = 100;
const BOSS_H = 116;

export interface SpriteSet {
  idle: HTMLCanvasElement;
  idle2: HTMLCanvasElement;
  attack: HTMLCanvasElement;
  hit: HTMLCanvasElement;
}

function makeCharSet(
  draw: (ctx: Ctx, frame: 'idle' | 'idle2' | 'attack' | 'hit') => void
): SpriteSet {
  const frames: ('idle' | 'idle2' | 'attack' | 'hit')[] = ['idle', 'idle2', 'attack', 'hit'];
  const result = {} as SpriteSet;
  for (const f of frames) {
    const c = makeCanvas(CHAR_W, CHAR_H);
    draw(c.getContext('2d')!, f);
    (result as any)[f] = c;
  }
  return result;
}

export function generateAllSprites() {
  return {
    datpaloof: makeCharSet(drawDatpaloof),
    baghaar: makeCharSet(drawBaghaar),
    zlatax: makeCharSet(drawZlatax),
    bossNormal: makeBossSet(false),
    bossEnraged: makeBossSet(true),
  };
}

function makeBossSet(enraged: boolean): SpriteSet {
  const frames: ('idle' | 'idle2' | 'attack' | 'hit')[] = ['idle', 'idle2', 'attack', 'hit'];
  const result = {} as SpriteSet;
  for (const f of frames) {
    const c = makeCanvas(BOSS_W, BOSS_H);
    drawBoss(c.getContext('2d')!, f, enraged);
    (result as any)[f] = c;
  }
  return result;
}

export function generateArenaBg(w: number, h: number): HTMLCanvasElement {
  const c = makeCanvas(w, h);
  drawArenaBackground(c.getContext('2d')!, w, h);
  return c;
}

// === Particules ===

export function generateParticle(color: string): HTMLCanvasElement {
  const c = makeCanvas(8, 8);
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
  g.addColorStop(0, color);
  g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 8);
  return c;
}

export const SPRITE_DIMS = { CHAR_W, CHAR_H, BOSS_W, BOSS_H };
