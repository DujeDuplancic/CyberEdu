<?php
require_once '../config/database.php';

function seed() {
    $database = new Database();
    $db = $database->getConnection();

    echo "🌱 Seeding database...\n";

    // Categories
    $categories = [
        ['Reverse Engineering', 'Disassemble and analyze binary code', 'Code'],
        ['Binary Exploitation', 'Master buffer overflows and memory corruption', 'Lock'],
        ['Cryptography', 'Break encryption schemes and protocols', 'Key'],
        ['Steganography', 'Uncover hidden messages in digital media', 'ImageIcon'],
        ['Web Security', 'Exploit web vulnerabilities', 'Globe']
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO categories (name, description, icon_name) VALUES (?, ?, ?)");
    foreach ($categories as $category) {
        $stmt->execute($category);
    }
    echo "✅ Categories seeded\n";

    // Achievements
    $achievements = [
        ['First Blood', 'Solve your first challenge', '/icons/first-blood.png', 50, 'solves_count', 1, NULL, false],
        ['Reverse Engineering Novice', 'Solve 5 Reverse Engineering challenges', '/icons/re-novice.png', 100, 'solves_count', 5, 1, false],
        ['Binary Master', 'Solve 10 Binary Exploitation challenges', '/icons/binary-master.png', 200, 'solves_count', 10, 2, false],
        ['Point Collector', 'Earn 1000 total points', '/icons/point-collector.png', 150, 'points_total', 1000, NULL, false]
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO achievements (name, description, icon_url, points_reward, criteria_type, criteria_value, category_id, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($achievements as $achievement) {
        $stmt->execute($achievement);
    }
    echo "✅ Achievements seeded\n";

    echo "🎉 Seed data completed successfully!\n";
}

seed();
?>