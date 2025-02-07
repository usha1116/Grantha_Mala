
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Order } from "@shared/schema";

export default function OrderHistory() {
  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders/my-orders"],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders?.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">Order #{order.id}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="mt-2">Status: <span className="font-medium">{order.status}</span></p>
                <p>Payment: <span className="font-medium">{order.paymentMethod}</span></p>
                <p>Total: <span className="font-medium">${(order.totalAmount / 100).toFixed(2)}</span></p>
              </div>
              <div className="text-right">
                <p className="text-sm">Deliver to:</p>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-muted-foreground">{order.address}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
