#!/usr/bin/env node
/**
 * scripts/seedDemoPantry.js
 *
 * ============================================================
 * DEVELOPMENT-ONLY UTILITY -- NOT part of the production app.
 * Never imported from src/, never bundled by Vite, no UI button
 * triggers this. Run it manually, once, from a terminal.
 * ============================================================
 *
 * Populates a demo account's Firestore pantry (~47 realistic
 * ingredients) so instructors/graders can immediately exercise every
 * recipe feature -- search, missing-ingredient counts, ingredient
 * substitutions, Use Soon, multiple cuisines, and all three expiry
 * states -- without manually adding items through the UI first.
 *
 * ---- How to change the demo user ----
 * Edit DEMO_USER_UID below to the target account's Firebase Auth UID
 * (Firebase Console -> Authentication -> Users -> copy the UID).
 *
 * ---- How to run ----
 *   1. Set DEMO_USER_UID below.
 *   2. Provide Admin SDK credentials (pick ONE):
 *        a) Download a service account key from Firebase Console ->
 *           Project Settings -> Service Accounts -> Generate new
 *           private key. Save it as scripts/serviceAccountKey.json
 *           (already gitignored -- never commit this file).
 *        b) Or set the GOOGLE_APPLICATION_CREDENTIALS environment
 *           variable to a key file's path and skip (a) entirely.
 *   3. From the project root:
 *        npm run seed:demo
 *      (or directly: node scripts/seedDemoPantry.js)
 *
 * The Admin SDK writes directly to Firestore, bypassing security
 * rules -- that's expected and appropriate for a trusted, local,
 * one-time dev/seeding tool like this one. It does NOT touch
 * Firebase Authentication in any way; the demo user must already
 * exist (sign them up through the app once, then paste their UID
 * below).
 *
 * ---- Duplicate protection ----
 * Each ingredient is written to a DETERMINISTIC document id (a
 * slug of its name, e.g. "Bell Pepper" -> "bell-pepper") using a
 * merge-set. Running this script again updates those same 47
 * documents in place -- it never creates duplicates, and it never
 * needs to read the existing pantry first to check.
 */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import admin from "firebase-admin";
import { buildDemoPantryItems, slugifyIngredientName } from "./demoPantryData.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ------------------------------------------------------------------
// EDIT ME: the demo account's Firebase Auth UID.
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

  // Falls back to GOOGLE_APPLICATION_CREDENTIALS, or another ambient
  // credential source such as `gcloud auth application-default login`.
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

async function seedDemoPantry() {
  if (!DEMO_USER_UID || DEMO_USER_UID === "REPLACE_WITH_DEMO_USER_UID") {
    console.error(
      "Set DEMO_USER_UID at the top of scripts/seedDemoPantry.js before running this."
    );
    process.exitCode = 1;
    return;
  }

  initializeAdminApp();
  const db = admin.firestore();

  // Existing Firestore structure, matching src/services/pantryService.js:
  // users/{uid}/pantryItems/{itemId}
  const pantryRef = db
    .collection("users")
    .doc(DEMO_USER_UID)
    .collection("pantryItems");

  const items = buildDemoPantryItems();

  // Single Firestore batch write -- 47 items is well within the
  // 500-operation batch limit, and this means zero reads and one
  // round trip regardless of how many items are seeded.
  const batch = db.batch();
  for (const item of items) {
    const docId = slugifyIngredientName(item.name);
    const docRef = pantryRef.doc(docId);
    batch.set(
      docRef,
      {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate: item.expiryDate,
        createdAt: Date.now(),
      },
      { merge: true } // upsert: updates in place on re-run, never duplicates
    );
  }

  await batch.commit();

  console.log(`Seeded ${items.length} pantry items for user ${DEMO_USER_UID}.`);
  console.log("Safe to re-run any time -- existing items are updated, not duplicated.");
}

seedDemoPantry().catch((error) => {
  console.error("Failed to seed demo pantry:", error);
  process.exitCode = 1;
});
