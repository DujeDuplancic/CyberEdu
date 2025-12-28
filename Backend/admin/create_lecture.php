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

// Pročitaj JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit();
}

// Validacija obaveznih polja
$requiredFields = ['title', 'video_url', 'user_id'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Field '$field' is required"]);
        exit();
    }
}

$userId = intval($data['user_id']);

// Dohvati konekciju za bazu
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

// Provjeri da li je korisnik admin
$adminCheck = $db->prepare("SELECT is_admin FROM users WHERE id = ?");
$adminCheck->execute([$userId]);
$user = $adminCheck->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['is_admin'] != 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit();
}

// Validacija YouTube URL-a
$videoUrl = trim($data['video_url']);
if (!preg_match('/^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/', $videoUrl)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid YouTube URL']);
    exit();
}

// Konvertiraj u embed URL
function convertToEmbedUrl($url) {
    if (strpos($url, 'youtube.com/embed/') !== false) {
        return $url;
    }
    
    $videoId = '';
    
    if (preg_match('/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/', $url, $matches)) {
        $videoId = $matches[1];
    } elseif (preg_match('/youtu\.be\/([a-zA-Z0-9_-]+)/', $url, $matches)) {
        $videoId = $matches[1];
    } elseif (preg_match('/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/', $url, $matches)) {
        $videoId = $matches[1];
    }
    
    if (!$videoId) {
        return $url;
    }
    
    return "https://www.youtube.com/embed/{$videoId}?rel=0";
}

// Generiši thumbnail URL
function getYouTubeThumbnail($url) {
    $videoId = '';
    
    if (preg_match('/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/', $url, $matches)) {
        $videoId = $matches[1];
    } elseif (preg_match('/youtu\.be\/([a-zA-Z0-9_-]+)/', $url, $matches)) {
        $videoId = $matches[1];
    } elseif (preg_match('/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/', $url, $matches)) {
        $videoId = $matches[1];
    }
    
    if ($videoId) {
        return "https://img.youtube.com/vi/{$videoId}/hqdefault.jpg";
    }
    
    return null;
}

$embedUrl = convertToEmbedUrl($videoUrl);
$thumbnailUrl = getYouTubeThumbnail($videoUrl);

// Ako je poslan custom thumbnail, koristi njega
if (isset($data['thumbnail_url']) && !empty(trim($data['thumbnail_url']))) {
    $thumbnailUrl = trim($data['thumbnail_url']);
}

try {
    // Validacija kategorije (ako je poslana)
    $categoryId = null;
    if (isset($data['category_id']) && !empty($data['category_id'])) {
        $categoryId = intval($data['category_id']);
        
        $categoryCheck = $db->prepare("SELECT id FROM categories WHERE id = ?");
        $categoryCheck->execute([$categoryId]);
        if (!$categoryCheck->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid category']);
            exit();
        }
    }
    
    // Validacija nivoa
    $level = 'Beginner';
    if (isset($data['level']) && in_array($data['level'], ['Beginner', 'Intermediate', 'Advanced'])) {
        $level = $data['level'];
    }
    
    // SQL za unos
    $sql = "INSERT INTO lectures 
            (title, description, category_id, instructor, duration_minutes, 
             level, video_url, embed_url, thumbnail_url, author_id, is_published, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())";
    
    $stmt = $db->prepare($sql);
    
    $params = [
        htmlspecialchars(trim($data['title'])),
        isset($data['description']) ? htmlspecialchars(trim($data['description'])) : null,
        $categoryId,
        isset($data['instructor']) ? htmlspecialchars(trim($data['instructor'])) : null,
        isset($data['duration_minutes']) ? intval($data['duration_minutes']) : 0,
        $level,
        htmlspecialchars($videoUrl),
        $embedUrl,
        $thumbnailUrl,
        $userId
    ];
    
    if ($stmt->execute($params)) {
        $lectureId = $db->lastInsertId();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Lecture created successfully',
            'lecture_id' => $lectureId
        ]);
    } else {
        throw new Exception('Failed to execute query');
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