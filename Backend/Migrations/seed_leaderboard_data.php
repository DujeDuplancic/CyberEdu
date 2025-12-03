<?php
// BackEnd/Migrations/seed_leaderboard_data.php
require_once '../config/database_cli.php';

echo "🚀 Starting leaderboard data seeding...\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        die("❌ Database connection failed\n");
    }
    
    // 1. Prvo obriši postojeće podatke
    echo "🗑️  Clearing old leaderboard data...\n";
    $conn->query("DELETE FROM leaderboard_entries");
    $conn->query("DELETE FROM leaderboard_snapshots");
    echo "✅ Old data cleared\n\n";
    
    // 2. Dohvati sve korisnike
    echo "👥 Fetching users...\n";
    $usersQuery = "
        SELECT 
            u.id,
            u.username,
            u.points,
            (SELECT COUNT(*) FROM solves WHERE user_id = u.id) as solves_count
        FROM users u
        ORDER BY u.points DESC, u.username ASC
    ";
    
    $usersStmt = $conn->query($usersQuery);
    $users = $usersStmt->fetchAll(PDO::FETCH_ASSOC);
    $totalUsers = count($users);
    echo "✅ Found $totalUsers users\n\n";
    
    // 3. Kreiraj 7 dnevnih snapshot-a (posljednjih 7 dana)
    $days = 7;
    echo "📅 Creating $days daily snapshots...\n\n";
    
    for ($i = $days-1; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        
        // Izračunaj ukupne statistike za ovaj dan
        $totalPoints = 0;
        $totalSolves = 0;
        
        foreach ($users as $user) {
            // Simuliraj historijske bodove (za stare dane manje bodova)
            $historicalPoints = $user['points'];
            if ($i > 0) {
                // Za svaki dan unazad, smanji za 10-20%
                $reductionPercent = rand(10, 20) / 100;
                $reduction = floor($historicalPoints * $reductionPercent * $i);
                $historicalPoints = max(0, $historicalPoints - $reduction);
            }
            
            $totalPoints += $historicalPoints;
            $totalSolves += $user['solves_count'];
        }
        
        // Kreiraj snapshot
        $snapshotQuery = "
            INSERT INTO leaderboard_snapshots 
            (snapshot_date, total_users, total_solves, total_points)
            VALUES (?, ?, ?, ?)
        ";
        
        $snapshotStmt = $conn->prepare($snapshotQuery);
        $snapshotStmt->execute([$date, $totalUsers, $totalSolves, $totalPoints]);
        $snapshotId = $conn->lastInsertId();
        
        // 4. Popuni leaderboard_entries za ovaj snapshot
        echo "  📊 Snapshot #$snapshotId for $date:\n";
        echo "    👥 Total users: $totalUsers\n";
        echo "    🎯 Total points: $totalPoints\n";
        echo "    ✅ Total solves: $totalSolves\n";
        
        $rank = 1;
        $entriesAdded = 0;
        
        foreach ($users as $user) {
            // Historijski bodovi za ovaj dan
            $historicalPoints = $user['points'];
            if ($i > 0) {
                $reductionPercent = rand(10, 20) / 100;
                $reduction = floor($historicalPoints * $reductionPercent * $i);
                $historicalPoints = max(0, $historicalPoints - $reduction);
            }
            
            // Ubaci entry
            $entryQuery = "
                INSERT INTO leaderboard_entries 
                (snapshot_id, user_id, username, rank, points, solves_count)
                VALUES (?, ?, ?, ?, ?, ?)
            ";
            
            $entryStmt = $conn->prepare($entryQuery);
            $entryStmt->execute([
                $snapshotId,
                $user['id'],
                $user['username'],
                $rank,
                $historicalPoints,
                $user['solves_count']
            ]);
            
            $entriesAdded++;
            $rank++;
        }
        
        echo "    📝 Added $entriesAdded entries\n\n";
    }
    
    // 5. Prikaži finalne statistike
    echo "========================================\n";
    echo "✅ LEADERBOARD SEEDING COMPLETE!\n";
    echo "========================================\n\n";
    
    // Snapshot statistika
    $snapshotStats = $conn->query("SELECT COUNT(*) as count FROM leaderboard_snapshots")->fetch();
    echo "📅 Total snapshots: " . $snapshotStats['count'] . "\n";
    
    // Entry statistika
    $entryStats = $conn->query("SELECT COUNT(*) as count FROM leaderboard_entries")->fetch();
    echo "👤 Total leaderboard entries: " . $entryStats['count'] . "\n";
    
    // Average entries per snapshot
    $avgEntries = $conn->query("
        SELECT 
            AVG(entry_count) as avg_entries 
        FROM (
            SELECT COUNT(*) as entry_count 
            FROM leaderboard_entries 
            GROUP BY snapshot_id
        ) as counts
    ")->fetch();
    
    echo "📊 Average entries per snapshot: " . round($avgEntries['avg_entries'], 2) . "\n\n";
    
    // Prikaži zadnji snapshot
    echo "📋 Latest snapshot details:\n";
    $latestSnapshot = $conn->query("
        SELECT * FROM leaderboard_snapshots 
        ORDER BY snapshot_date DESC 
        LIMIT 1
    ")->fetch();
    
    if ($latestSnapshot) {
        echo "  ID: " . $latestSnapshot['id'] . "\n";
        echo "  Date: " . $latestSnapshot['snapshot_date'] . "\n";
        echo "  Users: " . $latestSnapshot['total_users'] . "\n";
        echo "  Solves: " . $latestSnapshot['total_solves'] . "\n";
        echo "  Points: " . $latestSnapshot['total_points'] . "\n";
        
        // Prikaži top 3 iz zadnjeg snapshota
        echo "\n  🏆 Top 3 from latest snapshot:\n";
        $top3 = $conn->query("
            SELECT username, points, solves_count 
            FROM leaderboard_entries 
            WHERE snapshot_id = " . $latestSnapshot['id'] . "
            ORDER BY rank ASC 
            LIMIT 3
        ")->fetchAll();
        
        $position = 1;
        foreach ($top3 as $player) {
            echo "    $position. " . $player['username'] . 
                 " - " . $player['points'] . " points" . 
                 " (" . $player['solves_count'] . " solves)\n";
            $position++;
        }
    }
    
} catch (PDOException $e) {
    die("\n❌ Error: " . $e->getMessage() . "\n");
}

echo "\n🎉 All done! Leaderboard data has been seeded successfully.\n";
?>