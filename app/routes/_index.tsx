import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { data, Form, redirect } from "@remix-run/react";
import { requireUserSession } from "~/services/session.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Kommunikationsplattform" },
    { name: "description", content: "Hello Kommunikationsplattform!" },
  ];
};

// @TODO:
// - test user auth
// - add error handling
export async function action({ request }: ActionFunctionArgs) {
  // let session = await sessionStorage.getSession(request.headers.get("cookie"));

  await requireUserSession(request)
    .then((data) => {
      console.log("requireUserSession then", data);
    })
    .catch((error) => {
      console.log("requireUserSession catch", error);
      throw redirect("/error");
    });

  throw redirect("/dashboard", {
    // headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

// @TODO: if user is logged in already, redirect to /dashboard
export async function loader({ request }: LoaderFunctionArgs) {
  // let session = await sessionStorage.getSession(request.headers.get("cookie"));
  // let user;
  // if (user) throw redirect("/dashboard");

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
      <Form method="post">
        <div className={"m-40 text-center"}>
          <p className={"pb-20"}>Bitte wählen Sie Ihre Loginmethode:</p>
          <button className={"ds-button"}>beA-Portal</button>
        </div>
      </Form>
    </main>
  );
}
