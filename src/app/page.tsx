import { Suspense } from "react";
import { Dashboard } from "@/components/Dashboard";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="wrap">
      <Suspense fallback={<div className="empty"><b>Loading the ledger…</b>Fetching changes and today&apos;s tasks.</div>}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
