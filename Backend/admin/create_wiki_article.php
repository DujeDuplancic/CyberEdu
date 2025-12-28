<?php
// OVO JE NAJVAŽNIJE - mora biti na samom vrhu!
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

// Čitaj JSON podatke
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Ako JSON parsiranje ne uspije
if ($data === null) {
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid JSON data',
        'error' => json_last_error_msg(),
        'received' => $input
    ]);
    exit;
}

// Validacija obaveznih polja
$required_fields = ['title', 'content', 'category_id', 'user_id'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        echo json_encode([
            'success' => false, 
            'message' => "Missing required field: $field",
            'received_data' => $data
        ]);
        exit;
    }
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Provjeri da li je korisnik admin
    $checkAdminQuery = "SELECT is_admin FROM users WHERE id = :user_id";
    $checkAdminStmt = $conn->prepare($checkAdminQuery);
    $checkAdminStmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
    $checkAdminStmt->execute();
    
    $user = $checkAdminStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode([
            'success' => false, 
            'message' => 'User not found'
        ]);
        exit;
    }
    
    if (!$user['is_admin']) {
        echo json_encode([
            'success' => false, 
            'message' => 'Unauthorized - User is not admin. is_admin value: ' . $user['is_admin']
        ]);
        exit;
    }
    
    // Generiraj slug od naslova
    $title = trim($data['title']);
    $slug = strtolower(preg_replace('/[^A-Za-z0-9-]+/', '-', $title));
    $slug = preg_replace('/-+/', '-', $slug); // Zamijeni višestruke crtice s jednom
    $slug = trim($slug, '-');
    
    // Ako je slug prazan, generiraj nasumični
    if (empty($slug)) {
        $slug = 'article-' . time() . '-' . rand(1000, 9999);
    }
    
    // Pripremi podatke za bazu
    $excerpt = isset($data['excerpt']) ? substr($data['excerpt'], 0, 500) : '';
    $category_id = intval($data['category_id']);
    $author_id = intval($data['user_id']);
    $reading_time = isset($data['reading_time']) ? intval($data['reading_time']) : 5;
    $difficulty_level = isset($data['difficulty_level']) ? $data['difficulty_level'] : 'beginner';
    $is_published = isset($data['is_published']) ? ($data['is_published'] ? 1 : 0) : 1;
    
    // Insert u bazu
    $query = "INSERT INTO wiki_articles (
                title, slug, content, excerpt, category_id, author_id,
                reading_time, difficulty_level, is_published, created_at, updated_at
              ) VALUES (
                :title, :slug, :content, :excerpt, :category_id, :author_id,
                :reading_time, :difficulty_level, :is_published, NOW(), NOW()
              )";
    
    $stmt = $conn->prepare($query);
    
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':slug', $slug);
    $stmt->bindParam(':content', $data['content']);
    $stmt->bindParam(':excerpt', $excerpt);
    $stmt->bindParam(':category_id', $category_id, PDO::PARAM_INT);
    $stmt->bindParam(':author_id', $author_id, PDO::PARAM_INT);
    $stmt->bindParam(':reading_time', $reading_time, PDO::PARAM_INT);
    $stmt->bindParam(':difficulty_level', $difficulty_level);
    $stmt->bindParam(':is_published', $is_published, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        $article_id = $conn->lastInsertId();
        echo json_encode([
            'success' => true, 
            'message' => 'Article created successfully',
            'article_id' => $article_id,
            'slug' => $slug
        ]);
    } else {
        $errorInfo = $stmt->errorInfo();
        echo json_encode([
            'success' => false, 
            'message' => 'Database error: ' . $errorInfo[2]
        ]);
    }
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'Database connection error: ' . $e->getMessage()
    ]);
} catch(Exception $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'General error: ' . $e->getMessage()
    ]);
}
?>