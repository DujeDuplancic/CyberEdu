<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    $query = "SELECT 
                wc.id, 
                wc.name, 
                wc.slug,
                wc.icon,
                wc.description,
                (SELECT COUNT(*) FROM wiki_articles wa WHERE wa.category_id = wc.id AND wa.is_published = 1) as article_count
              FROM wiki_categories wc
              ORDER BY wc.order_index, wc.name";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'categories' => $categories
    ]);
    
} catch(PDOException $exception) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $exception->getMessage(),
        'categories' => []
    ]);
}
?>