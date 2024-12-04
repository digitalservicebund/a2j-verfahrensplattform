import { Link } from "@remix-run/react";

export default function Error() {
  return (
    <main className={"m-40 flex flex-col items-center"}>
      <h1 className={"ds-heading-01-bold mb-40 break-all"}>
        Bitte versuchen Sie es später erneut.
      </h1>
      <Link to={"/"} className={"ds-button"}>
        Startseite
      </Link>
    </main>
  );
}
