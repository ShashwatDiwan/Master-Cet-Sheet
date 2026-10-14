# Supabase Storage browser spike

Run this before releasing the reader UI.

1. Create a **private** `cet-resources` bucket, limit it to `application/pdf`
   and 50 MiB, and upload one real PDF.
2. Configure only the backend with `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`. Never set the
   service-role key in Vite or the browser.
3. Deploy the backend signing endpoint and request it from the deployed frontend
   while logged in. In browser DevTools Network, confirm the signed object GET
   loads from the deployed origin and PDF.js renders it.
4. Confirm a PDF object request with `Range: bytes=0-65535` returns `206` with
   `Content-Range`; inspect CORS response headers from the actual project. Do
   not rely on a local curl result for this decision.
5. Confirm a logged-out request to `/api/v1/resources/{id}/viewer-url` returns
   `401`, and confirm a signed URL is absent from sheet/catalog responses.

Record the deployed frontend origin, Storage response headers, and outcome in
the release ticket. A signed URL remains bearer access until it expires.
