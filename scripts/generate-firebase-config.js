const fs = require("fs");
const path = require("path");

const requiredKeys = [
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID"
];

const missing = requiredKeys.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error("Missing required Firebase environment variables:", missing.join(", "));
  process.exit(1);
}

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const outputPath = path.join(__dirname, "..", "js", "firebase-config.js");
const fileContents = `export const firebaseConfig = ${JSON.stringify(config, null, 2)};\n`;

fs.writeFileSync(outputPath, fileContents, "utf8");
console.log(`Generated ${outputPath}`);
