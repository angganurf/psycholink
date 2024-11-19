"use server";

import { db } from "@/lib/db";
import { userTable } from "@/lib/db/schema";
import { action } from "@/lib/safe-action";
import { InferInsertModel } from "drizzle-orm";
import { generateId } from "lucia";
import { redirect } from "next/navigation";
import { Argon2id } from "oslo/password";
import { z } from "zod";
import { sendEmailVerificationCode } from "./mails";
import { useRateLimiting } from "@/lib/utils.server";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email(),
  password: z.string().optional(),
});
export const register = action(
  registerSchema,
  async ({ name, username, phone, email, password }) => {
    // check if user exists
    await useRateLimiting();

    const existingUser = await db.query.userTable.findFirst({
      where: (user, { eq }) => eq(user.email, email),
    });
    if (existingUser) {
      throw new Error("Email already exists");
    }
    const existingUsername = await db.query.userTable.findFirst({
      where: (user, { eq }) => eq(user.username, username),
    });
    if (existingUsername) {
      throw new Error("Username already exists");
    }

    const userId = generateId(15);
    let values: InferInsertModel<typeof userTable> = {
      name,
      username,
      email,
      phone,
      id: userId,
      hashed_password: undefined,
    };
    // create user
    if (password) {
      const hashedPassword = await new Argon2id().hash(password);
      values = {
        ...values,
        hashed_password: hashedPassword,
        email_verified: false,
      };
    }
    await db.insert(userTable).values(values);

    // send magic link
    // await sendEmailVerificationCode({
    //   email,
    //   userId: userId,
    // });

    const whatsappNumber = "6283818711916"; // Nomor WhatsApp tujuan
    const whatsappMessage = `
Halo, saya ingin mendaftar akun dengan data berikut:
- Nama Lengkap: ${name}
- Username: ${username}
- Nomor Telp: ${phone}
- Email: ${email}
- Password: ${password}`;
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      whatsappMessage
    )}`;
    // redirect(`/auth/verify-email?email=${email}`);
    redirect(whatsappLink);
  }
);
