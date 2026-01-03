<?php
// Enable detailed error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

// Start output buffering
ob_start();

// Log request
error_log("=== DOWNLOAD REQUEST STARTED ===");
error_log("📤 Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("📤 File parameter: " . ($_GET['file'] ?? 'none'));

// Set CORS headers for ALL requests
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    error_log("📤 Handling OPTIONS preflight");
    ob_end_clean();
    exit();
}

// Get file path from query parameter
$file_param = isset($_GET['file']) ? urldecode($_GET['file']) : '';
error_log("📁 Received file parameter: " . $file_param);

if (empty($file_param)) {
    error_log("❌ No file parameter provided");
    http_response_code(400);
    echo "File parameter is required";
    ob_end_flush();
    exit();
}

// ***** OVO JE KLJUČNO: *****
// Fajl je u Cyberedu/uploads/challenges/
// BackEnd folder je unutar Cyberedu/
// Dakle, putanja je: CyberEdu/BackEnd/challenges/download.php

// Definiši apsolutnu putanju do uploads foldera
// __DIR__ = CyberEdu/BackEnd/challenges/
// Trebamo ići dva nivoa unazad: CyberEdu/BackEnd/challenges/ -> ../../ -> CyberEdu/
$base_dir = realpath(__DIR__ . '/../../') . '/'; // CyberEdu/
$uploads_dir = $base_dir . 'uploads/'; // CyberEdu/uploads/

error_log("📁 Base directory (CyberEdu/): " . $base_dir);
error_log("📁 Uploads directory: " . $uploads_dir);

// Provjeri da li uploads direktorij postoji
if (!file_exists($uploads_dir) || !is_dir($uploads_dir)) {
    error_log("❌ Uploads directory doesn't exist: " . $uploads_dir);
    http_response_code(500);
    echo "Uploads directory not found";
    ob_end_flush();
    exit();
}

// Kreiraj punu putanju do fajla
// $file_param može biti: 
// 1. "challenges/challenge_10_sifra_1763918430.txt"
// 2. "uploads/challenges/challenge_10_sifra_1763918430.txt"
// 3. "/CyberEdu/uploads/challenges/challenge_10_sifra_1763918430.txt"

$file_path = $file_param;

// Ukloni /CyberEdu/ prefix ako postoji
if (strpos($file_path, '/CyberEdu/') === 0) {
    $file_path = substr($file_path, strlen('/CyberEdu/'));
    error_log("📁 Removed /CyberEdu/ prefix");
}

// Ukloni uploads/ prefix ako već nije uključen
if (strpos($file_path, 'uploads/') === 0) {
    $full_path = $base_dir . $file_path;
} else if (strpos($file_path, 'challenges/') === 0) {
    // Ako počinje sa challenges/, dodaj uploads/
    $full_path = $uploads_dir . $file_path;
} else {
    // Default: pretpostavi da je u uploads/challenges/
    $full_path = $uploads_dir . 'challenges/' . $file_path;
}

error_log("📁 Full file path: " . $full_path);

// Provjeri da li fajl postoji
if (!file_exists($full_path)) {
    error_log("❌ File does not exist: " . $full_path);
    
    // Debug: listaj sadržaj direktorija
    $dir = dirname($full_path);
    if (is_dir($dir)) {
        error_log("📁 Directory contents of " . $dir . ":");
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..') {
                $filepath = $dir . '/' . $file;
                error_log("  " . $file . " - " . (is_dir($filepath) ? "DIR" : "FILE"));
            }
        }
    }
    
    http_response_code(404);
    echo "File not found: " . basename($full_path);
    ob_end_flush();
    exit();
}

// Provjeri da li je direktorij
if (is_dir($full_path)) {
    error_log("❌ Path is a directory: " . $full_path);
    http_response_code(403);
    echo "Cannot download directories";
    ob_end_flush();
    exit();
}

// Get file info
$filename = basename($full_path);
$filesize = filesize($full_path);
$file_extension = strtolower(pathinfo($full_path, PATHINFO_EXTENSION));

error_log("✅ File found: " . $filename . " (" . $filesize . " bytes)");

// Set appropriate content type
$content_types = [
    'txt' => 'text/plain',
    'zip' => 'application/zip',
    'pdf' => 'application/pdf',
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif' => 'image/gif',
    'exe' => 'application/x-msdownload',
    'bin' => 'application/octet-stream',
];

$content_type = $content_types[$file_extension] ?? 'application/octet-stream';

// Clean output buffer
ob_clean();

// Set download headers
header('Content-Type: ' . $content_type);
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . $filesize);
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Expires: 0');

// Send the file
readfile($full_path);
error_log("📤 File sent successfully");

error_log("=== DOWNLOAD COMPLETED ===");
exit();
?>