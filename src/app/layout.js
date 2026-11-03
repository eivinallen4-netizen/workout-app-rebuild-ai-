import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: { default: "Workout Planner", template: "%s · Workout Planner" },
  description: "Your personal AI workout plan and training tracker.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d11" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
