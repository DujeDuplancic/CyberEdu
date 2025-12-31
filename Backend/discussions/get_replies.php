<?php
// CORS headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
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
    
    $discussion_id = isset($_GET['discussion_id']) ? (int)$_GET['discussion_id'] : 0;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;
    
    if (!$discussion_id) {
        echo json_encode(['success' => false, 'message' => 'Discussion ID required']);
        exit();
    }
    
    // Get replies
    $query = "
        SELECT 
            r.*,
            u.username as author_name,
            u.email as author_email
        FROM replies r
        LEFT JOIN users u ON r.author_id = u.id
        WHERE r.discussion_id = ?
        ORDER BY r.created_at ASC
        LIMIT ? OFFSET ?
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bindValue(1, $discussion_id, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->bindValue(3, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $replies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count
    $countQuery = "SELECT COUNT(*) as total FROM replies WHERE discussion_id = ?";
    $stmt = $conn->prepare($countQuery);
    $stmt->execute([$discussion_id]);
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode([
        'success' => true,
        'replies' => $replies,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error getting replies: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch replies'
    ]);
}
?>