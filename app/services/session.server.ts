import * as client from "openid-client";
import {
  buildAuthorizationUrl,
  randomPKCECodeVerifier,
  randomNonce,
  calculatePKCECodeChallenge,
} from "openid-client";
import { decode } from "jsonwebtoken";
import { createCookieSessionStorage, redirect } from "@remix-run/node";

import { config } from "~/config/config.server";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [config().BRAK_IDP_OIDC_CLIENT_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

let configuration: client.Configuration;

async function getClientConfiguration(): Promise<client.Configuration> {
  if (configuration !== undefined) {
    return configuration;
  }

  console.log("getClientConfiguration");

  const discoverIssuer = await client.discovery(
    new URL(config().BRAK_IDP_OIDC_ISSUER),
    config().BRAK_IDP_OIDC_CLIENT_ID,
    config().BRAK_IDP_OIDC_CLIENT_SECRET,
  );

  return discoverIssuer;
}

export async function requireUserSession(request: Request) {
  console.log("requireUserSession...");

  const clientConfiguration = await getClientConfiguration();
  const currentCookie = request.headers.get("cookie");
  const session = await sessionStorage.getSession(currentCookie);

  if (!session.has("access_token")) {
    console.log("no access token so far...");

    const codeVerifier = randomPKCECodeVerifier();
    session.set("code_verifier", codeVerifier);
    session.set("return_to", request.url);
    const cookie = await sessionStorage.commitSession(session);

    let code_challenge = await calculatePKCECodeChallenge(codeVerifier);
    let parameters: Record<string, string> = {
      redirect_uri: `${config().BRAK_IDP_OIDC_REDIRECT_BASE}/auth/callback`,
      scope: "openid safeid",
      code_challenge,
      code_challenge_method: "S256",
    };

    if (!clientConfiguration.serverMetadata().supportsPKCE()) {
      const nonce = randomNonce();
      parameters.nonce = nonce;
    }

    let redirectTo = buildAuthorizationUrl(clientConfiguration, parameters);

    console.log("...redirectTo:", redirectTo.href);

    // @TODO: remove generated example URLs:
    // localhost: https://www.bea-brak.de/auth/realms/brak/protocol/openid-connect/auth?redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&scope=openid+safeid&code_challenge=2kMXQFBHOCewKm4d3S7Jpw2Y0i5ov6XB9CVVZ9hLqG4&code_challenge_method=S256&client_id=00321&response_type=code
    // staging: https://www.bea-brak.de/auth/realms/brak/protocol/openid-connect/auth?redirect_uri=https%3A%2F%2Fa2j-kompla.dev.ds4g.net%2Fauth%2Fcallback&scope=openid+safeid&code_challenge=E6T_vGTgTfoslKDgqWd81-SdN_RlTQP25Pb44PxYtc0&code_challenge_method=S256&client_id=00321&response_type=code
    throw redirect(redirectTo.href, {
      headers: {
        "Set-Cookie": cookie,
      },
    });
  }

  console.log("access token is present...");

  return session;
}

export async function authorizeUser(request: Request) {
  const clientConfiguration = await getClientConfiguration();
  const currentCookie = request.headers.get("cookie");
  const session = await sessionStorage.getSession(currentCookie);
  const codeVerifier = session.get("code_verifier");

  console.log("authorizeUser");

  if (typeof codeVerifier !== "string" || codeVerifier.length === 0) {
    // @TODO: improve logging (warning?)
    throw new Error("unauthorized");
  }

  // let currentUrl = request.url;
  // let { searchParams } = new URL(request.url);
  const nonce = randomNonce();

  let tokens = await client.authorizationCodeGrant(
    clientConfiguration,
    request,
    {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      idTokenExpected: true,
    },
  );

  if (tokens.access_token) {
    console.log("user has access_token");

    session.set("access_token", tokens.access_token);
    session.set("id_token", tokens.id_token);

    // @TODO: what do we really need to store after user is authenticated?
    session.set("user", decode(tokens.access_token));
  }

  let redirectLocation = "/";
  if (session.has("return_to")) {
    console.log("session has return_to item ...");
    redirectLocation = session.get("return_to");
    session.unset("return_to");
  }

  const cookie = await sessionStorage.commitSession(session);

  console.log("redirectLocation is:", redirectLocation);

  throw redirect(redirectLocation, {
    headers: {
      "Set-Cookie": cookie,
    },
  });
}
