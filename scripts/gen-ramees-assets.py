#!/usr/bin/env python3
"""Assets de la ville de Ramees.

1. PNJ : recolorations du sprite chibi de Datpaloof (front.png) — même
   silhouette, palettes différentes → style 100 % cohérent.
   Sortie : public/assets/sprites/npcs/<nom>.png
2. Intérieurs : 7 salles pixel art dessinées par code (murs, planchers,
   mobilier) dans la palette sombre/chaude du jeu, upscale nearest x4.
   Sortie : public/assets/exploration/ramees/interiors/<nom>.jpg

Usage : python3 scripts/gen-ramees-assets.py
"""
import colorsys
import math
import os
import random

from PIL import Image, ImageDraw, ImageEnhance

ROOT = os.path.join(os.path.dirname(__file__), '..')
PUB = os.path.join(ROOT, 'public', 'assets')

random.seed(42)

# ============================================================
# 1) PNJ — recolorations du chibi
# ============================================================

def recolor(src, hue=None, sat_mult=1.0, val_mult=1.0, sat_floor=0.45):
    """Recolore les pixels fortement saturés (armure, tissus, cheveux dorés)
    vers `hue` (0..1). La peau (peu saturée) et les contours restent intacts."""
    img = src.copy()
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            hh, ss, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if ss >= sat_floor:
                nh = hue if hue is not None else hh
                ns = max(0.0, min(1.0, ss * sat_mult))
                nv = max(0.0, min(1.0, vv * val_mult))
                nr, ng, nb = colorsys.hsv_to_rgb(nh, ns, nv)
                px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    return img


def build_npcs():
    print('== PNJ (recolorations du chibi) ==')
    src = Image.open(os.path.join(PUB, 'exploration', 'datpaloof', 'front.png')).convert('RGBA')
    out_dir = os.path.join(PUB, 'sprites', 'npcs')
    os.makedirs(out_dir, exist_ok=True)
    npcs = {
        # nom: (hue, sat_mult, val_mult)
        'quenticast': (0.60, 0.95, 0.85),   # bleu nuit (geek)
        'juiffy':     (0.10, 1.00, 1.00),   # or chaud (aubergiste)
        'clemodin':   (0.33, 0.80, 0.90),   # vert prudent (commerçant)
        'cubique':    (0.87, 1.05, 1.05),   # rose fêtard
        'steven':     (0.26, 0.85, 0.95),   # vert herbe (herboriste)
        'pretre':     (0.13, 0.22, 1.18),   # blanc/or (prêtre)
        'greffiere':  (0.74, 0.85, 0.90),   # violet administratif
        'forgeron':   (0.04, 0.55, 0.72),   # brun/gris sombre
    }
    for name, (hue, sm, vm) in npcs.items():
        img = recolor(src, hue=hue, sat_mult=sm, val_mult=vm)
        img.save(os.path.join(out_dir, f'{name}.png'))
        print(f'  {name}.png')


# ============================================================
# 2) Intérieurs — dessin pixel art
# ============================================================

W, H = 300, 190          # taille de dessin (upscale x4 → 1200x760)
SCALE = 4


def jitter(c, amount=6):
    return tuple(max(0, min(255, v + random.randint(-amount, amount))) for v in c)


class Room:
    def __init__(self, wall, wall_dark, floor_a, floor_b, accent):
        self.img = Image.new('RGB', (W, H), (10, 7, 14))
        self.d = ImageDraw.Draw(self.img)
        self.wall = wall
        self.wall_dark = wall_dark
        self.floor_a = floor_a
        self.floor_b = floor_b
        self.accent = accent
        self.wall_h = 52

    # --- structure ---
    def draw_walls_wood(self):
        d = self.d
        for x in range(0, W, 7):
            shade = self.wall if (x // 7) % 2 == 0 else self.wall_dark
            d.rectangle([x, 0, x + 6, self.wall_h], fill=jitter(shade, 4))
            d.line([(x, 0), (x, self.wall_h)], fill=tuple(int(v * 0.7) for v in self.wall_dark))
        # plinthe
        d.rectangle([0, self.wall_h - 3, W, self.wall_h], fill=tuple(int(v * 0.55) for v in self.wall_dark))

    def draw_walls_stone(self):
        d = self.d
        bh, bw = 10, 18
        for row, y in enumerate(range(0, self.wall_h, bh)):
            off = (bw // 2) if row % 2 else 0
            for x in range(-off, W, bw):
                d.rectangle([x, y, x + bw - 1, y + bh - 1], fill=jitter(self.wall, 5))
                d.rectangle([x, y, x + bw - 1, y + bh - 1], outline=tuple(int(v * 0.62) for v in self.wall_dark))
        d.rectangle([0, self.wall_h - 3, W, self.wall_h], fill=tuple(int(v * 0.5) for v in self.wall_dark))

    def draw_floor_planks(self):
        d = self.d
        for y in range(self.wall_h, H, 6):
            for x in range(0, W, 34):
                off = 17 if (y // 6) % 2 else 0
                c = self.floor_a if ((x + off) // 34) % 2 == 0 else self.floor_b
                d.rectangle([x - off, y, x - off + 33, y + 5], fill=jitter(c, 5))
                d.line([(x - off, y), (x - off, y + 5)], fill=tuple(int(v * 0.72) for v in self.floor_b))
            d.line([(0, y), (W, y)], fill=tuple(int(v * 0.78) for v in self.floor_b))
        # assombrit les bords (fausse pénombre)
        for i in range(14):
            a = int(70 * (1 - i / 14))
            d.line([(i, self.wall_h), (i, H)], fill=(0, 0, 0), width=1) if False else None
        ov = Image.new('L', (W, H), 0)
        od = ImageDraw.Draw(ov)
        for i in range(18):
            v = int(80 * (1 - i / 18))
            od.rectangle([i, self.wall_h + i // 3, W - 1 - i, H - 1 - i // 3], outline=v)
        dark = Image.new('RGB', (W, H), (0, 0, 0))
        self.img = Image.composite(dark, self.img, ov.point(lambda p: min(90, p)))
        self.d = ImageDraw.Draw(self.img)

    def draw_floor_tiles(self):
        d = self.d
        ts = 13
        for row, y in enumerate(range(self.wall_h, H, ts)):
            for col, x in enumerate(range(0, W, ts)):
                c = self.floor_a if (row + col) % 2 == 0 else self.floor_b
                d.rectangle([x, y, x + ts - 1, y + ts - 1], fill=jitter(c, 4))
                d.rectangle([x, y, x + ts - 1, y + ts - 1], outline=tuple(int(v * 0.8) for v in self.floor_b))

    def rug(self, x0, y0, x1, y1, color, border):
        d = self.d
        d.rectangle([x0, y0, x1, y1], fill=color)
        d.rectangle([x0, y0, x1, y1], outline=border)
        d.rectangle([x0 + 3, y0 + 3, x1 - 3, y1 - 3], outline=border)

    def shadow(self, x0, y1, x1):
        self.d.rectangle([x0, y1, x1, y1 + 3], fill=(8, 5, 10))

    # --- mobilier ---
    def box(self, x0, y0, x1, y1, c, top=None, outline=(12, 8, 6)):
        d = self.d
        self.shadow(x0 + 1, y1, x1 + 1)
        d.rectangle([x0, y0, x1, y1], fill=c, outline=outline)
        d.rectangle([x0, y0, x1, y0 + max(3, (y1 - y0) // 5)], fill=top or tuple(min(255, int(v * 1.35)) for v in c))

    def table_round(self, cx, cy, r, c=(94, 62, 38)):
        d = self.d
        self.shadow(cx - r + 2, cy + r // 2 + 4, cx + r - 2)
        d.rectangle([cx - 2, cy, cx + 2, cy + r // 2 + 4], fill=tuple(int(v * 0.7) for v in c))
        d.ellipse([cx - r, cy - r // 2, cx + r, cy + r // 2], fill=c, outline=(12, 8, 6))
        d.ellipse([cx - r + 3, cy - r // 2 + 2, cx + r - 3, cy + r // 2 - 2], outline=tuple(min(255, int(v * 1.3)) for v in c))

    def stool(self, cx, cy, c=(74, 48, 30)):
        self.d.rectangle([cx - 4, cy - 3, cx + 4, cy + 3], fill=c, outline=(12, 8, 6))

    def barrel(self, cx, cy):
        d = self.d
        self.shadow(cx - 7, cy + 10, cx + 7)
        d.rounded_rectangle([cx - 7, cy - 10, cx + 7, cy + 10], 4, fill=(96, 64, 40), outline=(12, 8, 6))
        d.line([(cx - 7, cy - 4), (cx + 7, cy - 4)], fill=(50, 32, 20))
        d.line([(cx - 7, cy + 4), (cx + 7, cy + 4)], fill=(50, 32, 20))

    def shelf_wall(self, x0, x1, y, items_colors):
        d = self.d
        d.rectangle([x0, y, x1, y + 12], fill=(58, 38, 26), outline=(12, 8, 6))
        xx = x0 + 3
        while xx < x1 - 4:
            c = random.choice(items_colors)
            hgt = random.randint(6, 9)
            d.rectangle([xx, y + 11 - hgt, xx + 3, y + 11], fill=c)
            xx += 5

    def window_warm(self, cx, y=10, w=18, h=26, glass=(255, 196, 110)):
        d = self.d
        d.rectangle([cx - w // 2 - 2, y - 2, cx + w // 2 + 2, y + h + 2], fill=(38, 26, 20))
        d.rectangle([cx - w // 2, y, cx + w // 2, y + h], fill=glass)
        d.line([(cx, y), (cx, y + h)], fill=(38, 26, 20), width=2)
        d.line([(cx - w // 2, y + h // 2), (cx + w // 2, y + h // 2)], fill=(38, 26, 20), width=2)

    def stained_glass(self, cx, y=4, w=40, h=44):
        d = self.d
        cols = [(180, 60, 80), (90, 110, 200), (210, 170, 80), (110, 170, 110), (150, 90, 180)]
        d.rounded_rectangle([cx - w // 2 - 3, y - 2, cx + w // 2 + 3, y + h], 12, fill=(34, 28, 40))
        for i in range(-w // 2, w // 2, 6):
            for j in range(0, h - 4, 7):
                c = cols[(i // 6 + j // 7) % len(cols)]
                d.rectangle([cx + i, y + 2 + j, cx + i + 5, y + 2 + j + 6], fill=jitter(c, 12))
        d.rounded_rectangle([cx - w // 2 - 3, y - 2, cx + w // 2 + 3, y + h], 12, outline=(16, 12, 20), width=2)

    def candles(self, xs, y):
        for cx in xs:
            self.d.rectangle([cx - 1, y - 5, cx + 1, y], fill=(230, 220, 190))
            self.d.point((cx, y - 7), fill=(255, 240, 140))
            self.d.ellipse([cx - 2, y - 9, cx + 2, y - 5], outline=(255, 220, 100))

    def fireplace(self, cx, wall_h=None):
        d = self.d
        y = (wall_h or self.wall_h)
        d.rectangle([cx - 16, y - 34, cx + 16, y], fill=(70, 60, 58), outline=(14, 10, 10))
        d.rectangle([cx - 10, y - 22, cx + 10, y], fill=(20, 12, 10))
        # feu
        d.polygon([(cx - 7, y), (cx - 3, y - 12), (cx, y - 6), (cx + 3, y - 14), (cx + 7, y)], fill=(255, 140, 40))
        d.polygon([(cx - 4, y), (cx - 1, y - 8), (cx + 1, y - 5), (cx + 4, y)], fill=(255, 220, 110))

    def plant_pot(self, cx, cy, leaf=(70, 130, 60)):
        d = self.d
        d.polygon([(cx - 5, cy - 4), (cx + 5, cy - 4), (cx + 3, cy + 4), (cx - 3, cy + 4)], fill=(120, 70, 40), outline=(12, 8, 6))
        for _ in range(8):
            a = random.uniform(0, math.pi)
            r = random.randint(3, 8)
            d.ellipse([cx + math.cos(a) * r - 3, cy - 6 - abs(math.sin(a) * r) - 3,
                       cx + math.cos(a) * r + 3, cy - 6 - abs(math.sin(a) * r) + 3], fill=jitter(leaf, 14))

    def herbs_hanging(self, xs, y=14):
        for cx in xs:
            self.d.line([(cx, y - 8), (cx, y)], fill=(90, 70, 40))
            for _ in range(6):
                dx, dy = random.randint(-3, 3), random.randint(0, 6)
                self.d.point((cx + dx, y + dy), fill=jitter((96, 140, 70), 20))

    def crate(self, x0, y0):
        d = self.d
        self.shadow(x0 + 1, y0 + 14, x0 + 15)
        d.rectangle([x0, y0, x0 + 14, y0 + 14], fill=(104, 72, 44), outline=(12, 8, 6))
        d.line([(x0, y0), (x0 + 14, y0 + 14)], fill=(70, 46, 26))
        d.line([(x0 + 14, y0), (x0, y0 + 14)], fill=(70, 46, 26))

    def sack(self, cx, cy):
        d = self.d
        d.ellipse([cx - 7, cy - 6, cx + 7, cy + 6], fill=(180, 150, 100), outline=(60, 45, 25))
        d.rectangle([cx - 2, cy - 9, cx + 2, cy - 5], fill=(140, 110, 70))

    def bed(self, x0, y0, blanket=(120, 50, 60)):
        d = self.d
        self.shadow(x0 + 1, y0 + 30, x0 + 21)
        d.rectangle([x0, y0, x0 + 20, y0 + 30], fill=(70, 46, 30), outline=(12, 8, 6))
        d.rectangle([x0 + 2, y0 + 2, x0 + 18, y0 + 9], fill=(226, 216, 196))     # oreiller
        d.rectangle([x0 + 2, y0 + 10, x0 + 18, y0 + 28], fill=blanket)
        d.line([(x0 + 2, y0 + 13), (x0 + 18, y0 + 13)], fill=tuple(int(v * 0.7) for v in blanket))

    def anvil(self, cx, cy):
        d = self.d
        self.shadow(cx - 9, cy + 7, cx + 9)
        d.rectangle([cx - 4, cy, cx + 4, cy + 7], fill=(48, 48, 56), outline=(10, 10, 14))
        d.rectangle([cx - 10, cy - 5, cx + 10, cy], fill=(70, 70, 82), outline=(10, 10, 14))
        d.polygon([(cx + 10, cy - 5), (cx + 15, cy - 3), (cx + 10, cy)], fill=(70, 70, 82))

    def screen_arcane(self, x0, y0, w=13, h=9):
        d = self.d
        d.rectangle([x0 - 1, y0 - 1, x0 + w + 1, y0 + h + 1], fill=(20, 22, 30))
        d.rectangle([x0, y0, x0 + w, y0 + h], fill=(40, 120, 200))
        for i in range(2, h - 1, 3):
            d.line([(x0 + 2, y0 + i), (x0 + w - random.randint(2, 6), y0 + i)], fill=(140, 220, 255))

    def counter(self, x0, y0, x1, c=(88, 58, 36)):
        self.box(x0, y0, x1, y0 + 14, c)

    def save(self, name, brightness=1.0, saturation=1.0):
        img = self.img.resize((W * SCALE, H * SCALE), Image.NEAREST)
        img = ImageEnhance.Brightness(img).enhance(brightness)
        img = ImageEnhance.Color(img).enhance(saturation)
        out = os.path.join(PUB, 'exploration', 'ramees', 'interiors')
        os.makedirs(out, exist_ok=True)
        img.save(os.path.join(out, f'{name}.jpg'), quality=88)
        print(f'  {name}.jpg ({W * SCALE}x{H * SCALE})')


BOOKS = [(120, 60, 50), (60, 80, 120), (100, 90, 50), (70, 100, 70), (110, 70, 100)]
BOTTLES = [(90, 140, 90), (140, 90, 60), (90, 100, 150), (150, 130, 70)]


def auberge():
    r = Room(wall=(74, 50, 36), wall_dark=(58, 38, 28), floor_a=(96, 66, 42), floor_b=(82, 55, 35), accent=(255, 170, 60))
    r.draw_walls_wood()
    r.draw_floor_planks()
    r.window_warm(40); r.window_warm(120)
    r.fireplace(250)
    r.shelf_wall(160, 220, 18, BOTTLES)
    r.rug(90, 90, 210, 150, (96, 40, 40), (60, 24, 24))
    # bar à droite
    r.counter(210, 78, 292)
    r.barrel(226, 118); r.barrel(248, 124); r.barrel(280, 118)
    # tables
    r.table_round(70, 100, 16); r.stool(48, 108); r.stool(92, 92)
    r.table_round(150, 125, 16); r.stool(128, 133); r.stool(172, 117)
    r.table_round(60, 155, 14); r.stool(80, 163)
    r.candles([70, 150], 96)
    r.save('auberge', brightness=0.98, saturation=1.02)


def eglise():
    r = Room(wall=(88, 84, 92), wall_dark=(66, 62, 72), floor_a=(120, 112, 104), floor_b=(104, 96, 90), accent=(220, 200, 140))
    r.draw_walls_stone()
    r.draw_floor_tiles()
    r.stained_glass(150)
    r.window_warm(50, y=12, w=12, h=20, glass=(190, 200, 255))
    r.window_warm(250, y=12, w=12, h=20, glass=(190, 200, 255))
    # tapis central
    r.rug(138, 52, 162, 170, (110, 40, 44), (70, 26, 28))
    # autel
    r.box(126, 56, 174, 72, (210, 200, 185), top=(235, 228, 215))
    r.candles([132, 150, 168], 56)
    # bancs (2 colonnes x 3 rangées)
    for row in range(3):
        y = 95 + row * 24
        r.box(58, y, 126, y + 7, (86, 58, 38))
        r.box(174, y, 242, y + 7, (86, 58, 38))
    r.save('eglise', brightness=0.94, saturation=0.95)


def mairie():
    r = Room(wall=(60, 48, 70), wall_dark=(46, 36, 56), floor_a=(92, 74, 56), floor_b=(80, 62, 47), accent=(200, 160, 255))
    r.draw_walls_wood()
    r.draw_floor_planks()
    r.window_warm(60); r.window_warm(240)
    # bannière officielle (écharpe tricolore du Champion…)
    d = r.d
    d.rectangle([138, 6, 162, 42], fill=(40, 34, 56), outline=(14, 10, 20))
    d.rectangle([141, 8, 147, 40], fill=(60, 70, 140))
    d.rectangle([147, 8, 153, 40], fill=(220, 214, 205))
    d.rectangle([153, 8, 159, 40], fill=(150, 50, 60))
    # comptoir d'accueil
    r.counter(90, 84, 210, c=(76, 56, 80))
    # piles de dossiers sur le comptoir
    for x in (100, 140, 185):
        d.rectangle([x, 76, x + 12, 84], fill=(200, 190, 170), outline=(90, 80, 60))
        d.line([(x, 79), (x + 12, 79)], fill=(150, 140, 120))
    # armoires à dossiers
    r.box(14, 56, 40, 96, (70, 56, 88)); d.rectangle([18, 62, 36, 70], outline=(30, 22, 44)); d.rectangle([18, 76, 36, 84], outline=(30, 22, 44))
    r.box(260, 56, 286, 96, (70, 56, 88)); d.rectangle([264, 62, 282, 70], outline=(30, 22, 44)); d.rectangle([264, 76, 282, 84], outline=(30, 22, 44))
    r.shelf_wall(180, 250, 20, BOOKS)
    r.rug(110, 100, 190, 160, (70, 50, 96), (44, 30, 62))
    r.save('mairie', brightness=0.95, saturation=1.0)


def forge():
    r = Room(wall=(64, 58, 60), wall_dark=(48, 42, 46), floor_a=(84, 72, 64), floor_b=(70, 60, 54), accent=(255, 120, 40))
    r.draw_walls_stone()
    r.draw_floor_tiles()
    # fourneau
    d = r.d
    d.rectangle([196, 10, 250, 52], fill=(56, 50, 54), outline=(12, 10, 12))
    d.rectangle([208, 30, 238, 52], fill=(22, 12, 8))
    d.polygon([(212, 52), (218, 34), (223, 44), (228, 30), (234, 52)], fill=(255, 130, 30))
    d.polygon([(217, 52), (222, 40), (226, 46), (230, 52)], fill=(255, 220, 100))
    r.anvil(160, 96)
    r.barrel(60, 120)  # baquet d'eau
    d.ellipse([53, 112, 67, 120], fill=(60, 90, 120))
    # râtelier d'armes
    r.box(14, 54, 44, 60, (70, 50, 34))
    for i, x in enumerate((18, 26, 34, 42)):
        d.line([(x, 30 + (i % 2) * 3), (x, 58)], fill=(120, 120, 135), width=2)
        d.rectangle([x - 2, 26 + (i % 2) * 3, x + 1, 32 + (i % 2) * 3], fill=(90, 70, 40))
    r.crate(240, 120); r.crate(258, 130); r.sack(120, 150)
    r.save('forge', brightness=0.92, saturation=1.05)


def herboristerie():
    r = Room(wall=(56, 66, 48), wall_dark=(42, 52, 38), floor_a=(92, 74, 52), floor_b=(78, 62, 44), accent=(120, 220, 130))
    r.draw_walls_wood()
    r.draw_floor_planks()
    r.window_warm(230, glass=(200, 240, 170))
    r.herbs_hanging([30, 50, 70, 90, 110], y=16)
    r.shelf_wall(140, 210, 20, BOTTLES)
    # grande table de préparation
    r.box(110, 90, 190, 108, (88, 62, 40))
    d = r.d
    d.ellipse([126, 92, 140, 100], fill=(120, 120, 130), outline=(30, 30, 36))  # mortier
    d.rectangle([155, 92, 176, 100], fill=(110, 160, 90), outline=(40, 60, 30))
    # plantes en pot partout
    r.plant_pot(30, 120); r.plant_pot(48, 148); r.plant_pot(270, 100)
    r.plant_pot(252, 140, leaf=(110, 150, 60)); r.plant_pot(80, 96, leaf=(60, 140, 90))
    r.sack(220, 150); r.sack(238, 158)
    r.save('herboristerie', brightness=0.97, saturation=1.05)


def echoppe():
    r = Room(wall=(70, 52, 40), wall_dark=(54, 40, 32), floor_a=(94, 68, 46), floor_b=(80, 56, 38), accent=(255, 200, 100))
    r.draw_walls_wood()
    r.draw_floor_planks()
    r.window_warm(40)
    r.shelf_wall(80, 170, 16, BOOKS + BOTTLES)
    r.shelf_wall(190, 270, 16, BOTTLES)
    # comptoir en L
    r.counter(60, 86, 180)
    r.box(180, 86, 196, 140, (88, 58, 36))
    # marchandises
    r.crate(220, 60); r.crate(238, 66); r.crate(228, 78)
    r.sack(260, 120); r.sack(276, 128); r.sack(244, 132)
    r.crate(30, 130); r.sack(52, 150)
    r.rug(90, 110, 170, 156, (90, 66, 40), (56, 40, 24))
    r.save('echoppe', brightness=0.96, saturation=1.0)


def maison_quenticast():
    r = Room(wall=(46, 48, 66), wall_dark=(36, 38, 54), floor_a=(76, 64, 56), floor_b=(64, 54, 48), accent=(90, 180, 255))
    r.draw_walls_wood()
    r.draw_floor_planks()
    # affiches au mur
    d = r.d
    d.rectangle([30, 10, 54, 36], fill=(40, 60, 90), outline=(16, 20, 32))
    d.rectangle([34, 14, 50, 22], fill=(90, 180, 255))
    d.rectangle([220, 12, 250, 34], fill=(70, 40, 80), outline=(24, 14, 30))
    # bureau « machines arcaniques » (setup de geek)
    r.box(120, 70, 220, 92, (58, 48, 60))
    r.screen_arcane(130, 58); r.screen_arcane(148, 54, w=18, h=13); r.screen_arcane(172, 56, w=15, h=11); r.screen_arcane(194, 58)
    d.line([(140, 70), (140, 92)], fill=(30, 34, 50))
    # tour arcanique qui clignote
    d.rectangle([226, 62, 240, 92], fill=(28, 30, 42), outline=(12, 12, 20))
    d.point((233, 68), fill=(90, 255, 140)); d.point((233, 74), fill=(90, 180, 255)); d.point((233, 80), fill=(255, 90, 120))
    r.stool(170, 102)
    r.bed(24, 120, blanket=(50, 70, 110))
    r.crate(260, 130); r.crate(276, 140)
    # tasses de café du greffier un peu partout
    for (cx, cy) in ((116, 96), (228, 100), (250, 96)):
        d.rectangle([cx, cy - 3, cx + 5, cy], fill=(150, 120, 90), outline=(40, 30, 20))
    r.rug(120, 108, 220, 150, (44, 54, 84), (28, 34, 54))
    r.save('quenticast', brightness=0.9, saturation=1.0)


if __name__ == '__main__':
    build_npcs()
    print('== Intérieurs de Ramees ==')
    auberge()
    eglise()
    mairie()
    forge()
    herboristerie()
    echoppe()
    maison_quenticast()
    print('OK.')
