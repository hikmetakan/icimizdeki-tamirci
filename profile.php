<?php
/**
 * İçimizdeki Tamirci — Dinamik Eğitmen Link-in-Bio Sayfası (profile.php)
 * Tüm eğitmen profillerini dinamik olarak sunar ve sunucu verisini doğrudan HTML'e gömer.
 */

header('X-LiteSpeed-Cache-Control: no-cache, no-store');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
header('Pragma: no-cache');
header('Expires: 0');

$slug = '';
if (isset($_GET['slug'])) {
    $slug = preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['slug']);
}
if (empty($slug)) {
    $slug = 'rabia-alga';
}

$dataFile = __DIR__ . '/data/sqlite_sync.json';
$serverInitialState = file_exists($dataFile) ? @file_get_contents($dataFile) : '';
?>
<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title>Eğitmen Profili — İçimizdeki Tamirci</title>
    <meta
      name="description"
      content="İçimizdeki Tamirci — Bütünsel dönüşüm ve farkındalık eğitimleri seminer takvimi."
    />
    <link rel="stylesheet" href="css/modern.css?v=<?php echo time(); ?>" />
  </head>
  <body data-profile-id="<?php echo htmlspecialchars($slug, ENT_QUOTES, 'UTF-8'); ?>">
    <script id="server-initial-state" type="application/json">
<?php echo !empty($serverInitialState) ? $serverInitialState : '{}'; ?>
    </script>
    <div id="app-root"></div>
    <script src="js/sqlite-engine.js?v=<?php echo time(); ?>"></script>
    <script src="js/profile-app.js?v=<?php echo time(); ?>"></script>
  </body>
</html>
