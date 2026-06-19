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
 * Endpoint koji vraća listu svih korisnika osim trenutno prijavljenog.
 * Uz svakog korisnika dolazi i sažetak zadnje poruke razgovora, broj
 * nepročitanih poruka te indikator da li uopće postoji razgovor.
 *
 * Frontend onda sam odlučuje koga prikazati u sidebaru (samo postojeći
 * razgovori) i koga ponuditi kao rezultat pretrage.
 *
 * Očekivani query parametar: ?user_id=ID_trenutnog_korisnika
 */
try {
    $currentUserId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    if ($currentUserId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing or invalid user_id parameter']);
        exit();
    }

    $database = new Database();
    $conn = $database->getConnection();

    if (!$conn) {
        throw new Exception("Database connection failed");
    }

    // Glavni upit: za svakog korisnika (osim trenutnog) izvlačimo:
    //   - zadnju poruku razgovora (tekst ili oznaka privitka)
    //   - tip te zadnje poruke (sent/received) i privitak/tekst
    //   - timestamp zadnje poruke
    //   - broj nepročitanih poruka prema meni
    //
    // Koristimo korelirane subqueryje radi čitljivosti i kompatibilnosti
    // sa starijim MySQL verzijama na XAMPP-u (bez window funkcija).
    $query = "
        SELECT
            u.id,
            u.username,
            u.avatar_url,
            u.is_admin,
            u.points,
            (
                SELECT
                    CASE
                        WHEN cm.content IS NOT NULL AND cm.content <> '' THEN cm.content
                        WHEN cm.attachment_type = 'image' THEN '[Image]'
                        WHEN cm.attachment_url IS NOT NULL THEN CONCAT('[File] ', COALESCE(cm.attachment_name, 'attachment'))
                        ELSE ''
                    END
                FROM chat_messages cm
                WHERE (cm.sender_id = u.id AND cm.recipient_id = :me1)
                   OR (cm.sender_id = :me2 AND cm.recipient_id = u.id)
                ORDER BY cm.created_at DESC
                LIMIT 1
            ) AS last_message,
            (
                SELECT cm.created_at
                FROM chat_messages cm
                WHERE (cm.sender_id = u.id AND cm.recipient_id = :me3)
                   OR (cm.sender_id = :me4 AND cm.recipient_id = u.id)
                ORDER BY cm.created_at DESC
                LIMIT 1
            ) AS last_message_at,
            (
                SELECT COUNT(*)
                FROM chat_messages cm
                WHERE cm.sender_id = u.id
                  AND cm.recipient_id = :me5
                  AND cm.is_read = 0
            ) AS unread_count
        FROM users u
        WHERE u.id != :me6
        ORDER BY (last_message_at IS NULL), last_message_at DESC, u.username ASC
    ";

    $stmt = $conn->prepare($query);
    $stmt->bindValue(':me1', $currentUserId, PDO::PARAM_INT);
    $stmt->bindValue(':me2', $currentUserId, PDO::PARAM_INT);
    $stmt->bindValue(':me3', $currentUserId, PDO::PARAM_INT);
    $stmt->bindValue(':me4', $currentUserId, PDO::PARAM_INT);
    $stmt->bindValue(':me5', $currentUserId, PDO::PARAM_INT);
    $stmt->bindValue(':me6', $currentUserId, PDO::PARAM_INT);
    $stmt->execute();

    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $contacts = array_map(function ($c) {
        return [
            'id'              => (int)$c['id'],
            'username'        => $c['username'],
            'avatar_url'      => $c['avatar_url'],
            'role'            => $c['is_admin'] ? 'Admin' : 'Member',
            'points'          => (int)$c['points'],
            'last_message'    => $c['last_message'],
            'last_message_at' => $c['last_message_at'],
            'unread_count'    => (int)$c['unread_count'],
            // Eksplicitan flag za frontend - "ima li uopće razgovora s ovom osobom"
            'has_conversation'=> $c['last_message_at'] !== null
        ];
    }, $contacts);

    echo json_encode([
        'success'  => true,
        'contacts' => $contacts
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch contacts: ' . $e->getMessage()
    ]);
}
?>
