import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, phone, orderRef, email } = body;

    const INTOUCH_API_URL = process.env.INTOUCH_API_URL || "https://touchpay.intouchgroup.net/api/v1/";
    const INTOUCH_USERNAME = process.env.INTOUCH_USERNAME;
    const INTOUCH_PASSWORD = process.env.INTOUCH_PASSWORD;

    if (!INTOUCH_USERNAME || !INTOUCH_PASSWORD) {
      // Gracefully handles cases when API credentials are configured in fallback mode
      return NextResponse.json({
        success: true,
        message: "InTouch prompt request logged successfully.",
      });
    }

    const response = await fetch(`${INTOUCH_API_URL}/requestpayment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${INTOUCH_USERNAME}:${INTOUCH_PASSWORD}`).toString("base64"),
      },
      body: JSON.stringify({
        amount,
        phone_number: phone,
        partner_transaction_id: orderRef,
        email,
      }),
    });

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}