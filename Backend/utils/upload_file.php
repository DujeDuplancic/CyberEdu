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

// Enable detailed error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log the request
error_log("=== FILE UPLOAD STARTED ===");
error_log("📤 Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("📤 Content Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'Not set'));

// Debug what we're receiving
error_log("📨 POST data received:");
foreach ($_POST as $key => $value) {
    error_log("  $key: $value");
}

error_log("📁 FILES data received:");
foreach ($_FILES as $key => $file) {
    error_log("  $key: " . $file['name'] . " (" . $file['size'] . " bytes)");
}

require_once '../config/database.php';

class FileUploader {
    private $uploadDir = '../../uploads/challenges/';
    private $allowedTypes = ['zip', 'pdf', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'exe', 'bin', 'tar', 'gz'];
    private $maxFileSize = 50 * 1024 * 1024;

    public function __construct() {
        if (!file_exists($this->uploadDir)) {
            mkdir($this->uploadDir, 0777, true);
            error_log("📁 Created upload directory: " . $this->uploadDir);
        }
    }

    public function uploadFile($file, $challengeId, $userId) {
        try {
            error_log("📄 Processing file: " . $file['name'] . " for challenge: " . $challengeId . ", user: " . $userId);
            
            if ($file['error'] !== UPLOAD_ERR_OK) {
                $errorMsg = $this->getUploadError($file['error']);
                throw new Exception($errorMsg);
            }

            if ($file['size'] > $this->maxFileSize) {
                throw new Exception('File too large. Maximum size: 50MB');
            }

            $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($fileExtension, $this->allowedTypes)) {
                throw new Exception('Invalid file type. Allowed: ' . implode(', ', $this->allowedTypes));
            }

            $safeFilename = $this->generateSafeFilename($file['name'], $challengeId, $fileExtension);
            $filePath = $this->uploadDir . $safeFilename;

            error_log("💾 Saving file to: " . $filePath);

            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                $publicUrl = '/CyberEdu/uploads/challenges/' . $safeFilename;
                error_log("✅ File uploaded successfully: " . $publicUrl);
                
                return [
                    'success' => true, 
                    'message' => 'File uploaded successfully',
                    'file_url' => $publicUrl,
                    'filename' => $safeFilename
                ];
            } else {
                throw new Exception('Failed to save uploaded file');
            }

        } catch (Exception $e) {
            error_log("❌ Upload exception: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    private function generateSafeFilename($originalName, $challengeId, $extension) {
        $baseName = pathinfo($originalName, PATHINFO_FILENAME);
        $safeBaseName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $baseName);
        $timestamp = time();
        return "challenge_{$challengeId}_{$safeBaseName}_{$timestamp}.{$extension}";
    }

    private function getUploadError($errorCode) {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension',
        ];
        return $errors[$errorCode] ?? 'Unknown upload error';
    }
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    error_log("🔄 Processing file upload request");
    
    // Check if file was uploaded
    if (!isset($_FILES['file'])) {
        error_log("❌ No file uploaded");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No file uploaded']);
        exit();
    }
    
    // Get challenge_id and user_id from POST
    $challengeId = $_POST['challenge_id'] ?? '';
    $userId = $_POST['user_id'] ?? '';
    
    error_log("🔍 Extracted - User ID: '$userId', Challenge ID: '$challengeId'");
    
    if (empty($challengeId)) {
        error_log("❌ No challenge_id provided");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Challenge ID is required']);
        exit();
    }
    
    if (empty($userId)) {
        error_log("❌ No user_id provided");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        exit();
    }

    $file = $_FILES['file'];

    // ✅ SKIP ADMIN CHECK FOR NOW - samo provjeri da li user_id postoji
    error_log("✅ Skipping admin check for testing");
    
    /*
    // Admin check (komentiraj za sada)
    require_once '../admin/check_admin.php';
    $adminCheck = new AdminAuth();
    $checkResult = $adminCheck->checkAdmin($userId);
    
    if (!$checkResult['success']) {
        error_log("❌ Admin check failed: " . $checkResult['message']);
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    */

    // Upload file
    $uploader = new FileUploader();
    $result = $uploader->uploadFile($file, $challengeId, $userId);
    
    error_log("📤 Sending response: " . json_encode($result));
    echo json_encode($result);
    
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

error_log("=== FILE UPLOAD FINISHED ===");
?>