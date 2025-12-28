<?php
// CORS headers
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

// Pročitaj podatke iz GET parametra ili JSON body
$lectureId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($lectureId === 0) {
    // Pokušaj iz JSON body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (isset($data['id'])) {
        $lectureId = intval($data['id']);
    }
}

if ($lectureId === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Lecture ID is required']);
    exit();
}

// Pročitaj user_id iz requesta (može biti u GET, POST ili JSON)
$userId = 0;

// Provjeri različite načine slanja user_id
if (isset($_GET['user_id'])) {
    $userId = intval($_GET['user_id']);
} elseif (isset($_POST['user_id'])) {
    $userId = intval($_POST['user_id']);
} else {
    // Pokušaj iz JSON body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (isset($data['user_id'])) {
        $userId = intval($data['user_id']);
    }
}

// Ako nema user_id, probaj sa default admin ID 1
if ($userId === 0) {
    $userId = 1; // Default admin ID
}

// Dohvati konekciju za bazu
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    // Provjeri da li je korisnik admin
    $adminCheck = $db->prepare("SELECT is_admin FROM users WHERE id = ?");
    $adminCheck->execute([$userId]);
    $user = $adminCheck->fetch(PDO::FETCH_ASSOC);

    if (!$user || $user['is_admin'] != 1) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }

    // Provjeri da li predavanje postoji
    $checkSql = "SELECT id FROM lectures WHERE id = ?";
    $checkStmt = $db->prepare($checkSql);
    $checkStmt->execute([$lectureId]);
    
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Lecture not found']);
        exit();
    }
    
    // Obriši predavanje
    $deleteSql = "DELETE FROM lectures WHERE id = ?";
    $deleteStmt = $db->prepare($deleteSql);
    
    if ($deleteStmt->execute([$lectureId])) {
        echo json_encode([
            'success' => true, 
            'message' => 'Lecture deleted successfully'
        ]);
    } else {
        throw new Exception('Failed to delete lecture');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}
?>