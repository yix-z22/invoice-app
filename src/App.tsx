import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Layout } from "./pages/Layout";
import Import from "./pages/Import";

function Placeholder({ name }: { name: string }) {
  return <h1>{name}</h1>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Placeholder name="Login" />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Placeholder name="Dashboard" />} />
              <Route path="/invoices" element={<Placeholder name="Invoices" />} />
              <Route path="/invoice/new" element={<Placeholder name="New Invoice" />} />
              <Route path="/invoice/:id" element={<Placeholder name="Edit Invoice" />} />
              <Route path="/import" element={<Import />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}