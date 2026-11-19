"""Build Present era tileset (256x128, 8x4 of 32x32) and multi-tile props from the two source sheets.
Run from repo root:
    python tools/build_present_assets.py
"""
import colorsys
import os
from collections import deque
from PIL import Image

SHEET1_PATH = (
    "C:/Users/luizm/.gemini/antigravity/brain/da258bac-a3c0-4e7b-81ef-1a838c8a8a14"
    "/.user_uploaded/media_1795046914902_760a7859.jpg"
)
SHEET2_PATH = (
    "C:/Users/luizm/.gemini/antigravity/brain/da258bac-a3c0-4e7b-81ef-1a838c8a8a14"
    "/.user_uploaded/media_1795047406779_69f8f7ec.jpg"
)
BASE_TILESET = "public/sprites/present-tileset.png"
OUT_TILESET = "public/sprites/present-tileset.png"
OUT_PROPS_DIR = "public/sprites/props/present"
PREVIEW_PATH = (
    "C:/Users/luizm/.gemini/antigravity/brain/da258bac-a3c0-4e7b-81ef-1a838c8a8a14"
    "/scratch/present_overhaul_preview.png"
)

T = 32


def is_checker(r: int, g: int, b: int) -> bool:
    mx, mn = max(r, g, b), min(r, g, b)
    return mn > 168 and (mx - mn) < 24


def remove_checker_bg(im: Image.Image, clean_interior_checker: bool = False) -> Image.Image:
    rgba = im.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    bg = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        if is_checker(*px[x, 0][:3]):
            bg[0][x] = True
            q.append((x, 0))
        if is_checker(*px[x, h - 1][:3]):
            bg[h - 1][x] = True
            q.append((x, h - 1))
    for y in range(h):
        if is_checker(*px[0, y][:3]):
            bg[y][0] = True
            q.append((0, y))
        if is_checker(*px[w - 1, y][:3]):
            bg[y][w - 1] = True
            q.append((w - 1, y))

    if clean_interior_checker:
        for y in range(h):
            for x in range(w):
                r, g, b, _ = px[x, y]
                mx, mn = max(r, g, b), min(r, g, b)
                if mn > 192 and (mx - mn) < 14 and not bg[y][x]:
                    bg[y][x] = True
                    q.append((x, y))

    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx]:
                if is_checker(*px[nx, ny][:3]):
                    bg[ny][nx] = True
                    q.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                px[x, y] = (0, 0, 0, 0)

    to_clear = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            mx, mn = max(r, g, b), min(r, g, b)
            if mn > 155 and (mx - mn) < 18:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                        to_clear.append((x, y))
                        break
    for x, y in to_clear:
        px[x, y] = (0, 0, 0, 0)

    return rgba


def trim_alpha(im: Image.Image) -> Image.Image:
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im


def extract_prop(
    sheet: Image.Image,
    box: tuple[int, int, int, int],
    target_h: int,
    clean_interior: bool = False,
) -> Image.Image:
    crop = remove_checker_bg(sheet.crop(box), clean_interior_checker=clean_interior)
    crop = trim_alpha(crop)
    w, h = crop.size
    target_w = max(1, round(w * target_h / h))
    return crop.resize((target_w, target_h), Image.NEAREST)


def put_tile(sheet: Image.Image, idx: int, tile: Image.Image) -> None:
    r, c = divmod(idx, 8)
    sheet.paste((0, 0, 0, 0), (c * T, r * T, c * T + T, r * T + T))
    sheet.paste(tile, (c * T, r * T), tile)


def get_tile(sheet: Image.Image, idx: int) -> Image.Image:
    r, c = divmod(idx, 8)
    return sheet.crop((c * T, r * T, c * T + T, r * T + T))


def make_seamless_fill(src: Image.Image, size: int = 32) -> Image.Image:
    crop = src.convert("RGBA").resize((size, size), Image.NEAREST)
    px = crop.load()
    for x in range(size):
        px[x, 0] = px[x, 2]
        px[x, 1] = px[x, 3]
        px[x, size - 1] = px[x, size - 3]
        px[x, size - 2] = px[x, size - 4]
    for y in range(size):
        px[0, y] = px[2, y]
        px[1, y] = px[3, y]
        px[size - 1, y] = px[size - 3, y]
        px[size - 2, y] = px[size - 4, y]
    return crop


def to_background_wall(tile: Image.Image, lum_scale: float = 0.54, sat_scale: float = 0.45) -> Image.Image:
    out = tile.copy().convert("RGBA")
    px = out.load()
    vals = [sum(px[x, y][:3]) / 3 for x in range(T) for y in range(T) if px[x, y][3] > 0]
    mean = sum(vals) / max(1, len(vals))
    for y in range(T):
        for x in range(T):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            l_val = v * 255
            l_val = mean + (l_val - mean) * 0.48
            l_val *= lum_scale
            s *= sat_scale
            nr, ng, nb = colorsys.hsv_to_rgb(h, s, min(1.0, max(0.0, l_val / 255)))
            px[x, y] = (round(nr * 255), round(ng * 255), round(nb * 255), a)
    return out


def build_top_slabs(sheet1: Image.Image) -> tuple[Image.Image, Image.Image, Image.Image]:
    """Build concrete urban roof slabs (0=topLeft, 1=top, 2=topRight) from Sheet 1 [02] lower clean ledge."""
    clean_slab = remove_checker_bg(sheet1.crop((14, 336, 126, 376)))
    clean_slab = trim_alpha(clean_slab).resize((96, 32), Image.NEAREST)
    top_left = clean_slab.crop((0, 0, 32, 32))
    top_mid = clean_slab.crop((32, 0, 64, 32))
    top_right = clean_slab.crop((64, 0, 96, 32))

    for tile in (top_left, top_mid, top_right):
        px = tile.load()
        for x in range(T):
            if px[x, 0][3] > 0:
                r, g, b, _ = px[x, 0]
                px[x, 0] = (min(r, 34), min(g, 38), min(b, 46), 255)
            if px[x, 1][3] > 0:
                r, g, b, _ = px[x, 1]
                px[x, 1] = (min(255, int(r * 1.15)), min(255, int(g * 1.15)), min(255, int(b * 1.18)), 255)

    return top_left, top_mid, top_right


def build_oneway_walkway(sheet1: Image.Image) -> tuple[Image.Image, Image.Image, Image.Image]:
    """Build steel catwalk one-way platforms (4=left, 5=mid, 6=right) from Sheet 1 [00]."""
    catwalk = remove_checker_bg(sheet1.crop((12, 216, 130, 240)), clean_interior_checker=True)
    catwalk = trim_alpha(catwalk).resize((96, 14), Image.NEAREST)
    left = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    mid = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    right = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    left.paste(catwalk.crop((0, 0, 32, 14)), (0, 0))
    mid.paste(catwalk.crop((32, 0, 64, 14)), (0, 0))
    right.paste(catwalk.crop((64, 0, 96, 14)), (0, 0))
    return left, mid, right


def build_pit_edges(
    top_left: Image.Image,
    top_right: Image.Image,
    concrete_fill: Image.Image,
) -> tuple[Image.Image, Image.Image]:
    """Build broken concrete ledge edges (22=pitEdgeLeft, 23=pitEdgeRight) matching concrete palette."""
    base_l = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    base_l.paste(concrete_fill, (0, 0))
    base_l.paste(top_left.crop((0, 0, T, 16)), (0, 0))
    px = base_l.load()

    profile = [
        (0, 5, 25),
        (5, 11, 22),
        (11, 18, 24),
        (18, 25, 19),
        (25, 32, 22),
    ]
    for y0, y1, xmax in profile:
        for y in range(y0, y1):
            for x in range(xmax, T):
                px[x, y] = (0, 0, 0, 0)
            if xmax > 1:
                px[xmax - 1, y] = (28, 32, 40, 255)
                px[xmax - 2, y] = (52, 58, 68, 255)

    base_r = base_l.transpose(Image.FLIP_LEFT_RIGHT)
    tr_px = top_right.load()
    pr_px = base_r.load()
    for y in range(6):
        for x in range(14, T):
            if pr_px[x, y][3] > 0 and tr_px[x, y][3] > 0:
                pr_px[x, y] = tr_px[x, y]

    return base_l, base_r


def build_inner_corners(concrete_fill: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Build compact steel/concrete corner brackets (12=innerCornerLeft, 13=innerCornerRight)."""
    corner_l = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    px = corner_l.load()
    fill_px = concrete_fill.load()
    for y in range(18):
        w = max(4, 18 - y)
        for x in range(w):
            r, g, b, _ = fill_px[x, y]
            if x == w - 1 or y == 17:
                px[x, y] = (30, 34, 42, 255)
            else:
                px[x, y] = (int(r * 0.65), int(g * 0.65), int(b * 0.68), 255)
    corner_r = corner_l.transpose(Image.FLIP_LEFT_RIGHT)
    return corner_l, corner_r


def main() -> None:
    os.makedirs(OUT_PROPS_DIR, exist_ok=True)
    sheet1 = Image.open(SHEET1_PATH).convert("RGB")
    sheet2 = Image.open(SHEET2_PATH).convert("RGB")
    tileset = Image.open(BASE_TILESET).convert("RGBA")

    # 1. Rebuild terrain tiles in present-tileset.png
    top_left, top_mid, top_right = build_top_slabs(sheet1)
    put_tile(tileset, 0, top_left)
    put_tile(tileset, 1, top_mid)
    put_tile(tileset, 2, top_right)

    ow_l, ow_m, ow_r = build_oneway_walkway(sheet1)
    put_tile(tileset, 4, ow_l)
    put_tile(tileset, 5, ow_m)
    put_tile(tileset, 6, ow_r)

    # Solid concrete fill (frame 8) from Sheet 2 [00] concrete panel
    concrete_src = sheet2.crop((14, 224, 72, 290))
    concrete_fill = make_seamless_fill(concrete_src)
    put_tile(tileset, 8, concrete_fill)

    # Background wall variations (16, 17, 18, 19) — cohesive concrete panels
    bg_sources = [
        sheet2.crop((14, 300, 72, 366)),
        sheet2.crop((78, 300, 136, 366)),
        sheet2.crop((14, 224, 72, 290)),
        sheet2.crop((78, 224, 136, 290)),
    ]
    for idx, src in zip((16, 17, 18, 19), bg_sources):
        put_tile(tileset, idx, to_background_wall(make_seamless_fill(src)))

    pit_l, pit_r = build_pit_edges(top_left, top_right, concrete_fill)
    put_tile(tileset, 22, pit_l)
    put_tile(tileset, 23, pit_r)

    corbel_l, corbel_r = build_inner_corners(concrete_fill)
    put_tile(tileset, 12, corbel_l)
    put_tile(tileset, 13, corbel_r)

    # Clear legacy tiny door (28) & railings (24..26) so roof looks clean like Past
    empty_tile = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    for dead_idx in (24, 25, 26, 28):
        put_tile(tileset, dead_idx, empty_tile)

    tileset.save(OUT_TILESET)
    print("Saved tileset:", OUT_TILESET, tileset.size)

    # 2. Extract 14 multi-tile Present props
    props: dict[str, Image.Image] = {
        "window": extract_prop(sheet1, (186, 213, 241, 315), 70),
        "door": extract_prop(sheet1, (432, 267, 494, 386), 68),
        "portal": extract_prop(sheet1, (501, 213, 566, 315), 64),
        "light": extract_prop(sheet2, (763, 207, 822, 253), 34),
        "banner": extract_prop(sheet1, (577, 213, 628, 329), 58),
        "banner-alt": extract_prop(sheet1, (433, 213, 493, 250), 26),
        "brazier": extract_prop(sheet1, (865, 214, 895, 276), 44),
        "crates": extract_prop(sheet1, (820, 336, 870, 386), 36),
        "bookshelf": extract_prop(sheet2, (977, 338, 1024, 395), 42),
        "stall": extract_prop(sheet1, (501, 324, 586, 386), 46, clean_interior=True),
        "cage": extract_prop(sheet2, (827, 207, 913, 250), 28),
        "arch": extract_prop(sheet1, (632, 252, 764, 322), 50, clean_interior=True),
        "tower": extract_prop(sheet1, (916, 213, 1006, 386), 136),
        "gate": extract_prop(sheet1, (691, 324, 743, 386), 96).resize((32, 96), Image.NEAREST),
    }

    for name, img in props.items():
        path = f"{OUT_PROPS_DIR}/{name}.png"
        img.save(path)
        print(f"  prop {name}: {img.size}")

    # 3. Generate inspection preview
    pw, ph = 720, 420
    prev = Image.new("RGBA", (pw, ph), (26, 28, 36, 255))
    prev.alpha_composite(tileset.resize((512, 256), Image.NEAREST), (0, 0))

    for gy in range(3):
        for gx in range(3):
            fg_t = get_tile(tileset, gx if gy == 0 else 8)
            prev.alpha_composite(fg_t, (528 + gx * 32, 8 + gy * 32))
            bg_t = get_tile(tileset, 16 + ((gx * 7 + gy * 13) % 4))
            prev.alpha_composite(bg_t, (528 + gx * 32, 120 + gy * 32))

    prev.alpha_composite(get_tile(tileset, 1), (528, 228))
    prev.alpha_composite(get_tile(tileset, 22), (560, 228))
    prev.alpha_composite(get_tile(tileset, 23), (624, 228))
    prev.alpha_composite(get_tile(tileset, 1), (656, 228))

    cx = 8
    for name in ("window", "door", "portal", "light", "banner", "banner-alt", "brazier", "crates", "bookshelf", "stall", "cage", "arch", "tower"):
        img = props[name]
        if cx + img.width + 6 > pw:
            break
        prev.alpha_composite(img, (cx, ph - 8 - img.height))
        cx += img.width + 6

    prev.save(PREVIEW_PATH)
    print("Saved preview:", PREVIEW_PATH)


if __name__ == "__main__":
    main()
