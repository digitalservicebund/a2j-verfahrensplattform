import { createCookieSessionStorage } from "@remix-run/node";
import { config } from "~/config/config.server";

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "__session",
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      secrets: [config().BRAK_IDP_OIDC_CLIENT_SECRET],
      secure: process.env.NODE_ENV === "production",
    },
  });

export { getSession, commitSession, destroySession };
