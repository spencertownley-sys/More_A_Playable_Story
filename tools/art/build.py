#!/usr/bin/env python3
"""Turn the Higgsfield art in assets/higgsfield/ into game-ready sprites.

AI "pixel art" isn't on a true pixel grid: one art pixel is anywhere from about
3 to 6 image pixels, and colours carry noise. For every asset listed in SPEC
this script:

  1. crops it out of its source sheet,
  2. removes the sheet background (flood fill from the crop border),
  3. snaps it onto a real pixel grid at the requested scale, taking the most
     common colour in each block, with colours rounded to SNES 15-bit
     (5 bits per channel),
  4. writes assets/art/<name>.png and records it in src/data/art.js.

Requires Python 3 with Pillow, NumPy and SciPy:
    pip install pillow numpy scipy
    python3 tools/art/build.py
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'assets', 'higgsfield')
OUT = os.path.join(ROOT, 'assets', 'art')

# ---------------------------------------------------------------------------
# What to extract. box = (x, y, w, h) in source pixels. scale = source pixels
# per game pixel. size = exact output size (overrides scale). key = remove the
# sheet background. frames = several boxes packed into one horizontal strip.
# ---------------------------------------------------------------------------
TILESET = 'factory_tileset.png'
CHARS = 'character_sprites.png'
PIP = 'pip_stages_and_props.png'
TS = 4.3  # factory tileset: ~4.3 source px per game px (a 140px tile -> 32px)
CS = 4.25  # character sheet: Ruth (136px tall) -> 32px

CHAR_COLS = [(262, 362), (415, 515), (567, 667), (720, 820), (855, 955)]
CHAR_ROWS = {
    'ruth': (20, 170),
    'dev': (195, 340),
    'marisol': (360, 512),
    'gus': (538, 690),
    'kid': (722, 850),
}

SPEC = [
    # full-screen backgrounds (384x288, the game's frame)
    dict(name='title_bg', src='title_screen_clean.png', size=(384, 288)),
    dict(name='earth_bg', src='earth_machine_shell.png', size=(384, 288)),
    dict(name='dawn_bg', src='dawn_exterior.png', size=(384, 288)),
    dict(name='office_bg', src='office.png', size=(384, 288)),
    dict(name='terminal_bg', src='terminal_closeup.png', size=(384, 288)),
    # Dev standing in the office: cut out of an edited copy of the office art
    # by comparing it with the original, so he lines up with office_bg exactly.
    dict(name='dev_office', src='office_dev.png', base='office.png', size=(384, 288), region=(196, 88, 248, 178)),
    # factory tiles and props
    dict(name='floor', src=TILESET, box=(26, 33, 133, 131), size=(32, 32)),
    dict(name='floor_long', src=TILESET, box=(25, 725, 480, 135), size=(112, 32)),
    dict(name='wall', src=TILESET, box=(680, 48, 124, 96), scale=TS),
    dict(name='spool', src=TILESET, box=(33, 362, 118, 150), scale=TS, key=True),
    dict(name='cutter', src=TILESET, box=(194, 356, 138, 152), scale=TS, key=True),
    dict(name='bender', src=TILESET, box=(360, 356, 134, 155), scale=TS, key=True),
    dict(name='bin', src=TILESET, box=(516, 375, 132, 128), scale=TS, key=True),
    dict(name='pallet', src=TILESET, box=(669, 360, 149, 152), scale=TS, key=True),
    dict(name='coffee', src=TILESET, box=(836, 352, 150, 162), scale=TS, key=True),
    dict(name='board', src=TILESET, box=(1010, 367, 139, 138), scale=TS, key=True),
    dict(name='panel', src=TILESET, box=(41, 540, 104, 154), scale=TS, key=True),
    dict(name='terminal', src=TILESET, box=(210, 563, 103, 120), scale=TS, key=True),
    dict(name='door', src=TILESET, box=(371, 540, 131, 165), scale=TS, key=True),
    dict(name='window', src=TILESET, box=(547, 549, 152, 150), scale=TS, key=True),
    # Pip
    dict(name='drone', src=PIP, box=(226, 236, 126, 130), scale=4.9, key=True),
    dict(name='pip_wall', src=PIP, box=(26, 200, 150, 250), scale=4.9, key=True),
    dict(name='clip_icon', src='ui_kit.png', box=(455, 278, 72, 100), scale=5.0, key=True),
    # characters: 5 frames each (front, front step, back, side, side step)
    *[
        dict(name=n, src=CHARS, frames=[(c0, r0, c1 - c0, r1 - r0) for (c0, c1) in CHAR_COLS], scale=CS, key=True)
        for n, (r0, r1) in CHAR_ROWS.items()
    ],
]

PORTRAITS = ['ruth', 'dev', 'marisol', 'gus', 'pip1', 'pip2']  # sheet order, row by row

# Sprites whose amber lens should stay lit at night: record the lens bounds.
GLOW = ['drone', 'terminal', 'pip_wall']


# ---------------------------------------------------------------------------
def load(name):
    return np.asarray(Image.open(os.path.join(SRC, name)).convert('RGB')).astype(np.int32)


def sheet_bg(img):
    flat = (img[..., 0] << 16) | (img[..., 1] << 8) | img[..., 2]
    vals, counts = np.unique(flat, return_counts=True)
    v = vals[counts.argmax()]
    return np.array([(v >> 16) & 255, (v >> 8) & 255, v & 255])


def key_out(crop, bg, tol=40):
    """Alpha mask: remove the sheet background.

    Background-coloured regions touching the crop border go, and so do larger
    background-coloured pockets cut off by the sheet's grid lines. Sprites use
    near-black outlines, which are far enough from the sheet colour to survive.
    """
    near = np.abs(crop - bg).sum(-1) <= tol
    lab, n = ndimage.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(near, lab, index=np.arange(1, n + 1))
    big = {i + 1 for i, sz in enumerate(sizes) if sz > 60}
    clear = np.isin(lab, list(border | big))
    return ~clear


def snap(rgb, alpha, out_w, out_h):
    """Mode-downsample to (out_w, out_h) with SNES 15-bit colour."""
    a5 = rgb >> 3
    packed = (a5[..., 0] << 10) | (a5[..., 1] << 5) | a5[..., 2]
    H, W = packed.shape
    ys = np.linspace(0, H, out_h + 1).round().astype(int)
    xs = np.linspace(0, W, out_w + 1).round().astype(int)
    out = np.zeros((out_h, out_w, 4), dtype=np.uint8)
    for j in range(out_h):
        y0, y1 = ys[j], max(ys[j + 1], ys[j] + 1)
        for i in range(out_w):
            x0, x1 = xs[i], max(xs[i + 1], xs[i] + 1)
            blk = packed[y0:y1, x0:x1]
            if alpha is not None:
                al = alpha[y0:y1, x0:x1]
                if al.mean() < 0.5:
                    continue
                blk = blk[al]
            vals, counts = np.unique(blk.ravel(), return_counts=True)
            v = vals[counts.argmax()]
            c = np.array([(v >> 10) & 31, (v >> 5) & 31, v & 31])
            out[j, i, :3] = (c << 3) | (c >> 2)
            out[j, i, 3] = 255
    return out


def trim(rgba):
    ys, xs = np.nonzero(rgba[..., 3])
    if not len(ys):
        return rgba
    return rgba[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]


def extract(img, bg, box, scale=None, size=None, key=False):
    x, y, w, h = box
    crop = img[y: y + h, x: x + w]
    alpha = key_out(crop, bg) if key else None
    if alpha is not None:
        # tighten the crop to the object before snapping so the grid lines up with it
        ys, xs = np.nonzero(alpha)
        crop = crop[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]
        alpha = alpha[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]
    ch, cw = crop.shape[:2]
    if size:
        ow, oh = size
    else:
        ow, oh = max(1, round(cw / scale)), max(1, round(ch / scale))
    out = snap(crop, alpha, ow, oh)
    return trim(out) if key else out


def portraits():
    """Find the six dark squares on the portrait sheet and snap each to 48x48."""
    img = load('portraits.png')
    H, W = img.shape[:2]
    # Each bust sits on a flat dark-brown square in a 3x2 grid. Sample that fill
    # colour, then take the extent of it inside each grid cell.
    fill = img[int(H * 0.09), int(W * 0.06)]
    near = np.abs(img - fill).sum(-1) < 30
    boxes = []
    for row in range(2):
        for col in range(3):
            x0, x1 = col * W // 3, (col + 1) * W // 3
            y0, y1 = row * H // 2, (row + 1) * H // 2
            ys, xs = np.nonzero(near[y0:y1, x0:x1])
            if not len(ys):
                sys.exit('no portrait square in cell %d,%d' % (col, row))
            boxes.append((x0 + xs.min(), y0 + ys.min(), xs.max() - xs.min() + 1, ys.max() - ys.min() + 1))
    result = {}
    for name, (x, y, w, h) in zip(PORTRAITS, boxes):
        side = min(w, h)
        crop = img[y: y + side, x: x + side]
        result['portrait_' + name] = snap(crop, None, 48, 48)
    return result


def cutout(spec):
    """Pixels that differ between an edited image and its original, as a sprite.

    Both images are snapped onto the same grid first, so the result sits on the
    original background exactly. Returns (rgba, x, y) in game pixels."""
    w, h = spec['size']
    a = snap(load(spec['base']), None, w, h)[..., :3].astype(int)
    b = snap(load(spec['src']), None, w, h)
    d = np.abs(b[..., :3].astype(int) - a).sum(-1)
    x0, y0, x1, y1 = spec['region']
    m = ndimage.binary_opening(d[y0:y1, x0:x1] > spec.get('thr', 35), structure=np.ones((3, 3)))
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    keep = lab == (int(np.argmax(sizes)) + 1)
    keep = ndimage.binary_fill_holes(ndimage.binary_closing(keep, iterations=2))
    keep |= ndimage.binary_dilation(keep, iterations=1) & (d[y0:y1, x0:x1] > 25)
    out = b[y0:y1, x0:x1].copy()
    out[..., 3] = keep * 255
    ys, xs = np.nonzero(keep)
    return out[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1], x0 + int(xs.min()), y0 + int(ys.min())


def glow_box(rgba):
    r, g, b, a = [rgba[..., i].astype(int) for i in range(4)]
    amber = (a > 0) & (r > 180) & (g > 90) & (g < 200) & (b < 90)
    ys, xs = np.nonzero(amber)
    if not len(ys):
        return None
    return [int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)]


def save(name, rgba, manifest, **meta):
    if name in GLOW:
        box = glow_box(rgba)
        if box:
            meta['glow'] = box
    Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT, name + '.png'), optimize=True)
    entry = {'file': 'assets/art/%s.png' % name, 'w': int(rgba.shape[1]), 'h': int(rgba.shape[0])}
    entry.update(meta)
    manifest[name] = entry
    print('%-18s %4d x %-4d %s' % (name, entry['w'], entry['h'], meta or ''))


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    cache = {}
    for spec in SPEC:
        if spec['src'] not in cache:
            img = load(spec['src'])
            cache[spec['src']] = (img, sheet_bg(img))
        img, bg = cache[spec['src']]
        if 'base' in spec:
            rgba, x, y = cutout(spec)
            save(spec['name'], rgba, manifest, x=x, y=y)
            continue
        if 'frames' in spec:
            frames = [extract(img, bg, b, spec.get('scale'), None, True) for b in spec['frames']]
            fw = max(f.shape[1] for f in frames)
            fh = max(f.shape[0] for f in frames)
            strip = np.zeros((fh, fw * len(frames), 4), dtype=np.uint8)
            for i, f in enumerate(frames):
                ox = i * fw + (fw - f.shape[1]) // 2
                oy = fh - f.shape[0]  # feet on the same baseline
                strip[oy: oy + f.shape[0], ox: ox + f.shape[1]] = f
            save(spec['name'], strip, manifest, frames=len(frames), fw=fw, fh=fh)
        elif 'box' in spec:
            save(spec['name'], extract(img, bg, spec['box'], spec.get('scale'), spec.get('size'), spec.get('key', False)), manifest)
        else:
            h, w = img.shape[:2]
            save(spec['name'], extract(img, bg, (0, 0, w, h), None, spec['size'], False), manifest)
    for name, rgba in portraits().items():
        save(name, rgba, manifest)

    js = (
        '// Generated by tools/art/build.py from assets/higgsfield/. Do not edit.\n'
        '(function (M) {\n  M.ART_MANIFEST = ' + json.dumps(manifest, indent=2).replace('\n', '\n  ') + ';\n'
        '})(window.MORE = window.MORE || {});\n'
    )
    with open(os.path.join(ROOT, 'src', 'data', 'art.js'), 'w') as f:
        f.write(js)
    print('wrote src/data/art.js with %d images' % len(manifest))


if __name__ == '__main__':
    main()
