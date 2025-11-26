"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { LoginInput, RegisterInput } from "../lib/schemas";

//
// 🔹 Get logged-in user (auto sync with Supabase)
//
export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user || null;
    },
    staleTime: 1000 * 60 * 5,
  });
}

//
// 🔹 Register new user
//
export function useSignUp() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterInput) => {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            full_name: payload.fullName,
            username: payload.username,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth", "user"] });
    },
  });
}

//
// 🔹 Sign in user
//
export function useSignIn() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoginInput) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      });

      if (error) throw error;

      console.log("SESSION:", await supabase.auth.getSession());
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth", "user"] });
    },
  });
}

//
// 🔹 Logout
//
export function useSignOut() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth", "user"] });
    },
  });
}