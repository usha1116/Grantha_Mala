import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-serif mb-6">Your Cart</h1>
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-serif mb-6">Your Cart</h1>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Card>
              {items.map((item) => (
                <div
                  key={item.book.id}
                  className="flex items-center gap-4 p-4 border-b last:border-0"
                >
                  <div className="relative aspect-[3/4] w-20">
                    <img
                      src={item.book.coverUrl}
                      alt={item.book.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.book.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.book.author}
                    </p>
                    <p className="mt-1 font-semibold">
                      ${(item.book.price / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateQuantity(item.book.id, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.book.id, parseInt(e.target.value))
                      }
                      className="w-16 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateQuantity(item.book.id, item.quantity + 1)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.book.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
          <div className="lg:col-span-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
                <Button className="w-full mt-4" size="lg">
                  Proceed to Checkout
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => clearCart()}
                >
                  Clear Cart
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
