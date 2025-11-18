<?php
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db) {
    echo "✅ DATABASE WORKS!";
} else {
    echo "❌ DATABASE ERROR!";
}
?>