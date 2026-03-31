import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import MicrosoftStrategy from "passport-microsoft";
import { prisma } from "../models/prisma.js";
import { comparePassword, assignDefaultRole } from "../services/auth.js";
import { env } from "./env.js";

// Local strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.passwordHash) {
          return done(null, false, { message: "Invalid email or password" });
        }

        if (!user.isActive) {
          return done(null, false, { message: "Account is deactivated" });
        }

        const isMatch = await comparePassword(password, user.passwordHash);
        if (!isMatch) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

// Google strategy (only if credentials configured)
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(null, false, {
              message: "No email found in Google profile",
            });
          }

          let user = await prisma.user.findFirst({
            where: { provider: "google", providerId: profile.id },
          });

          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                name: profile.displayName || user.name,
                avatar: profile.photos?.[0]?.value || user.avatar,
              },
            });
            return done(null, user);
          }

          const existingUser = await prisma.user.findUnique({
            where: { email },
          });
          if (existingUser) {
            return done(null, false, {
              message: `Email already registered with ${existingUser.provider}`,
            });
          }

          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || email,
              avatar: profile.photos?.[0]?.value,
              provider: "google",
              providerId: profile.id,
            },
          });

          await assignDefaultRole(user.id);
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );
}

// Microsoft strategy (only if credentials configured)
if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: env.MICROSOFT_CLIENT_ID,
        clientSecret: env.MICROSOFT_CLIENT_SECRET,
        callbackURL: env.MICROSOFT_CALLBACK_URL,
        scope: ["user.read"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(null, false, {
              message: "No email found in Microsoft profile",
            });
          }

          let user = await prisma.user.findFirst({
            where: { provider: "microsoft", providerId: profile.id },
          });

          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { name: profile.displayName || user.name },
            });
            return done(null, user);
          }

          const existingUser = await prisma.user.findUnique({
            where: { email },
          });
          if (existingUser) {
            return done(null, false, {
              message: `Email already registered with ${existingUser.provider}`,
            });
          }

          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || email,
              provider: "microsoft",
              providerId: profile.id,
            },
          });

          await assignDefaultRole(user.id);
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );
}

export default passport;
