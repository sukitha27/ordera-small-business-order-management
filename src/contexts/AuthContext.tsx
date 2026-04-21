import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";
import { dict } from "@/lib/i18n";

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  language: Lang;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  business: Business | null;
  loading: boolean;
  lang: Lang;
  t: (key: keyof typeof dict.en) => string;
  setLang: (l: Lang) => void;
  refreshBusiness: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Lang>("en");

  const loadBusiness = async (uid: string) => {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();
    if (data) {
      setBusiness(data as unknown as Business);
      setLangState((data.language as Lang) || "en");
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadBusiness(sess.user.id), 0);
      } else {
        setBusiness(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadBusiness(sess.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const setLang = async (l: Lang) => {
    setLangState(l);
    if (business) {
      await supabase.from("businesses").update({ language: l }).eq("id", business.id);
      setBusiness({ ...business, language: l });
    }
  };

  const t = (key: keyof typeof dict.en) => dict[lang][key] ?? dict.en[key] ?? String(key);

  const refreshBusiness = async () => {
    if (user) await loadBusiness(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBusiness(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, business, loading, lang, t, setLang, refreshBusiness, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}