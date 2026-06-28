import { NextResponse, type NextRequest } from "next/server";
import { buildCompanyAtom } from "@/lib/level2/atom";

// Lazy endpoint: the atom makes several Companies House calls, so it is only
// built when the user explicitly asks for it on the company report page.
export async function GET(request: NextRequest) {
  const number = request.nextUrl.searchParams.get("number")?.trim() ?? "";
  if (!number) {
    return NextResponse.json({ error: "missing_number" }, { status: 400 });
  }

  const atom = await buildCompanyAtom(number);
  if (!atom) {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
  return NextResponse.json(atom);
}
