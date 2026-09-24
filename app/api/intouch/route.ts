import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { amount, phone } = await req.json();

    const username = process.env.INTOUCH_USERNAME || "irapatechnol0039";
    const accountNo = process.env.INTOUCH_ACCOUNT_NUMBER || "SBX00000043";
    const partnerPassword = process.env.INTOUCH_PARTNER_PASSWORD || "kH!r2rUaD6lQLEfKRVkCN2!Z3@er$Iq6w&kK@1j1";
    const baseURL = process.env.INTOUCH_BASE_URL || "https://developer.intouchpay.co.rw";

    // Standard YYYYMMDDHHMMSS format
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-T:\.Z]/g, "").slice(0, 14);

    // Dynamic Hash Calculation
    const rawString = `${username}${accountNo}${partnerPassword}${timestamp}`;
    const hashedPassword = crypto.createHash("sha256").update(rawString).digest("hex");

    const payload = {
      username: username,
      timestamp: timestamp,
      password: hashedPassword,
      amount: String(amount),
      mobilephone: phone.replace("+", ""),
      requesttransactionid: `TXN_${Date.now()}`,
      callbackurl: "https://kigalishoeshub.com/api/callback",
    };

    const response = await fetch(`${baseURL}/api/v1/sandbox/requestpayment/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}