<?php
// OVO JE ZA COMMAND LINE - BEZ CORS HEADERA
require_once '../config/database_cli.php';

// Uključi seed funkciju
require_once 'seeds/seed.php';

try {
    echo "🚀 Starting database seeding...\n";
    echo "========================================\n";
    
    // Pokreni seed
    seed();
    
    echo "========================================\n";
    echo "🎉 Database seeded successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Seeding failed: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>