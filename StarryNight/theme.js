(() => {
  // Marketplace can evaluate theme.js more than once without reloading Spotify.
  window.StarryNight?.destroy?.();

  const areaAttribute = 'data-starrynight-area';
  const areas = ['left-sidebar', 'main-view', 'right-sidebar', 'now-playing-bar'];
  const marked = new Set();
  let root, background, observedSidebar, observedLibrary, player;
  let frame = 0;
  let destroyed = false;
  const random = (min, max) => Math.random() * (max - min) + min;

  function schedule() {
    if (!destroyed && !frame) frame = requestAnimationFrame(sync);
  }

  function createBackground() {
    background = document.createElement('div');
    background.className = 'starrynight-bg-container';
    background.setAttribute('aria-hidden', 'true');
    const fragment = document.createDocumentFragment();
    const count = Math.min(600, Math.ceil(root.clientWidth * root.clientHeight / 4000));
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'starrynight-star';
      const size = Math.random() < .5 ? 1 : 2;
      Object.assign(star.style, {
        left: `${random(0, 99)}%`, top: `${random(0, 99)}%`,
        opacity: random(.5, 1), width: `${size}px`, height: `${size}px`,
      });
      if (Math.random() < .2) {
        star.style.animation = `twinkle${Math.floor(random(1, 5))} 5s infinite`;
      }
      fragment.appendChild(star);
    }
    // Shooting-star animation and license are preserved in user.css.
    for (let i = 0; i < 4; i++) {
      const star = document.createElement('span');
      star.className = 'shootingstar';
      Object.assign(star.style, {
        top: '-4px', right: `${random(0, 90)}%`,
        animationDuration: `${random(3, 7)}s`,
        animationDelay: `${random(0, 7)}s`,
        animationIterationCount: 'infinite',
        boxShadow: '0 0 0 4px rgba(var(--spice-rgb-shooting-star-glow), .1), 0 0 0 8px rgba(var(--spice-rgb-shooting-star-glow), .1), 0 0 20px rgba(var(--spice-rgb-shooting-star-glow), .1)',
      });
      fragment.appendChild(star);
    }
    background.appendChild(fragment);
    root.appendChild(background);
  }

  function updatePlayback() {
    if (!root) return;
    // Spicetify's player state works independently of the client's UI language.
    let playing = false;
    try { playing = player?.isPlaying?.() === true; } catch { /* Player not ready. */ }
    const value = String(playing);
    if (root.getAttribute('data-starrynight-playing') !== value) {
      root.setAttribute('data-starrynight-playing', value);
    }
  }

  function detachPlayer() {
    player?.removeEventListener?.('onplaypause', updatePlayback);
    player?.removeEventListener?.('songchange', updatePlayback);
    player = undefined;
  }

  function sync() {
    frame = 0;
    const nextRoot = document.querySelector('.Root__top-container');
    if (nextRoot !== root) {
      resizeObserver.disconnect();
      background?.remove();
      root?.removeAttribute('data-starrynight-layout');
      root?.removeAttribute('data-starrynight-playing');
      root?.removeAttribute('data-starrynight-library');
      root?.style.removeProperty('--starrynight-art-size');
      root = nextRoot;
      observedSidebar = undefined;
      observedLibrary = undefined;
      if (root) {
        createBackground();
        resizeObserver.observe(root);
      }
    }
    if (!root) return;
    if (!background?.isConnected) createBackground();

    const panels = {};
    for (const child of root.children) {
      // Grid-area names survive minification. Legacy classes and #main-view
      // are retained as fallbacks, without depending on generated class hashes.
      const gridAreas = getComputedStyle(child).gridArea.split('/').map(value => value.trim());
      const candidates = [
        child.getAttribute(areaAttribute),
        child.id,
        gridAreas.every(value => value === gridAreas[0]) ? gridAreas[0] : '',
        child.classList.contains('Root__nav-bar') ? 'left-sidebar' : '',
        ...areas.filter(area => child.classList.contains(`Root__${area}`)),
      ];
      const area = candidates.find(value => areas.includes(value));
      if (!area) continue;
      if (child.getAttribute(areaAttribute) !== area) child.setAttribute(areaAttribute, area);
      marked.add(child);
      panels[area] = child;
    }
    for (const node of marked) {
      if (!root.contains(node)) { node.removeAttribute(areaAttribute); marked.delete(node); }
    }

    const library = panels['left-sidebar'];
    if (library !== observedLibrary) {
      if (observedLibrary) resizeObserver.unobserve(observedLibrary);
      observedLibrary = library;
      if (library) resizeObserver.observe(library);
    }
    const libraryState = library && library.getBoundingClientRect().width < 120
      ? 'collapsed' : 'expanded';
    if (root.getAttribute('data-starrynight-library') !== libraryState) {
      root.setAttribute('data-starrynight-library', libraryState);
    }

    const sidebar = panels['right-sidebar'];
    if (sidebar !== observedSidebar) {
      if (observedSidebar) resizeObserver.unobserve(observedSidebar);
      observedSidebar = sidebar;
      if (sidebar) resizeObserver.observe(sidebar);
    }
    const sidebarWidth = sidebar?.getBoundingClientRect().width ?? 0;
    const hidden = sidebar?.hidden || sidebar?.getAttribute('aria-hidden') === 'true'
      || root.closest('[data-right-sidebar-hidden="true"]');
    const side = areas.every(area => panels[area]) && !hidden
      && sidebarWidth >= 250 && root.clientWidth >= 1000 && root.clientHeight >= 680;
    const layout = side ? 'side' : 'bottom';
    if (root.getAttribute('data-starrynight-layout') !== layout) {
      root.setAttribute('data-starrynight-layout', layout);
    }
    const artSize = `${Math.round(Math.min(220, Math.max(140, sidebarWidth - 48)))}px`;
    if (root.style.getPropertyValue('--starrynight-art-size') !== artSize) {
      root.style.setProperty('--starrynight-art-size', artSize);
    }

    const nextPlayer = window.Spicetify?.Player;
    if (nextPlayer?.addEventListener && nextPlayer !== player) {
      detachPlayer();
      player = nextPlayer;
      player.addEventListener('onplaypause', updatePlayback);
      player.addEventListener('songchange', updatePlayback);
    }
    updatePlayback();
  }

  const resizeObserver = new ResizeObserver(schedule);
  const observer = new MutationObserver(records => {
    if (records.some(record => !background?.contains(record.target))) schedule();
  });
  observer.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'data-right-sidebar-hidden'],
  });
  const readinessTimer = setInterval(() => {
    if (window.Spicetify?.Player !== player || !player) schedule();
  }, 1000);
  window.addEventListener('resize', schedule);
  window.StarryNight = {
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      clearInterval(readinessTimer);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', schedule);
      detachPlayer();
      background?.remove();
      for (const node of marked) node.removeAttribute(areaAttribute);
      marked.clear();
      root?.removeAttribute('data-starrynight-layout');
      root?.removeAttribute('data-starrynight-playing');
      root?.removeAttribute('data-starrynight-library');
      root?.style.removeProperty('--starrynight-art-size');
    },
  };
  schedule();
})();
