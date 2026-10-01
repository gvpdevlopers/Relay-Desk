import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/webhooks/smmquality")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const receivedAt = new Date().toISOString();

        try {
          // Read the raw request body.
          const rawBody = await request.text();

          // Capture headers for debugging.
          const headers = Object.fromEntries(
            request.headers.entries(),
          );

          // Try to parse JSON.
          let payload: unknown = rawBody;

          if (rawBody.trim()) {
            try {
              payload = JSON.parse(rawBody);
            } catch {
              console.warn(
                "[SMMQuality Webhook] Body is not valid JSON. Keeping raw body.",
              );
            }
          }

          console.log("========================================");
          console.log("[SMMQuality Webhook] RECEIVED");
          console.log("Received At:", receivedAt);
          console.log("Headers:", headers);
          console.log("Raw Body:", rawBody);
          console.log("Payload:", payload);
          console.log("========================================");

          return Response.json(
            {
              success: true,
              received: true,
              receivedAt,
              payload,
            },
            { status: 200 },
          );
        } catch (error) {
          console.error(
            "[SMMQuality Webhook] ERROR:",
            error,
          );

          return Response.json(
            {
              success: false,
              received: false,
              error: "Failed to process webhook.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});