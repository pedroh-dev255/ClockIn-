import { NextResponse } from "next/server";
import { proxy } from "../_proxy";

export async function GET(req) {

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") || "unknown";

  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const res = await proxy(req, `${process.env.API_URL}/api/validate-token-Admin`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        appToken: process.env.APP_TOKEN,
        "x-client-ip": ip
      },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const data = await res.json();

    return NextResponse.json({
      success: data.success,
      message: data.message,
      role: data.role
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
