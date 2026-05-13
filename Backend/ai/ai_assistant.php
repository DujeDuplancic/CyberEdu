<?php
// CORS headers - OBAVEZNO na samom vrhu (isti pattern kao i ostatak backend-a)
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Preflight zahtjev (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// =====================================================================
// KONFIGURACIJA: Gemini API ključ + lista modela koje pokušavamo redom
// (fallback chain). Ako prvi model vrati grešku (npr. nije dostupan u
// ovoj regiji ili za ovu verziju API-ja), automatski pokušavamo sljedeći.
//
// API ključ se učitava iz Backend/config/secrets.php (gitignored).
// Ako file ne postoji ili ključ nije postavljen, pokušava environment
// varijablu GEMINI_API_KEY. NIKAD se ne hardcoda u kod.
// =====================================================================
$GEMINI_API_KEY = '';
$secretsFile    = __DIR__ . '/../config/secrets.php';
if (file_exists($secretsFile)) {
    $secrets = require $secretsFile;
    if (is_array($secrets) && !empty($secrets['GEMINI_API_KEY'])) {
        $GEMINI_API_KEY = $secrets['GEMINI_API_KEY'];
    }
}
if (empty($GEMINI_API_KEY) || $GEMINI_API_KEY === 'PASTE_YOUR_NEW_KEY_HERE') {
    // Fallback na environment varijablu
    $GEMINI_API_KEY = getenv('GEMINI_API_KEY') ?: '';
}

// Modeli poredani od najnovijeg/najjačeg prema starijem/stabilnijem.
// Ako Gemini odbije prvi (npr. zbog "model not found"), fallback osigurava
// da chat i dalje radi za korisnika.
$GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash'
];

// =====================================================================
// SYSTEM PROMPT - strogo ograničava asistenta na cyber sigurnost
// =====================================================================
$systemPrompt = <<<PROMPT
You are "SentinelAI", an AI cybersecurity assistant integrated into the CyberEdu learning platform.

STRICT RULES:
1. You ONLY answer questions related to cybersecurity, ethical hacking, CTF challenges, security tools, defensive and offensive security concepts, cryptography, reverse engineering, web security, binary exploitation, forensics, OSINT and steganography.
2. If a user asks about ANYTHING outside cybersecurity (cooking, sports, celebrities, general programming unrelated to security, etc.), politely refuse and redirect them back to cybersecurity topics.
3. For CTF challenges: PROVIDE HINTS ONLY. Never reveal full solutions, flags or step-by-step exploit code that would solve the challenge for the user. Use the Socratic method: ask guiding questions, suggest concepts to research, point to relevant tools.
4. Recommend appropriate tools for the task at hand (e.g., Burp Suite for web pentesting, Nmap for reconnaissance, Ghidra/IDA for reverse engineering, Wireshark for traffic analysis, John the Ripper / Hashcat for cracking, CyberChef for encoding, Volatility for memory forensics).
5. Always promote ETHICAL and LEGAL use of cybersecurity knowledge. Refuse to help with attacks on systems the user does not own or have explicit permission to test.
6. Respond in English. Keep answers concise, well-structured and use Markdown formatting (bold, lists, code blocks) when appropriate.
7. If unsure whether a question is on-topic, lean towards the cybersecurity interpretation.
PROMPT;

// =====================================================================
// Validacija ulaznih podataka
// =====================================================================
$rawInput = file_get_contents('php://input');
$input    = json_decode($rawInput, true);

if (!is_array($input) || !isset($input['messages']) || !is_array($input['messages'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request body. Expected JSON: { "messages": [{ "role": "user|assistant", "content": "..." }, ...] }'
    ]);
    exit();
}

if (empty($GEMINI_API_KEY)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gemini API key is not configured. Copy Backend/config/secrets.example.php to secrets.php and add your key from https://aistudio.google.com/app/apikey'
    ]);
    exit();
}

// =====================================================================
// Transformacija poruka u Gemini format
// =====================================================================
$contents = [];
foreach ($input['messages'] as $msg) {
    if (!isset($msg['role'], $msg['content'])) continue;
    $role = $msg['role'] === 'assistant' ? 'model' : 'user';
    $text = (string)$msg['content'];
    if (trim($text) === '') continue;
    $contents[] = [
        'role'  => $role,
        'parts' => [['text' => $text]]
    ];
}

if (empty($contents)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No valid messages provided.']);
    exit();
}

// =====================================================================
// Payload za Gemini
// =====================================================================
$payload = [
    'systemInstruction' => [
        'parts' => [['text' => $systemPrompt]]
    ],
    'contents'        => $contents,
    'generationConfig' => [
        'temperature'     => 0.7,
        'topP'            => 0.9,
        'maxOutputTokens' => 1024
    ],
    'safetySettings' => [
        ['category' => 'HARM_CATEGORY_HARASSMENT',       'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
        ['category' => 'HARM_CATEGORY_HATE_SPEECH',      'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
        ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT','threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
        ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT','threshold' => 'BLOCK_ONLY_HIGH']
    ]
];

$payloadJson = json_encode($payload);

// =====================================================================
// Pomoćna funkcija: pošalji POST na Gemini za dani model.
// Vraća asocijativni niz: ok, httpCode, body, decoded, error
// =====================================================================
function callGemini($model, $apiKey, $payloadJson) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => $payloadJson,
        CURLOPT_TIMEOUT        => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        return [
            'ok'       => false,
            'httpCode' => 0,
            'body'     => null,
            'decoded'  => null,
            'error'    => $curlErr ?: 'cURL request failed'
        ];
    }

    $decoded = json_decode($response, true);

    return [
        'ok'       => ($httpCode >= 200 && $httpCode < 300),
        'httpCode' => $httpCode,
        'body'     => $response,
        'decoded'  => $decoded,
        // Pokušaj izvući strukturiranu poruku iz Gemini error body-ja
        'error'    => $decoded['error']['message']
                    ?? $decoded['error']['status']
                    ?? null
    ];
}

// =====================================================================
// Fallback chain: probaj svaki model dok jedan ne uspije.
// Zadržavamo zadnju strukturiranu grešku za vraćanje frontend-u ako svi padnu.
// =====================================================================
$lastError    = null;
$lastCode     = null;
$lastModel    = null;
$result       = null;
$usedModel    = null;

foreach ($GEMINI_MODELS as $model) {
    $result    = callGemini($model, $GEMINI_API_KEY, $payloadJson);
    $lastModel = $model;

    if ($result['ok']) {
        $usedModel = $model;
        break;
    }

    $lastError = $result['error'] ?: ('HTTP ' . $result['httpCode']);
    $lastCode  = $result['httpCode'];

    // 4xx greške (osim 404/400 model-not-found) najčešće znače da problem
    // nije u modelu nego u zahtjevu/API ključu - nema smisla probavati dalje.
    // 401/403/429 -> stop. 404/400 -> pokušaj sljedeći model.
    if (in_array($lastCode, [401, 403, 429], true)) {
        break;
    }
}

// Svi modeli su pali - vrati informativnu poruku frontend-u
if (!$result || !$result['ok']) {
    http_response_code(502);
    echo json_encode([
        'success'     => false,
        'message'     => 'Gemini API error: ' . ($lastError ?? 'unknown error'),
        'gemini_code' => $lastCode,
        'last_model'  => $lastModel,
        'tried'       => $GEMINI_MODELS
    ]);
    exit();
}

// =====================================================================
// Parsiranje uspješnog odgovora
// =====================================================================
$decoded = $result['decoded'];
$reply   = '';

if (isset($decoded['candidates'][0]['content']['parts']) && is_array($decoded['candidates'][0]['content']['parts'])) {
    foreach ($decoded['candidates'][0]['content']['parts'] as $part) {
        if (isset($part['text'])) {
            $reply .= $part['text'];
        }
    }
}

if (trim($reply) === '') {
    $finishReason = $decoded['candidates'][0]['finishReason'] ?? 'UNKNOWN';
    $reply = "I couldn't generate a response for that request (reason: {$finishReason}). Please rephrase your cybersecurity question.";
}

echo json_encode([
    'success' => true,
    'reply'   => $reply,
    'model'   => $usedModel
]);
?>
