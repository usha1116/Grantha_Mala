import { Book } from "@shared/schema";
import { Card, CardContent, CardFooter } from "./card";
import { Button } from "./button";
import { useCart } from "@/hooks/use-cart";

export function BookCard({ book }: { book: Book }) {
  const { addToCart } = useCart();

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[3/4]">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="object-cover w-full h-full"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-1">{book.title}</h3>
        <p className="text-sm text-muted-foreground">{book.author}</p>
        <p className="mt-2 text-sm line-clamp-2">{book.description}</p>
        <p className="mt-2 font-semibold">
          ${(book.price / 100).toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full"
          onClick={() => addToCart(book)}
          disabled={book.stock === 0}
        >
          {book.stock > 0 ? "Add to Cart" : "Out of Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
}
