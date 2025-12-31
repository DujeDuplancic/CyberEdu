<?php
// CORS HEADERS - SAMO VRH
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    $discussion_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if (!$discussion_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Discussion ID required']);
        exit();
    }
    
    // Get discussion
    $query = "
        SELECT 
            d.*,
            u.username as author_name,
            u.email as author_email
        FROM discussions d
        LEFT JOIN users u ON d.author_id = u.id
        WHERE d.id = ?
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute([$discussion_id]);
    $discussion = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$discussion) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Discussion not found']);
        exit();
    }
    
    // Update view count
    $updateView = $conn->prepare("UPDATE discussions SET views = views + 1 WHERE id = ?");
    $updateView->execute([$discussion_id]);
    
    echo json_encode([
        'success' => true,
        'discussion' => $discussion
    ]);
    
} catch (Exception $e) {
    error_log("Error getting discussion details: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch discussion details'
    ]);
}
?>