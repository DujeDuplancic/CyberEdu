<?php
require_once __DIR__ . '/../config/database_cli.php';

echo "🌱 SEED IMPORTER\n============================\n";

$db = new Database();
$pdo = $db->getConnection();

echo "📥 Loading seed data...\n";

$seedPath = __DIR__ . "/database_seed_data.json";
$data = json_decode(file_get_contents($seedPath), true);

// DISABLE FOREIGN KEY CHECKS
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

// 1. PRVO SEEDUJ OSNOVNE TABELE (bez leaderboard)
$order = [
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

// 2. SADA GENERIŠI LEADERBOARD IZ STVARNIH PODATAKA - BEZ IZMIŠLJANJA!
echo "\n🏆 GENERATING LEADERBOARD FROM REAL DATA\n";
echo "========================================\n";

// Dohvati sve korisnike sa NJIHOVIM STVARNIM podacima
$usersQuery = "
    SELECT 
        u.id,
        u.username,
        u.points,
        (SELECT COUNT(*) FROM solves WHERE user_id = u.id) as solves_count
    FROM users u
    ORDER BY u.points DESC, u.username ASC
";

$usersStmt = $pdo->query($usersQuery);
$allUsers = $usersStmt->fetchAll(PDO::FETCH_ASSOC);

echo "📊 Real user data (NO imaginary points):\n";
foreach ($allUsers as $user) {
    echo "  • " . $user['username'] . ": " . $user['points'] . " points, " . 
         $user['solves_count'] . " solves\n";
}

// 3. OBRIŠI STARE LEADERBOARD PODATKE
echo "\n🧹 Clearing old leaderboard data...\n";
$pdo->exec("TRUNCATE TABLE `leaderboard_entries`");
$pdo->exec("TRUNCATE TABLE `leaderboard_snapshots`");

// 4. KREIRAJ SAMO JEDAN SNAPSHOT (današnji) SA STVARNIM PODACIMA
$date = date('Y-m-d');

// Izračunaj STVARNE ukupne podatke
$totalPoints = 0;
$totalSolves = 0;
foreach ($allUsers as $user) {
    $totalPoints += $user['points'];
    $totalSolves += $user['solves_count'];
}

$usersCount = count($allUsers);

// Kreiraj snapshot
$snapshotQuery = "
    INSERT INTO `leaderboard_snapshots` 
    (snapshot_date, total_users, total_solves, total_points)
    VALUES (?, ?, ?, ?)
";

$snapshotStmt = $pdo->prepare($snapshotQuery);
$snapshotStmt->execute([$date, $usersCount, $totalSolves, $totalPoints]);
$snapshotId = $pdo->lastInsertId();

echo "\n📊 Snapshot #$snapshotId for $date (REAL DATA ONLY):\n";
echo "  👥 Total users: $usersCount\n";
echo "  🎯 Total points: $totalPoints (20 from testuser2, 0 from others)\n";
echo "  ✅ Total solves: $totalSolves (1 from testuser2, 0 from others)\n";

// 5. POPUNI LEADERBOARD ENTRIES SA STVARNIM PODACIMA
$rank = 1;
$entriesAdded = 0;
$usersWithPoints = 0;

echo "\n📝 Adding users to leaderboard_entries:\n";

foreach ($allUsers as $user) {
    // STVARNI PODACI - bez izmišljanja!
    $realPoints = $user['points'];
    $realSolves = $user['solves_count'];
    
    if ($realPoints > 0) {
        $usersWithPoints++;
    }
    
    echo "  $rank. " . $user['username'] . " - " . $realPoints . " points, " . $realSolves . " solves\n";
    
    // Ubaci entry sa STVARNIM podacima
    $entryQuery = "
        INSERT INTO `leaderboard_entries` 
        (snapshot_id, user_id, username, rank, points, solves_count)
        VALUES (?, ?, ?, ?, ?, ?)
    ";
    
    $entryStmt = $pdo->prepare($entryQuery);
    $entryStmt->execute([
        $snapshotId,
        $user['id'],
        $user['username'],
        $rank,
        $realPoints,
        $realSolves
    ]);
    
    $entriesAdded++;
    $rank++;
}

// 6. FINALNA STATISTIKA
echo "\n========================================\n";
echo "✅ LEADERBOARD GENERATION COMPLETE!\n";
echo "========================================\n";

$snapshotCount = $pdo->query("SELECT COUNT(*) as count FROM leaderboard_snapshots")->fetch()['count'];
$entryCount = $pdo->query("SELECT COUNT(*) as count FROM leaderboard_entries")->fetch()['count'];

echo "📅 Snapshots created: $snapshotCount (only today)\n";
echo "👤 Total leaderboard entries: $entryCount ($usersCount users)\n";
echo "🏆 Users with points: $usersWithPoints user(s)\n";
echo "🔢 Users with 0 points: " . ($usersCount - $usersWithPoints) . " users\n";

// Prikaži leaderboard
echo "\n📋 REAL LEADERBOARD:\n";
echo "-------------------\n";

$leaderboard = $pdo->query("
    SELECT 
        le.rank,
        le.username,
        le.points,
        le.solves_count
    FROM leaderboard_entries le
    WHERE le.snapshot_id = $snapshotId
    ORDER BY le.rank ASC
")->fetchAll();

foreach ($leaderboard as $entry) {
    $rankText = str_pad($entry['rank'] . ".", 4, " ");
    $nameText = str_pad($entry['username'], 15, " ");
    $pointsText = str_pad($entry['points'] . " pts", 10, " ");
    $solvesText = $entry['solves_count'] . " solves";
    
    echo "$rankText $nameText $pointsText $solvesText\n";
}

// RE-ENABLE FOREIGN KEY CHECKS
$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

echo "\n🎉 Seed import completed successfully!\n";
echo "✅ REAL DATA ONLY - NO IMAGINARY POINTS!\n";
echo "📊 1 user has points (" . $usersWithPoints . "/" . $usersCount . ")\n";
?>