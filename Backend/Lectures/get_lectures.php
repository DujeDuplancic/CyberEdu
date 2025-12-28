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

// Uključi database.php
require_once __DIR__ . '/../config/database.php';

try {
    // Kreiraj instancu baze i dohvati konekciju
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Database connection failed");
    }
    
    // Provjeri da li lectures tabela postoji
    $tableCheck = $db->query("SHOW TABLES LIKE 'lectures'");
    $tableExists = $tableCheck && $tableCheck->rowCount() > 0;
    
    if ($tableExists) {
        // Prvo pokušaj da dohvatiš sa JOIN
        $sql = "SELECT 
                    l.*, 
                    c.name as category_name
                FROM lectures l
                LEFT JOIN categories c ON l.category_id = c.id
                WHERE l.is_published = 1
                ORDER BY l.created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $lectures = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ako ima greške sa JOIN, pokušaj bez JOIN
        if ($lectures === false) {
            $simpleSql = "SELECT * FROM lectures WHERE is_published = 1 ORDER BY created_at DESC";
            $simpleStmt = $db->prepare($simpleSql);
            $simpleStmt->execute();
            $lectures = $simpleStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Dodaj category_name ako ga nema
            foreach ($lectures as &$lecture) {
                $lecture['category_name'] = 'General';
            }
        }
    } else {
        $lectures = [];
    }
    
    // Ako nema predavanja u bazi, vrati testna
    if (empty($lectures)) {
        $lectures = [
            [
                'id' => 1,
                'title' => 'Introduction to Cybersecurity',
                'description' => 'Learn the basics of cybersecurity',
                'category_name' => 'General',
                'instructor' => 'John Doe',
                'duration_minutes' => 45,
                'level' => 'Beginner',
                'video_url' => 'https://www.youtube.com/watch?v=sdpxddDzXfE',
                'embed_url' => 'https://www.youtube.com/embed/sdpxddDzXfE',
                'thumbnail_url' => 'https://img.youtube.com/vi/sdpxddDzXfE/hqdefault.jpg',
                'views' => 1234,
                'created_at' => '2024-01-15 10:00:00'
            ],
            [
                'id' => 2,
                'title' => 'Web Application Security',
                'description' => 'Understanding web app vulnerabilities',
                'category_name' => 'Web Security',
                'instructor' => 'Jane Smith',
                'duration_minutes' => 60,
                'level' => 'Intermediate',
                'video_url' => 'https://www.youtube.com/watch?v=EWSf6-MTuLk',
                'embed_url' => 'https://www.youtube.com/embed/EWSf6-MTuLk',
                'thumbnail_url' => 'https://img.youtube.com/vi/EWSf6-MTuLk/hqdefault.jpg',
                'views' => 876,
                'created_at' => '2024-01-20 14:30:00'
            ],
            [
                'id' => 3,
                'title' => 'Network Security Fundamentals',
                'description' => 'Basic concepts of network security',
                'category_name' => 'Networking',
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
    }
    
    echo json_encode([
        'success' => true, 
        'lectures' => $lectures,
        'count' => count($lectures)
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