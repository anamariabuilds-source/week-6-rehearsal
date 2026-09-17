import { routeModelSchema, type RouteModel } from "./route-model.ts";

const resolvedStatuses = new Set(["Confirmed", "Rejected"]);

export class RouteConfirmationError extends Error {
  constructor() {
    super("Review all required route elements before confirmation.");
    this.name = "RouteConfirmationError";
  }
}

function withoutRejectedElements(model: RouteModel) {
  return {
    ...model,
    status: "Confirmed" as const,
    nodes: model.nodes.filter((item) => item.reviewStatus !== "Rejected"),
    exits: model.exits.filter((item) => item.reviewStatus !== "Rejected"),
    connections: model.connections.filter((item) => item.reviewStatus !== "Rejected"),
    labels: model.labels.filter((item) => item.reviewStatus !== "Rejected"),
  };
}

export function isRouteModelConfirmable(input: unknown): boolean {
  const parsed = routeModelSchema.safeParse(input);

  if (!parsed.success || parsed.data.status !== "Unconfirmed") return false;

  const candidates = [
    ...parsed.data.nodes,
    ...parsed.data.exits,
    ...parsed.data.connections,
    ...parsed.data.labels,
  ];

  if (!candidates.every((candidate) => resolvedStatuses.has(candidate.reviewStatus))) {
    return false;
  }

  const confirmed = routeModelSchema.safeParse(withoutRejectedElements(parsed.data));

  if (!confirmed.success) return false;

  const availableIds = new Set([
    ...confirmed.data.nodes.map((node) => node.id),
    ...confirmed.data.exits.map((exit) => exit.id),
  ]);

  return confirmed.data.connections.every(
    (connection) => availableIds.has(connection.from) && availableIds.has(connection.to),
  );
}

export function confirmRouteModel(input: unknown): RouteModel {
  if (!isRouteModelConfirmable(input)) throw new RouteConfirmationError();

  const model = routeModelSchema.parse(input);
  return routeModelSchema.parse(withoutRejectedElements(model));
}

export function isRehearsalAvailable(confirmedModel: RouteModel | null): boolean {
  return confirmedModel?.status === "Confirmed";
}
