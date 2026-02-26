export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-slate max-w-none space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Privacy Policy</h1>

        <section>
          <h2 className="font-semibold">Overview</h2>
          <p>
            This Privacy Policy explains how ErgoVeritas collects, uses, and discloses information
            when you use the service. We design the service to minimize data exposure while
            supporting independent verification.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Information We Process</h2>
          <p>
            We process account and service information needed to provide timestamp registration,
            verification, support, and basic service security. This may include timestamp metadata,
            hash values, technical logs, and contact details you provide.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">No File Storage Clarification</h2>
          <p>
            ErgoVeritas does not store your original file content as part of registration. Your file
            remains on your device unless you separately share it outside the service.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Hash-Only Processing</h2>
          <p>
            The service processes a cryptographic hash derived from your file for registration and
            verification workflows. A hash is a compact reference value, not a copy of the file
            itself.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Blockchain Permanence Disclosure</h2>
          <p>
            When registration data is anchored to a public network, associated records may become
            effectively permanent and publicly accessible. Public records generally cannot be edited
            or deleted by ErgoVeritas once confirmed.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">GDPR</h2>
          <p>
            For users in the European Economic Area, United Kingdom, and similar jurisdictions, we
            process personal data based on legitimate interests, contractual necessity, legal
            obligations, or consent where required. Subject to applicable law, you may request
            access, correction, deletion, restriction, objection, or portability of personal data,
            and you may lodge a complaint with your supervisory authority.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">California (CCPA)</h2>
          <p>
            California residents may have rights to know, access, correct, and delete personal
            information, and to limit certain uses as provided by California law. ErgoVeritas does
            not sell personal information as defined by the CCPA. Authorized agents may submit
            requests on your behalf where permitted.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Sensitive Data Limitation</h2>
          <p>
            Do not submit sensitive personal information unless strictly necessary. The service is
            not intended for processing special-category personal data, health records, financial
            account credentials, or government identifiers.
          </p>
        </section>

      </article>
    </main>
  );
}
