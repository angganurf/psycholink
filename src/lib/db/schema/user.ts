import { pgTable, text, boolean } from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  username: text("username").unique(),
  email: text("email").unique(),
  phone: text("phone"),
  hashed_password: text("hashed_password"),
  email_verified: boolean("email_verified").notNull().default(false),
  two_factor_secret: text("two_factor_secret"),
});

export type User = typeof userTable.$inferSelect;
