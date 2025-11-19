<?php
function seed() {
    require_once __DIR__ . '/../../config/database_cli.php';
    
    $database = new Database();
    $db = $database->getConnection();

    echo "🌱 Seeding database...\n";

    // 1. Categories
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

    // 2. Users - SAMO OSNOVNE KOLONE KOJE SIGURNO POSTOJE
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

    // Probajte sa password_hash prvo
    try {
        $stmt = $db->prepare("INSERT IGNORE INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)");
        foreach ($users as $user) {
            $stmt->execute([$user['username'], $user['email'], $user['password_hash'], $user['is_admin']]);
        }
        echo "✅ Users seeded with password_hash (" . count($users) . " users)\n";
    } catch (Exception $e) {
        // Ako password_hash ne radi, probajte sa password
        echo "⚠️  Trying with 'password' column...\n";
        try {
            $stmt = $db->prepare("INSERT IGNORE INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)");
            foreach ($users as $user) {
                $stmt->execute([$user['username'], $user['email'], $user['password_hash'], $user['is_admin']]);
            }
            echo "✅ Users seeded with password (" . count($users) . " users)\n";
        } catch (Exception $e2) {
            echo "❌ Users seeding failed: " . $e2->getMessage() . "\n";
        }
    }

    // 3. Achievements
    $achievements = [
        ['First Blood', 'Solve your first challenge', '/icons/first-blood.png', 50, 'solves_count', 1, NULL, false],
        ['Reverse Engineering Novice', 'Solve 5 Reverse Engineering challenges', '/icons/re-novice.png', 100, 'solves_count', 5, 1, false],
        ['Binary Master', 'Solve 10 Binary Exploitation challenges', '/icons/binary-master.png', 200, 'solves_count', 10, 2, false],
        ['Cryptography Expert', 'Solve 8 Cryptography challenges', '/icons/crypto-expert.png', 150, 'solves_count', 8, 3, false],
        ['Point Collector', 'Earn 1000 total points', '/icons/point-collector.png', 150, 'points_total', 1000, NULL, false]
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO achievements (name, description, icon_url, points_reward, criteria_type, criteria_value, category_id, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($achievements as $achievement) {
        $stmt->execute($achievement);
    }
    echo "✅ Achievements seeded (" . count($achievements) . " achievements)\n";

    // 4. Challenges
    $challenges = [
        ['Easy Reverse', 'A simple reverse engineering challenge', 1, 'Easy', 100, 'CTF{simple_rev}', 1],
        ['Buffer Overflow 101', 'Learn basic buffer overflow', 2, 'Easy', 100, 'CTF{buffer_overflow}', 1],
        ['Caesar Cipher', 'Break the Caesar cipher', 3, 'Easy', 100, 'CTF{caesar_break}', 1],
        ['Hidden Message', 'Find the hidden message in the image', 4, 'Easy', 100, 'CTF{hidden_img}', 1],
        ['SQL Injection', 'Basic SQL injection challenge', 5, 'Easy', 100, 'CTF{sql_inject}', 1]
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO challenges (title, description, category_id, difficulty, points, flag, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($challenges as $challenge) {
        $stmt->execute($challenge);
    }
    echo "✅ Challenges seeded (" . count($challenges) . " challenges)\n";

    echo "🎉 Database seeded successfully!\n";
    echo "📊 Summary:\n";
    echo "   - " . count($categories) . " categories\n";
    echo "   - " . count($users) . " users\n"; 
    echo "   - " . count($achievements) . " achievements\n";
    echo "   - " . count($challenges) . " challenges\n";
    
    echo "\n🔑 Admin login:\n";
    echo "   Username: admin\n";
    echo "   Password: admin123\n";
    echo "   Student login: student1 / student123\n";
}
?>