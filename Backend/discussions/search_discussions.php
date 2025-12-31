<?php
require_once '../config/database.php';

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    $search = isset($_GET['q']) ? $_GET['q'] : '';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    
    if (empty($search)) {
        echo json_encode(['success' => true, 'results' => []]);
        exit();
    }
    
    $query = "
        SELECT 
            d.id,
            d.title,
            d.content,
            d.category,
            u.username as author_name,
            COUNT(r.id) as reply_count
        FROM discussions d
        LEFT JOIN users u ON d.author_id = u.id
        LEFT JOIN replies r ON d.id = r.discussion_id
        WHERE d.title LIKE ? OR d.content LIKE ?
        GROUP BY d.id
        ORDER BY d.created_at DESC
        LIMIT ?
    ";
    
    $stmt = $conn->prepare($query);
    $searchParam = "%$search%";
    $stmt->bindParam(1, $searchParam);
    $stmt->bindParam(2, $searchParam);
    $stmt->bindParam(3, $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'results' => $results
    ]);
    
} catch (Exception $e) {
    error_log("Error searching discussions: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'results' => []
    ]);
}
?>