"""Build the landing page's art from the Higgsfield originals.

Uses the same crop / key-out / snap steps as tools/art/build.py, then writes
site/img/*.png: Pip's five stages, the "coming later" scenes, and the icons.
The screenshots in site/img/shots/ are captures of the running game.

    python3 tools/site/assets.py
"""
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'art'))
import build  # noqa: E402  (tools/art/build.py)

OUT = os.path.join(build.ROOT, 'site', 'img')
ART = os.path.join(build.ROOT, 'assets', 'art')

# Pip's five stages from pip_stages_and_props.png, at the drone's game scale.
STAGES = [
    ('stage-1-terminal', (26, 200, 150, 250)),
    ('stage-2-drone', (226, 236, 126, 130)),
    ('stage-3-cluster', (395, 195, 210, 215)),
    ('stage-4-spire', (605, 35, 250, 455)),
    ('stage-5-shell', (855, 140, 305, 330)),
]

# Full scenes for chapters that aren't built yet, snapped to the game's frame.
SCENES = [
    ('scene-floor', 'factory_interior.png'),
    ('scene-town', 'town_map_consumed.png'),
]


def save(name, rgba):
    Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT, name + '.png'), optimize=True)
    print(f'  {name}.png  {rgba.shape[1]}x{rgba.shape[0]}')


def icons():
    """Favicon (the HUD's clip icon in a HUD box) and a touch icon (Pip)."""
    clip = Image.open(os.path.join(ART, 'clip_icon.png')).convert('RGBA')
    shadow, cream = (26, 15, 15, 255), (242, 211, 171, 255)
    fav = Image.new('RGBA', (32, 32), shadow)
    px = fav.load()
    for i in range(32):
        for edge in (1, 30):
            px[i, edge] = px[edge, i] = cream
    fav.alpha_composite(clip, ((32 - clip.width) // 2, (32 - clip.height) // 2))
    fav.save(os.path.join(OUT, 'favicon.png'))
    pip = Image.open(os.path.join(ART, 'portrait_pip1.png')).convert('RGBA')
    touch = Image.new('RGBA', (180, 180), shadow)
    big = pip.resize((pip.width * 3, pip.height * 3), Image.NEAREST)
    touch.alpha_composite(big, ((180 - big.width) // 2, (180 - big.height) // 2))
    touch.save(os.path.join(OUT, 'touch-icon.png'))
    print('  favicon.png, touch-icon.png')


def main():
    os.makedirs(OUT, exist_ok=True)
    img = build.load(build.PIP)
    bg = build.sheet_bg(img)
    for name, box in STAGES:
        save(name, build.extract(img, bg, box, scale=4.9, key=True))
    for name, src in SCENES:
        s = build.load(src)
        save(name, build.extract(s, None, (0, 0, s.shape[1], s.shape[0]), size=(384, 288)))
    icons()


if __name__ == '__main__':
    main()
