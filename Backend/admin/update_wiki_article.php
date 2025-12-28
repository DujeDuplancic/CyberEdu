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
$required_fields = ['id', 'title', 'content', 'category_id'];
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
    
    // Pripremi podatke za bazu
    $id = intval($data['id']);
    $title = trim($data['title']);
    $content = $data['content'];
    $excerpt = isset($data['excerpt']) ? substr($data['excerpt'], 0, 500) : '';
    $category_id = intval($data['category_id']);
    $reading_time = isset($data['reading_time']) ? intval($data['reading_time']) : 5;
    $difficulty_level = isset($data['difficulty_level']) ? $data['difficulty_level'] : 'beginner';
    $is_published = isset($data['is_published']) ? ($data['is_published'] ? 1 : 0) : 1;
    
    // Update članka
    $query = "UPDATE wiki_articles SET 
              title = :title,
              content = :content,
              excerpt = :excerpt,
              category_id = :category_id,
              reading_time = :reading_time,
              difficulty_level = :difficulty_level,
              is_published = :is_published,
              updated_at = NOW()
              WHERE id = :id";
    
    $stmt = $conn->prepare($query);
    
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':content', $content);
    $stmt->bindParam(':excerpt', $excerpt);
    $stmt->bindParam(':category_id', $category_id, PDO::PARAM_INT);
    $stmt->bindParam(':reading_time', $reading_time, PDO::PARAM_INT);
    $stmt->bindParam(':difficulty_level', $difficulty_level);
    $stmt->bindParam(':is_published', $is_published, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true, 
            'message' => 'Article updated successfully',
            'updated_id' => $id
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