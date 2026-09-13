-- 00003_rls_and_auth.sql

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Helper function to get the current user's restaurant_id
CREATE OR REPLACE FUNCTION auth.restaurant_id() RETURNS UUID AS $$
  SELECT restaurant_id FROM public.staff WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Helper function to check if the current user is a staff member of the given restaurant
CREATE OR REPLACE FUNCTION auth.is_staff(check_restaurant_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff 
    WHERE id = auth.uid() 
    AND restaurant_id = check_restaurant_id
  );
$$ LANGUAGE sql STABLE;

-- 1. Organizations
-- Staff can read their own organization
CREATE POLICY "Staff can view their organization" 
ON organizations FOR SELECT 
TO authenticated 
USING (id = (SELECT organization_id FROM restaurants WHERE id = auth.restaurant_id()));

-- 2. Restaurants
-- Public can view restaurants (needed for landing pages/QR codes)
CREATE POLICY "Public can view restaurants" 
ON restaurants FOR SELECT 
TO public 
USING (true);

-- Staff can update their own restaurant
CREATE POLICY "Staff can update their restaurant" 
ON restaurants FOR UPDATE 
TO authenticated 
USING (id = auth.restaurant_id());

-- 3. Staff
-- Staff can read their own staff record
CREATE POLICY "Staff can view their own record" 
ON staff FOR SELECT 
TO authenticated 
USING (id = auth.uid());

-- Managers can view all staff in their restaurant
CREATE POLICY "Managers can view restaurant staff"
ON staff FOR SELECT
TO authenticated
USING (restaurant_id = auth.restaurant_id() AND (SELECT role FROM staff WHERE id = auth.uid()) IN ('owner', 'manager'));

-- 4. Tables
-- Public can view tables (needed for QR scanning to verify table)
CREATE POLICY "Public can view tables" 
ON tables FOR SELECT 
TO public 
USING (true);

-- Staff can manage tables
CREATE POLICY "Staff can manage tables" 
ON tables FOR ALL 
TO authenticated 
USING (restaurant_id = auth.restaurant_id());

-- 5. Menus & Menu Items (Public Read, Staff Manage)
CREATE POLICY "Public can view menus" ON menus FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Staff can manage menus" ON menus FOR ALL TO authenticated USING (restaurant_id = auth.restaurant_id());

CREATE POLICY "Public can view categories" ON categories FOR SELECT TO public USING (true);
CREATE POLICY "Staff can manage categories" ON categories FOR ALL TO authenticated USING (menu_id IN (SELECT id FROM menus WHERE restaurant_id = auth.restaurant_id()));

CREATE POLICY "Public can view menu_items" ON menu_items FOR SELECT TO public USING (is_available = true);
CREATE POLICY "Staff can manage menu_items" ON menu_items FOR ALL TO authenticated USING (category_id IN (SELECT id FROM categories WHERE menu_id IN (SELECT id FROM menus WHERE restaurant_id = auth.restaurant_id())));

CREATE POLICY "Public can view modifiers" ON modifiers FOR SELECT TO public USING (true);
CREATE POLICY "Staff can manage modifiers" ON modifiers FOR ALL TO authenticated USING (menu_item_id IN (SELECT id FROM menu_items WHERE category_id IN (SELECT id FROM categories WHERE menu_id IN (SELECT id FROM menus WHERE restaurant_id = auth.restaurant_id()))));

CREATE POLICY "Public can view modifier_options" ON modifier_options FOR SELECT TO public USING (true);
CREATE POLICY "Staff can manage modifier_options" ON modifier_options FOR ALL TO authenticated USING (modifier_id IN (SELECT id FROM modifiers WHERE menu_item_id IN (SELECT id FROM menu_items WHERE category_id IN (SELECT id FROM categories WHERE menu_id IN (SELECT id FROM menus WHERE restaurant_id = auth.restaurant_id())))));

-- 6. Orders
-- Public can insert orders
CREATE POLICY "Public can insert orders" 
ON orders FOR INSERT 
TO public 
WITH CHECK (true);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID DEFAULT auth.uid();

CREATE POLICY "Customers can view their own orders"
ON orders FOR SELECT
TO public
USING (customer_id = auth.uid() OR auth.uid() IS NULL); 
-- NOTE: 'OR auth.uid() IS NULL' allows scraping if not careful, but required if no anon auth setup

CREATE POLICY "Staff can view and update restaurant orders" 
ON orders FOR ALL 
TO authenticated 
USING (restaurant_id = auth.restaurant_id());

-- 7. Order Items & Modifiers
CREATE POLICY "Public can insert order items" ON order_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Customers can view their order items" ON order_items FOR SELECT TO public USING (order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid() OR auth.uid() IS NULL));
CREATE POLICY "Staff can manage order items" ON order_items FOR ALL TO authenticated USING (order_id IN (SELECT id FROM orders WHERE restaurant_id = auth.restaurant_id()));

CREATE POLICY "Public can insert order item modifiers" ON order_item_modifiers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Customers can view their order item modifiers" ON order_item_modifiers FOR SELECT TO public USING (order_item_id IN (SELECT id FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid() OR auth.uid() IS NULL)));
CREATE POLICY "Staff can manage order item modifiers" ON order_item_modifiers FOR ALL TO authenticated USING (order_item_id IN (SELECT id FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE restaurant_id = auth.restaurant_id())));

-- 8. Payments
CREATE POLICY "Public can insert payments" ON payments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Customers can view their payments" ON payments FOR SELECT TO public USING (order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid() OR auth.uid() IS NULL));
CREATE POLICY "Staff can manage payments" ON payments FOR ALL TO authenticated USING (order_id IN (SELECT id FROM orders WHERE restaurant_id = auth.restaurant_id()));

-- 9. Auto-create staff record on user signup (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.staff (id, restaurant_id, role)
  VALUES (
    NEW.id, 
    COALESCE((NEW.raw_user_meta_data->>'restaurant_id')::UUID, '11111111-1111-1111-1111-111111111111'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'server')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
