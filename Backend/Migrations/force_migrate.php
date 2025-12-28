<?php

date_default_timezone_set('Europe/Zagreb');
require_once __DIR__ . '/../config/database_cli.php';

echo "🚀 FORCE MIGRATION RUNNER\n";
echo "========================\n";

$pdo = (new Database())->getConnection();

/*
|--------------------------------------------------------------------------
| Create migrations table if not exists
|--------------------------------------------------------------------------
*/
$pdo->exec("
    CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        batch INT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

/*
|--------------------------------------------------------------------------
| Load all migration files
|--------------------------------------------------------------------------
*/
$migrationPath = __DIR__ . '/migrations/';
$migrations = glob($migrationPath . '*.php');

if (!$migrations) {
    echo "❌ No migration files found\n";
    exit(1);
}

// sort by filename (001_, 002_, ...)
sort($migrations);

$batch = (int) $pdo
    ->query("SELECT IFNULL(MAX(batch), 0) + 1 FROM migrations")
    ->fetchColumn();

/*
|--------------------------------------------------------------------------
| Run migrations
|--------------------------------------------------------------------------
*/
foreach ($migrations as $file) {
    $name = basename($file);

    echo "📦 Processing: $name\n";

    // already executed?
    $stmt = $pdo->prepare("SELECT 1 FROM migrations WHERE migration_name = ?");
    $stmt->execute([$name]);

    if ($stmt->fetch()) {
        echo "   ✅ Already executed – skipping\n";
        continue;
    }

    // load SQL
    $sql = require $file;

    if (!is_string($sql) || trim($sql) === '') {
        echo "   ❌ Migration returned empty SQL\n";
        exit(1);
    }

    try {
        $pdo->exec($sql);

        $stmt = $pdo->prepare(
            "INSERT INTO migrations (migration_name, batch) VALUES (?, ?)"
        );
        $stmt->execute([$name, $batch]);

        echo "   ✅ Executed successfully\n";

    } catch (PDOException $e) {
        echo "   ❌ FAILED: {$e->getMessage()}\n";
        exit(1);
    }
}

echo "\n🎉 All migrations executed successfully!\n";

/*
|--------------------------------------------------------------------------
| Final state
|--------------------------------------------------------------------------
*/
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "📊 Total tables: " . count($tables) . "\n";

foreach ($tables as $table) {
    echo "  - $table\n";
}
