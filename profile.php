<?php
/**
 * İçimizdeki Tamirci — Dinamik Eğitmen Link-in-Bio Sayfası (profile.php)
 * Tüm eğitmen profillerini dinamik olarak sunar.
 */

// URL'den veya query string'den gelen slug'ı temizle
$slug = '';
if (isset($_GET['slug'])) {
    $slug = preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['slug']);
}

// Eğer boşsa varsayılan
if (empty($slug)) {
    $slug = 'rabia-alga';
}
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
    <link rel="stylesheet" href="css/modern.css" />
  </head>
  <body data-profile-id="<?php echo htmlspecialchars($slug, ENT_QUOTES, 'UTF-8'); ?>">
    <div id="app-root"></div>
    <script src="js/sqlite-engine.js"></script>
    <script src="js/profile-app.js"></script>
  </body>
</html>
