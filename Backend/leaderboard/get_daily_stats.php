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

class DailyStats {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getDailyStats($days = 7) {
        try {
            $query = "
                SELECT 
                    DATE(s.solved_at) as date,
                    COUNT(DISTINCT s.user_id) as active_users,
                    COUNT(s.id) as total_solves,
                    SUM(c.points) as total_points
                FROM solves s
                JOIN challenges c ON s.challenge_id = c.id
                WHERE s.solved_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
                GROUP BY DATE(s.solved_at)
                ORDER BY date DESC
            ";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':days', $days, PDO::PARAM_INT);
            $stmt->execute();
            
            $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'stats' => $stats,
                'days' => $days
            ];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Greška: ' . $e->getMessage()];
        }
    }
}

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $days = isset($_GET['days']) ? intval($_GET['days']) : 7;
    
    $dailyStats = new DailyStats();
    $result = $dailyStats->getDailyStats($days);
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Samo GET metoda je dozvoljena']);
}
?>