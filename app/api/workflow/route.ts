// app/api/workflow/route.ts
import { serve } from "@upstash/workflow/nextjs";

export const { POST } = serve<{ prompt?: string }>(async (context) => {
  // Use requestPayload per Upstash docs:
  const payload = context.requestPayload as { prompt?: string } | undefined;

  // Example step(s) — put your workflow logic inside context.run steps
  const result = await context.run("step-1", async () => {
    // Do something with payload
    return { ok: true, received: payload?.prompt ?? null };
  });

  // Optionally run other steps
  await context.run("step-2", async () => {
    // any follow-up logic
  });

  // Return something (optional)
  return new Response(JSON.stringify({ success: true, result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
