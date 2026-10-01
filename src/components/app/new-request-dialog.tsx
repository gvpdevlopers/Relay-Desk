import { useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { openDuplicates, useDesk } from "@/lib/store";
import {
  CHANNELS,
  CHANNEL_LABEL,
  REQUEST_TYPES,
  TYPE_LABEL,
  type Channel,
  type RequestType,
  type SmmQualityOrderSnapshot,
} from "@/lib/types";

export function NewRequestDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const createRequest = useDesk((s) => s.createRequest);
  const requests = useDesk((s) => s.requests);

  const [orderId, setOrderId] = useState("");
  const [type, setType] =
    useState<RequestType>("refill");
  const [channel, setChannel] =
    useState<Channel>("whatsapp");
  const [notes, setNotes] = useState("");

  const [order, setOrder] =
    useState<SmmQualityOrderSnapshot | null>(
      null,
    );

  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");

  const dupes = useMemo(
    () => openDuplicates(requests, orderId),
    [requests, orderId],
  );

  function reset() {
    setOrderId("");
    setType("refill");
    setChannel("whatsapp");
    setNotes("");
    setOrder(null);
    setError("");
    setLoading(false);
  }

  async function fetchOrder() {
    const id = orderId.trim();

    if (!id) {
      setError("Enter an order ID.");
      return;
    }

    setError("");
    setOrder(null);
    setLoading(true);

    try {
      const response = await fetch(
        "/api/smmquality/order",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            orderId: id,
          }),
        },
      );

      const data = await response.json();

      if (!data.success) {
        setError(
          data.error ??
            "Unable to fetch order.",
        );
        return;
      }

      const apiOrder = data.order;

      setOrder({
        orderId: apiOrder.orderId,
        charge: apiOrder.charge,
        startCount: apiOrder.startCount,
        status: apiOrder.status,
        remains: apiOrder.remains,
        currency: apiOrder.currency,
      });
    } catch (error) {
      console.error(
        "Fetch order failed:",
        error,
      );

      setError(
        "Unable to connect to the order service.",
      );
    } finally {
      setLoading(false);
    }
  }

  function submit() {
    if (!order) {
      setError(
        "Fetch order details first.",
      );
      return;
    }

    const id = createRequest({
      orderId: order.orderId,
      type,
      channel,
      notes,
      smmQualityOrder: order,
    });

    reset();
    onOpenChange(false);
    onCreated(id);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          reset();
        }

        onOpenChange(value);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogTitle>
          New Support Request
        </DialogTitle>

        <DialogDescription>
          Fetch the live order status from
          SMMQuality, then log the customer
          request.
        </DialogDescription>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="order-id">
              Order ID
            </Label>

            <div className="flex gap-2">
              <Input
                id="order-id"
                value={orderId}
                onChange={(event) => {
                  setOrderId(
                    event.target.value,
                  );
                  setError("");
                  setOrder(null);
                }}
                placeholder="e.g. 1305307"
                disabled={loading}
              />

              <Button
                type="button"
                onClick={fetchOrder}
                disabled={
                  loading ||
                  !orderId.trim()
                }
              >
                {loading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Order"
                )}
              </Button>
            </div>
          </div>

          {dupes.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <div className="font-medium">
                Existing open request
              </div>

              <div className="mt-1 text-muted-foreground">
                This order already has an open
                support request. Check the
                existing request before creating
                another one.
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {order && (
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-3 text-sm font-semibold">
                Live SMMQuality Order
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Status
                  </div>

                  <div className="mt-1 font-medium">
                    {order.status ?? "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    Start
                  </div>

                  <div className="mt-1 font-medium">
                    {order.startCount ?? "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    Remains
                  </div>

                  <div className="mt-1 font-medium">
                    {order.remains ?? "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    Charge
                  </div>

                  <div className="mt-1 font-medium">
                    {order.charge ?? "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    Currency
                  </div>

                  <div className="mt-1 font-medium">
                    {order.currency ?? "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Request Type</Label>

              <Select
                value={type}
                onValueChange={(value) =>
                  setType(
                    value as RequestType,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {REQUEST_TYPES.map(
                    (requestType) => (
                      <SelectItem
                        key={requestType}
                        value={requestType}
                      >
                        {
                          TYPE_LABEL[
                            requestType
                          ]
                        }
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Channel</Label>

              <Select
                value={channel}
                onValueChange={(value) =>
                  setChannel(
                    value as Channel,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {CHANNELS.map(
                    (channelOption) => (
                      <SelectItem
                        key={channelOption}
                        value={channelOption}
                      >
                        {
                          CHANNEL_LABEL[
                            channelOption
                          ]
                        }
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="request-notes">
              Notes
            </Label>

            <Textarea
              id="request-notes"
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              placeholder="Describe the customer's issue..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={submit}
              disabled={!order || loading}
            >
              Log Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}