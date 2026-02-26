export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-slate max-w-none space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Terms of Service</h1>

        <section>
          <h2 className="font-semibold">1. Overview</h2>
          <p>
            These Terms of Service govern your access to and use of ErgoVeritas. By using the
            service, you agree to these Terms. If you do not agree, do not use the service.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">2. Nature of the Service</h2>
          <p>
            ErgoVeritas provides a technical timestamping service for digital files. The service
            creates and records a verification reference associated with information you provide. It
            does not provide legal advice or make legal determinations.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">3. User Responsibilities</h2>
          <p>
            You are responsible for the files, data, and statements you submit, and for ensuring
            your use of the service complies with applicable law and third-party rights. You are
            also responsible for securely keeping your own copies of files and any registration
            records.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">4. Blockchain Dependency</h2>
          <p>
            Some records may rely on public network infrastructure that ErgoVeritas does not own or
            control. Availability, confirmation timing, and long-term accessibility of those
            networks may vary.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">5. Intellectual Property</h2>
          <p>
            You retain ownership of your content. Using ErgoVeritas does not transfer your
            intellectual property rights to us. By using the service, you grant only the limited
            rights needed for us to operate the service.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">6. No Reliance</h2>
          <p>
            Service outputs are intended as technical records and may be considered alongside other
            evidence and context. You should make independent decisions regarding legal, business,
            or compliance matters and consult qualified advisors when appropriate.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">7. Service Availability</h2>
          <p>
            We aim to keep the service available, but we do not guarantee uninterrupted access.
            Maintenance, upgrades, or external disruptions may affect availability.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">11. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. The updated version becomes effective when
            posted. Continued use of the service after updates means you accept the revised Terms.
          </p>
        </section>
      </article>
    </main>
  );
}
