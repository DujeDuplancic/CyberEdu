<?php
$host = "localhost";
$username = "root";
$password = "";
$database = "cyberedu";

$conn = new mysqli($host, $username, $password, $database);
if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

echo "🔗 Connected\n";

// Dodaj updated_at ako ne postoji
$sql = "ALTER TABLE wiki_articles 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";

if ($conn->query($sql) === TRUE) {
    echo "✅ Added updated_at column\n";
}

// Dodaj ostale kolone
$columns = [
    "ADD COLUMN IF NOT EXISTS excerpt TEXT",
    "ADD COLUMN IF NOT EXISTS reading_time INT DEFAULT 5",
    "ADD COLUMN IF NOT EXISTS views INT DEFAULT 0",
    "ADD COLUMN IF NOT EXISTS difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner'"
];

foreach ($columns as $columnSql) {
    $conn->query("ALTER TABLE wiki_articles " . $columnSql);
    echo "✅ Added column\n";
}

$conn->close();
echo "🎉 Done\n";
?>