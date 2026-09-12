export interface Restaurant {
  id: string
  name: string
  owner_id: string
  logo_url?: string
  address?: string
  card_surcharge_pct?: number   // Default card surcharge %
  ph_surcharge_pct?: number     // Public holiday surcharge %
  ph_active?: boolean           // Whether PH surcharge is active
  created_at: string
}

export interface Category {
  id: string
  restaurant_id: string
  name: string
  sort_order: number
}

export interface MenuItem {
  id: string
  restaurant_id: string
  category_id?: string
  name: string
  description?: string
  price: number
  image_url?: string
  available: boolean
  sort_order: number
}

export interface Table {
  id: string
  restaurant_id: string
  table_number: string
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'split' | null
export type OrderType = 'dine_in' | 'takeaway' | 'delivery'

export interface Order {
  id: string
  restaurant_id: string
  table_id?: string
  table_number: string
  order_type?: OrderType       // Order type: dine-in, takeaway, delivery
  customer_name?: string       // Customer name for takeaway / delivery
  customer_phone?: string      // Customer phone number
  status: 'pending' | 'confirmed' | 'ready' | 'paid'
  total: number
  surcharge?: number
  surcharge_reason?: string
  grand_total?: number
  payment_method?: PaymentMethod
  cash_received?: number
  change_given?: number
  notes?: string
  paid_at?: string
  created_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  name: string
  price: number
  quantity: number
}
