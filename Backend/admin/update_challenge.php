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

class ChallengeUpdater {
    private $db;
    private $table = 'challenges';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function updateChallenge($challengeId, $title, $description, $categoryId, $difficulty, $points, $flag = null, $fileUrl = null) {
        try {
            $query = "UPDATE " . $this->table . " SET 
                     title = :title, 
                     description = :description, 
                     category_id = :category_id, 
                     difficulty = :difficulty, 
                     points = :points";
            
            $params = [
                ':title' => $title,
                ':description' => $description,
                ':category_id' => $categoryId,
                ':difficulty' => $difficulty,
                ':points' => $points,
                ':id' => $challengeId
            ];

            // Dodaj flag samo ako je promijenjen
            if ($flag !== null) {
                $hashedFlag = password_hash($flag, PASSWORD_DEFAULT);
                $query .= ", flag = :flag";
                $params[':flag'] = $hashedFlag;
            }

            // Dodaj file_url samo ako je promijenjen
            if ($fileUrl !== null) {
                $query .= ", file_url = :file_url";
                $params[':file_url'] = $fileUrl;
            }

            $query .= " WHERE id = :id";

            $stmt = $this->db->prepare($query);
            
            if ($stmt->execute($params)) {
                return ['success' => true, 'message' => 'Challenge updated successfully'];
            } else {
                return ['success' => false, 'message' => 'Error updating challenge'];
            }

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function getChallenge($challengeId) {
        try {
            $query = "SELECT c.*, cat.name as category_name 
                     FROM " . $this->table . " c 
                     LEFT JOIN categories cat ON c.category_id = cat.id 
                     WHERE c.id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $challengeId);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return ['success' => true, 'challenge' => $stmt->fetch(PDO::FETCH_ASSOC)];
            } else {
                return ['success' => false, 'message' => 'Challenge not found'];
            }

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Handle GET request - get challenge details
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $challengeId = $_GET['id'] ?? '';
    
    if (empty($challengeId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Challenge ID is required']);
        exit();
    }

    $updater = new ChallengeUpdater();
    $result = $updater->getChallenge($challengeId);
    echo json_encode($result);
}

// Handle POST request - update challenge
else if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $challengeId = $input['id'] ?? '';
    $title = $input['title'] ?? '';
    $description = $input['description'] ?? '';
    $categoryId = $input['category_id'] ?? '';
    $difficulty = $input['difficulty'] ?? '';
    $points = $input['points'] ?? '';
    $flag = $input['flag'] ?? null;
    $fileUrl = $input['file_url'] ?? null;

    // Validacija
    if (empty($challengeId) || empty($title) || empty($description) || empty($categoryId) || empty($difficulty) || empty($points)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields except flag and file are required']);
        exit();
    }

    $updater = new ChallengeUpdater();
    $result = $updater->updateChallenge($challengeId, $title, $description, $categoryId, $difficulty, $points, $flag, $fileUrl);
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>