<?php
$host = "localhost";
$username = "root";
$password = "";
$database = "cyberedu";

$conn = new mysqli($host, $username, $password, $database);
if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

echo "🔗 Connected\n";

// Ukloni updated_at iz INSERT query-ja
$articles = [
    [
        'title' => 'Getting Started with Reverse Engineering',
        'slug' => 'getting-started-reverse-engineering',
        'content' => '<h2>Introduction to Reverse Engineering</h2><p>Content here...</p>',
        'excerpt' => 'Learn basics of reverse engineering',
        'category' => 'Reverse Engineering',
        'difficulty' => 'beginner',
        'reading_time' => 10,
        'views' => 1234
    ]
];

foreach ($articles as $article) {
    $title = $conn->real_escape_string($article['title']);
    $slug = $conn->real_escape_string($article['slug']);
    $content = $conn->real_escape_string($article['content']);
    $excerpt = $conn->real_escape_string($article['excerpt']);
    $difficulty = $conn->real_escape_string($article['difficulty']);
    $reading_time = intval($article['reading_time']);
    $views = intval($article['views']);
    
    // SIMPLIFIED INSERT - bez updated_at
    $sql = "INSERT INTO wiki_articles (title, slug, content, excerpt, 
            difficulty_level, reading_time, views, is_published, created_at) 
            VALUES ('$title', '$slug', '$content', '$excerpt', 
            '$difficulty', $reading_time, $views, 1, NOW())";
    
    if ($conn->query($sql) === TRUE) {
        echo "✅ Added: $title\n";
    } else {
        echo "❌ Error: " . $conn->error . "\n";
    }
}

$conn->close();
echo "🎉 Done\n";
?>