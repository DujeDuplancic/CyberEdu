<?php
// CORS headers - OBAVEZNO na samom vrhu (isti pattern kao i ostatak backend-a)
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Preflight zahtjev (OPTIONS) - browser ga šalje prije pravog POST-a
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Dozvoljavamo isključivo POST metodu jer šaljemo poruke u tijelu zahtjeva
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// =====================================================================
// KONFIGURACIJA: Gemini 2.5 Flash API ključ i endpoint
// NAPOMENA: U produkciji ključ obavezno premjestiti u .env ili sustavske
// varijable okoline. Ovdje je radi jednostavnosti integracije u XAMPP.
// =====================================================================
$GEMINI_API_KEY = getenv('GEMINI_API_KEY') ?: 'AIzaSyBcp0Oq1eh8Qh6AhIG8L1M1PjOXzYpWsGY';
$GEMINI_MODEL   = 'gemini-2.5-flash';
$GEMINI_URL     = "https://generativelanguage.googleapis.com/v1beta/models/{$GEMINI_MODEL}:generateContent?key={$GEMINI_API_KEY}";

// =====================================================================
// SUSTAVSKI PROMPT (System Instruction)
// Strogo ograničava asistenta isključivo na cyber sigurnost. Ime
// asistenta je "SentinelAI". Asistent NIKADA ne otkriva rješenja CTF
// zadataka - daje samo natuknice i preporučuje alate.
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
// Dohvat i validacija ulaznih podataka iz tijela zahtjeva
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

// Provjera prisutnosti API ključa
if ($GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE' || empty($GEMINI_API_KEY)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gemini API key is not configured on the server. Please set the GEMINI_API_KEY environment variable.'
    ]);
    exit();
}

// =====================================================================
// Transformacija povijesti razgovora u format koji očekuje Gemini API
// - Naša uloga "assistant" mapira se na Gemini-jevu ulogu "model"
// - Uloga "user" ostaje "user"
// =====================================================================
$contents = [];
foreach ($input['messages'] as $msg) {
    if (!isset($msg['role'], $msg['content'])) {
        continue;
    }
    $role = $msg['role'] === 'assistant' ? 'model' : 'user';
    $text = (string)$msg['content'];

    // Preskačemo prazne poruke
    if (trim($text) === '') {
        continue;
    }

    $contents[] = [
        'role'  => $role,
        'parts' => [['text' => $text]]
    ];
}

// Provjera da postoji barem jedna korisnička poruka
if (empty($contents)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'No valid messages provided.'
    ]);
    exit();
}

// =====================================================================
// Konstrukcija payload-a za Gemini API
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
    // Sigurnosne postavke - blokiramo eksplicitne kategorije sadržaja
    'safetySettings' => [
        ['category' => 'HARM_CATEGORY_HARASSMENT',       'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
        ['category' => 'HARM_CATEGORY_HATE_SPEECH',      'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
        ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT','threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
        ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT','threshold' => 'BLOCK_ONLY_HIGH']
    ]
];

// =====================================================================
// Slanje zahtjeva prema Gemini API-ju koristeći cURL
// =====================================================================
$ch = curl_init($GEMINI_URL);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_TIMEOUT        => 30,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

// Provjera mrežnih grešaka
if ($response === false) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to reach Gemini API: ' . $curlErr
    ]);
    exit();
}

// Provjera HTTP statusa Gemini-ja
if ($httpCode < 200 || $httpCode >= 300) {
    http_response_code(502);
    echo json_encode([
        'success'      => false,
        'message'      => 'Gemini API returned an error.',
        'gemini_code'  => $httpCode,
        'gemini_body'  => json_decode($response, true)
    ]);
    exit();
}

// =====================================================================
// Parsiranje odgovora i ekstrakcija generiranog teksta
// =====================================================================
$decoded = json_decode($response, true);
$reply   = '';

if (isset($decoded['candidates'][0]['content']['parts']) && is_array($decoded['candidates'][0]['content']['parts'])) {
    foreach ($decoded['candidates'][0]['content']['parts'] as $part) {
        if (isset($part['text'])) {
            $reply .= $part['text'];
        }
    }
}

// Ako odgovor nije generiran (npr. sigurnosni filter), vrati informativnu poruku
if (trim($reply) === '') {
    $finishReason = $decoded['candidates'][0]['finishReason'] ?? 'UNKNOWN';
    $reply = "I couldn't generate a response for that request (reason: {$finishReason}). Please rephrase your cybersecurity question.";
}

// Vraćanje konačnog odgovora prema frontend-u
echo json_encode([
    'success' => true,
    'reply'   => $reply,
    'model'   => $GEMINI_MODEL
]);
?>
