"""Build Past era tileset (256x128, 8x4 of 32x32) and multi-tile props from the two source sheets.
Run from repo root:
    python tools/build_past_assets.py
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
BASE_TILESET = "public/sprites/past-tileset.png"
OUT_TILESET = "public/sprites/past-tileset.png"
OUT_PROPS_DIR = "public/sprites/props/past"
PREVIEW_PATH = (
    "C:/Users/luizm/.gemini/antigravity/brain/da258bac-a3c0-4e7b-81ef-1a838c8a8a14"
    "/scratch/past_overhaul_preview.png"
)

T = 32


def is_checker(r: int, g: int, b: int) -> bool:
    mx, mn = max(r, g, b), min(r, g, b)
    return mn > 168 and (mx - mn) < 24


def remove_checker_bg(im: Image.Image, clean_interior_checker: bool = False) -> Image.Image:
    """Flood-fill checkerboard from image borders and optionally enclosed checker holes."""
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
                if mn > 188 and (mx - mn) < 14 and not bg[y][x]:
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

    # Clean 1px bright low-saturation JPEG fringe adjacent to transparent pixels
    to_clear = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            mx, mn = max(r, g, b), min(r, g, b)
            if mn > 145 and (mx - mn) < 20:
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
    """Create a 32x32 seamless stone/brick tile by cropping interior and stripping outer dark lines."""
    crop = src.convert("RGBA").resize((size, size), Image.NEAREST)
    px = crop.load()
    # Replace outermost 2px border with 3rd inner line to avoid dark grid seams
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


def to_background_wall(tile: Image.Image, lum_scale: float = 0.56, sat_scale: float = 0.45) -> Image.Image:
    """Darken, desaturate, and compress contrast so background walls sit cleanly behind foreground."""
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
    """Build textured mossy stone top slabs (0=topLeft, 1=top, 2=topRight) from Sheet 1 [02]."""
    block = remove_checker_bg(sheet1.crop((14, 124, 127, 190)))
    # Top 32px of the mossy stone block scaled to 64x32, then sliced into left(20)/mid(24)/right(20)
    slab_full = block.resize((96, 48), Image.NEAREST)
    top_mid = slab_full.crop((32, 0, 64, 32))
    top_left = slab_full.crop((0, 0, 32, 32))
    top_right = slab_full.crop((64, 0, 96, 32))

    # Ensure crisp dark outline on top edge & outer vertical edges for foreground readability
    for tile in (top_left, top_mid, top_right):
        px = tile.load()
        for x in range(T):
            if px[x, 0][3] > 0:
                r, g, b, a = px[x, 0]
                px[x, 0] = (min(r, 42), min(g, 34), min(b, 30), 255)
            # Subtle highlight on row 1
            if px[x, 1][3] > 0:
                r, g, b, a = px[x, 1]
                px[x, 1] = (min(255, int(r * 1.15)), min(255, int(g * 1.15)), min(255, int(b * 1.10)), 255)

    # Blend bottom row into the seamless brick fill so row 0 connects cleanly to row 1
    return top_left, top_mid, top_right


def build_oneway_planks(sheet2: Image.Image) -> tuple[Image.Image, Image.Image, Image.Image]:
    """Build wooden bridge one-way planks (4=left, 5=mid, 6=right) aligned to top of 32x32 cell."""
    plank = remove_checker_bg(sheet2.crop((388, 84, 466, 116)))
    plank = trim_alpha(plank).resize((72, 14), Image.NEAREST)
    left = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    mid = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    right = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    left.paste(plank.crop((0, 0, 32, 14)), (0, 0))
    mid.paste(plank.crop((20, 0, 52, 14)), (0, 0))
    right.paste(plank.crop((40, 0, 72, 14)), (0, 0))
    return left, mid, right


def build_pit_edges(
    top_left: Image.Image,
    top_right: Image.Image,
    brick_fill: Image.Image,
) -> tuple[Image.Image, Image.Image]:
    """Build crumbling stone pit edges (22=pitEdgeLeft, 23=pitEdgeRight) using the exact same stone/brick palette."""
    # Combine top slab (top 14px) and brick fill (bottom 18px), then carve a stepped stone ruin silhouette on the right
    base_l = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    base_l.paste(brick_fill, (0, 0))
    base_l.paste(top_left.crop((0, 0, T, 16)), (0, 0))
    px = base_l.load()

    # Stepped ruin edge profile (x_max_solid per y band)
    profile = [
        (0, 4, 24),
        (4, 9, 27),
        (9, 14, 22),
        (14, 20, 18),
        (20, 26, 21),
        (26, 32, 25),
    ]
    for y0, y1, xmax in profile:
        for y in range(y0, y1):
            for x in range(xmax, T):
                px[x, y] = (0, 0, 0, 0)
            # Crisp dark outline on the carved edge
            if xmax > 1:
                px[xmax - 1, y] = (34, 26, 24, 255)
                px[xmax - 2, y] = (58, 46, 40, 255)

    # pitEdgeRight has solid on the right and pit on the left
    base_r = base_l.transpose(Image.FLIP_LEFT_RIGHT)
    # Match top-right corner highlight
    tr_px = top_right.load()
    pr_px = base_r.load()
    for y in range(6):
        for x in range(14, T):
            if pr_px[x, y][3] > 0 and tr_px[x, y][3] > 0:
                pr_px[x, y] = tr_px[x, y]

    return base_l, base_r


def build_inner_corners(sheet1: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Build compact stone corbel brackets (12=innerCornerLeft, 13=innerCornerRight) for room ceilings."""
    arch = remove_checker_bg(sheet1.crop((136, 123, 240, 192)), clean_interior_checker=True)
    arch = trim_alpha(arch)
    aw, ah = arch.size
    # Use a compact 24x24 corbel in the upper-left corner so it frames rooms cleanly without protruding
    corbel = arch.crop((0, 0, min(aw // 2, 34), min(ah // 2, 34))).resize((22, 22), Image.NEAREST)
    corner_l = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    corner_l.paste(corbel, (0, 0), corbel)
    corner_l = to_background_wall(corner_l, lum_scale=0.68, sat_scale=0.60)
    corner_r = corner_l.transpose(Image.FLIP_LEFT_RIGHT)
    return corner_l, corner_r


def main() -> None:
    os.makedirs(OUT_PROPS_DIR, exist_ok=True)
    sheet1 = Image.open(SHEET1_PATH).convert("RGB")
    sheet2 = Image.open(SHEET2_PATH).convert("RGB")
    tileset = Image.open(BASE_TILESET).convert("RGBA")

    # 1. Rebuild terrain tiles in past-tileset.png
    top_left, top_mid, top_right = build_top_slabs(sheet1)
    put_tile(tileset, 0, top_left)
    put_tile(tileset, 1, top_mid)
    put_tile(tileset, 2, top_right)

    ow_l, ow_m, ow_r = build_oneway_planks(sheet2)
    put_tile(tileset, 4, ow_l)
    put_tile(tileset, 5, ow_m)
    put_tile(tileset, 6, ow_r)

    # Solid brick fill (frame 8) from Sheet 1 [02] lower brick area (clean, no top moss/shadow)
    brick_src = sheet1.crop((24, 158, 88, 188))
    brick_fill = make_seamless_fill(brick_src)
    put_tile(tileset, 8, brick_fill)

    # Clear deleted legacy tiles (24, 25, 26 railings & 28 tiny door)
    empty_tile = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    for dead_idx in (24, 25, 26, 28):
        put_tile(tileset, dead_idx, empty_tile)

    # Background wall variations (16, 17, 18, 19) from Sheet 1 [03], [04], [09] & Sheet 2 [02]
    bg_sources = [
        sheet1.crop((140, 19, 177, 55)),
        sheet1.crop((140, 69, 177, 108)),
        sheet1.crop((250, 94, 284, 140)),
        sheet2.crop((112, 16, 176, 64)),
    ]
    for idx, src in zip((16, 17, 18, 19), bg_sources):
        put_tile(tileset, idx, to_background_wall(make_seamless_fill(src)))

    # Pit edges (22, 23) & inner ceiling corners (12, 13)
    pit_l, pit_r = build_pit_edges(top_left, top_right, brick_fill)
    put_tile(tileset, 22, pit_l)
    put_tile(tileset, 23, pit_r)

    corbel_l, corbel_r = build_inner_corners(sheet1)
    put_tile(tileset, 12, corbel_l)
    put_tile(tileset, 13, corbel_r)

    # Clean mossy ceiling vines (14) from Sheet 2 [03] hanging moss (keep only green/mossy foliage)
    vines = remove_checker_bg(sheet2.crop((152, 92, 220, 126)))
    vpx = vines.load()
    for y in range(vines.height):
        for x in range(vines.width):
            r, g, b, a = vpx[x, y]
            if a > 0 and y < 14 and not (g > r + 4 and g >= b):
                vpx[x, y] = (0, 0, 0, 0)
    vines = trim_alpha(vines).resize((32, 18), Image.NEAREST)
    vine_tile = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    vine_tile.paste(vines, (0, 0), vines)
    put_tile(tileset, 14, vine_tile)

    tileset.save(OUT_TILESET)
    print("Saved tileset:", OUT_TILESET, tileset.size)

    # 2. Extract 13 multi-tile Past props
    props: dict[str, Image.Image] = {
        "window": extract_prop(sheet2, (575, 9, 616, 95), 68),
        "door": extract_prop(sheet1, (423, 66, 495, 193), 62),
        "portal": extract_prop(sheet2, (312, 9, 378, 88), 60),
        "torch": extract_prop(sheet1, (634, 18, 673, 100), 44),
        "banner": extract_prop(sheet1, (572, 15, 630, 107), 52),
        "banner-alt": extract_prop(sheet2, (878, 9, 923, 96), 52),
        "brazier": extract_prop(sheet1, (852, 137, 895, 193), 38),
        "bookshelf": extract_prop(sheet2, (723, 128, 771, 184), 44),
        "stall": extract_prop(sheet2, (810, 100, 889, 184), 52, clean_interior=True),
        "cage": extract_prop(sheet1, (709, 106, 756, 193), 56, clean_interior=True),
        "arch": extract_prop(sheet2, (476, 9, 562, 184), 84, clean_interior=True),
        "tower": extract_prop(sheet1, (910, 15, 1009, 193), 132),
        "gate": extract_prop(sheet1, (852, 15, 895, 133), 96, clean_interior=True).resize((32, 96), Image.NEAREST),
    }

    # Compose crate+barrel cluster for "crates"
    crate = extract_prop(sheet2, (975, 103, 1016, 143), 26)
    barrel = extract_prop(sheet2, (964, 149, 993, 184), 24)
    crates = Image.new("RGBA", (crate.width + barrel.width - 2, max(crate.height, barrel.height)), (0, 0, 0, 0))
    crates.alpha_composite(crate, (0, crates.height - crate.height))
    crates.alpha_composite(barrel, (crate.width - 2, crates.height - barrel.height))
    props["crates"] = crates

    for name, img in props.items():
        path = f"{OUT_PROPS_DIR}/{name}.png"
        img.save(path)
        print(f"  prop {name}: {img.size}")

    # 3. Generate inspection preview (tileset + 3x3 wall/bg sample + props next to player)
    pw, ph = 720, 420
    prev = Image.new("RGBA", (pw, ph), (32, 22, 28, 255))
    prev.alpha_composite(tileset.resize((512, 256), Image.NEAREST), (0, 0))

    # 3x3 tiling test: fg top + brick fill (left) and bg wall (right)
    for gy in range(3):
        for gx in range(3):
            fg_t = get_tile(tileset, gx if gy == 0 else 8)
            prev.alpha_composite(fg_t, (528 + gx * 32, 8 + gy * 32))
            bg_t = get_tile(tileset, 16 + ((gx * 7 + gy * 13) % 4))
            prev.alpha_composite(bg_t, (528 + gx * 32, 120 + gy * 32))

    # Pit edge test
    prev.alpha_composite(get_tile(tileset, 1), (528, 228))
    prev.alpha_composite(get_tile(tileset, 22), (560, 228))
    prev.alpha_composite(get_tile(tileset, 23), (624, 228))
    prev.alpha_composite(get_tile(tileset, 1), (656, 228))

    # Props row at bottom
    cx = 8
    for name in ("window", "door", "portal", "torch", "banner", "banner-alt", "brazier", "crates", "bookshelf", "stall", "cage", "arch", "tower"):
        img = props[name]
        if cx + img.width + 6 > pw:
            break
        prev.alpha_composite(img, (cx, ph - 8 - img.height))
        cx += img.width + 6

    prev.save(PREVIEW_PATH)
    print("Saved preview:", PREVIEW_PATH)


if __name__ == "__main__":
    main()
