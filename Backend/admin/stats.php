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
    private $lecturesTable = 'lectures';
    private $wikiTable = 'wiki_articles'; // Dodano
    private $achievementsTable = 'achievements'; // Dodano

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getDashboardStats() {
        try {
            // 1. Ukupno korisnika
            $query = "SELECT COUNT(*) as total_users FROM " . $this->userTable;
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $users = $stmt->fetch(PDO::FETCH_ASSOC);

            // 2. Aktivni challengeovi
            $query = "SELECT COUNT(*) as total_challenges FROM " . $this->challengesTable . " WHERE is_active = true";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $challenges = $stmt->fetch(PDO::FETCH_ASSOC);

            // 3. Ukupno lekcija
            $query = "SELECT COUNT(*) as total_lectures FROM " . $this->lecturesTable;
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $lectures = $stmt->fetch(PDO::FETCH_ASSOC);

            // 4. Wiki Articles (Popravljeno)
            $query = "SELECT COUNT(*) as total_wiki FROM " . $this->wikiTable;
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $wiki = $stmt->fetch(PDO::FETCH_ASSOC);

            // 5. Achievements (Popravljeno)
            $query = "SELECT COUNT(*) as total_achievements FROM " . $this->achievementsTable;
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $achievements = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'stats' => [
                    'total_users' => (int)$users['total_users'],
                    'total_challenges' => (int)$challenges['total_challenges'],
                    'total_lectures' => (int)$lectures['total_lectures'],
                    'wiki_articles' => (int)$wiki['total_wiki'], // Ključ usklađen s frontendom
                    'total_achievements' => (int)$achievements['total_achievements'] // Ključ usklađen s frontendom
                ]
            ];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $adminStats = new AdminStats();
    $result = $adminStats->getDashboardStats();
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>