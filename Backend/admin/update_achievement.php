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

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Build update query dynamically
    $fields = [];
    $params = [':id' => $id];
    
    $allowedFields = ['name', 'description', 'icon_url', 'points_reward', 'criteria_type', 'criteria_value', 'category_id', 'is_hidden'];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $fields[] = "$field = :$field";
            $params[":$field"] = $input[$field];
        }
    }
    
    if (empty($fields)) {
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit();
    }
    
    $query = "UPDATE achievements SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    // Bind parameters
    foreach ($params as $key => &$value) {
        if ($key === ':category_id' && empty($value)) {
            $stmt->bindValue($key, null, PDO::PARAM_NULL);
        } else if ($key === ':is_hidden') {
            $stmt->bindValue($key, $value, PDO::PARAM_BOOL);
        } else {
            $stmt->bindParam($key, $value);
        }
    }
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Achievement updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update achievement']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>