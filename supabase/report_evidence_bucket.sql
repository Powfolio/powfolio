-- Private report evidence bucket.
-- Safe to run even if you already ran admin_and_reports.sql.

insert into storage.buckets (id, name, public)
values ('report-evidence', 'report-evidence', false)
on conflict (id) do update set public = false;

drop policy if exists report_evidence_no_public on storage.objects;
create policy report_evidence_no_public on storage.objects
  for select using (bucket_id = 'report-evidence' and false);

drop policy if exists report_evidence_no_insert on storage.objects;
create policy report_evidence_no_insert on storage.objects
  for insert with check (bucket_id = 'report-evidence' and false);

drop policy if exists report_evidence_no_update on storage.objects;
create policy report_evidence_no_update on storage.objects
  for update using (bucket_id = 'report-evidence' and false);

drop policy if exists report_evidence_no_delete on storage.objects;
create policy report_evidence_no_delete on storage.objects
  for delete using (bucket_id = 'report-evidence' and false);
