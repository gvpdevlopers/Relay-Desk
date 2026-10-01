import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/test-smmquality-orders")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const response = await fetch(
            "https://www.smmquality.com/secure-admin/orders?type=all&page=1&page_size=1",
            {
              method: "GET",
              redirect: "manual",
            },
          );

          const body = await response.text();

          return Response.json({
            httpStatus: response.status,
            redirected:
              response.status >= 300 && response.status < 400,
            location: response.headers.get("location"),
            contentType: response.headers.get("content-type"),
            bodyPreview: body.slice(0, 500),
          });
        } catch (error) {
          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});             