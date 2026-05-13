<?php
// CORS headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

/**
 * Vraća ukupan broj nepročitanih chat poruka za korisnika.
 * Koristi se iz Header komponente za prikaz plave točkice na Chat linku.
 *
 * Očekivani parametar: ?user_id=ID_trenutnog_korisnika
 */
try {
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing or invalid user_id']);
        exit();
    }

    $database = new Database();
    $conn = $database->getConnection();
    if (!$conn) {
        throw new Exception("Database connection failed");
    }

    $stmt = $conn->prepare("
        SELECT COUNT(*)
        FROM chat_messages
        WHERE recipient_id = :me
          AND is_read = 0
    ");
    $stmt->bindValue(':me', $userId, PDO::PARAM_INT);
    $stmt->execute();

    $count = (int)$stmt->fetchColumn();

    echo json_encode([
        'success'      => true,
        'unread_count' => $count
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch unread count: ' . $e->getMessage()
    ]);
}
?>
