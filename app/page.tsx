import Link from "next/link";
import { AuthStatusChip } from "@/components/auth-status-chip";

const howItWorks = [
  {
    title: "Capture creation proof",
    description:
      "Connect domains, URLs, feeds, transcript pages, or source files; we normalize metadata, hash content, and timestamp each record."
  },
  {
    title: "Monitor exposure pathways",
    description:
      "We track domain and URL presence in public web archives and flag references in public dataset disclosures, including C4 derivatives."
  },
  {
    title: "Generate evidence-ready reports",
    description:
      "Download structured evidence packs with timestamps, hashes, URLs, and capture dates for partners or internal review."
  }
] as const;

const monitorItems = [
  "Website domains and content pages",
  "Feed URLs and canonical content URLs",
  "Transcript pages, articles, and notes pages",
  "YouTube pages and captions",
  "Third-party mirrors or reposted pages",
  "Public dataset disclosures and releases tied to Common Crawl/C4 derivatives"
] as const;

const outputArtifacts = [
  "File and content hashes (SHA-256)",
  "Cryptographic timestamps and ingestion records",
  "URL capture records tied to source locations",
  "Snapshot and capture dates with source references",
  "Structured export formats (JSON/CSV)",
  "PDF summary for legal and stakeholder review"
] as const;

const useCases = [
  {
    title: "Creator",
    description:
      "Keep a clean record of what you published and when, then monitor where it appears in public data pathways."
  },
  {
    title: "Studio / Team",
    description:
      "Standardize proof and monitoring across multiple properties, contributors, and distribution channels."
  },
  {
    title: "Publisher / Network",
    description:
      "Track portfolio-wide exposure trends and maintain consistent evidence output for partners and leadership."
  },
  {
    title: "Legal / Compliance",
    description:
      "Use evidence-ready packs with timestamps, hashes, and source references to speed legal review and response."
  }
] as const;

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "ErgoVeritas",
        url: "https://ergoveritas.com"
      },
      {
        "@type": "WebSite",
        name: "ErgoVeritas",
        url: "https://ergoveritas.com",
        description:
          "Creative content IP protection with creation proof, Common Crawl exposure monitoring, and evidence-ready reporting."
      }
    ]
  };

  return (
    <div className="space-y-14 pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AuthStatusChip />

      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-6 py-12 shadow-sm shadow-slate-200/70 sm:px-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Creative content IP protection
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Protect Your Creative Content in the AI Era
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-slate-700">
              Document creation, monitor public archive exposure pathways, and generate evidence-ready reports for business decisions.
            </p>
            <p className="max-w-3xl text-base leading-relaxed text-slate-700">
              ErgoVeritas combines proof and monitoring in one creative-content workflow. Document what you created and where it appears in public data pathways.
            </p>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white no-underline shadow-sm shadow-slate-300/80 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                Start Free Scan
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm shadow-slate-200/70">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Why this matters</p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
              Public capture can become an AI exposure pathway
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              AI training pipelines often use large public web corpora and derivatives. If your
              pages, transcripts, or media references are captured publicly, that can become a likely pathway into
              downstream training datasets.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              ErgoVeritas helps you document facts early and produce evidence-ready records when
              legal, partner, or policy decisions require clarity.
            </p>
          </aside>
        </div>
      </section>

      <section id="how" className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 sm:px-10">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Step {index + 1}</p>
              <h3 className="mt-2 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="monitor" className="rounded-2xl border border-slate-200 bg-white px-6 py-10 sm:px-10">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">What we monitor</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {monitorItems.map((item) => (
            <article
              key={item}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              {item}
            </article>
          ))}
        </div>
      </section>

      <section id="outputs" className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 sm:px-10">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Outputs you get</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {outputArtifacts.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section id="use-cases" className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 sm:px-10">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Use cases</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {useCases.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}
