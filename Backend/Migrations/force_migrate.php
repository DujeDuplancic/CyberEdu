<?php
date_default_timezone_set('Europe/Zagreb');
require_once __DIR__ . '/../config/database_cli.php';

echo "🚀 FORCE MIGRATION RUNNER\n";
echo "=========================\n";

$database = new Database();
$db = $database->getConnection();

// Kreiraj migrations tabelu ako ne postoji
$db->exec("
    CREATE TABLE IF NOT EXISTS `migrations` (
        id INT PRIMARY KEY AUTO_INCREMENT,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        batch INT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

// Lista migracija u ispravnom redoslijedu
$migrations = [
    '001_create_users_table.php',
    '002_create_categories_table.php', 
    '003_create_challenges_table.php',
    '004_create_solves_table.php',
    '005_create_lectures_table.php',
    '006_create_discussions_table.php',
    '007_create_replies_table.php',
    '008_create_achievements_table.php',
    '009_create_user_achievements_table.php',
    '010_create_wiki_articles_table.php',
    '011_create_leaderboard_snapshots_table.php',
    '012_create_leaderboard_entries_table.php'
];

$batch = 1;

foreach ($migrations as $migration) {
    $migration_path = __DIR__ . '/migrations/' . $migration;
    
    echo "📦 Processing: $migration\n";
    
    // Provjeri da li je migracija već izvršena
    $stmt = $db->prepare("SELECT id FROM migrations WHERE migration_name = ?");
    $stmt->execute([$migration]);
    $executed = $stmt->fetch();
    
    if ($executed) {
        echo "   ✅ Already executed - skipping\n";
        continue;
    }
    
    if (!file_exists($migration_path)) {
        echo "   ❌ File not found: $migration_path\n";
        continue;
    }
    
    try {
        // Učitaj fajl i dohvati SQL direktno
        $content = file_get_contents($migration_path);
        
        // Ekstrahuj up() funkciju sadržaj
        if (preg_match('/function up\(\)\s*\{?\s*return\s*"([^"]+)";?\s*\}?/', $content, $matches)) {
            $query = $matches[1];
            $query = str_replace('\\n', ' ', $query);
            $query = str_replace('\\t', ' ', $query);
            
            echo "   Executing SQL...\n";
            $db->exec($query);
            
            // Zabilježi migraciju
            $stmt = $db->prepare("INSERT INTO migrations (migration_name, batch) VALUES (?, ?)");
            $stmt->execute([$migration, $batch]);
            
            echo "   ✅ SUCCESS: Executed migration\n";
        } else {
            throw new Exception("Could not extract SQL from up() function");
        }
        
    } catch (Exception $e) {
        echo "   ❌ FAILED: " . $e->getMessage() . "\n";
        // Nastavi sa sljedećom migracijom
    }
}

// Provjeri finalne tabele
echo "\n📊 FINAL DATABASE STATE:\n";
$stmt = $db->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

echo "Total tables: " . count($tables) . "\n";
foreach ($tables as $table) {
    echo "  - $table\n";
}

echo "\n🎉 Force migration completed!\n";
?>