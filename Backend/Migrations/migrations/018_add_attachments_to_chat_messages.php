<?php
    // Dodaje kolone za privitke (datoteke i slike) u chat_messages tablicu.
    // Sve tri kolone su nullable jer poruke smiju i dalje biti samo tekstualne.
    return "
        ALTER TABLE chat_messages
            ADD COLUMN attachment_url  VARCHAR(500) NULL AFTER content,
            ADD COLUMN attachment_name VARCHAR(255) NULL AFTER attachment_url,
            ADD COLUMN attachment_type VARCHAR(50)  NULL AFTER attachment_name;
    ";
?>
