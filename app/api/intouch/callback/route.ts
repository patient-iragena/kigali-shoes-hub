import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendPaidEmails } from '@/lib/send-paid-emails'

// IntouchPay's "terminal" statuses (final, won't change again) map to our
// payment_status values. "Pending" is transient and shouldn't normally
// arrive here, but we handle it safely just in case.
//
// NOTE: IntouchPay's real callback sends "Successfull" (double L), not
// "Successful" as their own docs spell it. Matching by prefix instead of
// an exact string protects against this and similar spelling variants,
// rather than silently failing to update the order like an exact match did.
function mapStatus(intouchStatus: string): string | null {
  const s = (intouchStatus || '').toLowerCase().trim()
  if (s.startsWith('success')) return 'PAID'
  if (s.startsWith('fail')) return 'FAILED'
  if (s.startsWith('timeout') || s.startsWith('time out')) return 'FAILED' // treated the same as failed - customer can retry
  return null // "pending" or anything unrecognized - don't touch the order
}

export async function POST(req: Request) {
  // Always acknowledge, even on error, so IntouchPay doesn't retry forever.
  // We do our best to process first, but the response shape below is sent
  // in every code path.
  let requestTransactionId = ''

  try {
    const body = await req.json()
    // Accept both shapes: { jsonpayload: {...} } (as documented) or a flat body
    const payload = body?.jsonpayload ? body.jsonpayload : body

    if (!payload || !payload.requesttransactionid) {
      // Log the callback body in full on ONE line, but never the password hash
      const { password: _hidden, ...safeBody } = (body || {}) as Record<string, unknown>
      console.error(
        'IntouchPay callback: no requesttransactionid ' + JSON.stringify(safeBody)
      )
      return acknowledge('')
    }

    requestTransactionId = String(payload.requesttransactionid)
    const newStatus = mapStatus(payload.status)

    console.log(
      'IntouchPay callback received: ' +
        JSON.stringify({
          requesttransactionid: requestTransactionId,
          status: payload.status ?? null,
          responsecode: payload.responsecode ?? null,
          referenceno: payload.referenceno ?? null,
        })
    )

    if (!newStatus) {
      // Transient or unrecognized status - nothing to update yet.
      return acknowledge(requestTransactionId)
    }

    // A checkout can contain more than one item, each saved as its own
    // order row, all sharing one checkout_group_id. requestTransactionId
    // IS that checkout_group_id - so every row from this checkout updates
    // together, not just one of them.
    const { data: existingOrders, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, payment_status')
      .eq('checkout_group_id', requestTransactionId)

    if (fetchError || !existingOrders || existingOrders.length === 0) {
      console.error(
        'IntouchPay callback: no matching orders found for checkout_group_id',
        requestTransactionId,
        fetchError?.message
      )
      return acknowledge(requestTransactionId)
    }

    const alreadyFinalized = existingOrders.every(
      (o) => o.payment_status === 'PAID' || o.payment_status === 'FAILED'
    )
    if (alreadyFinalized) {
      // Already processed - this is a duplicate delivery. Acknowledge and stop.
      console.log(
        'IntouchPay callback: all orders in this group already finalized, skipping update',
        requestTransactionId
      )
      return acknowledge(requestTransactionId)
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: newStatus,
        momo_ref: payload.referenceno || null,
      })
      .eq('checkout_group_id', requestTransactionId)

    if (updateError) {
      console.error(
        'IntouchPay callback: failed to update orders for checkout_group_id',
        requestTransactionId,
        updateError.message
      )
    }

    // Payment just confirmed: notify the owner and the customer by email.
    // (Only reached the first time - repeat callbacks stop at the
    // "already finalized" check above, so no duplicate emails.)
    if (!updateError && newStatus === 'PAID') {
      await sendPaidEmails(requestTransactionId)
    }

    return acknowledge(requestTransactionId)
  } catch (error: any) {
    console.error('IntouchPay callback route error:', error)
    return acknowledge(requestTransactionId)
  }
}

function acknowledge(requestId: string) {
  return NextResponse.json({
    message: 'success',
    success: true,
    request_id: requestId,
  })
}