import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  async function cargarPerfil(userId) {
    const { data, error } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error) setPerfil(data);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) cargarPerfil(session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        cargarPerfil(session.user.id);
      } else {
        setPerfil(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  const value = {
    session,
    perfil, // { id, nombre, rol }
    loading,
    login,
    logout,
    esAdmin: perfil?.rol === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
