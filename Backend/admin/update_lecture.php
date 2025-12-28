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

// Pročitaj ID iz GET parametra
$lectureId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($lectureId === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Lecture ID is required']);
    exit();
}

// Pročitaj JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit();
}

// Provjeri user_id iz requesta
$userId = 0;
if (isset($data['user_id'])) {
    $userId = intval($data['user_id']);
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
    
    // Pripremi SET dio SQL upita
    $updates = [];
    $params = [];
    
    $allowedFields = ['title', 'description', 'category_id', 'instructor', 
                     'duration_minutes', 'level', 'video_url', 'thumbnail_url', 'is_published'];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            if ($field === 'video_url' && !empty($data[$field])) {
                // Validacija YouTube URL-a
                if (!preg_match('/^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/', $data[$field])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid YouTube URL']);
                    exit();
                }
                
                // Ažuriraj i embed_url ako se mijenja video_url
                $updates[] = "video_url = ?";
                $params[] = htmlspecialchars(trim($data[$field]));
                
                // Konvertiraj u embed URL
                if (preg_match('/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/', $data[$field], $matches)) {
                    $embedUrl = "https://www.youtube.com/embed/{$matches[1]}?rel=0";
                    $updates[] = "embed_url = ?";
                    $params[] = $embedUrl;
                }
            } else {
                $updates[] = "$field = ?";
                $params[] = is_numeric($data[$field]) ? $data[$field] : htmlspecialchars(trim($data[$field]));
            }
        }
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit();
    }
    
    // Dodaj updated_at
    $updates[] = "updated_at = NOW()";
    
    $sql = "UPDATE lectures SET " . implode(', ', $updates) . " WHERE id = ?";
    $params[] = $lectureId;
    
    $stmt = $db->prepare($sql);
    
    if ($stmt->execute($params)) {
        echo json_encode([
            'success' => true, 
            'message' => 'Lecture updated successfully'
        ]);
    } else {
        throw new Exception('Failed to execute update');
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