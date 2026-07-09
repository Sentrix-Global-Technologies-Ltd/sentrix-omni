import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { OrganizationProvider } from "./context/OrganizationContext.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.ts";
import { ToastProvider } from "./components/shared/toast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <OrganizationProvider>
                <App />
              </OrganizationProvider>
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>,
);
