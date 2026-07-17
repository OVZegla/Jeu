#!/usr/bin/env python3
"""Nettoie le détourage des sprites : rend transparents les restes de fond
blanc (poches opaques entre bras/corps, halos) sans toucher aux blancs
légitimes à l'intérieur des personnages.

Méthode : flood-fill depuis les bords de l'image et depuis les pixels déjà
transparents. Tout pixel quasi-blanc (clair et peu saturé) atteignable par
cette propagation fait partie du fond → alpha 0. Un second passage adoucit
le liseré clair au contact des zones effacées.

Usage : python3 scripts/fix-sprite-fringe.py
(ré-exécuter ensuite gen-derived-assets.py pour régénérer les dérivés)
"""
from PIL import Image
from collections import deque
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
PUB = os.path.join(ROOT, 'public', 'assets')

TARGETS = [
    'sprites/datpaloof.png',
    'sprites/baghaar.png',
    'sprites/zlatax.png',
    'sprites/boss.png',
    'exploration/bureau/boss.png',
    'exploration/datpaloof/front.png',
    'exploration/datpaloof/back.png',
    'exploration/datpaloof/left.png',
    'exploration/datpaloof/right.png',
    'exploration/summon_stone.png',
]


def is_near_white(r, g, b):
    """Fond blanc / gris très clair, peu saturé."""
    mx, mn = max(r, g, b), min(r, g, b)
    return mn > 205 and (mx - mn) < 26


def is_halo(r, g, b):
    """Liseré plus tolérant (gris clair) pour le second passage."""
    mx, mn = max(r, g, b), min(r, g, b)
    return mn > 178 and (mx - mn) < 34


def is_flat_white(r, g, b):
    """Blanc de fond « plat » (ex: 249,249,249) — même enfermé dans un contour."""
    mx, mn = max(r, g, b), min(r, g, b)
    return mn >= 240 and (mx - mn) <= 10


def clear_flat_white_pockets(px, w, h, min_size=20):
    """Composantes connexes de blanc plat ≥ min_size px → fond (alpha 0).
    Les petites touches de blanc pur (reflets) sont conservées."""
    seen = bytearray(w * h)
    removed = 0
    for sy in range(h):
        for sx in range(w):
            i0 = sy * w + sx
            if seen[i0]:
                continue
            r, g, b, a = px[sx, sy]
            if a < 30 or not is_flat_white(r, g, b):
                seen[i0] = 1
                continue
            # BFS de la composante
            comp = [(sx, sy)]
            seen[i0] = 1
            q = deque(comp)
            while q:
                x, y = q.popleft()
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        i = ny * w + nx
                        if not seen[i]:
                            nr, ng, nb, na = px[nx, ny]
                            if na >= 30 and is_flat_white(nr, ng, nb):
                                seen[i] = 1
                                comp.append((nx, ny))
                                q.append((nx, ny))
                            else:
                                seen[i] = 1 if na < 30 else seen[i]
            if len(comp) >= min_size:
                for (x, y) in comp:
                    r, g, b, a = px[x, y]
                    px[x, y] = (r, g, b, 0)
                removed += len(comp)
    return removed


def clean(path):
    img = Image.open(path).convert('RGBA')
    px = img.load()
    w, h = img.size

    # 0) Poches de blanc plat enfermées dans les contours.
    removed_pockets = clear_flat_white_pockets(px, w, h)

    # 1) Flood-fill : le fond = transparent OU quasi-blanc, connecté au bord
    #    ou à une zone transparente existante.
    visited = bytearray(w * h)
    q = deque()

    def try_seed(x, y):
        i = y * w + x
        if visited[i]:
            return
        r, g, b, a = px[x, y]
        if a < 30 or is_near_white(r, g, b):
            visited[i] = 1
            q.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)
    for y in range(h):
        for x in range(w):
            if px[x, y][3] < 30:
                i = y * w + x
                if not visited[i]:
                    visited[i] = 1
                    q.append((x, y))

    removed = 0
    while q:
        x, y = q.popleft()
        r, g, b, a = px[x, y]
        if a >= 30 and is_near_white(r, g, b):
            px[x, y] = (r, g, b, 0)
            removed += 1
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if not visited[i]:
                    nr, ng, nb, na = px[nx, ny]
                    if na < 30 or is_near_white(nr, ng, nb):
                        visited[i] = 1
                        q.append((nx, ny))

    # 2) Liseré : 2 passes — pixels gris clair au contact direct du transparent.
    for _ in range(2):
        to_clear = []
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a < 30 or not is_halo(r, g, b):
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] < 30:
                        to_clear.append((x, y))
                        break
        for (x, y) in to_clear:
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 0)
        removed += len(to_clear)

    img.save(path)
    print(f'  {os.path.relpath(path, PUB)}: {removed + removed_pockets} pixels de fond effacés (dont {removed_pockets} poches)')


if __name__ == '__main__':
    print('== Nettoyage du détourage ==')
    for rel in TARGETS:
        p = os.path.join(PUB, rel)
        if os.path.exists(p):
            clean(p)
