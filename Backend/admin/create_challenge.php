<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Ako zahtjev dolazi s localhosta ili s Vercela, odobri BAŠ TU domenu koja pita
if ($origin === "http://localhost:5173" || $origin === "https://cyber-edu-p46j.vercel.app") {
    header("Access-Control-Allow-Origin: " . $origin);
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class ChallengeCreator {
    private $db;
    private $table = 'challenges';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function createChallenge($title, $description, $categoryId, $difficulty, $points, $flag, $createdBy) {
        try {
            // Hashaj flag prije spremanja
            $hashedFlag = password_hash($flag, PASSWORD_DEFAULT);

            $query = "INSERT INTO " . $this->table . " 
                     (title, description, category_id, difficulty, points, flag, created_by) 
                     VALUES (:title, :description, :category_id, :difficulty, :points, :flag, :created_by)";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':category_id', $categoryId);
            $stmt->bindParam(':difficulty', $difficulty);
            $stmt->bindParam(':points', $points);
            $stmt->bindParam(':flag', $hashedFlag);
            $stmt->bindParam(':created_by', $createdBy);

            if ($stmt->execute()) {
                // VAŽNO: vraćamo ID upravo kreiranog izazova kako bi frontend
                // mogao u istom flow-u uploadati i privitak preko upload_file.php.
                $newId = (int)$this->db->lastInsertId();
                return [
                    'success'      => true,
                    'message'      => 'Challenge created successfully',
                    'challenge_id' => $newId,
                    'id'           => $newId
                ];
            } else {
                return ['success' => false, 'message' => 'Failed to create challenge'];
            }

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $title = $input['title'] ?? '';
    $description = $input['description'] ?? '';
    $categoryId = $input['category_id'] ?? '';
    $difficulty = $input['difficulty'] ?? '';
    $points = $input['points'] ?? '';
    $flag = $input['flag'] ?? '';
    $createdBy = $input['created_by'] ?? '';

    // Validacija
    if (empty($title) || empty($description) || empty($categoryId) || empty($difficulty) || empty($points) || empty($flag) || empty($createdBy)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Sva polja su obavezna']);
        exit();
    }

    if (!in_array($difficulty, ['Easy', 'Medium', 'Hard'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Nevažeća težina']);
        exit();
    }

    $challengeCreator = new ChallengeCreator();
    $result = $challengeCreator->createChallenge($title, $description, $categoryId, $difficulty, $points, $flag, $createdBy);
    
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>