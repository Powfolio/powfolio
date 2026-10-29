import { createServiceClient } from "@/lib/supabase/admin";

type Enquiry = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export default async function EnquiriesPage() {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("contact_enquiries")
    .select("id, name, email, message, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data as Enquiry[] | null) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Enquiries</h1>
        <p className="mt-1 text-sm text-foreground-muted">Messages sent from the contact form.</p>
      </div>
      {error && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          Could not load enquiries. Run the contact_enquiries SQL if the table is missing.
        </div>
      )}
      {rows.length === 0 && !error && (
        <div className="rounded-xl border border-border p-4 text-sm text-foreground-subtle">No messages yet.</div>
      )}
      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{row.name}</p>
              <p className="text-xs text-foreground-subtle">{new Date(row.created_at).toLocaleString()}</p>
            </div>
            <a href={`mailto:${row.email}`} className="mt-1 block text-xs text-primary">{row.email}</a>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground-muted">{row.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
