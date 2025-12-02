<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
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

class Categories {
    private $db;
    private $table = 'categories';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getAllCategories() {
        try {
            $query = "SELECT id, name, description, icon_name FROM " . $this->table . " ORDER BY name";
            $stmt = $this->db->prepare($query);
            $stmt->execute();

            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ['success' => true, 'categories' => $categories];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $categories = new Categories();
    $result = $categories->getAllCategories();
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>