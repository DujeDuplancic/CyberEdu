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

class Achievements {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getAllAchievements($user_id = null) {
        try {
            $query = "
                SELECT 
                    a.*,
                    c.name as category_name,
                    CASE 
                        WHEN ua.user_id IS NOT NULL THEN 1
                        ELSE 0
                    END as unlocked,
                    ua.unlocked_at
                FROM achievements a
                LEFT JOIN categories c ON a.category_id = c.id
                LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = :user_id
                WHERE a.is_hidden = 0 OR :user_id IS NOT NULL
                ORDER BY 
                    CASE WHEN ua.user_id IS NOT NULL THEN 0 ELSE 1 END,
                    a.points_reward DESC,
                    a.name ASC
            ";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            
            $achievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format unlocked_at date
            foreach ($achievements as &$achievement) {
                $achievement['unlocked'] = (bool)$achievement['unlocked'];
                $achievement['unlocked_at_formatted'] = $achievement['unlocked_at'] 
                    ? date('Y-m-d H:i', strtotime($achievement['unlocked_at'])) 
                    : null;
            }
            
            return ['success' => true, 'achievements' => $achievements];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function getUserAchievements($user_id) {
        try {
            $query = "
                SELECT 
                    a.*,
                    c.name as category_name,
                    ua.unlocked_at,
                    DATE_FORMAT(ua.unlocked_at, '%Y-%m-%d %H:%i') as unlocked_at_formatted
                FROM user_achievements ua
                JOIN achievements a ON ua.achievement_id = a.id
                LEFT JOIN categories c ON a.category_id = c.id
                WHERE ua.user_id = :user_id
                ORDER BY ua.unlocked_at DESC
            ";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            
            $achievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ['success' => true, 'achievements' => $achievements];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function checkNewAchievements($user_id) {
        try {
            // Get user stats
            $statsQuery = "
                SELECT 
                    COUNT(DISTINCT s.challenge_id) as total_solves,
                    SUM(c.points) as total_points,
                    GROUP_CONCAT(DISTINCT cat.id) as solved_categories
                FROM solves s
                JOIN challenges c ON s.challenge_id = c.id
                JOIN categories cat ON c.category_id = cat.id
                WHERE s.user_id = :user_id
            ";
            
            $stmt = $this->db->prepare($statsQuery);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get user's current achievements
            $currentQuery = "SELECT achievement_id FROM user_achievements WHERE user_id = :user_id";
            $stmt = $this->db->prepare($currentQuery);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            $currentAchievements = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'achievement_id');
            
            // Get all achievements that user hasn't unlocked yet
            $achievementsQuery = "
                SELECT * FROM achievements 
                WHERE id NOT IN (" . implode(',', array_fill(0, count($currentAchievements), '?')) . ")
            ";
            
            $stmt = $this->db->prepare($achievementsQuery);
            if (!empty($currentAchievements)) {
                foreach ($currentAchievements as $index => $achievement_id) {
                    $stmt->bindValue($index + 1, $achievement_id, PDO::PARAM_INT);
                }
            }
            $stmt->execute();
            $allAchievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $newAchievements = [];
            
            foreach ($allAchievements as $achievement) {
                if ($this->checkAchievementCriteria($achievement, $stats, $user_id)) {
                    // Unlock achievement
                    $this->unlockAchievement($user_id, $achievement['id']);
                    $newAchievements[] = $achievement;
                }
            }
            
            return ['success' => true, 'new_achievements' => $newAchievements];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    private function checkAchievementCriteria($achievement, $stats, $user_id) {
        switch ($achievement['criteria_type']) {
            case 'solves_count':
                if (!$achievement['category_id']) {
                    // Global solves count
                    return $stats['total_solves'] >= $achievement['criteria_value'];
                } else {
                    // Category specific solves count
                    $categorySolvesQuery = "
                        SELECT COUNT(DISTINCT s.challenge_id) as count
                        FROM solves s
                        JOIN challenges c ON s.challenge_id = c.id
                        WHERE s.user_id = :user_id AND c.category_id = :category_id
                    ";
                    
                    $stmt = $this->db->prepare($categorySolvesQuery);
                    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $stmt->bindParam(':category_id', $achievement['category_id'], PDO::PARAM_INT);
                    $stmt->execute();
                    $result = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    return $result['count'] >= $achievement['criteria_value'];
                }
                
            case 'points_total':
                return $stats['total_points'] >= $achievement['criteria_value'];
                
            default:
                return false;
        }
    }

    private function unlockAchievement($user_id, $achievement_id) {
        try {
            $query = "INSERT INTO user_achievements (user_id, achievement_id) VALUES (:user_id, :achievement_id)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':achievement_id', $achievement_id, PDO::PARAM_INT);
            $stmt->execute();
            
            // Update user points if achievement has reward
            $pointsQuery = "SELECT points_reward FROM achievements WHERE id = :achievement_id";
            $stmt = $this->db->prepare($pointsQuery);
            $stmt->bindParam(':achievement_id', $achievement_id, PDO::PARAM_INT);
            $stmt->execute();
            $reward = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($reward['points_reward'] > 0) {
                $updateQuery = "UPDATE users SET points = points + :reward WHERE id = :user_id";
                $stmt = $this->db->prepare($updateQuery);
                $stmt->bindParam(':reward', $reward['points_reward'], PDO::PARAM_INT);
                $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                $stmt->execute();
            }
            
            return true;
            
        } catch (PDOException $e) {
            // Duplicate entry error (achievement already unlocked)
            if ($e->errorInfo[1] == 1062) {
                return false;
            }
            throw $e;
        }
    }
}

// Handle GET requests
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $achievements = new Achievements();
    
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    $action = isset($_GET['action']) ? $_GET['action'] : 'all';
    
    switch ($action) {
        case 'user':
            if (!$user_id) {
                echo json_encode(['success' => false, 'message' => 'User ID required']);
                exit();
            }
            $result = $achievements->getUserAchievements($user_id);
            break;
            
        case 'check':
            if (!$user_id) {
                echo json_encode(['success' => false, 'message' => 'User ID required']);
                exit();
            }
            $result = $achievements->checkNewAchievements($user_id);
            break;
            
        default:
            $result = $achievements->getAllAchievements($user_id);
    }
    
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>