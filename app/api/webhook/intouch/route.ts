import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Adjust import path if needed

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received IntouchPay Webhook Payload:', JSON.stringify(body, null, 2));

    // IntouchPay wraps payload data inside 'jsonpayload'
    const payload = body.jsonpayload || body;

    const requestTransactionId = payload.requesttransactionid;
    const status = payload.status; // e.g., 'Successful'
    const transactionId = payload.transactionid;

    if (requestTransactionId) {
      // Extract original order ID from TX-orderId-timestamp format
      const orderIdParts = requestTransactionId.split('-');
      const orderId = orderIdParts.length >= 2 ? orderIdParts[1] : null;

      if (orderId && supabase) {
        // Update order status in Supabase
        const isSuccessful = status === 'Successful' || status === 'Successfull';
        
        await supabase
          .from('orders') // Make sure your Supabase table is named 'orders'
          .update({
            payment_status: isSuccessful ? 'completed' : 'failed',
            intouch_transaction_id: transactionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }
    }

    // MANDATORY IntouchPay Acknowledgment (HTTP 200 OK)
    return NextResponse.json(
      {
        message: 'success',
        success: true,
        request_id: requestTransactionId || '11223321',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error handling IntouchPay webhook:', error);

    // Return HTTP 200 even on internal error to acknowledge receipt
    return NextResponse.json(
      {
        message: 'success',
        success: false,
        error: error.message,
      },
      { status: 200 }
    );
  }
}