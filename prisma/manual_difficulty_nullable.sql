-- Exécuter ce script sur votre base PostgreSQL (Supabase) pour permettre
-- de laisser le niveau (difficulty) non renseigné ("Not specified").
-- Ainsi la carte "Level" ne s'affichera plus sur la page quiz.

-- Rendre la colonne difficulty nullable et supprimer la valeur par défaut
ALTER TABLE quizzes ALTER COLUMN difficulty DROP DEFAULT;
ALTER TABLE quizzes ALTER COLUMN difficulty DROP NOT NULL;

-- Optionnel : mettre à NULL les quiz qui ont encore "Moyen" par défaut
-- (décommentez si vous voulez masquer Level pour tous les quiz existants)
-- UPDATE quizzes SET difficulty = NULL WHERE difficulty = 'Moyen';
