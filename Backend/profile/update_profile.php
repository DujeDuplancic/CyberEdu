<?php
// CORS headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Handle preflight
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
            // Check if user exists
            $checkQuery = "SELECT id, username, email, password_hash, avatar_url FROM " . $this->userTable . " WHERE id = :id";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->bindParam(':id', $userId);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() == 0) {
                return ['success' => false, 'message' => 'Korisnik nije pronađen'];
            }
            
            $user = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            // Check if username is taken
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
            
            // Check if email is taken
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
            
            // Handle password change
            $passwordUpdate = "";
            $params = [
                ':username' => $data['username'],
                ':email' => $data['email'],
                ':id' => $userId
            ];
            
            if (!empty($data['new_password'])) {
                if (empty($data['current_password'])) {
                    return ['success' => false, 'message' => 'Molimo unesite trenutnu lozinku'];
                }
                
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
                
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $fileExtension = pathinfo($avatarFile['name'], PATHINFO_EXTENSION);
                $fileName = uniqid() . '_' . time() . '.' . $fileExtension;
                $targetPath = $uploadDir . $fileName;
                
                $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($avatarFile['type'], $allowedTypes)) {
                    return ['success' => false, 'message' => 'Nepodržani format slike'];
                }
                
                if (move_uploaded_file($avatarFile['tmp_name'], $targetPath)) {
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
            
            // Update query
            $query = "UPDATE " . $this->userTable . " 
                     SET username = :username, email = :email" . $avatarUpdate . $passwordUpdate . " 
                     WHERE id = :id";
            
            $stmt = $this->db->prepare($query);
            
            foreach ($params as $key => $val) {
                $stmt->bindValue($key, $val);
            }
            
            if ($stmt->execute()) {
                return [
                    'success' => true, 
                    'message' => 'Profil je uspješno ažuriran',
                    'avatar_url' => $avatarUrl
                ];
            } else {
                return ['success' => false, 'message' => 'Greška pri ažuriranju profila'];
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Greška: ' . $e->getMessage()];
        }
    }
}

// Handle request
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $userId = isset($_POST['user_id']) ? $_POST['user_id'] : '';
    $username = isset($_POST['username']) ? $_POST['username'] : '';
    $email = isset($_POST['email']) ? $_POST['email'] : '';
    $currentPassword = isset($_POST['current_password']) ? $_POST['current_password'] : '';
    $newPassword = isset($_POST['new_password']) ? $_POST['new_password'] : '';
    
    if (empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'User ID je obavezan']);
        exit();
    }
    
    if (empty($username) || empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Korisničko ime i email su obavezni']);
        exit();
    }
    
    $data = [
        'username' => $username,
        'email' => $email,
        'current_password' => $currentPassword,
        'new_password' => $newPassword
    ];
    
    $avatarFile = null;
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
        $avatarFile = $_FILES['avatar'];
    }
    
    $updateProfile = new UpdateProfile();
    $result = $updateProfile->updateProfile($userId, $data, $avatarFile);
    
    echo json_encode($result);
} else {
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Please use POST.']);
}
?>