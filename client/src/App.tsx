import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { getCurrentUser } from "./lib/auth";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Accounts from "@/pages/accounts";
import Users from "@/pages/users";
import Subscriptions from "@/pages/subscriptions";
import Products from "@/pages/products";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";
import DashboardLayout from "@/components/layout/DashboardLayout";

function Router() {
  const [location] = useLocation();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setAuthenticated(!!user);
      } catch (error) {
        setAuthenticated(false);
      }
    };

    checkAuth();
  }, [location]);

  // Show nothing while checking authentication
  if (authenticated === null) {
    return null;
  }

  return (
    <Switch>
      <Route path="/login">
        {authenticated ? <Dashboard /> : <Login />}
      </Route>
      
      {authenticated ? (
        <Switch>
          <Route path="/dashboard">
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </Route>
          <Route path="/accounts">
            <DashboardLayout>
              <Accounts />
            </DashboardLayout>
          </Route>
          <Route path="/users">
            <DashboardLayout>
              <Users />
            </DashboardLayout>
          </Route>
          <Route path="/subscriptions">
            <DashboardLayout>
              <Subscriptions />
            </DashboardLayout>
          </Route>
          <Route path="/products">
            <DashboardLayout>
              <Products />
            </DashboardLayout>
          </Route>
          <Route path="/reports">
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          </Route>
          <Route path="/">
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </Route>
          <Route>
            <DashboardLayout>
              <NotFound />
            </DashboardLayout>
          </Route>
        </Switch>
      ) : (
        <Route>
          <Login />
        </Route>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
