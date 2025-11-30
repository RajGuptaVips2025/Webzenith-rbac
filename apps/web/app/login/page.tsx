"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSignIn } from "../../hooks/useAuth";
import { LoginInput, loginSchema } from "../../lib/schemas";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { waitForCookie } from "../../utils/waitForCookie";

export default function LoginPage() {
  const router = useRouter();
  const { mutateAsync, isPending, error } = useSignIn();
  const [showPassword, setShowPassword] = useState(false);

  const [defaultRole, setDefaultRole] = useState<string>("");

  useEffect(() => {
    async function loadRoles() {
      const res = await fetch("/api/roles");
      const json = await res.json();

      if (!json.roles || json.roles.length === 0) return;

      const preferred =
        json.roles.find((r: any) =>
          r.name.toLowerCase().includes("sde")
        ) ||
        json.roles.find((r: any) =>
          r.name.toLowerCase().includes("employee")
        ) ||
        json.roles.find((r: any) =>
          r.name.toLowerCase().includes("user")
        ) ||
        json.roles[0]; 

      setDefaultRole(preferred.id);
    }

    loadRoles();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    const result = await mutateAsync(data);

    if (result?.session) {
      // await fetch("/api/auth/set-cookie", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
        
      //   body: JSON.stringify({ session: result.session }),
      // });

       await fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ session: result.session }),
      });

      await fetch("/api/auth/create-app-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: result.session.user.id,
          name: result.session.user.user_metadata.full_name ?? "",
          email: result.session.user.email,
          roleId: defaultRole, 
        }),
      });

      // await fetch("/api/auth/create-app-user", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     id: result.session.user.id,
      //     name: result.session.user.user_metadata.full_name ?? "",
      //     email: result.session.user.email,
      //     roleId: defaultRole, 
      //   }),
      // });

      await waitForCookie("sb-access-token", 2000);

      router.replace("/");
    }
  }

  if (!defaultRole) return (
    <div className="flex justify-center items-center h-screen text-lg">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border">

        <h1 className="text-3xl font-bold text-center mb-2">Welcome Back 👋</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* EMAIL */}
          <div>
            <label>Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                className="w-full border rounded-lg pl-10 pr-3 py-2"
                {...register("email")}
                placeholder="Enter your email"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div>
            <label>Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />

              <input
                type={showPassword ? "text" : "password"}
                className="w-full border rounded-lg pl-10 pr-10 py-2"
                {...register("password")}
                placeholder="Enter your password"
              />

              <button
                type="button"
                className="absolute right-3 top-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-blue-600 text-white rounded-lg"
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>

          {error && (
            <p className="text-center text-red-500 mt-2">{error.message}</p>
          )}
        </form>

        <p className="mt-6 text-center">
          Don’t have an account?{" "}
          <a href="/register" className="text-blue-600">Create one</a>
        </p>

      </div>
    </div>
  );
}