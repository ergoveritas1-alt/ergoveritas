import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { enforcePostRateLimit } from "@/lib/rate-limit";
import { contactFormSchema } from "@/lib/zod";

export const runtime = "nodejs";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST ?? "";
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER ?? "";
  const pass = process.env.SMTP_PASS ?? "";
  const from = process.env.SMTP_FROM ?? "";
  const to = process.env.CONTACT_TO ?? "ergoveritas1@gmail.com";
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return { host, port, user, pass, from, to, secure };
}

export async function POST(request: NextRequest) {
  const rateLimited = enforcePostRateLimit(request, "contact_post");
  if (rateLimited) {
    return rateLimited;
  }

  const body = await request.json().catch(() => null);
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const config = getSmtpConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Contact email is not configured on the server." },
      { status: 500 }
    );
  }

  const { name, email, company, message } = parsed.data;
  const companyLine = company?.trim() ? `Company: ${company.trim()}\n` : "";

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  try {
    await transporter.sendMail({
      from: config.from,
      to: config.to,
      replyTo: email,
      subject: `Website contact from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n${companyLine}\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
${company?.trim() ? `<p><strong>Company:</strong> ${company.trim()}</p>` : ""}
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, "<br/>")}</p>`
    });
  } catch {
    return NextResponse.json({ error: "Failed to send contact email." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
