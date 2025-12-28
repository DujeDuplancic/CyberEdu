<?php
    return "
        CREATE TABLE leaderboard_snapshots (
            id INT PRIMARY KEY AUTO_INCREMENT,
            snapshot_date DATE NOT NULL,
            total_users INT NOT NULL,
            total_solves INT NOT NULL,
            total_points INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ";
?>