<?php
function up() {
    return "
        CREATE TABLE user_achievements (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT,
            achievement_id INT,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (achievement_id) REFERENCES achievements(id),
            UNIQUE KEY unique_user_achievement (user_id, achievement_id)
        );
    ";
}

function down() {
    return "DROP TABLE IF EXISTS user_achievements;";
}
?>