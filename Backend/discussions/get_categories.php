<?php
require_once '../config/database.php';

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    // Get distinct categories from discussions
    $query = "SELECT DISTINCT category FROM discussions ORDER BY category";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Add "All" as first option
    array_unshift($categories, "All");
    
    echo json_encode([
        'success' => true,
        'categories' => $categories
    ]);
    
} catch (Exception $e) {
    error_log("Error getting categories: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'categories' => ['All', 'General', 'Questions', 'Writeups']
    ]);
}
?>