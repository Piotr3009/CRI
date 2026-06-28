import { NextResponse, type NextRequest } from "next/server";

// List the companies a given officer is/was appointed to. Used as step two of
// the "find a company by director name" flow. Deduplicated by company number
// (one person can hold several roles in the same company).
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ items: [] });
  }

  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "not_configured", items: [] },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(
      `https://api.company-information.service.gov.uk/officers/${encodeURIComponent(
        id,
      )}/appointments?items_per_page=50`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
        },
        cache: "no-store",
      },
    );

    if (res.status === 429) {
      return NextResponse.json(
        { error: "rate_limited", items: [] },
        { status: 429 },
      );
    }
    if (!res.ok) {
      return NextResponse.json({ error: "upstream", items: [] }, { status: 502 });
    }

    const data = (await res.json()) as {
      items?: Array<{
        appointed_to?: { company_name?: string; company_number?: string };
        address?: { locality?: string; postal_code?: string };
      }>;
    };

    const seen = new Set<string>();
    const items: Array<{ name: string; number: string; address: string }> = [];
    for (const it of data.items ?? []) {
      const number = it.appointed_to?.company_number;
      const name = it.appointed_to?.company_name;
      if (!number || !name || seen.has(number)) continue;
      seen.add(number);
      const address = [it.address?.locality, it.address?.postal_code]
        .filter(Boolean)
        .join(", ");
      items.push({ name, number, address });
    }

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "fetch_failed", items: [] }, { status: 502 });
  }
}
