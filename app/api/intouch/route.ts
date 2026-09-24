import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, amount } = body;

    if (!phone || !amount) {
      return NextResponse.json(
        { error: 'Phone number and amount are required.' },
        { status: 400 }
      );
    }

    // 1. Read environment variables with flexible fallbacks
    const username = process.env.INTOUCH_LOGIN || process.env.INTOUCH_USERNAME || 'irapatechno10037'; //[cite: 17, 21]
    const partnerPassword = process.env.INTOUCH_PASSWORD || ''; //
    const accountNo = process.env.INTOUCH_PARTNER_ID || process.env.INTOUCH_ACCOUNT_NUMBER || 'SBX000000045'; //[cite: 17, 21]
    const apiUrl = process.env.INTOUCH_API_URL || 'https://developer.intouchpay.co.rw/api/requestdeposit'; //

    // 2. Format Timestamp to UTC YYYYMMDDHHmmss
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14); //

    // 3. Generate SHA-256 password hash required by IntouchPay:
    // SHA256(username + accountno + partnerpassword + timestamp)
    const rawString = `${username}${accountNo}${partnerPassword}${timestamp}`;
    const generatedPasswordHash = crypto
      .createHash('sha256')
      .update(rawString)
      .digest('hex'); //

    // 4. Unique Transaction ID
    const requestTransactionId = `TX-${Date.now()}`;

    // 5. Construct Payload according to IntouchPay specification
    const payload = {
      username: username, //
      timestamp: timestamp, //
      amount: Number(amount), //
      mobilephoneno: phone, //
      requesttransactionid: requestTransactionId, //
      accountno: accountNo, //
      password: generatedPasswordHash, //
    };

    // 6. Send POST Request to IntouchPay
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.statusdesc || data.message || 'Payment processing failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('IntouchPay API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}