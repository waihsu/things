// import { Pool, neonConfig } from "@neondatabase/serverless";

// // Cloudflare Workers needs the WebSocket constructor from the runtime.
// if (typeof WebSocket !== "undefined") {
//   neonConfig.webSocketConstructor = WebSocket;
// }
// // Reuse connections across requests in serverless environments.
// neonConfig.fetchConnectionCache = true;

// export const database = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// database.on("error", (error: any) => {
//   console.error(`[postgres] database error`, error);
// });

// // cleanup function that can be called during shutdown
// export async function closeDatabase() {
//   try {
//     await database.end();
//   } catch (error) {
//     console.error(`[postgres] error closing database:`, error);
//   }
// }
