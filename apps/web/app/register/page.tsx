'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useSignUp } from '../../hooks/useAuth'
import { RegisterInput, registerSchema } from '../../lib/schemas'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter()
  const { mutateAsync, isPending, error } = useSignUp();

  const [roles, setRoles] = useState<any[]>([])
  const [defaultRole, setDefaultRole] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function loadRoles() {
      const res = await fetch("/api/roles");
      const json = await res.json();

      const roles = Array.isArray(json.roles) ? json.roles : (json?.roles ?? []);

      if (!roles.length) {
        console.warn("No roles returned from /api/roles", json);
        return;
      }

      const isHRName = (name: string | undefined) => {
        if (!name) return false;
        return /\bhr\b/i.test(name); 
      };

      const preferred =
        roles.find((r: any) => isHRName(r.name)) ||
        roles.find((r: any) => String(r.name || "").toLowerCase().includes("sde")) ||
        roles.find((r: any) => String(r.name || "").toLowerCase().includes("employee")) ||
        roles.find((r: any) => String(r.name || "").toLowerCase().includes("user")) ||
        roles[0];

      if (!preferred?.id) {
        console.warn("Preferred role has no id — roles payload:", roles);
        setDefaultRole(roles[0]?.id);
        return;
      }

      setDefaultRole(preferred.id);
    }


    loadRoles()
  }, [])

  const { register, handleSubmit, formState: { errors } } =
    useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterInput) {
    const result = await mutateAsync(data)

    if (result?.user) {
      await fetch("/api/auth/create-app-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: result.user.id,
          name: data.fullName,
          email: data.email,
          roleId: defaultRole          
        })
      })
    }

    router.push("/login")
  }

  if (!defaultRole) return <p>Loading roles...</p>

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-200">

        {/* HEADING */}
        <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-center text-gray-600 mb-8">
          Begin using the platform with full control
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* FULL NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 outline-none
                           focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                {...register('fullName')}
                placeholder="Enter your full name"
              />
            </div>
            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
          </div>

          {/* USERNAME */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 outline-none
                           focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                {...register('username')}
                placeholder="Choose a username"
              />
            </div>
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 outline-none
                           focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                {...register('email')}
                placeholder="Enter your email"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />

              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2 outline-none
                           focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                {...register('password')}
                placeholder="Choose a strong password"
              />

              <button
                type="button"
                className="absolute right-3 top-3 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium 
                       hover:bg-blue-700 transition disabled:bg-blue-300"
          >
            {isPending ? 'Creating account...' : 'Create Account'}
          </button>

          {error && (
            <p className="text-red-600 text-center text-sm mt-2">
              {(error as any).message}
            </p>
          )}
        </form>

        {/* FOOTER */}
        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">Login</a>
        </p>

      </div>
    </div>
  )
}