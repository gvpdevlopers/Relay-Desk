import { createFileRoute } from "@tanstack/react-router";
//import { getOrderStatus } from "@/lib/smmquality/client";
import {
  getOrderStatus,
  getService,
} from "@/lib/smmquality/client";

export const Route = createFileRoute("/api/smmquality/order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();

          const orderId =
            typeof body?.orderId === "string"
              ? body.orderId.trim()
              : "";

          if (!orderId) {
            return Response.json(
              {
                success: false,
                error: "Order ID is required.",
              },
              { status: 400 },
            );
          }

          const order = await getOrderStatus(orderId);

        //   if (order.error) {
        //     return Response.json(
        //       {
        //         success: false,
        //         error: order.error,
        //       },
        //       { status: 404 },
        //     );
        //   }

        if (order.error) {
  return Response.json({
    success: false,
    error: order.error,
  });
}

          return Response.json({
            success: true,
            order: {
              orderId,
              charge: order.charge
                ? Number(order.charge)
                : null,
              startCount: order.start_count
                ? Number(order.start_count)
                : null,
              status: order.status ?? null,
              remains:
                typeof order.remains === "string"
                  ? Number(order.remains)
                  : order.remains ?? null,
              currency: order.currency ?? null,
            },
          });
        } catch (error) {
          console.error(
            "[SMMQuality] Order fetch failed:",
            error,
          );

          return Response.json(
            {
              success: false,
              error: "Unable to fetch order from SMMQuality.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});