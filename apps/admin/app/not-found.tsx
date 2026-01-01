import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid h-screen items-center bg-background pb-8 lg:grid-cols-2 lg:pb-0">
      <div className="text-center">
        <p className="text-base font-semibold text-muted-foreground">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl lg:text-7xl">
          Page not found
        </h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-2">
          <Button asChild size="lg">
            <Link href="/dashboard/analytics">Go back home</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href="mailto:support@snapmatch.local">
              Contact support <ArrowRight className="ms-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="hidden lg:block">
        <img src="/admin/images/404.svg" alt="Not found visual" className="object-contain" />
      </div>
    </div>
  );
}
