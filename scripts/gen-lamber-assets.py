#!/usr/bin/env python3
"""Assets de la Forêt de Lamber : factions clichées (bandits voleurs,
gobelins débiles, cultistes illuminés).

1. Sprites ennemis ORIGINAUX dessinés en pixel art (grilles ASCII : chaque
   lettre = une couleur de palette, upscale nearest ×6, contour automatique) :
   bandit, chef des bandits, gobelin, roi gobelin, cultiste, hiérophante.
   Sortie : public/assets/sprites/enemies/<nom>.png
2. Fonds de combat : forest.jpg (crop de l'écran 2-2) et cave.jpg (dessiné).
3. Intérieurs de donjons : repaire-bandits.jpg, antre-gobelins.jpg (dessinés
   en style caverne, torches, butin).

Usage : python3 scripts/gen-lamber-assets.py
"""
import colorsys
import os
import random

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..')
PUB = os.path.join(ROOT, 'public', 'assets')
random.seed(1337)


# ============================================================
# 1) Sprites des factions — pixel art original par grilles ASCII
# ============================================================
# Chaque sprite est dessiné ligne par ligne : une lettre = une couleur de la
# palette, '.' = transparent. Upscale nearest ×6 + contour sombre automatique.

SPRITE_SCALE = 6
OUTLINE = (16, 12, 18, 255)


def draw_ascii_sprite(rows, palette):
    h = len(rows)
    w = max(len(r) for r in rows)
    img = Image.new('RGBA', (w + 2, h + 2), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch == '.' or ch == ' ':
                continue
            c = palette[ch]
            px[x + 1, y + 1] = (*c, 255)
    # Contour automatique : tout pixel transparent voisin d'un pixel opaque
    out = img.copy()
    opx = out.load()
    for y in range(out.height):
        for x in range(out.width):
            if px[x, y][3] > 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < out.width and 0 <= ny < out.height and px[nx, ny][3] > 0:
                    opx[x, y] = OUTLINE
                    break
    return out.resize((out.width * SPRITE_SCALE, out.height * SPRITE_SCALE), Image.NEAREST)


# --- Gobelin : petit, vert, grandes oreilles, gourdin ---
GOBELIN_PAL = {
    'G': (86, 152, 62),   # peau
    'g': (116, 190, 88),  # peau claire
    'E': (58, 106, 42),   # peau sombre
    'Y': (244, 214, 74),  # yeux
    'P': (24, 20, 20),    # pupilles / bouche
    'T': (238, 234, 214), # dents
    'L': (122, 82, 46),   # pagne
    'l': (150, 106, 60),
    'C': (108, 74, 40),   # gourdin
    'c': (140, 100, 58),
    'K': (44, 78, 34),    # ombres fortes peau
}
GOBELIN = [
    '......E..............C.',
    '.....EGE.............Cc',
    '..E.EGGGE.E..........Cc',
    '.EGEGGgGGEGE.........cC',
    '.EGGGgggGGGE.........CC',
    '..EGgYPgYPGE........CCc',
    '..EGgggggggE........CcC',
    '...EGgPPPPGE.......GCC.',
    '...EGGTPTPG........GGC.',
    '....EGGGGG.........gG..',
    '....EGGGGGE.......GGG..',
    '...EGGGGGGGE.....GGG...',
    '..EGGgGGgGGGE...GGE....',
    '.EGGGgGGgGGGGGGGGE.....',
    '.EGKGGGGGGGKGGGGE......',
    '..EGGLLlLLGGGE.........',
    '...GGLlLLlLGG..........',
    '...EGLLlLLLGE..........',
    '....GGE..EGG...........',
    '....GGE..EGG...........',
    '...EGGE..EGGE..........',
    '...KGG....GGK..........',
    '..EGGE....EGGE.........',
]

# --- Roi gobelin : gros, couronne, sceptre à os ---
ROI_PAL = {
    **GOBELIN_PAL,
    'O': (232, 178, 62),  # couronne or
    'o': (255, 216, 110),
    'R': (168, 44, 52),   # cape rouge
    'r': (204, 70, 74),
    'B': (226, 218, 196), # os du sceptre
    'b': (176, 166, 142),
    'J': (196, 60, 130),  # joyau
}
ROI_GOBELIN = [
    '.....O.o.O.o.O..........',
    '.....OoOoOoOoO.......B..',
    '.....OOOOOOOOO......BbB.',
    '....EGGGGGGGGGE......B..',
    '..E.EGGgggggGGE.E....b..',
    '.EGEGGgYPgYPgGGEGE...b..',
    '.EGGGGgggggggGGGE....b..',
    '..EGGgPPPPPPgGE......b..',
    '...EGGTPTPTPGG.......b..',
    '....EGGGGGGGG........b..',
    '..RREGGGGGGGGERR.....b..',
    '.RrGGGGGGGGGGGGrR....b..',
    'RrGGGgGGGGGGgGGGrR..Gb..',
    'RrGGGGGGGGGGGGGGrR..GG..',
    'RrGGgGGGGGGGGgGGrR.GGG..',
    'RrGGGGGGGGGGGGGGrRGGG...',
    '.RGGGGgggggGGGGGGGGE....',
    '.REGGGgggggggGGGGGE.....',
    '..EGGGgggggGGGGGE.......',
    '...GGGLLlLLLGGG.........',
    '...EGLLlLLlLLGE.........',
    '....GGLLlLLLGG..........',
    '....GGE...EGG...........',
    '...EGGE...EGGE..........',
    '...KGGG...GGGK..........',
    '..EGGGE...EGGGE.........',
]

# --- Bandit : capuche, bandana rouge, deux dagues ---
BANDIT_PAL = {
    'H': (66, 56, 60),    # capuche
    'h': (92, 80, 84),
    'F': (34, 28, 34),    # ombre du visage
    'W': (228, 224, 210), # yeux
    'P': (22, 20, 26),
    'R': (172, 52, 52),   # bandana
    'r': (128, 36, 40),
    'S': (198, 154, 112), # peau
    'T': (104, 86, 66),   # tunique
    't': (128, 108, 84),
    'B': (54, 40, 30),    # ceinture
    'G': (214, 172, 80),  # boucle
    'C': (76, 58, 44),    # cape/jambes
    'c': (96, 74, 55),
    'b': (42, 32, 26),    # bottes
    'D': (196, 200, 210), # lames
    'd': (134, 138, 152),
    'g': (146, 114, 62),  # gardes
}
BANDIT = [
    '.......HHHHHH.......',
    '......HHhhhhHH......',
    '.....HHhhhhhhHH.....',
    '.....HhhFFFFhhH.....',
    '....HHhFFFFFFhHH....',
    '....HhFWPFFWPFhH....',
    '....HhFFFFFFFFhH....',
    '.....hRRRRRRRRh.....',
    '.....hRrRRRRrRh.....',
    '......RRrrrrRR......',
    '....TTtTTTTTTtTT....',
    '...TtTTTTTTTTTTtT...',
    '..TTtTTTTTTTTTTtTT..',
    '.STTtTTTTTTTTTTtTTS.',
    '.STTBBBBGBBBBBBTTS..',
    '.STTBBBBGGBBBBBTTS..',
    'DSTTTTTTTTTTTTTTSD..',
    'DdS.TTTTTTTTTT.SdD..',
    'Dd..CCcCCCCcCC..dD..',
    'gg..CCcCCCCcCC..gg..',
    '....CCCC..CCCC......',
    '....CcCC..CcCC......',
    '....CCCC..CCCC......',
    '...bbbbb..bbbbb.....',
    '..bbbbbb..bbbbbb....',
]

# --- Chef des bandits : tricorne à plume, balafre, sabre ---
CHEF_PAL = {
    **BANDIT_PAL,
    'A': (46, 38, 42),    # tricorne
    'a': (70, 58, 62),
    'V': (120, 200, 110), # plume verte
    'X': (216, 120, 110), # balafre
    'M': (140, 44, 48),   # manteau rouge sombre
    'm': (172, 62, 62),
    'O': (222, 182, 90),  # boutons dorés
}
CHEF = [
    '.....AAAAAAAAAA...V....',
    '....AaaaaaaaaaaA.VV....',
    '..AAaaaaaaaaaaaaAV.....',
    '.AAAAAAAAAAAAAAAAA.....',
    '....hhFFFFFFhh.........',
    '....hFWPFFXWPFh........',
    '....hFFFFFXFFFh........',
    '.....FSSSSXSSF.........',
    '.....hRRRRRRRRh........',
    '......RRrrrrRR.........',
    '...MMmMMMMMMMMmMM......',
    '..MmMMMMMMMMMMMMmM.....',
    '.MMmMMOMMMMMMOMMmMM....',
    '.SMMmMMMMMMMMMMmMMS....',
    '.SMMBBBBGGBBBBBMMS...D.',
    'DSMMBBBBGGBBBBBMMSD..Dd',
    'DdMMMMMMMMMMMMMMdD..Dd.',
    'Dd.MMMMMMMMMMMM.dD.Dd..',
    'gg..CCcCCCCcCC..ggDd...',
    '....CCcCCCCcCC...gg....',
    '....CCCC..CCCC.........',
    '....CcCC..CcCC.........',
    '....CCCC..CCCC.........',
    '...bbbbbb.bbbbbb.......',
    '..bbbbbbb.bbbbbbb......',
]

# --- Cultiste : robe violette, capuche, yeux luisants, cierge ---
CULTISTE_PAL = {
    'V': (74, 44, 104),   # robe
    'v': (100, 64, 140),  # robe claire
    'U': (52, 30, 74),    # robe sombre
    'F': (16, 10, 24),    # vide du visage
    'E': (204, 136, 255), # yeux luisants
    'C': (150, 120, 90),  # corde ceinture
    'R': (204, 136, 255), # rune brodée
    'W': (238, 230, 200), # cierge
    'Q': (255, 200, 90),  # flamme
}
CULTISTE = [
    '.......VVVVVV.......',
    '......VvvvvvvV......',
    '.....VvvvvvvvvV.....',
    '.....VvFFFFFFvV.....',
    '....VvvFFFFFFvvV....',
    '....VvFFEFFEFFvV....',
    '....VvFFFFFFFFvV....',
    '.....VvFFFFFFvV..Q..',
    '.....VVvFFFFvVV..W..',
    '......VVVvvVVV...W..',
    '....VVvVVVVVVvVV.W..',
    '...VvvVVVVVVVVvvVW..',
    '..VvVVVVRRVVVVVvVW..',
    '..VvVVVRRRRVVVVvVW..',
    '.VvVVVVVRRVVVVVVvV..',
    '.VvVVVVVVVVVVVVVvV..',
    '.VvVCCCCCCCCCCVVvV..',
    '.VvVVVVVVVVVVVVVvV..',
    '.UvVVVVVVVVVVVVVvU..',
    '.UvVVVVVVVVVVVVVvU..',
    '.UvvVVVVVVVVVVVvvU..',
    '.UUvvVVVVVVVVVvvUU..',
    '.UUUvvvVVVVVvvvUUU..',
    '..UUUUUUUUUUUUUUU...',
    '.UUUUUUUUUUUUUUUUU..',
]

# --- Hiérophante : grande robe, capuche cornue, bâton à orbe ---
HIERO_PAL = {
    'V': (92, 52, 134),
    'v': (128, 80, 178),
    'U': (62, 34, 92),
    'F': (14, 8, 22),
    'E': (224, 160, 255),
    'C': (214, 180, 110),
    'R': (224, 160, 255),
    'H': (196, 190, 180),
    'h': (150, 144, 134),
    'S': (110, 80, 52),
    'O': (188, 100, 255),
    'o': (232, 190, 255),
}
HIEROPHANTE = [
    '..Hh..........hH.....',
    '.Hh............hH....',
    '.Hh...VVVVVV...hH..o.',
    '..Hh.VvvvvvvV.hH..oOo',
    '..HhVvvvvvvvvVhH...o.',
    '...HVvFFFFFFvVH....S.',
    '....VvFFFFFFvV.....S.',
    '....VvFEFFEFvV.....S.',
    '....VvFFFFFFvV.....S.',
    '.....VvFFFFvV......S.',
    '.....VVvvvvVV......S.',
    '...VVvVVVVVVvVV....S.',
    '..VvvVVVVVVVVvvV...S.',
    '.VvVVVCCCCCCVVVvV..S.',
    '.VvVVVVRRRRVVVVvV..S.',
    '.VvVVVRRRRRRVVVvVVVS.',
    'VvVVVVVRRRRVVVVVvV.S.',
    'VvVVVVVVVVVVVVVVvV.S.',
    'VvVVCCCCCCCCCCVVvV.S.',
    'VvVVVVVVVVVVVVVVvV.S.',
    'UvVVVVVVVVVVVVVVvU.S.',
    'UvVVVVVVVVVVVVVVvU...',
    'UvvVVVVVVVVVVVVvvU...',
    'UUvvVVVVVVVVVVvvUU...',
    'UUUvvvVVVVVVvvvUUU...',
    'UUUUvvvvvvvvvvUUUU...',
    '.UUUUUUUUUUUUUUUU....',
    'UUUUUUUUUUUUUUUUUU...',
]


def build_faction_sprites():
    print('== Sprites des factions de Lamber (pixel art original) ==')
    out_dir = os.path.join(PUB, 'sprites', 'enemies')
    os.makedirs(out_dir, exist_ok=True)
    sprites = {
        'gobelin': (GOBELIN, GOBELIN_PAL),
        'roiGobelin': (ROI_GOBELIN, ROI_PAL),
        'bandit': (BANDIT, BANDIT_PAL),
        'banditChef': (CHEF, CHEF_PAL),
        'cultiste': (CULTISTE, CULTISTE_PAL),
        'hierophante': (HIEROPHANTE, HIERO_PAL),
    }
    for name, (rows, pal) in sprites.items():
        img = draw_ascii_sprite(rows, pal)
        img.save(os.path.join(out_dir, f'{name}.png'))
        print(f'  {name}.png ({img.width}x{img.height})')


# ============================================================
# 2) Fonds de combat
# ============================================================

def build_battle_backgrounds():
    print('== Fonds de combat ==')
    # Forêt : crop du carrefour 2-2, légèrement flouté en haut (profondeur)
    src = Image.open(os.path.join(PUB, 'exploration', 'lamber', '2-2.jpg')).convert('RGB')
    forest = src.crop((280, 180, 1380, 800)).resize((1024, 576), Image.LANCZOS)
    top = forest.crop((0, 0, 1024, 240)).filter(ImageFilter.GaussianBlur(2.2))
    forest.paste(top, (0, 0))
    forest = ImageEnhance.Brightness(forest).enhance(0.9)
    forest.save(os.path.join(PUB, 'battle-forest.jpg'), quality=86)
    print('  battle-forest.jpg')

    # Caverne : dessinée (parois rocheuses, sol de terre, torches)
    W, H, S = 256, 144, 4
    img = Image.new('RGB', (W, H), (16, 12, 10))
    d = ImageDraw.Draw(img)
    # parois du fond
    for y in range(0, 70, 8):
        for x in range(-6, W, 14):
            off = 7 if (y // 8) % 2 else 0
            c = (44 + random.randint(-6, 6), 36 + random.randint(-5, 5), 32 + random.randint(-4, 4))
            d.rounded_rectangle([x + off, y, x + off + 13, y + 8], 2, fill=c, outline=(20, 15, 12))
    # sol
    for y in range(70, H, 4):
        shade = 1 - (y - 70) / (H - 70) * 0.35
        for x in range(0, W, 4):
            v = random.randint(-5, 5)
            c = (int((70 + v) * shade), int((54 + v) * shade), int((40 + v) * shade))
            d.rectangle([x, y, x + 3, y + 3], fill=c)
    # stalactites
    for x in range(8, W, 22):
        hgt = random.randint(6, 16)
        d.polygon([(x, 0), (x + 7, 0), (x + 3, hgt)], fill=(30, 24, 20))
    # torches
    for tx in (40, 216):
        d.rectangle([tx - 1, 34, tx + 1, 52], fill=(60, 40, 24))
        d.polygon([(tx - 3, 34), (tx, 24), (tx + 3, 34)], fill=(255, 150, 40))
        d.point((tx, 28), fill=(255, 230, 120))
        # halo
        for rr, alpha in ((14, 30), (8, 50)):
            pass
    cave = img.resize((W * S, H * S), Image.NEAREST)
    # halos additifs des torches
    glow = Image.new('RGB', cave.size, (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for tx in (40 * S, 216 * S):
        gd.ellipse([tx - 90, 24 * S - 70, tx + 90, 24 * S + 110], fill=(70, 40, 10))
    glow = glow.filter(ImageFilter.GaussianBlur(30))
    cave = Image.blend(cave, Image.composite(glow, Image.new('RGB', cave.size, (0, 0, 0)), Image.new('L', cave.size, 255)), 0.0)
    from PIL import ImageChops
    cave = ImageChops.add(cave, glow)
    cave.save(os.path.join(PUB, 'battle-cave.jpg'), quality=86)
    print('  battle-cave.jpg')


# ============================================================
# 3) Intérieurs des donjons (exploration)
# ============================================================

W2, H2, S2 = 300, 190, 4


def cave_room(floor=(74, 58, 42), wall=(46, 38, 34)):
    img = Image.new('RGB', (W2, H2), (10, 8, 8))
    d = ImageDraw.Draw(img)
    wall_h = 50
    # parois rocheuses
    for y in range(0, wall_h, 9):
        for x in range(-8, W2, 15):
            off = 7 if (y // 9) % 2 else 0
            c = tuple(max(0, v + random.randint(-7, 7)) for v in wall)
            d.rounded_rectangle([x + off, y, x + off + 14, y + 9], 3, fill=c, outline=tuple(int(v * 0.55) for v in wall))
    d.rectangle([0, wall_h - 2, W2, wall_h], fill=tuple(int(v * 0.45) for v in wall))
    # sol de terre battue
    for y in range(wall_h, H2, 3):
        for x in range(0, W2, 3):
            v = random.randint(-6, 6)
            d.rectangle([x, y, x + 2, y + 2], fill=tuple(max(0, c + v) for c in floor))
    # rochers en bordure
    for x in (8, 22, W2 - 30, W2 - 14):
        y = random.randint(wall_h + 8, H2 - 30)
        d.ellipse([x, y, x + 14, y + 10], fill=tuple(int(v * 0.9) for v in wall), outline=(14, 10, 8))
    return img, d, wall_h


def torch(d, x, y):
    d.rectangle([x - 1, y - 14, x + 1, y], fill=(70, 46, 26))
    d.polygon([(x - 3, y - 14), (x, y - 22), (x + 3, y - 14)], fill=(255, 150, 40))
    d.point((x, y - 18), fill=(255, 230, 120))


def crate(d, x0, y0):
    d.rectangle([x0, y0, x0 + 14, y0 + 14], fill=(104, 72, 44), outline=(12, 8, 6))
    d.line([(x0, y0), (x0 + 14, y0 + 14)], fill=(70, 46, 26))
    d.line([(x0 + 14, y0), (x0, y0 + 14)], fill=(70, 46, 26))


def campfire(d, cx, cy):
    for a in range(0, 360, 40):
        import math
        d.ellipse([cx + math.cos(math.radians(a)) * 9 - 2, cy + math.sin(math.radians(a)) * 4 - 2,
                   cx + math.cos(math.radians(a)) * 9 + 2, cy + math.sin(math.radians(a)) * 4 + 2], fill=(60, 55, 55))
    d.polygon([(cx - 5, cy), (cx - 2, cy - 9), (cx, cy - 4), (cx + 2, cy - 11), (cx + 5, cy)], fill=(255, 140, 40))
    d.polygon([(cx - 3, cy), (cx, cy - 6), (cx + 3, cy)], fill=(255, 220, 110))


def save_room(img, name, brightness=0.95):
    out = img.resize((W2 * S2, H2 * S2), Image.NEAREST)
    out = ImageEnhance.Brightness(out).enhance(brightness)
    p = os.path.join(PUB, 'exploration', 'donjons')
    os.makedirs(p, exist_ok=True)
    out.save(os.path.join(p, f'{name}.jpg'), quality=86)
    print(f'  {name}.jpg')


def repaire_bandits():
    img, d, wh = cave_room(floor=(78, 62, 46), wall=(52, 42, 36))
    torch(d, 40, wh); torch(d, 150, wh); torch(d, 260, wh)
    # butin volé entassé
    crate(d, 220, 70); crate(d, 238, 78); crate(d, 228, 92)
    d.ellipse([255, 96, 271, 108], fill=(180, 150, 100), outline=(60, 45, 25))  # sac
    d.ellipse([248, 106, 260, 116], fill=(200, 170, 60), outline=(90, 70, 20))  # or !
    # table de jeu des bandits
    d.rectangle([90, 84, 140, 104], fill=(88, 58, 36), outline=(12, 8, 6))
    d.rectangle([100, 88, 108, 94], fill=(210, 200, 180))  # cartes
    d.rectangle([116, 90, 124, 96], fill=(210, 200, 180))
    # tonneaux
    for (bx, by) in ((30, 100), (46, 108), (30, 122)):
        d.rounded_rectangle([bx - 6, by - 9, bx + 6, by + 9], 3, fill=(96, 64, 40), outline=(12, 8, 6))
        d.line([(bx - 6, by - 3), (bx + 6, by - 3)], fill=(50, 32, 20))
    # panneau « repaire secret »
    d.rectangle([150, 60, 200, 76], fill=(120, 90, 50), outline=(20, 14, 8))
    d.line([(155, 66), (195, 66)], fill=(50, 35, 18)); d.line([(155, 71), (185, 71)], fill=(50, 35, 18))
    campfire(d, 160, 140)
    save_room(img, 'repaire-bandits')


def antre_gobelins():
    img, d, wh = cave_room(floor=(66, 58, 40), wall=(44, 40, 30))
    torch(d, 30, wh); torch(d, 270, wh)
    # totems gobelins (crânes sur pics)
    for tx in (70, 230):
        d.rectangle([tx - 1, wh - 26, tx + 1, wh], fill=(90, 70, 40))
        d.ellipse([tx - 5, wh - 34, tx + 5, wh - 24], fill=(210, 200, 180), outline=(60, 50, 40))
        d.point((tx - 2, wh - 30), fill=(20, 15, 10)); d.point((tx + 2, wh - 30), fill=(20, 15, 10))
    # tas d'os
    for (ox, oy) in ((50, 100), (240, 120), (120, 150)):
        for i in range(5):
            bx, by = ox + random.randint(-8, 8), oy + random.randint(-4, 4)
            d.line([(bx, by), (bx + 6, by + 2)], fill=(215, 205, 185), width=2)
    # marmite douteuse
    d.ellipse([140, 76, 172, 96], fill=(40, 44, 40), outline=(12, 10, 8))
    d.ellipse([146, 80, 166, 88], fill=(90, 130, 60))
    campfire(d, 156, 100)
    # trône du roi (caisse + tissu rouge)
    d.rectangle([200, 62, 232, 92], fill=(96, 60, 40), outline=(12, 8, 6))
    d.rectangle([204, 58, 228, 78], fill=(140, 40, 40), outline=(60, 16, 16))
    save_room(img, 'antre-gobelins', brightness=0.9)


if __name__ == '__main__':
    build_faction_sprites()
    build_battle_backgrounds()
    print('== Donjons ==')
    repaire_bandits()
    antre_gobelins()
    print('OK.')
