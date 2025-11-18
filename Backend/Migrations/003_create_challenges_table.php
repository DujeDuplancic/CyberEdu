<?php
function up() {
    return "
        CREATE TABLE challenges (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category_id INT,
            difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
            points INT NOT NULL,
            flag VARCHAR(255) NOT NULL,
            created_by INT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );
    ";
}

function down() {
    return "DROP TABLE IF EXISTS challenges;";
}
?>