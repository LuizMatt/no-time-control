"""Post-process era tilesets (8x4 sheets of 32x32). Run from repo root: python tools/fix_tilesets.py [src_dir] [dst_dir]
1. Seamless wall/brick tiles: strip dark outer border ring.
2. Depth: background walls (16..19) darker, desaturated, no black outlines.
3. Decor (14 vines/wires, 30 grate/window): fully transparent surroundings.
"""
import colorsys
import sys
from collections import deque
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "public/sprites"
DST = sys.argv[2] if len(sys.argv) > 2 else "public/sprites"
T = 32
WALLS = [8, 9, 10, 15, 16, 17, 18, 19]
BG_WALLS = [16, 17, 18, 19]


def lum(p):
    return (p[0] + p[1] + p[2]) / 3


def get(im, i):
    r, c = divmod(i, 8)
    return im.crop((c * T, r * T, c * T + T, r * T + T))


def put(im, i, t):
    r, c = divmod(i, 8)
    im.paste(t, (c * T, r * T))


def side_line(px, side, k):
    if side == "T":
        return [(x, k) for x in range(T)]
    if side == "B":
        return [(x, T - 1 - k) for x in range(T)]
    if side == "L":
        return [(k, y) for y in range(T)]
    return [(T - 1 - k, y) for y in range(T)]


def mean_lum(px, pts):
    return sum(lum(px[p]) for p in pts[4:28]) / 24


def seamless(t):
    t = t.copy()
    px = t.load()
    for side in "TBLR":
        ref = mean_lum(px, side_line(px, side, 4))
        # find how many outer lines are darker than the interior
        n = 0
        for k in range(3):
            if mean_lum(px, side_line(px, side, k)) < ref * 0.82:
                n = k + 1
        # also always strip at least the outermost line if it is notably dark
        if n == 0:
            continue
        src_k = n + 1  # first clean line
        src = side_line(px, side, src_k)
        for k in range(n):
            dst = side_line(px, side, k)
            for a, b in zip(dst, src):
                px[a] = px[b]
    return t


def background(t):
    t = t.copy()
    px = t.load()
    vals = [lum(px[x, y]) for x in range(T) for y in range(T)]
    mean = sum(vals) / len(vals)
    for y in range(T):
        for x in range(T):
            r, g, b, a = px[x, y]
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            L = v * 255
            L = mean + (L - mean) * 0.45  # compress contrast: kills black outlines
            L *= 0.62
            s *= 0.45
            nr, ng, nb = colorsys.hsv_to_rgb(h, s, min(1, max(0, L / 255)))
            px[x, y] = (round(nr * 255), round(ng * 255), round(nb * 255), a)
    return t


def vines(t):
    t = t.copy()
    px = t.load()
    for y in range(T):
        for x in range(T):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            green = g > r + 4 and g >= b
            if y < 16 and not green:
                px[x, y] = (0, 0, 0, 0)
    return t


def flood_clear(t, tol, rect=None, dark_inside=None):
    """Clear everything outside the decor: flood from borders by colour similarity."""
    t = t.copy()
    px = t.load()
    if rect:
        x0, y0, x1, y1 = rect
        for y in range(T):
            for x in range(T):
                if not (x0 <= x <= x1 and y0 <= y <= y1):
                    px[x, y] = (0, 0, 0, 0)
    else:
        seen = set()
        q = deque()
        for i in range(T):
            for p in [(i, 0), (i, T - 1), (0, i), (T - 1, i)]:
                q.append((p, px[p]))
        while q:
            (x, y), ref = q.popleft()
            if (x, y) in seen:
                continue
            seen.add((x, y))
            c = px[x, y]
            if c[3] == 0 or max(abs(c[i] - ref[i]) for i in range(3)) <= tol:
                px[x, y] = (0, 0, 0, 0)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < T and 0 <= ny < T and (nx, ny) not in seen:
                        q.append(((nx, ny), c))
    if dark_inside:
        for y in range(T):
            for x in range(T):
                if px[x, y][3] and lum(px[x, y]) < dark_inside:
                    px[x, y] = (0, 0, 0, 0)
    return t


for era in ["past", "present", "future"]:
    im = Image.open(f"{SRC}/{era}-tileset.png").convert("RGBA")
    for i in WALLS:
        put(im, i, seamless(get(im, i)))
    for i in BG_WALLS:
        put(im, i, background(get(im, i)))
    put(im, 14, vines(get(im, 14)))
    if era == "past":
        put(im, 30, flood_clear(get(im, 30), 0, rect=(4, 3, 27, 28), dark_inside=48))
    elif era == "future":
        put(im, 30, flood_clear(get(im, 30), 0, rect=(1, 3, 30, 29)))
    else:
        put(im, 30, flood_clear(get(im, 30), 14))
    im.save(f"{DST}/{era}-tileset.png")
    print("ok", era)
