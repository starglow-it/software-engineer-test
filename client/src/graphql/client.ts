import { ClientError, GraphQLClient } from "graphql-request";

export const graphqlClient = new GraphQLClient(
  import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:4000/graphql",
);

export function getErrorMessage(error: unknown): string {
  if (error instanceof ClientError) {
    return error.response.errors?.[0]?.message ?? "The request could not be completed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "The request could not be completed.";
}

