export default function LegalSummaryPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-slate max-w-none space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Legal &amp; Transparency Summary
        </h1>

        <section>
          <h2 className="font-semibold">We Do Not Store Your Files</h2>
          <p>
            Your source file remains on your device during normal registration. The service records
            verification data, not your original file content.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">What a Timestamp Does</h2>
          <p>
            A timestamp creates a technical record showing that a matching file reference existed at
            a particular time. It is designed for independent verification later.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">What a Timestamp Does Not Do</h2>
          <p>
            A timestamp does not, by itself, grant copyright, transfer ownership, or resolve all
            disputes. It is one part of a broader factual record.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Blockchain Records</h2>
          <p>
            Some records are anchored to public networks for durability and independent checks.
            Public network entries are generally persistent once confirmed.
          </p>
        </section>

      </article>
    </main>
  );
}
