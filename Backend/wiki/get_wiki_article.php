<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    $article_slug = isset($_GET['slug']) ? $_GET['slug'] : null;
    
    if (!$article_slug) {
        echo json_encode(['success' => false, 'message' => 'Article slug required']);
        exit;
    }
    
    $query = "SELECT 
                wa.*,
                u.username as author_name,
                wc.name as category_name,
                wc.slug as category_slug
              FROM wiki_articles wa
              LEFT JOIN users u ON wa.author_id = u.id
              LEFT JOIN wiki_categories wc ON wa.category_id = wc.id
              WHERE wa.is_published = 1 AND wa.slug = :slug";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':slug', $article_slug);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'message' => 'Article not found']);
        exit;
    }
    
    $article = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Update view count
    $updateViews = $conn->prepare("UPDATE wiki_articles SET views = views + 1 WHERE id = :id");
    $updateViews->bindParam(':id', $article['id'], PDO::PARAM_INT);
    $updateViews->execute();
    
    echo json_encode([
        'success' => true,
        'article' => $article
    ]);
    
} catch(PDOException $exception) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $exception->getMessage()
    ]);
}
?>