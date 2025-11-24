import { fetchPaid } from '@turnstile/client';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' }); // Load from root .env

async function runBot() {
  const TARGET_URL = 'http://localhost:3000/api/data';
  const PRIVATE_KEY = process.env.BOT_PRIVATE_KEY as `0x${string}`;

  console.log("Private key length:", PRIVATE_KEY?.length);
  console.log("Private key:", PRIVATE_KEY);

  if (!PRIVATE_KEY || PRIVATE_KEY.length !== 66) {
    console.error("❌ Error: Check your BOT_PRIVATE_KEY in .env");
    console.error("It should start with 0x and have 64 hex characters after.");
    process.exit(1);
  }

  try {
    console.log("--- STARTING BOT ---");
    const response = await fetchPaid(TARGET_URL, {
      privateKey: PRIVATE_KEY
    });

    if (response.ok) {
      const data = await response.json();
      console.log("\n🎉 SUCCESS! Access Granted:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`\n❌ FAILED: Server returned ${response.status}`);
      console.log(await response.text());
    }

  } catch (error) {
    console.error("\n💀 CRITICAL ERROR:", error);
  }
}

runBot();
