<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    
    $query = "SELECT 
                wa.id,
                wa.title,
                wa.slug,
                wa.excerpt,
                wa.content,
                wa.created_at,
                wa.views,
                wa.reading_time,
                wa.difficulty_level,
                wa.author_id,
                u.username as author_name,
                wc.name as category_name,
                wc.slug as category_slug
              FROM wiki_articles wa
              LEFT JOIN users u ON wa.author_id = u.id
              LEFT JOIN wiki_categories wc ON wa.category_id = wc.id
              WHERE wa.is_published = 1
              ORDER BY wa.views DESC, wa.created_at DESC 
              LIMIT :limit OFFSET :offset";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'articles' => $articles
    ]);
    
} catch(PDOException $exception) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $exception->getMessage(),
        'articles' => []
    ]);
}
?>