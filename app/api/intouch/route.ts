import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { amount, phone } = await req.json();

    if (!amount || !phone) {
      return NextResponse.json(
        { success: false, message: "Amount and phone number are required." },
        { status: 400 }
      );
    }

    // Load credentials from environment variables
    const username = process.env.INTOUCH_USERNAME || "irapatechnol0039";
    const accountNo = process.env.INTOUCH_ACCOUNT_NUMBER || "SBX00000043";
    const partnerPassword =
      process.env.INTOUCH_PARTNER_PASSWORD ||
      "kH!r2rUaD6lQLEfKRVkCN2!Z3@er$Iq6w&kK@1j1";
    const baseURL =
      process.env.INTOUCH_BASE_URL || "https://developer.intouchpay.co.rw";

    // UTC Timestamp generation (YYYYMMDDHHMMSS)
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-T:\.Z]/g, "").slice(0, 14);

    // Concatenate raw string: Username + AccountNo + PartnerPassword + Timestamp
    const rawString = `${username}${accountNo}${partnerPassword}${timestamp}`;

    // Compute SHA-256 Hash
    const hashedPassword = crypto
      .createHash("sha256")
      .update(rawString)
      .digest("hex");

    // Format phone number to clean string
    const formattedPhone = phone.replace(/\+/g, "").trim();

    // Prepare IntouchPay API request body
    const payload = {
      username: username,
      timestamp: timestamp,
      password: hashedPassword,
      amount: String(amount),
      mobilephone: formattedPhone,
      requesttransactionid: `REQ_${Date.now()}`,
      callbackurl: "https://kigalishoeshub.com/api/callback",
    };

    // Forward request to IntouchPay Sandbox Endpoint
    const response = await fetch(`${baseURL}/api/v1/sandbox/requestpayment/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("IntouchPay API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}