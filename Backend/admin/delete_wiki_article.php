<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

// Dobavi podatke
$data = json_decode(file_get_contents('php://input'), true);
$user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
$article_id = isset($data['id']) ? intval($data['id']) : 0;

if ($user_id <= 0 || $article_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // DEBUG: Ispiši user_id
    error_log("DEBUG: User ID: " . $user_id);
    
    // Provjeri admin status
    $checkAdminQuery = "SELECT is_admin FROM users WHERE id = :user_id";
    $checkAdminStmt = $conn->prepare($checkAdminQuery);
    $checkAdminStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $checkAdminStmt->execute();
    
    $user = $checkAdminStmt->fetch(PDO::FETCH_ASSOC);
    
    // DEBUG: Ispiši rezultat
    error_log("DEBUG: User data: " . print_r($user, true));
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    if (!$user['is_admin']) {
        echo json_encode(['success' => false, 'message' => 'User is not admin. is_admin = ' . $user['is_admin']]);
        exit;
    }
    
    // Delete article
    $query = "DELETE FROM wiki_articles WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $article_id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Article deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete article']);
    }
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>