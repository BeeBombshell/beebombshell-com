import fs from "fs";
import path from "path";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Simple helper to load .env / .env.local if running directly
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}

async function runSeed() {
  loadEnv();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase credentials in environment. Check .env / .env.example");
    console.error("Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
    process.exit(1);
  }

  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const app =
    getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        })
      : getApps()[0];

  const db = getFirestore(app);
  const seedDir = path.join(process.cwd(), "content", "seed");

  console.log("Seeding profile into Firestore...");
  const profile = JSON.parse(fs.readFileSync(path.join(seedDir, "profile.json"), "utf-8"));
  await db.collection("profile").doc("main").set(profile);

  console.log("Seeding projects into Firestore...");
  const projects = JSON.parse(fs.readFileSync(path.join(seedDir, "projects.json"), "utf-8"));
  for (const project of projects) {
    const { slug, ...data } = project;
    await db.collection("projects").doc(slug).set(data);
  }

  console.log("Seeding posts into Firestore...");
  const posts = JSON.parse(fs.readFileSync(path.join(seedDir, "posts.json"), "utf-8"));
  for (const post of posts) {
    const { slug, ...data } = post;
    await db.collection("posts").doc(slug).set(data);
  }

  console.log("Seeding site config into Firestore...");
  const config = JSON.parse(fs.readFileSync(path.join(seedDir, "config.json"), "utf-8"));
  await db.collection("site").doc("config").set(config);

  console.log("✓ Firestore seeding complete! All documents synchronized.");
}

runSeed().catch((err) => {
  console.error("Error during seed:", err);
  process.exit(1);
});
