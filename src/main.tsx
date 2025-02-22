import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReactModal from "react-modal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import App from "./App.tsx";

import "./index.css";

dayjs.extend(utc);
dayjs.extend(timezone);

const queryClient = new QueryClient();

ReactModal.setAppElement("#root");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
