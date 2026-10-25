// Reconstructed surface markup from Spotify 1.3.6.1921, using installed CSS.
// No Spotify JS, account, or network requests are used by this fixture.
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const themeDir = path.join(__dirname, '..');
if (!process.env.SPOTIFY_XPUI) throw new Error('Set SPOTIFY_XPUI to Apps/xpui.');
const nativeCSS = [
  'xpui-snapshot.css', 'xpui-routes-your-library-x.css', 'dwp-panel-section.css',
  'xpui-routes-artist.css', 'xpui-routes-profile.css', '824.css',
].map(name => readFileSync(path.join(process.env.SPOTIFY_XPUI, name), 'utf8')).join('\n');
const themeCSS = readFileSync(path.join(themeDir, 'user.css'), 'utf8');
const baseScheme = readFileSync(path.join(themeDir, 'color.ini'), 'utf8').split('[Cotton-candy]')[0];
const variables = baseScheme.split('\n').map(l => l.match(/^([\w-]+)\s*=\s*([0-9a-f]{6})/i)).filter(Boolean)
  .map(([, key, hex]) => `--spice-${key}:#${hex};--spice-rgb-${key}:${hex.match(/../g).map(x => parseInt(x, 16)).join(',')};`).join('');
const art = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#193c51"/><circle cx="130" cy="65" r="28" fill="#fff3c4"/><path d="M0 180L60 90L130 180L190 120L200 180V200H0Z" fill="#436b86"/></svg>');
const bg = async locator => locator.evaluate(el => getComputedStyle(el).backgroundColor);
const alpha = value => value.startsWith('rgba(') ? Number(value.split(',').at(-1).replace(')', '')) : 1;

function fixture() {
  return `<div class="Root__top-container">
    <header class="Root__globalNav">StarryNight · Surface regression fixture (reconstructed markup)</header>
    <div class="yQCyOSVcMCen_NJKPHB6"><nav><div class="u3xv0vOK9EJmOplXOrhG VRuLKilUPNI51gwWqicm"><div class="qB0QkhexXi3Wx0P1k0Rf YourLibraryX"><h3>Your Library</h3><p>Saved playlists</p><img src="${art}" width="56" height="56"></div></div></nav></div>
    <div id="main-view" class="R1kU6b2KxZc8FWfbYf3m"><main class="main-view-container"><section data-testid="artist-page">
      <div data-testid="entity-header" class="main-entityHeader-container" style="height:250px">
        <div class="hbNOZbHD3bPL3OcHQWNn" data-seamless-gradient style="--background-base:#be121b;--background-base-min-contrast:#c83240;--background-base-20:rgba(190,18,27,.2)"></div>
        <div class="main-entityHeader-contentWrapper contentSpacing"><h1>Artist / profile / playlist tint</h1></div>
      </div>
      <div class="GECIboaMmkIqHDKwQ3vR"><div class="r8bczAWCEgb9_L0iyIcc" style="height:112px;--background-base-70:rgba(190,18,27,.7)"></div><div class="contentSpacing"><h2>Discography</h2></div>
        <div class="C0YTSqDKL6_Qo68om_i1"><img class="B6cZwYGBiPMHAmRpT0G6" src="${art}"><div class="RFNfyncEmBJ2m1xNT4gt"><h2>Album with a long title that wraps</h2><p>EP · 2024 · 6 songs</p><button>Play album</button></div></div>
        <div role="grid"><p>1. First track</p><p>2. Second track</p></div>
      </div>
    </section></main></div>
    <div class="s8fIIxwITjOk1aFOxhPv"><aside id="Desktop_PanelContainer_Id" class="ZQzSUDc81lpJjVOwgkfW" style="width:320px"><div class="vVF0gCDG9l8RCOK3_2kw" data-npv-root><h3>Now Playing</h3><img src="${art}" width="240" height="240"><h3>Track title</h3><section style="background:#243444;border-radius:8px;padding:16px">About the artist</section></div></aside></div>
    <div class="XvuTwlgQRqJ5NnVLN9ZH">Player</div>
  </div><div role="dialog" style="background:#152238">Dialog surface stays filled</div>`;
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  const page = await browser.newPage({ viewport: { width: 1536, height: 1032 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.setContent(`<style>${nativeCSS}</style><style>:root{${variables}--left-sidebar-width:240;--panel-gap:8px;--content-spacing:24px;--background-base:#000}html,body{margin:0;width:100%;height:100%;color:white}*{box-sizing:border-box}nav{height:100%}.contentSpacing{padding:16px 24px}h1{font-size:36px}h3,p{margin:16px}#main-view{overflow:auto}[role=dialog]{position:fixed;bottom:12px;left:20px;padding:12px}</style>${fixture()}`);
    await page.addScriptTag({ content: readFileSync(path.join(themeDir, 'theme.js'), 'utf8') });
    await page.waitForFunction(() => document.querySelector('.Root__top-container').dataset.starrynightLibrary === 'expanded');
    if (process.env.STARRYNIGHT_BASELINE_CSS) {
      const old = await page.addStyleTag({ content: readFileSync(process.env.STARRYNIGHT_BASELINE_CSS, 'utf8') });
      assert.equal(alpha(await bg(page.locator('.YourLibraryX'))), 1);
      assert.equal(await page.locator('#Desktop_PanelContainer_Id').evaluate(el => getComputedStyle(el, '::before').backgroundColor), 'rgb(0, 0, 0)');
      assert.equal(alpha(await bg(page.locator('.GECIboaMmkIqHDKwQ3vR'))), 1);
      assert.equal(alpha(await bg(page.locator('.C0YTSqDKL6_Qo68om_i1'))), 1);
      await old.evaluate(el => el.remove());
      console.log('PASS: reproduced opaque expanded library, panel pseudo-layer, artist body, discography card');
    }
    await page.addStyleTag({ content: themeCSS });
    // Check overrides even when route CSS arrives after the theme.
    await page.addStyleTag({ content: nativeCSS });
    for (const selector of ['.YourLibraryX', '#Desktop_PanelContainer_Id', '[data-npv-root]', '.GECIboaMmkIqHDKwQ3vR']) {
      assert.equal(await bg(page.locator(selector)), 'rgba(0, 0, 0, 0)', selector);
    }
    assert.equal(await page.locator('#Desktop_PanelContainer_Id').evaluate(el => getComputedStyle(el, '::before').backgroundColor), 'rgba(0, 0, 0, 0)');
    const card = page.locator('.C0YTSqDKL6_Qo68om_i1');
    assert.ok(alpha(await bg(card)) > 0 && alpha(await bg(card)) < 1);
    assert.equal(await card.evaluate(el => getComputedStyle(el).borderRadius), '14px');
    const cardBox = await card.boundingBox(), artBox = await card.locator('img').boundingBox();
    assert.ok(artBox.y >= cardBox.y + 16 && artBox.x >= cardBox.x + 16);
    assert.ok(artBox.y + artBox.height < cardBox.y + cardBox.height);
    assert.equal(await page.locator('[role=dialog]').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(21, 34, 56)');
    console.log('PASS: nested panel transparency, rounded translucent card, padded art, filled dialog');

    const gradient = page.locator('.hbNOZbHD3bPL3OcHQWNn');
    assert.equal(await gradient.evaluate(el => getComputedStyle(el).opacity), '0.32');
    assert.equal(await bg(gradient), 'rgba(0, 0, 0, 0)');
    assert.match(await gradient.evaluate(el => getComputedStyle(el).backgroundImage), /linear-gradient/);
    assert.match(await page.locator('.r8bczAWCEgb9_L0iyIcc').evaluate(el => getComputedStyle(el).backgroundImage), /rgba\(0, 0, 0, 0\)/);
    // The same shared header is used outside the artist route (profile/playlist).
    await page.locator('[data-testid="artist-page"]').evaluate(el => el.removeAttribute('data-testid'));
    assert.equal(await gradient.evaluate(el => getComputedStyle(el).opacity), '0.32');
    await page.locator('main > section').evaluate(el => el.setAttribute('data-testid', 'artist-page'));
    console.log('PASS: translucent shared profile/playlist/artist gradient without dimming foreground');

    await page.locator('[data-starrynight-area="left-sidebar"]').evaluate(el => el.style.width = '72px');
    await page.waitForFunction(() => document.querySelector('.Root__top-container').dataset.starrynightLibrary === 'collapsed');
    assert.ok(alpha(await bg(page.locator('.YourLibraryX'))) > 0 && alpha(await bg(page.locator('.YourLibraryX'))) < 1);
    await page.locator('[data-starrynight-area="left-sidebar"]').evaluate(el => el.style.width = '240px');
    await page.waitForFunction(() => document.querySelector('.Root__top-container').dataset.starrynightLibrary === 'expanded');
    assert.equal(await bg(page.locator('.YourLibraryX')), 'rgba(0, 0, 0, 0)');
    // Palette follows the active scheme, rather than hard-coded blue.
    await page.locator('.Root__top-container').evaluate(el => el.style.setProperty('--spice-rgb-card', '70, 100, 60'));
    assert.match(await bg(card), /^rgba\(70, 100, 60,/);
    await page.locator('.Root__top-container').evaluate(el => el.style.removeProperty('--spice-rgb-card'));
    if (process.env.STARRYNIGHT_SURFACES_SCREENSHOT) await page.screenshot({ path: process.env.STARRYNIGHT_SURFACES_SCREENSHOT });
    await page.setViewportSize({ width: 1024, height: 900 });
    assert.equal(await card.evaluate(el => getComputedStyle(el).flexWrap), 'wrap');
    await page.evaluate(() => window.StarryNight.destroy());
    assert.equal(await page.locator('[data-starrynight-library]').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: collapse/expand, scheme colors, narrow cards, cleanup, no JS errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
