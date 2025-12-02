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

class UserStats {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getUserStats($user_id) {
        try {
            // 1. Osnovni podaci o korisniku
            $user_query = "SELECT id, username, avatar_url, points, rank FROM users WHERE id = :user_id";
            $user_stmt = $this->db->prepare($user_query);
            $user_stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $user_stmt->execute();
            
            if ($user_stmt->rowCount() == 0) {
                return ['success' => false, 'message' => 'Korisnik nije pronađen'];
            }
            
            $user = $user_stmt->fetch(PDO::FETCH_ASSOC);
            
            // 2. Statistika po kategorijama
            $category_query = "
                SELECT 
                    cat.id,
                    cat.name,
                    cat.icon_name,
                    COUNT(DISTINCT s.challenge_id) as solves_count,
                    COALESCE(SUM(c.points), 0) as category_points
                FROM categories cat
                LEFT JOIN challenges c ON cat.id = c.category_id
                LEFT JOIN solves s ON c.id = s.challenge_id AND s.user_id = :user_id
                GROUP BY cat.id, cat.name, cat.icon_name
                ORDER BY cat.name
            ";
            
            $category_stmt = $this->db->prepare($category_query);
            $category_stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $category_stmt->execute();
            $category_stats = $category_stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // 3. Zadnja riješenja
            $recent_solves_query = "
                SELECT 
                    ch.title,
                    ch.points,
                    ch.difficulty,
                    cat.name as category_name,
                    s.solved_at
                FROM solves s
                JOIN challenges ch ON s.challenge_id = ch.id
                JOIN categories cat ON ch.category_id = cat.id
                WHERE s.user_id = :user_id
                ORDER BY s.solved_at DESC
                LIMIT 10
            ";
            
            $recent_stmt = $this->db->prepare($recent_solves_query);
            $recent_stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $recent_stmt->execute();
            $recent_solves = $recent_stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'user' => $user,
                'category_stats' => $category_stats,
                'recent_solves' => $recent_solves
            ];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Greška: ' . $e->getMessage()];
        }
    }
}

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    
    if (!$user_id) {
        echo json_encode(['success' => false, 'message' => 'user_id je obavezan']);
        exit();
    }
    
    $userStats = new UserStats();
    $result = $userStats->getUserStats($user_id);
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Samo GET metoda je dozvoljena']);
}
?>