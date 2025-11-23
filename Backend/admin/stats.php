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

class AdminStats {
    private $db;
    private $userTable = 'users';
    private $challengesTable = 'challenges';
    private $solvesTable = 'solves';
    private $lecturesTable = 'lectures';
    private $discussionsTable = 'discussions';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getDashboardStats() {
        try {
            // Ukupno korisnika
            $query = "SELECT COUNT(*) as total_users FROM " . $this->userTable;
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $users = $stmt->fetch(PDO::FETCH_ASSOC);

            // Aktivni challengeovi
            $query = "SELECT COUNT(*) as total_challenges FROM " . $this->challengesTable . " WHERE is_active = true";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $challenges = $stmt->fetch(PDO::FETCH_ASSOC);

            // Ukupno lekcija
            $query = "SELECT COUNT(*) as total_lectures FROM " . $this->lecturesTable;
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $lectures = $stmt->fetch(PDO::FETCH_ASSOC);

            // Forum postovi
            $query = "SELECT COUNT(*) as total_posts FROM " . $this->discussionsTable;
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $posts = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'stats' => [
                    'total_users' => (int)$users['total_users'],
                    'total_challenges' => (int)$challenges['total_challenges'],
                    'total_lectures' => (int)$lectures['total_lectures'],
                    'total_posts' => (int)$posts['total_posts']
                ]
            ];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $adminStats = new AdminStats();
    $result = $adminStats->getDashboardStats();
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>