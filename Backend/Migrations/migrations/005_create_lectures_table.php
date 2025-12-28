<?php
    return "
        CREATE TABLE lectures (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category_id INT,
            instructor VARCHAR(100),
            duration_minutes INT,
            level ENUM('Beginner', 'Intermediate', 'Advanced'),
            video_url VARCHAR(255),
            thumbnail_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );
    ";

?>