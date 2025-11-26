'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'
import {
  LayoutDashboard,
  Lock,
  Users,
  ShieldCheck
} from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Permissions', href: '/permissions', icon: <ShieldCheck size={18} /> },
    { name: 'Roles', href: '/roles', icon: <Lock size={18} /> },
    { name: 'Users', href: '/users', icon: <Users size={18} /> }
  ]

  return (
    <nav className="w-full bg-white border-b shadow-sm px-6 py-3 flex justify-between items-center sticky top-0 z-50">

      {/* Logo */}
      <Link href="/" className="text-xl font-semibold tracking-tight text-blue-600">
        Webzenith Solutions
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-1">
        {links.map((link) => {
          const active = pathname.startsWith(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition 
                ${active ?
                  'bg-blue-50 text-blue-600 shadow-sm' :
                  'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {link.icon}
              {link.name}
            </Link>
          )
        })}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        <LogoutButton />
      </div>
    </nav>
  )
}