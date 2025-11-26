'use client'

import { useSignOut } from "../hooks/useSignOut"

export default function LogoutButton() {
  const { mutate, isPending } = useSignOut()

  return (
    <button
      onClick={() => mutate()}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
    >
      {isPending ? "Logging out..." : "Logout"}
    </button>
  )
}
