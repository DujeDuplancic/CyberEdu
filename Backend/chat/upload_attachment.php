<?php
// CORS headers - identičan pattern kao i ostali endpoint-i u /chat
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Endpoint za upload privitka u chat poruci.
 * Očekuje multipart/form-data sa:
 *   - file (binarni file)
 *   - user_id (ID korisnika koji uploada)
 *
 * Vraća javni URL i meta podatke koje frontend zatim šalje
 * send_message.php endpointu kao attachment_* polja.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No file provided']);
        exit();
    }

    $userId = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'user_id is required']);
        exit();
    }

    $file = $_FILES['file'];

    // Provjera grešaka iz PHP upload mehanizma
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errMap = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE  => 'File exceeds MAX_FILE_SIZE',
            UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION  => 'File upload stopped by extension',
        ];
        throw new Exception($errMap[$file['error']] ?? 'Unknown upload error');
    }

    // 25 MB limit - chat privici ne bi trebali biti veći od ovoga
    $maxBytes = 25 * 1024 * 1024;
    if ($file['size'] > $maxBytes) {
        throw new Exception('File too large. Maximum size is 25 MB.');
    }

    // Allow-list ekstenzija - osnovne dokument/slike/arhive
    $allowed = [
        'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg',
        'pdf', 'txt', 'md', 'csv', 'log',
        'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'zip', 'rar', '7z', 'tar', 'gz'
    ];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed, true)) {
        throw new Exception('File type not allowed: .' . $ext);
    }

    // Folder za chat privitke (paralelno s uploads/avatars i uploads/challenges)
    $uploadDir = __DIR__ . '/../../uploads/chat/';
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true) && !is_dir($uploadDir)) {
            throw new Exception('Failed to create upload directory');
        }
    }

    // Sigurno ime: hash + timestamp + ekstenzija (čuvamo originalno ime u DB)
    $safeBase   = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
    $unique     = bin2hex(random_bytes(6));
    $filename   = "chat_{$userId}_{$unique}_{$safeBase}.{$ext}";
    $targetPath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception('Failed to save file');
    }

    // Kategorija privitka - frontend koristi za biranje prikaza (slika vs file chip)
    $imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
    $type      = in_array($ext, $imageExts, true) ? 'image' : 'file';

    $publicUrl = '/CyberEdu/uploads/chat/' . $filename;

    echo json_encode([
        'success'         => true,
        'attachment_url'  => $publicUrl,
        'attachment_name' => $file['name'],
        'attachment_type' => $type,
        'size'            => (int)$file['size']
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Upload failed: ' . $e->getMessage()
    ]);
}
?>
