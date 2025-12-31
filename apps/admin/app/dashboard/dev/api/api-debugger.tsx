"use client";

import * as React from "react";
import { IconPlayerPlay, IconRefresh } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiTemplate = {
  id: string;
  title: string;
  description?: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
};

type ApiMode = "proxy" | "direct";

const STORAGE_KEY = {
  mode: "snapmatch.admin.api-debugger.mode",
  directBaseUrl: "snapmatch.admin.api-debugger.directBaseUrl",
  lastTemplateId: "snapmatch.admin.api-debugger.lastTemplateId"
};

const templates: ApiTemplate[] = [
  {
    id: "auth.login",
    title: "登录（BFF）",
    description: "写入 HttpOnly Cookie：access/refresh token",
    method: "POST",
    path: "/api/auth/login",
    body: { account: "admin", password: "admin" }
  },
  {
    id: "auth.me",
    title: "当前用户（BFF）",
    description: "读取 cookie 并转发后端 /api/v1/auth/me",
    method: "GET",
    path: "/api/auth/me"
  },
  {
    id: "secure.adminOnly",
    title: "示例：admin-only（后端 /secure/admin-only）",
    description: "通过 catch-all 代理到 /api/v1/secure/admin-only（需要登录）",
    method: "GET",
    path: "/api/secure/admin-only"
  },
  {
    id: "projects.list",
    title: "项目列表（占位：后端未实现时会 404）",
    method: "GET",
    path: "/api/projects"
  },
  {
    id: "assets.sign",
    title: "上传签名（占位：后端未实现时会 404）",
    method: "POST",
    path: "/api/assets/sign",
    body: { filename: "example.jpg", contentType: "image/jpeg" }
  },
  {
    id: "swagger.ui",
    title: "Swagger UI（只读入口）",
    description: "打开 /api/docs（将转发到后端 /api/v1/docs）",
    method: "GET",
    path: "/api/docs"
  }
];

function safeJsonParse(input: string) {
  try {
    return { ok: true as const, value: JSON.parse(input) as unknown };
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid json";
    return { ok: false as const, message };
  }
}

function stringifyBody(value: unknown) {
  if (value === undefined) return "";
  return JSON.stringify(value, null, 2);
}

export function ApiDebugger() {
  const [mode, setMode] = React.useState<ApiMode>("proxy");
  const [directBaseUrl, setDirectBaseUrl] = React.useState("http://localhost:3002");
  const [templateId, setTemplateId] = React.useState(templates[0]?.id ?? "auth.me");

  const activeTemplate = React.useMemo(
    () => templates.find((item) => item.id === templateId) ?? templates[0],
    [templateId]
  );

  const [method, setMethod] = React.useState<HttpMethod>(activeTemplate?.method ?? "GET");
  const [path, setPath] = React.useState(activeTemplate?.path ?? "/api/auth/me");
  const [bodyText, setBodyText] = React.useState<string>(stringifyBody(activeTemplate?.body));

  const [isRunning, setIsRunning] = React.useState(false);
  const [responseStatus, setResponseStatus] = React.useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = React.useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedMode = localStorage.getItem(STORAGE_KEY.mode);
    if (storedMode === "proxy" || storedMode === "direct") setMode(storedMode);
    const storedBase = localStorage.getItem(STORAGE_KEY.directBaseUrl);
    if (storedBase) setDirectBaseUrl(storedBase);
    const storedTemplateId = localStorage.getItem(STORAGE_KEY.lastTemplateId);
    if (storedTemplateId && templates.some((item) => item.id === storedTemplateId)) {
      setTemplateId(storedTemplateId);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY.mode, mode);
  }, [mode]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY.directBaseUrl, directBaseUrl);
  }, [directBaseUrl]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY.lastTemplateId, templateId);
  }, [templateId]);

  React.useEffect(() => {
    if (!activeTemplate) return;
    setMethod(activeTemplate.method);
    setPath(activeTemplate.path);
    setBodyText(stringifyBody(activeTemplate.body));
  }, [activeTemplate]);

  const resolvedUrl = React.useMemo(() => {
    const trimmed = path.trim() || "/";
    if (mode === "proxy") return trimmed;
    const base = directBaseUrl.trim().replace(/\/$/, "");
    return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  }, [directBaseUrl, mode, path]);

  const canSendBody = method !== "GET" && method !== "DELETE";

  const run = React.useCallback(async () => {
    setIsRunning(true);
    setErrorMessage(null);
    setResponseStatus(null);
    setResponseHeaders({});
    setResponseBody("");

    try {
      const headers = new Headers();
      headers.set("accept", "application/json, text/plain, */*");

      let body: string | undefined;
      if (canSendBody && bodyText.trim().length > 0) {
        const parsed = safeJsonParse(bodyText);
        if (!parsed.ok) {
          setErrorMessage(`请求体 JSON 解析失败：${parsed.message}`);
          return;
        }
        body = JSON.stringify(parsed.value);
        headers.set("content-type", "application/json");
      }

      const response = await fetch(resolvedUrl, {
        method,
        headers,
        body,
        cache: "no-store"
      });

      const headerEntries: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headerEntries[key] = value;
      });

      const contentType = response.headers.get("content-type") ?? "";
      const raw = contentType.includes("application/json")
        ? JSON.stringify(await response.json().catch(() => null), null, 2)
        : await response.text().catch(() => "");

      setResponseStatus(response.status);
      setResponseHeaders(headerEntries);
      setResponseBody(raw);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message.trim()
          : "unknown error";
      setErrorMessage(`请求失败：${message}`);
    } finally {
      setIsRunning(false);
    }
  }, [bodyText, canSendBody, method, resolvedUrl]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>API 调试模板</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>调用方式</Label>
            <RadioGroup
              value={mode}
              onValueChange={(value) => setMode(value as ApiMode)}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="proxy" id="api-mode-proxy" />
                <Label htmlFor="api-mode-proxy">通过 Admin `/api/*` 代理（推荐）</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="direct" id="api-mode-direct" />
                <Label htmlFor="api-mode-direct">直连后端（需 CORS 允许当前 Origin）</Label>
              </div>
            </RadioGroup>
          </div>

          {mode === "direct" ? (
            <div className="space-y-2">
              <Label htmlFor="direct-base-url">后端 Base URL</Label>
              <Input
                id="direct-base-url"
                value={directBaseUrl}
                onChange={(e) => setDirectBaseUrl(e.target.value)}
                placeholder="http://localhost:3002"
              />
              <p className="text-muted-foreground text-xs">
                直连示例：`http://localhost:3002/api/v1/docs`、`http://localhost:3002/api/v1/auth/me`
              </p>
            </div>
          ) : null}

          <Separator />

          <div className="grid grid-cols-1 gap-2">
            {templates.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={item.id === templateId ? "default" : "secondary"}
                className="justify-start"
                onClick={() => setTemplateId(item.id)}
              >
                {item.title}
              </Button>
            ))}
          </div>

          {activeTemplate?.description ? (
            <p className="text-muted-foreground text-sm">{activeTemplate.description}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="lg:col-span-8">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>请求 / 响应</CardTitle>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={run} disabled={isRunning}>
              <IconPlayerPlay className="mr-2 size-4" />
              发送
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResponseStatus(null);
                setResponseHeaders({});
                setResponseBody("");
                setErrorMessage(null);
              }}
              disabled={isRunning}
            >
              <IconRefresh className="mr-2 size-4" />
              清空
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <Label>Method</Label>
              <Input value={method} readOnly />
            </div>
            <div className="lg:col-span-9">
              <Label htmlFor="api-path">URL / Path</Label>
              <Input
                id="api-path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/auth/me 或 http://localhost:3002/api/v1/auth/me"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                当前实际请求：<span className="font-mono">{resolvedUrl}</span>
              </p>
            </div>
          </div>

          {canSendBody ? (
            <div className="space-y-2">
              <Label htmlFor="api-body">Body (JSON)</Label>
              <Textarea
                id="api-body"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder='{"example": true}'
                className="min-h-40 font-mono text-xs"
              />
            </div>
          ) : null}

          {errorMessage ? (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
              {errorMessage}
            </div>
          ) : null}

          <Separator />

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label>响应状态</Label>
              <span className="font-mono text-sm">{responseStatus ?? "-"}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Label>Headers</Label>
                <Textarea
                  value={Object.keys(responseHeaders).length ? stringifyBody(responseHeaders) : ""}
                  readOnly
                  className="min-h-40 font-mono text-xs"
                />
              </div>
              <div className="lg:col-span-7">
                <Label>Body</Label>
                <Textarea value={responseBody} readOnly className="min-h-40 font-mono text-xs" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
