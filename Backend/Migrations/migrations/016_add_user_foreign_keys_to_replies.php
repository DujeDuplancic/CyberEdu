<?php
return "
ALTER TABLE replies 
ADD FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
";
?>