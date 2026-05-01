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
            // 1. Osnovni podaci o korisniku
            $query = "SELECT id, username, email, avatar_url, points, created_at, is_admin 
                      FROM " . $this->userTable . " WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $userId);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) return ['success' => false, 'message' => 'Korisnik nije pronađen'];

            // 2. Dinamički rank (pozicija na ljestvici prema bodovima)
            $rankQuery = "SELECT COUNT(*) + 1 as current_rank FROM " . $this->userTable . " WHERE points > :user_points";
            $rankStmt = $this->db->prepare($rankQuery);
            $rankStmt->bindParam(':user_points', $user['points']);
            $rankStmt->execute();
            $rankData = $rankStmt->fetch(PDO::FETCH_ASSOC);
            $calculatedRank = $rankData['current_rank'];

            // 3. Ukupno rješenja korisnika
            $solveCountQuery = "SELECT COUNT(*) as total FROM " . $this->solvesTable . " WHERE user_id = :uid";
            $solveStmt = $this->db->prepare($solveCountQuery);
            $solveStmt->bindParam(':uid', $userId);
            $solveStmt->execute();
            $solveCount = $solveStmt->fetch(PDO::FETCH_ASSOC)['total'];

            // 4. Zadnja aktivnost (vrijeme zadnjeg solve-a)
            $lastActQuery = "SELECT solved_at FROM " . $this->solvesTable . " 
                             WHERE user_id = :uid ORDER BY solved_at DESC LIMIT 1";
            $lastStmt = $this->db->prepare($lastActQuery);
            $lastStmt->bindParam(':uid', $userId);
            $lastStmt->execute();
            $lastActivity = $lastStmt->fetch(PDO::FETCH_ASSOC);

            // 5. Tri nedavna rješenja za tablicu
            $recentQuery = "SELECT c.title as challenge, cat.name as category, c.points, s.solved_at 
                            FROM " . $this->solvesTable . " s
                            JOIN " . $this->challengesTable . " c ON s.challenge_id = c.id
                            JOIN " . $this->categoriesTable . " cat ON c.category_id = cat.id
                            WHERE s.user_id = :uid 
                            ORDER BY s.solved_at DESC LIMIT 3";
            $recentStmt = $this->db->prepare($recentQuery);
            $recentStmt->bindParam(':uid', $userId);
            $recentStmt->execute();
            $recentSolves = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

            // Formatiranje liste rješenja za frontend
            $formattedSolves = [];
            foreach ($recentSolves as $solve) {
                $formattedSolves[] = [
                    'challenge' => $solve['challenge'],
                    'category' => $solve['category'],
                    'points' => $solve['points'],
                    'time' => $this->timeAgo($solve['solved_at'])
                ];
            }

            return [
                'success' => true,
                'profile' => [
                    'username' => $user['username'],
                    'points' => (int)$user['points'],
                    'rank' => (int)$calculatedRank,
                    'solves' => (int)$solveCount,
                    'joinedDate' => date('F Y', strtotime($user['created_at'])),
                    'lastActive' => $lastActivity ? $this->timeAgo($lastActivity['solved_at']) : 'No activity yet',
                    'avatar_url' => $user['avatar_url'],
                    'is_admin' => (bool)$user['is_admin']
                ],
                'recentSolves' => $formattedSolves,
                'categoryProgress' => $this->getCategoryProgress($userId)
            ];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    // Računanje progresa (rješeno/ukupno) po kategorijama
    private function getCategoryProgress($userId) {
        $query = "SELECT cat.name, 
                         COUNT(s.id) as solved,
                         (SELECT COUNT(*) FROM challenges WHERE category_id = cat.id) as total
                  FROM categories cat
                  LEFT JOIN challenges c ON cat.id = c.category_id
                  LEFT JOIN solves s ON c.id = s.challenge_id AND s.user_id = :uid
                  GROUP BY cat.id, cat.name";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':uid', $userId);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($rows as &$row) {
            $row['percentage'] = $row['total'] > 0 ? round(($row['solved'] / $row['total']) * 100) : 0;
        }
        return $rows;
    }

    // Pretvaranje timestampa u "time ago" format
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

// Izvršavanje skripte
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
    echo json_encode($profile->getUserProfile($userId));
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>