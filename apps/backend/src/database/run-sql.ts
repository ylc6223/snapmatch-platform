import type { CloudBase } from "@cloudbase/node-sdk";

type CloudBaseModels = CloudBase["models"];

type SqlResult = {
  data?: {
    executeResultList?: Array<Record<string, unknown>>;
  };
};

export async function runSql(
  models: CloudBaseModels,
  sqlTemplate: string,
  params: Record<string, unknown>,
): Promise<Array<Record<string, unknown>>> {
  const client = models as unknown as {
    $runSQL?: (sql: string, args?: Record<string, unknown>) => Promise<SqlResult>;
  };
  if (!client.$runSQL) {
    throw new Error("CloudBase models.$runSQL not available");
  }
  const result = await client.$runSQL(sqlTemplate, params);
  return result.data?.executeResultList ?? [];
}

