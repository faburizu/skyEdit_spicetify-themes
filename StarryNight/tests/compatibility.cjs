// Run with Playwright available and SPOTIFY_XPUI pointing to an extracted client.
// This is a browser fixture, not a live Spotify session. No client JS is executed.
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const themeDir = path.join(__dirname, '..');
const clientDir = process.env.SPOTIFY_XPUI;
if (!clientDir) throw new Error('Set SPOTIFY_XPUI to the Spotify Apps/xpui directory.');
const themeCSS = readFileSync(path.join(themeDir, 'user.css'), 'utf8');
const themeJS = readFileSync(path.join(themeDir, 'theme.js'), 'utf8');
const css = ['xpui-snapshot.css', 'dwp-now-playing-bar.css'].map(name =>
  readFileSync(path.join(clientDir, name), 'utf8')).join('\n');
const colors = readFileSync(path.join(themeDir, 'color.ini'), 'utf8').split('[Cotton-candy]')[0]
  .split('\n').map(line => line.match(/^([\w-]+)\s*=\s*([0-9a-f]{6})/i)).filter(Boolean)
  .map(([, key, hex]) => `--spice-${key}:#${hex};--spice-rgb-${key}:${hex.match(/../g).map(x => parseInt(x, 16)).join(',')};`).join('');
const art = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect width="220" height="220" fill="#142b44"/><circle cx="160" cy="65" r="32" fill="#fff3c4"/><path d="M0 180L60 90L130 180L190 120L220 180V220H0Z" fill="#436b86"/></svg>');
function widget(version) {
  return `<div data-testid="now-playing-widget${version === 2 ? '-v2' : ''}" class="${version === 2 ? 'AukMNaKTJmhKlzn1fQYw' : 'main-nowPlayingWidget-nowPlaying'}">
    <div data-testid="${version === 2 ? 'cover-art-container' : 'CoverSlotCollapsed__container'}" class="${version === 2 ? 'JTX4m0MfV5NaIrbLWFIg' : 'hx8RwqDIY4ZzmBQcomN5 QjXBPUJOGqRvUKoKLwBv'}">
      <div><button data-testid="cover-art-button" class="gl_npVIQm1UkxGs7QL5c"><div><div class="WHhQ96NalYH19nEolaqd" style="width:56px;height:56px"><div class="nGIoPje5STZ2ud7TsVH0"><svg viewBox="0 0 24 24"><path d="M10 2v14a4 4 0 1 0 2 3V7h8V2Z"/></svg></div><img class="P11Obdzt7UzROxKiPexD" data-testid="cover-art-image" width="56" height="56" src="${art}"></div></div></button></div>
    </div><div><b>Compatibility fixture</b><br>StarryNight</div><button aria-label="Save">✓</button>
  </div>`;
}
function fixture(version = 2) {
  return `<div class="Root__top-container">
    <header class="Root__globalNav">Home · Search</header>
    <div class="yQCyOSVcMCen_NJKPHB6"><nav><div class="u3xv0vOK9EJmOplXOrhG">Your Library</div></nav></div>
    <div id="main-view" class="R1kU6b2KxZc8FWfbYf3m"><main class="main-view-container"><h1>StarryNight layout test</h1><p>Fixture using installed Spotify CSS; not a live Spotify screenshot.</p></main></div>
    <div class="s8fIIxwITjOk1aFOxhPv"><aside style="width:320px"><h2>Now playing</h2></aside></div>
    <div class="XvuTwlgQRqJ5NnVLN9ZH"><footer data-testid="now-playing-bar" class="main-nowPlayingBar-container"><div class="main-nowPlayingBar-nowPlayingBar">
      <div class="main-nowPlayingBar-left">${widget(version)}</div>
      <div class="main-nowPlayingBar-center"><div class="_b8eissBsp4_ca4mU_sz"><div class="player-controls__buttons"><button>Shuffle</button><button>Previous</button><button data-testid="control-button-playpause" aria-label="Pausar">Ⅱ</button><button>Next</button></div><div class="playback-bar">1:15 ━━━━━━━━━━━ 4:42</div></div></div>
      <div class="main-nowPlayingBar-right"><div class="main-nowPlayingBar-extraControls"><button>Queue</button><button>Devices</button><button>Volume</button></div></div>
    </div></footer></div></div>`;
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  const page = await browser.newPage({ viewport: { width: 1536, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.setContent(`<style>${css}</style><style>:root{${colors}--left-sidebar-width:240;--panel-gap:8px;--background-base:#000}html,body{margin:0;width:100%;height:100%;color:white}*{box-sizing:border-box}main{padding:24px}</style>${fixture()}`);
    await page.evaluate(() => {
      window.listeners = { onplaypause: new Set(), songchange: new Set() };
      window.playing = true;
      window.Spicetify = { Player: {
        isPlaying: () => window.playing,
        addEventListener: (name, fn) => window.listeners[name].add(fn),
        removeEventListener: (name, fn) => window.listeners[name].delete(fn),
      } };
    });
    // Original bug: current cover remains a 56px square with the old CSS.
    if (process.env.STARRYNIGHT_ORIGINAL_CSS) {
      const old = await page.addStyleTag({ content: readFileSync(process.env.STARRYNIGHT_ORIGINAL_CSS, 'utf8') });
      assert.equal(await page.locator('[data-testid="cover-art-button"] img').evaluate(e => e.getBoundingClientRect().width), 56);
      await old.evaluate(e => e.remove());
      console.log('PASS: reproduced original 56px artwork regression');
    }
    await page.addStyleTag({ content: themeCSS });
    await page.addScriptTag({ content: themeJS });
    const layout = async expected => page.waitForFunction(value => document.querySelector('.Root__top-container').dataset.starrynightLayout === value, expected);
    const box = selector => page.locator(selector).boundingBox();
    await layout('side');
    const image = page.locator('[data-testid="cover-art-button"] img');
    assert.equal(Math.round((await image.boundingBox()).width), 220);
    assert.equal(await image.evaluate(e => getComputedStyle(e).borderRadius), '50%');
    assert.equal(await image.evaluate(e => getComputedStyle(e).animationPlayState), 'running');
    const artBox = await box('[data-testid="cover-art-button"]');
    const placeholderBox = await box('[data-testid="cover-art-button"] .nGIoPje5STZ2ud7TsVH0');
    assert.ok(placeholderBox.x >= artBox.x && placeholderBox.y >= artBox.y);
    assert.ok(placeholderBox.x + placeholderBox.width <= artBox.x + artBox.width,
      'Fallback icon must stay inside artwork, not be enlarged by image sizing rules');
    assert.ok(placeholderBox.y + placeholderBox.height <= artBox.y + artBox.height);
    const playerBox = await box('[data-starrynight-area="now-playing-bar"]');
    const rightBox = await box('[data-starrynight-area="right-sidebar"]');
    assert.equal(Math.round(playerBox.width), Math.round(rightBox.width));
    assert.ok(rightBox.y >= playerBox.y + playerBox.height);
    assert.ok((await box('#main-view')).height > playerBox.height);
    assert.equal(await page.locator('#main-view').evaluate(e => getComputedStyle(e).backgroundColor), 'rgba(0, 0, 0, 0)');
    assert.equal(await page.locator('.starrynight-bg-container').evaluate(e => getComputedStyle(e).pointerEvents), 'none');
    console.log('PASS: current v2 art, grid geometry, transparency, localized playback state');

    await page.evaluate(() => { window.playing = false; window.listeners.onplaypause.forEach(fn => fn()); });
    assert.equal(await image.evaluate(e => getComputedStyle(e).animationPlayState), 'paused');
    await page.locator('aside').evaluate(e => e.style.width = '400px');
    await page.waitForFunction(() => Math.round(document.querySelector('[data-starrynight-area="now-playing-bar"]').getBoundingClientRect().width) === 400);
    await page.locator('.Root__top-container').evaluate(e => e.setAttribute('data-right-sidebar-hidden', 'true'));
    await layout('bottom');
    assert.equal(Math.round((await image.boundingBox()).width), 56);
    await page.locator('.Root__top-container').evaluate(e => e.removeAttribute('data-right-sidebar-hidden'));
    await layout('side');
    await page.setViewportSize({ width: 900, height: 900 });
    await layout('bottom');
    await page.setViewportSize({ width: 1536, height: 600 });
    await layout('bottom');
    await page.setViewportSize({ width: 1536, height: 900 });
    await layout('side');
    console.log('PASS: pause, sidebar resizing/hiding, narrow and short windows');

    await page.locator('.main-nowPlayingBar-left').evaluate((e, html) => e.innerHTML = html, widget(1));
    assert.equal(Math.round((await image.boundingBox()).width), 220);
    await page.addScriptTag({ content: themeJS });
    await layout('side');
    assert.equal(await page.locator('.starrynight-bg-container').count(), 1);
    assert.equal(await page.evaluate(() => window.listeners.onplaypause.size), 1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await image.evaluate(e => getComputedStyle(e).animationName), 'none');
    assert.equal(await page.locator('.shootingstar').first().evaluate(e => getComputedStyle(e).display), 'none');
    console.log('PASS: legacy widget, reinjection cleanup, reduced motion');

    // Simulate React replacing the complete root, then late mounting the player.
    await page.locator('.Root__top-container').evaluate((e, html) => e.outerHTML = html, fixture());
    await layout('side');
    assert.equal(await page.locator('.starrynight-bg-container').count(), 1);
    const footerHTML = await page.locator('[data-starrynight-area="now-playing-bar"]').evaluate(e => e.outerHTML);
    await page.locator('[data-starrynight-area="now-playing-bar"]').evaluate(e => e.remove());
    await layout('bottom');
    await page.locator('.Root__top-container').evaluate((e, html) => e.insertAdjacentHTML('beforeend', html), footerHTML);
    await layout('side');
    // Lazy-loaded native CSS must not undo layout/art overrides.
    await page.addStyleTag({ content: css });
    assert.equal(Math.round((await image.boundingBox()).width), 220);
    if (process.env.STARRYNIGHT_SCREENSHOT) await page.screenshot({ path: process.env.STARRYNIGHT_SCREENSHOT });
    await page.evaluate(() => window.StarryNight.destroy());
    assert.equal(await page.locator('.starrynight-bg-container').count(), 0);
    assert.equal(await page.locator('[data-starrynight-area]').count(), 0);
    assert.equal(await page.evaluate(() => window.listeners.onplaypause.size), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: root replacement, late player mount, lazy CSS, teardown, no JS errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
