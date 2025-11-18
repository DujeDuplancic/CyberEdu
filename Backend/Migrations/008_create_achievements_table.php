<?php
function up() {
    return "
        CREATE TABLE achievements (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            icon_url VARCHAR(255),
            points_reward INT DEFAULT 0,
            criteria_type ENUM('solves_count', 'points_total', 'category_master', 'streak') NOT NULL,
            criteria_value INT,
            category_id INT,
            is_hidden BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );
    ";
}

function down() {
    return "DROP TABLE IF EXISTS achievements;";
}
?>