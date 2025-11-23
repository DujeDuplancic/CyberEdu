<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

// Jednostavna provjera - bez admin check za sada
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Provjeri da li su svi podaci prisutni
    if (!isset($_FILES['file']) || !isset($_POST['challenge_id']) || !isset($_POST['user_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required data']);
        exit();
    }

    $userId = $_POST['user_id'];
    $challengeId = $_POST['challenge_id'];
    $file = $_FILES['file'];

    try {
        // Konfiguracija
        $uploadDir = '../../../uploads/challenges/';
        $allowedTypes = ['zip', 'pdf', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'exe', 'bin'];
        $maxFileSize = 50 * 1024 * 1024;

        // Kreiraj folder ako ne postoji
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Provjeri greške
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('Upload failed with error code: ' . $file['error']);
        }

        // Provjeri veličinu
        if ($file['size'] > $maxFileSize) {
            throw new Exception('File too large. Maximum size: 50MB');
        }

        // Provjeri tip
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($fileExtension, $allowedTypes)) {
            throw new Exception('Invalid file type. Allowed: ' . implode(', ', $allowedTypes));
        }

        // Generiraj filename
        $filename = 'challenge_' . $challengeId . '_' . time() . '.' . $fileExtension;
        $filePath = $uploadDir . $filename;

        // Prebaci file
        if (move_uploaded_file($file['tmp_name'], $filePath)) {
            $publicUrl = '/CyberEdu/uploads/challenges/' . $filename;
            
            echo json_encode([
                'success' => true, 
                'message' => 'File uploaded successfully',
                'file_url' => $publicUrl,
                'filename' => $filename
            ]);
        } else {
            throw new Exception('Failed to move uploaded file');
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>