// lib/qstash.ts
import { Client } from "@upstash/workflow";

/**
 * Trigger a workflow (QStash) run.
 * Signature intentionally: triggerWorkflow(payload, workflowPath?)
 * so it matches how app/actions/chat.ts calls it in your project.
 *
 * Returns the full trigger result object from Upstash (which includes { workflowRunId }).
 */
export async function triggerWorkflow(payload: any, workflowPath = "/api/workflow") {
  const qClient = new Client({
    token: process.env.QSTASH_TOKEN || undefined,
    baseUrl: process.env.QSTASH_URL || undefined,
  });

  const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:3000`;
  const url = `${BASE_URL}${workflowPath}`;

  // client.trigger expects { url, body, retries?, keepTriggerConfig? }
  const result = await qClient.trigger({
    url,
    body: payload,
    retries: 3,
    keepTriggerConfig: true,
  });

  // result is typically { workflowRunId: string }
  return result;
}
