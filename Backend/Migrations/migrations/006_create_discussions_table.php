<?php
    return "
        CREATE TABLE discussions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            author_id INT,
            category VARCHAR(50),
            is_pinned BOOLEAN DEFAULT FALSE,
            views INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users(id)
        );
    ";

?>