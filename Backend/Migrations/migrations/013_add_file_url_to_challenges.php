<?php
function up() {
    return "
        ALTER TABLE challenges 
        ADD COLUMN file_url VARCHAR(500) NULL AFTER flag;
    ";
}

function down() {
    return "
        ALTER TABLE challenges 
        DROP COLUMN file_url;
    ";
}
?>