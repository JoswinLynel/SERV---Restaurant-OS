'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Restaurant, Order } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [todayPaid, setTodayPaid] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (!rest) { router.push('/auth/login'); return }
      setRestaurant(rest)

      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('restaurant_id', rest.id)
        .order('created_at', { ascending: false })
        .limit(10)
      setOrders(recentOrders || [])

      // Today's paid orders
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const { data: paidToday } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', rest.id)
        .eq('status', 'paid')
        .gte('paid_at', startOfDay.toISOString())
      setTodayPaid(paidToday || [])

      setLoading(false)
    }
    load()
  }, [router])

  // Calculate today's stats
  const stats = {
    count: todayPaid.length,
    cash: todayPaid.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + (o.grand_total || o.total), 0),
    card: todayPaid.filter(o => o.payment_method === 'card').reduce((sum, o) => sum + (o.grand_total || o.total), 0),
    transfer: todayPaid.filter(o => o.payment_method === 'transfer').reduce((sum, o) => sum + (o.grand_total || o.total), 0),
    total: todayPaid.reduce((sum, o) => sum + (o.grand_total || o.total), 0),
    surcharge: todayPaid.reduce((sum, o) => sum + (o.surcharge || 0), 0),
  }

  async function undoPayment(order: Order) {
    if (!confirm(`Undo payment for Table ${order.table_number} ($${(order.grand_total || order.total).toFixed(2)})? It will return to "confirmed" status.`)) return
    const { error } = await supabase.from('orders').update({
      status: 'confirmed',
      payment_method: null,
      cash_received: null,
      change_given: null,
      paid_at: null,
      grand_total: null,
      surcharge: null,
      surcharge_reason: null,
    }).eq('id', order.id)
    if (error) { toast.error(error.message); return }
    toast.success('Payment undone')
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'confirmed', payment_method: null } : o))
    setTodayPaid(prev => prev.filter(o => o.id !== order.id))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500">Loading...</div>

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-orange-600">SERVÉ</h1>
        <span className="text-gray-600 font-medium">{restaurant?.name}</span>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

        {/* Today's Sales */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-orange-100 text-sm">Today&apos;s Sales</div>
              <div className="text-4xl font-bold mt-1">${stats.total.toFixed(2)}</div>
              <div className="text-orange-100 text-sm mt-1">{stats.count} orders</div>
            </div>
            <div className="text-6xl opacity-30">💰</div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
              <div className="text-xs text-orange-100">💵 Cash</div>
              <div className="text-lg font-bold">${stats.cash.toFixed(2)}</div>
            </div>
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
              <div className="text-xs text-orange-100">💳 Card</div>
              <div className="text-lg font-bold">${stats.card.toFixed(2)}</div>
            </div>
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
              <div className="text-xs text-orange-100">📱 Transfer</div>
              <div className="text-lg font-bold">${stats.transfer.toFixed(2)}</div>
            </div>
          </div>

          {stats.surcharge > 0 && (
            <div className="text-xs text-orange-100 mt-3">
              Surcharge collected: ${stats.surcharge.toFixed(2)}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/dashboard/menu" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition text-center">
            <div className="text-3xl mb-2">🍽️</div>
            <div className="font-semibold text-gray-800">Menu</div>
            <div className="text-sm text-gray-400">Manage dishes & categories</div>
          </Link>
          <Link href="/dashboard/tables" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition text-center">
            <div className="text-3xl mb-2">🪑</div>
            <div className="font-semibold text-gray-800">Tables & QR</div>
            <div className="text-sm text-gray-400">Generate QR codes</div>
          </Link>
          <Link href="/dashboard/orders" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition text-center">
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold text-gray-800">Live Orders</div>
            <div className="text-sm text-gray-400">Accept orders & checkout</div>
          </Link>
        </div>

        <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Orders</h3>
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border">
            No orders yet. Share your QR codes to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 border flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">
                    {order.order_type === 'takeaway' ? `Takeaway ${order.table_number}` : `Table ${order.table_number}`}
                  </span>
                  <span className="ml-3 text-gray-400 text-sm">{new Date(order.created_at).toLocaleString()}</span>
                  {order.payment_method && (
                    <span className="ml-2 text-xs text-gray-500">
                      {order.payment_method === 'cash' ? '💵' : order.payment_method === 'card' ? '💳' : '📱'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-800">${(order.grand_total || order.total).toFixed(2)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'ready' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {order.status === 'pending' ? 'Pending' :
                     order.status === 'confirmed' ? 'Preparing' :
                     order.status === 'ready' ? 'Ready' : '✓ Paid'}
                  </span>
                  {order.status === 'paid' && (
                    <button onClick={() => undoPayment(order)}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition">
                      ↩ Undo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
