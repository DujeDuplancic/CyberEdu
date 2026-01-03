<?php
// OBAVEZNO na samom vrhu prije bilo kakvog outputa!
error_reporting(0); // Isključi error reporting za produkciju
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log the request for debugging
error_log("=== ACHIEVEMENT CREATE REQUEST ===");
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("Content-Type: " . $_SERVER['CONTENT_TYPE'] ?? 'not set');

$rawInput = file_get_contents('php://input');
error_log("Raw input: " . $rawInput);

require_once '../config/database.php';

$input = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("JSON decode error: " . json_last_error_msg());
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit();
}

// Log received data
error_log("Decoded input: " . print_r($input, true));

// Validate required fields
$required = ['name', 'description', 'points_reward', 'criteria_type', 'criteria_value'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        error_log("Missing field: " . $field);
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit();
    }
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        error_log("Database connection failed");
        throw new Exception("Database connection failed");
    }
    
    $query = "INSERT INTO achievements (name, description, icon_url, points_reward, criteria_type, criteria_value, category_id, is_hidden) 
              VALUES (:name, :description, :icon_url, :points_reward, :criteria_type, :criteria_value, :category_id, :is_hidden)";
    
    $stmt = $db->prepare($query);
    
    // Bind parameters
    $stmt->bindParam(':name', $input['name']);
    $stmt->bindParam(':description', $input['description']);
    $icon_url = $input['icon_url'] ?? '';
    $stmt->bindParam(':icon_url', $icon_url);
    $stmt->bindParam(':points_reward', $input['points_reward'], PDO::PARAM_INT);
    $stmt->bindParam(':criteria_type', $input['criteria_type']);
    $stmt->bindParam(':criteria_value', $input['criteria_value'], PDO::PARAM_INT);
    
    // Handle optional category_id
    $category_id = !empty($input['category_id']) ? $input['category_id'] : null;
    if ($category_id) {
        $stmt->bindParam(':category_id', $category_id, PDO::PARAM_INT);
    } else {
        $stmt->bindValue(':category_id', null, PDO::PARAM_NULL);
    }
    
    $is_hidden = $input['is_hidden'] ?? false;
    $stmt->bindParam(':is_hidden', $is_hidden, PDO::PARAM_BOOL);
    
    error_log("Executing query: " . $query);
    error_log("Parameters: " . print_r([
        'name' => $input['name'],
        'description' => $input['description'],
        'icon_url' => $icon_url,
        'points_reward' => $input['points_reward'],
        'criteria_type' => $input['criteria_type'],
        'criteria_value' => $input['criteria_value'],
        'category_id' => $category_id,
        'is_hidden' => $is_hidden
    ], true));
    
    if ($stmt->execute()) {
        $achievementId = $db->lastInsertId();
        error_log("Achievement created with ID: " . $achievementId);
        echo json_encode([
            'success' => true, 
            'message' => 'Achievement created successfully',
            'id' => $achievementId
        ]);
    } else {
        $errorInfo = $stmt->errorInfo();
        error_log("SQL execution failed: " . print_r($errorInfo, true));
        echo json_encode(['success' => false, 'message' => 'Failed to create achievement: ' . $errorInfo[2]]);
    }
    
} catch (Exception $e) {
    error_log("Exception: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>