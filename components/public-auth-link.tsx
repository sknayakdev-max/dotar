"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function PublicAuthLink() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(Boolean(session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Link href={isSignedIn ? "/dashboard" : "/login"} className="login-link">
      {isSignedIn ? "Dashboard" : "Staff Login"}
    </Link>
  );
}