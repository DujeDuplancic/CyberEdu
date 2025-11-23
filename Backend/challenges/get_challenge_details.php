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

class ChallengeDetails {
    private $db;
    private $challengesTable = 'challenges';
    private $categoriesTable = 'categories';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getChallengeDetails($challengeId) {
        try {
            $query = "SELECT c.*, cat.name as category_name 
                     FROM " . $this->challengesTable . " c 
                     LEFT JOIN " . $this->categoriesTable . " cat ON c.category_id = cat.id 
                     WHERE c.id = :id AND c.is_active = true";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $challengeId);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $challenge = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Vrati samo public podatke (bez flag-a)
                $publicData = [
                    'id' => $challenge['id'],
                    'title' => $challenge['title'],
                    'description' => $challenge['description'],
                    'category_name' => $challenge['category_name'],
                    'category_id' => $challenge['category_id'],
                    'difficulty' => $challenge['difficulty'],
                    'points' => $challenge['points'],
                    'file_url' => $challenge['file_url'],
                    'created_at' => $challenge['created_at']
                ];

                return ['success' => true, 'challenge' => $publicData];
            } else {
                return ['success' => false, 'message' => 'Challenge not found'];
            }

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $challengeId = $_GET['id'] ?? '';
    
    if (empty($challengeId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Challenge ID is required']);
        exit();
    }

    $challengeDetails = new ChallengeDetails();
    $result = $challengeDetails->getChallengeDetails($challengeId);
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>