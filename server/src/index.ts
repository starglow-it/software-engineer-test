import { createServer } from "node:http";
import { createReconnectApp } from "./app.js";
import { createDatabase, ParticipantRepository } from "./db/database.js";
import { ParticipantService } from "./services/participant-service.js";

const port = Number(process.env.PORT ?? 4000);
const database = createDatabase();
const repository = new ParticipantRepository(database);
const service = new ParticipantService(repository);
const app = createReconnectApp(service);
const server = createServer(app);

server.listen(port, () => {
  console.log(`Reconnect API listening on http://localhost:${port}/graphql`);
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
