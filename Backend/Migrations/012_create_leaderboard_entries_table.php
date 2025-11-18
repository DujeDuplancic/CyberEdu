<?php
function up() {
    return "
        CREATE TABLE leaderboard_entries (
            id INT PRIMARY KEY AUTO_INCREMENT,
            snapshot_id INT,
            user_id INT,
            rank INT NOT NULL,
            points INT NOT NULL,
            solves_count INT NOT NULL,
            FOREIGN KEY (snapshot_id) REFERENCES leaderboard_snapshots(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE KEY unique_snapshot_user (snapshot_id, user_id)
        );
    ";
}

function down() {
    return "DROP TABLE IF EXISTS leaderboard_entries;";
}
?>