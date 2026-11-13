import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

// The IntouchPay address now comes from the INTOUCH_API_URL environment
// variable, so the same code works everywhere:
//  - On your computer (.env.local): leave INTOUCH_API_URL out -> SANDBOX is used.
//  - On Vercel (live site): set INTOUCH_API_URL to the PRODUCTION address
//    https://www.intouchpay.co.rw/api/requestpayment/
const SANDBOX_URL =
  'https://developer.intouchpay.co.rw/api/v1/sandbox/requestpayment/'
const INTOUCH_REQUEST_PAYMENT_URL =
  (process.env.INTOUCH_API_URL || '').trim() || SANDBOX_URL

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount, phone, orderId } = body

    if (!amount || !phone || !orderId) {
      return NextResponse.json(
        { success: false, error: 'amount, phone, and orderId are required' },
        { status: 400 }
      )
    }

    // ---- Basic format checks ----
    const groupId = String(orderId)
    const phoneStr = String(phone)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(groupId)) {
      return NextResponse.json({ success: false, error: 'Invalid order reference' }, { status: 400 })
    }
    // Rwanda mobile numbers only: 250 + (78|79|72|73) + 7 digits
    if (!/^250(78|79|72|73)\d{7}$/.test(phoneStr)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 })
    }

    // ---- Verify against OUR database (never trust the browser) ----
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, amount_rwf, payment_status, customer_phone, created_at, shoes(price_rwf)')
      .eq('checkout_group_id', groupId)

    if (ordersError) {
      // Real database/key problem - log it so it shows up in Vercel logs
      console.error('Order lookup failed:', ordersError.message)
      return NextResponse.json({ success: false, error: 'Could not check the order' }, { status: 500 })
    }
    if (!orders || orders.length === 0) {
      console.error('Order not found for checkout_group_id', groupId)
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Only fresh orders (30 minutes) that are still waiting for payment
    const MAX_AGE_MS = 30 * 60 * 1000
    for (const o of orders as any[]) {
      if (o.payment_status !== 'PENDING') {
        return NextResponse.json({ success: false, error: 'Order is not awaiting payment' }, { status: 409 })
      }
      if (Date.now() - new Date(o.created_at).getTime() > MAX_AGE_MS) {
        return NextResponse.json({ success: false, error: 'Order expired, please place it again' }, { status: 410 })
      }
      // The prompt may only go to the phone number saved on the order
      if (o.customer_phone !== `+${phoneStr}`) {
        return NextResponse.json({ success: false, error: 'Phone does not match the order' }, { status: 400 })
      }
    }

    // Each order line must equal the real shoe price x a sensible quantity
    let itemsTotal = 0
    for (const o of orders as any[]) {
      const shoe = Array.isArray(o.shoes) ? o.shoes[0] : o.shoes
      const unit = Number(shoe?.price_rwf)
      const lineAmount = Number(o.amount_rwf)
      const qty = unit > 0 ? lineAmount / unit : 0
      if (!unit || !Number.isInteger(qty) || qty < 1 || qty > 20) {
        console.error('Order amount does not match shoe price', o.id)
        return NextResponse.json({ success: false, error: 'Order amount is not valid' }, { status: 400 })
      }
      itemsTotal += lineAmount
    }

    // Amount = items total, or items total + the 3,000 delivery fee outside Kigali
    const DELIVERY_FEE = 3000
    const requestedAmount = Number(amount)
    if (requestedAmount !== itemsTotal && requestedAmount !== itemsTotal + DELIVERY_FEE) {
      console.error('Amount mismatch', { requestedAmount, itemsTotal })
      return NextResponse.json({ success: false, error: 'Amount does not match the order' }, { status: 400 })
    }

    const username = (process.env.INTOUCH_USERNAME || '').trim()
    const accountNo = (process.env.INTOUCH_ACCOUNT_NO || '').trim()
    const partnerPassword = (process.env.INTOUCH_PARTNER_PASSWORD || '').trim()
    const callbackUrl = (process.env.INTOUCH_CALLBACK_URL || '').trim()

    if (!username || !accountNo || !partnerPassword || !callbackUrl) {
      console.error('Missing one or more INTOUCH_* environment variables')
      return NextResponse.json(
        { success: false, error: 'Server is not configured correctly' },
        { status: 500 }
      )
    }

    // UTC timestamp in the exact format the docs require: YYYYMMDDHHmmss
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp =
      now.getUTCFullYear().toString() +
      pad(now.getUTCMonth() + 1) +
      pad(now.getUTCDate()) +
      pad(now.getUTCHours()) +
      pad(now.getUTCMinutes()) +
      pad(now.getUTCSeconds())

    // Password hash: SHA256(username + accountno + partnerpassword + timestamp)
    // Computed once, used immediately below - never regenerate timestamp after this line.
    const rawHashString = username + accountNo + partnerPassword + timestamp
    const passwordHash = crypto
      .createHash('sha256')
      .update(rawHashString)
      .digest('hex')

    const payload = {
      username,
      accountno: accountNo,
      timestamp,
      amount: Number(amount),
      password: passwordHash,
      mobilephone: String(phone),
      requesttransactionid: String(orderId), // must be globally unique per the docs
      callbackurl: callbackUrl,
    }

    const response = await fetch(INTOUCH_REQUEST_PAYMENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const rawText = await response.text()
    let data: any
    try {
      data = JSON.parse(rawText)
    } catch {
      console.error('IntouchPay returned non-JSON response:', rawText.slice(0, 300))
      return NextResponse.json(
        { success: false, error: 'IntouchPay returned an unexpected response' },
        { status: 502 }
      )
    }

    // Log the full response for now while we're testing - remove or reduce
    // this once everything is confirmed working.
    console.log('IntouchPay requestpayment response: ' + JSON.stringify(data))

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('IntouchPay request route error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    )
  }
}