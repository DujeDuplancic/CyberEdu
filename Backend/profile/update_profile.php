<?php
// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Ako zahtjev dolazi s localhosta ili s Vercela, odobri BAŠ TU domenu koja pita
if ($origin === "http://localhost:5173" || $origin === "https://cyber-edu-p46j.vercel.app") {
    header("Access-Control-Allow-Origin: " . $origin);
}
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

/**
 * Endpoint za parcijalno ažuriranje profila.
 * Frontend može poslati BILO KOJU kombinaciju polja:
 *   - username           -> mijenja korisničko ime
 *   - email              -> mijenja email
 *   - new_password       -> mijenja lozinku (zahtijeva current_password)
 *   - avatar (file)      -> postavlja novu profilnu sliku
 *   - remove_avatar = 1  -> briše postojeću profilnu sliku
 *
 * Polja koja nisu poslana ostaju netaknuta. UPDATE upit se gradi dinamički
 * pa nepotrebne kolone nikad ne dotaknemo.
 */
class UpdateProfile {
    private $db;
    private $userTable = 'users';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function updateProfile($userId, $data, $avatarFile = null) {
        try {
            // Provjera da korisnik postoji
            $checkQuery = "SELECT id, username, email, password_hash, avatar_url FROM " . $this->userTable . " WHERE id = :id";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->bindParam(':id', $userId);
            $checkStmt->execute();

            if ($checkStmt->rowCount() == 0) {
                return ['success' => false, 'message' => 'User not found'];
            }

            $user = $checkStmt->fetch(PDO::FETCH_ASSOC);

            // Dinamička lista SET izraza i parametara za UPDATE upit
            $sets   = [];
            $params = [':id' => $userId];

            // ---------------------------------------------------------
            // 1) USERNAME - mijenjamo samo ako je poslan i različit
            // ---------------------------------------------------------
            if (isset($data['username']) && $data['username'] !== '' && $data['username'] !== $user['username']) {
                $newUsername = trim($data['username']);

                if (strlen($newUsername) < 3 || strlen($newUsername) > 50) {
                    return ['success' => false, 'message' => 'Username must be between 3 and 50 characters'];
                }

                // Provjera zauzetosti username-a
                $u = $this->db->prepare("SELECT id FROM " . $this->userTable . " WHERE username = :username AND id != :id");
                $u->bindValue(':username', $newUsername);
                $u->bindValue(':id', $userId);
                $u->execute();
                if ($u->rowCount() > 0) {
                    return ['success' => false, 'message' => 'Username is already taken'];
                }

                $sets[] = "username = :username";
                $params[':username'] = $newUsername;
            }

            // ---------------------------------------------------------
            // 2) EMAIL - mijenjamo samo ako je poslan i različit
            // ---------------------------------------------------------
            if (isset($data['email']) && $data['email'] !== '' && $data['email'] !== $user['email']) {
                $newEmail = trim($data['email']);

                if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
                    return ['success' => false, 'message' => 'Please enter a valid email address'];
                }

                // Provjera zauzetosti email-a
                $e = $this->db->prepare("SELECT id FROM " . $this->userTable . " WHERE email = :email AND id != :id");
                $e->bindValue(':email', $newEmail);
                $e->bindValue(':id', $userId);
                $e->execute();
                if ($e->rowCount() > 0) {
                    return ['success' => false, 'message' => 'Email address is already in use'];
                }

                $sets[] = "email = :email";
                $params[':email'] = $newEmail;
            }

            // ---------------------------------------------------------
            // 3) LOZINKA - mijenja se samo ako je poslana nova
            //     Uvjet: korisnik mora unijeti i ispravnu trenutnu lozinku
            // ---------------------------------------------------------
            if (!empty($data['new_password'])) {
                if (empty($data['current_password'])) {
                    return ['success' => false, 'message' => 'Please enter your current password to change it'];
                }
                if (!password_verify($data['current_password'], $user['password_hash'])) {
                    return ['success' => false, 'message' => 'Current password is incorrect'];
                }
                if (strlen($data['new_password']) < 6) {
                    return ['success' => false, 'message' => 'New password must be at least 6 characters long'];
                }

                $sets[] = "password_hash = :password_hash";
                $params[':password_hash'] = password_hash($data['new_password'], PASSWORD_DEFAULT);
            }

            // ---------------------------------------------------------
            // 4) AVATAR - upload nove ili brisanje postojeće
            // ---------------------------------------------------------
            $finalAvatarUrl = $user['avatar_url']; // default ostaje stari

            if ($avatarFile && $avatarFile['error'] === UPLOAD_ERR_OK) {
                // Upload nove profilne slike
                $uploadDir = '../uploads/avatars/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($avatarFile['type'], $allowedTypes)) {
                    return ['success' => false, 'message' => 'Unsupported image format (use JPEG, PNG, GIF or WEBP)'];
                }

                $ext      = pathinfo($avatarFile['name'], PATHINFO_EXTENSION);
                $fileName = uniqid() . '_' . time() . '.' . $ext;
                $target   = $uploadDir . $fileName;

                if (!move_uploaded_file($avatarFile['tmp_name'], $target)) {
                    return ['success' => false, 'message' => 'Failed to save uploaded image'];
                }

                // Brišemo prethodnu sliku ako je postojala (samo lokalni upload, ne vanjske URL-ove)
                if (!empty($user['avatar_url']) && file_exists('../' . $user['avatar_url'])) {
                    @unlink('../' . $user['avatar_url']);
                }

                $finalAvatarUrl = 'uploads/avatars/' . $fileName;
                $sets[] = "avatar_url = :avatar_url";
                $params[':avatar_url'] = $finalAvatarUrl;

            } elseif (!empty($data['remove_avatar'])) {
                // Korisnik je eksplicitno tražio uklanjanje postojeće slike
                if (!empty($user['avatar_url']) && file_exists('../' . $user['avatar_url'])) {
                    @unlink('../' . $user['avatar_url']);
                }
                $finalAvatarUrl = null;
                $sets[] = "avatar_url = :avatar_url";
                $params[':avatar_url'] = null;
            }

            // ---------------------------------------------------------
            // Ako nije poslana ni jedna izmjena, vrati informativnu poruku
            // ---------------------------------------------------------
            if (empty($sets)) {
                return ['success' => false, 'message' => 'No changes provided'];
            }

            // ---------------------------------------------------------
            // Izvršavanje UPDATE upita
            // ---------------------------------------------------------
            $sql  = "UPDATE " . $this->userTable . " SET " . implode(', ', $sets) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $val) {
                $stmt->bindValue($key, $val);
            }

            if (!$stmt->execute()) {
                return ['success' => false, 'message' => 'Failed to update profile'];
            }

            // Dohvat aktualnih podataka za vraćanje frontendu
            $fresh = $this->db->prepare("SELECT id, username, email, avatar_url, points, rank, is_admin FROM " . $this->userTable . " WHERE id = :id");
            $fresh->bindValue(':id', $userId);
            $fresh->execute();
            $updatedUser = $fresh->fetch(PDO::FETCH_ASSOC);

            return [
                'success'    => true,
                'message'    => 'Profile updated successfully',
                'avatar_url' => $finalAvatarUrl,
                'user'       => $updatedUser
            ];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }
}

// =====================================================================
// Glavna obrada zahtjeva
// =====================================================================
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $userId = $_POST['user_id'] ?? '';

    if (empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        exit();
    }

    // Sve preostalo polje je opcionalno - šaljemo samo ono što korisnik mijenja
    $data = [
        'username'         => $_POST['username']         ?? null,
        'email'            => $_POST['email']            ?? null,
        'current_password' => $_POST['current_password'] ?? null,
        'new_password'     => $_POST['new_password']     ?? null,
        'remove_avatar'    => $_POST['remove_avatar']    ?? null
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
