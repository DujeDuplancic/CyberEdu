<?php
// CORS headers - OBAVEZNO na samom vrhu!
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Provjeri ID parametar
if (!isset($_GET['id']) || empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Lecture ID is required']);
    exit();
}

$lectureId = intval($_GET['id']);

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Database connection failed");
    }
    
    // Prvo povećaj broj pregleda
    $updateSql = "UPDATE lectures SET views = COALESCE(views, 0) + 1 WHERE id = ?";
    $updateStmt = $db->prepare($updateSql);
    $updateStmt->execute([$lectureId]);
    
    // Dohvati detalje predavanja
    $sql = "SELECT 
                l.*, 
                c.name as category_name,
                c.id as category_id
            FROM lectures l
            LEFT JOIN categories c ON l.category_id = c.id
            WHERE l.id = ?";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$lectureId]);
    $lecture = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Ako nema predavanja u bazi, vrati testno predavanje
    if (!$lecture && $lectureId <= 3) {
        $testLectures = [
            1 => [
                'id' => 1,
                'title' => 'Introduction to Cybersecurity',
                'description' => 'Learn the basics of cybersecurity including common threats, security principles, and protection mechanisms.',
                'category_name' => 'General',
                'category_id' => 1,
                'instructor' => 'John Doe',
                'duration_minutes' => 45,
                'level' => 'Beginner',
                'video_url' => 'https://www.youtube.com/watch?v=sdpxddDzXfE',
                'embed_url' => 'https://www.youtube.com/embed/sdpxddDzXfE',
                'thumbnail_url' => 'https://img.youtube.com/vi/sdpxddDzXfE/hqdefault.jpg',
                'views' => 1234,
                'created_at' => '2024-01-15 10:00:00'
            ],
            2 => [
                'id' => 2,
                'title' => 'Web Application Security',
                'description' => 'Understanding common web application vulnerabilities like XSS, SQL Injection, and CSRF attacks.',
                'category_name' => 'Web Security',
                'category_id' => 2,
                'instructor' => 'Jane Smith',
                'duration_minutes' => 60,
                'level' => 'Intermediate',
                'video_url' => 'https://www.youtube.com/watch?v=EWSf6-MTuLk',
                'embed_url' => 'https://www.youtube.com/embed/EWSf6-MTuLk',
                'thumbnail_url' => 'https://img.youtube.com/vi/EWSf6-MTuLk/hqdefault.jpg',
                'views' => 876,
                'created_at' => '2024-01-20 14:30:00'
            ],
            3 => [
                'id' => 3,
                'title' => 'Network Security Fundamentals',
                'description' => 'Basic concepts of network security including firewalls, VPNs, and intrusion detection systems.',
                'category_name' => 'Networking',
                'category_id' => 3,
                'instructor' => 'Mike Johnson',
                'duration_minutes' => 55,
                'level' => 'Beginner',
                'video_url' => 'https://www.youtube.com/watch?v=o8NPllzFxkM',
                'embed_url' => 'https://www.youtube.com/embed/o8NPllzFxkM',
                'thumbnail_url' => 'https://img.youtube.com/vi/o8NPllzFxkM/hqdefault.jpg',
                'views' => 1456,
                'created_at' => '2024-01-25 09:15:00'
            ]
        ];
        
        $lecture = $testLectures[$lectureId] ?? null;
    }
    
    if (!$lecture) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Lecture not found']);
        exit();
    }
    
    // Dohvati preporučena predavanja
    $relatedSql = "SELECT id, title, thumbnail_url, duration_minutes, level 
                  FROM lectures 
                  WHERE category_id = ? AND id != ? AND is_published = 1
                  ORDER BY created_at DESC LIMIT 3";
    
    $relatedStmt = $db->prepare($relatedSql);
    $relatedStmt->execute([$lecture['category_id'] ?? 1, $lectureId]);
    $related = $relatedStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Ako nema related u bazi, vrati prazno
    if ($related === false) {
        $related = [];
    }
    
    echo json_encode([
        'success' => true, 
        'lecture' => $lecture,
        'related' => $related
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}
?>