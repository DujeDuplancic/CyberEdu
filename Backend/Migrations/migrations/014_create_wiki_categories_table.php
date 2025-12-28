<?php
// Koristi mysqli direktno kao ostale migracije
$host = "localhost";
$username = "root";
$password = "";
$database = "cyberedu";

// Konekcija
$conn = new mysqli($host, $username, $password, $database);

// Provjera konekcije
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "🔗 Connected to database\n";

// Kreiraj wiki_categories tabelu
$sql = "CREATE TABLE IF NOT EXISTS wiki_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

if ($conn->query($sql) === TRUE) {
    echo "✅ Table 'wiki_categories' created successfully\n";
    
    // Dodaj default kategorije
    $defaultCategories = [
        ["Reverse Engineering", "reverse-engineering", "Code", "Learn disassembly, debugging, and binary analysis techniques."],
        ["Binary Exploitation", "binary-exploitation", "Lock", "Master buffer overflows, ROP chains, and memory corruption."],
        ["Cryptography", "cryptography", "Key", "Understand encryption algorithms, hashing, and cryptanalysis."],
        ["Steganography", "steganography", "Image", "Discover hidden messages in digital media and files."],
        ["Web Security", "web-security", "Globe", "Explore web vulnerabilities and exploitation techniques."]
    ];
    
    $inserted = 0;
    foreach ($defaultCategories as $index => $category) {
        $name = $conn->real_escape_string($category[0]);
        $slug = $conn->real_escape_string($category[1]);
        $icon = $conn->real_escape_string($category[2]);
        $desc = $conn->real_escape_string($category[3]);
        
        $insertSql = "INSERT INTO wiki_categories (name, slug, icon, description, order_index) 
                     VALUES ('$name', '$slug', '$icon', '$desc', $index + 1)
                     ON DUPLICATE KEY UPDATE name = '$name', description = '$desc'";
        
        if ($conn->query($insertSql) === TRUE) {
            $inserted++;
        }
    }
    
    echo "📝 Inserted/updated $inserted default categories\n";
    
} else {
    echo "❌ Error creating table: " . $conn->error . "\n";
}

$conn->close();
echo "🎉 Migration 014 completed\n";
?>