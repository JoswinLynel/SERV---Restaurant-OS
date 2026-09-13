-- 00004_madras_table_seed.sql

-- 1. Create Demo Organization
INSERT INTO organizations (id, name) 
VALUES ('10000000-0000-0000-0000-000000000002', 'Madras Table Group');

-- 2. Create Restaurant
INSERT INTO restaurants (id, organization_id, name, slug, address, currency)
VALUES ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Madras Table', 'madras-table', '101 Spice Route', 'GBP');

-- 3. Create Tables
INSERT INTO tables (id, restaurant_id, table_number) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '1'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '2'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '3'),
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', '4'),
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', '5'),
('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', '6');

-- 4. Create Menu
INSERT INTO menus (id, restaurant_id, name, is_active)
VALUES ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Main Menu', true);

-- 5. Create Categories
INSERT INTO categories (id, menu_id, name, display_order) VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Starters', 1),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'Dosa', 2),
('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'Chicken', 3),
('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 'Mutton & Lamb', 4),
('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', 'Seafood', 5),
('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000002', 'Biryani', 6),
('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000002', 'Rice & Breads', 7),
('50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000002', 'Sides', 8),
('50000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000002', 'Desserts', 9),
('50000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000002', 'Drinks', 10);

-- 6. Create Menu Items
-- STARTERS
INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, image_url) VALUES
('50000000-0000-0000-0000-000000000001', 'Chicken 65', 'Crispy, spiced chicken bites marinated with South Indian spices, curry leaves and fresh ginger.', 8.95, true, 1, '/images/chicken_65.png'),
('50000000-0000-0000-0000-000000000001', 'Mutton Sukka', 'Tender pieces of mutton slow-cooked with roasted coconut, black pepper, fennel and aromatic South Indian spices.', 10.95, true, 2, '/images/mutton_sukka.png'),
('50000000-0000-0000-0000-000000000001', 'Chicken Pepper Fry', 'Succulent chicken tossed with cracked black pepper, onions, curry leaves and freshly ground spices.', 9.95, true, 3, '/images/chicken_pepper_fry.png'),
('50000000-0000-0000-0000-000000000001', 'Nethili Fry', 'Crispy fried anchovies marinated with chilli, turmeric and South Indian spices.', 8.95, true, 4, '/images/nethili_fry.png'),
('50000000-0000-0000-0000-000000000001', 'Madras Chicken Wings', 'Juicy chicken wings coated in a fiery Madras-style masala with curry leaves and roasted spices.', 9.50, true, 5, '/images/madras_chicken_wings.png');

-- DOSA
INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, image_url) VALUES
('50000000-0000-0000-0000-000000000002', 'Masala Dosa', 'A crisp golden dosa filled with spiced potato masala, served with sambar and coconut chutney.', 8.95, true, 1, '/images/masala_dosa.png'),
('50000000-0000-0000-0000-000000000002', 'Chicken Masala Dosa', 'Crispy dosa filled with aromatic South Indian chicken masala, served with sambar and coconut chutney.', 11.95, true, 2, '/images/chicken_masala_dosa.png'),
('50000000-0000-0000-0000-000000000002', 'Mutton Keema Dosa', 'Thin crispy dosa filled with fragrant minced mutton cooked with onion, chilli and traditional spices.', 12.95, true, 3, '/images/mutton_keema_dosa.png'),
('50000000-0000-0000-0000-000000000002', 'Cheese Chilli Dosa', 'Crispy dosa filled with melted cheese, green chilli, onion and South Indian spices.', 9.95, true, 4, '/images/cheese_chilli_dosa.png'),
('50000000-0000-0000-0000-000000000002', 'Ghee Roast Dosa', 'Extra-crisp dosa roasted with aromatic ghee and served with sambar and fresh coconut chutney.', 8.50, true, 5, '/images/ghee_roast_dosa.jpg');

-- CHICKEN
INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, image_url) VALUES
('50000000-0000-0000-0000-000000000003', 'Chettinad Chicken', 'Tender chicken cooked in a rich Chettinad masala with roasted coconut, fennel, pepper and aromatic spices.', 13.95, true, 1, '/images/chettinad_chicken_curry.jpg'),
('50000000-0000-0000-0000-000000000003', 'Butter Chicken', 'Tandoori-style chicken simmered in a silky tomato and butter sauce with gentle spices.', 14.50, true, 2, '/images/butter_chicken.png'),
('50000000-0000-0000-0000-000000000003', 'Madras Chicken Curry', 'Chicken cooked in a bold South Indian curry with tomato, onion, chilli and fresh curry leaves.', 13.50, true, 3, '/images/madras_chicken_curry.jpg'),
('50000000-0000-0000-0000-000000000003', 'Karaikudi Chicken', 'A fiery regional chicken curry made with roasted spices, coconut and Karaikudi-style masala.', 14.25, true, 4, '/images/karaikudi_chicken.jpg'),
('50000000-0000-0000-0000-000000000003', 'Chicken Kothu Parotta', 'Flaky parotta chopped and tossed with chicken, egg, onion, chilli and aromatic spices.', 12.95, true, 5, NULL);

-- MUTTON & LAMB
INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, image_url) VALUES
('50000000-0000-0000-0000-000000000004', 'Mutton Chettinad', 'Slow-cooked tender mutton in a rich Chettinad gravy with roasted coconut, pepper and fragrant spices.', 15.95, true, 1, '/images/mutton_chettinad.jpg'),
('50000000-0000-0000-0000-000000000004', 'Mutton Pepper Masala', 'Tender mutton cooked with cracked black pepper, onion, curry leaves and South Indian spices.', 15.50, true, 2, '/images/mutton_pepper_masala.jpg'),
('50000000-0000-0000-0000-000000000004', 'Mutton Kothu Parotta', 'Chopped flaky parotta tossed with tender mutton, egg, onion, chilli and aromatic masala.', 13.95, true, 3, NULL),
('50000000-0000-0000-0000-000000000004', 'Lamb Madras', 'Tender lamb simmered in a rich Madras curry with tomato, chilli, onion and traditional spices.', 15.50, true, 4, '/images/lamb_madras.jpg');

-- SEAFOOD
INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, image_url) VALUES
('50000000-0000-0000-0000-000000000005', 'Kerala Fish Curry', 'Fresh fish simmered in a tangy Kerala-style coconut and tamarind curry with curry leaves.', 14.95, true, 1, '/images/kerala_fish_curry.png'),
('50000000-0000-0000-0000-000000000005', 'Chilli Garlic Prawns', 'King prawns tossed with garlic, chilli, curry leaves and a fragrant South Indian spice blend.', 15.95, true, 2, '/images/chilli_garlic_prawns.png'),
('50000000-0000-0000-0000-000000000005', 'Malabar Fish Fry', 'Fish fillet marinated with turmeric, chilli and coastal spices, then shallow-fried until crisp.', 13.95, true, 3, '/images/malabar_fish_fry.png'),
('50000000-0000-0000-0000-000000000005', 'Prawn Masala', 'Succulent prawns cooked with onion, tomato, green chilli and aromatic South Indian masala.', 15.50, true, 4, '/images/prawn_masala.png');

-- BIRYANI
INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, image_url) VALUES
('50000000-0000-0000-0000-000000000006', 'Chicken Biryani', 'Fragrant basmati rice layered with spiced chicken, saffron, fried onions, mint and aromatic spices.', 13.95, true, 1, '/images/chicken_biryani.png'),
('50000000-0000-0000-0000-000000000006', 'Mutton Biryani', 'Slow-cooked mutton layered with fragrant basmati rice, saffron, mint and traditional biryani spices.', 15.95, true, 2, NULL),
('50000000-0000-0000-0000-000000000006', 'Prawn Biryani', 'Aromatic basmati rice cooked with succulent prawns, saffron, herbs and coastal South Indian spices.', 16.50, true, 3, NULL),
('50000000-0000-0000-0000-000000000006', 'Egg Biryani', 'Fragrant basmati rice layered with spiced boiled eggs, caramelised onions, mint and aromatic spices.', 11.95, true, 4, NULL);

-- RICE & BREADS
INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, image_url) VALUES
('50000000-0000-0000-0000-000000000007', 'Plain Rice', 'Steamed basmati rice.', 3.50, true, 1, NULL),
('50000000-0000-0000-0000-000000000007', 'Jeera Rice', 'Basmati rice tempered with cumin and fragrant whole spices.', 4.25, true, 2, NULL),
('50000000-0000-0000-0000-000000000007', 'Garlic Naan', 'Soft naan finished with garlic, butter and fresh coriander.', 4.25, true, 3, NULL),
('50000000-0000-0000-0000-000000000007', 'Butter Naan', 'Soft tandoor-baked naan brushed with melted butter.', 3.95, true, 4, NULL),
('50000000-0000-0000-0000-000000000007', 'Parotta', 'Flaky, layered South Indian flatbread served warm.', 3.95, true, 5, NULL);

-- SIDES
INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, image_url) VALUES
('50000000-0000-0000-0000-000000000008', 'Sambar', 'Traditional South Indian lentil and vegetable stew with tamarind and aromatic spices.', 3.95, true, 1, NULL),
('50000000-0000-0000-0000-000000000008', 'Coconut Chutney', 'Fresh coconut chutney with green chilli, ginger and roasted lentils.', 2.50, true, 2, NULL),
('50000000-0000-0000-0000-000000000008', 'Onion Raita', 'Cooling yoghurt mixed with fresh onion, coriander and mild spices.', 3.25, true, 3, NULL);

-- DESSERTS
INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, image_url) VALUES
('50000000-0000-0000-0000-000000000009', 'Gulab Jamun', 'Warm milk dumplings soaked in fragrant cardamom and rose syrup.', 5.50, true, 1, NULL),
('50000000-0000-0000-0000-000000000009', 'Paal Payasam', 'Traditional South Indian rice pudding slowly simmered with milk, cardamom and nuts.', 5.95, true, 2, NULL),
('50000000-0000-0000-0000-000000000009', 'Mango Kulfi', 'Creamy Indian-style frozen dessert infused with ripe mango.', 6.25, true, 3, NULL);

-- DRINKS
INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, image_url) VALUES
('50000000-0000-0000-0000-000000000010', 'Mango Lassi', 'Creamy yoghurt drink blended with ripe mango.', 4.50, true, 1, '/images/mango_lassi.png'),
('50000000-0000-0000-0000-000000000010', 'Sweet Lassi', 'Chilled yoghurt drink lightly sweetened and finished with cardamom.', 4.25, true, 2, NULL),
('50000000-0000-0000-0000-000000000010', 'Masala Chai', 'Traditional Indian tea brewed with milk and aromatic spices.', 3.50, true, 3, NULL),
('50000000-0000-0000-0000-000000000010', 'South Indian Filter Coffee', 'Strong, aromatic filter coffee blended with hot milk and a touch of sweetness.', 3.95, true, 4, NULL);
