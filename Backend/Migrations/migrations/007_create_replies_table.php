<?php
function up() {
    return "
        CREATE TABLE replies (
            id INT PRIMARY KEY AUTO_INCREMENT,
            discussion_id INT,
            author_id INT,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
            FOREIGN KEY (author_id) REFERENCES users(id)
        );
    ";
}

function down() {
    return "DROP TABLE IF EXISTS replies;";
}
?>