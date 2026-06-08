<?php
// CORS headers - isti pattern kao i ostali endpoint-i
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
 * Endpoint koji vraća "daily goal" statistiku za prijavljenog korisnika:
 *   - koliko je izazova riješio DANAS
 *   - koliki je dnevni cilj (default 3, može se mijenjati konstantom)
 *   - koliko mu još fali do cilja
 *   - postotak napretka (0-100)
 *   - streak (uzastopni dani s barem jednim solve-om)
 *
 * Očekivani query parametar: ?user_id=ID_korisnika
 */

// Konstanta dnevnog cilja - centralna točka za izmjenu
const DAILY_GOAL_TARGET = 3;

try {
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing or invalid user_id parameter'
        ]);
        exit();
    }

    $database = new Database();
    $conn = $database->getConnection();

    if (!$conn) {
        throw new Exception("Database connection failed");
    }

    // =====================================================================
    // Broj izazova riješenih DANAS (u lokalnoj timezone-i servera).
    // DATE(solved_at) = CURDATE() osigurava da uzimamo samo današnji dan.
    // =====================================================================
    $todayStmt = $conn->prepare("
        SELECT COUNT(*) AS solves_today
        FROM solves
        WHERE user_id = :uid
          AND DATE(solved_at) = CURDATE()
    ");
    $todayStmt->bindValue(':uid', $userId, PDO::PARAM_INT);
    $todayStmt->execute();
    $solvesToday = (int)$todayStmt->fetchColumn();

    // =====================================================================
    // Ukupni broj izazova koje je korisnik ikada riješio - korisno za UI.
    // =====================================================================
    $totalStmt = $conn->prepare("
        SELECT COUNT(*) AS total_solves
        FROM solves
        WHERE user_id = :uid
    ");
    $totalStmt->bindValue(':uid', $userId, PDO::PARAM_INT);
    $totalStmt->execute();
    $totalSolves = (int)$totalStmt->fetchColumn();

    // =====================================================================
    // Izračun streak-a: koliko uzastopnih dana (uključujući danas)
    // korisnik ima barem jedan riješen izazov. Dohvaćamo do 60 najbližih
    // dana s aktivnošću pa lokalno brojimo niz unazad od danas.
    // =====================================================================
    $daysStmt = $conn->prepare("
        SELECT DISTINCT DATE(solved_at) AS solve_day
        FROM solves
        WHERE user_id = :uid
          AND solved_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
        ORDER BY solve_day DESC
    ");
    $daysStmt->bindValue(':uid', $userId, PDO::PARAM_INT);
    $daysStmt->execute();
    $activeDays = $daysStmt->fetchAll(PDO::FETCH_COLUMN);

    $streak = 0;
    $today  = new DateTime('today');
    foreach ($activeDays as $dayStr) {
        $day  = new DateTime($dayStr);
        $diff = (int)$today->diff($day)->format('%r%a'); // negativan ako je dan u prošlosti
        // $diff treba biti 0 (danas), -1 (jučer), -2, ...
        if ($diff === -$streak) {
            $streak++;
        } else {
            break; // prekinut niz
        }
    }

    // =====================================================================
    // Izračun napretka i preostalih izazova
    // =====================================================================
    $goal      = DAILY_GOAL_TARGET;
    $remaining = max(0, $goal - $solvesToday);
    $percent   = $goal > 0 ? min(100, (int)round(($solvesToday / $goal) * 100)) : 0;
    $completed = $solvesToday >= $goal;

    echo json_encode([
        'success'        => true,
        'goal'           => $goal,
        'solves_today'   => $solvesToday,
        'remaining'      => $remaining,
        'progress_pct'   => $percent,
        'completed'      => $completed,
        'streak_days'    => $streak,
        'total_solves'   => $totalSolves
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load daily goal: ' . $e->getMessage()
    ]);
}
?>
