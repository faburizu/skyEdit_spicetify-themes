// Render actual client CSS with legacy headers, portaled artist backgrounds,
// fixed library controls, and content wrappers that differ from regular playlists.
// This fixture does not execute Spotify JS or connect to a Spotify account.
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const themeDir = path.join(__dirname, '..');
if (!process.env.SPOTIFY_XPUI) throw new Error('Set SPOTIFY_XPUI to Apps/xpui.');
const nativeCSS = [
  'xpui-snapshot.css', '824.css', 'dwp-top-bar.css', '3314.css',
  'xpui-routes-profile.css', 'xpui-routes-your-library-x.css',
  'dwp-promptedPlaylists.css', 'xpui-routes-playlist.css',
  'xpui-routes-show.css', 'xpui-routes-episode.css', 'dwp-panel-section.css',
].map(name => readFileSync(path.join(process.env.SPOTIFY_XPUI, name), 'utf8')).join('\n');
const vars = readFileSync(path.join(themeDir, 'color.ini'), 'utf8').split('[Cotton-candy]')[0]
  .split('\n').map(l => l.match(/^([\w-]+)\s*=\s*([0-9a-f]{6})/i)).filter(Boolean)
  .map(([, k, h]) => `--spice-${k}:#${h};--spice-rgb-${k}:${h.match(/../g).map(v => parseInt(v, 16)).join(',')};`).join('');
const art = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#dfb051"/><circle cx="40" cy="40" r="20" fill="#265c6c"/></svg>');
const fixtureCSS = `:root{${vars}--panel-gap:8px;--background-base:#000;--top-bar-z-index:10;--background-elevated-base:#152238}*{box-sizing:border-box}body,html{margin:0;width:100%;height:100%;color:white}#main-view{isolation:isolate}.starrynight-bg-container{display:none}#scene{position:relative;height:100%;overflow:auto}#scene h1{position:relative;z-index:1;margin:0;padding:40px}#scene p{margin:0;padding:20px}.scene-body{height:1200px}.legacy-header{position:relative;height:240px}.library-header{height:100px;flex-shrink:0;position:relative}.library-scroll{overflow:auto;flex:1;min-height:0}.library-scroll img{display:block;margin:12px;width:44px;height:44px}.YourLibraryX{height:100%}.portal{height:240px!important;min-height:0!important}.native-photo{background:#cf5c36}.sticky-fixture{position:absolute;top:0;left:0;width:100%;height:64px}.main-topBar-background{opacity:0}.sticky-fixture button{position:relative;z-index:1;margin:8px 24px;height:40px}.iz0YLr43jlOJoSEPGWrX{width:300px;padding:20px;min-height:300px;aspect-ratio:auto}.iz0YLr43jlOJoSEPGWrX>*{position:relative;z-index:1}.iz0YLr43jlOJoSEPGWrX img{width:80px;height:80px}.test-title{color:var(--text-base)}.scene-pad{padding:32px}`;
function shell() {
  return `<div class="Root__top-container"><header class="Root__globalNav">StarryNight scrolling regression fixture</header>
    <div class="yQCyOSVcMCen_NJKPHB6" style="width:72px"><div class="YourLibraryX"><div class="ArpdzWdgRW_8lwpikPGW library-header">Library</div><div class="library-scroll">${Array.from({ length: 30 }, () => `<img src="${art}">`).join('')}</div></div></div>
    <div id="main-view" class="R1kU6b2KxZc8FWfbYf3m"><div id="scene"></div></div>
    <div class="s8fIIxwITjOk1aFOxhPv" style="width:280px"></div><div class="XvuTwlgQRqJ5NnVLN9ZH">Player fixture</div></div>`;
}
function legacy() {
  return `<div class="legacy-header" data-testid="entity-header"><div class="uP1rcUSIWCFaOZaoH0ZG" style="background-color:rgb(0,210,210)"></div><div class="uP1rcUSIWCFaOZaoH0ZG nfBy1HoO33kgPOyEc3WZ"></div><h1>Profile</h1></div><div class="scene-body"></div>`;
}
const bg = (page, selector, pseudo = null) => page.locator(selector).evaluate((el, p) => getComputedStyle(el, p).backgroundColor, pseudo);
const distance = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
async function pixel(page, x, y) {
  const png = PNG.sync.read(await page.screenshot());
  return [...png.data.subarray((Math.floor(y) * png.width + Math.floor(x)) * 4, (Math.floor(y) * png.width + Math.floor(x)) * 4 + 3)];
}
async function boundary(page) {
  const rect = await page.locator('.legacy-header').boundingBox();
  return distance(await pixel(page, rect.x + rect.width - 70, rect.y + 238), await pixel(page, rect.x + rect.width - 70, rect.y + 243));
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.setContent(`<style>${nativeCSS}</style><style>${fixtureCSS}</style>${shell()}`);
    await page.addScriptTag({ content: readFileSync(path.join(themeDir, 'theme.js'), 'utf8') });
    await page.waitForFunction(() => document.querySelector('.Root__top-container').dataset.starrynightLibrary === 'collapsed');
    const scene = page.locator('#scene');
    await scene.evaluate((el, html) => el.innerHTML = html, legacy());
    if (process.env.STARRYNIGHT_SCROLL_BASELINE_CSS) {
      const baseline = await page.addStyleTag({ content: readFileSync(process.env.STARRYNIGHT_SCROLL_BASELINE_CSS, 'utf8') });
      assert.ok(await boundary(page) > 20, 'Previous flat-color profile layer should have a visible edge');
      await baseline.evaluate(el => el.remove());
      console.log('PASS: reproduced the previous profile header cutoff in rendered pixels');
    }
    await page.addStyleTag({ content: readFileSync(path.join(themeDir, 'user.css'), 'utf8') });
    await page.addStyleTag({ content: nativeCSS }); // Simulate lazy route styles.
    assert.ok(await boundary(page) < 12, 'Profile tint must fade into the sky without a rectangular edge');
    assert.equal(await scene.locator('h1').evaluate(el => getComputedStyle(el).opacity), '1');
    if (process.env.STARRYNIGHT_SCROLL_PREVIEW) await page.screenshot({ path: path.join(process.env.STARRYNIGHT_SCROLL_PREVIEW, 'profile-fade-fixture.png') });
    await scene.evaluate(el => el.scrollTop = 160);
    assert.equal(await scene.evaluate(el => el.scrollTop), 160);
    console.log('PASS: legacy profile fade at top/scrolled positions, foreground stays opaque');

    await scene.evaluate(el => { el.scrollTop = 0; el.innerHTML = '<div class="scene-body"></div>'; });
    // Place background outside #main-view, as a portal. Native scroll JS drives
    // --scroll on the artist image wrapper and opacity on the overscroll fill.
    await page.locator('.Root__top-container').evaluate(el => el.insertAdjacentHTML('beforeend', `<div data-testid="overscroll-background" style="position:absolute;inset:0;background:#be121b;opacity:1;animation:none;pointer-events:none"></div><div class="FNyVAJwiyJvKSs7fgcmI portal" style="left:80px;width:700px;top:80px"><div class="gmu7_RBMtFXx72GDaf4Q L0UgUY1nWxdZ3XyrJNMt native-photo"></div><div class="gmu7_RBMtFXx72GDaf4Q AE3dcjFNJ9068_vrnLB6" style="--bgColor:#be121b"></div></div>`));
    assert.equal(await bg(page, '[data-testid="overscroll-background"]'), 'rgba(0, 0, 0, 0)');
    for (const scroll of [0, .2, .4]) {
      await page.locator('.portal').evaluate((el, value) => el.style.setProperty('--scroll', String(value)), scroll);
      assert.equal(await bg(page, '.AE3dcjFNJ9068_vrnLB6', '::after'), 'rgba(0, 0, 0, 0)');
      const last = await pixel(page, 700, 318), below = await pixel(page, 700, 323);
      assert.ok(distance(last, below) < 15, `Artist backdrop must fade at scroll state ${scroll}`);
    }
    await page.locator('.portal').evaluate(el => el.remove());
    await page.locator('[data-testid="overscroll-background"]').evaluate(el => el.remove());
    console.log('PASS: portaled artist image/scrim fades during scroll, no red overscroll blanket');

    await scene.evaluate(el => el.innerHTML = '<div class="CU6UW9KzAHCdO5xqbBbf">Prompted tracks</div><div class="fmJtSKRbaIwuGI4eOWBt">Podcast episodes</div><div class="nR22DzSVzUhvJkSqPFXx">Episode page</div><div class="TEBHz9L27CyLntC68xQ2"><div class="QwcIb5mGvbu4qb3_cnAQ"></div><div class="ZDb8FjylyS1RZnYv3ubr"></div></div><div class="IfBZ5VdI_2nwDMl4H6Yh" style="background-color:#993399"></div>');
    for (const cls of ['CU6UW9KzAHCdO5xqbBbf', 'fmJtSKRbaIwuGI4eOWBt', 'nR22DzSVzUhvJkSqPFXx', 'QwcIb5mGvbu4qb3_cnAQ', 'ZDb8FjylyS1RZnYv3ubr']) assert.equal(await bg(page, '.' + cls), 'rgba(0, 0, 0, 0)');
    assert.notEqual(await page.locator('.IfBZ5VdI_2nwDMl4H6Yh').evaluate(el => getComputedStyle(el).maskImage), 'none');
    console.log('PASS: Prompted Playlist, podcast, episode, and Home background layers');

    await scene.evaluate((el, src) => el.innerHTML = `<div class="scene-pad"><div class="iz0YLr43jlOJoSEPGWrX" style="--background-color:#d68000;--background-base-high-contrast:#b07000;--text-base:#111"><div class="ldBWjYnPiKDAyMuwLD4A"></div><div class="abaOKiBFYzK4MTa3XHD9"></div><h2 class="test-title">Audiobook / podcast card</h2><img src="${src}"><p>Author and episode details</p></div></div>`, art);
    const cardColor = await bg(page, '.ldBWjYnPiKDAyMuwLD4A');
    assert.match(cardColor, /^rgba\(/);
    assert.ok(Number(cardColor.split(',').at(-1).replace(')', '')) < .6);
    assert.equal(await page.locator('.test-title').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
    assert.equal(await page.locator('.iz0YLr43jlOJoSEPGWrX img').evaluate(el => getComputedStyle(el).opacity), '1');
    if (process.env.STARRYNIGHT_SCROLL_PREVIEW) await page.screenshot({ path: path.join(process.env.STARRYNIGHT_SCROLL_PREVIEW, 'media-card-fixture.png') });
    console.log('PASS: translucent media-card backing, readable text, opaque cover');

    assert.equal(await page.locator('.library-header').evaluate(el => getComputedStyle(el).boxShadow), 'none');
    const library = page.locator('.library-scroll');
    for (const scroll of [0, 250, 1000]) {
      await library.evaluate((el, value) => el.scrollTop = value, scroll);
      const rect = await page.locator('.library-header').boundingBox();
      assert.ok(distance(await pixel(page, rect.x + 65, rect.y + 102), await pixel(page, rect.x + 65, rect.y + 130)) < 6);
    }
    console.log('PASS: fixed library controls/scrolling list share a continuous surface without a black shadow');

    await scene.evaluate(el => { el.innerHTML = '<div class="scene-body"><h1>Playlist title</h1></div>'; el.scrollTop = 0; });
    await page.locator('#main-view').evaluate(el => { el.insertAdjacentHTML('beforeend', '<header class="main-topBar-container sticky-fixture"><div class="main-topBar-background"><div class="main-topBar-overlay"></div></div><button id="sticky-play">Play playlist</button></header>'); document.querySelector('#sticky-play').onclick = () => { window.stickyClicks = (window.stickyClicks || 0) + 1; }; });
    for (const scroll of [0, 100, 300]) {
      await scene.evaluate((el, value) => el.scrollTop = value, scroll);
      await page.locator('.main-topBar-background').evaluate((el, value) => el.style.opacity = String(Math.min(1, value / 300)), scroll);
      assert.notEqual(await page.locator('.main-topBar-background').evaluate(el => getComputedStyle(el).maskImage), 'none');
      assert.equal(await page.locator('#sticky-play').evaluate(el => getComputedStyle(el).opacity), '1');
    }
    await page.locator('#sticky-play').click();
    assert.equal(await page.evaluate(() => window.stickyClicks), 1);
    assert.equal(await bg(page, '.main-topBar-overlay'), 'rgba(0, 0, 0, 0)');
    if (process.env.STARRYNIGHT_SCROLL_PREVIEW) await page.screenshot({ path: path.join(process.env.STARRYNIGHT_SCROLL_PREVIEW, 'sticky-title-fixture.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: sticky title background fades separately from readable, clickable controls');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
