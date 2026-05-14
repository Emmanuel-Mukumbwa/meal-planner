use pantry_pilot;
-- =====================================================
-- MALAWI MEAL PLANNER – FULL RECIPE DATA
-- Based on: cereal, margarine, salt, sugar, eggs, smoothie,
-- noodles, soya pieces, tomatoes, irish potatoes, cooking oil,
-- rice, first choice milk, plus maize flour (staple).
-- =====================================================

-- -----------------------------------------------------
-- 1. Clear existing data
-- -----------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE recipe_steps;
TRUNCATE TABLE recipe_ingredients;
TRUNCATE TABLE recipes;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------
-- 2. Insert recipes
-- -----------------------------------------------------
INSERT INTO recipes (id, name, description) VALUES
(UUID(), 'Breakfast Cereal with Milk', 'Quick cereal with fresh milk – classic start to the day.'),
(UUID(), 'Scrambled Eggs with Tomatoes', 'Simple, protein-rich breakfast using eggs and tomatoes.'),
(UUID(), 'Cereal with Smoothie', 'Cereal served with a glass of smoothie for extra energy.'),
(UUID(), 'Fried Eggs with Rice', 'Fried eggs served over steamed rice – filling lunch or dinner.'),
(UUID(), 'Nsima with Soya and Tomato Relish', 'The national dish – nsima with savoury soya relish.'),
(UUID(), 'Irish Potato Fried Rice', 'Fried rice made with leftover rice, potatoes, and eggs.'),
(UUID(), 'Soya Pieces Stew with Rice', 'Rich soya stew cooked with tomatoes, served over rice.'),
(UUID(), 'Irish Potato and Egg Stew', 'Hearty stew with potatoes and eggs, perfect with nsima or rice.'),
(UUID(), 'Noodles with Egg and Tomato', 'Instant noodles fried with egg and fresh tomato – quick meal.'),
(UUID(), 'Maize Porridge (Phala)', 'Warm, comforting maize porridge, sweetened with sugar.'),
(UUID(), 'Tomato and Egg Sauce with Rice', 'Tangy tomato and egg sauce, great over rice.'),
(UUID(), 'Soya and Potato Curry', 'Mild curry with soya pieces and potatoes, served with rice or nsima.');

-- Capture recipe IDs by name
SET @rec_cereal_milk      = (SELECT id FROM recipes WHERE name = 'Breakfast Cereal with Milk' LIMIT 1);
SET @rec_scrambled_eggs   = (SELECT id FROM recipes WHERE name = 'Scrambled Eggs with Tomatoes' LIMIT 1);
SET @rec_cereal_smoothie  = (SELECT id FROM recipes WHERE name = 'Cereal with Smoothie' LIMIT 1);
SET @rec_fried_eggs_rice  = (SELECT id FROM recipes WHERE name = 'Fried Eggs with Rice' LIMIT 1);
SET @rec_nsima_soya       = (SELECT id FROM recipes WHERE name = 'Nsima with Soya and Tomato Relish' LIMIT 1);
SET @rec_potato_fried_rice= (SELECT id FROM recipes WHERE name = 'Irish Potato Fried Rice' LIMIT 1);
SET @rec_soya_stew        = (SELECT id FROM recipes WHERE name = 'Soya Pieces Stew with Rice' LIMIT 1);
SET @rec_potato_egg_stew  = (SELECT id FROM recipes WHERE name = 'Irish Potato and Egg Stew' LIMIT 1);
SET @rec_noodles_egg      = (SELECT id FROM recipes WHERE name = 'Noodles with Egg and Tomato' LIMIT 1);
SET @rec_maize_porridge   = (SELECT id FROM recipes WHERE name = 'Maize Porridge (Phala)' LIMIT 1);
SET @rec_tomato_egg_sauce = (SELECT id FROM recipes WHERE name = 'Tomato and Egg Sauce with Rice' LIMIT 1);
SET @rec_soya_curry       = (SELECT id FROM recipes WHERE name = 'Soya and Potato Curry' LIMIT 1);

-- -----------------------------------------------------
-- 3. Insert ingredients
-- -----------------------------------------------------

-- Breakfast Cereal with Milk
INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES
(UUID(), @rec_cereal_milk, 'cereal', 50.00, 'g'),
(UUID(), @rec_cereal_milk, 'first choice milk', 1.00, 'packet'),
(UUID(), @rec_cereal_milk, 'sugar', 10.00, 'g');

-- Scrambled Eggs with Tomatoes
INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES
(UUID(), @rec_scrambled_eggs, 'eggs', 3.00, 'pieces'),
(UUID(), @rec_scrambled_eggs, 'tomatoe', 2.00, 'pieces'),
(UUID(), @rec_scrambled_eggs, 'cooking oil', 0.02, 'litres'),
(UUID(), @rec_scrambled_eggs, 'salt', 1.00, 'g');

-- Cereal with Smoothie
INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES
(UUID(), @rec_cereal_smoothie, 'cereal', 40.00, 'g'),
(UUID(), @rec_cereal_smoothie, 'smothie', 0.25, 'litres'),
(UUID(), @rec_cereal_smoothie, 'sugar', 5.00, 'g');

-- Fried Eggs with Rice
INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES
(UUID(), @rec_fried_eggs_rice, 'eggs', 2.00, 'pieces'),
(UUID(), @rec_fried_eggs_rice, 'cooking oil', 0.01, 'litres'),
(UUID(), @rec_fried_eggs_rice, 'salt', 1.00, 'g'),
(UUID(), @rec_fried_eggs_rice, 'rice', 0.25, 'kg');

-- Nsima with Soya and Tomato Relish (requires maize flour)
INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES
(UUID(), @rec_nsima_soya, 'maize flour', 0.50, 'kg'),
(UUID(), @rec_nsima_soya, 'soya pieces', 1.00, 'packet'),
(UUID(), @rec_nsima_soya, 'tomatoe', 3.00, 'pieces'),
(UUID(), @rec_nsima_soya, 'cooking oil', 0.03, 'litres'),
(UUID(), @rec_nsima_soya, 'salt', 2.00, 'g');

-- Irish Potato Fried Rice
INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES
(UUID(), @rec_potato_fried_rice, 'rice', 0.30, 'kg'),
(UUID(), @rec_potato_fried_rice, 'irish potatoe', 0.20, 'kg'),
(UUID(), @rec_potato_fried_rice, 'eggs', 2.00, 'pieces'),
(UUID(), @rec_potato_fried_rice, 'cooking oil', 0.03, 'litres'),
(UUID(), @rec_potato_fried_rice, 'salt', 1.00, 'g');

-- Soya Pieces Stew with Rice
INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES
(UUID(), @rec_soya_stew, 'soya pieces', 1.00, 'packet'),
(UUID(), @rec_soya_stew, 'tomatoe', 4.00, 'pieces'),
(UUID(), @rec_soya_stew, 'cooking oil', 0.05, 'litres'),
(UUID(), @rec_soya_stew, 'salt', 2.00, 'g'),
(UUID(), @rec_soya_stew, 'sugar', 5.00, 'g'),
(UUID(), @rec_soya_stew, 'rice', 0.30, 'kg');

-- Irish Potato and Egg Stew
INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES
(UUID(), @rec_potato_egg_stew, 'irish potatoe', 0.50, 'kg'),
(UUID(), @rec_potato_egg_stew, 'eggs', 2.00, 'pieces'),
(UUID(), @rec_potato_egg_stew, 'tomatoe', 3.00, 'pieces'),
(UUID(), @rec_potato_egg_stew, 'cooking oil', 0.04, 'litres'),
(UUID(), @rec_potato_egg_stew, 'salt', 2.00, 'g'),
(UUID(), @rec_potato_egg_stew, 'rice', 0.25, 'kg');

-- Noodles with Egg and Tomato
INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES
(UUID(), @rec_noodles_egg, 'noodles', 1.00, 'packets'),
(UUID(), @rec_noodles_egg, 'eggs', 1.00, 'pieces'),
(UUID(), @rec_noodles_egg, 'tomatoe', 1.00, 'pieces'),
(UUID(), @rec_noodles_egg, 'cooking oil', 0.01, 'litres');

-- Maize Porridge (Phala)
INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES
(UUID(), @rec_maize_porridge, 'maize flour', 0.20, 'kg'),
(UUID(), @rec_maize_porridge, 'sugar', 15.00, 'g'),
(UUID(), @rec_maize_porridge, 'first choice milk', 0.50, 'packet');

-- Tomato and Egg Sauce with Rice
INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES
(UUID(), @rec_tomato_egg_sauce, 'tomatoe', 5.00, 'pieces'),
(UUID(), @rec_tomato_egg_sauce, 'eggs', 2.00, 'pieces'),
(UUID(), @rec_tomato_egg_sauce, 'cooking oil', 0.02, 'litres'),
(UUID(), @rec_tomato_egg_sauce, 'salt', 1.00, 'g'),
(UUID(), @rec_tomato_egg_sauce, 'rice', 0.25, 'kg');

-- Soya and Potato Curry
INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit) VALUES
(UUID(), @rec_soya_curry, 'soya pieces', 1.00, 'packet'),
(UUID(), @rec_soya_curry, 'irish potatoe', 0.30, 'kg'),
(UUID(), @rec_soya_curry, 'tomatoe', 2.00, 'pieces'),
(UUID(), @rec_soya_curry, 'cooking oil', 0.04, 'litres'),
(UUID(), @rec_soya_curry, 'salt', 2.00, 'g'),
(UUID(), @rec_soya_curry, 'sugar', 5.00, 'g');

-- -----------------------------------------------------
-- 4. Insert recipe steps
-- -----------------------------------------------------

-- Breakfast Cereal with Milk
INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES
(UUID(), @rec_cereal_milk, 1, 'Pour cereal into a bowl.'),
(UUID(), @rec_cereal_milk, 2, 'Add milk (warm or cold) and sugar to taste.'),
(UUID(), @rec_cereal_milk, 3, 'Stir and enjoy immediately.');

-- Scrambled Eggs with Tomatoes
INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES
(UUID(), @rec_scrambled_eggs, 1, 'Chop tomatoes.'),
(UUID(), @rec_scrambled_eggs, 2, 'Heat oil in a pan, add tomatoes and fry for 1 minute.'),
(UUID(), @rec_scrambled_eggs, 3, 'Break eggs into pan, add salt, scramble until cooked.'),
(UUID(), @rec_scrambled_eggs, 4, 'Serve warm.');

-- Cereal with Smoothie
INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES
(UUID(), @rec_cereal_smoothie, 1, 'Pour cereal into a bowl.'),
(UUID(), @rec_cereal_smoothie, 2, 'Add smoothie and sugar (optional). Stir and enjoy.');

-- Fried Eggs with Rice
INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES
(UUID(), @rec_fried_eggs_rice, 1, 'Cook rice according to package directions.'),
(UUID(), @rec_fried_eggs_rice, 2, 'Fry eggs sunny side up (or as preferred) with a little oil and salt.'),
(UUID(), @rec_fried_eggs_rice, 3, 'Place cooked rice on a plate, top with fried eggs. Serve hot.');

-- Nsima with Soya and Tomato Relish
INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES
(UUID(), @rec_nsima_soya, 1, 'Bring water to boil. Slowly add maize flour while stirring continuously to avoid lumps.'),
(UUID(), @rec_nsima_soya, 2, 'Cover and cook for 5 minutes, then stir again. Form into balls or serve as a thick porridge.'),
(UUID(), @rec_nsima_soya, 3, 'For relish: soak soya pieces for 10 minutes, drain. Fry with chopped tomatoes, salt, and oil for 10 minutes.'),
(UUID(), @rec_nsima_soya, 4, 'Serve nsima with the soya relish.');

-- Irish Potato Fried Rice
INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES
(UUID(), @rec_potato_fried_rice, 1, 'Boil rice until done, set aside.'),
(UUID(), @rec_potato_fried_rice, 2, 'Dice potatoes and fry until golden. Push to one side, scramble eggs in same pan.'),
(UUID(), @rec_potato_fried_rice, 3, 'Add cooked rice and salt, mix well. Fry for 2–3 minutes. Serve hot.');

-- Soya Pieces Stew with Rice
INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES
(UUID(), @rec_soya_stew, 1, 'Soak soya pieces, then drain. Chop tomatoes.'),
(UUID(), @rec_soya_stew, 2, 'Heat oil, add tomatoes, salt, sugar, and cook until soft.'),
(UUID(), @rec_soya_stew, 3, 'Add soya pieces and 1 cup of water. Simmer for 15 minutes.'),
(UUID(), @rec_soya_stew, 4, 'Meanwhile, cook rice. Serve stew over rice.');

-- Irish Potato and Egg Stew
INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES
(UUID(), @rec_potato_egg_stew, 1, 'Peel and dice potatoes. Chop tomatoes.'),
(UUID(), @rec_potato_egg_stew, 2, 'Heat oil, fry tomatoes with salt for 2 minutes.'),
(UUID(), @rec_potato_egg_stew, 3, 'Add potatoes and water, cook until tender (about 15 minutes).'),
(UUID(), @rec_potato_egg_stew, 4, 'Crack eggs directly into the stew, stir gently, cook 5 more minutes.'),
(UUID(), @rec_potato_egg_stew, 5, 'Serve with rice or nsima.');

-- Noodles with Egg and Tomato
INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES
(UUID(), @rec_noodles_egg, 1, 'Boil noodles as per packet instructions, drain.'),
(UUID(), @rec_noodles_egg, 2, 'In a pan, heat oil, chop tomato and fry briefly.'),
(UUID(), @rec_noodles_egg, 3, 'Push tomato aside, scramble egg in same pan.'),
(UUID(), @rec_noodles_egg, 4, 'Add drained noodles, mix, and heat for 1 minute. Serve.');

-- Maize Porridge (Phala)
INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES
(UUID(), @rec_maize_porridge, 1, 'Mix maize flour with a little cold water to form a smooth paste.'),
(UUID(), @rec_maize_porridge, 2, 'Bring 2 cups of water to boil, slowly add the paste while stirring.'),
(UUID(), @rec_maize_porridge, 3, 'Simmer for 10 minutes, stirring often. Add milk and sugar to taste.');

-- Tomato and Egg Sauce with Rice
INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES
(UUID(), @rec_tomato_egg_sauce, 1, 'Cook rice separately.'),
(UUID(), @rec_tomato_egg_sauce, 2, 'Chop tomatoes. Fry in oil with salt until soft.'),
(UUID(), @rec_tomato_egg_sauce, 3, 'Crack eggs into the tomatoes, stir quickly to scramble and form a saucy mixture.'),
(UUID(), @rec_tomato_egg_sauce, 4, 'Pour over cooked rice. Serve hot.');

-- Soya and Potato Curry
INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES
(UUID(), @rec_soya_curry, 1, 'Soak soya pieces, drain. Dice potatoes and parboil.'),
(UUID(), @rec_soya_curry, 2, 'Fry tomatoes with oil, sugar, and salt until soft.'),
(UUID(), @rec_soya_curry, 3, 'Add soya, potatoes, and 1 cup water. Simmer 15 minutes.'),
(UUID(), @rec_soya_curry, 4, 'Serve with rice or nsima.');