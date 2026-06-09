<?php
/**
 * TEMPLATE za secrets.php - kopiraj ovaj file kao "secrets.php" i upiši svoje
 * ključeve. Pravi secrets.php je u .gitignore-u i NIKAD ne smije završiti u gitu.
 *
 *   cp Backend/config/secrets.example.php Backend/config/secrets.php
 *
 * Sve funkcije koje trebaju tajne podatke (npr. ai_assistant.php) include-aju
 * ovaj file i čitaju vrijednosti odavde.
 */

return [
    // Groq API ključ - https://console.groq.com/keys
    // Free tier: 14 400 req/dan, ~30 req/min, Llama 3.3 70B model.
    // Trenutno aktivan AI provider za SentinelAI asistenta.
    'GROQ_API_KEY' => 'YOUR_GROQ_API_KEY_HERE',

    // Google AI Studio: https://aistudio.google.com/app/apikey
    // Stari Gemini ključ - više se ne koristi po defaultu, ostavi prazno
    // ili upiši ako se vratiš na Gemini.
    'GEMINI_API_KEY' => 'YOUR_GEMINI_API_KEY_HERE',
];
