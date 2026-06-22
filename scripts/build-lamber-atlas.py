#!/usr/bin/env python3
"""Génère un atlas JSON pour chaque tilesheet de Lamber en détectant
chaque tile par sa bounding box (flood-fill 4-connexité).
Sauve un .json à côté du .png que Phaser peut charger via load.atlas().
"""
from PIL import Image
import os, json

DIR = '/home/user/Jeu/public/assets/exploration/lamber/tilesets'

# Seuil minimum de pixels pour considérer un blob comme une vraie tile
MIN_PIXELS = 300


def detect_tiles(path):
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    px = im.load()
    visited = [[False] * w for _ in range(h)]
    tiles = []
    for sy in range(h):
        for sx in range(w):
            if visited[sy][sx] or px[sx, sy][3] < 30: continue
            stack = [(sx, sy)]
            minx, miny, maxx, maxy = sx, sy, sx, sy
            count = 0
            while stack:
                x, y = stack.pop()
                if x < 0 or y < 0 or x >= w or y >= h: continue
                if visited[y][x] or px[x, y][3] < 30: continue
                visited[y][x] = True
                count += 1
                if x < minx: minx = x
                if y < miny: miny = y
                if x > maxx: maxx = x
                if y > maxy: maxy = y
                stack.append((x+1, y))
                stack.append((x-1, y))
                stack.append((x, y+1))
                stack.append((x, y-1))
            if count < MIN_PIXELS: continue
            tiles.append((minx, miny, maxx - minx + 1, maxy - miny + 1))
    return tiles, (w, h)


def write_atlas(png_path, prefix):
    json_path = png_path.replace('.png', '.json')
    tiles, (w, h) = detect_tiles(png_path)
    # Trie par row (y) puis col (x) pour des noms ordonnés top→bottom, left→right
    tiles.sort(key=lambda t: (t[1] // 50, t[0]))
    atlas = {
        'frames': {},
        'meta': {
            'image': os.path.basename(png_path),
            'format': 'RGBA8888',
            'size': {'w': w, 'h': h},
            'scale': '1',
        },
    }
    for i, (x, y, tw, th) in enumerate(tiles):
        name = f'{prefix}_{i}'
        atlas['frames'][name] = {
            'frame': {'x': x, 'y': y, 'w': tw, 'h': th},
            'rotated': False,
            'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': tw, 'h': th},
            'sourceSize': {'w': tw, 'h': th},
        }
    with open(json_path, 'w') as f:
        json.dump(atlas, f, separators=(',', ':'))
    sz = os.path.getsize(json_path)
    print(f'{png_path.split("/")[-1]}: {len(tiles)} tiles → {json_path.split("/")[-1]} ({sz // 1024} KB)')


def main():
    for fn, prefix in (('ground.png', 'ground'), ('trees.png', 'tree'), ('camps.png', 'camp')):
        p = os.path.join(DIR, fn)
        if os.path.exists(p):
            write_atlas(p, prefix)


if __name__ == '__main__':
    main()
