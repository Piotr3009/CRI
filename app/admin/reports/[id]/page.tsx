import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminReportById } from "@/lib/reports";
import { AdminReportDetail } from "@/components/AdminReportDetail";

export const metadata: Metadata = {
  title: "Admin — Report detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Gate: never render private report data without admin auth.
  if (!isAdminAuthenticated()) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <p className="text-cri-steel">This area is restricted.</p>
        <Link href="/admin" className="btn-primary mt-4">
          Go to admin sign in
        </Link>
      </div>
    );
  }

  const report = await getAdminReportById(params.id);
  if (!report) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm font-medium text-cri-steel hover:text-cri-green"
      >
        ← Back to moderation queue
      </Link>
      <div className="mt-4">
        <AdminReportDetail report={report} />
      </div>
    </div>
  );
}
