import { Suspense } from "react";
import type { Metadata } from "next";
import { verifyAdminSession } from "@/lib/admin-auth";
import { AdminRoot } from "@/components/admin/admin-root";

export const metadata: Metadata = {
  title: "Admin · Specimen Controller",
  description: "Internal publication and site controller for BeeBombshell.",
  robots: {
    index: false,
    follow: false,
  },
};

async function AdminContent() {
  const isAuthenticated = await verifyAdminSession();
  return <AdminRoot initialAuthenticated={isAuthenticated} />;
}

export default function AdminPage() {
  return (
    <main className="min-h-screen">
      <Suspense
        fallback={
          <div className="min-h-[80vh] flex items-center justify-center text-xs font-mono text-[var(--mut)]">
            <div className="w-5 h-5 border-2 border-[var(--fg)] border-t-transparent rounded-full animate-spin mr-3" />
            <span>Loading Specimen Controller...</span>
          </div>
        }
      >
        <AdminContent />
      </Suspense>
    </main>
  );
}
