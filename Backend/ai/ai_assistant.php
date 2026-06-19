<?php
// CORS headers - OBAVEZNO na samom vrhu
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Ako zahtjev dolazi s localhosta ili s Vercela, odobri BAŠ TU domenu koja pita
if ($origin === "http://localhost:5173" || $origin === "https://cyber-edu-p46j.vercel.app") {
    header("Access-Control-Allow-Origin: " . $origin);
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

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
// KONFIGURACIJA: Groq API + Llama 3.3 70B
// Groq je odabran jer ima najbrži inference (LPU hardware) i izdašan
// free tier (14 400 req/dan, ~30 req/min) - sasvim dovoljno za chat asistenta.
// API je kompatibilan s OpenAI Chat Completions formatom.
//
// Ključ se učitava iz Backend/config/secrets.php (gitignored).
// =====================================================================
$GROQ_API_KEY = '';
$secretsFile  = __DIR__ . '/../config/secrets.php';
if (file_exists($secretsFile)) {
    $secrets = require $secretsFile;
    if (is_array($secrets) && !empty($secrets['GROQ_API_KEY'])) {
        $GROQ_API_KEY = $secrets['GROQ_API_KEY'];
    }
}
if (empty($GROQ_API_KEY) || $GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    $GROQ_API_KEY = getenv('GROQ_API_KEY') ?: '';
}

// Modeli unutar Groq-a poredani od najjačeg prema najlakšem. Ako prvi vrati
// grešku (npr. trenutni overload), padamo na sljedeći - i dalje je sve Groq.
$GROQ_MODELS = [
    'llama-3.3-70b-versatile',   // primarni - najbolja kvaliteta odgovora
    'llama-3.1-8b-instant',      // brži/manji - rezerva za peak load
    'gemma2-9b-it',              // dodatna rezerva
];

$GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// =====================================================================
// SYSTEM PROMPT - SentinelAI persona za cyber sigurnost
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
// Validacija ulaza
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

if (empty($GROQ_API_KEY)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Groq API key is not configured. Get a free key at https://console.groq.com/keys and add it to Backend/config/secrets.php as GROQ_API_KEY.'
    ]);
    exit();
}

// =====================================================================
// Transformacija u OpenAI/Groq format.
// Naša povijest koristi "user" i "assistant" - Groq očekuje isto, samo
// dodajemo system prompt na početak.
// =====================================================================
$messages = [
    ['role' => 'system', 'content' => $systemPrompt]
];

foreach ($input['messages'] as $msg) {
    if (!isset($msg['role'], $msg['content'])) continue;
    $role = ($msg['role'] === 'assistant') ? 'assistant' : 'user';
    $text = (string)$msg['content'];
    if (trim($text) === '') continue;
    $messages[] = ['role' => $role, 'content' => $text];
}

// Mora postojati barem jedna user poruka uz system
if (count($messages) < 2) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No valid messages provided.']);
    exit();
}

// =====================================================================
// Pomoćna funkcija: pošalji request na Groq za dani model.
// =====================================================================
function callGroq($model, $apiKey, $messages, $url) {
    $payload = [
        'model'       => $model,
        'messages'    => $messages,
        'temperature' => 0.7,
        'top_p'       => 0.9,
        'max_tokens'  => 1024,
        'stream'      => false,
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload),
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
            'decoded'  => null,
            'error'    => $curlErr ?: 'cURL request failed'
        ];
    }

    $decoded = json_decode($response, true);

    return [
        'ok'       => ($httpCode >= 200 && $httpCode < 300),
        'httpCode' => $httpCode,
        'decoded'  => $decoded,
        // Pokušaj izvući strukturiranu poruku iz Groq error body-ja
        'error'    => $decoded['error']['message']
                    ?? $decoded['error']['code']
                    ?? null
    ];
}

// =====================================================================
// Fallback chain unutar Groq-a (model-level, ne provider-level)
// =====================================================================
$lastError = null;
$lastCode  = null;
$result    = null;
$usedModel = null;

foreach ($GROQ_MODELS as $model) {
    $result = callGroq($model, $GROQ_API_KEY, $messages, $GROQ_URL);

    if ($result['ok']) {
        $usedModel = $model;
        break;
    }

    $lastError = $result['error'] ?: ('HTTP ' . $result['httpCode']);
    $lastCode  = $result['httpCode'];

    // 401/403 = autentikacijska greška, 429 = rate limit -> nema smisla
    // probavati drugi model jer je problem na razini accounta/ključa.
    if (in_array($lastCode, [401, 403, 429], true)) {
        break;
    }
}

if (!$result || !$result['ok']) {
    http_response_code(502);
    echo json_encode([
        'success'    => false,
        'message'    => 'Groq API error: ' . ($lastError ?? 'unknown error'),
        'groq_code'  => $lastCode,
        'tried'      => $GROQ_MODELS
    ]);
    exit();
}

// =====================================================================
// Parsiranje uspješnog odgovora (OpenAI-compatible format)
// =====================================================================
$decoded = $result['decoded'];
$reply   = $decoded['choices'][0]['message']['content'] ?? '';

if (trim($reply) === '') {
    $finishReason = $decoded['choices'][0]['finish_reason'] ?? 'UNKNOWN';
    $reply = "I couldn't generate a response for that request (reason: {$finishReason}). Please rephrase your cybersecurity question.";
}

echo json_encode([
    'success' => true,
    'reply'   => $reply,
    'model'   => $usedModel,
    'provider'=> 'Groq'
]);
?>
