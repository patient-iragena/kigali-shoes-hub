import { NextResponse } from 'next/server';
import { config } from '@/lib/intouchConfig';
import { getFormattedTimestamp, generateHashedPassword } from '@/lib/intouchHelpers';

export async function POST(request: Request) {
  try {
    const { phone, amount, orderId } = await request.json();

    if (!phone || !amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required parameters: phone, amount, or orderId' },
        { status: 400 }
      );
    }

    // 1. Prepare timestamp & secure password hash
    const timestamp = getFormattedTimestamp();
    const password = generateHashedPassword(timestamp);

    // 2. Format unique transaction ID (must be unique per request)
    const requesttransactionid = `TX-${orderId}-${Date.now()}`;

    // 3. Build payload for IntouchPay
    const payload = {
      username: config.username,
      timestamp: timestamp,
      password: password,
      action: 'requestpayment',
      phone: phone,
      amount: Number(amount),
      currency: 'RWF',
      accountno: config.accountNo,
      requesttransactionid: requesttransactionid,
      callbackurl: config.callbackUrl,
    };

    // 4. Send POST request to IntouchPay endpoint
    const response = await fetch(`${config.baseUrl}/requestpayment/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      requesttransactionid,
      intouchResponse: data,
    });
  } catch (error: any) {
    console.error('IntouchPay Payment Request Error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment request', details: error.message },
      { status: 500 }
    );
  }
}