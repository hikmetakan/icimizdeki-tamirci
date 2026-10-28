<?php
/**
 * İçimizdeki Tamirci — Ana Karşılama Portalı (index.php)
 */

header('X-LiteSpeed-Cache-Control: no-cache, no-store');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
header('Pragma: no-cache');
header('Expires: 0');

$dataFile = __DIR__ . '/data/sqlite_sync.json';
$serverInitialState = file_exists($dataFile) ? @file_get_contents($dataFile) : '';
?>
<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>İçimizdeki Tamirci — Portalı</title>
    <meta
      name="description"
      content="İçimizdeki Tamirci — Rabia Alga ve Bedia Kahya Kılıç modern Link-in-Bio sayfaları ve seminer takvimi."
    />
    <link rel="stylesheet" href="css/modern.css?v=<?php echo time(); ?>" />
    <style>
      .portal-wrap {
        width: 100%;
        max-width: 640px;
        margin: 2.5rem auto;
        padding: 0 1.25rem;
      }
      .portal-card {
        background: #ffffff;
        border: 1px solid var(--border-light);
        border-radius: 28px;
        padding: 2.5rem 2rem;
        box-shadow: var(--shadow-card);
        text-align: center;
        margin-bottom: 1.5rem;
      }
      .portal-logo-img {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 8px 22px rgba(2, 163, 196, 0.25);
        border: 3px solid #ffffff;
        outline: 2px solid var(--primary-soft);
        margin-bottom: 1.15rem;
        display: inline-block;
        transition: transform 0.3s ease;
      }
      .portal-logo-img:hover {
        transform: scale(1.05);
      }
      .portal-title {
        font-family: var(--font-display);
        font-size: 1.85rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 0.5rem;
      }
      .portal-desc {
        font-size: 0.95rem;
        color: var(--text-secondary);
        margin-bottom: 2rem;
        line-height: 1.6;
      }
      .profile-item-btn {
        display: flex;
        align-items: center;
        gap: 1.15rem;
        padding: 1.15rem 1.35rem;
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 20px;
        margin-bottom: 1rem;
        transition: all 0.22s ease;
        text-align: left;
        text-decoration: none;
      }
      .profile-item-btn:hover {
        transform: translateY(-2px);
        border-color: var(--primary);
        box-shadow: var(--shadow-hover);
        background: #ffffff;
      }
      .profile-thumb {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid var(--primary-soft);
        flex-shrink: 0;
      }
      .profile-item-name {
        font-size: 1.15rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 0.2rem;
      }
      .profile-item-role {
        font-size: 0.84rem;
        color: var(--text-muted);
        white-space: pre-line;
        line-height: 1.4;
      }
      .portal-footer {
        margin-top: 2.25rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-light);
        font-size: 0.84rem;
        color: var(--text-muted);
        line-height: 1.7;
      }
      .portal-footer a {
        color: var(--primary);
        font-weight: 600;
        text-decoration: none;
        transition: color 0.15s ease;
      }
      .portal-footer a:hover {
        color: var(--primary-dark);
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <script id="server-initial-state" type="application/json">
<?php echo !empty($serverInitialState) ? $serverInitialState : '{}'; ?>
    </script>
    <main class="portal-wrap">
      <div class="portal-card">
        <img src="assets/images/tukan-logo.png" alt="İçimizdeki Tamirci Tukan" class="portal-logo-img" />
        <h1 class="portal-title">İçimizdeki Tamirci</h1>
        <p class="portal-desc">
          Bütünsel dönüşüm ve farkındalık eğitimleri seminer takvimi ve eğitmen profilleri
        </p>

        <div id="portal-profiles-list">
          <a href="rabia-alga" class="profile-item-btn">
            <img src="assets/images/RabiaAlga.jpg" alt="Rabia Alga" class="profile-thumb" />
            <div style="flex:1;">
              <div class="profile-item-name">Rabia Alga</div>
              <div class="profile-item-role">Yüksek Mimar · ThetaHealing® & Silva Metodu Eğitmeni</div>
            </div>
            <span style="font-size:1.2rem; color:var(--primary);">↗</span>
          </a>

          <a href="bedia-kahya-kilic" class="profile-item-btn">
            <img src="assets/images/BediaKahyaKilic.jpg" alt="Bedia Kahya Kılıç" class="profile-thumb" />
            <div style="flex:1;">
              <div class="profile-item-name">Bedia Kahya Kılıç</div>
              <div class="profile-item-role">Endüstri Mühendisi (MBA) · ThetaHealing® Eğitmeni</div>
            </div>
            <span style="font-size:1.2rem; color:var(--primary);">↗</span>
          </a>
        </div>

        <footer class="portal-footer">
          <div>© 2026 İçimizdeki Tamirci | Bütün Hakları Saklıdır.</div>
          <div>created by <a href="https://www.shenajans.com/" target="_blank" rel="noopener noreferrer">ShenAjans</a></div>
        </footer>
      </div>
    </main>

    <script src="js/sqlite-engine.js?v=<?php echo time(); ?>"></script>
    <script>
      (function() {
        function escapeHtml(str) {
          return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        }

        function renderPortalProfiles() {
          if (!window.ITStore) return;
          const profiles = window.ITStore.getAllProfiles();
          const listEl = document.getElementById('portal-profiles-list');
          if (!listEl || !profiles) return;
          const entries = Object.values(profiles);
          if (!entries.length) return;
          listEl.innerHTML = entries.map(function(p) {
            return `
              <a href="${escapeHtml(p.slug || p.id)}" class="profile-item-btn">
                <img src="${escapeHtml(p.avatar || 'assets/images/RabiaAlga.jpg')}" alt="${escapeHtml(p.name)}" class="profile-thumb" />
                <div style="flex:1;">
                  <div class="profile-item-name">${escapeHtml(p.name)}</div>
                  <div class="profile-item-role">${escapeHtml(p.role || '')}</div>
                </div>
                <span style="font-size:1.2rem; color:var(--primary);">↗</span>
              </a>
            `;
          }).join('');
        }

        renderPortalProfiles();
        if (window.ITStore) {
          window.ITStore.onSync(renderPortalProfiles);
          window.ITStore.pullFromServer().then(renderPortalProfiles);
        }
      })();
    </script>
  </body>
</html>
