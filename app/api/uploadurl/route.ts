import { NextResponse } from "next/server";

export async function GET() {
  const { success, result, error } = await getUploadUrl();
  if (!success) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
  return NextResponse.json({ success: true, result });
}

async function getUploadUrl() {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
      },
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "Failed to get upload URL:",
      response.status,
      response.statusText,
      errorText
    );
    return { success: false, error: errorText };
  }
  const data = await response.json();
  return data;
}
