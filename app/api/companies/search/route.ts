import { NextResponse, type NextRequest } from "next/server";

// Server-side proxy to the Companies House search API. The API key stays here
// (never sent to the browser). CH uses HTTP Basic auth: key as username, empty
// password.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
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
      `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(
        q,
      )}&items_per_page=20`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
        },
        // Don't cache per-keystroke searches.
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
        title?: string;
        company_number?: string;
        address_snippet?: string;
      }>;
    };

    const items = (data.items ?? [])
      .filter((it) => it.title && it.company_number)
      .map((it) => ({
        name: it.title as string,
        number: it.company_number as string,
        address: it.address_snippet ?? "",
      }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "fetch_failed", items: [] }, { status: 502 });
  }
}
