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

// A deploy replaces the hashed chunk files; a tab on the old build then fails
// to load them. Reload once to pick up the new build (guarded against loops).
window.addEventListener("vite:preloadError", () => {
  try {
    if (sessionStorage.getItem("sentrix:chunk-reload")) return;
    sessionStorage.setItem("sentrix:chunk-reload", "1");
  } catch {
    return;
  }
  window.location.reload();
});

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
