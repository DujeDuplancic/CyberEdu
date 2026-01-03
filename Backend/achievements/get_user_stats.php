<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
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

    public function getAchievementStats($user_id) {
        try {
            // Total achievements progress
            $totalQuery = "
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN ua.user_id IS NOT NULL THEN 1 ELSE 0 END) as unlocked
                FROM achievements a
                LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = :user_id
                WHERE a.is_hidden = 0
            ";
            
            $stmt = $this->db->prepare($totalQuery);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            $totalStats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Category achievements progress
            $categoryQuery = "
                SELECT 
                    c.name as category_name,
                    COUNT(a.id) as total_in_category,
                    SUM(CASE WHEN ua.user_id IS NOT NULL THEN 1 ELSE 0 END) as unlocked_in_category
                FROM achievements a
                LEFT JOIN categories c ON a.category_id = c.id
                LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = :user_id
                WHERE a.category_id IS NOT NULL AND a.is_hidden = 0
                GROUP BY c.id, c.name
                ORDER BY c.name
            ";
            
            $stmt = $this->db->prepare($categoryQuery);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            $categoryStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Recent unlocks
            $recentQuery = "
                SELECT 
                    a.name,
                    a.icon_url,
                    a.points_reward,
                    DATE_FORMAT(ua.unlocked_at, '%Y-%m-%d') as unlocked_date
                FROM user_achievements ua
                JOIN achievements a ON ua.achievement_id = a.id
                WHERE ua.user_id = :user_id
                ORDER BY ua.unlocked_at DESC
                LIMIT 5
            ";
            
            $stmt = $this->db->prepare($recentQuery);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            $recentUnlocks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'stats' => [
                    'total' => (int)$totalStats['total'],
                    'unlocked' => (int)$totalStats['unlocked'],
                    'percentage' => $totalStats['total'] > 0 
                        ? round(($totalStats['unlocked'] / $totalStats['total']) * 100, 1) 
                        : 0,
                    'category_stats' => $categoryStats,
                    'recent_unlocks' => $recentUnlocks
                ]
            ];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    
    if (!$user_id) {
        echo json_encode(['success' => false, 'message' => 'User ID required']);
        exit();
    }
    
    $stats = new UserStats();
    $result = $stats->getAchievementStats($user_id);
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>