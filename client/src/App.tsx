import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { CartProvider } from "./hooks/use-cart";
import { ProtectedRoute } from "./lib/protected-route";
import { Navbar } from "./components/navbar";
import { useAuth } from "@/hooks/use-auth";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CartPage from "@/pages/cart-page";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/admin/dashboard";

function AdminRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user } = useAuth();
  if (!user?.isAdmin) return <Redirect to="/" />;
  return <ProtectedRoute path="/admin" component={Component} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/cart" component={CartPage} />
      <AdminRoute component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Router />
            </main>
          </div>
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;