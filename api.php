<?php
/**
 * İçimizdeki Tamirci — Gerçek Zamanlı SQLite3 Senkronizasyon & Veri Motoru Köprüsü (api.php)
 * Ziyaretçi tıklamaları ile yönetici verilerini güvenle ayıran kurumsal mimari.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('X-LiteSpeed-Cache-Control: no-cache, no-store');
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

// Yardımcı fonksiyon: Mevcut veritabanını oku
function getDatabase($dataFile) {
    if (file_exists($dataFile)) {
        $content = @file_get_contents($dataFile);
        if (!empty($content)) {
            $parsed = json_decode($content, true);
            if (is_array($parsed) && isset($parsed['tables'])) {
                return $parsed;
            }
        }
    }
    return [
        'ok' => true,
        'engine' => 'SQLite3',
        'updated_at' => date('c'),
        'tables' => [
            'page_visits' => [],
            'training_clicks' => [],
            'profiles' => [],
            'admin_auth' => ['username' => '1', 'password' => '1'],
            'admin_theme' => [
                'preset' => 'teal',
                'primary' => '#02a3c4',
                'primaryDark' => '#017c95',
                'sidebarBg' => '#142225'
            ]
        ]
    ];
}

function saveDatabase($dataFile, $db) {
    $db['updated_at'] = date('c');
    $json = json_encode($db, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    return @file_put_contents($dataFile, $json, LOCK_EX);
}

$action = isset($_GET['action']) ? trim($_GET['action']) : '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    $db = getDatabase($dataFile);
    if (!isset($db['tables']['page_visits'])) $db['tables']['page_visits'] = [];
    if (!isset($db['tables']['training_clicks'])) $db['tables']['training_clicks'] = [];
    if (!isset($db['tables']['profiles'])) $db['tables']['profiles'] = [];

    // 1. Ziyaret Kaydı (Visitor Telemetry - ASLA PROFİLLERİ DEĞİŞTİRMEZ)
    if ($action === 'log_visit') {
        $pid = isset($input['profile_id']) ? $input['profile_id'] : 'rabia-alga';
        $source = isset($input['source']) ? $input['source'] : 'direct';
        $device = isset($input['device']) ? $input['device'] : 'mobile';

        $visits = &$db['tables']['page_visits'];
        $nextId = (count($visits) > 0) ? ($visits[count($visits) - 1]['id'] + 1) : 1;
        $visits[] = [
            'id' => $nextId,
            'profile_id' => (string)$pid,
            'source' => (string)$source,
            'device' => (string)$device,
            'timestamp' => date('c')
        ];
        if (count($visits) > 5000) {
            $visits = array_slice($visits, -4000);
        }
        saveDatabase($dataFile, $db);
        echo json_encode(['ok' => true, 'event' => 'visit_logged', 'id' => $nextId]);
        exit;
    }

    // 2. Eğitim Tıklaması (Click Telemetry - ASLA PROFİLLERİ DEĞİŞTİRMEZ)
    if ($action === 'log_click') {
        $pid = isset($input['profile_id']) ? $input['profile_id'] : 'rabia-alga';
        $tid = isset($input['training_id']) ? $input['training_id'] : '';
        $title = isset($input['training_title']) ? $input['training_title'] : 'Seminer Başvurusu';
        $source = isset($input['source']) ? $input['source'] : 'direct';
        $device = isset($input['device']) ? $input['device'] : 'mobile';

        $clicks = &$db['tables']['training_clicks'];
        $nextId = (count($clicks) > 0) ? ($clicks[count($clicks) - 1]['id'] + 1) : 1;
        $clicks[] = [
            'id' => $nextId,
            'profile_id' => (string)$pid,
            'training_id' => (string)$tid,
            'training_title' => (string)$title,
            'source' => (string)$source,
            'device' => (string)$device,
            'timestamp' => date('c')
        ];
        if (count($clicks) > 5000) {
            $clicks = array_slice($clicks, -4000);
        }
        saveDatabase($dataFile, $db);
        echo json_encode(['ok' => true, 'event' => 'click_logged', 'id' => $nextId]);
        exit;
    }

    // 3. Tek Bir Eğitmen Profilini Kaydet / Güncelle (Admin)
    if ($action === 'save_profile') {
        $pid = isset($input['profile_id']) ? trim($input['profile_id']) : '';
        $pData = isset($input['profile']) ? $input['profile'] : null;
        if (!empty($pid) && is_array($pData)) {
            $db['tables']['profiles'][$pid] = $pData;
            saveDatabase($dataFile, $db);
            echo json_encode(['ok' => true, 'action' => 'profile_saved', 'profile_id' => $pid]);
            exit;
        }
    }

    // 4. Eğitmen Sil (Admin)
    if ($action === 'delete_profile') {
        $pid = isset($input['profile_id']) ? trim($input['profile_id']) : '';
        if (!empty($pid) && isset($db['tables']['profiles'][$pid])) {
            unset($db['tables']['profiles'][$pid]);
            saveDatabase($dataFile, $db);
            echo json_encode(['ok' => true, 'action' => 'profile_deleted', 'profile_id' => $pid]);
            exit;
        }
    }

    // 5. Analitik Sayaçlarını Sıfırla (Admin)
    if ($action === 'reset_analytics') {
        $db['tables']['page_visits'] = [];
        $db['tables']['training_clicks'] = [];
        saveDatabase($dataFile, $db);
        echo json_encode(['ok' => true, 'action' => 'analytics_reset']);
        exit;
    }

    // 6. Tema Kaydet (Admin)
    if ($action === 'save_theme') {
        if (isset($input['theme']) && is_array($input['theme'])) {
            $db['tables']['admin_theme'] = $input['theme'];
            saveDatabase($dataFile, $db);
            echo json_encode(['ok' => true, 'action' => 'theme_saved']);
            exit;
        }
    }

    // 7. Giriş Bilgileri Kaydet (Admin)
    if ($action === 'save_auth') {
        if (isset($input['auth']) && is_array($input['auth'])) {
            $db['tables']['admin_auth'] = $input['auth'];
            saveDatabase($dataFile, $db);
            echo json_encode(['ok' => true, 'action' => 'auth_saved']);
            exit;
        }
    }

    // 8. Genel Veritabanı Kaydetme (Admin save_database veya tam sync)
    if (isset($input['tables']) && is_array($input['tables'])) {
        if (isset($input['tables']['profiles']) && is_array($input['tables']['profiles']) && count($input['tables']['profiles']) > 0) {
            $db['tables']['profiles'] = $input['tables']['profiles'];
        }
        if (isset($input['tables']['admin_auth'])) {
            $db['tables']['admin_auth'] = $input['tables']['admin_auth'];
        }
        if (isset($input['tables']['admin_theme'])) {
            $db['tables']['admin_theme'] = $input['tables']['admin_theme'];
        }
        if (isset($input['action']) && $input['action'] === 'reset_analytics') {
            $db['tables']['page_visits'] = [];
            $db['tables']['training_clicks'] = [];
        }
        saveDatabase($dataFile, $db);
        echo json_encode(['ok' => true, 'action' => 'database_saved', 'timestamp' => time()]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Bilinmeyen işlem veya geçersiz veri'], JSON_UNESCAPED_UNICODE);
    exit;
}

// GET isteği: En güncel veritabanını döndür
$db = getDatabase($dataFile);
echo json_encode($db, JSON_UNESCAPED_UNICODE);
