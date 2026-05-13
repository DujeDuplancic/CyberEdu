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
    // Google AI Studio: https://aistudio.google.com/app/apikey
    // Generiraj NOVI ključ ako je stari leak-an na public repo.
    'GEMINI_API_KEY' => 'YOUR_GEMINI_API_KEY_HERE',

    // Ovdje dodaj sve buduće tajne (Stripe, SMTP, ...)
    // 'SMTP_PASSWORD' => '...',
];
