<?php
// OBAVEZNO na samom vrhu - prije bilo kakvog outputa!
error_reporting(0); // Isključi error reporting
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log za debugging
error_log("=== FLAG SUBMIT REQUEST ===");

try {
    require_once '../config/database.php';
    
    $input = json_decode(file_get_contents('php://input'), true);
    error_log("Input received: " . print_r($input, true));
    
    if (!$input) {
        throw new Exception("Invalid JSON input");
    }
    
    $userId = $input['user_id'] ?? '';
    $challengeId = $input['challenge_id'] ?? '';
    $flag = $input['flag'] ?? '';
    
    if (empty($userId) || empty($challengeId) || empty($flag)) {
        throw new Exception("Missing required fields");
    }
    
    class FlagSubmit {
        private $db;
        
        public function __construct() {
            $database = new Database();
            $this->db = $database->getConnection();
            if (!$this->db) {
                throw new Exception("Database connection failed");
            }
        }
        
        public function submitFlag($userId, $challengeId, $submittedFlag) {
            error_log("Submitting flag for user $userId, challenge $challengeId");
            
            // Provjeri challenge
            $query = "SELECT id, flag, points FROM challenges WHERE id = :challenge_id AND is_active = true";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':challenge_id', $challengeId);
            $stmt->execute();
            
            if ($stmt->rowCount() == 0) {
                return ['success' => false, 'message' => 'Challenge nije pronađen ili nije aktivan'];
            }
            
            $challenge = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Provjeri flag
            if (!password_verify($submittedFlag, $challenge['flag'])) {
                return ['success' => false, 'message' => 'Pogrešan flag! Pokušajte ponovno.'];
            }
            
            // Provjeri da li je već riješeno
            $query = "SELECT id FROM solves WHERE user_id = :user_id AND challenge_id = :challenge_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':challenge_id', $challengeId);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                return ['success' => false, 'message' => 'Već ste riješili ovaj challenge!'];
            }
            
            // Zabilježi solve
            $query = "INSERT INTO solves (user_id, challenge_id) VALUES (:user_id, :challenge_id)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':challenge_id', $challengeId);
            $stmt->execute();
            
            // Dodaj points
            $query = "UPDATE users SET points = points + :points WHERE id = :user_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':points', $challenge['points']);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            
            // Provjeri achievemente
            $newAchievements = $this->checkAndUnlockAchievements($userId);
            
            $response = [
                'success' => true, 
                'message' => 'Točno! Challenge riješen!', 
                'points' => $challenge['points']
            ];
            
            if (!empty($newAchievements)) {
                $response['new_achievements'] = $newAchievements;
            }
            
            return $response;
        }
        
        private function checkAndUnlockAchievements($userId) {
            try {
                error_log("Checking achievements for user $userId");
                
                // Broj solves
                $statsQuery = "SELECT COUNT(DISTINCT challenge_id) as total_solves FROM solves WHERE user_id = :user_id";
                $stmt = $this->db->prepare($statsQuery);
                $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $stmt->execute();
                $stats = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $totalSolves = $stats['total_solves'] ?? 0;
                error_log("User $userId has $totalSolves solves");
                
                // Dohvati achievemente koje korisnik još nema
                $query = "
                    SELECT a.* 
                    FROM achievements a 
                    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = :user_id
                    WHERE ua.id IS NULL
                ";
                
                $stmt = $this->db->prepare($query);
                $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $stmt->execute();
                $achievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                error_log("Found " . count($achievements) . " achievements to check");
                
                $newAchievements = [];
                
                foreach ($achievements as $achievement) {
                    error_log("Checking achievement: " . $achievement['name'] . " (criteria: " . $achievement['criteria_type'] . " = " . $achievement['criteria_value'] . ")");
                    
                    $unlock = false;
                    
                    if ($achievement['criteria_type'] == 'solves_count' && !$achievement['category_id']) {
                        // Global solves count
                        if ($totalSolves >= $achievement['criteria_value']) {
                            $unlock = true;
                            error_log("Unlocking achievement " . $achievement['name'] . " - solves: $totalSolves >= " . $achievement['criteria_value']);
                        }
                    }
                    
                    if ($unlock) {
                        // Unlock achievement
                        $insertQuery = "INSERT INTO user_achievements (user_id, achievement_id) VALUES (:user_id, :achievement_id)";
                        $insertStmt = $this->db->prepare($insertQuery);
                        $insertStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
                        $insertStmt->bindParam(':achievement_id', $achievement['id'], PDO::PARAM_INT);
                        
                        if ($insertStmt->execute()) {
                            // Add points if achievement has reward
                            if ($achievement['points_reward'] > 0) {
                                $updateQuery = "UPDATE users SET points = points + :reward WHERE id = :user_id";
                                $updateStmt = $this->db->prepare($updateQuery);
                                $updateStmt->bindParam(':reward', $achievement['points_reward'], PDO::PARAM_INT);
                                $updateStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
                                $updateStmt->execute();
                            }
                            
                            $newAchievements[] = [
                                'id' => $achievement['id'],
                                'name' => $achievement['name'],
                                'description' => $achievement['description'],
                                'points_reward' => $achievement['points_reward']
                            ];
                            
                            error_log("Achievement " . $achievement['name'] . " unlocked!");
                        }
                    }
                }
                
                return $newAchievements;
                
            } catch (Exception $e) {
                error_log("Achievement check error: " . $e->getMessage());
                return [];
            }
        }
    }
    
    $flagSubmit = new FlagSubmit();
    $result = $flagSubmit->submitFlag($userId, $challengeId, $flag);
    
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log("Global error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>