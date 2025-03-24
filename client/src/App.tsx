import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import TierListMaker from "@/pages/TierListMaker";
import { StrictMode } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TierListMaker} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </StrictMode>
  );
}

export default App;
