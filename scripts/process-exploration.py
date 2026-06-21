#!/usr/bin/env python3
"""Traite les assets de la scène d'exploration multi-maps :
- Sprites perso datpaloof/{front,back,left,right}.png : retire fond blanc + resize
- Boss bureau/boss.png + summon_stone.png : retire fond blanc + resize
- Maps {bureau,ramees}/map.png : converti en JPG optimisé
"""
from PIL import Image
from collections import deque
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EX = os.path.join(ROOT, 'public', 'assets', 'exploration')

THRESHOLD = 235
COLOR_TOLERANCE = 18


def is_bg(r, g, b):
    if r < THRESHOLD or g < THRESHOLD or b < THRESHOLD:
        return False
    mx = max(r, g, b); mn = min(r, g, b)
    return (mx - mn) <= COLOR_TOLERANCE


def remove_white_bg(img: Image.Image) -> Image.Image:
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
    edges = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 255:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                        edges.append((x, y)); break
    for x, y in edges:
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 220)
    return img


def fit(img: Image.Image, max_dim: int) -> Image.Image:
    w, h = img.size
    if max(w, h) <= max_dim:
        return img
    if w >= h:
        return img.resize((max_dim, round(h * max_dim / w)), Image.LANCZOS)
    return img.resize((round(w * max_dim / h), max_dim), Image.LANCZOS)


def process_sprite(path: str, max_dim: int):
    if not os.path.exists(path):
        return
    img = Image.open(path)
    print(f'{path}: in={img.size} mode={img.mode}')
    img = remove_white_bg(img)
    bb = img.getbbox()
    if bb:
        l, t, r, b = bb
        l = max(0, l - 1); t = max(0, t - 1)
        r = min(img.width, r + 1); b = min(img.height, b + 1)
        img = img.crop((l, t, r, b))
    img = fit(img, max_dim)
    img.save(path, optimize=True)
    sz = os.path.getsize(path)
    print(f'  → {img.size} ({sz // 1024} KB)')


def process_map(path: str):
    if not os.path.exists(path):
        return
    img = Image.open(path).convert('RGB')
    print(f'{path}: in={img.size}')
    img = fit(img, 1600)
    jpg_path = path.replace('.png', '.jpg')
    img.save(jpg_path, quality=88, optimize=True)
    if path != jpg_path:
        os.remove(path)
    sz = os.path.getsize(jpg_path)
    print(f'  → {img.size} → {jpg_path} ({sz // 1024} KB)')


def main():
    # Datpaloof — partagé entre toutes les maps
    for d in ('front', 'back', 'left', 'right'):
        process_sprite(os.path.join(EX, 'datpaloof', f'{d}.png'), 280)

    # Boss + summon stone (partagés / à la racine ou par map)
    process_sprite(os.path.join(EX, 'bureau', 'boss.png'), 380)
    process_sprite(os.path.join(EX, 'summon_stone.png'), 220)

    # Maps
    process_map(os.path.join(EX, 'bureau', 'map.png'))
    process_map(os.path.join(EX, 'ramees', 'map.png'))


if __name__ == '__main__':
    sys.exit(main())
