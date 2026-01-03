<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    // Get total active challenges
    $query = "SELECT COUNT(*) as total FROM challenges WHERE is_active = 1";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $activeChallenges = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get total users
    $query = "SELECT COUNT(*) as total FROM users";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $activeUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get total lectures
    $query = "SELECT COUNT(*) as total FROM lectures WHERE is_published = 1";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $videoLectures = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get total flags captured (solves)
    $query = "SELECT COUNT(*) as total FROM solves";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $flagsCaptured = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'activeChallenges' => (int)$activeChallenges,
            'activeUsers' => (int)$activeUsers,
            'videoLectures' => (int)$videoLectures,
            'flagsCaptured' => (int)$flagsCaptured
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch stats: ' . $e->getMessage(),
        'stats' => [
            'activeChallenges' => 117,
            'activeUsers' => 2500,
            'videoLectures' => 45,
            'flagsCaptured' => 8200
        ]
    ]);
}
?>