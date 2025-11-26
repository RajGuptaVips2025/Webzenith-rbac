import "./globals.css";
import Providers from '../components/Providers'
import Navbar from "../components/Navbar";
import { RBACProvider } from "./rbac/rbacContext";

export const metadata = {
  title: "RBAC System",
  description: "Webzenith Solutions Assignment",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <Providers>
          <Navbar />
          <RBACProvider>
            {children}
          </RBACProvider>
        </Providers>
      </body>
    </html>
  );
}