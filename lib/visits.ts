import { prisma } from "@/lib/db";

/** UTC day key in YYYY-MM-DD form (the VisitStat primary key). */
export function visitDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Increment today's aggregate visit counter. Aggregate only — no personal data. */
export async function incrementVisit(): Promise<void> {
  const day = visitDayKey();
  await prisma.visitStat.upsert({
    where: { day },
    create: { day, count: 1 },
    update: { count: { increment: 1 } },
  });
}

export type VisitStats = {
  total: number;
  today: number;
  recent: { day: string; count: number }[];
};

/** Total visits, today's visits, and the most recent `days` daily rows. */
export async function getVisitStats(days = 7): Promise<VisitStats> {
  const [agg, recent] = await Promise.all([
    prisma.visitStat.aggregate({ _sum: { count: true } }),
    prisma.visitStat.findMany({ orderBy: { day: "desc" }, take: days }),
  ]);

  const today = visitDayKey();
  return {
    total: agg._sum.count ?? 0,
    today: recent.find((r) => r.day === today)?.count ?? 0,
    recent,
  };
}
