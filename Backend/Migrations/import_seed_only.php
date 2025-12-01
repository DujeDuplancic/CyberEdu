<?php
require_once __DIR__ . '/../config/database_cli.php';

echo "🌱 SEED IMPORTER\n============================\n";

$db = new Database();
$pdo = $db->getConnection();

echo "📥 Loading seed data...\n";

$seedPath = __DIR__ . "/database_seed_data.json";
$data = json_decode(file_get_contents($seedPath), true);

// KORIGIRANI REDOSLIJED zbog foreign key-ova
$order = [
    "leaderboard_entries",
    "leaderboard_snapshots",
    "user_achievements",
    "achievements",
    "replies",
    "discussions",
    "solves",
    "challenges",
    "wiki_articles",
    "lectures",
    "categories",
    "users"
];

// Disable FK checks
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

foreach ($order as $table) {
    if (!isset($data[$table])) continue;

    echo "🧹 Clearing table: $table\n";
    $pdo->exec("TRUNCATE TABLE `$table`");

    echo "➡️ Inserting into: $table\n";

    foreach ($data[$table] as $row) {
        $cols = array_keys($row);
        $vals = array_values($row);

        $place = implode(', ', array_fill(0, count($vals), '?'));
        $colNames = '`' . implode('`, `', $cols) . '`';

        $stmt = $pdo->prepare("INSERT INTO `$table` ($colNames) VALUES ($place)");
        $stmt->execute($vals);
    }
}

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

echo "🎉 Seed import completed successfully!\n";
