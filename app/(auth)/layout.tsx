import "../auth-ui.css";
import "../auth-ui-preloader.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="auth-shell"
      style={{
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        // Used by auth OTP / mono fields
        ["--font-auth-mono" as string]: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
    >
      {children}
    </div>
  );
}
