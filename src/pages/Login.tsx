import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";

export default function Login() {
  const { session, loading } = useAuth();

  if (loading) return <p>Loading...</p>
  if (session) return <Navigate to="/" replace />;

  const handleGoogleLogin = () => {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  return <div>
    <h1> Invoice App </h1>
    <button onClick={handleGoogleLogin}>Sign in with Google</button>
  </div>
}