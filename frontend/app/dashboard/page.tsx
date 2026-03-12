"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { ApiError, getCatalog, getSessions, signOut, type CatalogItem, type SessionSummary, type User } from "@/lib/api";
import { getDocRoute, docTypeToRoute } from "@/lib/docUtils";

function DocumentCard({ item }: { item: CatalogItem }) {
  const router = useRouter();
  const route = getDocRoute(item.filename);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-dark-navy)" }}>
          {item.name}
        </h3>
        <p className="mt-1 text-xs leading-relaxed line-clamp-3" style={{ color: "var(--color-gray-text)" }}>
          {item.description}
        </p>
      </div>
      <div className="mt-auto">
        <button
          onClick={() => router.push(route)}
          className="w-full py-2 px-3 rounded-md text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-purple-secondary)" }}
        >
          Create
        </button>
      </div>
    </div>
  );
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr.replace(" ", "T") + (dateStr.includes("T") ? "" : "Z"));
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getParties(session: SessionSummary): { provider: string; customer: string } {
  const f = session.fields as Record<string, string>;
  if (session.doc_type === "mutual_nda") {
    return { provider: f.party1Company || "", customer: f.party2Company || "" };
  }
  return { provider: f.providerCompany || "", customer: f.customerCompany || "" };
}

function MyDocumentCard({ session }: { session: SessionSummary }) {
  const router = useRouter();
  const { provider, customer } = getParties(session);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-dark-navy)" }}>
            {session.doc_name}
          </h3>
          <span
            className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: "#e8f4fd", color: "var(--color-blue-primary)" }}
          >
            Draft
          </span>
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--color-gray-text)" }}>
          Updated {formatRelativeDate(session.updated_at)}
        </p>
        {(provider || customer) && (
          <p className="mt-2 text-xs" style={{ color: "var(--color-dark-navy)" }}>
            {[provider, customer].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className="mt-auto flex gap-2">
        <button
          onClick={() => router.push(`/dashboard/preview?session=${session.session_id}`)}
          className="flex-1 py-1.5 px-3 rounded-md text-xs font-medium border border-gray-300 hover:border-gray-400 transition-colors"
          style={{ color: "var(--color-dark-navy)" }}
        >
          View
        </button>
        <button
          onClick={() => router.push(docTypeToRoute(session.doc_type))}
          className="flex-1 py-1.5 px-3 rounded-md text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-blue-primary)" }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function DashboardContent({ user }: { user: User }) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [sessions, setSessionList] = useState<SessionSummary[]>([]);

  useEffect(() => {
    getCatalog().then(setCatalog);
    getSessions()
      .then(setSessionList)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) router.push("/login");
      });
  }, [router]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--color-dark-navy)" }}
          >
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: "var(--color-dark-navy)" }}>
            Prelegal
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm hidden sm:block" style={{ color: "var(--color-gray-text)" }}>
              {user.email}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--color-blue-primary)" }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* My Documents */}
        {sessions.length > 0 && (
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold" style={{ color: "var(--color-dark-navy)" }}>
                My Documents
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--color-gray-text)" }}>
                Your drafts in progress
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((s) => (
                <MyDocumentCard key={s.session_id} session={s} />
              ))}
            </div>
          </section>
        )}

        {/* Templates */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold" style={{ color: "var(--color-dark-navy)" }}>
              Document Templates
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-gray-text)" }}>
              Start a new document
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog.map((item) => (
              <DocumentCard key={item.filename} item={item} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  return (
    <AuthGuard onUser={setUser}>
      {user && <DashboardContent user={user} />}
    </AuthGuard>
  );
}
