/**
 * İçimizdeki Tamirci — SQLite3 Yönetim Paneli Uygulaması (admin-app.js)
 * ShenApp mimarisi referanslı SQLite3 Veri Motoru
 * Varsayılan Giriş: 1 / 1
 */

(function () {
  const urlParams = new URLSearchParams(window.location.search);
  let selectedProfileId = urlParams.get('profile') || 'rabia-alga';
  if (!['rabia-alga', 'bedia-kahya-kilic'].includes(selectedProfileId)) {
    selectedProfileId = 'rabia-alga';
  }

  let activeSection = urlParams.get('tab') || 'analytics'; // analytics | trainings | profile | media | security
  let analyticsFilterProfile = 'ALL'; // ALL | rabia-alga | bedia-kahya-kilic

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg) {
    let toast = document.getElementById('admin-live-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-live-toast';
      toast.className = 'it-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>✅ ${escapeHtml(msg)}</span>`;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function formatTimeAgo(isoString) {
    const diffSec = Math.max(1, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diffSec < 60) return `${diffSec} sn önce`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} saat önce`;
    return new Date(isoString).toLocaleDateString('tr-TR');
  }

  function normalizeYoutubeEmbed(inputUrl) {
    const raw = (inputUrl || '').trim();
    if (!raw) return '';
    if (raw.includes('/embed/')) return raw;
    const match = raw.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{6,15})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return raw;
  }

  // =========================================================================
  // 1. GİRİŞ PANELİ (LOGIN SCREEN)
  // =========================================================================
  function renderLoginScreen() {
    const root = document.getElementById('admin-root');
    if (!root) return;

    root.innerHTML = `
      <div class="admin-login-screen">
        <div class="admin-login-card">
          <div class="login-brand-icon">İT</div>
          <h1 class="login-title">Yönetici Girişi</h1>
          <p class="login-subtitle">İçimizdeki Tamirci Yönetim & Analitik Paneli</p>

          <form id="admin-login-form" class="login-form">
            <div id="login-error" class="login-error-box">
              Hatalı kullanıcı adı veya şifre!
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="login-username">Kullanıcı Adı</label>
              <input
                type="text"
                id="login-username"
                class="form-input"
                placeholder="Kullanıcı adınızı girin"
                required
                autocomplete="username"
                autofocus
              />
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="login-password">Şifre</label>
              <input
                type="password"
                id="login-password"
                class="form-input"
                placeholder="Şifrenizi girin"
                required
                autocomplete="current-password"
              />
            </div>

            <button type="submit" class="btn-primary" style="justify-content:center; padding:0.75rem; font-size:0.95rem; margin-top:0.5rem;">
              Giriş Yap →
            </button>
          </form>

          <div class="login-hint-box">
            💡 <strong>Varsayılan Bilgiler:</strong><br />
            Kullanıcı Adı: <code>1</code> &nbsp;|&nbsp; Şifre: <code>1</code><br />
            <span style="font-size:0.72rem; color:#64748b;">(Giriş yaptıktan sonra sol menüden kullanıcı adı ve şifrenizi değiştirebilirsiniz)</span>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('admin-login-form');
    const errBox = document.getElementById('login-error');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('login-username').value;
        const p = document.getElementById('login-password').value;

        if (window.ITStore.verifyLogin(u, p)) {
          renderApp();
        } else {
          errBox.classList.add('show');
          document.getElementById('login-password').value = '';
          document.getElementById('login-password').focus();
        }
      });
    }
  }

  // =========================================================================
  // 2. ANALİTİK PANELİ (SQLITE3 MOTORU İLE GERÇEK ZAMANLI SORGULAR)
  // =========================================================================
  function renderAnalyticsSection() {
    const agg = window.ITStore.getAnalytics(analyticsFilterProfile);
    const maxTrainingClicks = Math.max(1, ...agg.trainingsList.map((t) => t.clicks));
    const maxSourceVisits = Math.max(1, ...Object.values(agg.sources).map((s) => s.visits));

    const totalDev = agg.devices.mobile + agg.devices.desktop;
    const mobilePct = totalDev > 0 ? Math.round((agg.devices.mobile / totalDev) * 100) : 0;
    const desktopPct = totalDev > 0 ? 100 - mobilePct : 0;

    return `
      <!-- SQLite3 Motor Bilgilendirmesi -->
      <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem;">
        <div class="sqlite-engine-badge">
          💾 Veri Motoru: SQLite3 (ShenApp Standardı · Gerçek Zamanlı DB)
        </div>

        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <button type="button" class="btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.85rem;" data-analytics-filter="ALL">
            Tüm Sayfalar (${analyticsFilterProfile === 'ALL' ? '✓' : ''})
          </button>
          <button type="button" class="btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.85rem;" data-analytics-filter="rabia-alga">
            rabia-alga.php (${analyticsFilterProfile === 'rabia-alga' ? '✓' : ''})
          </button>
          <button type="button" class="btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.85rem;" data-analytics-filter="bedia-kahya-kilic">
            bedia-kahya-kilic.php (${analyticsFilterProfile === 'bedia-kahya-kilic' ? '✓' : ''})
          </button>
          <button type="button" class="btn-danger-outline" id="btn-reset-analytics">
            🔄 Test Sayaçlarını Sıfırla
          </button>
        </div>
      </div>

      <!-- 3 Ana KPI Kartı (Sıfırdan Başlayan Gerçek Veriler) -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">
            <span>Toplam Sayfa Girişi</span>
            <span>👁️</span>
          </div>
          <div class="kpi-value">${agg.totalVisits.toLocaleString('tr-TR')}</div>
          <div class="kpi-sub">
            <span>Gerçek ziyaretçi giriş sayısı</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">
            <span>Eğitim Tıklamaları</span>
            <span>🎓</span>
          </div>
          <div class="kpi-value">${agg.totalClicks.toLocaleString('tr-TR')}</div>
          <div class="kpi-sub">
            <span>Seminer butonlarına tıklanma</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">
            <span>Tıklama Oranı (CTR)</span>
            <span>📈</span>
          </div>
          <div class="kpi-value">%${agg.ctr}</div>
          <div class="kpi-sub">
            <span>Eğitim inceleme dönüşümü</span>
          </div>
        </div>
      </div>

      <!-- İki Kolonlu Detaylı SQLite3 Raporu -->
      <div class="analytics-grid-2">
        <!-- SOL: Hangi Eğitime Kaç Kişi Tıkladı? -->
        <div class="admin-card" style="margin-bottom:0;">
          <div class="admin-card-header">
            <div>
              <h3 class="admin-card-title">🎓 Hangi Eğitime Kaç Kişi Tıkladı?</h3>
              <p class="admin-card-subtitle">
                Eğitim butonlarının aldığı tıklama sayıları ve nereden gelindiği (Instagram, WhatsApp vb.)
              </p>
            </div>
          </div>

          ${
            agg.trainingsList.length === 0
              ? `<div style="text-align:center; padding:2rem; color:#64748b;">Henüz kayıtlı bir eğitim tıklaması bulunmuyor.</div>`
              : `
            <div class="training-stat-list">
              ${agg.trainingsList
                .map((t) => {
                  const widthPct = t.clicks > 0 ? Math.max(8, Math.round((t.clicks / maxTrainingClicks) * 100)) : 0;
                  const igCount = t.bySource?.instagram || 0;
                  const wpCount = t.bySource?.whatsapp || 0;
                  const ytCount = t.bySource?.youtube || 0;
                  const ggCount = t.bySource?.google || 0;
                  const drCount = t.bySource?.direct || 0;

                  return `
                  <div class="training-stat-item">
                    <div class="training-stat-top">
                      <div>
                        <div class="training-stat-name">${escapeHtml(t.title)}</div>
                        <div style="font-size:0.76rem; color:#64748b; margin-top:0.15rem;">
                          Sayfa: <code>${escapeHtml(t.profileSlug)}</code> (${escapeHtml(t.profileName)})
                        </div>
                      </div>
                      <div class="training-stat-count">
                        ${t.clicks} Tıklama
                      </div>
                    </div>

                    <div class="stat-bar-track">
                      <div class="stat-bar-fill" style="width:${widthPct}%;"></div>
                    </div>

                    <div class="source-mini-pills">
                      <span class="source-mini-pill">📸 Instagram: <strong>${igCount}</strong></span>
                      <span class="source-mini-pill">💬 WhatsApp: <strong>${wpCount}</strong></span>
                      <span class="source-mini-pill">▶️ YouTube: <strong>${ytCount}</strong></span>
                      <span class="source-mini-pill">🔍 Google: <strong>${ggCount}</strong></span>
                      <span class="source-mini-pill">🔗 Direkt: <strong>${drCount}</strong></span>
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
          `
          }
        </div>

        <!-- SAĞ: Ziyaretçiler Nereden Geldi? (Kaynak Dağılımı) -->
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          <div class="admin-card" style="margin-bottom:0;">
            <div class="admin-card-header">
              <div>
                <h3 class="admin-card-title">🧭 Ziyaretçiler Nereden Geldi?</h3>
                <p class="admin-card-subtitle">
                  Gelen ziyaretçilerin kaynak analizi (Instagram, WhatsApp, YouTube vb.)
                </p>
              </div>
            </div>

            <div class="source-list">
              ${Object.entries(window.ITStore.SOURCE_META)
                .map(([key, meta]) => {
                  const sData = agg.sources[key] || { visits: 0, clicks: 0 };
                  const sharePct = agg.totalVisits > 0 ? Math.round((sData.visits / agg.totalVisits) * 100) : 0;
                  const barPct = sData.visits > 0 ? Math.max(5, Math.round((sData.visits / maxSourceVisits) * 100)) : 0;

                  return `
                  <div class="source-row">
                    <div class="source-badge-dot">
                      <span class="dot-indicator" style="background:${meta.color};"></span>
                      <span>${escapeHtml(meta.label)}</span>
                    </div>

                    <div>
                      <div class="stat-bar-track" style="margin-bottom:0; height:8px;">
                        <div class="stat-bar-fill" style="width:${barPct}%; background:${meta.color};"></div>
                      </div>
                    </div>

                    <div style="text-align:right; font-family:monospace; font-size:0.8rem;">
                      <strong>${sData.visits}</strong> kişi (%${sharePct})
                    </div>

                    <div style="text-align:right; font-family:monospace; font-size:0.78rem; color:#02a3c4; font-weight:700;">
                      ${sData.clicks} tık
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>

          <!-- Cihaz Dağılımı -->
          <div class="admin-card" style="margin-bottom:0;">
            <div class="admin-card-header" style="margin-bottom:0.9rem;">
              <div>
                <h3 class="admin-card-title">📱 Mobil vs PC Giriş Oranı</h3>
                <p class="admin-card-subtitle">
                  Mobilden (${agg.devices.mobile}) ve bilgisayardan (${agg.devices.desktop}) girenler
                </p>
              </div>
            </div>

            <div style="display:flex; height:14px; border-radius:999px; overflow:hidden; margin-bottom:0.65rem; background:#e2ded5;">
              <div style="width:${mobilePct}%; background:#02a3c4;" title="Mobil %${mobilePct}"></div>
              <div style="width:${desktopPct}%; background:#142225;" title="PC %${desktopPct}"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:600; color:#475569;">
              <span>📱 Mobil: %${mobilePct} (${agg.devices.mobile} kişi)</span>
              <span>💻 Bilgisayar (PC): %${desktopPct} (${agg.devices.desktop} kişi)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- SQLite3 Hareket Akışı -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h3 class="admin-card-title">⚡ Canlı Hareket Akışı (SQLite3 Log)</h3>
            <p class="admin-card-subtitle">
              Sitede gerçekleşen gerçek ziyaret ve eğitim tıklama hareketleri
            </p>
          </div>
        </div>

        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Sayfa (.php)</th>
                <th>İşlem / Eğitim Başlığı</th>
                <th>Kaynak</th>
                <th>Cihaz</th>
              </tr>
            </thead>
            <tbody>
              ${
                agg.recentEvents.length === 0
                  ? `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:#64748b;">Henüz kayıt bulunmuyor. Sayfayı ziyaret edip bir eğitime tıkladığınızda anında burada görünecektir.</td></tr>`
                  : agg.recentEvents
                      .map((ev) => {
                        const srcMeta = window.ITStore.SOURCE_META[ev.source] || window.ITStore.SOURCE_META.direct;
                        const isTraining = ev.type === 'training_click';
                        return `
                        <tr>
                          <td style="font-family:monospace; font-size:0.78rem;">${escapeHtml(formatTimeAgo(ev.timestamp))}</td>
                          <td><code>${escapeHtml(ev.profileSlug)}</code></td>
                          <td>
                            <strong style="color:${isTraining ? '#02a3c4' : '#1e293b'};">
                              ${isTraining ? '🎓 ' : '👁️ '}${escapeHtml(ev.label)}
                            </strong>
                          </td>
                          <td>
                            <span style="display:inline-flex; align-items:center; gap:0.35rem; padding:0.2rem 0.6rem; border-radius:999px; font-size:0.75rem; font-weight:700; background:${srcMeta.bg}; color:${srcMeta.color};">
                              ● ${escapeHtml(srcMeta.label)}
                            </span>
                          </td>
                          <td>
                            ${ev.device === 'mobile' ? '📱 Mobil' : '💻 PC'}
                          </td>
                        </tr>
                      `;
                      })
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 3. YAPILANDIRILMIŞ SEMİNER TAKVİMİ & MODERN BUTONLAR DÜZENLEYİCİSİ
  // (Eğitim Adı - Tarih - Başlık - Yer - Dipnot)
  // =========================================================================
  function renderTrainingsEditor(profile) {
    const trainings = profile.trainings || [];

    return `
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">
              🎓 ${escapeHtml(profile.name)} (<code>${escapeHtml(profile.phpSlug)}</code>) — Güncel Seminer Takvimi & Butonlar
            </h2>
            <p class="admin-card-subtitle">
              Eğitim adı, tarih, yer, dipnot ve modern buton rozetlerini düzenleyin. Kaydettiğinizde doğrudan <strong>${escapeHtml(profile.phpSlug)}</strong> sayfasına yansır.
            </p>
          </div>
          <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
            <button type="button" class="btn-secondary" id="btn-add-training">
              ➕ Yeni Seminer Programı Ekle
            </button>
            <button type="button" class="btn-primary" id="btn-save-trainings">
              💾 Değişiklikleri Kaydet & Yayınla
            </button>
          </div>
        </div>

        <div id="trainings-cms-list">
          ${trainings
            .map(
              (t, idx) => `
            <div class="cms-item-card" data-training-index="${idx}">
              <div class="cms-item-header">
                <div style="display:flex; align-items:center; gap:0.65rem;">
                  <span class="cms-item-num">Seminer #${idx + 1}</span>
                  <strong style="font-size:1rem; color:#0f172a;">${escapeHtml(t.title)}</strong>
                </div>
                <div style="display:flex; align-items:center; gap:0.75rem;">
                  <label style="display:inline-flex; align-items:center; gap:0.35rem; font-size:0.8rem; font-weight:600; cursor:pointer;">
                    <input type="checkbox" class="trn-active" ${t.active !== false ? 'checked' : ''} />
                    <span>Sayfada Göster</span>
                  </label>
                  <button type="button" class="btn-danger-outline" data-delete-training="${idx}">
                    🗑️ Sil
                  </button>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Eğitim Adı / Başlık</label>
                  <input type="text" class="form-input trn-title" value="${escapeHtml(t.title)}" placeholder="Örn: Basic DNA - Temel Seviye Semineri" />
                </div>
                <div class="form-group">
                  <label class="form-label">Kategori / Alan (Rozet)</label>
                  <input type="text" class="form-input trn-category" value="${escapeHtml(t.category || 'ThetaHealing®')}" placeholder="ThetaHealing® / Silva Metodu vb." />
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Tarih & Saat</label>
                  <input type="text" class="form-input trn-date" value="${escapeHtml(t.date || '')}" placeholder="Örn: 6-7-8 Kasım 2026 / 09.30-17.30" />
                </div>
                <div class="form-group">
                  <label class="form-label">Yer / Konum</label>
                  <input type="text" class="form-input trn-location" value="${escapeHtml(t.location || '')}" placeholder="Örn: Nida Kule - İstanbul veya Online - Zoom" />
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Dipnot / Durum Açıklaması</label>
                  <input type="text" class="form-input trn-note" value="${escapeHtml(t.note || '(Kayıtlarımız devam etmektedir.)')}" placeholder="Örn: (Kayıtlarımız devam etmektedir.)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Katılım Formatı</label>
                  <select class="form-select trn-mode">
                    <option value="Yüz Yüze" ${t.mode === 'Yüz Yüze' ? 'selected' : ''}>Yüz Yüze</option>
                    <option value="Online" ${t.mode === 'Online' ? 'selected' : ''}>Online (Zoom vb.)</option>
                  </select>
                </div>
              </div>

              <div class="form-grid-2" style="background:#ffffff; padding:0.85rem; border:1px solid #e2ded5; border-radius:12px; margin-bottom:1rem;">
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label">Buton Üzerindeki Metin (CTA)</label>
                  <input type="text" class="form-input trn-cta" value="${escapeHtml(t.ctaText || 'Seminere Katıl & İncele')}" placeholder="Seminere Katıl & İncele" />
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label">Buton Sağ Rozet Metni</label>
                  <input type="text" class="form-input trn-pill" value="${escapeHtml(t.pillBadge || '')}" placeholder="Örn: İstanbul · 6-8 Kasım" />
                </div>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Kayıt / Satın Alma Başvuru Linki (URL)</label>
                <input type="url" class="form-input trn-url" value="${escapeHtml(t.url)}" placeholder="https://www.rabiaalga.com/urun/..." />
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 4. PROFİL & BİYOGRAFİ (DOSYA YÜKLEME DESTEKLİ)
  // =========================================================================
  function renderProfileEditor(profile) {
    return `
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">
              👤 ${escapeHtml(profile.name)} (<code>${escapeHtml(profile.phpSlug)}</code>) — Profil & Biyografi
            </h2>
            <p class="admin-card-subtitle">
              Profil fotoğrafı ve üst kapak görselini doğrudan bilgisayarınızdan yükleyebilir veya URL olarak belirleyebilirsiniz.
            </p>
          </div>
          <button type="button" class="btn-primary" id="btn-save-profile">
            💾 Profil Bilgilerini Kaydet
          </button>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Ad Soyad</label>
            <input type="text" class="form-input" id="prof-name" value="${escapeHtml(profile.name)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Unvan / Rol</label>
            <input type="text" class="form-input" id="prof-role" value="${escapeHtml(profile.role || '')}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Alt Uzmanlık Rozetleri / Açıklama</label>
          <input type="text" class="form-input" id="prof-credentials" value="${escapeHtml(profile.credentials || '')}" />
        </div>

        <!-- 1) Profil Fotoğrafı Yükleme & URL -->
        <div class="form-group" style="margin-bottom:1.5rem;">
          <label class="form-label">Profil Fotoğrafı (Bilgisayardan Yükle veya URL)</label>
          <div class="image-upload-wrapper">
            <img src="${escapeHtml(profile.avatar)}" id="avatar-preview-img" class="image-preview-thumb" alt="Avatar Önizleme" />
            <div class="image-upload-controls">
              <label class="file-upload-btn-label">
                📁 Bilgisayardan Fotoğraf Seç & Yükle
                <input type="file" id="avatar-file-input" accept="image/*" style="display:none;" />
              </label>
              <input type="text" class="form-input" id="prof-avatar-url" value="${escapeHtml(profile.avatar)}" placeholder="veya görsel yolu / URL'si" />
            </div>
          </div>
        </div>

        <!-- 2) Üst Kapak Görseli Yükleme & URL -->
        <div class="form-group" style="margin-bottom:1.5rem;">
          <label class="form-label">Üst Kapak Görseli (Bilgisayardan Yükle veya URL)</label>
          <div class="image-upload-wrapper">
            <div style="width:110px; height:68px; border-radius:12px; overflow:hidden; border:2px solid #fff; box-shadow:0 4px 10px rgba(0,0,0,0.1); flex-shrink:0;">
              <img src="${escapeHtml(profile.bgImage || 'assets/images/back.jpg')}" id="bg-preview-img" style="width:100%; height:100%; object-fit:cover;" alt="Kapak Önizleme" />
            </div>
            <div class="image-upload-controls">
              <label class="file-upload-btn-label">
                📁 Bilgisayardan Kapak Görseli Seç & Yükle
                <input type="file" id="bg-file-input" accept="image/*" style="display:none;" />
              </label>
              <input type="text" class="form-input" id="prof-bg-url" value="${escapeHtml(profile.bgImage || 'assets/images/back.jpg')}" placeholder="veya görsel yolu / URL'si" />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Hakkımda Karşılama Başlığı</label>
          <input type="text" class="form-input" id="prof-greeting" value="${escapeHtml(profile.greeting)}" />
        </div>

        <div class="form-group">
          <label class="form-label">Biyografi / Hakkımda Metni</label>
          <textarea class="form-textarea" id="prof-bio">${escapeHtml(profile.bio)}</textarea>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">"Daha Fazlası İçin..." Buton Metni</label>
            <input type="text" class="form-input" id="prof-more-label" value="${escapeHtml(profile.moreLabel || 'Daha Fazlası İçin...')}" />
          </div>
          <div class="form-group">
            <label class="form-label">"Daha Fazlası İçin..." Hedef Link (URL)</label>
            <input type="url" class="form-input" id="prof-more-url" value="${escapeHtml(profile.moreUrl || '')}" />
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 5. SOSYAL MEDYA & VİDEO DÜZENLEME
  // =========================================================================
  function renderMediaEditor(profile) {
    const socials = profile.socials || [];
    const videos = profile.videos || [];

    return `
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">
              🔗 ${escapeHtml(profile.name)} (<code>${escapeHtml(profile.phpSlug)}</code>) — Sosyal Medya Bağlantıları
            </h2>
            <p class="admin-card-subtitle">
              Profil kartının altındaki yuvarlak butonların bağlantılarını güncelleyin.
            </p>
          </div>
          <button type="button" class="btn-primary" id="btn-save-media">
            💾 Bağlantıları Kaydet
          </button>
        </div>

        ${socials
          .map(
            (s, idx) => `
          <div class="cms-item-card" data-social-index="${idx}" style="padding:1rem;">
            <div style="display:grid; grid-template-columns:130px 1fr 1.5fr 100px; gap:0.75rem; align-items:center;">
              <div>
                <span class="cms-item-num" style="text-transform:uppercase;">${escapeHtml(s.platform)}</span>
              </div>
              <div>
                <input type="text" class="form-input soc-label" value="${escapeHtml(s.label)}" />
              </div>
              <div>
                <input type="text" class="form-input soc-url" value="${escapeHtml(s.url)}" />
              </div>
              <div style="text-align:right;">
                <label style="display:inline-flex; align-items:center; gap:0.35rem; font-size:0.8rem; font-weight:600; cursor:pointer;">
                  <input type="checkbox" class="soc-active" ${s.active !== false ? 'checked' : ''} />
                  <span>Aktif</span>
                </label>
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">▶ YouTube Videoları</h2>
            <p class="admin-card-subtitle">
              Sayfada gösterilen gömülü (embed) YouTube videoları
            </p>
          </div>
          <button type="button" class="btn-secondary" id="btn-add-video">
            ➕ Yeni Video Ekle
          </button>
        </div>

        ${videos
          .map(
            (v, idx) => `
          <div class="cms-item-card" data-video-index="${idx}">
            <div class="cms-item-header">
              <span class="cms-item-num">Video #${idx + 1}</span>
              <button type="button" class="btn-danger-outline" data-delete-video="${idx}">🗑️ Videoyu Sil</button>
            </div>
            <div class="form-group">
              <label class="form-label">Video Başlığı</label>
              <input type="text" class="form-input vid-title" value="${escapeHtml(v.title)}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">YouTube Linki veya Embed URL</label>
              <input type="text" class="form-input vid-url" value="${escapeHtml(v.embedUrl)}" />
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  // =========================================================================
  // 6. GÜVENLİK & ŞİFRE DEĞİŞTİRME (PANEL DEĞİŞTİRME ÖZELLİĞİ)
  // =========================================================================
  function renderSecurityEditor() {
    const auth = window.ITStore.getAuth();

    return `
      <div class="admin-card" style="max-width:680px;">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">🔐 Panel Giriş Bilgilerini Değiştir</h2>
            <p class="admin-card-subtitle">
              Admin paneline giriş için kullanılan kullanıcı adı ve şifreyi güncelleyin.
            </p>
          </div>
        </div>

        <form id="auth-change-form" style="display:flex; flex-direction:column; gap:1.15rem;">
          <div id="auth-change-msg" class="login-error-box"></div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Mevcut Kullanıcı Adı</label>
            <input type="text" class="form-input" value="${escapeHtml(auth.username)}" disabled style="background:#f1f5f9; cursor:not-allowed;" />
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="new-auth-username">Yeni Kullanıcı Adı</label>
            <input type="text" class="form-input" id="new-auth-username" value="${escapeHtml(auth.username)}" required />
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="current-auth-pass">Mevcut Şifre</label>
            <input type="password" class="form-input" id="current-auth-pass" placeholder="Doğrulama için mevcut şifrenizi girin" required />
          </div>

          <div class="form-grid-2" style="margin-bottom:0;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="new-auth-pass">Yeni Şifre</label>
              <input type="password" class="form-input" id="new-auth-pass" placeholder="Yeni şifrenizi belirleyin" required />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="new-auth-pass-confirm">Yeni Şifre (Tekrar)</label>
              <input type="password" class="form-input" id="new-auth-pass-confirm" placeholder="Yeni şifreyi tekrar yazın" required />
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; margin-top:0.5rem;">
            <button type="submit" class="btn-primary" style="padding:0.75rem 1.5rem;">
              💾 Giriş Bilgilerini Güncelle
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // =========================================================================
  // 7. ANA DASHBOARD SHELL
  // =========================================================================
  function renderDashboard() {
    const profile = window.ITStore.getProfile(selectedProfileId);
    const root = document.getElementById('admin-root');
    if (!root) return;

    let sectionHtml = '';
    if (activeSection === 'analytics') {
      sectionHtml = renderAnalyticsSection();
    } else if (activeSection === 'trainings') {
      sectionHtml = renderTrainingsEditor(profile);
    } else if (activeSection === 'profile') {
      sectionHtml = renderProfileEditor(profile);
    } else if (activeSection === 'media') {
      sectionHtml = renderMediaEditor(profile);
    } else if (activeSection === 'security') {
      sectionHtml = renderSecurityEditor();
    }

    root.innerHTML = `
      <div class="admin-shell">
        <!-- SOL MENÜ -->
        <aside class="admin-sidebar">
          <div>
            <div class="admin-brand">
              <div class="admin-brand-mark">İT</div>
              <div class="admin-brand-text">
                <h1>İçimizdeki Tamirci</h1>
                <span>Yönetim Paneli</span>
              </div>
            </div>

            <div class="admin-nav-group-label">Raporlama</div>
            <nav class="admin-nav">
              <button type="button" class="admin-nav-btn ${activeSection === 'analytics' ? 'active' : ''}" data-nav="analytics">
                <span>📊 Analiz & İstatistikler</span>
                <span class="admin-nav-badge">SQLite3</span>
              </button>
            </nav>

            <div class="admin-nav-group-label">Sayfa Yönetimi (${escapeHtml(profile.phpSlug)})</div>
            <nav class="admin-nav">
              <button type="button" class="admin-nav-btn ${activeSection === 'trainings' ? 'active' : ''}" data-nav="trainings">
                <span>🎓 Seminerler & Butonlar</span>
                <span class="admin-nav-badge">${(profile.trainings || []).length}</span>
              </button>
              <button type="button" class="admin-nav-btn ${activeSection === 'profile' ? 'active' : ''}" data-nav="profile">
                <span>👤 Profil & Biyografi</span>
              </button>
              <button type="button" class="admin-nav-btn ${activeSection === 'media' ? 'active' : ''}" data-nav="media">
                <span>🔗 Sosyal Medya & Videolar</span>
              </button>
            </nav>

            <div class="admin-nav-group-label">Panel Ayarları</div>
            <nav class="admin-nav">
              <button type="button" class="admin-nav-btn ${activeSection === 'security' ? 'active' : ''}" data-nav="security">
                <span>🔐 Şifre Değiştir (Giriş)</span>
              </button>
            </nav>
          </div>

          <div class="admin-sidebar-footer">
            <div style="font-size:0.72rem; color:#8FA6AA; padding:0 0.25rem;">Sayfayı Aç:</div>
            <a href="${escapeHtml(profile.htmlSlug)}" target="_blank" class="admin-live-link">
              <span>🟢 ${escapeHtml(profile.phpSlug)}</span>
              <span>↗</span>
            </a>
            <button type="button" id="btn-logout" class="admin-logout-btn">
              🚪 Çıkış Yap
            </button>
          </div>
        </aside>

        <!-- SAĞ İÇERİK -->
        <div class="admin-main">
          <!-- Üst Bar: rabia-alga.php vs bedia-kahya-kilic.php Seçimi -->
          <header class="admin-header">
            <div class="admin-file-selector-wrap">
              <span class="admin-selector-label">Düzenlenen Sayfa:</span>
              <div class="admin-file-tabs">
                <button
                  type="button"
                  class="admin-file-tab ${selectedProfileId === 'rabia-alga' ? 'active' : ''}"
                  data-select-profile="rabia-alga"
                >
                  <img src="assets/images/RabiaAlga.jpg" alt="Rabia Alga" />
                  <span>Rabia Alga</span>
                  <code>rabia-alga.php</code>
                </button>
                <button
                  type="button"
                  class="admin-file-tab ${selectedProfileId === 'bedia-kahya-kilic' ? 'active' : ''}"
                  data-select-profile="bedia-kahya-kilic"
                >
                  <img src="assets/images/BediaKahyaKilic.jpg" alt="Bedia Kahya Kılıç" />
                  <span>Bedia Kahya Kılıç</span>
                  <code>bedia-kahya-kilic.php</code>
                </button>
              </div>
            </div>

            <div class="admin-header-actions">
              <a href="${escapeHtml(profile.htmlSlug)}" target="_blank" class="btn-secondary">
                👁️ ${escapeHtml(profile.phpSlug)} Sayfasını Aç ↗
              </a>
            </div>
          </header>

          <main class="admin-content">
            ${sectionHtml}
          </main>
        </div>
      </div>
    `;

    bindDashboardEvents(profile);
  }

  function collectTrainingsFromDOM(profile) {
    const cards = document.querySelectorAll('[data-training-index]');
    const updated = [];
    cards.forEach((card, idx) => {
      const existing = (profile.trainings || [])[idx] || {};
      updated.push({
        id: existing.id || `trn-${profile.id}-${Date.now()}-${idx}`,
        title: card.querySelector('.trn-title')?.value.trim() || 'Yeni Seminer Programı',
        category: card.querySelector('.trn-category')?.value.trim() || 'ThetaHealing®',
        date: card.querySelector('.trn-date')?.value.trim() || '',
        location: card.querySelector('.trn-location')?.value.trim() || '',
        note: card.querySelector('.trn-note')?.value.trim() || '(Kayıtlarımız devam etmektedir.)',
        mode: card.querySelector('.trn-mode')?.value || 'Yüz Yüze',
        ctaText: card.querySelector('.trn-cta')?.value.trim() || 'Seminere Katıl & İncele',
        pillBadge: card.querySelector('.trn-pill')?.value.trim() || '',
        url: card.querySelector('.trn-url')?.value.trim() || '#',
        active: card.querySelector('.trn-active')?.checked ?? true
      });
    });
    return updated;
  }

  function bindDashboardEvents(profile) {
    // Çıkış Yap
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        window.ITStore.logoutAdmin();
        renderApp();
      });
    }

    // Menü Sekmesi Değişimi
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSection = btn.getAttribute('data-nav');
        renderDashboard();
      });
    });

    // Sayfa Seçici (rabia-alga.php vs bedia-kahya-kilic.php)
    document.querySelectorAll('[data-select-profile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedProfileId = btn.getAttribute('data-select-profile');
        if (analyticsFilterProfile !== 'ALL') {
          analyticsFilterProfile = selectedProfileId;
        }
        renderDashboard();
        const p = window.ITStore.getProfile(selectedProfileId);
        showToast(`${p.phpSlug} (${p.name}) seçildi.`);
      });
    });

    // Analitik Filtre Butonları
    document.querySelectorAll('[data-analytics-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        analyticsFilterProfile = btn.getAttribute('data-analytics-filter');
        renderDashboard();
      });
    });

    // Analitik Sayaç Sıfırlama
    const btnResetAnalytics = document.getElementById('btn-reset-analytics');
    if (btnResetAnalytics) {
      btnResetAnalytics.addEventListener('click', () => {
        if (confirm('Tüm SQLite3 ziyaret ve tıklama logları sıfırlanacak. Onaylıyor musunuz?')) {
          window.ITStore.resetAnalytics();
          renderDashboard();
          showToast('Analitik sayaçları sıfırlandı.');
        }
      });
    }

    // Seminerleri Kaydetme
    const btnSaveTrainings = document.getElementById('btn-save-trainings');
    if (btnSaveTrainings) {
      btnSaveTrainings.addEventListener('click', () => {
        profile.trainings = collectTrainingsFromDOM(profile);
        window.ITStore.updateProfile(selectedProfileId, profile);
        renderDashboard();
        showToast(`${profile.phpSlug} seminer takvimi ve butonları güncellendi!`);
      });
    }

    // Yeni Seminer Ekleme
    const btnAddTraining = document.getElementById('btn-add-training');
    if (btnAddTraining) {
      btnAddTraining.addEventListener('click', () => {
        profile.trainings = collectTrainingsFromDOM(profile);
        profile.trainings.push({
          id: 'trn-' + Date.now(),
          title: 'Yeni Seminer Programı',
          category: 'ThetaHealing®',
          date: '15-16 Mayıs 2027 / 09.30-17.30',
          location: 'Nida Kule - İstanbul',
          note: '(Kayıtlarımız devam etmektedir.)',
          mode: 'Yüz Yüze',
          ctaText: 'Seminere Katıl & İncele',
          pillBadge: 'İstanbul · 15-16 Mayıs',
          url: 'https://www.rabiaalga.com/',
          active: true
        });
        window.ITStore.updateProfile(selectedProfileId, profile);
        renderDashboard();
        showToast('Yeni seminer eklendi! Bilgileri düzenleyip kaydedebilirsiniz.');
      });
    }

    // Seminer Silme
    document.querySelectorAll('[data-delete-training]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-delete-training'), 10);
        profile.trainings = collectTrainingsFromDOM(profile);
        profile.trainings.splice(idx, 1);
        window.ITStore.updateProfile(selectedProfileId, profile);
        renderDashboard();
        showToast('Seminer silindi.');
      });
    });

    // DOSYA YÜKLEME 1: Avatar Fotoğrafı
    const avatarFileInput = document.getElementById('avatar-file-input');
    const avatarUrlInput = document.getElementById('prof-avatar-url');
    const avatarPreviewImg = document.getElementById('avatar-preview-img');
    if (avatarFileInput) {
      avatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            const dataUrl = uploadEvent.target.result;
            avatarUrlInput.value = dataUrl;
            avatarPreviewImg.src = dataUrl;
            showToast('Fotoğraf seçildi ve önizleme güncellendi.');
          };
          reader.readAsDataURL(file);
        }
      });
    }
    if (avatarUrlInput) {
      avatarUrlInput.addEventListener('input', () => {
        avatarPreviewImg.src = avatarUrlInput.value;
      });
    }

    // DOSYA YÜKLEME 2: Üst Kapak Görseli
    const bgFileInput = document.getElementById('bg-file-input');
    const bgUrlInput = document.getElementById('prof-bg-url');
    const bgPreviewImg = document.getElementById('bg-preview-img');
    if (bgFileInput) {
      bgFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            const dataUrl = uploadEvent.target.result;
            bgUrlInput.value = dataUrl;
            bgPreviewImg.src = dataUrl;
            showToast('Kapak görseli seçildi ve önizleme güncellendi.');
          };
          reader.readAsDataURL(file);
        }
      });
    }
    if (bgUrlInput) {
      bgUrlInput.addEventListener('input', () => {
        bgPreviewImg.src = bgUrlInput.value;
      });
    }

    // Profil Bilgilerini Kaydetme
    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
      btnSaveProfile.addEventListener('click', () => {
        profile.name = document.getElementById('prof-name')?.value.trim() || profile.name;
        profile.role = document.getElementById('prof-role')?.value.trim() || profile.role;
        profile.credentials = document.getElementById('prof-credentials')?.value.trim() || '';
        profile.avatar = document.getElementById('prof-avatar-url')?.value.trim() || profile.avatar;
        profile.bgImage = document.getElementById('prof-bg-url')?.value.trim() || profile.bgImage;
        profile.greeting = document.getElementById('prof-greeting')?.value.trim() || profile.greeting;
        profile.bio = document.getElementById('prof-bio')?.value.trim() || profile.bio;
        profile.moreLabel = document.getElementById('prof-more-label')?.value.trim() || 'Daha Fazlası İçin...';
        profile.moreUrl = document.getElementById('prof-more-url')?.value.trim() || profile.moreUrl;

        window.ITStore.updateProfile(selectedProfileId, profile);
        renderDashboard();
        showToast(`${profile.phpSlug} profil bilgileri ve fotoğrafları güncellendi!`);
      });
    }

    // Sosyal Medya ve Videoları Kaydetme
    const btnSaveMedia = document.getElementById('btn-save-media');
    if (btnSaveMedia) {
      btnSaveMedia.addEventListener('click', () => {
        document.querySelectorAll('[data-social-index]').forEach((row, idx) => {
          if (profile.socials[idx]) {
            profile.socials[idx].label = row.querySelector('.soc-label')?.value.trim() || profile.socials[idx].label;
            profile.socials[idx].url = row.querySelector('.soc-url')?.value.trim() || profile.socials[idx].url;
            profile.socials[idx].active = row.querySelector('.soc-active')?.checked ?? true;
          }
        });

        const updatedVideos = [];
        document.querySelectorAll('[data-video-index]').forEach((card, idx) => {
          const existing = (profile.videos || [])[idx] || {};
          updatedVideos.push({
            id: existing.id || `vid-${Date.now()}-${idx}`,
            title: card.querySelector('.vid-title')?.value.trim() || 'Video Başlığı',
            embedUrl: normalizeYoutubeEmbed(card.querySelector('.vid-url')?.value),
            active: true
          });
        });
        profile.videos = updatedVideos;

        window.ITStore.updateProfile(selectedProfileId, profile);
        renderDashboard();
        showToast(`${profile.phpSlug} sosyal bağlantıları ve videoları kaydedildi!`);
      });
    }

    // Yeni Video Ekle
    const btnAddVideo = document.getElementById('btn-add-video');
    if (btnAddVideo) {
      btnAddVideo.addEventListener('click', () => {
        profile.videos = profile.videos || [];
        profile.videos.push({
          id: 'vid-' + Date.now(),
          title: 'Yeni YouTube Videosu',
          embedUrl: 'https://www.youtube.com/embed/BgTwMiPETuY',
          active: true
        });
        window.ITStore.updateProfile(selectedProfileId, profile);
        renderDashboard();
        showToast('Yeni video alanı eklendi.');
      });
    }

    // Video Sil
    document.querySelectorAll('[data-delete-video]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-delete-video'), 10);
        profile.videos.splice(idx, 1);
        window.ITStore.updateProfile(selectedProfileId, profile);
        renderDashboard();
        showToast('Video silindi.');
      });
    });

    // Panel Şifresi / Kullanıcı Adı Değiştirme Formu (Panel Değiştirme Özelliği)
    const authForm = document.getElementById('auth-change-form');
    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentAuth = window.ITStore.getAuth();
        const newU = document.getElementById('new-auth-username').value.trim();
        const curP = document.getElementById('current-auth-pass').value.trim();
        const newP = document.getElementById('new-auth-pass').value.trim();
        const newPConf = document.getElementById('new-auth-pass-confirm').value.trim();
        const msgBox = document.getElementById('auth-change-msg');

        if (curP !== String(currentAuth.password)) {
          msgBox.textContent = 'Mevcut şifreniz hatalı!';
          msgBox.classList.add('show');
          return;
        }

        if (!newU) {
          msgBox.textContent = 'Kullanıcı adı boş bırakılamaz!';
          msgBox.classList.add('show');
          return;
        }

        if (!newP) {
          msgBox.textContent = 'Yeni şifre boş bırakılamaz!';
          msgBox.classList.add('show');
          return;
        }

        if (newP !== newPConf) {
          msgBox.textContent = 'Yeni şifre ve tekrarı uyuşmuyor!';
          msgBox.classList.add('show');
          return;
        }

        window.ITStore.saveAuth({ username: newU, password: newP });
        showToast('Panel giriş bilgileriniz (kullanıcı adı ve şifre) başarıyla güncellendi!');
        renderDashboard();
      });
    }
  }

  function renderApp() {
    if (!window.ITStore.isAdminLoggedIn()) {
      renderLoginScreen();
    } else {
      renderDashboard();
    }
  }

  // Başlat
  renderApp();

  // Senkronizasyon dinleyicisi
  window.ITStore.onSync(() => {
    if (window.ITStore.isAdminLoggedIn() && activeSection === 'analytics') {
      renderDashboard();
    }
  });
})();
