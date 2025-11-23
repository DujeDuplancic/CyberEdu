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

class AdminUsers {
    private $db;
    private $userTable = 'users';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // Dobavi sve korisnike
    public function getAllUsers() {
        try {
            $query = "SELECT id, username, email, points, rank, created_at, is_admin, avatar_url 
                     FROM " . $this->userTable . " 
                     ORDER BY created_at DESC 
                     LIMIT 50";
            $stmt = $this->db->prepare($query);
            $stmt->execute();

            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ['success' => true, 'users' => $users];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    // Promijeni admin status
    public function toggleAdmin($userId, $adminStatus) {
        try {
            $query = "UPDATE " . $this->userTable . " SET is_admin = :is_admin WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':is_admin', $adminStatus, PDO::PARAM_BOOL);
            $stmt->bindParam(':id', $userId);

            if ($stmt->execute()) {
                $action = $adminStatus ? 'promoviran u admina' : 'uklonjen iz admina';
                return ['success' => true, 'message' => 'Korisnik ' . $action];
            } else {
                return ['success' => false, 'message' => 'Greška pri ažuriranju'];
            }

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    // Obriši korisnika
    public function deleteUser($userId) {
        try {
            // Prvo obriši sve povezane podatke (solves, achievements, itd.)
            // Ovdje dodaj dodatne DELETE upite po potrebi
            
            $query = "DELETE FROM " . $this->userTable . " WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $userId);

            if ($stmt->execute()) {
                return ['success' => true, 'message' => 'Korisnik obrisan'];
            } else {
                return ['success' => false, 'message' => 'Greška pri brisanju'];
            }

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Handle GET request - dobavi sve korisnike
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $adminUsers = new AdminUsers();
    $result = $adminUsers->getAllUsers();
    echo json_encode($result);
}

// Handle POST request - akcije na korisnicima
else if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $userId = $input['user_id'] ?? '';

    $adminUsers = new AdminUsers();

    switch ($action) {
        case 'toggle_admin':
            $adminStatus = $input['admin_status'] ?? false;
            $result = $adminUsers->toggleAdmin($userId, $adminStatus);
            break;
        
        case 'delete_user':
            $result = $adminUsers->deleteUser($userId);
            break;
        
        default:
            $result = ['success' => false, 'message' => 'Nepoznata akcija'];
            break;
    }

    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>