<?php
// CORS headers - identičan pattern kao i ostali endpoint-i
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Ako zahtjev dolazi s localhosta ili s Vercela, odobri BAŠ TU domenu koja pita
if ($origin === "http://localhost:5173" || $origin === "https://cyber-edu-p46j.vercel.app") {
    header("Access-Control-Allow-Origin: " . $origin);
}
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
 * Endpoint koji vraća sve poruke razgovora između dva korisnika.
 * Pri svakom dohvatu automatski označava primljene poruke kao pročitane.
 *
 * Očekivani parametri: ?user_id=trenutni&with=ID_sugovornika
 */
try {
    $currentUserId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    $otherUserId   = isset($_GET['with'])    ? (int)$_GET['with']    : 0;

    if ($currentUserId <= 0 || $otherUserId <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Both user_id and with parameters are required'
        ]);
        exit();
    }

    $database = new Database();
    $conn = $database->getConnection();

    if (!$conn) {
        throw new Exception("Database connection failed");
    }

    // Dohvat svih poruka razmijenjenih između para korisnika (kronološki)
    $query = "
        SELECT
            id,
            sender_id,
            recipient_id,
            content,
            attachment_url,
            attachment_name,
            attachment_type,
            is_read,
            created_at
        FROM chat_messages
        WHERE (sender_id = :me AND recipient_id = :other)
           OR (sender_id = :other2 AND recipient_id = :me2)
        ORDER BY created_at ASC, id ASC
    ";

    $stmt = $conn->prepare($query);
    $stmt->bindValue(':me',     $currentUserId, PDO::PARAM_INT);
    $stmt->bindValue(':me2',    $currentUserId, PDO::PARAM_INT);
    $stmt->bindValue(':other',  $otherUserId,   PDO::PARAM_INT);
    $stmt->bindValue(':other2', $otherUserId,   PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Pretvaranje u oblik koji frontend očekuje
    $messages = array_map(function ($r) use ($currentUserId) {
        return [
            'id'              => (int)$r['id'],
            'sender_id'       => (int)$r['sender_id'],
            'recipient_id'    => (int)$r['recipient_id'],
            'type'            => ((int)$r['sender_id'] === $currentUserId) ? 'sent' : 'received',
            'content'         => $r['content'],
            'attachment_url'  => $r['attachment_url'],
            'attachment_name' => $r['attachment_name'],
            'attachment_type' => $r['attachment_type'],
            'is_read'         => (bool)$r['is_read'],
            'created_at'      => $r['created_at']
        ];
    }, $rows);

    // Automatski markiramo nepročitane poruke od sugovornika kao pročitane
    $markRead = $conn->prepare("
        UPDATE chat_messages
        SET is_read = 1
        WHERE sender_id = :other
          AND recipient_id = :me
          AND is_read = 0
    ");
    $markRead->bindValue(':other', $otherUserId,   PDO::PARAM_INT);
    $markRead->bindValue(':me',    $currentUserId, PDO::PARAM_INT);
    $markRead->execute();

    echo json_encode([
        'success'  => true,
        'messages' => $messages
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch messages: ' . $e->getMessage()
    ]);
}
?>
