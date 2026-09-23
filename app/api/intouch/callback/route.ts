import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, phone, orderId } = body;

    if (!amount || !phone) {
      return NextResponse.json(
        { error: 'Amount and phone number are required.' },
        { status: 400 }
      );
    }

    // Format phone number (Ensure format 2507XXXXXXXX)
    let formattedPhone = phone.trim().replace(/\+/g, '');
    if (formattedPhone.startsWith('07')) {
      formattedPhone = '250' + formattedPhone.substring(1);
    }

    const username = process.env.INTOUCH_USERNAME;
    const password = process.env.INTOUCH_PARTNER_PASSWORD;
    const accountGl = process.env.INTOUCH_ACCOUNT_NUMBER;
    const baseUrl = process.env.INTOUCH_BASE_URL || 'https://developer.intouchpay.co.rw';

    // IntouchPay SHA256 Signature calculation
    // Hash format: SHA256(username + password + request_id + amount + phone + account_gl)
    const rawString = `${username}${password}${orderId}${amount}${formattedPhone}${accountGl}`;
    const signature = crypto.createHash('sha256').update(rawString).digest('hex');

    const payload = {
      username: username,
      timestamp: new Date().toISOString(),
      amount: amount,
      phone: formattedPhone,
      request_id: orderId,
      account_gl: accountGl,
      signature: signature,
    };

    const response = await fetch(`${baseUrl}/api/v1/sandbox/requestpayment/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to initiate payment with IntouchPay' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('IntouchPay Payment Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}