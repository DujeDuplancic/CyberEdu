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
 * Endpoint koji vraća listu svih korisnika osim trenutno prijavljenog.
 * Uz svakog korisnika dolazi i sažetak zadnje poruke razgovora te broj
 * nepročitanih poruka kako bi se sidebar u chatu mogao odmah popuniti.
 *
 * Očekivani query parametar: ?user_id=ID_trenutnog_korisnika
 */
try {
    // Dohvat ID-a trenutnog korisnika iz query parametra
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

    // =====================================================================
    // Glavni upit: za svakog korisnika (osim trenutnog) izvlačimo
    // zadnju poruku razgovora i broj nepročitanih poruka prema nama.
    // Koristimo korelirane subqueryje radi čitljivosti i kompatibilnosti
    // sa starijim MySQL verzijama na XAMPP-u (bez window funkcija).
    // =====================================================================
    $query = "
        SELECT
            u.id,
            u.username,
            u.avatar_url,
            u.is_admin,
            u.points,
            (
                SELECT cm.content
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
    // Bindamo isti ID više puta jer ga koristimo u više subqueryja
    $stmt->bindValue(':me1', $currentUserId, PDO::PARAM_INT);
    $stmt->bindValue(':me2', $currentUserId, PDO::PARAM_INT);
    $stmt->bindValue(':me3', $currentUserId, PDO::PARAM_INT);
    $stmt->bindValue(':me4', $currentUserId, PDO::PARAM_INT);
    $stmt->bindValue(':me5', $currentUserId, PDO::PARAM_INT);
    $stmt->bindValue(':me6', $currentUserId, PDO::PARAM_INT);
    $stmt->execute();

    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // =====================================================================
    // Pretvaranje sirovih DB rezultata u format prilagođen frontend-u.
    // - unread_count kastamo u int
    // - dodajemo polje 'role' iz is_admin / points radi UI prikaza
    // =====================================================================
    $contacts = array_map(function ($c) {
        return [
            'id'              => (int)$c['id'],
            'username'        => $c['username'],
            'avatar_url'      => $c['avatar_url'],
            'role'            => $c['is_admin'] ? 'Admin' : 'Member',
            'points'          => (int)$c['points'],
            'last_message'    => $c['last_message'],
            'last_message_at' => $c['last_message_at'],
            'unread_count'    => (int)$c['unread_count']
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
