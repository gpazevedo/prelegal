import DocSlugClient from "./DocSlugClient";
import { SLUG_TO_TEMPLATE } from "@/lib/docUtils";

// Pre-generate all doc type pages for static export
export function generateStaticParams() {
  return Object.keys(SLUG_TO_TEMPLATE).map((slug) => ({ slug }));
}

export default function DocSlugPage({ params }: { params: { slug: string } }) {
  return <DocSlugClient slug={params.slug} />;
}
