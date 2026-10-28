<?php
/**
 * İçimizdeki Tamirci — Yönetim ve Analitik Paneli (admin.php)
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
    <title>Yönetim & Analitik Paneli | İçimizdeki Tamirci</title>
    <link rel="stylesheet" href="css/modern.css?v=<?php echo time(); ?>" />
    <link rel="stylesheet" href="css/admin.css?v=<?php echo time(); ?>" />
  </head>
  <body class="admin-body">
    <script id="server-initial-state" type="application/json">
<?php echo !empty($serverInitialState) ? $serverInitialState : '{}'; ?>
    </script>
    <div id="admin-root"></div>
    <script src="js/sqlite-engine.js?v=<?php echo time(); ?>"></script>
    <script src="js/admin-app.js?v=<?php echo time(); ?>"></script>
  </body>
</html>
