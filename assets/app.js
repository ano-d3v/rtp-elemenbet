(function () {
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (m) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]; }); }

  function affiliateLink() {
    return (window.RTP_CONFIG && window.RTP_CONFIG.link) || "#";
  }

  function liveChatLink() {
    return (window.RTP_CONFIG && window.RTP_CONFIG.liveChat) || affiliateLink();
  }

  function providerHref(key) {
    var url = new URL(location.href);
    url.searchParams.set("game", key);
    var path = url.pathname.replace(/\/+$/, "") || "/";
    return path + "?" + url.searchParams.toString() + url.hash;
  }

  function bindAffiliateLinks() {
    $all("[data-link]").forEach(function (el) {
      var type = el.getAttribute("data-link");
      var href = type === "livechat" ? liveChatLink() : affiliateLink();
      if (href && href !== "#") {
        el.setAttribute("href", href);
        if (type === "livechat" || href.indexOf("#") !== 0) {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener noreferrer");
        }
      }
    });
  }

  function rtpValue(idx, nowMs) {
    var t = Math.floor(nowMs / 300000);
    var x = (t * 1103515245 + idx * 12345) >>> 0;
    x = (x ^ (x >>> 16)) >>> 0;
    return 12 + (x % 88);
  }

  function paintAll() {
    var wraps = $all(".rtp-wrap");
    if (!wraps.length) return;
    var now = Date.now();
    wraps.forEach(function (wrap) {
      var idx = parseInt(wrap.getAttribute("data-rtp-index"), 10) || 1;
      var val = rtpValue(idx, now);
      var txt = $(".rtp-text", wrap);
      var bar = $(".rtp-fill", wrap);
      if (txt) txt.textContent = val + "%";
      if (bar) {
        bar.style.width = val + "%";
        bar.classList.remove("low", "mid", "high");
        if (val < 30) bar.classList.add("low");
        else if (val > 70) bar.classList.add("high");
        else bar.classList.add("mid");
      }
    });
  }

  function scheduleUpdates() {
    paintAll();
    var interval = 300000;
    var now = Date.now();
    var msToNext = interval - (now % interval) + 50;
    setTimeout(function () {
      paintAll();
      setInterval(paintAll, interval);
    }, msToNext);
  }

  function initMenu() {
    var btn = $("#hamburgerBtn");
    var sidebar = $("#mobile-menu");
    if (!btn || !sidebar) return;
    var backdrop = document.createElement("div");
    backdrop.className = "menu-backdrop";
    document.body.appendChild(backdrop);

    function openMenu() { sidebar.classList.add("is-open"); backdrop.classList.add("is-open"); }
    function closeMenu() { sidebar.classList.remove("is-open"); backdrop.classList.remove("is-open"); }

    btn.addEventListener("click", function () {
      if (sidebar.classList.contains("is-open")) closeMenu(); else openMenu();
    });
    backdrop.addEventListener("click", closeMenu);
    $all("a", sidebar).forEach(function (a) { a.addEventListener("click", closeMenu); });
  }

  function currentProviderKey() {
    var params = new URLSearchParams(location.search);
    return params.get("game") || (window.RTP_PROVIDERS && window.RTP_PROVIDERS.default) || "pragmatic";
  }

  function renderProviderCards() {
    var wrap = $("#providersGrid");
    if (!wrap || !window.RTP_PROVIDERS) return;
    var keyNow = currentProviderKey();
    wrap.innerHTML = window.RTP_PROVIDERS.providers.map(function (p) {
      var href = providerHref(p.key);
      return (
        '<article class="game-card" role="button" tabindex="0" data-href="' + href + '">' +
        '<div class="game-thumb">' +
        '<img alt="Provider ' + escapeHtml(p.name) + '" src="' + escapeHtml(p.img) + '"/>' +
        '<span class="badge">' + escapeHtml(p.badge) + '</span>' +
        '<div class="play-overlay">' +
        '<a class="play-button" href="' + href + '">LIHAT RTP</a>' +
        '</div>' +
        '</div>' +
        '</article>'
      );
    }).join("");

    $all(".game-card", wrap).forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target && e.target.closest && e.target.closest("a")) return;
        var href = card.getAttribute("data-href");
        if (href) location.href = href;
      });
      card.addEventListener("keypress", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          var href = card.getAttribute("data-href");
          if (href) location.href = href;
        }
      });
    });

    var active = wrap.querySelector('[data-href*="game=' + encodeURIComponent(keyNow) + '"]');
    if (active) active.classList.add("is-active");
  }

  function renderGames() {
    var key = currentProviderKey();
    var data = window.RTP_DATA && window.RTP_DATA[key];
    if (!data) {
      key = (window.RTP_PROVIDERS && window.RTP_PROVIDERS.default) || "pragmatic";
      data = window.RTP_DATA && window.RTP_DATA[key];
    }

    var logoEl = document.getElementById("providerLogo");
    if (logoEl && window.RTP_PROVIDERS && Array.isArray(window.RTP_PROVIDERS.providers)) {
      var prov = window.RTP_PROVIDERS.providers.find(function (p) { return p.key === key; });
      if (prov && prov.img) {
        logoEl.src = prov.img;
        logoEl.alt = (prov.name || key) + " Provider";
      }
    }

    var titleEl = $("#providerTitle");
    if (titleEl) titleEl.textContent = data ? data.name : "RTP Live";

    var grid = $("#gamesGridLainnya");
    if (!grid || !data) return;

    var playLink = affiliateLink();
    var startIndex = 21;
    grid.innerHTML = data.games.map(function (g, i) {
      var idx = startIndex + i;
      var link = playLink !== "#" ? playLink : (g.link || "#");
      return (
        '<article class="game-card-lainnya" role="button" tabindex="0">' +
        '<div class="game-thumb-lainnya">' +
        '<img src="' + escapeHtml(g.img) + '" alt="' + escapeHtml(g.title) + '"/>' +
        '<div class="play-overlay-lainnya">' +
        '<a class="play-button-lainnya" href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">Bermain</a>' +
        '</div>' +
        '</div>' +
        '<div class="rtp-wrap" data-rtp-index="' + idx + '">' +
        '<div class="rtp"><div class="rtp-text">0%</div><div class="rtp-fill"></div></div>' +
        '</div>' +
        '<p class="game-title-lainnya">' + escapeHtml(g.title) + '</p>' +
        '</article>'
      );
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindAffiliateLinks();
    initMenu();
    renderProviderCards();
    renderGames();
    scheduleUpdates();
  });
})();
