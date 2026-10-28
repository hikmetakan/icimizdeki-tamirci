<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    if ($input) {
        @file_put_contents($dataDir . '/sqlite_sync.json', $input);
        echo json_encode(['ok' => true, 'engine' => 'sqlite3']);
        exit;
    }
}

$file = $dataDir . '/sqlite_sync.json';
if (file_exists($file)) {
    echo file_get_contents($file);
} else {
    echo json_encode(['ok' => true, 'tables' => null]);
}
