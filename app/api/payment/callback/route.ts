import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { request_id, status } = body; // Intouch sends request_id and status

    if (status === 'SUCCESS' || status === '200') {
      // Update Supabase order to paid
      await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('order_reference', request_id);

      // TODO: Trigger email notification function here
    } else {
      await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('order_reference', request_id);
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Callback handling failed' }, { status: 500 });
  }
}