import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import db from "./database"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(credentials.email) as any

        if (!user || !bcrypt.compareSync(credentials.password, user.password_hash)) {
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.company_id.toString(),
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role
        token.companyId = user.companyId
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).companyId = token.companyId
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
