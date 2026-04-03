import { syndicateNextPathFromSearch } from "@/lib/syndicateNextPath";

import { SyndicateSignupForm } from "./signup-form";

type PageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SyndicateSignupPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const nextPath = syndicateNextPathFromSearch(sp.next);
  return <SyndicateSignupForm nextPath={nextPath} />;
}
