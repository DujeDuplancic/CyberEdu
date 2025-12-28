<?php
return "
    CREATE TABLE IF NOT EXISTS lectures (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INT,
        instructor VARCHAR(100),
        duration_minutes INT DEFAULT 0,
        level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
        video_url VARCHAR(500) NOT NULL,        
        embed_url VARCHAR(500) NOT NULL,         
        thumbnail_url VARCHAR(500),               
        views INT DEFAULT 0,
        is_published BOOLEAN DEFAULT TRUE,
        author_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );
";
?>