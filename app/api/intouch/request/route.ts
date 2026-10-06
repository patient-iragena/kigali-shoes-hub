import { NextResponse } from 'next/server'
import crypto from 'crypto'
 
// SANDBOX endpoint for now - we switch this to production only in the
// final "going live" step, after everything below is tested and working.
// NOTE: the official SDK repo's "sandbox.intouchpay.co.rw" domain does not
// resolve (confirmed: ENOTFOUND) - reverted to the live, working dashboard
// domain, same one the interactive sandbox playground itself uses.
const INTOUCH_REQUEST_PAYMENT_URL =
  'https://developer.intouchpay.co.rw/api/v1/sandbox/requestpayment/'
 
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
    console.log('IntouchPay requestpayment response:', data)
 
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('IntouchPay request route error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    )
  }
}
 