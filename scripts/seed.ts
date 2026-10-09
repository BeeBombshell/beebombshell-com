import fs from "fs";
import path from "path";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

async function runSeed() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase credentials in environment. Check .env / .env.example");
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
  const seedDir = path.join(__dirname, "..", "content", "seed");

  console.log("Seeding profile...");
  const profile = JSON.parse(fs.readFileSync(path.join(seedDir, "profile.json"), "utf-8"));
  await db.collection("profile").doc("main").set(profile);

  console.log("Seeding projects...");
  const projects = JSON.parse(fs.readFileSync(path.join(seedDir, "projects.json"), "utf-8"));
  for (const project of projects) {
    const { slug, ...data } = project;
    await db.collection("projects").doc(slug).set(data);
  }

  console.log("Seeding posts...");
  const posts = JSON.parse(fs.readFileSync(path.join(seedDir, "posts.json"), "utf-8"));
  for (const post of posts) {
    const { slug, ...data } = post;
    await db.collection("posts").doc(slug).set(data);
  }

  console.log("Seeding site config...");
  const config = JSON.parse(fs.readFileSync(path.join(seedDir, "config.json"), "utf-8"));
  await db.collection("site").doc("config").set(config);

  console.log("✓ Firestore seeding complete!");
}

runSeed().catch((err) => {
  console.error("Error during seed:", err);
  process.exit(1);
});
