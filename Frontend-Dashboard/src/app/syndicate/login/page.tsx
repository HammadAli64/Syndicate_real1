import { syndicateNextPathFromSearch } from "@/lib/syndicateNextPath";

import { SyndicateLoginForm } from "./login-form";

type PageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SyndicateLoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const nextPath = syndicateNextPathFromSearch(sp.next);
  return <SyndicateLoginForm nextPath={nextPath} />;
}
