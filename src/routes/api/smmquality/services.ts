import { createFileRoute } from "@tanstack/react-router";
import { getServices } from "@/lib/smmquality/client";

export const Route = createFileRoute(
  "/api/smmquality/services",
)({
  server: {
    handlers: {
      GET: async () => {
        try {
          const services = await getServices();

          return Response.json({
            success: true,
            services,
          });
        } catch (error) {
          console.error(
            "[SMMQuality] Services fetch failed:",
            error,
          );

          return Response.json(
            {
              success: false,
              error:
                "Unable to fetch SMMQuality services.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});