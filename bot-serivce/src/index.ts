import * as dotenv from "dotenv";
import { initBot } from "./bot/index.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
async function bootstrap() {
  try {
    // Initialize Bot
    await initBot();

    // Start Express Server
    app.listen(PORT, () => {
      console.log(`API server is listening`);
    });

    console.log("Server and Bot started successfully!");
  } catch (error) {
    console.error("Failed to bootstrap bot-service:", error);
    process.exit(1);
  }
}

bootstrap();
