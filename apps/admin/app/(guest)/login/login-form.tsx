"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, getApiErrorMessage } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/response";
import { withAdminBasePath } from "@/lib/routing/base-path";

export function LoginForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dashboardPath = useMemo(() => {
    const current = pathname || "/login";
    const replaced = current.replace(/\/login\/?$/, "/dashboard");
    return replaced === current ? "/dashboard" : replaced;
  }, [pathname]);

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (input: { account: string; password: string }) => {
      return apiFetch<ApiResponse<{ user: unknown }>>(withAdminBasePath("/api/auth/login"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ account: input.account, password: input.password }),
      });
    },
    onSuccess: () => {
      const next = searchParams.get("next");
      const redirectTo = next && next.startsWith("/") && !next.startsWith("//") ? next : dashboardPath;
      router.replace(redirectTo);
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "登录失败"));
    },
  });

  const isSubmitting = loginMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    loginMutation.mutate({ account: account.trim(), password: password.trim() });
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="account" className="sr-only">
            Account
          </Label>
          <Input
            id="account"
            name="account"
            type="text"
            autoComplete="username"
            required
            className="w-full"
            placeholder="Account"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label htmlFor="password" className="sr-only">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="text-end">
          <Link href="#" className="ml-auto inline-block text-sm underline">
            Forgot your password?
          </Link>
        </div>
      </div>

      <div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Sign in
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
    </form>
  );
}
