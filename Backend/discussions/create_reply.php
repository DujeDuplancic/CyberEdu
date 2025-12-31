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

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Trebamo email ili user_id iz frontenda
    $user_email = $input['user_email'] ?? '';
    $user_id = $input['user_id'] ?? null;
    $discussion_id = (int)($input['discussion_id'] ?? 0);
    $content = trim($input['content'] ?? '');
    
    if (!$discussion_id || empty($content)) {
        echo json_encode(['success' => false, 'message' => 'Discussion ID and content are required']);
        exit();
    }
    
    try {
        $database = new Database();
        $conn = $database->getConnection();
        
        if (!$conn) {
            throw new Exception("Database connection failed");
        }
        
        // Ako nema user_id, ali ima email, dohvati user_id iz baze
        if (!$user_id && !empty($user_email)) {
            $query = "SELECT id FROM users WHERE email = ?";
            $stmt = $conn->prepare($query);
            $stmt->execute([$user_email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                $user_id = $user['id'];
            }
        }
        
        // Ako i dalje nema user_id, vrati error
        if (!$user_id) {
            echo json_encode([
                'success' => false, 
                'message' => 'User not identified. Please provide user_id or user_email',
                'received_data' => $input
            ]);
            exit();
        }
        
        // Verify discussion exists
        $check = $conn->prepare("SELECT id FROM discussions WHERE id = ?");
        $check->execute([$discussion_id]);
        if (!$check->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Discussion not found']);
            exit();
        }
        
        // Kreiraj reply
        $query = "INSERT INTO replies (discussion_id, author_id, content) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->execute([$discussion_id, $user_id, $content]);
        
        $reply_id = $conn->lastInsertId();
        
        // Dohvati kreirani reply
        $query = "
            SELECT r.*, u.username as author_name 
            FROM replies r 
            LEFT JOIN users u ON r.author_id = u.id 
            WHERE r.id = ?
        ";
        $stmt = $conn->prepare($query);
        $stmt->execute([$reply_id]);
        $reply = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Reply posted successfully',
            'reply' => $reply
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to post reply: ' . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>