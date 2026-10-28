/**
 * İçimizdeki Tamirci — Link-in-Bio Sayfa Uygulaması (profile-app.js)
 * Tek sayfa, temiz ve profesyonel Link-in-Bio görünümü sunar.
 * Arka planda kaynak (Instagram, WhatsApp vb.) ve eğitim tıklamalarını sessizce kaydeder.
 */

(function () {
  const ICONS = {
    email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
    twitter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
    website: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
  };

  const activeProfileId = document.body.dataset.profileId || 'rabia-alga';

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderPage() {
    const profile = window.ITStore.getProfile(activeProfileId);
    const site = window.ITStore.getData().site;

    document.title = `${profile.name} — İçimizdeki Tamirci`;

    const root = document.getElementById('app-root');
    if (!root) return;

    const activeSocials = (profile.socials || []).filter((s) => s.active !== false);
    const activeVideos = (profile.videos || []).filter((v) => v.active !== false);
    const activeTrainings = (profile.trainings || []).filter((t) => t.active !== false);

    root.innerHTML = `
      <div class="bio-wrapper">
        <!-- Botanik Üst Kapak Görseli -->
        <div class="bio-header-cover" style="background-image: url('${escapeHtml(profile.bgImage || 'assets/images/back.jpg')}');"></div>

        <!-- Profil Alanı -->
        <section class="bio-profile-section">
          <div class="bio-avatar-wrap">
            <img class="bio-avatar" src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.name)}" />
          </div>

          <h1 class="bio-name">${escapeHtml(profile.name)}</h1>
          <p class="bio-role">${escapeHtml(profile.role || '')}</p>

          <!-- Sosyal Medya Yuvarlak Butonları -->
          <div class="bio-social-bar" role="navigation" aria-label="Sosyal Medya">
            ${activeSocials
              .map(
                (s) => `
              <a
                href="${escapeHtml(s.url)}"
                target="${s.platform === 'email' ? '_self' : '_blank'}"
                rel="noopener noreferrer"
                class="bio-social-btn"
                data-social-platform="${escapeHtml(s.platform)}"
                data-social-label="${escapeHtml(s.label)}"
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
                data-social-platform="moreBio"
                data-social-label="Daha Fazlası İçin"
              >
                ${escapeHtml(profile.moreLabel || 'Daha Fazlası İçin...')}
              </a>
            `
                : ''
            }
          </article>

          <!-- Videolar -->
          ${activeVideos
            .map(
              (v) => `
            <div class="bio-video-block">
              <h2 class="bio-video-title">${escapeHtml(v.title)}</h2>
              <div class="bio-video-frame">
                <iframe
                  src="${escapeHtml(v.embedUrl)}"
                  title="${escapeHtml(v.title)}"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                ></iframe>
              </div>
            </div>
          `
            )
            .join('')}

          <!-- Güncel Seminer Takvimi Metin Listesi -->
          <div class="bio-schedule-card">
            <h2 class="bio-schedule-heading">Güncel Seminer Takvimi</h2>
            <div class="bio-schedule-body">
              ${escapeHtml(profile.scheduleNote || '')}
            </div>
          </div>

          <!-- Modernize Edilmiş Seminer Kayıt Butonları -->
          <div class="bio-trainings-list">
            ${activeTrainings
              .map(
                (t) => `
              <a
                href="${escapeHtml(t.url)}"
                target="_blank"
                rel="noopener noreferrer"
                class="bio-training-pill-btn"
                data-training-id="${escapeHtml(t.id)}"
              >
                <span class="bio-training-pill-title">${escapeHtml(t.title)}</span>
                <span class="bio-training-pill-badge ${t.mode === 'Online' ? 'online' : ''}">
                  ${escapeHtml(t.pillText || 'Katıl & İncele')}
                </span>
              </a>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Alt Bilgi (Footer) -->
        <footer class="bio-footer">
          <div>
            ${escapeHtml(site.footerText || '© 2026 İçimizdeki Tamirci | Bütün Hakları Saklıdır.')}
            <a href="${escapeHtml(site.agencyUrl)}" target="_blank" rel="noopener">${escapeHtml(site.agencyName)}</a>
          </div>
        </footer>
      </div>
    `;

    bindTrackingEvents(profile);
  }

  function bindTrackingEvents(profile) {
    // Eğitim Tıklamasını Sessizce Analitiğe Kaydet
    document.querySelectorAll('[data-training-id]').forEach((link) => {
      link.addEventListener('click', () => {
        const trnId = link.getAttribute('data-training-id');
        const training = (profile.trainings || []).find((t) => t.id === trnId);
        if (training) {
          window.ITStore.recordTrainingClick(activeProfileId, training);
        }
      });
    });

    // Sosyal Medya Tıklamasını Sessizce Analitiğe Kaydet
    document.querySelectorAll('[data-social-platform]').forEach((link) => {
      link.addEventListener('click', () => {
        const platform = link.getAttribute('data-social-platform');
        const label = link.getAttribute('data-social-label') || platform;
        window.ITStore.recordSocialClick(activeProfileId, platform, label);
      });
    });
  }

  // Ziyareti otomatik kaydet
  window.ITStore.recordVisit(activeProfileId);

  // Render et
  renderPage();

  // Admin panelinden yapılan değişiklikleri dinle
  window.ITStore.onSync(() => {
    renderPage();
  });
})();
