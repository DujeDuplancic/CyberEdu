<?php
require_once __DIR__ . '/../config/database_cli.php';

$pdo = (new Database())->getConnection();
$data = json_decode(file_get_contents(__DIR__ . '/database_seed_data.json'), true);

$order = require __DIR__ . '/import_order.php';

// sigurnosna provjera
$tablesInJson = array_keys($data);
$missing = array_diff($tablesInJson, $order, ['migrations']);

if (!empty($missing)) {
    echo "⚠️ Warning: tables missing in import_order.php:\n";
    print_r($missing);
}

$pdo->exec("SET FOREIGN_KEY_CHECKS=0");

try {
    foreach ($order as $table) {
        if (!isset($data[$table])) continue;

        echo "🧹 Importing: $table\n";

        // Try to delete and reset auto-increment without DDL if possible
        $pdo->exec("DELETE FROM `$table`");
        
        // Check if table has auto_increment column
        try {
            $pdo->exec("ALTER TABLE `$table` AUTO_INCREMENT = 1");
        } catch (PDOException $e) {
            echo "  ℹ️ Could not reset auto_increment for $table: " . $e->getMessage() . "\n";
        }

        foreach ($data[$table] as $row) {
            $cols = array_keys($row);
            $place = implode(',', array_fill(0, count($cols), '?'));

            $sql = "INSERT INTO `$table` (`" . implode('`,`', $cols) . "`) VALUES ($place)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(array_values($row));
        }
    }

    echo "🎉 Import completed successfully\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    throw $e;
} finally {
    $pdo->exec("SET FOREIGN_KEY_CHECKS=1");
}