/**
 * İçimizdeki Tamirci — Yönetim Paneli & Analitik Uygulaması (admin-app.js)
 * Seçilen sayfayı (rabia-alga.php veya bedia-kahya-kilic.php) anında düzenler,
 * hangi eğitime kaç kişi tıkladığını ve hangi kaynaktan (Instagram, WhatsApp vb.)
 * geldiğini gerçek zamanlı olarak raporlar.
 */

(function () {
  const urlParams = new URLSearchParams(window.location.search);
  let selectedProfileId = urlParams.get('profile') || 'rabia-alga';
  if (!['rabia-alga', 'bedia-kahya-kilic'].includes(selectedProfileId)) {
    selectedProfileId = 'rabia-alga';
  }

  let activeSection = urlParams.get('tab') || 'analytics'; // analytics | trainings | profile | media | links
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
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
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

  function getAggregatedAnalytics() {
    const analytics = window.ITStore.getAnalytics();
    const profilesToInclude =
      analyticsFilterProfile === 'ALL'
        ? ['rabia-alga', 'bedia-kahya-kilic']
        : [analyticsFilterProfile];

    let totalVisits = 0;
    let uniqueVisitors = 0;
    let totalClicks = 0;
    const sources = {
      instagram: { visits: 0, clicks: 0 },
      whatsapp: { visits: 0, clicks: 0 },
      youtube: { visits: 0, clicks: 0 },
      google: { visits: 0, clicks: 0 },
      twitter: { visits: 0, clicks: 0 },
      direct: { visits: 0, clicks: 0 }
    };
    const devices = { mobile: 0, desktop: 0 };
    const trainingsList = [];

    profilesToInclude.forEach((pid) => {
      const s = analytics.summary[pid];
      if (!s) return;
      totalVisits += s.totalVisits || 0;
      uniqueVisitors += s.uniqueVisitors || 0;
      totalClicks += s.totalClicks || 0;

      Object.keys(sources).forEach((srcKey) => {
        if (s.sources && s.sources[srcKey]) {
          sources[srcKey].visits += s.sources[srcKey].visits || 0;
          sources[srcKey].clicks += s.sources[srcKey].clicks || 0;
        }
      });

      devices.mobile += s.devices?.mobile || 0;
      devices.desktop += s.devices?.desktop || 0;

      const profObj = window.ITStore.getProfile(pid);
      Object.entries(s.trainingClicks || {}).forEach(([tid, tStat]) => {
        trainingsList.push({
          id: tid,
          profileId: pid,
          profileSlug: profObj.phpSlug,
          profileName: profObj.name,
          title: tStat.title,
          date: tStat.date || '',
          clicks: tStat.clicks || 0,
          bySource: tStat.bySource || {}
        });
      });
    });

    trainingsList.sort((a, b) => b.clicks - a.clicks);

    const recentEvents = (analytics.recentEvents || []).filter((e) =>
      analyticsFilterProfile === 'ALL' ? true : e.profileId === analyticsFilterProfile
    );

    // Son 10 günlük grafik serisi
    const dayKeys = Object.keys(analytics.daily || {}).sort().slice(-10);
    const dailySeries = dayKeys.map((dk) => {
      let v = 0;
      let c = 0;
      profilesToInclude.forEach((pid) => {
        v += analytics.daily[dk]?.[pid]?.visits || 0;
        c += analytics.daily[dk]?.[pid]?.clicks || 0;
      });
      return { date: dk, visits: v, clicks: c };
    });

    return {
      totalVisits,
      uniqueVisitors,
      totalClicks,
      ctr: totalVisits > 0 ? ((totalClicks / totalVisits) * 100).toFixed(1) : '0.0',
      sources,
      devices,
      trainingsList,
      recentEvents,
      dailySeries
    };
  }

  function renderAnalyticsSection() {
    const agg = getAggregatedAnalytics();
    const maxTrainingClicks = Math.max(1, ...agg.trainingsList.map((t) => t.clicks));
    const maxSourceVisits = Math.max(
      1,
      ...Object.values(agg.sources).map((s) => s.visits)
    );

    const mobilePct =
      agg.devices.mobile + agg.devices.desktop > 0
        ? Math.round((agg.devices.mobile / (agg.devices.mobile + agg.devices.desktop)) * 100)
        : 80;
    const desktopPct = 100 - mobilePct;

    // SVG Bar Chart for Daily Visits vs Clicks
    const maxDaily = Math.max(1, ...agg.dailySeries.map((d) => d.visits));

    return `
      <!-- Üst Filtre & Hızlı Canlı Test Çubuğu -->
      <div class="admin-card" style="background:linear-gradient(135deg, #142225 0%, #0B4F57 100%); color:#fff; border:none;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
          <div>
            <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.08em; color:#9FE2EA; font-weight:700; margin-bottom:0.25rem;">
              ● Gerçek Zamanlı Ziyaretçi & Eğitim Tıklama Analizi
            </div>
            <h2 style="font-family:var(--font-display); font-size:1.45rem; font-weight:600;">
              Hangi Eğitime Kaç Kişi Tıkladı & Nereden Geldi?
            </h2>
          </div>

          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
            <button type="button" class="btn-secondary" style="background:${analyticsFilterProfile === 'ALL' ? '#fff' : 'rgba(255,255,255,0.12)'}; color:${analyticsFilterProfile === 'ALL' ? '#142225' : '#fff'}; border:none;" data-analytics-filter="ALL">
              Tüm Sayfalar (Birleşik)
            </button>
            <button type="button" class="btn-secondary" style="background:${analyticsFilterProfile === 'rabia-alga' ? '#fff' : 'rgba(255,255,255,0.12)'}; color:${analyticsFilterProfile === 'rabia-alga' ? '#142225' : '#fff'}; border:none;" data-analytics-filter="rabia-alga">
              rabia-alga.php
            </button>
            <button type="button" class="btn-secondary" style="background:${analyticsFilterProfile === 'bedia-kahya-kilic' ? '#fff' : 'rgba(255,255,255,0.12)'}; color:${analyticsFilterProfile === 'bedia-kahya-kilic' ? '#142225' : '#fff'}; border:none;" data-analytics-filter="bedia-kahya-kilic">
              bedia-kahya-kilic.php
            </button>
          </div>
        </div>

        <!-- Canlı Test Simülatörü -->
        <div style="margin-top:1.15rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap;">
          <span style="font-size:0.82rem; color:#D5ECEF;">
            🧪 <strong>Canlı Test:</strong> Aşağıdaki butonlarla Instagram veya WhatsApp'tan örnek ziyaret ve eğitim tıklaması gönderip tabloların anında güncellendiğini test edebilirsiniz:
          </span>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button type="button" class="btn-secondary" style="background:rgba(255,255,255,0.16); color:#fff; border:1px solid rgba(255,255,255,0.28); font-size:0.78rem; padding:0.42rem 0.8rem;" data-sim-event="ig-rabia">
              📸 +1 Instagram → rabia-alga.php (Silva Online Tıkla)
            </button>
            <button type="button" class="btn-secondary" style="background:rgba(255,255,255,0.16); color:#fff; border:1px solid rgba(255,255,255,0.28); font-size:0.78rem; padding:0.42rem 0.8rem;" data-sim-event="wp-bedia">
              💬 +1 WhatsApp → bedia-kahya-kilic.php (Basic DNA Tıkla)
            </button>
          </div>
        </div>
      </div>

      <!-- 4 Ana KPI Kartı -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">
            <span>Toplam Sayfa Girişi</span>
            <span>👁️</span>
          </div>
          <div class="kpi-value">${agg.totalVisits.toLocaleString('tr-TR')}</div>
          <div class="kpi-sub">
            <span class="kpi-delta">Canlı</span>
            <span>Linke toplam giriş sayısı</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">
            <span>Tekil Ziyaretçi</span>
            <span>👤</span>
          </div>
          <div class="kpi-value">${agg.uniqueVisitors.toLocaleString('tr-TR')}</div>
          <div class="kpi-sub">
            <span>Farklı kişi sayısı</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">
            <span>Eğitim Tıklamaları</span>
            <span>🎓</span>
          </div>
          <div class="kpi-value">${agg.totalClicks.toLocaleString('tr-TR')}</div>
          <div class="kpi-sub">
            <span class="kpi-delta">Kayıt CTA</span>
            <span>Seminer butonlarına tıklama</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">
            <span>Eğitime Tıklama Oranı</span>
            <span>📈</span>
          </div>
          <div class="kpi-value">%${agg.ctr}</div>
          <div class="kpi-sub">
            <span>Mobil: %${mobilePct} · PC: %${desktopPct}</span>
          </div>
        </div>
      </div>

      <!-- İki Sütunlu Analiz: 1) Hangi Eğitime Kaç Kişi Tıkladı? 2) Nereden Geldi (Instagram / WhatsApp vb.) -->
      <div class="analytics-grid-2">
        <!-- SOL: Eğitim Bazlı Tıklama Analizi -->
        <div class="admin-card" style="margin-bottom:0;">
          <div class="admin-card-header">
            <div>
              <h3 class="admin-card-title">🎓 Hangi Eğitime Kaç Kişi Tıkladı?</h3>
              <p class="admin-card-subtitle">
                Her bir seminerin aldığı toplam tıklama ve tıklayanların hangi sosyal medyadan geldiği
              </p>
            </div>
          </div>

          <div class="training-stat-list">
            ${agg.trainingsList
              .map((t) => {
                const widthPct = Math.max(6, Math.round((t.clicks / maxTrainingClicks) * 100));
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
                      <div style="font-size:0.76rem; color:var(--text-muted); margin-top:0.15rem;">
                        Sayfa: <code>${escapeHtml(t.profileSlug)}</code> (${escapeHtml(t.profileName)}) · 📅 ${escapeHtml(t.date)}
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
        </div>

        <!-- SAĞ: Ziyaretçiler Nereden Geldi? (Instagram, WhatsApp, YouTube vb.) -->
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          <div class="admin-card" style="margin-bottom:0;">
            <div class="admin-card-header">
              <div>
                <h3 class="admin-card-title">🧭 Ziyaretçiler Nereden Geldi?</h3>
                <p class="admin-card-subtitle">
                  Instagram, WhatsApp, YouTube ve diğer kanallardan gelen ziyaretçi & tıklama dağılımı
                </p>
              </div>
            </div>

            <div class="source-list">
              ${Object.entries(window.ITStore.SOURCE_META)
                .map(([key, meta]) => {
                  const sData = agg.sources[key] || { visits: 0, clicks: 0 };
                  const sharePct =
                    agg.totalVisits > 0 ? Math.round((sData.visits / agg.totalVisits) * 100) : 0;
                  const barPct = Math.max(4, Math.round((sData.visits / maxSourceVisits) * 100));

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

                    <div style="text-align:right; font-family:var(--font-mono); font-size:0.8rem;">
                      <strong>${sData.visits}</strong> giriş (%${sharePct})
                    </div>

                    <div style="text-align:right; font-family:var(--font-mono); font-size:0.78rem; color:var(--accent); font-weight:700;">
                      ${sData.clicks} tık
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>

          <!-- Cihaz ve Günlük Grafik Özeti -->
          <div class="admin-card" style="margin-bottom:0;">
            <div class="admin-card-header" style="margin-bottom:0.9rem;">
              <div>
                <h3 class="admin-card-title">📱 Cihaz & Günlük Trafik Trendi</h3>
                <p class="admin-card-subtitle">
                  Mobil (${agg.devices.mobile}) vs Bilgisayar/PC (${agg.devices.desktop}) giriş oranı
                </p>
              </div>
            </div>

            <div style="display:flex; height:14px; border-radius:999px; overflow:hidden; margin-bottom:0.65rem;">
              <div style="width:${mobilePct}%; background:var(--accent);" title="Mobil %${mobilePct}"></div>
              <div style="width:${desktopPct}%; background:var(--warm);" title="PC %${desktopPct}"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:600; color:var(--text-secondary); margin-bottom:1.25rem;">
              <span>📱 Mobil Arayüzü Gören: %${mobilePct} (${agg.devices.mobile} kişi)</span>
              <span>💻 PC Tasarımını Gören: %${desktopPct} (${agg.devices.desktop} kişi)</span>
            </div>

            <!-- Son 10 Gün Çubuk Grafiği -->
            <div style="display:grid; grid-template-columns:repeat(${agg.dailySeries.length}, 1fr); gap:6px; align-items:end; height:96px; padding-top:10px; border-top:1px dashed var(--border);">
              ${agg.dailySeries
                .map((d) => {
                  const hPct = Math.max(12, Math.round((d.visits / maxDaily) * 100));
                  const shortDate = d.date.slice(5).replace('-', '/');
                  return `
                  <div style="display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; justify-content:flex-end;">
                    <span style="font-family:var(--font-mono); font-size:0.65rem; color:var(--text-muted);">${d.visits}</span>
                    <div style="width:100%; max-width:24px; height:${hPct}%; background:var(--accent); border-radius:4px 4px 0 0;" title="${d.date}: ${d.visits} giriş, ${d.clicks} eğitim tıklaması"></div>
                    <span style="font-family:var(--font-mono); font-size:0.64rem; color:var(--text-muted);">${shortDate}</span>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Son Ziyaret ve Tıklama Hareketleri Tablosu -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h3 class="admin-card-title">⚡ Canlı Ziyaret & Eğitim Tıklama Akışı</h3>
            <p class="admin-card-subtitle">
              Sitede gerçekleşen son girişler, tıklanan seminerler, gelinen kaynak (Instagram, WhatsApp vb.) ve cihaz bilgisi
            </p>
          </div>
        </div>

        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Sayfa (.php)</th>
                <th>İşlem / Tıklanan Eğitim</th>
                <th>Nereden Geldi? (Kaynak)</th>
                <th>Cihaz</th>
              </tr>
            </thead>
            <tbody>
              ${agg.recentEvents
                .slice(0, 15)
                .map((ev) => {
                  const srcMeta = window.ITStore.SOURCE_META[ev.source] || window.ITStore.SOURCE_META.direct;
                  const isTraining = ev.type === 'training_click';
                  return `
                  <tr>
                    <td style="font-family:var(--font-mono); font-size:0.78rem;">${escapeHtml(formatTimeAgo(ev.timestamp))}</td>
                    <td><code>${escapeHtml(ev.profileSlug)}</code></td>
                    <td>
                      <strong style="color:${isTraining ? 'var(--accent)' : 'var(--text)'};">
                        ${isTraining ? '🎓 ' : '👁️ '}${escapeHtml(ev.label)}
                      </strong>
                    </td>
                    <td>
                      <span style="display:inline-flex; align-items:center; gap:0.35rem; padding:0.2rem 0.6rem; border-radius:999px; font-size:0.75rem; font-weight:700; background:${srcMeta.bg}; color:${srcMeta.color};">
                        ● ${escapeHtml(srcMeta.label)}
                      </span>
                    </td>
                    <td>
                      ${ev.device === 'mobile' ? '📱 Mobil' : '💻 Bilgisayar (PC)'}
                    </td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderTrainingsEditor(profile) {
    const trainings = profile.trainings || [];

    return `
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">
              🎓 ${escapeHtml(profile.name)} (<code>${escapeHtml(profile.phpSlug)}</code>) — Seminer & Eğitim Yönetimi
            </h2>
            <p class="admin-card-subtitle">
              Burada yaptığınız her değişiklik kaydedildiğinde doğrudan <strong>${escapeHtml(profile.phpSlug)}</strong> sayfasındaki seminer kartlarına yansır.
            </p>
          </div>
          <div style="display:flex; gap:0.6rem;">
            <button type="button" class="btn-secondary" id="btn-add-training">
              ➕ Yeni Seminer / Eğitim Ekle
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
                  <span class="cms-item-num">Eğitim #${idx + 1}</span>
                  <strong style="font-size:0.95rem;">${escapeHtml(t.title)}</strong>
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
                  <label class="form-label">Seminer / Eğitim Başlığı</label>
                  <input type="text" class="form-input trn-title" value="${escapeHtml(t.title)}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Kategori Rozeti (Örn: ThetaHealing® / Silva Metodu)</label>
                  <input type="text" class="form-input trn-category" value="${escapeHtml(t.category || '')}" />
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Tarih Bilgisi</label>
                  <input type="text" class="form-input trn-date" value="${escapeHtml(t.date)}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Saat Aralığı</label>
                  <input type="text" class="form-input trn-time" value="${escapeHtml(t.time)}" />
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Konum / Mekan (Örn: Nida Kule - İstanbul veya Online - Zoom)</label>
                  <input type="text" class="form-input trn-location" value="${escapeHtml(t.location)}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Katılım Formatı</label>
                  <select class="form-select trn-mode">
                    <option value="Yüz Yüze" ${t.mode === 'Yüz Yüze' ? 'selected' : ''}>Yüz Yüze</option>
                    <option value="Online" ${t.mode === 'Online' ? 'selected' : ''}>Online</option>
                  </select>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Durum Notu</label>
                  <input type="text" class="form-input trn-status" value="${escapeHtml(t.status || 'Kayıtlarımız devam etmektedir')}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Buton Metni (CTA)</label>
                  <input type="text" class="form-input trn-cta" value="${escapeHtml(t.ctaLabel || 'Seminere Katıl & İncele')}" />
                </div>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Başvuru / Satın Alma Linki (Tıklandığında Gidilecek URL)</label>
                <input type="url" class="form-input trn-url" value="${escapeHtml(t.url)}" />
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function renderProfileEditor(profile) {
    return `
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">
              👤 ${escapeHtml(profile.name)} (<code>${escapeHtml(profile.phpSlug)}</code>) — Profil & Biyografi Düzenle
            </h2>
            <p class="admin-card-subtitle">
              Seçili eğitmen sayfasının başlık, biyografi, fotoğraf ve renk ayarlarını güncelleyin.
            </p>
          </div>
          <button type="button" class="btn-primary" id="btn-save-profile">
            💾 Profil Bilgilerini Kaydet
          </button>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Ad Soyad (Sayfa Başlığı)</label>
            <input type="text" class="form-input" id="prof-name" value="${escapeHtml(profile.name)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Unvan / Profesyonel Rol</label>
            <input type="text" class="form-input" id="prof-role" value="${escapeHtml(profile.role)}" />
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Uzmanlık Etiketleri ('·' ile ayırın)</label>
            <input type="text" class="form-input" id="prof-credentials" value="${escapeHtml(profile.credentials)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Profil Fotoğrafı Yolu veya URL</label>
            <input type="text" class="form-input" id="prof-avatar" value="${escapeHtml(profile.avatar)}" />
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Hakkımda Karşılama Başlığı</label>
            <input type="text" class="form-input" id="prof-greeting" value="${escapeHtml(profile.greeting)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Tema Vurgu Rengi (Hex)</label>
            <div style="display:flex; gap:0.5rem;">
              <input type="color" id="prof-color-picker" value="${escapeHtml(profile.accentColor || '#0B6E78')}" style="width:48px; height:40px; border:1px solid var(--border); border-radius:8px; cursor:pointer;" />
              <input type="text" class="form-input" id="prof-accent" value="${escapeHtml(profile.accentColor || '#0B6E78')}" />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Hakkımda / Biyografi Metni</label>
          <textarea class="form-textarea" id="prof-bio">${escapeHtml(profile.bio)}</textarea>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">"Daha Fazlası" Buton Metni</label>
            <input type="text" class="form-input" id="prof-more-label" value="${escapeHtml(profile.moreLabel || 'Hakkımda Daha Fazlası')}" />
          </div>
          <div class="form-group">
            <label class="form-label">"Daha Fazlası" Hedef Link (URL)</label>
            <input type="url" class="form-input" id="prof-more-url" value="${escapeHtml(profile.moreUrl || '')}" />
          </div>
        </div>
      </div>
    `;
  }

  function renderMediaEditor(profile) {
    const socials = profile.socials || [];
    const videos = profile.videos || [];

    return `
      <!-- Sosyal Medya Bağlantıları -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">
              🔗 ${escapeHtml(profile.name)} (<code>${escapeHtml(profile.phpSlug)}</code>) — Sosyal Medya İkonları & Linkleri
            </h2>
            <p class="admin-card-subtitle">
              Profil kartının altındaki sosyal medya butonlarını düzenleyin veya gizleyin.
            </p>
          </div>
          <button type="button" class="btn-primary" id="btn-save-media">
            💾 Sosyal Medya & Videoları Kaydet
          </button>
        </div>

        ${socials
          .map(
            (s, idx) => `
          <div class="cms-item-card" data-social-index="${idx}" style="padding:1rem;">
            <div style="display:grid; grid-template-columns:140px 1fr 1.5fr 110px; gap:0.75rem; align-items:center;">
              <div>
                <span class="cms-item-num" style="text-transform:uppercase;">${escapeHtml(s.platform)}</span>
              </div>
              <div>
                <input type="text" class="form-input soc-label" value="${escapeHtml(s.label)}" placeholder="Buton Adı" />
              </div>
              <div>
                <input type="text" class="form-input soc-url" value="${escapeHtml(s.url)}" placeholder="https://..." />
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

      <!-- YouTube Videoları -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">▶ YouTube Video Rehberler</h2>
            <p class="admin-card-subtitle">
              Sayfada gömülü (embed) olarak gösterilen YouTube videoları
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
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Video Başlığı</label>
                <input type="text" class="form-input vid-title" value="${escapeHtml(v.title)}" />
              </div>
              <div class="form-group">
                <label class="form-label">Alt Açıklama</label>
                <input type="text" class="form-input vid-subtitle" value="${escapeHtml(v.subtitle || '')}" />
              </div>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">YouTube Embed veya Watch Linki</label>
              <input type="text" class="form-input vid-url" value="${escapeHtml(v.embedUrl)}" />
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  function renderLinksGenerator(profile) {
    const baseUrl = window.location.origin + window.location.pathname.replace(/admin\.(html|php).*$/, '') + profile.htmlSlug;
    const prodUrl = `https://icimizdekitamirci.com/${profile.phpSlug}`;

    const channels = [
      { key: 'instagram', name: 'Instagram Bio Linki', desc: 'Instagram profil biyografisine eklenecek takip linki' },
      { key: 'whatsapp', name: 'WhatsApp Paylaşım Linki', desc: 'WhatsApp durum, grup veya mesajlarında paylaşılacak link' },
      { key: 'youtube', name: 'YouTube Açıklama Linki', desc: 'Farkındalık Sohbetleri video açıklamaları için link' },
      { key: 'twitter', name: 'X (Twitter) Linki', desc: 'X profili ve gönderileri için takip linki' }
    ];

    return `
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title">
              🚀 ${escapeHtml(profile.name)} (<code>${escapeHtml(profile.phpSlug)}</code>) — Kaynak Takip Linkleri (Instagram / WhatsApp Analitiği İçin)
            </h2>
            <p class="admin-card-subtitle">
              Ziyaretçinin Instagram'dan mı yoksa WhatsApp'tan mı geldiğini %100 doğrulukla yakalamak için bu hazır linkleri kullanabilirsiniz. (Ayrıca sistem <code>document.referrer</code> ve <code>fbclid</code> üzerinden otomatik tespit de yapar.)
            </p>
          </div>
        </div>

        <div class="training-stat-list">
          ${channels
            .map((ch) => {
              const liveTestLink = `${baseUrl}?ref=${ch.key}`;
              const realDomainLink = `${prodUrl}?ref=${ch.key}`;
              return `
              <div class="training-stat-item">
                <div class="training-stat-top">
                  <div>
                    <div class="training-stat-name">${escapeHtml(ch.name)}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(ch.desc)}</div>
                  </div>
                  <div style="display:flex; gap:0.5rem;">
                    <button type="button" class="btn-secondary" data-copy-text="${escapeHtml(liveTestLink)}">
                      📋 Test Linkini Kopyala
                    </button>
                    <a href="${escapeHtml(liveTestLink)}" target="_blank" class="btn-primary">
                      ↗ Bu Kaynakla Sayfayı Aç
                    </a>
                  </div>
                </div>
                <div style="font-family:var(--font-mono); font-size:0.78rem; padding:0.55rem 0.8rem; background:var(--surface); border:1px solid var(--border); border-radius:8px; color:var(--text-secondary); overflow-x:auto;">
                  Canlı Demo: ${escapeHtml(liveTestLink)}<br/>
                  Alan Adı: ${escapeHtml(realDomainLink)}
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  function renderAdmin() {
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
    } else if (activeSection === 'links') {
      sectionHtml = renderLinksGenerator(profile);
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
                <span>CMS & Analitik Paneli</span>
              </div>
            </div>

            <div class="admin-nav-group-label">Raporlama & Analiz</div>
            <nav class="admin-nav">
              <button type="button" class="admin-nav-btn ${activeSection === 'analytics' ? 'active' : ''}" data-nav="analytics">
                <span>📊 Analiz & İstatistikler</span>
                <span class="admin-nav-badge">Canlı</span>
              </button>
              <button type="button" class="admin-nav-btn ${activeSection === 'links' ? 'active' : ''}" data-nav="links">
                <span>🚀 IG / WP Takip Linkleri</span>
              </button>
            </nav>

            <div class="admin-nav-group-label">Sayfa İçerik Yönetimi (${escapeHtml(profile.phpSlug)})</div>
            <nav class="admin-nav">
              <button type="button" class="admin-nav-btn ${activeSection === 'trainings' ? 'active' : ''}" data-nav="trainings">
                <span>🎓 Seminer & Eğitimler</span>
                <span class="admin-nav-badge">${(profile.trainings || []).length}</span>
              </button>
              <button type="button" class="admin-nav-btn ${activeSection === 'profile' ? 'active' : ''}" data-nav="profile">
                <span>👤 Profil & Biyografi</span>
              </button>
              <button type="button" class="admin-nav-btn ${activeSection === 'media' ? 'active' : ''}" data-nav="media">
                <span>🔗 Sosyal Medya & Video</span>
              </button>
            </nav>
          </div>

          <div class="admin-sidebar-footer">
            <div style="font-size:0.72rem; color:#8FA6AA; padding:0 0.25rem;">Canlı Sayfaları Görüntüle:</div>
            <a href="rabia-alga.html" target="_blank" class="admin-live-link">
              <span>🟢 rabia-alga.php</span>
              <span>↗</span>
            </a>
            <a href="bedia-kahya-kilic.html" target="_blank" class="admin-live-link">
              <span>🟢 bedia-kahya-kilic.php</span>
              <span>↗</span>
            </a>
            <button type="button" id="btn-reset-defaults" style="margin-top:0.4rem; font-size:0.74rem; color:#FCA5A5; text-align:left; padding:0.4rem 0.5rem;">
              ↺ Varsayılan Verilere Sıfırla
            </button>
          </div>
        </aside>

        <!-- SAĞ ANA ALAN -->
        <div class="admin-main">
          <!-- Üst Çubuk: Hangi Sayfa Düzenleniyor Seçicisi -->
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

          <!-- İçerik Gövdesi -->
          <main class="admin-content">
            ${sectionHtml}
          </main>
        </div>
      </div>
    `;

    bindAdminEvents(profile);
  }

  function collectTrainingsFromDOM(profile) {
    const cards = document.querySelectorAll('[data-training-index]');
    const updated = [];
    cards.forEach((card, idx) => {
      const existing = (profile.trainings || [])[idx] || {};
      updated.push({
        id: existing.id || `trn-${profile.id}-${Date.now()}-${idx}`,
        title: card.querySelector('.trn-title')?.value.trim() || 'Yeni Seminer',
        category: card.querySelector('.trn-category')?.value.trim() || 'Seminer',
        date: card.querySelector('.trn-date')?.value.trim() || '',
        time: card.querySelector('.trn-time')?.value.trim() || '',
        location: card.querySelector('.trn-location')?.value.trim() || '',
        mode: card.querySelector('.trn-mode')?.value || 'Yüz Yüze',
        status: card.querySelector('.trn-status')?.value.trim() || 'Kayıtlarımız devam etmektedir',
        ctaLabel: card.querySelector('.trn-cta')?.value.trim() || 'Seminere Katıl & İncele',
        url: card.querySelector('.trn-url')?.value.trim() || '#',
        active: card.querySelector('.trn-active')?.checked ?? true
      });
    });
    return updated;
  }

  function bindAdminEvents(profile) {
    // Sol menü geçişi
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSection = btn.getAttribute('data-nav');
        renderAdmin();
      });
    });

    // Üst bar: rabia-alga.php vs bedia-kahya-kilic.php seçimi
    document.querySelectorAll('[data-select-profile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedProfileId = btn.getAttribute('data-select-profile');
        if (analyticsFilterProfile !== 'ALL') {
          analyticsFilterProfile = selectedProfileId;
        }
        renderAdmin();
        const selectedProf = window.ITStore.getProfile(selectedProfileId);
        showToast(`${selectedProf.phpSlug} (${selectedProf.name}) seçildi.`);
      });
    });

    // Analitik filtre butonları
    document.querySelectorAll('[data-analytics-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        analyticsFilterProfile = btn.getAttribute('data-analytics-filter');
        if (analyticsFilterProfile !== 'ALL') {
          selectedProfileId = analyticsFilterProfile;
        }
        renderAdmin();
      });
    });

    // Canlı Analitik Simülasyon Butonları
    document.querySelectorAll('[data-sim-event]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-sim-event');
        if (type === 'ig-rabia') {
          const ra = window.ITStore.getProfile('rabia-alga');
          const trn = ra.trainings[1] || ra.trainings[0];
          window.ITStore.recordVisit('rabia-alga', 'instagram', 'mobile');
          if (trn) window.ITStore.recordTrainingClick('rabia-alga', trn, 'instagram', 'mobile');
          showToast('Instagram -> rabia-alga.php ziyareti ve eğitim tıklaması eklendi!');
        } else if (type === 'wp-bedia') {
          const bk = window.ITStore.getProfile('bedia-kahya-kilic');
          const trn = bk.trainings[0];
          window.ITStore.recordVisit('bedia-kahya-kilic', 'whatsapp', 'mobile');
          if (trn) window.ITStore.recordTrainingClick('bedia-kahya-kilic', trn, 'whatsapp', 'mobile');
          showToast('WhatsApp -> bedia-kahya-kilic.php ziyareti ve eğitim tıklaması eklendi!');
        }
        renderAdmin();
      });
    });

    // Seminer Kaydetme
    const btnSaveTrainings = document.getElementById('btn-save-trainings');
    if (btnSaveTrainings) {
      btnSaveTrainings.addEventListener('click', () => {
        profile.trainings = collectTrainingsFromDOM(profile);
        window.ITStore.updateProfile(selectedProfileId, profile);
        renderAdmin();
        showToast(`${profile.phpSlug} seminer takvimi güncellendi ve yayına alındı!`);
      });
    }

    // Yeni Seminer Ekleme
    const btnAddTraining = document.getElementById('btn-add-training');
    if (btnAddTraining) {
      btnAddTraining.addEventListener('click', () => {
        profile.trainings = collectTrainingsFromDOM(profile);
        profile.trainings.push({
          id: 'trn-' + Date.now(),
          title: 'Yeni Seminer / Eğitim Programı',
          category: 'ThetaHealing®',
          date: '15-16 Mayıs 2027',
          time: '09.30 - 17.30',
          location: 'İstanbul / Online',
          mode: 'Yüz Yüze',
          status: 'Kayıtlarımız devam etmektedir',
          ctaLabel: 'Seminere Katıl & İncele',
          url: 'https://www.rabiaalga.com/',
          active: true
        });
        window.ITStore.updateProfile(selectedProfileId, profile);
        renderAdmin();
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
        renderAdmin();
        showToast('Seminer silindi ve sayfa güncellendi.');
      });
    });

    // Profil Bilgilerini Kaydetme
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const colorPicker = document.getElementById('prof-color-picker');
    const colorInput = document.getElementById('prof-accent');
    if (colorPicker && colorInput) {
      colorPicker.addEventListener('input', () => {
        colorInput.value = colorPicker.value;
      });
    }
    if (btnSaveProfile) {
      btnSaveProfile.addEventListener('click', () => {
        profile.name = document.getElementById('prof-name')?.value.trim() || profile.name;
        profile.role = document.getElementById('prof-role')?.value.trim() || profile.role;
        profile.credentials = document.getElementById('prof-credentials')?.value.trim() || '';
        profile.avatar = document.getElementById('prof-avatar')?.value.trim() || profile.avatar;
        profile.greeting = document.getElementById('prof-greeting')?.value.trim() || '';
        profile.accentColor = document.getElementById('prof-accent')?.value.trim() || '#0B6E78';
        profile.bio = document.getElementById('prof-bio')?.value.trim() || '';
        profile.moreLabel = document.getElementById('prof-more-label')?.value.trim() || 'Hakkımda Daha Fazlası';
        profile.moreUrl = document.getElementById('prof-more-url')?.value.trim() || '';

        window.ITStore.updateProfile(selectedProfileId, profile);
        renderAdmin();
        showToast(`${profile.phpSlug} profil bilgileri güncellendi!`);
      });
    }

    // Sosyal Medya & Videoları Kaydetme
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
            subtitle: card.querySelector('.vid-subtitle')?.value.trim() || '',
            embedUrl: normalizeYoutubeEmbed(card.querySelector('.vid-url')?.value),
            active: true
          });
        });
        profile.videos = updatedVideos;

        window.ITStore.updateProfile(selectedProfileId, profile);
        renderAdmin();
        showToast(`${profile.phpSlug} sosyal medya ve video ayarları kaydedildi!`);
      });
    }

    // Yeni Video Ekle
    const btnAddVideo = document.getElementById('btn-add-video');
    if (btnAddVideo) {
      btnAddVideo.addEventListener('click', () => {
        profile.videos = profile.videos || [];
        profile.videos.push({
          id: 'vid-' + Date.now(),
          title: 'Yeni Farkındalık Sohbeti Videosu',
          subtitle: 'Video açıklaması',
          embedUrl: 'https://www.youtube.com/embed/BgTwMiPETuY',
          active: true
        });
        window.ITStore.updateProfile(selectedProfileId, profile);
        renderAdmin();
        showToast('Yeni video alanı eklendi.');
      });
    }

    // Video Sil
    document.querySelectorAll('[data-delete-video]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-delete-video'), 10);
        profile.videos.splice(idx, 1);
        window.ITStore.updateProfile(selectedProfileId, profile);
        renderAdmin();
        showToast('Video kaldırıldı.');
      });
    });

    // Link Kopyalama
    document.querySelectorAll('[data-copy-text]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-copy-text');
        navigator.clipboard?.writeText(text).catch(() => {});
        showToast('Takip linki panoya kopyalandı!');
      });
    });

    // Varsayılanlara Sıfırla
    const btnReset = document.getElementById('btn-reset-defaults');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        window.ITStore.resetToDefaults();
        renderAdmin();
        showToast('Tüm profil verileri ilk haline sıfırlandı.');
      });
    }
  }

  renderAdmin();

  // Canlı senkronizasyon: açık olan profil sayfasından bir eğitime tıklandığında admin ekranındaki sayılar anında artar!
  window.ITStore.onSync(() => {
    if (activeSection === 'analytics') {
      renderAdmin();
    }
  });
})();
