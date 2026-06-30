import "./globals.css";
import { Poppins } from "next/font/google";
import AppShell from "@/components/global/app-shell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "MagicScale Manager",
  description:
    "Manage agreements, clients, and workflows efficiently with MagicScale Manager.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
