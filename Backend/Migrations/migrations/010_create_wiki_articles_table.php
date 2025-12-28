<?php
    return "
        CREATE TABLE wiki_articles (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            category_id INT,
            author_id INT,
            slug VARCHAR(255) NOT NULL UNIQUE,
            is_published BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (author_id) REFERENCES users(id)
        );
    ";
?>