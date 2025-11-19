<?php
// CORS headers - OBAVEZNO na samom vrhu prije bilo čega!
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class Auth {
    private $db;
    private $table = 'users';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function register($username, $email, $password) {
        try {
            // Provjeri da li korisnik već postoji
            $query = "SELECT id FROM " . $this->table . " WHERE username = :username OR email = :email";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return ['success' => false, 'message' => 'Korisnik već postoji'];
            }

            // Kreiraj novog korisnika
            $query = "INSERT INTO " . $this->table . " 
                     (username, email, password_hash, points, rank, is_admin) 
                     VALUES (:username, :email, :password, 0, 0, false)";
            
            $stmt = $this->db->prepare($query);
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':password', $password_hash);

            if ($stmt->execute()) {
                return ['success' => true, 'message' => 'Registracija uspješna'];
            } else {
                return ['success' => false, 'message' => 'Greška pri registraciji'];
            }

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $username = $input['username'] ?? '';
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    if (empty($username) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Sva polja su obavezna']);
        exit();
    }

    $auth = new Auth();
    $result = $auth->register($username, $email, $password);
    
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>