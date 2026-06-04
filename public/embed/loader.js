/**
 * Moteurs.com — Embed loader (v1)
 *
 * Usage cote partenaire :
 *
 *   <div data-moteurs-embed="tco"
 *        data-partner="ccinord"
 *        data-lang="fr"
 *        data-theme="light"
 *        data-accent="#ef6c1a"></div>
 *   <script async src="https://moteurs.com/embed/loader.js"></script>
 *
 * Ce script :
 *   1. Scanne tous les elements [data-moteurs-embed]
 *   2. Cree une iframe pour chaque, avec les query params adequats
 *   3. Ecoute postMessage pour ajuster la hauteur dynamiquement
 *   4. Supporte plusieurs embeds sur la meme page (chacun a son id)
 *
 * IIFE strict, zero dependance, ~2 Ko gzip.
 */
(function () {
  'use strict';

  var BASE = 'https://moteurs.com/embed/v1/';
  var VARIANTS = { tco: 'tco', trajet: 'trajet', 'cartes-recharge': 'cartes-recharge' };
  var counter = 0;

  function uid() {
    counter += 1;
    return 'mt-' + Date.now().toString(36) + '-' + counter;
  }

  function buildUrl(variant, dataset, id) {
    var url = BASE + variant + '/?id=' + encodeURIComponent(id);
    var passthrough = ['partner', 'lang', 'theme', 'accent'];
    for (var i = 0; i < passthrough.length; i++) {
      var key = passthrough[i];
      var val = dataset[key];
      if (val) {
        url += '&' + key + '=' + encodeURIComponent(val);
      }
    }
    return url;
  }

  function mount(el) {
    if (el.dataset.moteursMounted === '1') return;
    el.dataset.moteursMounted = '1';

    var variant = VARIANTS[el.dataset.moteursEmbed];
    if (!variant) {
      console.warn('[moteurs-embed] variante inconnue:', el.dataset.moteursEmbed);
      return;
    }

    var id = uid();
    var src = buildUrl(variant, el.dataset, id);

    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.setAttribute('data-moteurs-id', id);
    iframe.setAttribute('title', 'Moteurs.com — ' + variant);
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.style.cssText =
      'width:100%;height:680px;border:0;display:block;' +
      'background:transparent;color-scheme:normal;';

    el.appendChild(iframe);
  }

  function scan() {
    var nodes = document.querySelectorAll('[data-moteurs-embed]');
    for (var i = 0; i < nodes.length; i++) {
      mount(nodes[i]);
    }
  }

  function findIframeById(id) {
    return document.querySelector('iframe[data-moteurs-id="' + id + '"]');
  }

  // Ecoute des messages des iframes
  window.addEventListener('message', function (e) {
    var d = e && e.data;
    if (!d || d.source !== 'moteurs-embed') return;

    if (d.type === 'resize' && typeof d.height === 'number' && d.id) {
      var iframe = findIframeById(d.id);
      if (iframe) {
        // Marge de securite pour eviter une scrollbar interne
        iframe.style.height = (d.height + 4) + 'px';
      }
    }

    // d.type === 'event' (load, calcul, lead) : prive a Moteurs.com
    // — pas d'action cote partenaire pour l'instant.
  });

  // Scan initial + reobservation des ajouts DOM (SPA partenaires)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  // MutationObserver pour les sites SPA qui injectent l'element apres coup
  if (typeof MutationObserver !== 'undefined') {
    var mo = new MutationObserver(function () { scan(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
