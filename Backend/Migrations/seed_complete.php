<?php
require_once __DIR__ . '/../config/database_cli.php';

$db = new Database();
$pdo = $db->getConnection();

// Učitaj JSON
$jsonPath = __DIR__ . "/database_seed_data.json";

if (!file_exists($jsonPath)) {
    die("❌ JSON file not found! Run export_database.php first.\n");
}

$data = json_decode(file_get_contents($jsonPath), true);

// Ubaci podatke u tablice
foreach ($data as $table => $rows) {
    echo "⏳ Seeding table: $table\n";

    // Očisti tablicu
    $pdo->exec("DELETE FROM `$table`");

    if (count($rows) === 0) continue;

    // Ubacivanje
    foreach ($rows as $row) {
        $columns = array_keys($row);
        $placeholders = array_map(fn($c) => ":$c", $columns);

        $sql = "INSERT INTO `$table` (" . implode(",", $columns) . ")
                VALUES (" . implode(",", $placeholders) . ")";
        $stmt = $pdo->prepare($sql);

        foreach ($row as $col => $value) {
            $stmt->bindValue(":$col", $value);
        }

        $stmt->execute();
    }
}

echo "✅ Seeding complete from JSON!\n";
