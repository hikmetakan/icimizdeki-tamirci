/**
 * İçimizdeki Tamirci — Profil & Link-in-Bio Render Motoru (profile-app.js)
 * rabia-alga.php / .html ve bedia-kahya-kilic.php / .html sayfalarını
 * dinamik olarak oluşturur, tıklama ve trafik kaynağı analizlerini kaydeder.
 */

(function () {
  const ICONS = {
    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
    twitter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>`,
    email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    website: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    whatsapp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    arrowUpRight: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>`,
    check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
  };

  let currentFilter = 'ALL';
  let activeProfileId = document.body.dataset.profileId || 'rabia-alga';

  // URL parametresiyle profil değişimi desteği (?profile=bedia-kahya-kilic)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('profile') && ['rabia-alga', 'bedia-kahya-kilic'].includes(urlParams.get('profile'))) {
    activeProfileId = urlParams.get('profile');
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg) {
    let toast = document.getElementById('it-live-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'it-live-toast';
      toast.className = 'it-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `${ICONS.check} <span>${escapeHtml(msg)}</span>`;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function renderProfilePage() {
    const profile = window.ITStore.getProfile(activeProfileId);
    const site = window.ITStore.getData().site;
    const detectedSource = window.ITStore.detectVisitorSource();
    const sourceMeta = window.ITStore.SOURCE_META[detectedSource] || window.ITStore.SOURCE_META.direct;

    document.title = `${profile.name} | ${site.brandName}`;
    if (profile.accentColor) {
      document.documentElement.style.setProperty('--accent', profile.accentColor);
    }

    const credItems = (profile.credentials || '')
      .split('·')
      .map((s) => s.trim())
      .filter(Boolean);

    const activeSocials = (profile.socials || []).filter((s) => s.active);
    const activeTrainings = (profile.trainings || []).filter((t) => t.active !== false);
    const filteredTrainings = activeTrainings.filter((t) => {
      if (currentFilter === 'ALL') return true;
      return t.mode === currentFilter;
    });
    const activeVideos = (profile.videos || []).filter((v) => v.active !== false);

    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = `
      <!-- Üst Gezinme & Canlı Kontrol Çubuğu -->
      <header class="it-topbar">
        <div class="it-topbar-inner">
          <div style="display:flex; align-items:center; gap:0.85rem; flex-wrap:wrap;">
            <a href="index.html" class="it-brand" title="Ana Sayfa / Portal">
              <span class="it-brand-mark">İT</span>
              <span>${escapeHtml(site.brandName)}</span>
            </a>

            <nav class="it-profile-Select-pills" aria-label="Eğitmen Seçimi">
              <a href="rabia-alga.html" class="it-pill-link ${activeProfileId === 'rabia-alga' ? 'active' : ''}">
                <img src="assets/images/RabiaAlga.jpg" alt="Rabia Alga" />
                <span>Rabia Alga</span>
              </a>
              <a href="bedia-kahya-kilic.html" class="it-pill-link ${activeProfileId === 'bedia-kahya-kilic' ? 'active' : ''}">
                <img src="assets/images/BediaKahyaKilic.jpg" alt="Bedia Kahya Kılıç" />
                <span>Bedia Kahya Kılıç</span>
              </a>
            </nav>
          </div>

          <div class="it-topbar-actions">
            <div class="it-viewport-switcher" role="group" aria-label="Cihaz Görünümü Önizleme">
              <button type="button" class="it-vp-btn ${!document.body.classList.contains('force-mobile-view') ? 'active' : ''}" data-vp="desktop">
                💻 PC Tasarımı
              </button>
              <button type="button" class="it-vp-btn ${document.body.classList.contains('force-mobile-view') ? 'active' : ''}" data-vp="mobile">
                📱 Mobil Önizleme
              </button>
            </div>

            <span class="it-source-badge" title="Ziyaretçinin geldiği tespit edilen kanal">
              Geliş: <strong>${escapeHtml(sourceMeta.label)}</strong>
            </span>

            <a href="admin.html?profile=${encodeURIComponent(activeProfileId)}" class="it-admin-cta">
              <span>⚙️ Yönetim & Analiz</span>
            </a>
          </div>
        </div>
      </header>

      <!-- Ana İçerik Alanı -->
      <main class="it-main-container">
        <div class="it-profile-layout">
          <!-- SOL SÜTUN: Kimlik, Sosyal Medya ve Hakkımda -->
          <aside class="it-identity-col">
            <div class="it-identity-card">
              <div class="it-identity-cover">
                <span class="it-cover-tag">${escapeHtml(profile.phpSlug)}</span>
              </div>
              <div class="it-identity-body">
                <div class="it-avatar-wrap">
                  <img class="it-avatar" src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.name)}" />
                  <span class="it-verified-dot" title="Doğrulanmış Eğitmen">
                    ${ICONS.check}
                  </span>
                </div>

                <h1 class="it-name">${escapeHtml(profile.name)}</h1>
                <p class="it-role">${escapeHtml(profile.role)}</p>

                <div class="it-credentials">
                  ${credItems.map((c) => `<span class="it-cred-badge">${escapeHtml(c)}</span>`).join('')}
                </div>

                <!-- Sosyal Medya İkon Barı -->
                <div class="it-social-strip" role="list" aria-label="Sosyal Medya Bağlantıları">
                  ${activeSocials
                    .map(
                      (s) => `
                    <a
                      href="${escapeHtml(s.url)}"
                      target="${s.platform === 'email' ? '_self' : '_blank'}"
                      rel="noopener noreferrer"
                      class="it-social-btn"
                      data-social-platform="${escapeHtml(s.platform)}"
                      data-social-label="${escapeHtml(s.label)}"
                      title="${escapeHtml(s.label)}: ${escapeHtml(s.handle || s.url)}"
                    >
                      ${ICONS[s.platform] || ICONS.website}
                      <span>${escapeHtml(s.label)}</span>
                    </a>
                  `
                    )
                    .join('')}
                </div>

                <!-- Hakkımda Kutusu -->
                <div class="it-bio-box" id="hakkimda-bolumu">
                  <h2 class="it-bio-greeting">${escapeHtml(profile.greeting)}</h2>
                  <p class="it-bio-text">${escapeHtml(profile.bio)}</p>
                  ${
                    profile.moreUrl
                      ? `
                    <a
                      href="${escapeHtml(profile.moreUrl)}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="it-more-btn"
                      data-social-platform="moreBio"
                      data-social-label="Hakkımda Daha Fazlası"
                    >
                      <span>${escapeHtml(profile.moreLabel || 'Hakkımda Daha Fazlası')}</span>
                      ${ICONS.arrowUpRight}
                    </a>
                  `
                      : ''
                  }
                </div>
              </div>
            </div>

            <!-- Kaynak Simülasyonu & Hızlı Link Paylaşım Kartı -->
            <div class="it-share-card">
              <div class="it-share-title">
                <span>🔗 Kaynak Linki Test Et / Kopyala</span>
                <span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--accent);">Analitik Testi</span>
              </div>
              <div class="it-share-btns">
                <button type="button" class="it-share-chip" data-sim-source="instagram">
                  📸 Instagram'dan Gir
                </button>
                <button type="button" class="it-share-chip" data-sim-source="whatsapp">
                  💬 WhatsApp'tan Gir
                </button>
                <button type="button" class="it-share-chip" data-copy-ref="instagram">
                  📋 IG Bio Linki Kopyala
                </button>
                <button type="button" class="it-share-chip" data-copy-ref="whatsapp">
                  📋 WP Linki Kopyala
                </button>
              </div>
            </div>
          </aside>

          <!-- SAĞ SÜTUN: Eğitim Takvimi ve Videolar -->
          <div class="it-content-col">
            <!-- Mobil Hızlı Sekme Barı -->
            <div class="it-mobile-tabs">
              <a href="#seminer-takvimi" class="it-mob-tab active">Seminerler (${activeTrainings.length})</a>
              <a href="#video-rehberler" class="it-mob-tab">Videolar (${activeVideos.length})</a>
              <a href="#hakkimda-bolumu" class="it-mob-tab">Hakkımda</a>
            </div>

            <!-- BÖLÜM 1: GÜNCEL SEMİNER TAKVİMİ -->
            <section class="it-section-block" id="seminer-takvimi">
              <div class="it-section-header">
                <div>
                  <div class="it-section-eyebrow">
                    <span>● Aktif Eğitim & Seminerler</span>
                  </div>
                  <h2 class="it-section-title">Güncel Seminer Takvimi</h2>
                </div>

                <div class="it-filter-pills" role="tablist" aria-label="Eğitim Türü Filtresi">
                  <button type="button" class="it-filter-btn ${currentFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">
                    Tümü (${activeTrainings.length})
                  </button>
                  <button type="button" class="it-filter-btn ${currentFilter === 'Yüz Yüze' ? 'active' : ''}" data-filter="Yüz Yüze">
                    Yüz Yüze
                  </button>
                  <button type="button" class="it-filter-btn ${currentFilter === 'Online' ? 'active' : ''}" data-filter="Online">
                    Online
                  </button>
                </div>
              </div>

              ${
                filteredTrainings.length === 0
                  ? `<div style="padding:2rem; text-align:center; color:var(--text-muted); background:var(--surface-subtle); border-radius:var(--radius-md);">
                      Bu filtrede aktif seminer bulunmuyor.
                    </div>`
                  : `
                <div class="it-trainings-grid">
                  ${filteredTrainings
                    .map(
                      (t) => `
                    <article class="it-training-card" data-mode="${escapeHtml(t.mode)}">
                      <div>
                        <div class="it-training-top">
                          <span class="it-training-cat">${escapeHtml(t.category || 'Seminer')}</span>
                          <span class="it-training-mode ${t.mode === 'Online' ? 'online' : ''}">${escapeHtml(t.mode || 'Yüz Yüze')}</span>
                        </div>

                        <h3 class="it-training-title">${escapeHtml(t.title)}</h3>

                        <div class="it-training-meta">
                          <div class="it-meta-row">
                            ${ICONS.calendar}
                            <span>${escapeHtml(t.date)}</span>
                          </div>
                          <div class="it-meta-row">
                            ${ICONS.clock}
                            <span>${escapeHtml(t.time)}</span>
                          </div>
                          <div class="it-meta-row">
                            ${ICONS.mapPin}
                            <span>${escapeHtml(t.location)}</span>
                          </div>
                        </div>
                      </div>

                      <div class="it-training-footer">
                        <div class="it-status-line">
                          <span class="it-pulse-dot"></span>
                          <span>${escapeHtml(t.status || 'Kayıtlarımız devam etmektedir')}</span>
                        </div>

                        <a
                          href="${escapeHtml(t.url)}"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="it-training-cta"
                          data-training-id="${escapeHtml(t.id)}"
                        >
                          <span>${escapeHtml(t.ctaLabel || 'Seminere Katıl & İncele')}</span>
                          ${ICONS.arrowUpRight}
                        </a>
                      </div>
                    </article>
                  `
                    )
                    .join('')}
                </div>
              `
              }
            </section>

            <!-- BÖLÜM 2: VİDEO REHBERLER & SOHBETLER -->
            <section class="it-section-block" id="video-rehberler">
              <div class="it-section-header">
                <div>
                  <div class="it-section-eyebrow">
                    <span>▶ Farkındalık Sohbetleri</span>
                  </div>
                  <h2 class="it-section-title">Öne Çıkan Video & Sohbetler</h2>
                </div>
              </div>

              <div class="it-videos-grid">
                ${activeVideos
                  .map(
                    (v) => `
                  <article class="it-video-card">
                    <div class="it-video-frame">
                      <iframe
                        src="${escapeHtml(v.embedUrl)}"
                        title="${escapeHtml(v.title)}"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                      ></iframe>
                    </div>
                    <div class="it-video-info">
                      <h3 class="it-video-title">${escapeHtml(v.title)}</h3>
                      <p class="it-video-sub">${escapeHtml(v.subtitle || '')}</p>
                    </div>
                  </article>
                `
                  )
                  .join('')}
              </div>
            </section>
          </div>
        </div>

        <!-- Alt Bilgi (Footer) -->
        <footer class="it-footer">
          <div>
            ${escapeHtml(site.footerText)}
            Design &amp; Dev: <a href="${escapeHtml(site.agencyUrl)}" target="_blank" rel="noopener">${escapeHtml(site.agencyName)}</a>
          </div>
          <div style="display:flex; gap:1rem;">
            <a href="rabia-alga.html">rabia-alga.php</a>
            <a href="bedia-kahya-kilic.html">bedia-kahya-kilic.php</a>
            <a href="admin.html?profile=${encodeURIComponent(activeProfileId)}">Admin Paneli</a>
          </div>
        </footer>
      </main>
    `;

    bindEvents(profile);
  }

  function bindEvents(profile) {
    // 1. Eğitim Tıklaması Kaydı
    document.querySelectorAll('[data-training-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const trainingId = btn.getAttribute('data-training-id');
        const training = (profile.trainings || []).find((t) => t.id === trainingId);
        if (training) {
          window.ITStore.recordTrainingClick(activeProfileId, training);
          showToast(`"${training.title}" tıklaması analitiğe kaydedildi!`);
        }
      });
    });

    // 2. Sosyal Medya Tıklaması Kaydı
    document.querySelectorAll('[data-social-platform]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const platform = btn.getAttribute('data-social-platform');
        const label = btn.getAttribute('data-social-label') || platform;
        window.ITStore.recordSocialClick(activeProfileId, platform, label);
      });
    });

    // 3. Seminer Filtre Butonları
    document.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.getAttribute('data-filter');
        renderProfilePage();
      });
    });

    // 4. PC / Mobil Görünüm Önizleme Seçicisi
    document.querySelectorAll('[data-vp]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const vp = btn.getAttribute('data-vp');
        if (vp === 'mobile') {
          document.body.classList.add('force-mobile-view');
          showToast('Mobil Link-in-Bio önizleme görünümü aktif');
        } else {
          document.body.classList.remove('force-mobile-view');
          showToast('Masaüstü (PC) geniş görünüm aktif');
        }
        renderProfilePage();
      });
    });

    // 5. Kaynak Simülasyon Butonları (Instagram / WhatsApp geliş testi)
    document.querySelectorAll('[data-sim-source]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const simSource = btn.getAttribute('data-sim-source');
        window.ITStore.recordVisit(activeProfileId, simSource);
        const url = new URL(window.location.href);
        url.searchParams.set('ref', simSource);
        window.history.replaceState({}, '', url.toString());
        renderProfilePage();
        const label = window.ITStore.SOURCE_META[simSource]?.label || simSource;
        showToast(`${label} üzerinden yeni ziyaret kaydedildi! Şimdi bir eğitime tıklayabilirsiniz.`);
      });
    });

    // 6. Referanslı Link Kopyalama
    document.querySelectorAll('[data-copy-ref]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ref = btn.getAttribute('data-copy-ref');
        const url = new URL(window.location.href);
        url.searchParams.set('ref', ref);
        navigator.clipboard?.writeText(url.toString()).catch(() => {});
        showToast(`?ref=${ref} takip linki panoya kopyalandı!`);
      });
    });
  }

  // Sayfa açılışında ziyareti kaydet
  window.ITStore.recordVisit(activeProfileId);

  // İlk render
  renderProfilePage();

  // Admin panelinden yapılan değişiklikleri anında yakala ve sayfayı güncelle
  window.ITStore.onSync(() => {
    renderProfilePage();
    showToast('Admin panelinden yapılan değişiklikler anında uygulandı!');
  });
})();
