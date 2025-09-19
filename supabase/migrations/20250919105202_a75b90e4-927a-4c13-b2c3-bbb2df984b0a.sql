-- Update the current user to be admin as well
UPDATE profiles 
SET is_admin = true 
WHERE email = 'marketing@univertix.edu.br';