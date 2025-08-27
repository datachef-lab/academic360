import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
// This is imported but not directly used in the component
// It sets up the database shutdown handlers in the Node.js environment
import { setupDatabaseShutdownHandlers } from "@/lib/setup-db-handlers";
import { ToastProvider } from "@/components/ui/toast-provider";
import { Toaster } from "sonner";

// Initialize database shutdown handlers in Node.js environment
// This is wrapped in a try-catch because it will error in
// environments that don't support process listeners
try {
  setupDatabaseShutdownHandlers();
} catch (error) {
  console.warn("Could not set up database shutdown handlers:", error);
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    template: "%s | BESC Student Console",
    default: "BESC Student Console",
  },
  description: "BESC Student Console Landing Page",
  applicationName: "Student Console",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="html">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-screen h-screen`}
        suppressHydrationWarning
      >
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
        <Toaster />
      </body>
    </html>
  );
}
