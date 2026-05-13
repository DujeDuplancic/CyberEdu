<?php
    // Konvertira chat_messages tablicu u utf8mb4 kako bi mogla pohraniti emojije
    // (4-bajtne UTF-8 znakove). Postojeće poruke koje su već spremljene kao
    // "????" ostat će takve - samo nove poruke će biti spremane korektno.
    return "
        ALTER TABLE chat_messages
            CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ";
?>
