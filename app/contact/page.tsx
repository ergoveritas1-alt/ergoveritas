import { ContactFormClient } from "@/components/contact-form-client";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Contact Us</h1>
        <p className="mt-2 text-sm text-slate-600">Send a message to ErgoVeritas.</p>
        <ContactFormClient />
      </section>
    </main>
  );
}
