import { supabaseAdmin } from '@/lib/supabase-admin'

// SERVER-ONLY. Sends the "payment received" emails (owner notification +
// customer receipt) through EmailJS. Called from the IntouchPay callback the
// moment a payment is confirmed, so it works even if the customer closed the tab.

const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send'
const SERVICE_ID = 'service_84glr5p'
const OWNER_TEMPLATE_ID = 'template_wu0bkeb'
const CUSTOMER_TEMPLATE_ID = 'template_oschd8a'
const PUBLIC_KEY = '83vF3uD9oYthKT_vR'
const OWNER_EMAIL = 'patientira79@gmail.com'

async function sendEmail(templateId: string, params: Record<string, string>) {
  const privateKey = (process.env.EMAILJS_PRIVATE_KEY || '').trim()
  if (!privateKey) {
    console.error('EMAILJS_PRIVATE_KEY is missing - cannot send server emails')
    return
  }
  const res = await fetch(EMAILJS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: templateId,
      user_id: PUBLIC_KEY,
      accessToken: privateKey,
      template_params: params,
    }),
  })
  if (!res.ok) {
    console.error('EmailJS send failed', templateId, res.status, await res.text())
  }
}

export async function sendPaidEmails(checkoutGroupId: string) {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(
        'size, amount_rwf, customer_phone, customer_email, location_details, delivery_fee_rwf, payment_method, momo_ref, shoes(name, price_rwf)'
      )
      .eq('checkout_group_id', checkoutGroupId)

    if (error || !orders || orders.length === 0) {
      console.error('sendPaidEmails: could not load orders', error?.message)
      return
    }

    const rows = orders as any[]
    const first = rows[0]
    const itemsSummary = rows
      .map((o) => {
        const shoe = Array.isArray(o.shoes) ? o.shoes[0] : o.shoes
        const unit = Number(shoe?.price_rwf) || 0
        const qty = unit > 0 ? Math.round(Number(o.amount_rwf) / unit) : 1
        return `${shoe?.name || 'Shoe'} (EU ${o.size}) x${qty} - RWF ${Number(o.amount_rwf).toLocaleString()}`
      })
      .join('\n')

    const itemsTotal = rows.reduce((sum, o) => sum + Number(o.amount_rwf), 0)
    const deliveryFee = Number(first.delivery_fee_rwf) || 0
    const total = itemsTotal + deliveryFee
    const reference = checkoutGroupId.slice(0, 8).toUpperCase()
    const customerEmail = String(first.customer_email || '')
    const network = String(first.payment_method || '').toUpperCase()

    const base = {
      title: `PAID - Footwear Order (${rows.length} item${rows.length > 1 ? 's' : ''})`,
      name: customerEmail ? customerEmail.split('@')[0] : 'Customer',
      message: `PAYMENT RECEIVED - ready for delivery.\nOrder Details:\n${itemsSummary}\nMoMo reference: ${first.momo_ref || '-'}`,
      order_reference: reference,
      shoe_name: rows.length === 1
        ? String((Array.isArray(first.shoes) ? first.shoes[0] : first.shoes)?.name || 'Shoe')
        : `${rows.length} Footwear Items`,
      shoe_size: rows.length === 1 ? String(first.size) : 'Multiple Sizes',
      shoe_price: `RWF ${itemsTotal.toLocaleString()}`,
      delivery_fee: `RWF ${deliveryFee.toLocaleString()}`,
      total_price: `RWF ${total.toLocaleString()}`,
      customer_phone: String(first.customer_phone || ''),
      customer_email: customerEmail,
      location_details: String(first.location_details || ''),
      payment_type: `Mobile Money (${network}) - PAID`,
    }

    await sendEmail(OWNER_TEMPLATE_ID, { ...base, to_email: OWNER_EMAIL })
    if (customerEmail) {
      await sendEmail(CUSTOMER_TEMPLATE_ID, { ...base, to_email: customerEmail })
    }
  } catch (err) {
    console.error('sendPaidEmails error:', err)
  }
}