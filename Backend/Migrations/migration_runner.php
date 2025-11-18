<?php
require_once '../config/database.php';

class MigrationRunner {
    private $db;
    private $migrations_table = 'migrations';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->createMigrationsTable();
    }

    private function createMigrationsTable() {
        $query = "
            CREATE TABLE IF NOT EXISTS {$this->migrations_table} (
                id INT PRIMARY KEY AUTO_INCREMENT,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                batch INT NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ";
        $this->db->exec($query);
    }

    public function runMigrations() {
        $migrations = glob('*.php');
        sort($migrations); // Execute in order
        
        $executed = $this->getExecutedMigrations();
        
        foreach ($migrations as $migration) {
            if ($migration === 'migration_runner.php') continue;
            
            if (!in_array($migration, $executed)) {
                echo "🚀 Running migration: $migration\n";
                $this->runMigration($migration);
            } else {
                echo "✅ Already executed: $migration\n";
            }
        }
        
        echo "🎉 All migrations completed successfully!\n";
    }

    private function runMigration($migrationFile) {
        require_once $migrationFile;
        
        if (!function_exists('up')) {
            throw new Exception("Migration $migrationFile must have an 'up' function");
        }
        
        $query = up();
        $this->db->exec($query);
        
        // Record migration
        $stmt = $this->db->prepare("INSERT INTO migrations (migration_name, batch) VALUES (?, 1)");
        $stmt->execute([$migrationFile]);
        
        echo "✅ Executed: $migrationFile\n";
    }

    private function getExecutedMigrations() {
        $stmt = $this->db->query("SELECT migration_name FROM migrations");
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function rollback($batch = 1) {
        $migrations = $this->getMigrationsByBatch($batch);
        
        foreach (array_reverse($migrations) as $migration) {
            echo "🔄 Rolling back: $migration\n";
            $this->runRollback($migration);
        }
        
        echo "✅ Rollback completed!\n";
    }

    private function runRollback($migrationFile) {
        require_once $migrationFile;
        
        if (!function_exists('down')) {
            throw new Exception("Migration $migrationFile must have a 'down' function");
        }
        
        $query = down();
        $this->db->exec($query);
        
        // Remove migration record
        $stmt = $this->db->prepare("DELETE FROM migrations WHERE migration_name = ?");
        $stmt->execute([$migrationFile]);
    }

    private function getMigrationsByBatch($batch) {
        $stmt = $this->db->prepare("SELECT migration_name FROM migrations WHERE batch = ?");
        $stmt->execute([$batch]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}

// Handle command line arguments
$runner = new MigrationRunner();

if (isset($argv[1]) && $argv[1] === 'rollback') {
    $batch = $argv[2] ?? 1;
    $runner->rollback($batch);
} else {
    $runner->runMigrations();
}
?>