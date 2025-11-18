<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers - MORA BITI NA SAMOM VRHU!
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only now include other files
require_once '../config/database.php';
require_once '../utils/functions.php';

// Log the request
error_log("Register API called - Method: " . $_SERVER['REQUEST_METHOD']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get JSON data from request body
        $json = file_get_contents('php://input');
        error_log("Raw input: " . $json);
        
        $data = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON: " . json_last_error_msg());
        }
        
        if (!$data) {
            throw new Exception("No data received");
        }
        
        $username = sanitizeInput($data['username'] ?? '');
        $email = sanitizeInput($data['email'] ?? '');
        $password = $data['password'] ?? '';
        
        // Validation
        if (empty($username) || empty($email) || empty($password)) {
            throw new Exception("All fields are required");
        }
        
        if (strlen($username) < 3) {
            throw new Exception("Username must be at least 3 characters");
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format");
        }
        
        if (strlen($password) < 6) {
            throw new Exception("Password must be at least 6 characters");
        }
        
        // Database operations
        $database = new Database();
        $db = $database->getConnection();
        
        if (!$db) {
            throw new Exception("Database connection failed");
        }
        
        // Check existing user
        $checkQuery = "SELECT id FROM users WHERE username = :username OR email = :email";
        $stmt = $db->prepare($checkQuery);
        $stmt->bindParam(":username", $username);
        $stmt->bindParam(":email", $email);
        
        if (!$stmt->execute()) {
            throw new Exception("Database query failed");
        }
        
        if ($stmt->rowCount() > 0) {
            throw new Exception("Username or email already exists");
        }
        
        // Create user
        $query = "INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :password_hash)";
        $stmt = $db->prepare($query);
        
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt->bindParam(":username", $username);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":password_hash", $password_hash);
        
        if ($stmt->execute()) {
            $response = [
                'success' => true,
                'message' => 'Registration successful!',
                'data' => [
                    'id' => $db->lastInsertId(),
                    'username' => $username,
                    'email' => $email
                ]
            ];
            error_log("Registration success: " . json_encode($response));
            echo json_encode($response);
        } else {
            throw new Exception("Database insert failed");
        }
        
    } catch (Exception $e) {
        $errorResponse = [
            'success' => false,
            'message' => $e->getMessage(),
            'data' => null
        ];
        error_log("Registration error: " . $e->getMessage());
        echo json_encode($errorResponse);
    }
} else {
    $errorResponse = [
        'success' => false,
        'message' => 'Only POST method allowed. Received: ' . $_SERVER['REQUEST_METHOD'],
        'data' => null
    ];
    error_log("Wrong method: " . $_SERVER['REQUEST_METHOD']);
    echo json_encode($errorResponse);
}
?>