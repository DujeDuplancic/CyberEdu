<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$id = $_GET['id'] ?? 0;
if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Achievement ID required']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$isHidden = $input['is_hidden'] ?? false;

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "UPDATE achievements SET is_hidden = :is_hidden WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':is_hidden', $isHidden, PDO::PARAM_BOOL);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Achievement visibility updated']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update visibility']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>