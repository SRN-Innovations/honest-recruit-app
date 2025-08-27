"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "./supabase";
import { useRouter } from "next/navigation";

type UserType = "employer" | "candidate" | null;

interface AuthContextType {
  isLoggedIn: boolean;
  userType: UserType;
  isLoading: boolean;
  currentUserId: string | null;
  signOut: () => Promise<void>;
  redirectToDashboard: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  const router = useRouter();

  const resetAuthState = () => {
    console.log("Resetting auth state");
    setIsLoggedIn(false);
    setUserType(null);
    setIsLoading(false);
  };

  // Check if Supabase is ready
  useEffect(() => {
    const checkSupabaseReady = async () => {
      try {
        // Try a simple query to check if Supabase is ready
        await supabase.from("user_profiles").select("count").limit(1);
        console.log("Supabase is ready");
        setIsSupabaseReady(true);
      } catch (error) {
        console.error("Supabase not ready yet:", error);
        // Retry after a short delay
        setTimeout(checkSupabaseReady, 1000);
      }
    };

    checkSupabaseReady();
  }, []);

  useEffect(() => {
    if (!isSupabaseReady) {
      console.log("Waiting for Supabase to be ready...");
      return;
    }

    let mounted = true;

    const fetchUserProfile = async (userId: string) => {
      console.log("Fetching user profile for:", userId);
      try {
        console.log("Making Supabase query for user profile...");
        setCurrentUserId(userId); // Store the current user ID

        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("user_type")
          .eq("id", userId)
          .single();

        console.log("Supabase query response:", { profileData, profileError });

        if (!mounted) {
          console.log("Component unmounted, skipping state updates");
          return;
        }

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          if (profileError.code === "PGRST116") {
            console.log("Profile not found, creating new profile...");
            try {
              const { error: createError } = await supabase
                .from("user_profiles")
                .insert({
                  id: userId,
                  user_type: "candidate",
                });

              console.log("Profile creation response:", { createError });

              if (!mounted) {
                console.log(
                  "Component unmounted after profile creation, skipping state updates"
                );
                return;
              }

              if (createError) {
                console.error("Error creating profile:", createError);
                resetAuthState();
              } else {
                console.log("Profile created successfully");
                setUserType("candidate");
                setIsLoading(false);
              }
            } catch (createError) {
              console.error(
                "Unexpected error during profile creation:",
                createError
              );
              if (mounted) {
                resetAuthState();
              }
            }
          } else {
            console.error("Unexpected profile error:", profileError);
            resetAuthState();
          }
        } else if (profileData) {
          console.log("Profile fetched successfully:", profileData);
          setUserType(profileData.user_type as UserType);
          setIsLoading(false);
        } else {
          console.log("No profile data returned, resetting auth state");
          resetAuthState();
        }
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
        if (mounted) {
          resetAuthState();
        }
      }
    };

    const checkAuthStatus = async () => {
      console.log("Checking auth status...");
      setIsLoading(true);
      try {
        console.log("Getting session from Supabase...");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log(
          "Session check result:",
          session ? "Session exists" : "No session"
        );

        if (!mounted) {
          console.log(
            "Component unmounted during auth check, skipping state updates"
          );
          return;
        }

        if (session) {
          console.log("Session found, setting logged in state");
          setIsLoggedIn(true);
          await fetchUserProfile(session.user.id);
        } else {
          console.log("No session found, setting logged out state");
          resetAuthState();
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        if (mounted) {
          resetAuthState();
        }
      }
    };

    checkAuthStatus();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "Auth state changed:",
        event,
        session ? "Session exists" : "No session"
      );

      if (!mounted) return;

      if (event === "SIGNED_IN" && session) {
        console.log("User signed in, checking if profile fetch is needed...");
        // Only fetch profile if we don't have the user type or if the user ID changed
        if (!userType || session.user.id !== currentUserId) {
          console.log("Profile fetch needed, setting loading state");
          setIsLoading(true);
          setIsLoggedIn(true);
          await fetchUserProfile(session.user.id);
        } else {
          console.log("Profile already fetched, skipping fetch");
          setIsLoggedIn(true);
        }
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
        setIsLoading(true);
        resetAuthState();
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isSupabaseReady, userType]); // Add userType to dependencies

  // Add state to track current user ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Add debug logging for loading state changes
  useEffect(() => {
    console.log("Loading state changed:", isLoading);
  }, [isLoading]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        resetAuthState();
        router.push("/");
      }
    } catch (error) {
      console.error("Error during sign out:", error);
      resetAuthState();
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
        currentUserId,
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
