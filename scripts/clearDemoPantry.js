#!/usr/bin/env node
/**
 * scripts/clearDemoPantry.js
 *
 * ============================================================
 * DEVELOPMENT-ONLY UTILITY -- NOT part of the production app.
 * Never imported from src/, never bundled by Vite, no UI button
 * triggers this. Run it manually from a terminal.
 * ============================================================
 *
 * Companion to seedDemoPantry.js: safely deletes every pantry item
 * belonging to the demo user, so the demo account can be reset to
 * empty before re-seeding (e.g. `npm run clear:demo && npm run seed:demo`).
 *
 * ---- How to change the demo user ----
 * Edit DEMO_USER_UID below -- keep it in sync with seedDemoPantry.js.
 *
 * ---- How to run ----
 *   Same Admin SDK credential setup as seedDemoPantry.js (see that
 *   file's header comment). Then, from the project root:
 *     npm run clear:demo
 *   (or directly: node scripts/clearDemoPantry.js)
 *
 * Unlike seeding, clearing genuinely requires reading first --
 * Firestore has no server-side "delete every doc in this collection"
 * operation, so every existing document id has to be listed before
 * it can be deleted. That single read of the (small) pantryItems
 * collection is unavoidable, but the deletes themselves are still
 * batched together into one write.
 */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ------------------------------------------------------------------
// EDIT ME: the demo account's Firebase Auth UID (keep in sync with
// seedDemoPantry.js).
// ------------------------------------------------------------------
const DEMO_USER_UID = "REPLACE_WITH_DEMO_USER_UID";

function initializeAdminApp() {
  const serviceAccountPath = join(__dirname, "serviceAccountKey.json");

  if (existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// Firestore batched writes cap at 500 operations -- chunk defensively
// in case the demo pantry ever grows past that through manual testing.
const BATCH_CHUNK_SIZE = 400;

async function clearDemoPantry() {
  if (!DEMO_USER_UID || DEMO_USER_UID === "REPLACE_WITH_DEMO_USER_UID") {
    console.error(
      "Set DEMO_USER_UID at the top of scripts/clearDemoPantry.js before running this."
    );
    process.exitCode = 1;
    return;
  }

  initializeAdminApp();
  const db = admin.firestore();

  const pantryRef = db
    .collection("users")
    .doc(DEMO_USER_UID)
    .collection("pantryItems");

  const snapshot = await pantryRef.get();

  if (snapshot.empty) {
    console.log(`No pantry items found for user ${DEMO_USER_UID} -- nothing to clear.`);
    return;
  }

  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += BATCH_CHUNK_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_CHUNK_SIZE);
    chunk.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  console.log(`Cleared ${docs.length} pantry items for user ${DEMO_USER_UID}.`);
}

clearDemoPantry().catch((error) => {
  console.error("Failed to clear demo pantry:", error);
  process.exitCode = 1;
});
