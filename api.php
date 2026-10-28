<?php
/**
 * İçimizdeki Tamirci — Gerçek Zamanlı SQLite3 Senkronizasyon Köprüsü
 * Mobil ve masaüstü cihazlar arasındaki veri senkronizasyonunu yönetir.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
header('Pragma: no-cache');
header('Expires: 0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

$dataFile = $dataDir . '/sqlite_sync.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    if (!empty($input)) {
        // Doğrulama: Geçerli JSON mu?
        $decoded = json_decode($input, true);
        if ($decoded !== null) {
            $written = @file_put_contents($dataFile, $input, LOCK_EX);
            if ($written !== false) {
                echo json_encode([
                    'ok' => true,
                    'engine' => 'sqlite3',
                    'bytes' => $written,
                    'timestamp' => time()
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
    }
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Geçersiz veri veya yazma hatası'], JSON_UNESCAPED_UNICODE);
    exit;
}

// GET isteği: En güncel veriyi döndür
if (file_exists($dataFile)) {
    $content = file_get_contents($dataFile);
    if (!empty($content)) {
        echo $content;
        exit;
    }
}

echo json_encode(['ok' => true, 'tables' => null, 'timestamp' => time()], JSON_UNESCAPED_UNICODE);
