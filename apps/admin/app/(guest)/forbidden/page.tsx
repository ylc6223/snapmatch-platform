import type { Metadata } from "next";

import { ForbiddenClient } from "./forbidden-client";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Forbidden",
    description: "You don't have permission to access this page.",
  });
}

interface ForbiddenPageProps {
  searchParams?: { next?: string; message?: string };
}

export default function ForbiddenPage(props: ForbiddenPageProps) {
  return <ForbiddenClient searchParams={props.searchParams} />;
}
