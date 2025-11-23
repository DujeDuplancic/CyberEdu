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

    public function updateChallenge($challengeId, $title = null, $description = null, $categoryId = null, $difficulty = null, $points = null, $flag = null, $fileUrl = null) {
        try {
            error_log("🔄 Updating challenge $challengeId with data:");
            error_log("  Title: " . ($title ?? 'not provided'));
            error_log("  Description: " . ($description ?? 'not provided')); 
            error_log("  Category ID: " . ($categoryId ?? 'not provided'));
            error_log("  Difficulty: " . ($difficulty ?? 'not provided'));
            error_log("  Points: " . ($points ?? 'not provided'));
            error_log("  Flag: " . ($flag ? 'provided' : 'not provided'));
            error_log("  File URL: " . ($fileUrl ?? 'not provided'));

            // Start building the query
            $query = "UPDATE " . $this->table . " SET ";
            $params = [];
            $updates = [];

            // Add fields only if they are provided
            if ($title !== null) {
                $updates[] = "title = :title";
                $params[':title'] = $title;
            }

            if ($description !== null) {
                $updates[] = "description = :description";
                $params[':description'] = $description;
            }

            if ($categoryId !== null) {
                $updates[] = "category_id = :category_id";
                $params[':category_id'] = $categoryId;
            }

            if ($difficulty !== null) {
                $updates[] = "difficulty = :difficulty";
                $params[':difficulty'] = $difficulty;
            }

            if ($points !== null) {
                $updates[] = "points = :points";
                $params[':points'] = $points;
            }

            if ($flag !== null) {
                $hashedFlag = password_hash($flag, PASSWORD_DEFAULT);
                $updates[] = "flag = :flag";
                $params[':flag'] = $hashedFlag;
            }

            if ($fileUrl !== null) {
                $updates[] = "file_url = :file_url";
                $params[':file_url'] = $fileUrl;
            }

            // If no fields to update, return error
            if (empty($updates)) {
                return ['success' => false, 'message' => 'No fields to update'];
            }

            $query .= implode(', ', $updates);
            $query .= " WHERE id = :id";
            $params[':id'] = $challengeId;

            error_log("📝 Executing query: " . $query);
            error_log("📦 Parameters: " . print_r($params, true));

            $stmt = $this->db->prepare($query);
            
            if ($stmt->execute($params)) {
                $affectedRows = $stmt->rowCount();
                error_log("✅ Challenge updated successfully. Affected rows: $affectedRows");
                return ['success' => true, 'message' => 'Challenge updated successfully'];
            } else {
                $errorInfo = $stmt->errorInfo();
                error_log("❌ Error updating challenge: " . $errorInfo[2]);
                return ['success' => false, 'message' => 'Error updating challenge: ' . $errorInfo[2]];
            }

        } catch (PDOException $e) {
            error_log("❌ Database error: " . $e->getMessage());
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
    
    error_log("📨 Received update request: " . print_r($input, true));
    
    $challengeId = $input['id'] ?? '';
    
    if (empty($challengeId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Challenge ID is required']);
        exit();
    }

    // Extract optional fields - only those that are provided
    $title = $input['title'] ?? null;
    $description = $input['description'] ?? null;
    $categoryId = $input['category_id'] ?? null;
    $difficulty = $input['difficulty'] ?? null;
    $points = $input['points'] ?? null;
    $flag = $input['flag'] ?? null;
    $fileUrl = $input['file_url'] ?? null;

    $updater = new ChallengeUpdater();
    $result = $updater->updateChallenge($challengeId, $title, $description, $categoryId, $difficulty, $points, $flag, $fileUrl);
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>