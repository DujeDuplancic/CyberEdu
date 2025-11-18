<?php
function up() {
    return "
        CREATE TABLE categories (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            icon_name VARCHAR(50)
        );
    ";
}

function down() {
    return "DROP TABLE IF EXISTS categories;";
}
?>