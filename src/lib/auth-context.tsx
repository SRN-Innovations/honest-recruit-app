"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "./supabase";
import { useRouter } from "next/navigation";

type UserType = "employer" | "candidate" | null;

interface AuthContextType {
  isLoggedIn: boolean;
  userType: UserType;
  isLoading: boolean;
  signOut: () => Promise<void>;
  redirectToDashboard: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setIsLoggedIn(true);

          // Get user profile info
          const { data: profileData, error: profileError } = await supabase
            .from("user_profiles")
            .select("user_type")
            .eq("id", session.user.id)
            .single();

          if (!profileError && profileData) {
            setUserType(profileData.user_type as UserType);
          }
        } else {
          setIsLoggedIn(false);
          setUserType(null);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Set up auth state change subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setIsLoggedIn(true);

        // Get user profile info
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("user_type")
          .eq("id", session.user.id)
          .single();

        if (!profileError && profileData) {
          setUserType(profileData.user_type as UserType);
        }
      } else if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        setUserType(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/");
    }
  };

  const redirectToDashboard = () => {
    if (userType === "employer") {
      router.push("/employer/dashboard");
    } else if (userType === "candidate") {
      router.push("/candidate/dashboard");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userType,
        isLoading,
        signOut,
        redirectToDashboard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
