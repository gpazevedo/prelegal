import { readFile } from "fs/promises";
import path from "path";
import NdaCreator from "@/components/NdaCreator";

export default async function Home() {
  const templatesDir = path.join(process.cwd(), "..", "templates");
  const standardTerms = await readFile(
    path.join(templatesDir, "Mutual-NDA.md"),
    "utf-8"
  );

  return <NdaCreator standardTerms={standardTerms} />;
}
