import { NextResponse } from 'next/server';
import { config } from '@/lib/intouchConfig';
import { getFormattedTimestamp, generateHashedPassword } from '@/lib/intouchHelpers';

export async function POST(request: Request) {
  try {
    const { requesttransactionid } = await request.json();

    if (!requesttransactionid) {
      return NextResponse.json(
        { error: 'Missing required parameter: requesttransactionid' },
        { status: 400 }
      );
    }

    // 1. Prepare timestamp & secure password hash
    const timestamp = getFormattedTimestamp();
    const password = generateHashedPassword(timestamp);

    // 2. Build status query payload
    const payload = {
      username: config.username,
      timestamp: timestamp,
      password: password,
      action: 'gettransactionstatus',
      accountno: config.accountNo,
      requesttransactionid: requesttransactionid,
    };

    // 3. Send POST request to IntouchPay status endpoint
    const response = await fetch(`${config.baseUrl}/gettransactionstatus/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      statusData: data,
    });
  } catch (error: any) {
    console.error('IntouchPay Status Check Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction status', details: error.message },
      { status: 500 }
    );
  }
}