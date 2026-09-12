'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Order, Restaurant } from '@/lib/types'
import CheckoutModal from './CheckoutModal'
import NewTakeawayModal from './NewTakeawayModal'

// Sound notification
function createBeep() {
  return () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.4, ctx.currentTime + start)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
        osc.start(ctx.currentTime + start)
        osc.stop(ctx.currentTime + start + duration)
      }
      playTone(880, 0, 0.15)
      playTone(1100, 0.2, 0.15)
      playTone(880, 0.4, 0.2)
    } catch { /* ignore */ }
  }
}

export default function OrdersPage() {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [checkoutOrders, setCheckoutOrders] = useState<Order[] | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showNewTakeaway, setShowNewTakeaway] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [cardSurchargeInput, setCardSurchargeInput] = useState('1.5')
  const [phSurchargeInput, setPhSurchargeInput] = useState('10')

  const prevOrderIds = useRef<Set<string>>(new Set())
  const beep = useRef(createBeep())
  const restaurantRef = useRef<Restaurant | null>(null)

  function enableSound() {
    beep.current()
    setSoundEnabled(true)
    toast.success('Sound notification enabled 🔔')
  }

  async function togglePH() {
    if (!restaurant) return
    const newVal = !restaurant.ph_active
    const { error } = await supabase.from('restaurants').update({ ph_active: newVal }).eq('id', restaurant.id)
    if (error) { toast.error(error.message); return }
    const updated = { ...restaurant, ph_active: newVal }
    setRestaurant(updated)
    restaurantRef.current = updated
    toast.success(newVal ? `Public Holiday surcharge enabled +${restaurant.ph_surcharge_pct || 10}%` : 'Public Holiday surcharge disabled')
  }

  async function saveSettings() {
    if (!restaurant) return
    setSavingSettings(true)
    const card = parseFloat(cardSurchargeInput) || 0
    const ph = parseFloat(phSurchargeInput) || 0
    const { error } = await supabase.from('restaurants').update({
      card_surcharge_pct: card,
      ph_surcharge_pct: ph,
    }).eq('id', restaurant.id)
    if (error) { toast.error(error.message); setSavingSettings(false); return }
    const updated = { ...restaurant, card_surcharge_pct: card, ph_surcharge_pct: ph }
    setRestaurant(updated)
    restaurantRef.current = updated
    toast.success('Settings saved')
    setShowSettings(false)
    setSavingSettings(false)
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: rest } = await supabase.from('restaurants').select('*').eq('owner_id', user.id).single()
      if (!rest) { router.push('/auth/login'); return }
      setRestaurant(rest)
      restaurantRef.current = rest
      setCardSurchargeInput(String(rest.card_surcharge_pct ?? 1.5))
      setPhSurchargeInput(String(rest.ph_surcharge_pct ?? 10))

      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('restaurant_id', rest.id)
        .neq('status', 'paid')
        .order('created_at', { ascending: true })
      const loaded = data || []
      setOrders(loaded)
      prevOrderIds.current = new Set(loaded.map(o => o.id))
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    if (!restaurant) return
    const channel = supabase.channel('orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        async () => {
          const { data: refreshed } = await supabase
            .from('orders')
            .select('*, items:order_items(*)')
            .eq('restaurant_id', restaurant.id)
            .neq('status', 'paid')
            .order('created_at', { ascending: true })
          const fresh = refreshed || []

          const newPending = fresh.filter(o => o.status === 'pending' && !prevOrderIds.current.has(o.id))
          if (newPending.length > 0) {
            if (soundEnabled) beep.current()
            toast(`🆕 New Order! Table ${newPending.map(o => o.table_number).join(', ')}`, { duration: 4000 })
          }

          prevOrderIds.current = new Set(fresh.map(o => o.id))
          setOrders(fresh)
        }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [restaurant, soundEnabled])

  async function confirmOrder(order: Order) {
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id)
    setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'confirmed' } : o))
    toast.success('Confirmed')
  }

  async function confirmAllForTable(tableOrders: Order[]) {
    const pending = tableOrders.filter(o => o.status === 'pending')
    if (pending.length === 0) return
    await Promise.all(pending.map(o =>
      supabase.from('orders').update({ status: 'confirmed' }).eq('id', o.id)
    ))
    setOrders(orders.map(o => pending.some(p => p.id === o.id) ? { ...o, status: 'confirmed' } : o))
    toast.success(`Confirmed ${pending.length} order(s)`)
  }

  // Separate takeaway and dine-in orders
  const takeawayOrders = orders.filter(o => o.order_type === 'takeaway')
  const dineInOrders = orders.filter(o => !o.order_type || o.order_type === 'dine_in')

  // Group dine-in by table
  const tableGroups = new Map<string, Order[]>()
  dineInOrders.forEach(o => {
    const arr = tableGroups.get(o.table_number) || []
    arr.push(o)
    tableGroups.set(o.table_number, arr)
  })
  const sortedTables = Array.from(tableGroups.entries()).sort((a, b) => {
    const na = parseInt(a[0]) || 9999, nb = parseInt(b[0]) || 9999
    return na - nb
  })

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500">Loading...</div>

  const phPct = restaurant?.ph_surcharge_pct ?? 10
  const cardPct = restaurant?.card_surcharge_pct ?? 1.5
  const phActive = restaurant?.ph_active ?? false

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4 flex-wrap">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">← Back</Link>
        <h1 className="text-xl font-bold text-orange-600">Live Orders</h1>
        <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {orders.filter(o => o.status === 'pending').length} New
        </span>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {!soundEnabled ? (
            <button onClick={enableSound}
              className="text-sm bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 px-3 py-1.5 rounded-lg transition">
              🔕 Enable Sound
            </button>
          ) : (
            <span className="text-sm text-green-600 px-2">🔔 Sound Enabled</span>
          )}
        </div>
      </nav>

      {/* Settings panel */}
      <div className="bg-white border-b px-6 py-3 flex items-center gap-3 flex-wrap">
        {/* Public holiday toggle */}
        <button onClick={togglePH}
          className={`text-sm px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            phActive
              ? 'bg-yellow-200 text-yellow-900 font-semibold ring-2 ring-yellow-400'
              : 'bg-gray-100 text-gray-600 hover:bg-yellow-100'
          }`}>
          🎉 Public Holiday +{phPct}% {phActive ? 'ON' : 'OFF'}
        </button>

        <div className="text-sm text-gray-500">
          Card surcharge: <span className="font-semibold text-gray-700">{cardPct}%</span>
        </div>

        <button onClick={() => setShowSettings(!showSettings)}
          className="text-sm text-orange-600 hover:text-orange-800 ml-auto">
          ⚙️ Settings
        </button>
      </div>

      {showSettings && (
        <div className="bg-orange-50 border-b px-6 py-4">
          <div className="max-w-md grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Surcharge %</label>
              <input type="number" step="0.1" min="0" max="5" value={cardSurchargeInput}
                onChange={e => setCardSurchargeInput(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PH Surcharge %</label>
              <input type="number" step="0.5" min="0" max="30" value={phSurchargeInput}
                onChange={e => setPhSurchargeInput(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={saveSettings} disabled={savingSettings}
              className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {savingSettings ? 'Saving...' : '✓ Save'}
            </button>
            <button onClick={() => setShowSettings(false)}
              className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* New takeaway button */}
      <div className="max-w-5xl mx-auto px-6 pt-4">
        <button onClick={() => setShowNewTakeaway(true)}
          className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2">
          🥡 New Takeaway Order
        </button>
      </div>

      {/* Takeaway orders section */}
      {takeawayOrders.length > 0 && (
        <div className="max-w-5xl mx-auto p-6 pb-0">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            🥡 Takeaway ({takeawayOrders.length})
          </h3>
          <div className="space-y-3">
            {takeawayOrders.map(order => (
              <div key={order.id} className={`bg-white rounded-2xl border-2 p-4 shadow-sm ${
                order.status === 'pending' ? 'border-orange-300 shadow-orange-100' : 'border-green-200'
              }`}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-lg w-12 h-12 rounded-xl flex items-center justify-center bg-green-600">
                      {order.table_number}
                    </span>
                    <div>
                      <div className="font-bold text-gray-800">
                        🥡 Takeaway
                        {order.customer_name && <span className="ml-2 text-gray-600">· {order.customer_name}</span>}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString()}
                        {order.customer_phone && <span className="ml-2">📞 {order.customer_phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Subtotal</div>
                    <div className="text-xl font-bold text-orange-600">${order.total.toFixed(2)}</div>
                  </div>
                </div>

                <div className="space-y-0.5 mb-2">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-700">
                      <span>{item.quantity}x {item.name}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5 mb-3 text-sm text-yellow-800">
                    📝 {order.notes}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  {order.status === 'pending' ? (
                    <button onClick={() => confirmOrder(order)}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-xl font-semibold hover:bg-blue-600">
                      ✓ Confirm
                    </button>
                  ) : (
                    <button onClick={() => setCheckoutOrders([order])}
                      className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold hover:bg-green-700">
                      💰 Checkout ${order.total.toFixed(2)}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dine-in tables */}
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        {takeawayOrders.length > 0 && sortedTables.length > 0 && (
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            🍽️ Dine-in ({sortedTables.length} Table{sortedTables.length > 1 ? 's' : ''})
          </h3>
        )}
        {sortedTables.length === 0 && takeawayOrders.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
            No active orders. Waiting for customers...
          </div>
        ) : sortedTables.length === 0 ? null : (
          sortedTables.map(([tableNumber, tableOrders]) => {
            const tableTotal = tableOrders.reduce((sum, o) => sum + o.total, 0)
            const hasPending = tableOrders.some(o => o.status === 'pending')
            const allConfirmed = tableOrders.every(o => o.status !== 'pending')

            return (
              <div key={tableNumber} className={`bg-white rounded-2xl border-2 p-5 shadow-sm ${
                hasPending ? 'border-orange-300 shadow-orange-100' : 'border-gray-200'
              }`}>
                {/* Table header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <span className="bg-orange-500 text-white font-bold text-lg w-10 h-10 rounded-xl flex items-center justify-center">
                      {tableNumber}
                    </span>
                    <div>
                      <div className="font-bold text-gray-800 text-lg">Table {tableNumber}</div>
                      <div className="text-xs text-gray-400">{tableOrders.length} order(s) · {tableOrders.reduce((s, o) => s + (o.items?.length || 0), 0)} item(s)</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Subtotal</div>
                    <div className="text-2xl font-bold text-orange-600">${tableTotal.toFixed(2)}</div>
                  </div>
                </div>

                {/* Orders list */}
                <div className="space-y-3 mb-4">
                  {tableOrders.map((order, idx) => (
                    <div key={order.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-gray-500">
                          Order #{idx + 1} · {new Date(order.created_at).toLocaleTimeString()}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status === 'pending' ? 'Pending' : 'Confirmed'}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex justify-between text-sm text-gray-700">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1 mt-2 text-xs text-yellow-800">
                          📝 Notes: {order.notes}
                        </div>
                      )}
                      {order.status === 'pending' && (
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => confirmOrder(order)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium">✓ Confirm order</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {hasPending && (
                    <button onClick={() => confirmAllForTable(tableOrders)}
                      className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition">
                      ✓ Confirm All
                    </button>
                  )}
                  {allConfirmed && (
                    <button onClick={() => setCheckoutOrders(tableOrders)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 transition">
                      💰 Checkout ${tableTotal.toFixed(2)}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {checkoutOrders && restaurant && (
        <CheckoutModal
          orders={checkoutOrders}
          restaurant={restaurant}
          onClose={() => setCheckoutOrders(null)}
          onPaid={(paidIds) => {
            setOrders(prev => prev.filter(o => !paidIds.includes(o.id)))
          }}
        />
      )}

      {showNewTakeaway && restaurant && (
        <NewTakeawayModal
          restaurant={restaurant}
          onClose={() => setShowNewTakeaway(false)}
          onCreated={() => { /* Realtime subscription automatically refreshes */ }}
        />
      )}
    </main>
  )
}
