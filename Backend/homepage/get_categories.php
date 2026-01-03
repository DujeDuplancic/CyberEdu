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
    
    // Get categories with challenge counts
    $query = "
        SELECT 
            c.id,
            c.name,
            c.description,
            COUNT(ch.id) as challenge_count
        FROM categories c
        LEFT JOIN challenges ch ON c.id = ch.category_id AND ch.is_active = 1
        GROUP BY c.id
        ORDER BY challenge_count DESC
        LIMIT 5
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map icon names to categories
    $categoryIcons = [
        'Reverse Engineering' => 'Code',
        'Binary Exploitation' => 'Lock',
        'Cryptography' => 'Key',
        'Steganography' => 'ImageIcon',
        'Web Security' => 'Globe',
        'Forensics' => 'Search',
        'Network Security' => 'Globe',
        'Mobile Security' => 'Smartphone'
    ];
    
    // Add icon to each category
    foreach ($categories as &$category) {
        $category['icon'] = $categoryIcons[$category['name']] ?? 'Code';
        $category['color'] = 'text-chart-' . (array_search($category['name'], array_column($categories, 'name')) + 1);
    }
    
    echo json_encode([
        'success' => true,
        'categories' => $categories
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch categories: ' . $e->getMessage(),
        'categories' => [
            [
                'name' => 'Reverse Engineering',
                'description' => 'Disassemble and analyze binary code',
                'challenge_count' => 24,
                'icon' => 'Code',
                'color' => 'text-chart-1'
            ],
            [
                'name' => 'Binary Exploitation',
                'description' => 'Master buffer overflows and memory corruption',
                'challenge_count' => 18,
                'icon' => 'Lock',
                'color' => 'text-chart-2'
            ],
            [
                'name' => 'Cryptography',
                'description' => 'Break encryption schemes and protocols',
                'challenge_count' => 32,
                'icon' => 'Key',
                'color' => 'text-chart-3'
            ]
        ]
    ]);
}
?>