import { data, type LoaderFunction } from "@remix-run/node";
import { authorizeUser } from "~/services/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const hi = await authorizeUser(request);
  console.log("callback route has been called");

  return data(null);
};

export default function AuthCallback() {
  // @TODO: show something helpful for auth issues

  return (
    <main className={"m-40 flex flex-col items-center"}>
      <h1 className={"ds-heading-01-bold mb-40 break-all"}>Callback error!?</h1>
    </main>
  );
}
