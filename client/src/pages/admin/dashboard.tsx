import { useQuery, useMutation } from "@tanstack/react-query";
import { Book, Order, Category, InventoryHistory, insertBookSchema, insertCategorySchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          <InventoryManager />
        </TabsContent>
        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>
        <TabsContent value="orders">
          <OrderManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InventoryManager() {
  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: lowStockBooks } = useQuery<Book[]>({
    queryKey: ["/api/books/low-stock"],
  });

  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Book deleted",
        description: "The book has been removed from inventory",
      });
    },
  });

  return (
    <div className="space-y-8">
      {lowStockBooks?.length ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Stock Alert</AlertTitle>
          <AlertDescription>
            {lowStockBooks.length} {lowStockBooks.length === 1 ? 'book' : 'books'} below threshold
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Book</h2>
        <AddBookForm />
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Current Inventory</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books?.map((book) => (
              <TableRow key={book.id}>
                <TableCell>{book.title}</TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell>{book.categoryId}</TableCell>
                <TableCell>${(book.price / 100).toFixed(2)}</TableCell>
                <TableCell>{book.stock}</TableCell>
                <TableCell>
                  {book.stock <= book.lowStockThreshold ? (
                    <span className="text-destructive">Low Stock</span>
                  ) : (
                    <span className="text-green-600">In Stock</span>
                  )}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const amount = window.prompt("Enter restock amount:");
                      if (amount) {
                        const newStock = book.stock + parseInt(amount);
                        apiRequest("PATCH", `/api/books/${book.id}`, { stock: newStock });
                        queryClient.invalidateQueries({ queryKey: ["/api/books"] });
                      }
                    }}
                  >
                    Restock
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(book.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function CategoryManager() {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertCategorySchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      form.reset();
      toast({
        title: "Category added",
        description: "The category has been created",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category deleted",
        description: "The category has been removed",
      });
    },
  });

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea {...form.register("description")} />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            Add Category
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(category.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AddBookForm() {
  const { toast } = useToast();
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm({
    resolver: zodResolver(insertBookSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/books", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      form.reset();
      toast({
        title: "Book added",
        description: "The book has been added to inventory",
      });
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input {...form.register("title")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input {...form.register("author")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <select
          {...form.register("categoryId", { valueAsNumber: true })}
          className="w-full p-2 border rounded"
        >
          <option value="">Select a category</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea {...form.register("description")} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (in cents)</Label>
          <Input type="number" {...form.register("price", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input type="number" {...form.register("stock", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
          <Input
            type="number"
            {...form.register("lowStockThreshold", { valueAsNumber: true })}
            defaultValue={5}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="coverUrl">Cover URL</Label>
        <Input {...form.register("coverUrl")} />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        Add Book
      </Button>
    </form>
  );
}

function OrderManager() {
  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Order["status"] }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
  });

  return (
    <Card className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders?.map((order) => (
            <TableRow key={order.id}>
              <TableCell>#{order.id}</TableCell>
              <TableCell>{order.customerName}</TableCell>
              <TableCell>{order.items.length} items</TableCell>
              <TableCell className="capitalize">{order.status}</TableCell>
              <TableCell>
                <select
                  className="border rounded p-1"
                  value={order.status}
                  onChange={(e) =>
                    updateStatusMutation.mutate({
                      id: order.id,
                      status: e.target.value as Order["status"],
                    })
                  }
                  disabled={updateStatusMutation.isPending}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}