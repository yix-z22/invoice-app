import { Link, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function Layout() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <aside
        style={{
          width: 220,
          padding: "1rem",
          borderRight: "1px solid #ccc",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link to="/">Dashboard</Link>
          <Link to="/invoices">Invoices</Link>
          <Link to="/import">Import</Link>
        </nav>
        <button onClick={() => supabase.auth.signOut()}
          style={{ marginTop: "auto" }}>
            Logout
        </button>
      </aside>
      <main style={{ flex: 1, padding: "1rem", overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}