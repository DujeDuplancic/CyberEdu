<?php
return "
ALTER TABLE discussions 
ADD FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
";
?>