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
 * Endpoint koji sprema novu chat poruku u bazu.
 * Očekuje JSON tijelo:
 *   { sender_id, recipient_id, content, attachment_url?, attachment_name?, attachment_type? }
 *
 * Sadržaj poruke (content) može biti prazan AKO postoji privitak.
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

    // Privitak (opcionalan) - tri usklađena polja koja stižu s upload endpointa
    $attachmentUrl  = isset($input['attachment_url'])  ? trim((string)$input['attachment_url'])  : null;
    $attachmentName = isset($input['attachment_name']) ? trim((string)$input['attachment_name']) : null;
    $attachmentType = isset($input['attachment_type']) ? trim((string)$input['attachment_type']) : null;
    // Prazne stringove tretiramo kao odsutne
    if ($attachmentUrl  === '') $attachmentUrl  = null;
    if ($attachmentName === '') $attachmentName = null;
    if ($attachmentType === '') $attachmentType = null;

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

    // Poruka mora imati ili tekst ili privitak (ili oboje)
    if ($content === '' && $attachmentUrl === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Message must contain text or an attachment']);
        exit();
    }

    if (mb_strlen($content) > 5000) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Message is too long (max 5000 characters)']);
        exit();
    }

    // Whitelist tipova privitka da se ne ubacuje proizvoljna vrijednost
    if ($attachmentType !== null && !in_array($attachmentType, ['image', 'file'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid attachment_type']);
        exit();
    }

    $database = new Database();
    $conn = $database->getConnection();

    if (!$conn) {
        throw new Exception("Database connection failed");
    }

    // Provjera da oba korisnika postoje radi FK constraint-a
    $check = $conn->prepare("SELECT COUNT(*) FROM users WHERE id IN (?, ?)");
    $check->execute([$senderId, $recipientId]);
    if ((int)$check->fetchColumn() !== 2) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Sender or recipient not found']);
        exit();
    }

    // Insert poruke sa svim poljima (privitak može biti NULL)
    $insert = $conn->prepare("
        INSERT INTO chat_messages
            (sender_id, recipient_id, content, attachment_url, attachment_name, attachment_type, is_read)
        VALUES
            (?, ?, ?, ?, ?, ?, 0)
    ");
    $insert->execute([
        $senderId,
        $recipientId,
        $content,
        $attachmentUrl,
        $attachmentName,
        $attachmentType
    ]);

    $messageId = (int)$conn->lastInsertId();

    // Dohvat upravo spremljene poruke radi vraćanja konzistentnog payload-a
    $fetch = $conn->prepare("
        SELECT id, sender_id, recipient_id, content,
               attachment_url, attachment_name, attachment_type,
               is_read, created_at
        FROM chat_messages
        WHERE id = ?
    ");
    $fetch->execute([$messageId]);
    $row = $fetch->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => [
            'id'              => (int)$row['id'],
            'sender_id'       => (int)$row['sender_id'],
            'recipient_id'    => (int)$row['recipient_id'],
            'type'            => 'sent',
            'content'         => $row['content'],
            'attachment_url'  => $row['attachment_url'],
            'attachment_name' => $row['attachment_name'],
            'attachment_type' => $row['attachment_type'],
            'is_read'         => (bool)$row['is_read'],
            'created_at'      => $row['created_at']
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
