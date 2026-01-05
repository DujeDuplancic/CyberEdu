<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    $category_slug = isset($_GET['category']) ? trim($_GET['category']) : null;
    
    // DEBUG logging
    error_log("=== GET_WIKI_ARTICLES.PHP CALLED ===");
    error_log("Request parameters:");
    error_log("  - category_slug: " . ($category_slug ?: 'NULL'));
    error_log("  - limit: $limit");
    error_log("  - offset: $offset");
    
    if ($category_slug) {
        // PRVO: Pronađi ID kategorije iz sluga
        $categoryQuery = "SELECT id FROM wiki_categories WHERE slug = :category_slug";
        $categoryStmt = $conn->prepare($categoryQuery);
        $categoryStmt->bindParam(':category_slug', $category_slug);
        $categoryStmt->execute();
        
        $category = $categoryStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$category) {
            error_log("❌ Category not found for slug: $category_slug");
            echo json_encode([
                'success' => false,
                'message' => "Category '$category_slug' not found",
                'articles' => []
            ]);
            exit;
        }
        
        $category_id = $category['id'];
        error_log("✅ Found category ID: $category_id for slug: $category_slug");
        
        // DRUGO: Dohvati članke SAMO za tu kategoriju
        $query = "SELECT 
                    wa.id,
                    wa.title,
                    wa.slug,
                    wa.content,
                    wa.created_at,
                    wa.views,
                    wa.reading_time,
                    wa.difficulty_level,
                    wa.author_id,
                    wa.category_id,
                    u.username as author_name,
                    wc.name as category_name,
                    wc.slug as category_slug
                  FROM wiki_articles wa
                  LEFT JOIN users u ON wa.author_id = u.id
                  LEFT JOIN wiki_categories wc ON wa.category_id = wc.id
                  WHERE wa.is_published = 1 
                    AND wa.category_id = :category_id
                  ORDER BY wa.created_at DESC 
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':category_id', $category_id, PDO::PARAM_INT);
        
    } else {
        // Ako nema category parametra, vrati sve članke
        $query = "SELECT 
                    wa.id,
                    wa.title,
                    wa.slug,
                    wa.content,
                    wa.created_at,
                    wa.views,
                    wa.reading_time,
                    wa.difficulty_level,
                    wa.author_id,
                    wa.category_id,
                    u.username as author_name,
                    wc.name as category_name,
                    wc.slug as category_slug
                  FROM wiki_articles wa
                  LEFT JOIN users u ON wa.author_id = u.id
                  LEFT JOIN wiki_categories wc ON wa.category_id = wc.id
                  WHERE wa.is_published = 1
                  ORDER BY wa.created_at DESC 
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $conn->prepare($query);
    }
    
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    
    $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // DEBUG: Log what we found
    error_log("✅ Found " . count($articles) . " articles");
    foreach ($articles as $i => $article) {
        error_log("  Article $i: '{$article['title']}' - Category: {$article['category_name']} ({$article['category_slug']})");
    }
    
    echo json_encode([
        'success' => true,
        'articles' => $articles,
        'category_filter' => $category_slug,
        'category_id' => isset($category_id) ? $category_id : null,
        'count' => count($articles)
    ]);
    
} catch(PDOException $exception) {
    error_log("❌ PDO Error in get_wiki_articles.php: " . $exception->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $exception->getMessage(),
        'articles' => []
    ]);
} catch(Exception $e) {
    error_log("❌ General Error in get_wiki_articles.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'articles' => []
    ]);
}
?>