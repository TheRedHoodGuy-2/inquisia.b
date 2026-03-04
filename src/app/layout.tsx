import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import FloatingAssistantWrapper from "@/components/FloatingAssistantWrapper";
import { InquisiaLogo, ElaraLogo } from "@/components/Logos";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inquisia Babcock",
  description: "Academic publishing and discovery platform for Babcock University",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await getSession();
  const user = session?.user;

  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col`}>
        <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center gap-2">
                  <InquisiaLogo variant="blue" className="w-8 h-8" />
                  <Link href="/" className="text-xl font-bold tracking-tight text-blue-800">
                    INQUISIA
                  </Link>
                </div>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                  <Link href="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Home
                  </Link>
                  <Link href="/projects" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Discover
                  </Link>
                  {user && (
                    <Link href="/elara" className="border-transparent text-violet-600 hover:border-violet-400 hover:text-violet-700 inline-flex items-center gap-1.5 px-1 pt-1 border-b-2 text-sm font-semibold">
                      <div className="inline-flex items-center justify-center w-4 h-4 bg-gradient-to-br from-violet-600 to-indigo-600 rounded overflow-hidden p-0.5">
                        <ElaraLogo variant="light" className="w-full h-full" />
                      </div>
                      Elara
                    </Link>
                  )}
                  {user && user.role === 'student' && (
                    <Link href="/upload" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Submit Project
                    </Link>
                  )}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                {user ? (
                  <>
                    <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                      Dashboard
                    </Link>
                    <Link href={`/profile/${user.id}`} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                      Profile
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        Admin Panel
                      </Link>
                    )}
                    <NotificationBell />
                    <LogoutButton />
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                      Log in
                    </Link>
                    <Link href="/register" className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-grow">
          {children}
        </main>
        <FloatingAssistantWrapper user={user} />
      </body>
    </html>
  );
}
