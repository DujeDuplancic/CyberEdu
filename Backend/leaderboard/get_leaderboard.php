<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class Leaderboard {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getLeaderboard($category_id = null) {
    try {
        // Query koji uključuje SVE korisnike, čak i one sa 0 bodova
        $query = "
            SELECT 
                u.id,
                u.username,
                u.avatar_url as profile_image,
                u.points as total_points,
                IFNULL(s.solves_count, 0) as total_solves
            FROM users u
            LEFT JOIN (
                SELECT user_id, COUNT(*) as solves_count 
                FROM solves 
                GROUP BY user_id
            ) s ON u.id = s.user_id
            ORDER BY u.points DESC, s.solves_count DESC, u.username ASC
        ";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $rank = 1;
        foreach ($users as &$user) {
            $user['rank'] = $rank++;
            $user['profile_image'] = $user['profile_image'] ?: null;
            $user['total_points'] = (int)$user['total_points'];
            $user['total_solves'] = (int)$user['total_solves'];
        }
        
        return [
            'success' => true, 
            'leaderboard' => $users,
            'total_users' => count($users)
        ];
        
    } catch (PDOException $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}
}

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : null;
    
    $leaderboard = new Leaderboard();
    $result = $leaderboard->getLeaderboard($category_id);
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Samo GET metoda je dozvoljena']);
}
?>