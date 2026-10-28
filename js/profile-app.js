/**
 * İçimizdeki Tamirci — Modern Profesyonel Link-in-Bio Uygulaması (profile-app.js)
 * Video Rehberler (YouTube Uygulamasında Açma), Yapılandırılmış Seminer Takvimi,
 * Çok satırlı unvan desteği ve ShenAjans alt bilgisi.
 */

(function () {
  const ICONS = {
    email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
    twitter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
    website: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    arrowUpRight: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>`,
    check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    play: `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>`
  };

  let activeProfileId = document.body.dataset.profileId;
  if (!activeProfileId || activeProfileId === 'rabia-alga') {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && !lastPart.includes('.') && lastPart !== 'icimizdekitamirci') {
      activeProfileId = lastPart;
    }
  }
  activeProfileId = activeProfileId || 'rabia-alga';

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function extractYoutubeId(url) {
    if (!url) return '';
    const m = url.match(/(?:embed\/|v=|vi\/|youtu\.be\/|\/v\/|watch\?v=|\?v=)([^#&?]+)/);
    return m ? m[1] : url.trim();
  }

  function renderPage() {
    const profile = window.ITStore.getProfile(activeProfileId);
    document.title = `${profile.name} — İçimizdeki Tamirci`;

    const root = document.getElementById('app-root');
    if (!root) return;

    const activeSocials = (profile.socials || []).filter((s) => s.active !== false);
    const activeTrainings = (profile.trainings || []).filter((t) => t.active !== false);
    const activeVideos = (profile.videos || []).filter((v) => v.active !== false);

    root.innerHTML = `
      <div class="bio-wrapper">
        <!-- Üst Kapak Görseli -->
        <div class="bio-header-cover" style="background-image: url('${escapeHtml(profile.bgImage || 'assets/images/back.jpg')}');"></div>

        <!-- Profil Bilgileri -->
        <section class="bio-profile-section">
          <div class="bio-avatar-wrap">
            <img class="bio-avatar" src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.name)}" />
            <div class="bio-verified-badge" title="Doğrulanmış Eğitmen">
              ${ICONS.check}
            </div>
          </div>

          <h1 class="bio-name">${escapeHtml(profile.name)}</h1>
          <!-- Çok Satırlı Unvan / Rol -->
          <p class="bio-role">${escapeHtml(profile.role || '')}</p>
          ${profile.credentials ? `<p class="bio-credentials">${escapeHtml(profile.credentials)}</p>` : ''}

          <!-- Sosyal Medya İkonları -->
          <div class="bio-social-bar" role="navigation" aria-label="Sosyal Medya">
            ${activeSocials
              .map(
                (s) => `
              <a
                href="${escapeHtml(s.url)}"
                target="${s.platform === 'email' ? '_self' : '_blank'}"
                rel="noopener noreferrer"
                class="bio-social-btn"
                title="${escapeHtml(s.label)}"
              >
                ${ICONS[s.platform] || ICONS.website}
              </a>
            `
              )
              .join('')}
          </div>
        </section>

        <!-- İçerik Alanı -->
        <div class="bio-content-area">
          <!-- Biyografi / Hakkımda Kartı -->
          <article class="bio-about-card">
            <h2 class="bio-about-title">${escapeHtml(profile.greeting || 'Merhaba, Ben ' + profile.name)}</h2>
            <p class="bio-about-text">${escapeHtml(profile.bio || '')}</p>
            ${
              profile.moreUrl
                ? `
              <a
                href="${escapeHtml(profile.moreUrl)}"
                target="_blank"
                rel="noopener noreferrer"
                class="bio-more-btn"
              >
                <span>${escapeHtml(profile.moreLabel || 'Daha Fazlası İçin...')}</span>
                ${ICONS.arrowUpRight}
              </a>
            `
                : ''
            }
          </article>

          <!-- 1) VİDEO REHBERLER (AKTİF PROGRAMLAR KISMININ ÜSTÜNDE) -->
          ${
            activeVideos.length > 0
              ? `
            <section class="bio-videos-section">
              <div class="bio-section-title-wrap">
                <span class="bio-section-badge">▶ Video Rehberler</span>
                <h2 class="bio-section-title">Farkındalık Sohbetleri</h2>
                <p class="bio-section-subtitle">Videoya tıklayarak doğrudan YouTube uygulamasında izleyebilirsiniz</p>
              </div>

              ${activeVideos
                .map((v) => {
                  const videoId = extractYoutubeId(v.embedUrl);
                  const thumbUrl = videoId
                    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                    : 'assets/images/back.jpg';
                  const watchUrl = videoId
                    ? `https://www.youtube.com/watch?v=${videoId}`
                    : v.embedUrl;

                  return `
                    <article class="bio-video-card">
                      <h3 class="bio-video-heading">${escapeHtml(v.title)}</h3>
                      <a
                        href="${escapeHtml(watchUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="bio-video-thumb-link"
                        data-video-id="${escapeHtml(videoId)}"
                        style="background-image: url('${escapeHtml(thumbUrl)}');"
                        aria-label="${escapeHtml(v.title)} — YouTube uygulamasında izle"
                      >
                        <div class="bio-video-overlay">
                          <div class="bio-video-play-btn" title="Videoyu YouTube'da Başlat">
                            ${ICONS.play}
                          </div>
                        </div>

                        <div class="bio-video-badge-bar">
                          <span class="bio-video-pill">
                            ${ICONS.youtube}
                            <span>YouTube Uygulamasında Aç</span>
                          </span>
                          <span style="color:#ffffff; font-size:1.1rem; opacity:0.9;">↗</span>
                        </div>
                      </a>
                    </article>
                  `;
                })
                .join('')}
            </section>
          `
              : ''
          }

          <!-- 2) AKTİF PROGRAMLAR — YAPILANDIRILMIŞ VE MODERN GÜNCEL SEMİNER TAKVİMİ -->
          <section class="bio-seminars-section">
            <div class="bio-section-title-wrap">
              <span class="bio-section-badge">● Aktif Programlar</span>
              <h2 class="bio-section-title">Güncel Seminer Takvimi</h2>
              <p class="bio-section-subtitle">Bütünsel dönüşüm ve farkındalık eğitimleri</p>
            </div>

            <div class="bio-seminars-list">
              ${activeTrainings
                .map((t) => {
                  const isOnline = String(t.mode || '').toLowerCase().includes('online');
                  return `
                <article class="bio-seminar-card ${isOnline ? 'is-online' : 'is-inperson'}">
                  <div class="bio-seminar-header">
                    <span class="bio-category-tag">${escapeHtml(t.category || 'Seminer')}</span>
                    <span class="bio-format-tag">
                      ${isOnline ? '💻 Online Zoom' : '📍 Yüz Yüze'}
                    </span>
                  </div>

                  <h3 class="bio-seminar-title">${escapeHtml(t.title)}</h3>

                  <div class="bio-seminar-details">
                    <div class="bio-detail-row">
                      ${ICONS.calendar}
                      <span><strong>Tarih & Saat:</strong> ${escapeHtml(t.date || '')}</span>
                    </div>
                    ${
                      t.location
                        ? `
                      <div class="bio-detail-row">
                        ${ICONS.mapPin}
                        <span><strong>Yer / Mekan:</strong> ${escapeHtml(t.location)}</span>
                      </div>
                    `
                        : ''
                    }
                  </div>

                  ${
                    t.note
                      ? `
                    <div class="bio-seminar-note">
                      <span class="bio-pulse-dot"></span>
                      <span>${escapeHtml(t.note)}</span>
                    </div>
                  `
                      : ''
                  }

                  <a
                    href="${escapeHtml(t.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="bio-seminar-action-btn"
                    data-training-id="${escapeHtml(t.id)}"
                  >
                    <span>${escapeHtml(t.ctaText || 'Seminere Katıl & İncele')}</span>
                    ${ICONS.arrowUpRight}
                  </a>
                </article>
              `;
                })
                .join('')}
            </div>
          </section>
        </div>

        <!-- Footer: ShenAjans & Telif Hakkı -->
        <footer class="bio-footer">
          <div>© 2026 İçimizdeki Tamirci | Bütün Hakları Saklıdır.</div>
          <div style="margin-top:0.35rem;">created by <a href="https://www.shenajans.com/" target="_blank" rel="noopener noreferrer">ShenAjans</a></div>
        </footer>
      </div>
    `;

    bindTrackingEvents(profile);
    bindVideoHandlers();
  }

  function bindVideoHandlers() {
    // Mobil cihazda tıklandığında direkt YouTube uygulamasını açmayı tetikle
    document.querySelectorAll('.bio-video-thumb-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        const videoId = link.getAttribute('data-video-id');
        if (!videoId) return;

        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          // Mobil cihazlarda direkt uygulama şeması
          const appScheme = `vnd.youtube:${videoId}`;
          const webUrl = `https://www.youtube.com/watch?v=${videoId}`;

          // Uygulamayı tetikle, eğer açılamazsa standart web URL'ye devam et
          const timer = setTimeout(() => {
            window.location.href = webUrl;
          }, 600);

          window.location.href = appScheme;
        }
      });
    });
  }

  function bindTrackingEvents(profile) {
    // Eğitim Tıklamasını Sessizce SQLite3 Veritabanına Kaydet
    document.querySelectorAll('[data-training-id]').forEach((link) => {
      link.addEventListener('click', () => {
        const trnId = link.getAttribute('data-training-id');
        const training = (profile.trainings || []).find((t) => t.id === trnId);
        if (training) {
          window.ITStore.recordTrainingClick(activeProfileId, training);
        }
      });
    });
  }

  // Ziyareti SQLite3 Veritabanına Kaydet
  window.ITStore.recordVisit(activeProfileId);

  // İlk render (localStorage veya varsayılanlar ile anında görüntüleme)
  renderPage();

  // Senkronizasyon dinleyicisi: Sunucudan veri geldiğinde sayfayı güncelle
  window.ITStore.onSync(() => {
    renderPage();
  });

  // Sayfa açılır açılmaz sunucudaki (api.php) en güncel veriyi çek
  window.ITStore.pullFromServer().then((hasUpdate) => {
    if (hasUpdate) {
      renderPage();
    }
  });
})();
