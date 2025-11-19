<?php
// migration_runner.php
date_default_timezone_set('Europe/Sarajevo');

class MigrationRunner {
    private $db;
    private $migrations_table = 'migrations';
    private $migrations_path;

    public function __construct() {
        echo "🔧 Initializing Migration Runner...\n";
        
        try {
            // Koristite CLI database config
            require_once __DIR__ . '/../config/database_cli.php';
            $database = new Database();
            $this->db = $database->getConnection();
            
            $this->migrations_path = __DIR__ . '/migrations/';
            $this->createMigrationsTable();
            
        } catch (Exception $e) {
            die("❌ Failed to initialize migration runner: " . $e->getMessage() . "\n");
        }
    }

    private function createMigrationsTable() {
        $query = "
            CREATE TABLE IF NOT EXISTS `{$this->migrations_table}` (
                id INT PRIMARY KEY AUTO_INCREMENT,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                batch INT NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ";
        
        try {
            $this->db->exec($query);
            echo "✅ Migrations table ready\n";
        } catch (PDOException $e) {
            die("❌ Error creating migrations table: " . $e->getMessage());
        }
    }

    public function runMigrations() {
        echo "🚀 Starting migrations...\n";
        
        // Provjeri da li folder postoji
        if (!is_dir($this->migrations_path)) {
            echo "📁 Creating migrations directory...\n";
            mkdir($this->migrations_path, 0755, true);
        }

        $migrations = glob($this->migrations_path . '*.php');
        
        if (empty($migrations)) {
            echo "ℹ️ No migration files found. Create some migration files in: " . $this->migrations_path . "\n";
            
            // Kreiraj primjer migracije
            $this->createExampleMigration();
            return;
        }
        
        sort($migrations);
        $executed = $this->getExecutedMigrations();
        $batch = $this->getNextBatchNumber();
        $executed_count = 0;
        
        foreach ($migrations as $migration) {
            $filename = basename($migration);
            
            if (!in_array($filename, $executed)) {
                echo "📦 Migrating: $filename\n";
                $this->runMigration($migration, $filename, $batch);
                $executed_count++;
            } else {
                echo "✅ Already executed: $filename\n";
            }
        }
        
        if ($executed_count > 0) {
            echo "🎉 Successfully executed $executed_count migration(s)\n";
        } else {
            echo "ℹ️ No new migrations to execute\n";
        }
    }

    private function runMigration($migrationFile, $filename, $batch) {
        $inTransaction = false;
        
        try {
            require_once $migrationFile;
            
            if (!function_exists('up')) {
                throw new Exception("Migration $filename must have an 'up' function");
            }
            
            $inTransaction = $this->db->beginTransaction();
            
            $query = up();
            if (!empty($query)) {
                $this->db->exec($query);
            }
            
            // Zabilježi migraciju
            $stmt = $this->db->prepare(
                "INSERT INTO `{$this->migrations_table}` (migration_name, batch) VALUES (?, ?)"
            );
            $stmt->execute([$filename, $batch]);
            
            $this->db->commit();
            echo "   ✅ Success: $filename\n";
            
        } catch (Exception $e) {
            if ($inTransaction) {
                try {
                    $this->db->rollBack();
                } catch (PDOException $rollbackError) {
                    // Ignoriši rollback grešku ako transakcija već ne postoji
                }
            }
            die("   ❌ Failed ($filename): " . $e->getMessage() . "\n");
        }
    }

    private function createExampleMigration() {
        $example_migration = $this->migrations_path . '001_create_users_table.php';
        $content = '<?php
function up() {
    return "
        CREATE TABLE IF NOT EXISTS `users` (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
}

function down() {
    return "DROP TABLE IF EXISTS `users`;";
}
?>';

        file_put_contents($example_migration, $content);
        echo "📝 Created example migration: 001_create_users_table.php\n";
        echo "💡 Edit this file and run migrations again.\n";
    }

    private function getExecutedMigrations() {
        try {
            $stmt = $this->db->query("SELECT migration_name FROM `{$this->migrations_table}` ORDER BY id");
            return $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        } catch (PDOException $e) {
            return [];
        }
    }

    private function getNextBatchNumber() {
        try {
            $stmt = $this->db->query("SELECT MAX(batch) FROM `{$this->migrations_table}`");
            $max = $stmt->fetchColumn();
            return ($max ?: 0) + 1;
        } catch (PDOException $e) {
            return 1;
        }
    }

    public function status() {
        $executed = $this->getExecutedMigrations();
        $migrations = glob($this->migrations_path . '*.php');
        
        echo "📊 Migration Status:\n";
        echo str_repeat("=", 50) . "\n";
        
        foreach ($migrations as $migration) {
            $filename = basename($migration);
            $status = in_array($filename, $executed) ? '✅ Executed' : '⏳ Pending';
            echo "  $filename - $status\n";
        }
        
        echo "\nTotal: " . count($executed) . " executed, " . 
             (count($migrations) - count($executed)) . " pending\n";
    }

    public function runSeeds() {
        echo "🌱 Running seeders...\n";
        
        $seeds_path = __DIR__ . '/seeds/';
        
        if (!is_dir($seeds_path)) {
            echo "📁 Creating seeds directory...\n";
            mkdir($seeds_path, 0755, true);
            echo "💡 Create seed files in: " . $seeds_path . "\n";
            return;
        }
        
        $seeds = glob($seeds_path . '*.php');
        sort($seeds);
        
        if (empty($seeds)) {
            echo "ℹ️ No seed files found in: " . $seeds_path . "\n";
            return;
        }
        
        foreach ($seeds as $seed) {
            $filename = basename($seed);
            echo "🌱 Seeding: $filename\n";
            $this->runSeed($seed, $filename);
        }
        
        echo "🎉 Seeding completed!\n";
    }

    private function runSeed($seedFile, $filename) {
        $inTransaction = false;
        
        try {
            require_once $seedFile;
            
            if (!function_exists('seed')) {
                throw new Exception("Seeder $filename must have a 'seed' function");
            }
            
            $inTransaction = $this->db->beginTransaction();
            seed();
            $this->db->commit();
            
            echo "   ✅ Seeded: $filename\n";
            
        } catch (Exception $e) {
            if ($inTransaction) {
                try {
                    $this->db->rollBack();
                } catch (PDOException $rollbackError) {
                    // Ignoriši rollback grešku
                }
            }
            die("   ❌ Seeding failed ($filename): " . $e->getMessage() . "\n");
        }
    }

    public function rollback($batch = null) {
        try {
            if ($batch === null) {
                // Rollback zadnji batch
                $stmt = $this->db->query("SELECT MAX(batch) FROM `{$this->migrations_table}`");
                $batch = $stmt->fetchColumn();
                
                if (!$batch) {
                    echo "ℹ️ No migrations to rollback\n";
                    return;
                }
            }
            
            $migrations = $this->getMigrationsByBatch($batch);
            
            if (empty($migrations)) {
                echo "ℹ️ No migrations found for batch: $batch\n";
                return;
            }
            
            echo "🔄 Rolling back batch: $batch\n";
            
            foreach (array_reverse($migrations) as $migration) {
                echo "↩️ Rolling back: $migration\n";
                $this->runRollback($migration);
            }
            
            echo "✅ Rollback completed!\n";
            
        } catch (Exception $e) {
            die("❌ Rollback failed: " . $e->getMessage());
        }
    }

    private function runRollback($migrationFile) {
        $migration_path = $this->migrations_path . $migrationFile;
        $inTransaction = false;
        
        if (!file_exists($migration_path)) {
            throw new Exception("Migration file not found: $migration_path");
        }
        
        require_once $migration_path;
        
        if (!function_exists('down')) {
            throw new Exception("Migration $migrationFile must have a 'down' function");
        }
        
        try {
            $inTransaction = $this->db->beginTransaction();
            
            $query = down();
            if (!empty($query)) {
                $this->db->exec($query);
            }
            
            // Ukloni migraciju iz evidencije
            $stmt = $this->db->prepare(
                "DELETE FROM `{$this->migrations_table}` WHERE migration_name = ?"
            );
            $stmt->execute([$migrationFile]);
            
            $this->db->commit();
            echo "✅ Successfully rolled back: $migrationFile\n";
            
        } catch (Exception $e) {
            if ($inTransaction) {
                try {
                    $this->db->rollBack();
                } catch (PDOException $rollbackError) {
                    // Ignoriši rollback grešku
                }
            }
            throw new Exception("Rollback execution failed: " . $e->getMessage());
        }
    }

    private function getMigrationsByBatch($batch) {
        $stmt = $this->db->prepare(
            "SELECT migration_name FROM `{$this->migrations_table}` WHERE batch = ? ORDER BY id"
        );
        $stmt->execute([$batch]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    }
}

// CLI Handler
if (php_sapi_name() === 'cli') {
    $runner = new MigrationRunner();
    
    if (isset($argv[1])) {
        switch ($argv[1]) {
            case 'rollback':
                $batch = $argv[2] ?? null;
                $runner->rollback($batch);
                break;
            case 'status':
                $runner->status();
                break;
            case 'seed':
                $runner->runSeeds();
                break;
            case 'fresh':
                // Reset i seed
                $runner->runMigrations();
                $runner->runSeeds();
                break;
            case 'migrate':
            default:
                $runner->runMigrations();
                break;
        }
    } else {
        echo "🚀 CyberEdu Migration Tool\n";
        echo str_repeat("=", 30) . "\n";
        echo "Usage:\n";
        echo "  php migration_runner.php migrate    - Run migrations\n";
        echo "  php migration_runner.php seed       - Run seeders\n";
        echo "  php migration_runner.php fresh      - Run migrations + seeders\n";
        echo "  php migration_runner.php status     - Show migration status\n";
        echo "  php migration_runner.php rollback   - Rollback last batch\n\n";
        
        $runner->status();
    }
} else {
    die("❌ This script can only be run from command line.\n");
}
?>