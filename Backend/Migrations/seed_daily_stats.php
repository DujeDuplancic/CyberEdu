<?php
// BackEnd/Migrations/seed_daily_stats.php
require_once '../config/database_cli.php';

echo "📊 Seeding daily stats for leaderboard...\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Proveri da li već postoje podaci
    $check = $conn->query("SELECT COUNT(*) as count FROM leaderboard_snapshots")->fetch();
    
    if ($check['count'] > 0) {
        echo "✅ Leaderboard already has data. Skipping seeding.\n";
        echo "   Use 'php -f seed_leaderboard_data.php' to refresh data.\n";
        exit;
    }
    
    // Pokreni seed_leaderboard_data.php
    require_once 'seed_leaderboard_data.php';
    
} catch (PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}
?>