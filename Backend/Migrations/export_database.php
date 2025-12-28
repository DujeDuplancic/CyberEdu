<?php
require_once __DIR__ . '/../config/database_cli.php';

$pdo = (new Database())->getConnection();

$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

echo "📋 Pronađene tablice:\n";
foreach ($tables as $table) {
    echo "  - $table\n";
}

$data = [];

foreach ($tables as $table) {
    if ($table === 'migrations') continue;
    
    echo "\n🔍 Učitavam tablicu: $table\n";
    
    // Provjeri broj redaka
    $count = $pdo->query("SELECT COUNT(*) as cnt FROM `$table`")->fetch(PDO::FETCH_ASSOC);
    echo "   Broj redaka: " . $count['cnt'] . "\n";
    
    $stmt = $pdo->query("SELECT * FROM `$table`");
    
    if ($stmt === false) {
        echo "   ❌ Greška pri čitanju tablice!\n";
        $error = $pdo->errorInfo();
        echo "   PDO error: " . $error[2] . "\n";
        // Dodaj praznu tablicu ipak
        $data[$table] = [];
        continue;
    }
    
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "   Učitano redaka: " . count($rows) . "\n";
    
    // UVIJEK dodaj tablicu, čak i ako je prazna
    $data[$table] = $rows;
    echo "   ✅ Tablica dodana u export\n";
}

echo "\n📊 Tablice koje će biti eksportirane:\n";
foreach (array_keys($data) as $table) {
    $count = count($data[$table]);
    echo "  - $table ($count redaka)\n";
}

file_put_contents(
    __DIR__ . '/database_seed_data.json',
    json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

echo "\n✅ Full database export completed\n";
echo "📁 JSON file: " . __DIR__ . '/database_seed_data.json' . "\n";