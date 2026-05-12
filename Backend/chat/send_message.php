<?php
// CORS headers - identičan pattern kao i ostali endpoint-i
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

/**
 * Endpoint koji sprema novu chat poruku u bazu.
 * Očekuje JSON tijelo: { sender_id, recipient_id, content }
 */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Dohvat i validacija ulaznih podataka
    $input = json_decode(file_get_contents('php://input'), true);

    $senderId    = isset($input['sender_id'])    ? (int)$input['sender_id']    : 0;
    $recipientId = isset($input['recipient_id']) ? (int)$input['recipient_id'] : 0;
    $content     = isset($input['content'])      ? trim((string)$input['content']) : '';

    // Provjere ispravnosti unosa - svi parametri moraju biti popunjeni
    if ($senderId <= 0 || $recipientId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'sender_id and recipient_id are required']);
        exit();
    }

    if ($senderId === $recipientId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Cannot send a message to yourself']);
        exit();
    }

    if ($content === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Message content cannot be empty']);
        exit();
    }

    // Limit duljine poruke radi zaštite baze - 5000 znakova je sasvim dovoljno
    if (mb_strlen($content) > 5000) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Message is too long (max 5000 characters)']);
        exit();
    }

    $database = new Database();
    $conn = $database->getConnection();

    if (!$conn) {
        throw new Exception("Database connection failed");
    }

    // =====================================================================
    // Provjera da oba korisnika postoje u bazi prije inserta poruke.
    // Time se izbjegava narušavanje foreign key constraint-a.
    // =====================================================================
    $check = $conn->prepare("SELECT COUNT(*) FROM users WHERE id IN (?, ?)");
    $check->execute([$senderId, $recipientId]);
    if ((int)$check->fetchColumn() !== 2) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Sender or recipient not found']);
        exit();
    }

    // =====================================================================
    // Spremanje poruke u bazu
    // =====================================================================
    $insert = $conn->prepare("
        INSERT INTO chat_messages (sender_id, recipient_id, content, is_read)
        VALUES (?, ?, ?, 0)
    ");
    $insert->execute([$senderId, $recipientId, $content]);

    $messageId = (int)$conn->lastInsertId();

    // Dohvat upravo spremljene poruke radi vraćanja konzistentnog payload-a
    $fetch = $conn->prepare("
        SELECT id, sender_id, recipient_id, content, is_read, created_at
        FROM chat_messages
        WHERE id = ?
    ");
    $fetch->execute([$messageId]);
    $row = $fetch->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => [
            'id'           => (int)$row['id'],
            'sender_id'    => (int)$row['sender_id'],
            'recipient_id' => (int)$row['recipient_id'],
            'type'         => 'sent',
            'content'      => $row['content'],
            'is_read'      => (bool)$row['is_read'],
            'created_at'   => $row['created_at']
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to send message: ' . $e->getMessage()
    ]);
}
?>
