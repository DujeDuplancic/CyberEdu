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

class Challenges {
    private $db;
    private $challengesTable = 'challenges';
    private $categoriesTable = 'categories';
    private $solvesTable = 'solves';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getAllChallenges($userId = null) {
        try {
            $query = "SELECT c.id, c.title, c.description, c.difficulty, c.points, c.created_at,
                             cat.name as category_name, cat.id as category_id,
                             COUNT(s.id) as solves_count,
                             EXISTS(SELECT 1 FROM solves WHERE user_id = :user_id AND challenge_id = c.id) as solved
                      FROM " . $this->challengesTable . " c
                      LEFT JOIN " . $this->categoriesTable . " cat ON c.category_id = cat.id
                      LEFT JOIN " . $this->solvesTable . " s ON c.id = s.challenge_id
                      WHERE c.is_active = true
                      GROUP BY c.id
                      ORDER BY c.points ASC";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();

            $challenges = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ['success' => true, 'challenges' => $challenges];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $userId = $_GET['user_id'] ?? null;
    
    $challenges = new Challenges();
    $result = $challenges->getAllChallenges($userId);
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>