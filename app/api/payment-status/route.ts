import {storeRequestIdentity} from '@/lib/store-request-identity';
import { getStoreTenant } from '@/lib/store-tenant';
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]{10,240}$/.test(sessionId))
    return Response.json({ error: "Sesión inválida" }, { status: 400 });
  try {
    const base = process.env.SOCK_CONTROL_URL;
    if (!base) throw Error();
    const response = await fetch(
      base.replace(/\/$/, "") +
        "/public/store/payment-status?sessionId=" +
        encodeURIComponent(sessionId),
      {
        headers: {...await storeRequestIdentity(), "X-Store-Tenant": await getStoreTenant() },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) throw Error();
    const data = await response.json();
    return Response.json(
      {
        folio: data.folio,
        status: data.status,
        subtotal: data.subtotal,
        shippingAmount: data.shippingAmount,
        total: data.total,
        testMode: data.testMode === true,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  } catch {
    return Response.json(
      { error: "No pudimos consultar el pago. Reintenta en unos momentos." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
