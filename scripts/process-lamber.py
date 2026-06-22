#!/usr/bin/env python3
"""Traite les 3 tilesheets de Lamber :
1. Détecte automatiquement les tailles de tile en analysant les colonnes/lignes vides
2. Retire le fond blanc par flood-fill
3. Sauve avec transparence
"""
from PIL import Image
from collections import deque
import os, sys

DIR = '/home/user/Jeu/public/assets/exploration/lamber/tilesets'

THRESHOLD = 235
COLOR_TOLERANCE = 18

def is_bg(r, g, b):
    if r < THRESHOLD or g < THRESHOLD or b < THRESHOLD:
        return False
    return (max(r, g, b) - min(r, g, b)) <= COLOR_TOLERANCE


def remove_white_bg(img):
    img = img.convert('RGBA')
    w, h = img.size
    px = img.load()
    bg = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            r, g, b, _ = px[x, y]
            if is_bg(r, g, b):
                bg[y][x] = True; q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            r, g, b, _ = px[x, y]
            if is_bg(r, g, b) and not bg[y][x]:
                bg[y][x] = True; q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx]:
                r, g, b, _ = px[nx, ny]
                if is_bg(r, g, b):
                    bg[ny][nx] = True; q.append((nx, ny))
    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0)
    return img


def detect_grid(img):
    """Détecte la grille (cols, rows) en analysant les colonnes et lignes
    entièrement transparentes (séparateurs entre tiles)."""
    w, h = img.size
    px = img.load()
    # Colonnes vides (toutes pixels alpha == 0)
    col_empty = [True] * w
    row_empty = [True] * h
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 30:
                col_empty[x] = False
                row_empty[y] = False
    # Compte les transitions empty→non-empty pour deviner combien de tiles
    cols = 0; prev = True
    for e in col_empty:
        if prev and not e: cols += 1
        prev = e
    rows = 0; prev = True
    for e in row_empty:
        if prev and not e: rows += 1
        prev = e
    return cols, rows, col_empty, row_empty


def main():
    results = {}
    for fn in ('ground.png', 'trees.png', 'camps.png'):
        p = os.path.join(DIR, fn)
        if not os.path.exists(p):
            print(f'!! skip {fn}'); continue
        img = Image.open(p)
        print(f'{fn}: in={img.size} mode={img.mode}')
        img = remove_white_bg(img)
        cols, rows, _, _ = detect_grid(img)
        tile_w = img.width // cols if cols else img.width
        tile_h = img.height // rows if rows else img.height
        print(f'  → détecté {cols} cols × {rows} rows → tile {tile_w}×{tile_h}')
        # Sauve
        img.save(p, optimize=True)
        sz = os.path.getsize(p)
        print(f'  → {sz // 1024} KB sauvegardé')
        results[fn] = (cols, rows, tile_w, tile_h)
    # Affiche un récap propre pour copier-coller dans le code
    print('\nRécap pour le code (ensureSpritesheet args) :')
    for fn, (c, r, tw, th) in results.items():
        print(f'  {fn}: cols={c} rows={r} tile={tw}x{th}')


if __name__ == '__main__':
    sys.exit(main())
