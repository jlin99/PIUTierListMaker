import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import TierListMaker from "@/pages/TierListMaker";
import { StrictMode } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import type { DropResult } from "react-beautiful-dnd";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TierListMaker} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const handleDragEnd = (result: DropResult) => {
    // This will be implemented in the TierListMaker component
    console.log('Drag ended', result);
  };

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Router />
          <Toaster />
        </DragDropContext>
      </QueryClientProvider>
    </StrictMode>
  );
}

export default App;
