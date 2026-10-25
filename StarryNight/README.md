# StarryNight

## Current-client compatibility

The theme now supports the panel structure and both now-playing widgets found
in Spotify **1.3.5.3058.g5d40d5480152** and **1.3.6.1921.g7086c071a617**
with Spicetify **2.46.2 / 2.46.3**.
These versions were inspected locally. Automated browser checks use their
extracted CSS with reconstructed markup; live-client visual verification is
still required. Spotify experiments can produce different markup.

- Identifies root panels by their CSS grid roles, with legacy class fallbacks,
  instead of hard-coded generated class names.
- Restores the transparent panels and circular 220px artwork in the side player.
- Uses Spicetify playback events for rotation, independent of the UI language.
- Shares the native sidebar's grid column, without a user-specific storage key
  or an independently forced player width.
- Uses the native bottom player when the sidebar is closed, narrower than 250px,
  or the window is smaller than 1000px wide or 680px tall.
- Handles delayed panel mounting, React root replacement, repeated injection,
  and reduced-motion preferences.
- Shows the sky through the library, Now Playing/Listening activity panel,
  artist-page content, Prompted Playlist track lists, and podcast/episode pages.
  Both library sizes use a continuous faint gray surface without the heavy
  header shadow; large audiobook/podcast tiles get similar translucent backing.
- Softens profile/playlist/artist header colors into a transparent fade, and
  gives discography album summaries a padded, rounded, translucent card.
- Handles legacy profile headers and artist image/overscroll layers separately,
  including their scrolled state. Sticky titles use a blurred, softly faded
  background while the foreground title and playback controls remain sharp.

The main panel layout uses grid roles. A small group of version-specific CSS
selectors is still needed for Spotify's unlabelled artist, gradient, and
discography layers; these may need updating when the client changes.

### Optional appearance adjustments

At the top of `user.css`, `--starrynight-header-opacity` controls the header tint
(default `.32`). `--starrynight-library-tint` controls the library's gray
background in both sizes (default `.06`); set it to `0` for a completely
transparent library. `--starrynight-surface` controls the faint gray fill of
large media cards.

Spotify's current top search/navigation bar is retained. The screenshots below
show an older client; this update does not recreate its removed navigation UI.

### Install manually

Copy `user.css`, `theme.js`, and `color.ini` into a folder named `StarryNight`
under your Spicetify `Themes` directory (on Windows:
`%APPDATA%\spicetify\Themes\StarryNight`). If using a Marketplace-installed
theme, remove that theme in Marketplace first to avoid its CSS/JavaScript being
injected alongside this manual installation. Then run:

```powershell
spicetify config current_theme StarryNight color_scheme Base inject_css 1 replace_colors 1 inject_theme_js 1
spicetify apply
```

Open Now Playing or Queue to enable the side player. Drag Spotify's right-panel
divider to resize it. Expand Your Library using Spotify's controls if you want
playlist names visible instead of the collapsed icon strip.

### Optional developer tests (not needed to install or use the theme)

`tests/compatibility.cjs` needs Node.js, Playwright, and a browser. Set
`SPOTIFY_XPUI` to an extracted, Spicetify-processed Spotify `Apps/xpui` directory,
then run `node StarryNight/tests/compatibility.cjs` from the repository root.
Set `PLAYWRIGHT_CHANNEL=chrome` to use an installed Chrome instead of Playwright's
bundled Chromium. The fixture does not execute Spotify code or use an account.
Run `node StarryNight/tests/surfaces.cjs` with the same settings to check the
expanded/collapsed library, nested panel backgrounds, artist content, shared
header gradients, and discography cards against the installed route CSS.
`node StarryNight/tests/scrolling.cjs` additionally exercises legacy profile
headers, portaled artist backgrounds at several scroll states, Prompted
Playlist/podcast/Home wrappers, large media tiles, scrolling library icons,
and sticky-title controls. It compares rendered pixels at fade boundaries;
it still uses reconstructed markup rather than a live Spotify session.

Checks cover artwork geometry for both widgets, panel alignment, transparency,
play/pause events, sidebar resizing/closure, narrow/short windows, root and player
replacement, reinjection cleanup, lazy stylesheet loading, and reduced motion.
For a live check, also exercise Home, a playlist, Queue, Now Playing, track
changes, and the sidebar divider. Cinema/fullscreen/video layouts have not been
verified by the fixture.

## Screenshots

### Base
![Base](images/base.png)
### Cotton Candy
![Cotton-candy](images/cotton-candy.png)
### Forest
![Forest](images/forest.png)
### Galaxy
![Galaxy](images/galaxy.png)
### Orange
![Orange](images/orange.png)
### Sky
![Sky](images/sky.png)
### Sunrise
![Sunrise](images/sunrise.png)

## More

> Playbar panel is resizable using the resize bar from Now Playing View and Queue card.

### Created by

- https://github.com/b-chen00

### Credits

- Shooting stars created by [Delroy Prithvi](https://codepen.io/delroyprithvi/pen/LYyJROR) with copyright/permission notice:

>   Pure CSS Shooting Star Animation Effect Copyright (c) 2021 by Delroy Prithvi (https://codepen.io/delroyprithvi/pen/LYyJROR)

>  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

>  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

>  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
