import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { amount, phone } = await req.json();

    // Load credentials from environment variables
    const username = process.env.INTOUCH_USERNAME;
    const accountNo = process.env.INTOUCH_ACCOUNT_NUMBER;
    const partnerPassword = process.env.INTOUCH_PARTNER_PASSWORD;
    const baseURL = process.env.INTOUCH_BASE_URL || "https://developer.intouchpay.co.rw";

    // Create timestamp string YYYYMMDDHHMMSS
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-T:\.Z]/g, "").slice(0, 14);

    // Compute required SHA-256 Hash
    const rawString = `${username}${accountNo}${partnerPassword}${timestamp}`;
    const hashedPassword = crypto.createHash("sha256").update(rawString).digest("hex");

    // Construct Payload for IntouchPay
    const payload = {
      username: username,
      timestamp: timestamp,
      amount: Number(amount),
      password: hashedPassword,
      mobilephone: phone.replace("+", ""), // Standardize phone format (e.g., 25078...)
      requesttransactionid: `TXN_${Date.now()}`,
      accountno: accountNo,
    };

    // Call IntouchPay API
    const response = await fetch(`${baseURL}/api/v1/sandbox/requestpayment/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}