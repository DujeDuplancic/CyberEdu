<?php
// Kompletni seed sa svim podacima - CLI verzija
require_once '../config/database_cli.php';

function seedComplete() {
    $database = new Database();
    $db = $database->getConnection();

    echo "🌱 Starting complete database seeding...\n";
    echo "========================================\n";

    // 1. CATEGORIES
    echo "📋 Seeding categories...\n";
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
    echo "✅ Categories seeded (" . count($categories) . " categories)\n";

    // 2. USERS
    echo "👥 Seeding users...\n";
    $users = [
        [
            'username' => 'admin',
            'email' => 'admin@cyberedu.com',
            'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
            'is_admin' => true
        ],
        [
            'username' => 'student1',
            'email' => 'student1@cyberedu.com', 
            'password_hash' => password_hash('student123', PASSWORD_DEFAULT),
            'is_admin' => false
        ],
        [
            'username' => 'student2',
            'email' => 'student2@cyberedu.com',
            'password_hash' => password_hash('student123', PASSWORD_DEFAULT),
            'is_admin' => false
        ]
    ];

    try {
        $stmt = $db->prepare("INSERT IGNORE INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)");
        foreach ($users as $user) {
            $stmt->execute([$user['username'], $user['email'], $user['password_hash'], $user['is_admin']]);
        }
        echo "✅ Users seeded (" . count($users) . " users)\n";
    } catch (Exception $e) {
        echo "❌ Users seeding failed: " . $e->getMessage() . "\n";
    }

    // 3. CHALLENGES - moramo dobiti ID-jeve kategorija prvo
    echo "🎯 Seeding challenges...\n";
    
    // Dohvati ID-jeve kategorija
    $categoryMap = [];
    $stmt = $db->query("SELECT id, name FROM categories");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $categoryMap[$row['name']] = $row['id'];
    }

    $challenges = [
        ['Easy Reverse', 'A simple reverse engineering challenge. Find the flag!', $categoryMap['Reverse Engineering'], 'Easy', 100, 'CTF{simple_rev}', 1],
        ['Buffer Overflow 101', 'Learn basic buffer overflow techniques', $categoryMap['Binary Exploitation'], 'Easy', 100, 'CTF{buffer_overflow}', 1],
        ['Caesar Cipher', 'Break the classic Caesar cipher encryption', $categoryMap['Cryptography'], 'Easy', 100, 'CTF{caesar_break}', 1],
        ['Hidden Message', 'Find the hidden message in this image', $categoryMap['Steganography'], 'Easy', 100, 'CTF{hidden_img}', 1],
        ['SQL Injection', 'Basic SQL injection challenge', $categoryMap['Web Security'], 'Easy', 100, 'CTF{sql_inject}', 1],
        ['Medium Reverse', 'Intermediate reverse engineering challenge', $categoryMap['Reverse Engineering'], 'Medium', 250, 'CTF{medium_rev}', 1],
        ['ROP Chain', 'Return Oriented Programming challenge', $categoryMap['Binary Exploitation'], 'Medium', 300, 'CTF{rop_chain}', 1],
        ['RSA Challenge', 'Break RSA encryption', $categoryMap['Cryptography'], 'Hard', 500, 'CTF{rsa_break}', 1]
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO challenges (title, description, category_id, difficulty, points, flag, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($challenges as $challenge) {
        // Hashaj flag prije spremanja
        $hashedFlag = password_hash($challenge[5], PASSWORD_DEFAULT);
        $stmt->execute([$challenge[0], $challenge[1], $challenge[2], $challenge[3], $challenge[4], $hashedFlag, $challenge[6]]);
    }
    echo "✅ Challenges seeded (" . count($challenges) . " challenges)\n";

    // 4. ACHIEVEMENTS
    echo "🏆 Seeding achievements...\n";
    $achievements = [
        ['First Blood', 'Solve your first challenge', '/icons/first-blood.png', 50, 'solves_count', 1, NULL, false],
        ['Reverse Engineering Novice', 'Solve 5 Reverse Engineering challenges', '/icons/re-novice.png', 100, 'solves_count', 5, $categoryMap['Reverse Engineering'], false],
        ['Binary Master', 'Solve 10 Binary Exploitation challenges', '/icons/binary-master.png', 200, 'solves_count', 10, $categoryMap['Binary Exploitation'], false],
        ['Cryptography Expert', 'Solve 8 Cryptography challenges', '/icons/crypto-expert.png', 150, 'solves_count', 8, $categoryMap['Cryptography'], false],
        ['Point Collector', 'Earn 1000 total points', '/icons/point-collector.png', 150, 'points_total', 1000, NULL, false]
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO achievements (name, description, icon_url, points_reward, criteria_type, criteria_value, category_id, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($achievements as $achievement) {
        $stmt->execute($achievement);
    }
    echo "✅ Achievements seeded (" . count($achievements) . " achievements)\n";

    echo "========================================\n";
    echo "🎉 COMPLETE DATABASE SEEDED SUCCESSFULLY!\n";
    echo "========================================\n";
    echo "📊 SUMMARY:\n";
    echo "   - " . count($categories) . " categories\n";
    echo "   - " . count($users) . " users\n"; 
    echo "   - " . count($challenges) . " challenges\n";
    echo "   - " . count($achievements) . " achievements\n";
    
    echo "\n🔑 LOGIN CREDENTIALS:\n";
    echo "   👑 Admin: admin / admin123\n";
    echo "   👨‍🎓 Student 1: student1 / student123\n";
    echo "   👩‍🎓 Student 2: student2 / student123\n";
    
    echo "\n🚀 READY TO HACK!\n";
}

// Pokreni seed
seedComplete();
?>