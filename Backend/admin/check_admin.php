<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class AdminAuth {
    private $db;
    private $userTable = 'users';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function checkAdmin($userId) {
        try {
            $query = "SELECT is_admin FROM " . $this->userTable . " WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $userId);
            $stmt->execute();

            if ($stmt->rowCount() == 0) {
                return ['success' => false, 'message' => 'Korisnik nije pronađen'];
            }

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user['is_admin']) {
                return ['success' => false, 'message' => 'Nemaš administratorske privilegije'];
            }

            return ['success' => true, 'message' => 'Admin access granted'];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? '';

    if (empty($userId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID je obavezan']);
        exit();
    }

    $adminAuth = new AdminAuth();
    $result = $adminAuth->checkAdmin($userId);
    
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>