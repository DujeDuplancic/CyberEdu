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
    
    $title = trim($input['title'] ?? '');
    $content = trim($input['content'] ?? '');
    $category = $input['category'] ?? 'General';
    
    if (empty($title) || empty($content)) {
        echo json_encode(['success' => false, 'message' => 'Title and content are required']);
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
        
        // Kreiraj diskusiju
        $query = "INSERT INTO discussions (title, content, author_id, category) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->execute([$title, $content, $user_id, $category]);
        
        $discussion_id = $conn->lastInsertId();
        
        // Dohvati kreiranu diskusiju
        $query = "
            SELECT d.*, u.username as author_name 
            FROM discussions d 
            LEFT JOIN users u ON d.author_id = u.id 
            WHERE d.id = ?
        ";
        $stmt = $conn->prepare($query);
        $stmt->execute([$discussion_id]);
        $discussion = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Discussion created successfully',
            'discussion' => $discussion
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create discussion: ' . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>