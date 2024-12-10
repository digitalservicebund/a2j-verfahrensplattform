import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { data, Link } from "@remix-run/react";
import { getSession } from "~/services/session.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Kommunikationsplattform" },
    { name: "description", content: "Hello Kommunikationsplattform!" },
  ];
};

// TODO:
// - test user auth with BRAK IdP test env "schulung"
// - auth flow: add error handling
// - on page load: if user is logged in already, redirect to /dashboard
//   - authorizeUser() via auth.callback.tsx, when redirect_url has been updated @ BRAK

export async function loader({ request }: LoaderFunctionArgs) {
  // debugging:
  const session = await getSession(request.headers.get("Cookie"));
  const codeVerifier = session.get("code_verifier");
  const return_to = session.get("return_to");
  console.log("codeVerifier is", codeVerifier);
  console.log("return_to is", return_to);

  return data(null);
}

export default function Index() {
  return (
    <main className={"m-40 flex flex-col items-center"}>
      <h1 className={"ds-heading-01-bold mb-40 break-all"}>
        Kommunikationsplattform
      </h1>
      <h2 className={"ds-heading-03-reg break-word"}>
        Willkommen auf der Pilotplattform für den digitalen Austausch zwischen
        Gerichten und Verfahrensbeteiligten in Zivilprozessen vor Amtsgerichten
      </h2>

      <div className={"m-40 text-center"}>
        <p className={"pb-20"}>Bitte wählen Sie Ihre Loginmethode:</p>
        <Link to={"/login/bea"} className={"ds-button"}>
          beA-Portal
        </Link>
      </div>
    </main>
  );
}
