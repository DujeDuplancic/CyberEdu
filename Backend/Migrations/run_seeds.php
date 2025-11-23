<?php
// CORS headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

// Uključi seed funkciju
require_once 'seeds/seed.php';

try {
    // Pokreni seed
    seed();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Database seeded successfully with categories, users, and challenges!'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'Seeding failed: ' . $e->getMessage()
    ]);
}
?>