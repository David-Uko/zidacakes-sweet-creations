INSERT INTO storage.buckets (id, name, public) VALUES ('cake-references', 'cake-references', true);

CREATE POLICY "Authenticated users can upload cake references"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cake-references');

CREATE POLICY "Public can read cake references"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'cake-references');