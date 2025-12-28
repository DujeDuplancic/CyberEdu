<?php

    return "
        ALTER TABLE challenges 
        ADD COLUMN file_url VARCHAR(500) NULL AFTER flag;
    ";

?>