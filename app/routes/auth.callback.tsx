import { data, redirect, type LoaderFunction } from "@remix-run/node";
import { authorizeUser } from "~/services/brakAuth.server";

// needs to be done on root URL at the moment (redirect_url update needed by BRAK)

export const loader: LoaderFunction = async ({ request }) => {
  await authorizeUser(request)
    .then((data) => {
      console.log("authorizeUser then", data);
      throw redirect("/dashboard");
    })
    .catch((error) => {
      console.log("authorizeUser catch", error);
      throw redirect("/error");
    });

  return data(null);
};

export default function AuthCallback() {
  return (
    <main className={"m-40 flex flex-col items-center"}>
      <h1 className={"ds-heading-01-bold mb-40 break-all"}>
        Authentication callback error
      </h1>
    </main>
  );
}
