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

class ChallengeDeleter {
    private $db;
    private $table = 'challenges';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function deleteChallenge($challengeId) {
        try {
            // Prvo obriši sve povezane solves
            $query = "DELETE FROM solves WHERE challenge_id = :challenge_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':challenge_id', $challengeId);
            $stmt->execute();

            // Zatim obriši challenge
            $query = "DELETE FROM " . $this->table . " WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $challengeId);

            if ($stmt->execute()) {
                return ['success' => true, 'message' => 'Challenge deleted successfully'];
            } else {
                return ['success' => false, 'message' => 'Error deleting challenge'];
            }

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $challengeId = $input['id'] ?? '';

    if (empty($challengeId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Challenge ID is required']);
        exit();
    }

    $deleter = new ChallengeDeleter();
    $result = $deleter->deleteChallenge($challengeId);
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>