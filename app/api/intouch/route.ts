import crypto from "crypto";

export async function POST(req: Request) {
  const { amount, phone } = await req.json();

  // Environment variables
  const username = process.env.INTOUCH_USERNAME; // e.g., irapatechno10037
  const accountNo = process.env.INTOUCH_ACCOUNT_NUMBER; // e.g., SBX00000045
  const partnerPassword = process.env.INTOUCH_PARTNER_PASSWORD;
  const baseURL = process.env.INTOUCH_BASE_URL;

  // Generate current timestamp (YYYYMMDDHHMMSS)
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:\.Z]/g, "")
    .slice(0, 14);

  // Generate SHA-256 hash: Username + AccountNo + PartnerPassword + Timestamp
  const rawString = `${username}${accountNo}${partnerPassword}${timestamp}`;
  const hashedPassword = crypto
    .createHash("sha256")
    .update(rawString)
    .digest("hex");

  // Construct IntouchPay payload
  const payload = {
    username: username,
    timestamp: timestamp,
    amount: amount,
    password: hashedPassword,
    mobilephone: phone,
    requesttransactionid: `TXN_${Date.now()}`,
    accountno: accountNo,
  };

  // Send request to IntouchPay API
  const response = await fetch(`${baseURL}/api/v1/sandbox/requestpayment/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  console.log("IntouchPay Gateway Response:", data);

  return Response.json(data);
}