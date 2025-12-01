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

class Profile {
    private $db;
    private $userTable = 'users';
    private $solvesTable = 'solves';
    private $challengesTable = 'challenges';
    private $categoriesTable = 'categories';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getUserProfile($userId) {
        try {
            $query = "SELECT id, username, email, avatar_url, points, rank, created_at, is_admin 
                     FROM " . $this->userTable . " WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $userId);
            $stmt->execute();

            if ($stmt->rowCount() == 0) {
                return ['success' => false, 'message' => 'Korisnik nije pronađen'];
            }

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            $query = "SELECT COUNT(*) as total_solves FROM " . $this->solvesTable . " WHERE user_id = :user_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            $solvesData = $stmt->fetch(PDO::FETCH_ASSOC);

            $query = "SELECT solved_at FROM " . $this->solvesTable . " 
                     WHERE user_id = :user_id ORDER BY solved_at DESC LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            $lastActivity = $stmt->fetch(PDO::FETCH_ASSOC);

            $query = "SELECT c.title as challenge, cat.name as category, c.points, s.solved_at 
                     FROM " . $this->solvesTable . " s
                     JOIN " . $this->challengesTable . " c ON s.challenge_id = c.id
                     JOIN " . $this->categoriesTable . " cat ON c.category_id = cat.id
                     WHERE s.user_id = :user_id 
                     ORDER BY s.solved_at DESC LIMIT 3";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            $recentSolves = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $query = "SELECT cat.name, 
                             COUNT(s.id) as solved,
                             (SELECT COUNT(*) FROM challenges WHERE category_id = cat.id) as total
                     FROM categories cat
                     LEFT JOIN challenges c ON cat.id = c.category_id
                     LEFT JOIN solves s ON c.id = s.challenge_id AND s.user_id = :user_id
                     GROUP BY cat.id, cat.name";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            $categoryProgress = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $formattedSolves = [];
            foreach ($recentSolves as $solve) {
                $formattedSolves[] = [
                    'challenge' => $solve['challenge'],
                    'category' => $solve['category'],
                    'points' => $solve['points'],
                    'time' => $this->timeAgo($solve['solved_at'])
                ];
            }

            $formattedCategories = [];
            foreach ($categoryProgress as $category) {
                $percentage = $category['total'] > 0 ? round(($category['solved'] / $category['total']) * 100) : 0;
                $formattedCategories[] = [
                    'name' => $category['name'],
                    'solved' => (int)$category['solved'],
                    'total' => (int)$category['total'],
                    'percentage' => $percentage
                ];
            }

            return [
                'success' => true,
                'profile' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'avatar_url' => $user['avatar_url'],
                    'points' => $user['points'],
                    'rank' => $user['rank'],
                    'solves' => (int)$solvesData['total_solves'],
                    'joinedDate' => date('F Y', strtotime($user['created_at'])),
                    'lastActive' => $lastActivity ? $this->timeAgo($lastActivity['solved_at']) : 'Never',
                    'is_admin' => (bool)$user['is_admin']
                ],
                'recentSolves' => $formattedSolves,
                'categoryProgress' => $formattedCategories
            ];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    private function timeAgo($datetime) {
        $time = strtotime($datetime);
        $diff = time() - $time;
        
        if ($diff < 60) return 'just now';
        if ($diff < 3600) return round($diff/60) . ' minutes ago';
        if ($diff < 86400) return round($diff/3600) . ' hours ago';
        if ($diff < 2592000) return round($diff/86400) . ' days ago';
        return date('F j, Y', $time);
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $userId = $_GET['user_id'] ?? '';
    
    if (empty($userId)) {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? '';
    }

    if (empty($userId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID je obavezan']);
        exit();
    }

    $profile = new Profile();
    $result = $profile->getUserProfile($userId);
    
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>