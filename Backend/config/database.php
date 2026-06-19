<?php
// CORS headers - OBAVEZNO na samom vrhu!
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Ako zahtjev dolazi s localhosta ili s Vercela, odobri BAŠ TU domenu koja pita
if ($origin === "http://localhost:5173" || $origin === "https://cyber-edu-p46j.vercel.app") {
    header("Access-Control-Allow-Origin: " . $origin);
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

class Database {
    private $host = "localhost";
    private $db_name = "cyberedu";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name, 
                $this->username, 
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // utf8mb4 je potreban za 4-bajtne znakove (emojiji 🚀😀 itd.).
            // Bez ovoga MySQL trim-a emoji-je i oni se prikazuju kao "????".
            $this->conn->exec("set names utf8mb4");
        } catch(PDOException $exception) {
            // PROMENJENO: Koristi error_log umesto echo
            error_log("Connection error: " . $exception->getMessage());
            // Vrati false umesto da prikazuje output
            return false;
        }
        return $this->conn;
    }
}
?>