<?php
// CORS headers - OBAVEZNO na samom vrhu!
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
    
    // Get query parameters
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $category = isset($_GET['category']) ? $_GET['category'] : null;
    $search = isset($_GET['search']) ? $_GET['search'] : null;
    $offset = ($page - 1) * $limit;
    
    // Build query sa question marks
    $query = "
        SELECT 
            d.*,
            u.username as author_name
        FROM discussions d
        LEFT JOIN users u ON d.author_id = u.id
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($category && $category !== 'all' && $category !== 'All') {
        $query .= " AND d.category = ?";
        $params[] = $category;
    }
    
    if ($search) {
        $query .= " AND (d.title LIKE ? OR d.content LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    $query .= " ORDER BY d.is_pinned DESC, d.created_at DESC";
    $query .= " LIMIT ? OFFSET ?";
    
    // Dodaj limit i offset na kraj params array-a
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $conn->prepare($query);
    
    // Bind parameters sa tipovima
    foreach ($params as $index => $param) {
        $paramType = is_int($param) ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindValue($index + 1, $param, $paramType);
    }
    
    $stmt->execute();
    $discussions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count
    $countQuery = "SELECT COUNT(*) as total FROM discussions WHERE 1=1";
    $countParams = [];
    
    if ($category && $category !== 'all' && $category !== 'All') {
        $countQuery .= " AND category = ?";
        $countParams[] = $category;
    }
    
    if ($search) {
        $countQuery .= " AND (title LIKE ? OR content LIKE ?)";
        $countParams[] = "%$search%";
        $countParams[] = "%$search%";
    }
    
    $stmt = $conn->prepare($countQuery);
    
    foreach ($countParams as $index => $param) {
        $stmt->bindValue($index + 1, $param, PDO::PARAM_STR);
    }
    
    $stmt->execute();
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Dodaj reply count
    foreach ($discussions as &$discussion) {
        $replyQuery = "SELECT COUNT(*) as reply_count FROM replies WHERE discussion_id = ?";
        $replyStmt = $conn->prepare($replyQuery);
        $replyStmt->execute([$discussion['id']]);
        $replyCount = $replyStmt->fetch(PDO::FETCH_ASSOC);
        $discussion['reply_count'] = $replyCount['reply_count'] ?? 0;
    }
    
    echo json_encode([
        'success' => true,
        'discussions' => $discussions,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch discussions: ' . $e->getMessage()
    ]);
}
?>