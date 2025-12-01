<?php
require_once __DIR__ . '/../config/database_cli.php';

$db = new Database();
$pdo = $db->getConnection();

// Dohvati sve tablice u bazi
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

$data = [];

foreach ($tables as $table) {
    $stmt = $pdo->query("SELECT * FROM `$table`");
    $data[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Spremi u JSON file
file_put_contents(__DIR__ . "/database_seed_data.json", json_encode($data, JSON_PRETTY_PRINT));

echo "✅ Database export complete → database_seed_data.json\n";
