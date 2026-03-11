"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { getCatalog, signOut, type CatalogItem, type User } from "@/lib/api";
import { getDocRoute } from "@/lib/docUtils";

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

function DashboardContent({ user }: { user: User }) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  useEffect(() => {
    getCatalog().then(setCatalog);
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between"
      >
        <h1 className="text-lg font-bold" style={{ color: "var(--color-dark-navy)" }}>
          Prelegal
        </h1>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm" style={{ color: "var(--color-gray-text)" }}>
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
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-dark-navy)" }}>
            Document Templates
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-gray-text)" }}>
            Choose a document type to get started
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map((item) => (
            <DocumentCard key={item.filename} item={item} />
          ))}
        </div>
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
