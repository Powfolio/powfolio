import { Inter, JetBrains_Mono } from "next/font/google";
import "../auth-ui.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--font-auth-mono",
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${inter.className} ${jetbrains.variable}`}>{children}</div>;
}
