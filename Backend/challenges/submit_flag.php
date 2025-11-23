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

class FlagSubmit {
    private $db;
    private $challengesTable = 'challenges';
    private $solvesTable = 'solves';
    private $usersTable = 'users';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function submitFlag($userId, $challengeId, $submittedFlag) {
        try {
            // Provjeri da li je challenge aktivan
            $query = "SELECT id, flag, points FROM " . $this->challengesTable . " 
                     WHERE id = :challenge_id AND is_active = true";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':challenge_id', $challengeId);
            $stmt->execute();

            if ($stmt->rowCount() == 0) {
                return ['success' => false, 'message' => 'Challenge nije pronađen ili nije aktivan'];
            }

            $challenge = $stmt->fetch(PDO::FETCH_ASSOC);

            // Provjeri da li je korisnik već riješio challenge
            $query = "SELECT id FROM " . $this->solvesTable . " 
                     WHERE user_id = :user_id AND challenge_id = :challenge_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':challenge_id', $challengeId);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return ['success' => false, 'message' => 'Već ste riješili ovaj challenge!'];
            }

            // Provjeri flag
            if (password_verify($submittedFlag, $challenge['flag'])) {
                // Zabilježi solve
                $query = "INSERT INTO " . $this->solvesTable . " (user_id, challenge_id) VALUES (:user_id, :challenge_id)";
                $stmt = $this->db->prepare($query);
                $stmt->bindParam(':user_id', $userId);
                $stmt->bindParam(':challenge_id', $challengeId);
                $stmt->execute();

                // Dodaj points korisniku
                $query = "UPDATE " . $this->usersTable . " SET points = points + :points WHERE id = :user_id";
                $stmt = $this->db->prepare($query);
                $stmt->bindParam(':points', $challenge['points']);
                $stmt->bindParam(':user_id', $userId);
                $stmt->execute();

                return ['success' => true, 'message' => 'Točno! Challenge riješen!', 'points' => $challenge['points']];
            } else {
                return ['success' => false, 'message' => 'Pogrešan flag! Pokušajte ponovno.'];
            }

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = $input['user_id'] ?? '';
    $challengeId = $input['challenge_id'] ?? '';
    $flag = $input['flag'] ?? '';

    if (empty($userId) || empty($challengeId) || empty($flag)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Svi podaci su obavezni']);
        exit();
    }

    $flagSubmit = new FlagSubmit();
    $result = $flagSubmit->submitFlag($userId, $challengeId, $flag);
    
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>