import * as client from "openid-client";
import {
  buildAuthorizationUrl,
  randomPKCECodeVerifier,
  randomNonce,
  calculatePKCECodeChallenge,
} from "openid-client";
import { decode } from "jsonwebtoken";
import { redirect } from "@remix-run/node";

import { config } from "~/config/config.server";
import { commitSession, getSession } from "./session.server";

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
  const session = await getSession(currentCookie);

  if (!session.has("access_token")) {
    console.log("no access token so far...");

    const codeVerifier = randomPKCECodeVerifier();
    const returnToUrl = config().BASE_URL;

    session.set("code_verifier", codeVerifier);
    session.set("return_to", returnToUrl);

    const cookie = await commitSession(session);
    const code_challenge = await calculatePKCECodeChallenge(codeVerifier);

    // From the BRAK-IdP documentationc, create GET request:
    // GET /auth/realms/brak/protocol/openid-connect/auth? client_id=bea&response_type=code&scope=openid safeid& redirect_uri=https://(fqdn_of_bea_environment)/login/oidc.html
    //
    // params:
    // - client_id
    // - response_type
    // - scope
    // - redirect_uri
    //
    // Example request: https://schulung.bea-brak.de/auth/realms/brak/protocol/openid-connect/auth?redirect_uri=https%3A%2F%2Fschulung.bea-brak.de%2Flogin%2Foidc.html&scope=openid+safeid&code_challenge=-OGjPhfsbyrNmB0ALk0MsFBrLESZy0veLmLhfcFIlrM&client_id=00321&response_type=code

    let parameters: Record<string, string> = {
      redirect_uri: `${config().BRAK_IDP_OIDC_REDIRECT_URI}/login/oidc.html`,
      scope: "openid safeid",
      code_challenge,
      code_challenge_method: "S256",
    };

    if (!clientConfiguration.serverMetadata().supportsPKCE()) {
      console.log("...does not supportsPKCE");
      const nonce = randomNonce();
      parameters.nonce = nonce;
    }

    const redirectTo = buildAuthorizationUrl(clientConfiguration, parameters);

    console.log("...redirectTo:", redirectTo.href);

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
  const session = await getSession(currentCookie);
  const codeVerifier = session.get("code_verifier");

  console.log("authorizeUser");

  if (typeof codeVerifier !== "string" || codeVerifier.length === 0) {
    // later: improve logging, could a warning be of more value here?
    throw new Error("unauthorized");
  }

  let nonce;

  if (!clientConfiguration.serverMetadata().supportsPKCE()) {
    console.log("...does not supportsPKCE");
    nonce = randomNonce();
  }

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

    // later: what do we really need to store after user is authenticated?
    session.set("user", decode(tokens.access_token));
  }

  let redirectLocation = "/";
  if (session.has("return_to")) {
    console.log("session has return_to item ...");
    redirectLocation = session.get("return_to");
    session.unset("return_to");
  }

  const cookie = await commitSession(session);

  console.log("redirectLocation is:", redirectLocation);

  throw redirect(redirectLocation, {
    headers: {
      "Set-Cookie": cookie,
    },
  });
}
