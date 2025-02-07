import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Redirect } from "wouter";

export default function AuthPage() {
  const { user } = useAuth();
  
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="container mx-auto px-4 py-8 flex">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-serif mb-6">Welcome to Bookstore</h1>
          <AuthTabs />
        </div>
        <div className="flex-1 hidden lg:block ml-8">
          <div 
            className="h-full rounded-lg overflow-hidden"
            style={{
              backgroundImage: "url(https://images.unsplash.com/photo-1585066437548-1507f3f7aa97)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              minHeight: "600px"
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AuthTabs() {
  return (
    <Tabs defaultValue="login">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Register</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <LoginForm />
      </TabsContent>
      <TabsContent value="register">
        <RegisterForm />
      </TabsContent>
    </Tabs>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema.omit({ confirmPassword: true })),
  });

  return (
    <Card className="p-6">
      <form
        onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input {...form.register("username")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input type="password" {...form.register("password")} />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          Login
        </Button>
      </form>
    </Card>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
  });

  return (
    <Card className="p-6">
      <form
        onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input {...form.register("username")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input type="password" {...form.register("password")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input type="password" {...form.register("confirmPassword")} />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          Register
        </Button>
      </form>
    </Card>
  );
}
