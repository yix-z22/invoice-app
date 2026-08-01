import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Layout } from "./pages/Layout";
import Invoices from "./pages/Invoices";
import Import from "./pages/Import";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import InvoiceForm from "./pages/InvoiceForm";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoice/new" element={<InvoiceForm />} />
              <Route path="/invoice/:id" element={<InvoiceForm />} />
              <Route path="/import" element={<Import />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
