<?php
// CORS headers - identičan pattern kao i ostali endpoint-i
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

// =====================================================================
// Popis RSS izvora vijesti iz svijeta cyber sigurnosti
// Naziv izvora se koristi i u frontend filteru
// =====================================================================
$FEEDS = [
    [
        'name'   => 'The Hacker News',
        'url'    => 'https://feeds.feedburner.com/TheHackersNews',
        'source' => 'thehackernews'
    ],
    [
        'name'   => 'BleepingComputer',
        'url'    => 'https://www.bleepingcomputer.com/feed/',
        'source' => 'bleepingcomputer'
    ],
    [
        'name'   => 'Krebs on Security',
        'url'    => 'https://krebsonsecurity.com/feed/',
        'source' => 'krebs'
    ]
];

// =====================================================================
// Postavke disk cache-a kako ne bismo "udarali" izvore prečesto
// Cache traje 10 minuta - svjež je dovoljno za news feed
// =====================================================================
$CACHE_FILE = __DIR__ . '/news_cache.json';
$CACHE_TTL  = 600; // 10 minuta u sekundama

/**
 * Funkcija koja vraća sadržaj keširanog odgovora ako je još valjan.
 * Vraća null ako cache ne postoji ili je istekao.
 */
function readCache($file, $ttl) {
    if (!file_exists($file)) {
        return null;
    }
    if ((time() - filemtime($file)) > $ttl) {
        return null;
    }
    $raw = file_get_contents($file);
    return $raw !== false ? $raw : null;
}

/**
 * Funkcija koja sprema JSON odgovor u cache datoteku.
 * Greške ignoriramo jer cache nije kritičan za rad.
 */
function writeCache($file, $content) {
    @file_put_contents($file, $content, LOCK_EX);
}

/**
 * Pomoćna funkcija za dohvat RSS feed-a putem cURL-a.
 * Postavlja User-Agent jer neki izvori odbijaju prazne zahtjeve.
 */
function fetchFeed($url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_USERAGENT      => 'CyberEdu News Aggregator/1.0',
        CURLOPT_SSL_VERIFYPEER => false, // Za lokalni XAMPP development
    ]);
    $body = curl_exec($ch);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($body === false) {
        return ['ok' => false, 'error' => $err];
    }
    return ['ok' => true, 'body' => $body];
}

/**
 * Funkcija koja "čisti" HTML iz opisa vijesti i skraćuje ga.
 * Uklanja sve tagove te višestruke razmake i nove redove.
 */
function cleanDescription($html, $maxLen = 280) {
    // Uklanjamo HTML tagove i dekodiramo entitete
    $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    // Normaliziramo whitespace u jedan razmak
    $text = preg_replace('/\s+/u', ' ', $text);
    $text = trim($text);

    if (mb_strlen($text) > $maxLen) {
        $text = mb_substr($text, 0, $maxLen) . '...';
    }
    return $text;
}

/**
 * Funkcija koja iz HTML/CDATA opisa pokušava izvući prvu sliku.
 * Vraća apsolutni URL slike ili null ako nije pronađena.
 */
function extractImage($item, $rawDescription) {
    // Prvo provjeravamo standardne RSS image elemente
    $namespaces = $item->getNameSpaces(true);

    if (isset($namespaces['media'])) {
        $media = $item->children($namespaces['media']);
        if (isset($media->content)) {
            $attrs = $media->content->attributes();
            if (isset($attrs['url'])) {
                return (string)$attrs['url'];
            }
        }
        if (isset($media->thumbnail)) {
            $attrs = $media->thumbnail->attributes();
            if (isset($attrs['url'])) {
                return (string)$attrs['url'];
            }
        }
    }

    if (isset($namespaces['content'])) {
        $contentNs = $item->children($namespaces['content']);
        if (isset($contentNs->encoded)) {
            $encoded = (string)$contentNs->encoded;
            if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $encoded, $m)) {
                return $m[1];
            }
        }
    }

    // Provjera enclosure elementa (BleepingComputer ga često koristi)
    if (isset($item->enclosure)) {
        $attrs = $item->enclosure->attributes();
        if (isset($attrs['url']) && isset($attrs['type']) && strpos((string)$attrs['type'], 'image') === 0) {
            return (string)$attrs['url'];
        }
    }

    // Kao posljednji pokušaj parsiramo HTML iz description-a
    if ($rawDescription && preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $rawDescription, $m)) {
        return $m[1];
    }

    return null;
}

// =====================================================================
// Glavna logika: provjeri cache, ako nije svjež dohvati sve feed-ove
// =====================================================================
$cached = readCache($CACHE_FILE, $CACHE_TTL);
if ($cached !== null && !isset($_GET['refresh'])) {
    echo $cached;
    exit();
}

$allArticles = [];
$errors      = [];

foreach ($FEEDS as $feed) {
    $result = fetchFeed($feed['url']);

    if (!$result['ok']) {
        $errors[] = [
            'source' => $feed['source'],
            'error'  => $result['error']
        ];
        continue;
    }

    // Učitavamo XML uz suzbijanje warning-a (libxml_use_internal_errors)
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($result['body']);
    if ($xml === false) {
        $errors[] = [
            'source' => $feed['source'],
            'error'  => 'Failed to parse XML'
        ];
        continue;
    }

    // Iteriramo kroz <item> elemente unutar <channel>
    $items = $xml->channel->item ?? $xml->item ?? [];

    foreach ($items as $item) {
        $title       = (string)$item->title;
        $link        = (string)$item->link;
        $pubDate     = (string)$item->pubDate;
        $descRaw     = (string)$item->description;
        $description = cleanDescription($descRaw);
        $image       = extractImage($item, $descRaw);

        // Standardiziramo datum u ISO 8601 format radi sortiranja
        $timestamp = $pubDate ? strtotime($pubDate) : time();

        $allArticles[] = [
            'title'        => $title,
            'link'         => $link,
            'description'  => $description,
            'image'        => $image,
            'published_at' => date('c', $timestamp),
            'timestamp'    => $timestamp,
            'source'       => $feed['source'],
            'source_name'  => $feed['name']
        ];
    }
}

// Sortiramo sve članke od najnovijeg prema najstarijem
usort($allArticles, function ($a, $b) {
    return $b['timestamp'] - $a['timestamp'];
});

// Limitiramo na razuman broj rezultata kako frontend ne bi bio preopterećen
$allArticles = array_slice($allArticles, 0, 60);

$payload = json_encode([
    'success'   => true,
    'count'     => count($allArticles),
    'articles'  => $allArticles,
    'errors'    => $errors,
    'cached_at' => date('c')
]);

// Spremamo u cache i šaljemo odgovor klijentu
writeCache($CACHE_FILE, $payload);
echo $payload;
?>
