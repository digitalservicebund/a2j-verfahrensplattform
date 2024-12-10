import type { LoaderFunction } from "@remix-run/node";
import { requireUserSession } from "~/services/brakAuth.server";

export const loader: LoaderFunction = async ({ request }) => {
  console.log("BeaLogin loader...");

  await requireUserSession(request);
  return null;
};
