import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Verfahrensplattform" },
    { name: "description", content: "Hello Verfahrensplattform!" },
  ];
};

export default function Index() {
  return (
    <main className={"flex flex-col items-center m-40"}>
      <h1 className={"ds-heading-01-reg mb-40"}>Hello Verfahrensplattform!</h1>
    </main>
  );
}
