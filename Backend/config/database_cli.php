<?php
// config/database_cli.php - Za CLI usage bez headers
class Database {
    private $host = "localhost";
    private $db_name = "cyberedu";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            // Prvo se konektuj bez baze da provjerimo/kreiramo bazu
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";charset=utf8mb4", 
                $this->username, 
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Kreiraj bazu ako ne postoji
            $this->createDatabaseIfNotExists();
            
            // Sada se konektuj na specifičnu bazu
            $this->conn->exec("USE " . $this->db_name);
            echo "✅ Connected to database: {$this->db_name}\n";
            
        } catch(PDOException $exception) {
            echo "❌ Connection error: " . $exception->getMessage() . "\n";
            exit(1);
        }
        
        return $this->conn;
    }

    private function createDatabaseIfNotExists() {
        try {
            $check_db = $this->conn->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
            $check_db->execute([$this->db_name]);
            
            if (!$check_db->fetch()) {
                echo "📦 Creating database: {$this->db_name}\n";
                $sql = "CREATE DATABASE " . $this->db_name . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
                $this->conn->exec($sql);
                echo "✅ Database created successfully\n";
            } else {
                echo "✅ Database already exists\n";
            }
        } catch (PDOException $e) {
            echo "❌ Error creating database: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
}
?>