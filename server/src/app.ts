import { createYoga } from "graphql-yoga";
import type { ParticipantService } from "./services/participant-service.js";
import { createReconnectSchema } from "./graphql/schema.js";

export function createReconnectApp(service: ParticipantService) {
  return createYoga({
    schema: createReconnectSchema(service),
    graphqlEndpoint: "/graphql",
    graphiql: process.env.NODE_ENV !== "production",
    cors: {
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
      methods: ["POST", "OPTIONS"],
      allowedHeaders: ["content-type"],
    },
    // Resolvers translate expected domain failures into safe GraphQL errors.
    maskedErrors: false,
  });
}
