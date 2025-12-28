<?php

    return "
        CREATE TABLE solves (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT,
            challenge_id INT,
            solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (challenge_id) REFERENCES challenges(id),
            UNIQUE KEY unique_solve (user_id, challenge_id)
        );
    ";


?>