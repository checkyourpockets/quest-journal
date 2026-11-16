import type { DocMap } from "../data/types";

/** Dev-only loader. The JSON files live in gitignored fixtures/ and are served by the Vite dev server, never bundled. */
export async function loadFixtureDocs(): Promise<DocMap> {
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("sample") === "1") {
    const { sampleDocs } = await import("./sampleFixture");
    return sampleDocs();
  }
  const base = import.meta.env.BASE_URL;
  const [dataRes, webRes] = await Promise.all([
    fetch(base + "__fixture/questlog-data.json"),
    fetch(base + "__fixture/web.json"),
  ]);
  if (!dataRes.ok) {
    throw new Error("Local fixture not found. Add gitignored fixtures/questlog-data.json and fixtures/web.json, then restart the dev server.");
  }
  const data = (await dataRes.json()) as DocMap;
  const docs: DocMap = { ...data };
  if (webRes.ok) docs.skill_web = await webRes.json();
  return docs;
}
