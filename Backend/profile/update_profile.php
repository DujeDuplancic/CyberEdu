<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Handle CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class UpdateProfile {
    private $db;
    private $userTable = 'users';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function updateProfile($userId, $data, $avatarFile = null) {
        try {
            // First, verify user exists
            $checkQuery = "SELECT id, username, email, password_hash, avatar_url, points, rank, is_admin 
                          FROM " . $this->userTable . " WHERE id = :id";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->bindParam(':id', $userId);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() == 0) {
                return ['success' => false, 'message' => 'Korisnik nije pronađen'];
            }
            
            $user = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            // Check if username is taken (if changed)
            if ($data['username'] !== $user['username']) {
                $checkUsernameQuery = "SELECT id FROM " . $this->userTable . " WHERE username = :username AND id != :id";
                $checkUsernameStmt = $this->db->prepare($checkUsernameQuery);
                $checkUsernameStmt->bindParam(':username', $data['username']);
                $checkUsernameStmt->bindParam(':id', $userId);
                $checkUsernameStmt->execute();
                
                if ($checkUsernameStmt->rowCount() > 0) {
                    return ['success' => false, 'message' => 'Korisničko ime je već zauzeto'];
                }
            }
            
            // Check if email is taken (if changed)
            if ($data['email'] !== $user['email']) {
                $checkEmailQuery = "SELECT id FROM " . $this->userTable . " WHERE email = :email AND id != :id";
                $checkEmailStmt = $this->db->prepare($checkEmailQuery);
                $checkEmailStmt->bindParam(':email', $data['email']);
                $checkEmailStmt->bindParam(':id', $userId);
                $checkEmailStmt->execute();
                
                if ($checkEmailStmt->rowCount() > 0) {
                    return ['success' => false, 'message' => 'Email adresa je već u upotrebi'];
                }
            }
            
            // Handle password change if requested
            $passwordUpdate = "";
            $params = [
                ':username' => $data['username'],
                ':email' => $data['email'],
                ':id' => $userId
            ];
            
            if (!empty($data['new_password'])) {
                // Verify current password
                if (empty($data['current_password'])) {
                    return ['success' => false, 'message' => 'Molimo unesite trenutnu lozinku'];
                }
                
                // Use password_hash column instead of password
                if (!password_verify($data['current_password'], $user['password_hash'])) {
                    return ['success' => false, 'message' => 'Trenutna lozinka nije ispravna'];
                }
                
                $hashedPassword = password_hash($data['new_password'], PASSWORD_DEFAULT);
                $passwordUpdate = ", password_hash = :password_hash";
                $params[':password_hash'] = $hashedPassword;
            }
            
            // Handle avatar upload
            $avatarUpdate = "";
            $avatarUrl = $user['avatar_url'];
            
            if ($avatarFile && $avatarFile['error'] === UPLOAD_ERR_OK) {
                $uploadDir = '../uploads/avatars/';
                
                // Create directory if it doesn't exist
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                // Generate unique filename
                $fileExtension = pathinfo($avatarFile['name'], PATHINFO_EXTENSION);
                $fileName = uniqid() . '_' . time() . '.' . $fileExtension;
                $targetPath = $uploadDir . $fileName;
                
                // Validate file type
                $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($avatarFile['type'], $allowedTypes)) {
                    return ['success' => false, 'message' => 'Nepodržani format slike. Koristite JPEG, PNG, GIF ili WEBP.'];
                }
                
                // Move uploaded file
                if (move_uploaded_file($avatarFile['tmp_name'], $targetPath)) {
                    // Delete old avatar if exists and is not default
                    if ($avatarUrl && file_exists('../' . $avatarUrl)) {
                        unlink('../' . $avatarUrl);
                    }
                    
                    $avatarUrl = 'uploads/avatars/' . $fileName;
                    $avatarUpdate = ", avatar_url = :avatar_url";
                    $params[':avatar_url'] = $avatarUrl;
                } else {
                    return ['success' => false, 'message' => 'Greška pri uploadu slike'];
                }
            }
            
            // Update user profile - using password_hash column
            $query = "UPDATE " . $this->userTable . " 
                     SET username = :username, email = :email" . $avatarUpdate . $passwordUpdate . " 
                     WHERE id = :id";
            
            $stmt = $this->db->prepare($query);
            
            foreach ($params as $key => &$val) {
                $stmt->bindParam($key, $val);
            }
            
            if ($stmt->execute()) {
                // Fetch updated user data
                $getUserQuery = "SELECT id, username, email, avatar_url, points, rank, is_admin 
                                FROM " . $this->userTable . " WHERE id = :id";
                $getUserStmt = $this->db->prepare($getUserQuery);
                $getUserStmt->bindParam(':id', $userId);
                $getUserStmt->execute();
                $updatedUser = $getUserStmt->fetch(PDO::FETCH_ASSOC);
                
                return [
                    'success' => true, 
                    'message' => 'Profil je uspješno ažuriran',
                    'avatar_url' => $avatarUrl,
                    'user' => $updatedUser
                ];
            } else {
                return ['success' => false, 'message' => 'Greška pri ažuriranju profila'];
            }
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Handle different request methods
$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    // Get POST data (works for both FormData and JSON)
    $userId = null;
    $username = null;
    $email = null;
    $currentPassword = null;
    $newPassword = null;
    
    // Check if it's FormData (file upload) or JSON
    if (isset($_POST['user_id'])) {
        // FormData submission
        $userId = $_POST['user_id'] ?? '';
        $username = $_POST['username'] ?? '';
        $email = $_POST['email'] ?? '';
        $currentPassword = $_POST['current_password'] ?? '';
        $newPassword = $_POST['new_password'] ?? '';
    } else {
        // JSON submission
        $input = json_decode(file_get_contents('php://input'), true);
        if ($input) {
            $userId = $input['user_id'] ?? '';
            $username = $input['username'] ?? '';
            $email = $input['email'] ?? '';
            $currentPassword = $input['current_password'] ?? '';
            $newPassword = $input['new_password'] ?? '';
        }
    }
    
    if (empty($userId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID je obavezan']);
        exit();
    }
    
    if (empty($username) || empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Korisničko ime i email su obavezni']);
        exit();
    }
    
    $data = [
        'username' => $username,
        'email' => $email,
        'current_password' => $currentPassword,
        'new_password' => $newPassword
    ];
    
    $avatarFile = isset($_FILES['avatar']) && $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE ? $_FILES['avatar'] : null;
    
    $updateProfile = new UpdateProfile();
    $result = $updateProfile->updateProfile($userId, $data, $avatarFile);
    
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Please use POST.']);
}
?>