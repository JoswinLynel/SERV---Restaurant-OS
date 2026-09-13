-- SERVÉ Demo Seed Data

-- 1. Organization
INSERT INTO organizations (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Aurelia Dining Group');

-- 2. Restaurant
INSERT INTO restaurants (id, organization_id, name, slug, address, currency) 
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'AURELIA', 'aurelia', '100 Luxury Lane', 'USD');

-- 3. Tables
INSERT INTO tables (restaurant_id, table_number) VALUES
('11111111-1111-1111-1111-111111111111', '1'),
('11111111-1111-1111-1111-111111111111', '2'),
('11111111-1111-1111-1111-111111111111', '3'),
('11111111-1111-1111-1111-111111111111', '12');

-- 4. Menu
INSERT INTO menus (id, restaurant_id, name) 
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Main Menu');

-- 5. Categories
INSERT INTO categories (id, menu_id, name, display_order) VALUES 
('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222', 'Starters', 1),
('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', 'Mains', 2),
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Desserts', 3),
('33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222222', 'Drinks', 4);

-- 6. Menu Items
INSERT INTO menu_items (id, category_id, name, description, price, dietary_labels) VALUES
('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'Wagyu Beef Tartare', 'Hand-cut wagyu with capers and truffle oil.', 24.00, '{"Gluten-Free"}'),
('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333332', 'Pan-Seared Scallops', 'Diver scallops, cauliflower purée, pancetta.', 38.00, '{"Gluten-Free"}'),
('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 'Dark Chocolate Delice', '70% Valrhona chocolate, gold leaf, raspberry sorbet.', 16.00, '{"Vegetarian"}'),
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333334', 'Champagne Cocktail', 'Vintage champagne, cognac, bitters.', 22.00, '{}');

-- 7. Modifiers
INSERT INTO modifiers (id, menu_item_id, name, is_required) VALUES
('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444442', 'Cooking Preference', true);

INSERT INTO modifier_options (modifier_id, name, price_adjustment) VALUES
('55555555-5555-5555-5555-555555555551', 'Medium Rare', 0.00),
('55555555-5555-5555-5555-555555555551', 'Medium', 0.00);
