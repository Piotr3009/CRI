import { NextResponse, type NextRequest } from "next/server";

// Search Companies House officers (people) by name. Returns each person with a
// stable officer id, date of birth (month/year) and address so the same-named
// people can be told apart. The id is used to look up their appointments.
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
      `https://api.company-information.service.gov.uk/search/officers?q=${encodeURIComponent(
        q,
      )}&items_per_page=10`,
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
        title?: string;
        address_snippet?: string;
        date_of_birth?: { month?: number; year?: number };
        links?: { self?: string };
      }>;
    };

    const items = (data.items ?? [])
      .filter((it) => it.title && it.links?.self)
      .map((it) => {
        // links.self looks like "/officers/{id}/appointments"
        const parts = (it.links!.self as string).split("/").filter(Boolean);
        const id = parts[1] ?? "";
        const dob = it.date_of_birth?.year
          ? `${it.date_of_birth.month ? `${it.date_of_birth.month}/` : ""}${it.date_of_birth.year}`
          : "";
        return {
          id,
          name: it.title as string,
          dob,
          address: it.address_snippet ?? "",
        };
      })
      .filter((o) => o.id);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "fetch_failed", items: [] }, { status: 502 });
  }
}
