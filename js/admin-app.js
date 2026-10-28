/**
 * İçimizdeki Tamirci — SQLite3 Yönetim Paneli Uygulaması (admin-app.js)
 * ShenApp mimarisi referanslı SQLite3 Veri Motoru
 * Varsayılan Giriş: 1 / 1
 * Yeni Eğitmen Ekleme, Seminer Kopyalama, Renk Teması Özelleştirme ve Anında Senkronizasyon
 */

(function () {
  const urlParams = new URLSearchParams(window.location.search);
  let selectedProfileId = urlParams.get('profile') || 'rabia-alga';

  let activeSection = urlParams.get('tab') || 'analytics'; // analytics | trainings | profile | media | theme | security
  let analyticsFilterProfile = 'ALL'; // ALL | profileId

  const THEME_PRESETS = [
    {
      id: 'teal',
      title: 'Okyanus Turkuazı',
      desc: 'İçimizdeki Tamirci orijinal turkuaz ve koyu arduvaz teması',
      primary: '#02a3c4',
      primaryDark: '#017c95',
      sidebarBg: '#142225'
    },
    {
      id: 'emerald',
      title: 'Zümrüt Yeşili',
      desc: 'Huzur veren koyu orman yeşili ve canlı zümrüt tonları',
      primary: '#10b981',
      primaryDark: '#059669',
      sidebarBg: '#064e3b'
    },
    {
      id: 'royal',
      title: 'Kraliyet Moru',
      desc: 'Spiritüel ve mistik gece mavisi ve asil mor',
      primary: '#8b5cf6',
      primaryDark: '#7c3aed',
      sidebarBg: '#1e1b4b'
    },
    {
      id: 'rose',
      title: 'Mürdüm & Bordo',
      desc: 'Zarif bordo arka plan ve sıcak gül tonları',
      primary: '#e11d48',
      primaryDark: '#be123c',
      sidebarBg: '#4c0519'
    },
    {
      id: 'midnight',
      title: 'Gece Slate & Altın',
      desc: 'Koyu füme zemin üzerine prestijli altın sarısı',
      primary: '#f59e0b',
      primaryDark: '#d97706',
      sidebarBg: '#0f172a'
    },
    {
      id: 'ocean',
      title: 'Safir Lacivert',
      desc: 'Kurumsal koyu lacivert ve canlı safir mavisi',
      primary: '#2563eb',
      primaryDark: '#1d4ed8',
      sidebarBg: '#0b132b'
    }
  ];

  function applyAdminTheme(theme) {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--admin-primary', theme.primary || '#02a3c4');
    root.style.setProperty('--admin-primary-dark', theme.primaryDark || '#017c95');
    root.style.setProperty('--admin-sidebar-bg', theme.sidebarBg || '#142225');
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
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
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3400);
  }

  function compressImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth || h > maxHeight) {
            const ratio = Math.min(maxWidth / w, maxHeight / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function formatTimeAgo(isoString) {
    const diffSec = Math.max(1, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diffSec < 60) return `${diffSec} sn önce`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} saat önce`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays} gün önce`;
  }

  // =========================================================================
  // 1. GİRİŞ PANELİ (LOGIN)
  // =========================================================================
  function renderLoginScreen() {
    const root = document.getElementById('admin-root');
    if (!root) return;

    root.innerHTML = `
      <div class="admin-login-screen">
        <div class="admin-login-card">
          <img src="assets/images/tukan-logo.png" alt="Tukan Logo" class="login-brand-icon" />
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
                placeholder="Varsayılan: 1"
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
                placeholder="Varsayılan: 1"
                required
                autocomplete="current-password"
              />
            </div>

            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; margin-top:0.5rem;">
              Panele Giriş Yap
            </button>
          </form>

          <div class="login-credentials-tip">
            <strong>Varsayılan Bilgiler:</strong> Kullanıcı Adı: <code>1</code> &bull; Şifre: <code>1</code>
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
          showToast('Giriş başarılı! Yönetim paneli açılıyor...');
          setTimeout(() => renderDashboard(), 250);
        } else {
          if (errBox) errBox.classList.add('show');
        }
      });
    }
  }

  // =========================================================================
  // 2. ANALİTİK & İSTATİSTİKLER (SQLITE3 MOTORU)
  // =========================================================================
  function renderAnalyticsSection() {
    const analytics = window.ITStore.getAnalytics(analyticsFilterProfile);
    const sourceMeta = window.ITStore.SOURCE_META;
    const allProfiles = window.ITStore.getAllProfiles();

    return `
      <div class="analytics-header">
        <div>
          <h2 class="analytics-title">Gerçek Zamanlı Trafik & Tıklama Analitiği</h2>
          <p class="analytics-subtitle">
            ShenApp standardı SQLite3 veri motoru: Tüm veriler sıfırdan başlar ve gerçek testler kaydedilir.
          </p>
        </div>

        <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
          <div class="analytics-profile-filter">
            <button
              type="button"
              class="filter-pill ${analyticsFilterProfile === 'ALL' ? 'active' : ''}"
              data-filter-profile="ALL"
            >
              Tüm Eğitmenler
            </button>
            ${Object.keys(allProfiles)
              .map((pid) => `
              <button
                type="button"
                class="filter-pill ${analyticsFilterProfile === pid ? 'active' : ''}"
                data-filter-profile="${escapeHtml(pid)}"
              >
                ${escapeHtml(allProfiles[pid].name)} ${analyticsFilterProfile === pid ? '✓' : ''}
              </button>
            `).join('')}
          </div>

          <button type="button" class="btn-danger-outline" id="btn-reset-analytics" title="Tüm sayaçları sıfırla">
            🗑️ Sayaçları Sıfırla
          </button>
        </div>
      </div>

      <!-- KPI Kartları -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Toplam Ziyaret</span>
            <div class="kpi-icon teal">👥</div>
          </div>
          <div class="kpi-value">${analytics.totalVisits}</div>
          <div class="kpi-desc">Doğrudan Link-in-Bio profil girişleri</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Seminer Tıklamaları</span>
            <div class="kpi-icon indigo">🎓</div>
          </div>
          <div class="kpi-value">${analytics.totalClicks}</div>
          <div class="kpi-desc">Başvuru butonlarına yapılan tıklamalar</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Dönüşüm Oranı (CTR)</span>
            <div class="kpi-icon green">📈</div>
          </div>
          <div class="kpi-value">%${analytics.ctr}</div>
          <div class="kpi-desc">Ziyaret başına seminer ilgisi</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Mobil / PC Oranı</span>
            <div class="kpi-icon amber">📱</div>
          </div>
          <div class="kpi-value">${analytics.devices.mobile} / ${analytics.devices.desktop}</div>
          <div class="kpi-desc">Akıllı telefon vs Masaüstü cihazlar</div>
        </div>
      </div>

      <!-- Analiz Izgarası: Kaynaklar & Seminerler -->
      <div class="analytics-grid-2">
        <!-- Ziyaret Kaynakları -->
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <h2 class="admin-card-title">Trafik Kaynakları Dağılımı</h2>
              <p class="admin-card-subtitle">Kullanıcıların hangi platformdan geldiği (Instagram, WhatsApp vb.)</p>
            </div>
            <span class="sqlite-engine-badge">SELECT source, COUNT(*)</span>
          </div>

          <div class="source-list">
            ${Object.entries(analytics.sources)
              .map(([key, data]) => {
                const meta = sourceMeta[key] || { label: key, color: '#64748b', bg: '#f1f5f9' };
                const pct = analytics.totalVisits > 0 ? Math.round((data.visits / analytics.totalVisits) * 100) : 0;
                return `
                  <div class="source-row">
                    <div class="source-info">
                      <span class="source-badge" style="background:${meta.bg}; color:${meta.color}; border: 1px solid ${meta.color}33;">
                        ${meta.label}
                      </span>
                    </div>

                    <div class="source-bar-wrap">
                      <div class="source-bar">
                        <div class="source-bar-fill" style="width:${pct}%; background:${meta.color};"></div>
                      </div>
                    </div>

                    <div class="source-counts">
                      <span class="source-visits"><strong>${data.visits}</strong> ziyaret (%${pct})</span>
                      <span class="source-clicks"><strong>${data.clicks}</strong> tıklama</span>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>

        <!-- Popüler Eğitim Butonları -->
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <h2 class="admin-card-title">Seminer Tıklama Performansı</h2>
              <p class="admin-card-subtitle">Hangi seminer butonuna kaç kez tıklandı?</p>
            </div>
            <span class="sqlite-engine-badge">GROUP BY training_id</span>
          </div>

          <div class="training-stats-list">
            ${
              analytics.trainingsList.length === 0
                ? `<div style="text-align:center; padding:2rem; color:#888;">Henüz tıklama kaydı yok.</div>`
                : analytics.trainingsList
                    .map((item) => `
                    <div class="training-stat-row">
                      <div class="training-stat-info">
                        <h4>${escapeHtml(item.title)}</h4>
                        <div class="training-stat-meta">
                          <span class="training-badge-cat">${escapeHtml(item.category)}</span>
                          <span>•</span>
                          <span>${escapeHtml(item.profileName)}</span>
                          <span>•</span>
                          <span>${escapeHtml(item.mode)}</span>
                        </div>
                      </div>
                      <div class="training-stat-badge">
                        ${item.clicks} tıklama
                      </div>
                    </div>
                  `)
                    .join('')
            }
          </div>
        </div>
      </div>

      <!-- Son Ziyaret ve Tıklama Günlüğü (Log) -->
      <div class="admin-card" style="margin-top: 1.5rem;">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">Gerçek Zamanlı Olay Günlüğü (Son 30 Kayıt)</h2>
            <p class="admin-card-subtitle">Sayfa ziyaretleri ve seminer başvuru tıklamaları anlık olarak burada listelenir.</p>
          </div>
          <span class="sqlite-engine-badge">SQLite3 INSERT LOG</span>
        </div>

        <div style="overflow-x:auto;">
          <table class="log-table">
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Eğitmen</th>
                <th>Olay Türü</th>
                <th>Detay</th>
                <th>Kaynak</th>
                <th>Cihaz</th>
              </tr>
            </thead>
            <tbody>
              ${
                analytics.recentEvents.length === 0
                  ? `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#888;">Henüz kaydedilmiş bir ziyaret veya tıklama yok. İlk testinizi profil sayfasını açarak yapabilirsiniz.</td></tr>`
                  : analytics.recentEvents
                      .map((ev) => {
                        const meta = sourceMeta[ev.source] || { label: ev.source || 'Bilinmiyor', color: '#64748b' };
                        return `
                          <tr>
                            <td style="white-space:nowrap; color:#64748b; font-size:0.8rem;">
                              ${formatTimeAgo(ev.timestamp)}
                            </td>
                            <td>
                              <span style="font-weight:600; font-size:0.82rem;">/${escapeHtml(ev.profileSlug)}</span>
                            </td>
                            <td>
                              <span class="event-badge ${ev.type === 'visit' ? 'visit' : 'click'}">
                                ${ev.type === 'visit' ? '👁️ Ziyaret' : '🎯 Buton Tıklama'}
                              </span>
                            </td>
                            <td style="font-weight:600; color:#1e293b; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                              ${escapeHtml(ev.label)}
                            </td>
                            <td>
                              <span style="color:${meta.color}; font-weight:700; font-size:0.82rem;">
                                ${meta.label}
                              </span>
                            </td>
                            <td>
                              <span class="device-badge">
                                ${ev.device === 'mobile' ? '📱 Mobil' : '💻 Masaüstü'}
                              </span>
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
  // =========================================================================
  function renderTrainingsEditor(profile) {
    const trainings = profile.trainings || [];
    const allProfiles = window.ITStore.getAllProfiles();
    const otherProfiles = Object.values(allProfiles).filter((p) => p.id !== selectedProfileId);

    return `
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">
              🎓 ${escapeHtml(profile.name)} (<code>/${escapeHtml(profile.slug || profile.id)}</code>) — Güncel Seminer Takvimi & Butonlar
            </h2>
            <p class="admin-card-subtitle">
              Eğitim adı, tarih, yer, dipnot ve başvuru linklerini düzenleyin. Kaydettiğinizde anında <strong>/${escapeHtml(profile.slug || profile.id)}</strong> sayfasına yansır.
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

        ${
          otherProfiles.length > 0
            ? `
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:0.9rem 1.25rem; margin-bottom:1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
            <div style="font-size:0.86rem; color:#334155;">
              💡 <strong>Hızlı İçe Aktarma:</strong> Başka bir eğitmenin hazır seminerini bu takvime çekebilirsiniz:
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
              <select id="quick-import-source-select" class="form-select" style="padding:0.4rem 0.8rem; font-size:0.82rem; width:auto;">
                <option value="">Eğitmen Seçiniz...</option>
                ${otherProfiles
                  .map((op) => `<option value="${escapeHtml(op.id)}">${escapeHtml(op.name)} (${(op.trainings || []).length} seminer)</option>`)
                  .join('')}
              </select>
              <select id="quick-import-training-select" class="form-select" style="padding:0.4rem 0.8rem; font-size:0.82rem; width:auto;" disabled>
                <option value="">Önce Eğitmen Seçin</option>
              </select>
              <button type="button" class="btn-primary" id="btn-quick-import" style="padding:0.4rem 0.9rem; font-size:0.82rem;" disabled>
                📥 Takvime Ekle
              </button>
            </div>
          </div>
        `
            : ''
        }

        <div id="trainings-cms-list">
          ${
            trainings.length === 0
              ? `<div style="text-align:center; padding:3rem; background:#faf7f2; border:1px dashed #d5cfc2; border-radius:16px;">
                  <p style="font-size:1rem; color:#64748b; margin-bottom:1rem;">Bu eğitmen için henüz eklenmiş seminer bulunmuyor.</p>
                  <button type="button" class="btn-primary" id="btn-add-training-empty">➕ İlk Semineri Ekle</button>
                </div>`
              : trainings
                  .map(
                    (t, idx) => `
            <div class="cms-item-card" data-training-index="${idx}">
              <div class="cms-item-header">
                <div style="display:flex; align-items:center; gap:0.65rem;">
                  <span class="cms-item-num">Seminer #${idx + 1}</span>
                  <strong style="font-size:1rem; color:#0f172a;">${escapeHtml(t.title)}</strong>
                </div>
                <div style="display:flex; align-items:center; gap:0.55rem; flex-wrap:wrap;">
                  ${
                    otherProfiles.length > 0
                      ? `
                    <button type="button" class="btn-copy-training" data-copy-training-idx="${idx}" title="Bu semineri diğer eğitmene kopyala">
                      📋 Diğer Eğitmene Kopyala
                    </button>
                  `
                      : ''
                  }
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
                  <label class="form-label">Katılım Formatı (Online Zoom veya Yüz Yüze)</label>
                  <select class="form-select trn-mode">
                    <option value="Yüz Yüze" ${t.mode === 'Yüz Yüze' ? 'selected' : ''}>📍 Yüz Yüze (Yeşil Temalı Kart)</option>
                    <option value="Online" ${t.mode === 'Online' ? 'selected' : ''}>💻 Online Zoom (Mavi Temalı Kart)</option>
                  </select>
                </div>
              </div>

              <div class="form-group" style="background:#ffffff; padding:0.85rem; border:1px solid #e2ded5; border-radius:12px; margin-bottom:0.85rem;">
                <label class="form-label">Buton Üzerindeki Metin (CTA)</label>
                <input type="text" class="form-input trn-cta" value="${escapeHtml(t.ctaText || 'Seminere Katıl & İncele')}" placeholder="Seminere Katıl & İncele" />
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Kayıt / Satın Alma Başvuru Linki (URL)</label>
                <input type="url" class="form-input trn-url" value="${escapeHtml(t.url)}" placeholder="https://www.rabiaalga.com/urun/..." />
              </div>
            </div>
          `
                  )
                  .join('')
          }
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 4. PROFİL & BİYOGRAFİ (DOSYA YÜKLEME & ANINDA SENKRONİZASYON)
  // =========================================================================
  function renderProfileEditor(profile) {
    const allProfiles = window.ITStore.getAllProfiles();
    const canDelete = Object.keys(allProfiles).length > 1;

    return `
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">
              👤 ${escapeHtml(profile.name)} (<code>/${escapeHtml(profile.slug || profile.id)}</code>) — Profil & Biyografi
            </h2>
            <p class="admin-card-subtitle">
              Profil fotoğrafı ve üst kapak görselini doğrudan cihazınızdan yükleyebilir veya URL olarak belirleyebilirsiniz.
            </p>
          </div>
          <div style="display:flex; gap:0.6rem; align-items:center;">
            ${
              canDelete
                ? `
              <button type="button" class="btn-danger-outline" id="btn-delete-profile" title="Bu eğitmen sayfasını tamamen sil">
                🗑️ Eğitmeni Sil
              </button>
            `
                : ''
            }
            <button type="button" class="btn-primary" id="btn-save-profile">
              💾 Profil Bilgilerini Kaydet
            </button>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Ad Soyad</label>
            <input type="text" class="form-input" id="prof-name" value="${escapeHtml(profile.name)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Unvan / Rol (Çok Satırlı)</label>
            <textarea class="form-input" id="prof-role" rows="2" placeholder="Örn: Yüksek Mimar (UÜ & İTÜ)&#10;ThetaHealing® & Silva Metodu Eğitmeni">${escapeHtml(profile.role || '')}</textarea>
            <small style="color:var(--text-muted); font-size:0.75rem; margin-top:0.25rem; display:block;">💡 Enter tuşuna basarak unvanınızı alt satırlara bölebilirsiniz.</small>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Alt Uzmanlık Rozetleri / Açıklama</label>
          <input type="text" class="form-input" id="prof-credentials" value="${escapeHtml(profile.credentials || '')}" />
        </div>

        <!-- 1) Profil Fotoğrafı Yükleme & URL -->
        <div class="form-group" style="margin-bottom:1.5rem;">
          <label class="form-label">Profil Fotoğrafı (Bilgisayardan/Telefondan Yükle veya URL)</label>
          <div class="image-upload-wrapper">
            <img src="${escapeHtml(profile.avatar)}" id="avatar-preview-img" class="image-preview-thumb" alt="Avatar Önizleme" />
            <div class="image-upload-controls">
              <label class="file-upload-btn-label">
                📁 Fotoğraf Seç & Yükle (Otomatik Kaydedilir)
                <input type="file" id="avatar-file-input" accept="image/*" style="display:none;" />
              </label>
              <input type="text" class="form-input" id="prof-avatar-url" value="${escapeHtml(profile.avatar)}" placeholder="veya görsel yolu / URL'si" />
            </div>
          </div>
        </div>

        <!-- 2) Üst Kapak Görseli Yükleme & URL -->
        <div class="form-group" style="margin-bottom:1.5rem;">
          <label class="form-label">Üst Kapak Görseli (Bilgisayardan/Telefondan Yükle veya URL)</label>
          <div class="image-upload-wrapper">
            <div style="width:110px; height:68px; border-radius:12px; overflow:hidden; border:2px solid #fff; box-shadow:0 4px 10px rgba(0,0,0,0.1); flex-shrink:0;">
              <img src="${escapeHtml(profile.bgImage || 'assets/images/back.jpg')}" id="bg-preview-img" style="width:100%; height:100%; object-fit:cover;" alt="Kapak Önizleme" />
            </div>
            <div class="image-upload-controls">
              <label class="file-upload-btn-label">
                📁 Kapak Görseli Seç & Yükle (Otomatik Kaydedilir)
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
          <textarea class="form-textarea" id="prof-bio" rows="6">${escapeHtml(profile.bio)}</textarea>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Daha Fazlası Buton Metni</label>
            <input type="text" class="form-input" id="prof-more-label" value="${escapeHtml(profile.moreLabel || 'Daha Fazlası İçin...')}" />
          </div>
          <div class="form-group">
            <label class="form-label">Daha Fazlası Bağlantı Linki (URL)</label>
            <input type="url" class="form-input" id="prof-more-url" value="${escapeHtml(profile.moreUrl || '')}" />
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 5. SOSYAL MEDYA & VİDEOLAR
  // =========================================================================
  function renderMediaEditor(profile) {
    const socials = profile.socials || [];
    const videos = profile.videos || [];

    return `
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">
              🔗 ${escapeHtml(profile.name)} (<code>/${escapeHtml(profile.slug || profile.id)}</code>) — Sosyal Medya Bağlantıları
            </h2>
            <p class="admin-card-subtitle">Profil kartının altında yer alan sosyal medya ikon linklerini yönetin.</p>
          </div>
          <button type="button" class="btn-primary" id="btn-save-media">
            💾 Sosyal Medya ve Videoları Kaydet
          </button>
        </div>

        <div class="social-cms-grid">
          ${socials
            .map(
              (s, idx) => `
            <div class="social-cms-card" data-social-index="${idx}">
              <div class="social-cms-icon">
                ${s.platform === 'email' ? '✉️' : s.platform === 'instagram' ? '📸' : s.platform === 'twitter' ? '✖️' : s.platform === 'youtube' ? '▶️' : '🌐'}
              </div>
              <div class="social-cms-fields">
                <input type="text" class="form-input soc-label" value="${escapeHtml(s.label)}" placeholder="Platform Adı" />
                <input type="text" class="form-input soc-url" value="${escapeHtml(s.url)}" placeholder="URL veya mailto:..." />
              </div>
              <label style="display:flex; align-items:center; gap:0.35rem; font-size:0.8rem; font-weight:600; cursor:pointer;">
                <input type="checkbox" class="soc-active" ${s.active !== false ? 'checked' : ''} />
                <span>Aktif</span>
              </label>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- YouTube Videoları -->
      <div class="admin-card" style="margin-top: 1.5rem;">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">▶️ Video Rehberler (YouTube Uygulamasında Açılır)</h2>
            <p class="admin-card-subtitle">
              Kullanıcılar telefondan tıkladıklarında video doğrudan resmi YouTube uygulamasında açılır.
            </p>
          </div>
          <button type="button" class="btn-secondary" id="btn-add-video">
            ➕ Yeni Video Ekle
          </button>
        </div>

        <div id="videos-cms-list">
          ${videos
            .map(
              (v, idx) => `
            <div class="cms-item-card" data-video-index="${idx}" style="margin-bottom:1rem;">
              <div class="cms-item-header">
                <strong>Video #${idx + 1}</strong>
                <button type="button" class="btn-danger-outline" data-delete-video="${idx}">
                  🗑️ Sil
                </button>
              </div>

              <div class="form-grid-2">
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label">Video Başlığı</label>
                  <input type="text" class="form-input vid-title" value="${escapeHtml(v.title)}" />
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label">YouTube Video Linki veya ID</label>
                  <input type="text" class="form-input vid-url" value="${escapeHtml(v.embedUrl)}" placeholder="https://www.youtube.com/watch?v=..." />
                </div>
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
  // 6. PANEL TEMASI & RENK ÖZELLEŞTİRME
  // =========================================================================
  function renderThemeEditor() {
    const currentTheme = window.ITStore.getTheme();

    return `
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">🎨 Yönetim Paneli Teması ve Renkleri</h2>
            <p class="admin-card-subtitle">
              Yönetim panelinizin ana vurgu renklerini ve sol menü tonunu kişiselleştirebilirsiniz. Değişiklikler anında uygulanır ve sunucuya kaydedilir.
            </p>
          </div>
        </div>

        <h3 style="font-size:1.05rem; font-weight:700; color:#0f172a; margin-bottom:1rem;">
          Hazır Lüks Renk Paletleri
        </h3>

        <div class="theme-grid">
          ${THEME_PRESETS.map((preset) => {
            const isActive = currentTheme.primary === preset.primary;
            return `
              <div class="theme-card ${isActive ? 'active' : ''}" data-preset-id="${escapeHtml(preset.id)}">
                <div class="theme-color-preview">
                  <span style="background:${preset.sidebarBg};"></span>
                  <span style="background:${preset.primary};"></span>
                  <span style="background:${preset.primaryDark};"></span>
                </div>
                <div class="theme-card-title">${escapeHtml(preset.title)}</div>
                <div class="theme-card-desc">${escapeHtml(preset.desc)}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="background:#faf7f2; border:1px solid #e2ded5; border-radius:16px; padding:1.5rem; margin-top:1.5rem;">
          <h4 style="font-size:1rem; font-weight:700; color:#0f172a; margin-bottom:1rem;">
            Özel Renk Belirleme (Hex Kodu)
          </h4>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Ana Vurgu Rengi (Butonlar, Rozetler)</label>
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <input type="color" id="theme-custom-primary" value="${escapeHtml(currentTheme.primary || '#02a3c4')}" style="width:48px; height:42px; padding:0; border:1px solid #d5cfc2; border-radius:8px; cursor:pointer;" />
                <input type="text" class="form-input" id="theme-custom-primary-text" value="${escapeHtml(currentTheme.primary || '#02a3c4')}" style="flex:1;" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Sol Menü Arka Plan Rengi</label>
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <input type="color" id="theme-custom-sidebar" value="${escapeHtml(currentTheme.sidebarBg || '#142225')}" style="width:48px; height:42px; padding:0; border:1px solid #d5cfc2; border-radius:8px; cursor:pointer;" />
                <input type="text" class="form-input" id="theme-custom-sidebar-text" value="${escapeHtml(currentTheme.sidebarBg || '#142225')}" style="flex:1;" />
              </div>
            </div>
          </div>
          <button type="button" class="btn-primary" id="btn-save-custom-theme" style="margin-top:0.5rem;">
            💾 Özel Temayı Kaydet
          </button>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 7. GÜVENLİK & GİRİŞ BİLGİLERİ DÜZENLEME
  // =========================================================================
  function renderSecurityEditor() {
    const auth = window.ITStore.getAuth();

    return `
      <div class="admin-card" style="max-width: 600px;">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">🔐 Panel Giriş Bilgileri</h2>
            <p class="admin-card-subtitle">Yönetim paneli kullanıcı adı ve şifresini buradan güncelleyebilirsiniz.</p>
          </div>
        </div>

        <form id="auth-change-form">
          <div class="form-group">
            <label class="form-label">Mevcut veya Yeni Kullanıcı Adı</label>
            <input type="text" class="form-input" id="auth-new-username" value="${escapeHtml(auth.username)}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Yeni Şifre</label>
            <input type="text" class="form-input" id="auth-new-password" value="${escapeHtml(auth.password)}" required />
          </div>

          <button type="submit" class="btn-primary" style="margin-top: 0.5rem;">
            💾 Bilgileri Güncelle & Kaydet
          </button>
        </form>
      </div>
    `;
  }

  // =========================================================================
  // 8. ANA DASHBOARD SHELL
  // =========================================================================
  function renderDashboard() {
    applyAdminTheme(window.ITStore.getTheme());
    const allProfiles = window.ITStore.getAllProfiles();
    const profileKeys = Object.keys(allProfiles);

    if (!allProfiles[selectedProfileId] && profileKeys.length > 0) {
      selectedProfileId = profileKeys[0];
    }
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
    } else if (activeSection === 'theme') {
      sectionHtml = renderThemeEditor();
    } else if (activeSection === 'security') {
      sectionHtml = renderSecurityEditor();
    }

    root.innerHTML = `
      <div class="admin-shell">
        <!-- SOL MENÜ -->
        <aside class="admin-sidebar">
          <div>
            <div class="admin-brand">
              <img src="assets/images/tukan-logo.png" alt="Tukan" class="admin-brand-mark" />
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

            <div class="admin-nav-group-label">Sayfa Yönetimi (/${escapeHtml(profile.slug || profile.id)})</div>
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
              <button type="button" class="admin-nav-btn ${activeSection === 'theme' ? 'active' : ''}" data-nav="theme">
                <span>🎨 Tema & Renkler</span>
              </button>
              <button type="button" class="admin-nav-btn ${activeSection === 'security' ? 'active' : ''}" data-nav="security">
                <span>🔐 Şifre Değiştir (Giriş)</span>
              </button>
            </nav>
          </div>

          <div class="admin-sidebar-footer">
            <div style="font-size:0.72rem; color:#8FA6AA; padding:0 0.25rem;">Sayfayı Aç:</div>
            <a href="${escapeHtml(profile.slug || profile.id)}" target="_blank" class="admin-live-link">
              <span>🟢 /${escapeHtml(profile.slug || profile.id)}</span>
              <span>↗</span>
            </a>
            <button type="button" id="btn-logout" class="admin-logout-btn">
              🚪 Çıkış Yap
            </button>
          </div>
        </aside>

        <!-- SAĞ İÇERİK -->
        <div class="admin-main">
          <!-- Üst Bar: Dinamik Eğitmen Sekmeleri & Yeni Eğitmen Ekle -->
          <header class="admin-header">
            <div class="admin-file-selector-wrap">
              <span class="admin-selector-label">Düzenlenen Eğitmen:</span>
              <div class="admin-file-tabs">
                ${profileKeys
                  .map((pid) => {
                    const p = allProfiles[pid];
                    return `
                    <button
                      type="button"
                      class="admin-file-tab ${selectedProfileId === pid ? 'active' : ''}"
                      data-select-profile="${escapeHtml(pid)}"
                    >
                      <img src="${escapeHtml(p.avatar || 'assets/images/RabiaAlga.jpg')}" alt="${escapeHtml(p.name)}" />
                      <span>${escapeHtml(p.name)}</span>
                      <code>/${escapeHtml(p.slug || pid)}</code>
                    </button>
                  `;
                  })
                  .join('')}
                <button type="button" class="btn-add-profile-tab" id="btn-open-create-profile" title="Yeni bir eğitmen sayfası oluştur">
                  <span>➕ Yeni Eğitmen Ekle</span>
                </button>
              </div>
            </div>

            <div class="admin-header-actions">
              <a href="${escapeHtml(profile.slug || profile.id)}" target="_blank" class="btn-secondary">
                👁️ /${escapeHtml(profile.slug || profile.id)} Sayfasını Aç ↗
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
        url: card.querySelector('.trn-url')?.value.trim() || '#',
        active: card.querySelector('.trn-active')?.checked ?? true
      });
    });
    return updated;
  }

  function normalizeYoutubeEmbed(url) {
    if (!url) return '';
    const trimmed = url.trim();
    const match = trimmed.match(/(?:embed\/|v=|vi\/|youtu\.be\/|\/v\/|watch\?v=|\?v=)([^#&?]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/watch?v=${match[1]}`;
    }
    return trimmed;
  }

  // =========================================================================
  // 9. EVENT BINDINGS
  // =========================================================================
  function bindDashboardEvents(profile) {
    // Navigasyon Menüsü
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSection = btn.getAttribute('data-nav');
        renderDashboard();
      });
    });

    // Sayfa/Eğitmen Seçici
    document.querySelectorAll('[data-select-profile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedProfileId = btn.getAttribute('data-select-profile');
        const p = window.ITStore.getProfile(selectedProfileId);
        renderDashboard();
        showToast(`${p.name} profili seçildi.`);
      });
    });

    // Çıkış
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        window.ITStore.logoutAdmin();
        showToast('Başarıyla çıkış yapıldı.');
        renderLoginScreen();
      });
    }

    // Analiz Eğitmen Filtresi
    document.querySelectorAll('[data-filter-profile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        analyticsFilterProfile = btn.getAttribute('data-filter-profile');
        renderDashboard();
      });
    });

    // Analitik Sıfırlama
    const btnResetAnalytics = document.getElementById('btn-reset-analytics');
    if (btnResetAnalytics) {
      btnResetAnalytics.addEventListener('click', () => {
        if (confirm('Tüm ziyaret ve tıklama sayaçlarını sıfırlamak istediğinize emin misiniz?')) {
          window.ITStore.resetAnalytics();
          renderDashboard();
          showToast('Analitik sayaçları sıfırlandı.');
        }
      });
    }

    // =========================================================================
    // YENİ EĞİTMEN SAYFASI AÇMA MODALI (REQ 1)
    // =========================================================================
    const btnOpenCreate = document.getElementById('btn-open-create-profile');
    if (btnOpenCreate) {
      btnOpenCreate.addEventListener('click', () => {
        openCreateProfileModal();
      });
    }

    // Eğitmeni Silme
    const btnDeleteProfile = document.getElementById('btn-delete-profile');
    if (btnDeleteProfile) {
      btnDeleteProfile.addEventListener('click', async () => {
        if (confirm(`"${profile.name}" eğitmen sayfasını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
          await window.ITStore.deleteProfileAsync(selectedProfileId);
          const all = window.ITStore.getAllProfiles();
          selectedProfileId = Object.keys(all)[0] || 'rabia-alga';
          renderDashboard();
          showToast('Eğitmen sayfası silindi.');
        }
      });
    }

    // =========================================================================
    // SEMİNER DÜZENLEME & KOPYALAMA (REQ 2 & 3)
    // =========================================================================
    const btnSaveTrainings = document.getElementById('btn-save-trainings');
    if (btnSaveTrainings) {
      btnSaveTrainings.addEventListener('click', async () => {
        btnSaveTrainings.disabled = true;
        btnSaveTrainings.textContent = '⏳ Sunucuya Kaydediliyor...';
        profile.trainings = collectTrainingsFromDOM(profile);
        const ok = await window.ITStore.saveProfileAsync(selectedProfileId, profile);
        btnSaveTrainings.disabled = false;
        btnSaveTrainings.textContent = '💾 Değişiklikleri Kaydet & Yayınla';
        renderDashboard();
        if (ok) {
          showToast(`✓ ${profile.name} seminer takvimi sunucuya kaydedildi! Mobil ve PC senkronize.`);
        } else {
          showToast(`⚠️ Yerel olarak kaydedildi, sunucu bağlantısı kontrol ediliyor.`);
        }
      });
    }

    const btnAddTraining = document.getElementById('btn-add-training') || document.getElementById('btn-add-training-empty');
    if (btnAddTraining) {
      btnAddTraining.addEventListener('click', async () => {
        profile.trainings = profile.trainings || [];
        profile.trainings.push({
          id: 'trn-' + profile.id + '-' + Date.now(),
          title: 'Yeni Seminer Programı',
          category: 'ThetaHealing®',
          date: '15-16 Mayıs 2027 / 09.30-17.30',
          location: 'Nida Kule - İstanbul',
          note: '(Kayıtlarımız devam etmektedir.)',
          mode: 'Yüz Yüze',
          ctaText: 'Seminere Katıl & İncele',
          url: 'https://www.rabiaalga.com/',
          active: true
        });
        await window.ITStore.saveProfileAsync(selectedProfileId, profile);
        renderDashboard();
        showToast('Yeni seminer eklendi ve kaydedildi.');
      });
    }

    document.querySelectorAll('[data-delete-training]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-delete-training'), 10);
        profile.trainings = collectTrainingsFromDOM(profile);
        profile.trainings.splice(idx, 1);
        await window.ITStore.saveProfileAsync(selectedProfileId, profile);
        renderDashboard();
        showToast('Seminer silindi.');
      });
    });

    // SEMİNERİ DİĞER EĞİTMENE KOPYALA BUTONU (REQ 2)
    document.querySelectorAll('[data-copy-training-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-copy-training-idx'), 10);
        profile.trainings = collectTrainingsFromDOM(profile);
        const training = profile.trainings[idx];
        if (training) {
          openCopyTrainingModal(training);
        }
      });
    });

    // Hızlı İçe Aktarma Dropdown'ları
    const quickSourceSelect = document.getElementById('quick-import-source-select');
    const quickTrainingSelect = document.getElementById('quick-import-training-select');
    const btnQuickImport = document.getElementById('btn-quick-import');
    if (quickSourceSelect && quickTrainingSelect && btnQuickImport) {
      quickSourceSelect.addEventListener('change', () => {
        const srcPid = quickSourceSelect.value;
        if (!srcPid) {
          quickTrainingSelect.innerHTML = '<option value="">Önce Eğitmen Seçin</option>';
          quickTrainingSelect.disabled = true;
          btnQuickImport.disabled = true;
          return;
        }
        const srcProf = window.ITStore.getProfile(srcPid);
        const trns = srcProf.trainings || [];
        if (trns.length === 0) {
          quickTrainingSelect.innerHTML = '<option value="">Bu eğitmende seminer yok</option>';
          quickTrainingSelect.disabled = true;
          btnQuickImport.disabled = true;
        } else {
          quickTrainingSelect.innerHTML = '<option value="">Seminer Seçiniz...</option>' +
            trns.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.title)} (${escapeHtml(t.mode)})</option>`).join('');
          quickTrainingSelect.disabled = false;
        }
      });

      quickTrainingSelect.addEventListener('change', () => {
        btnQuickImport.disabled = !quickTrainingSelect.value;
      });

      btnQuickImport.addEventListener('click', async () => {
        const srcPid = quickSourceSelect.value;
        const trnId = quickTrainingSelect.value;
        if (srcPid && trnId) {
          btnQuickImport.disabled = true;
          btnQuickImport.textContent = 'Aktarılıyor...';
          await window.ITStore.cloneTrainingAsync(srcPid, selectedProfileId, trnId);
          renderDashboard();
          showToast('✓ Seminer başarıyla bu eğitmene aktarıldı ve kaydedildi!');
        }
      });
    }

    // =========================================================================
    // PROFİL FOTOĞRAFI & KAPAK — ANINDA OTO-KAYIT (REQ 6 - REVERT BUG ÇÖZÜMÜ)
    // =========================================================================
    const avatarFileInput = document.getElementById('avatar-file-input');
    const avatarUrlInput = document.getElementById('prof-avatar-url');
    const avatarPreviewImg = document.getElementById('avatar-preview-img');
    if (avatarFileInput) {
      avatarFileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          showToast('Fotoğraf optimize ediliyor...');
          try {
            const dataUrl = await compressImageFile(file, 800, 800, 0.85);
            avatarUrlInput.value = dataUrl;
            avatarPreviewImg.src = dataUrl;
            // CRITICAL FIX: Anında hafızaya ve sunucuya yaz!
            profile.avatar = dataUrl;
            await window.ITStore.saveProfileAsync(selectedProfileId, profile);
            showToast('✓ Profil fotoğrafı güncellendi ve anında kaydedildi!');
          } catch (err) {
            showToast('Fotoğraf okunamadı: ' + err.message);
          }
        }
      });
    }
    if (avatarUrlInput) {
      avatarUrlInput.addEventListener('input', () => {
        avatarPreviewImg.src = avatarUrlInput.value;
      });
      avatarUrlInput.addEventListener('change', async () => {
        const val = avatarUrlInput.value.trim();
        if (val && val !== profile.avatar) {
          profile.avatar = val;
          await window.ITStore.saveProfileAsync(selectedProfileId, profile);
          showToast('✓ Profil fotoğrafı linki güncellendi ve kaydedildi!');
        }
      });
    }

    const bgFileInput = document.getElementById('bg-file-input');
    const bgUrlInput = document.getElementById('prof-bg-url');
    const bgPreviewImg = document.getElementById('bg-preview-img');
    if (bgFileInput) {
      bgFileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          showToast('Kapak görseli optimize ediliyor...');
          try {
            const dataUrl = await compressImageFile(file, 1600, 800, 0.85);
            bgUrlInput.value = dataUrl;
            bgPreviewImg.src = dataUrl;
            // CRITICAL FIX: Anında hafızaya ve sunucuya yaz!
            profile.bgImage = dataUrl;
            await window.ITStore.saveProfileAsync(selectedProfileId, profile);
            showToast('✓ Üst kapak görseli güncellendi ve anında kaydedildi!');
          } catch (err) {
            showToast('Görsel okunamadı: ' + err.message);
          }
        }
      });
    }
    if (bgUrlInput) {
      bgUrlInput.addEventListener('input', () => {
        bgPreviewImg.src = bgUrlInput.value;
      });
      bgUrlInput.addEventListener('change', async () => {
        const val = bgUrlInput.value.trim();
        if (val && val !== profile.bgImage) {
          profile.bgImage = val;
          await window.ITStore.saveProfileAsync(selectedProfileId, profile);
          showToast('✓ Kapak görseli linki güncellendi ve kaydedildi!');
        }
      });
    }

    // Profil Bilgilerini Kaydetme
    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
      btnSaveProfile.addEventListener('click', async () => {
        btnSaveProfile.disabled = true;
        btnSaveProfile.textContent = '⏳ Sunucuya Kaydediliyor...';
        profile.name = document.getElementById('prof-name')?.value.trim() || profile.name;
        profile.role = document.getElementById('prof-role')?.value.trim() || profile.role;
        profile.credentials = document.getElementById('prof-credentials')?.value.trim() || '';
        profile.avatar = document.getElementById('prof-avatar-url')?.value.trim() || profile.avatar;
        profile.bgImage = document.getElementById('prof-bg-url')?.value.trim() || profile.bgImage;
        profile.greeting = document.getElementById('prof-greeting')?.value.trim() || profile.greeting;
        profile.bio = document.getElementById('prof-bio')?.value.trim() || profile.bio;
        profile.moreLabel = document.getElementById('prof-more-label')?.value.trim() || 'Daha Fazlası İçin...';
        profile.moreUrl = document.getElementById('prof-more-url')?.value.trim() || profile.moreUrl;

        const ok = await window.ITStore.saveProfileAsync(selectedProfileId, profile);
        btnSaveProfile.disabled = false;
        btnSaveProfile.textContent = '💾 Profil Bilgilerini Kaydet';
        renderDashboard();
        if (ok) {
          showToast(`✓ ${profile.name} profil bilgileri sunucuya kaydedildi! Mobil ve PC senkronize.`);
        } else {
          showToast(`⚠️ Yerel olarak kaydedildi, sunucuya aktarılıyor...`);
        }
      });
    }

    // =========================================================================
    // SOSYAL MEDYA & VİDEOLAR
    // =========================================================================
    const btnSaveMedia = document.getElementById('btn-save-media');
    if (btnSaveMedia) {
      btnSaveMedia.addEventListener('click', async () => {
        btnSaveMedia.disabled = true;
        btnSaveMedia.textContent = '⏳ Sunucuya Kaydediliyor...';
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

        const ok = await window.ITStore.saveProfileAsync(selectedProfileId, profile);
        btnSaveMedia.disabled = false;
        btnSaveMedia.textContent = '💾 Sosyal Medya ve Videoları Kaydet';
        renderDashboard();
        if (ok) {
          showToast(`✓ ${profile.name} sosyal medya ve videoları sunucuya kaydedildi!`);
        } else {
          showToast(`⚠️ Yerel olarak kaydedildi, sunucuya aktarılıyor...`);
        }
      });
    }

    const btnAddVideo = document.getElementById('btn-add-video');
    if (btnAddVideo) {
      btnAddVideo.addEventListener('click', async () => {
        profile.videos = profile.videos || [];
        profile.videos.push({
          id: 'vid-' + Date.now(),
          title: 'Yeni YouTube Videosu',
          embedUrl: 'https://www.youtube.com/watch?v=BgTwMiPETuY',
          active: true
        });
        await window.ITStore.saveProfileAsync(selectedProfileId, profile);
        renderDashboard();
        showToast('Yeni video alanı eklendi ve kaydedildi.');
      });
    }

    document.querySelectorAll('[data-delete-video]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-delete-video'), 10);
        profile.videos.splice(idx, 1);
        await window.ITStore.saveProfileAsync(selectedProfileId, profile);
        renderDashboard();
        showToast('Video silindi.');
      });
    });

    // =========================================================================
    // TEMA SEÇİMİ (REQ 5)
    // =========================================================================
    document.querySelectorAll('[data-preset-id]').forEach((card) => {
      card.addEventListener('click', async () => {
        const presetId = card.getAttribute('data-preset-id');
        const preset = THEME_PRESETS.find((p) => p.id === presetId);
        if (preset) {
          applyAdminTheme(preset);
          await window.ITStore.saveThemeAsync(preset);
          renderDashboard();
          showToast(`✓ "${preset.title}" teması uygulandı ve kaydedildi!`);
        }
      });
    });

    const customPrimary = document.getElementById('theme-custom-primary');
    const customPrimaryText = document.getElementById('theme-custom-primary-text');
    const customSidebar = document.getElementById('theme-custom-sidebar');
    const customSidebarText = document.getElementById('theme-custom-sidebar-text');
    const btnSaveCustomTheme = document.getElementById('btn-save-custom-theme');

    if (customPrimary && customPrimaryText) {
      customPrimary.addEventListener('input', () => {
        customPrimaryText.value = customPrimary.value;
      });
      customPrimaryText.addEventListener('input', () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(customPrimaryText.value)) {
          customPrimary.value = customPrimaryText.value;
        }
      });
    }

    if (customSidebar && customSidebarText) {
      customSidebar.addEventListener('input', () => {
        customSidebarText.value = customSidebar.value;
      });
      customSidebarText.addEventListener('input', () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(customSidebarText.value)) {
          customSidebar.value = customSidebarText.value;
        }
      });
    }

    if (btnSaveCustomTheme) {
      btnSaveCustomTheme.addEventListener('click', async () => {
        const customTheme = {
          id: 'custom',
          title: 'Özel Tema',
          desc: 'Kullanıcı tanımlı renk paleti',
          primary: customPrimaryText.value || '#02a3c4',
          primaryDark: customPrimaryText.value || '#017c95',
          sidebarBg: customSidebarText.value || '#142225'
        };
        applyAdminTheme(customTheme);
        await window.ITStore.saveThemeAsync(customTheme);
        renderDashboard();
        showToast('✓ Özel tema renkleri kaydedildi!');
      });
    }

    // Panel Şifresi / Kullanıcı Adı Değiştirme
    const authForm = document.getElementById('auth-change-form');
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nu = document.getElementById('auth-new-username')?.value.trim();
        const np = document.getElementById('auth-new-password')?.value.trim();
        if (nu && np) {
          await window.ITStore.saveAuth({ username: nu, password: np });
          showToast('✓ Giriş bilgileri güncellendi! Giriş: ' + nu + ' / ' + np);
        }
      });
    }
  }

  // =========================================================================
  // 10. MODALLAR: YENİ EĞİTMEN EKLEME & SEMİNER KOPYALAMA
  // =========================================================================
  function openCreateProfileModal() {
    let backdrop = document.getElementById('admin-modal-backdrop');
    if (backdrop) backdrop.remove();

    backdrop = document.createElement('div');
    backdrop.id = 'admin-modal-backdrop';
    backdrop.className = 'admin-modal-backdrop';

    backdrop.innerHTML = `
      <div class="admin-modal">
        <div class="admin-modal-header">
          <h3 class="admin-modal-title">➕ Yeni Eğitmen Sayfası Oluştur</h3>
          <button type="button" class="admin-modal-close" id="modal-create-close">&times;</button>
        </div>
        <div class="admin-modal-body">
          <div class="form-group">
            <label class="form-label">Eğitmen Adı Soyadı *</label>
            <input type="text" class="form-input" id="new-prof-name" placeholder="Örn: Ayşe Yılmaz" required />
          </div>

          <div class="form-group">
            <label class="form-label">Sayfa Linki (Slug) *</label>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="color:#64748b; font-size:0.85rem;">/icimizdekitamirci/</span>
              <input type="text" class="form-input" id="new-prof-slug" placeholder="ayse-yilmaz" required style="flex:1;" />
            </div>
            <small style="color:#64748b; font-size:0.75rem; margin-top:0.25rem; display:block;">
              Kullanıcıların eğitmenin sayfasına ulaşacağı doğrudan link.
            </small>
          </div>

          <div class="form-group">
            <label class="form-label">Unvan / Rol</label>
            <textarea class="form-input" id="new-prof-role" rows="2" placeholder="Örn: Yaşam Koçu&#10;ThetaHealing® & Silva Metodu Eğitmeni"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Profil Fotoğrafı Seç (Opsiyonel)</label>
            <input type="file" id="new-prof-avatar-file" accept="image/*" class="form-input" style="padding:0.4rem;" />
            <input type="hidden" id="new-prof-avatar-data" value="assets/images/RabiaAlga.jpg" />
          </div>

          <div class="form-group">
            <label class="form-label">Biyografi / Giriş Metni</label>
            <textarea class="form-textarea" id="new-prof-bio" rows="3" placeholder="Kendinizi ve eğitimlerinizi tanıtan kısa bir metin yazın..."></textarea>
          </div>
        </div>

        <div class="admin-modal-footer">
          <button type="button" class="btn-secondary" id="modal-create-cancel">İptal</button>
          <button type="button" class="btn-primary" id="modal-create-submit">🚀 Eğitmeni Oluştur</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const closeBtn = document.getElementById('modal-create-close');
    const cancelBtn = document.getElementById('modal-create-cancel');
    const submitBtn = document.getElementById('modal-create-submit');
    const nameInput = document.getElementById('new-prof-name');
    const slugInput = document.getElementById('new-prof-slug');
    const avatarFileInput = document.getElementById('new-prof-avatar-file');
    const avatarDataInput = document.getElementById('new-prof-avatar-data');

    nameInput.addEventListener('input', () => {
      slugInput.value = slugify(nameInput.value);
    });

    avatarFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        showToast('Fotoğraf optimize ediliyor...');
        const compressed = await compressImageFile(file, 800, 800, 0.85);
        avatarDataInput.value = compressed;
        showToast('Fotoğraf hazırlandı!');
      }
    });

    const closeModal = () => backdrop.remove();
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    submitBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      let slug = slugify(slugInput.value.trim());
      if (!name) {
        alert('Lütfen eğitmenin adını ve soyadını giriniz.');
        return;
      }
      if (!slug) slug = slugify(name);

      const all = window.ITStore.getAllProfiles();
      if (all[slug]) {
        alert('Bu sayfa linki (slug) zaten mevcut. Lütfen farklı bir link belirleyiniz.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Oluşturuluyor...';

      const newProfile = {
        id: slug,
        slug: slug,
        phpSlug: slug,
        htmlSlug: slug,
        name: name,
        role: document.getElementById('new-prof-role')?.value.trim() || '',
        credentials: 'İçimizdeki Tamirci Eğitmeni',
        avatar: avatarDataInput.value || 'assets/images/RabiaAlga.jpg',
        bgImage: 'assets/images/back.jpg',
        greeting: `Merhaba, Ben ${name}`,
        bio: document.getElementById('new-prof-bio')?.value.trim() || 'Biyografi metninizi buradan düzenleyebilirsiniz.',
        moreLabel: 'Daha Fazlası İçin...',
        moreUrl: '',
        accentColor: '#02a3c4',
        socials: [
          { id: `soc-${slug}-1`, platform: 'email', label: 'E-Posta', url: 'mailto:', active: true },
          { id: `soc-${slug}-2`, platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/', active: true },
          { id: `soc-${slug}-3`, platform: 'youtube', label: 'YouTube', url: 'https://youtube.com/', active: true },
          { id: `soc-${slug}-4`, platform: 'website', label: 'Web Sitesi', url: '', active: true }
        ],
        trainings: [],
        videos: []
      };

      await window.ITStore.createProfileAsync(slug, newProfile);
      selectedProfileId = slug;
      closeModal();
      renderDashboard();
      showToast(`✓ "${name}" eğitmen sayfası oluşturuldu! Canlı Link: /${slug}`);
    });
  }

  function openCopyTrainingModal(training) {
    let backdrop = document.getElementById('admin-modal-backdrop');
    if (backdrop) backdrop.remove();

    const allProfiles = window.ITStore.getAllProfiles();
    const otherProfiles = Object.values(allProfiles).filter((p) => p.id !== selectedProfileId);

    if (otherProfiles.length === 0) {
      alert('Kopyalanabilecek başka bir eğitmen bulunmuyor. Önce yeni bir eğitmen sayfası oluşturabilirsiniz.');
      return;
    }

    backdrop = document.createElement('div');
    backdrop.id = 'admin-modal-backdrop';
    backdrop.className = 'admin-modal-backdrop';

    backdrop.innerHTML = `
      <div class="admin-modal">
        <div class="admin-modal-header">
          <h3 class="admin-modal-title">📋 Semineri Diğer Eğitmene Kopyala</h3>
          <button type="button" class="admin-modal-close" id="modal-copy-close">&times;</button>
        </div>
        <div class="admin-modal-body">
          <div style="background:#faf7f2; border:1px solid #e2ded5; border-radius:12px; padding:1rem; margin-bottom:1.25rem;">
            <div style="font-size:0.78rem; text-transform:uppercase; color:#64748b; font-weight:700;">Kopyalanacak Seminer:</div>
            <strong style="font-size:1.05rem; color:#0f172a; display:block; margin:0.35rem 0;">${escapeHtml(training.title)}</strong>
            <div style="font-size:0.84rem; color:#64748b;">
              📅 ${escapeHtml(training.date)} &bull; 📍 ${escapeHtml(training.location)} &bull; (${escapeHtml(training.mode)})
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Bu semineri hangi eğitmenin takvimine eklemek istiyorsunuz? *</label>
            <div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:0.5rem;">
              ${otherProfiles
                .map(
                  (op, idx) => `
                <label style="display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; border:1px solid #e2ded5; border-radius:12px; cursor:pointer; background:#ffffff; transition:all 0.15s ease;">
                  <input type="radio" name="target-copy-profile" value="${escapeHtml(op.id)}" ${idx === 0 ? 'checked' : ''} style="width:18px; height:18px;" />
                  <img src="${escapeHtml(op.avatar || 'assets/images/RabiaAlga.jpg')}" alt="${escapeHtml(op.name)}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;" />
                  <div>
                    <strong style="color:#0f172a; display:block;">${escapeHtml(op.name)}</strong>
                    <span style="font-size:0.78rem; color:#64748b;">/${escapeHtml(op.slug || op.id)}</span>
                  </div>
                </label>
              `
                )
                .join('')}
            </div>
          </div>
        </div>

        <div class="admin-modal-footer">
          <button type="button" class="btn-secondary" id="modal-copy-cancel">İptal</button>
          <button type="button" class="btn-primary" id="modal-copy-submit">📋 Semineri Kopyala & Ekle</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const closeBtn = document.getElementById('modal-copy-close');
    const cancelBtn = document.getElementById('modal-copy-cancel');
    const submitBtn = document.getElementById('modal-copy-submit');

    const closeModal = () => backdrop.remove();
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    submitBtn.addEventListener('click', async () => {
      const selectedRadio = document.querySelector('input[name="target-copy-profile"]:checked');
      if (!selectedRadio) {
        alert('Lütfen hedef eğitmeni seçiniz.');
        return;
      }
      const targetId = selectedRadio.value;
      const targetProf = window.ITStore.getProfile(targetId);

      submitBtn.disabled = true;
      submitBtn.textContent = 'Kopyalanıyor...';

      await window.ITStore.cloneTrainingAsync(selectedProfileId, targetId, training.id);
      closeModal();
      showToast(`✓ "${training.title}" semineri ${targetProf.name} takvimine başarıyla eklendi!`);
    });
  }

  // =========================================================================
  // 11. BAŞLANGIÇ ÇALIŞTIRMA (BOOTSTRAP)
  // =========================================================================
  applyAdminTheme(window.ITStore.getTheme());

  if (window.ITStore.isAdminLoggedIn()) {
    renderDashboard();
  } else {
    renderLoginScreen();
  }

  // Sekmeler arası canlı senkronizasyon dinleyicisi
  window.ITStore.onSync(() => {
    // Sadece admin oturumu açıksa ve kullanıcı formun içinde bir şey yazmıyorsa tazele
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    if (window.ITStore.isAdminLoggedIn() && !isTyping) {
      renderDashboard();
    }
  });

  // Sayfa ilk yüklendiğinde sunucudan taze veriyi çek
  window.ITStore.pullFromServer().then((hasUpdate) => {
    if (hasUpdate && window.ITStore.isAdminLoggedIn()) {
      renderDashboard();
    }
  });
})();
