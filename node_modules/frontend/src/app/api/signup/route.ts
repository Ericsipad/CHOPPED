import { NextRequest } from "next/server";
import { z } from "zod";
import nodemailer from "nodemailer";
import { getMongoDb } from "@/lib/mongodb";

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = signupSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
      });
    }

    const { email, name } = parsed.data;

    const db = await getMongoDb();
    await db.collection("signups").insertOne({
      email,
      name: name || null,
      createdAt: new Date(),
      source: "landing-page",
    });

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const smtpSecure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromAddress = process.env.SMTP_FROM;
    const toAddress = email; // populate "to" from user data

    if (!smtpHost || !smtpUser || !smtpPass || !fromAddress) {
      return new Response(
        JSON.stringify({ error: "SMTP env variables are not fully set" }),
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: fromAddress,
      to: toAddress,
      subject: `Welcome to CHOPPED`,
      text: `Thanks for signing up!\nEmail: ${email}\nName: ${name || "-"}`,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(error) }),
      { status: 500 }
    );
  }
}


