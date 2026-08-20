import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const assets = path.dirname(fileURLToPath(import.meta.url));
const jobs = [
  ['promo-small.html', 'small-promo-440x280.png', 440, 280],
  ['promo-marquee.html', 'marquee-promo-1400x560.png', 1400, 560],
  ['screenshot-demo.html', 'screenshot-1280x800.png', 1280, 800],
  ['screenshot-popup.html', 'screenshot-popup-1280x800.png', 1280, 800],
  ['screenshot-consent.html', 'screenshot-consent-1280x800.png', 1280, 800],
];

(async () => {
  const browser = await chromium.launch();
  for (const [html, out, width, height] of jobs) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.join(assets, html)).href);
    await page.screenshot({ path: path.join(assets, out), type: 'png' });
    await page.close();
  }
  await browser.close();
  execFileSync('python3', ['-c', `
from PIL import Image
from pathlib import Path
root = Path(${JSON.stringify(path.join(assets, '..'))})
src = Image.open(root / 'icons' / 'icon128.png').convert('RGBA')
art = src.resize((96, 96), Image.Resampling.LANCZOS)
icon = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
icon.paste(art, (16, 16), art)
icon.save(root / 'store-assets' / 'store-icon-128.png')
assets = root / 'store-assets'
for name in ['store-icon-128.png', 'small-promo-440x280.png', 'marquee-promo-1400x560.png', 'screenshot-1280x800.png', 'screenshot-popup-1280x800.png', 'screenshot-consent-1280x800.png']:
    im = Image.open(assets / name)
    print(f'{name}: {im.size[0]}x{im.size[1]} {im.mode}')
`]);
})();
