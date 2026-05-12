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
 * Endpoint koji vraća sve poruke razgovora između dva korisnika.
 * Pri svakom dohvatu automatski označava primljene poruke kao pročitane
 * kako bi se unread_count u sidebaru ispravno resetirao.
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

    // =====================================================================
    // Dohvat svih poruka razmijenjenih između para korisnika.
    // Poruke vraćamo kronološki (najstarije prve) kako bi frontend
    // mogao samo iterirati i prikazati ih odozgo prema dolje.
    // =====================================================================
    $query = "
        SELECT
            id,
            sender_id,
            recipient_id,
            content,
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

    // =====================================================================
    // Pretvaranje rezultata u oblik koji frontend očekuje.
    // 'type' = "sent" ako je poslana s naše strane, inače "received".
    // =====================================================================
    $messages = array_map(function ($r) use ($currentUserId) {
        return [
            'id'           => (int)$r['id'],
            'sender_id'    => (int)$r['sender_id'],
            'recipient_id' => (int)$r['recipient_id'],
            'type'         => ((int)$r['sender_id'] === $currentUserId) ? 'sent' : 'received',
            'content'      => $r['content'],
            'is_read'      => (bool)$r['is_read'],
            'created_at'   => $r['created_at']
        ];
    }, $rows);

    // =====================================================================
    // Automatski označavamo sve nepročitane poruke koje je sugovornik
    // poslao nama - korisnik ih je sada vidio jer je otvorio razgovor.
    // =====================================================================
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
