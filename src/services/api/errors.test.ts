import { describe, it, expect } from "vitest";
import {
  ApiError,
  errorFromStatus,
  ForbiddenError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

describe("errorFromStatus", () => {
  it("maps HTTP statuses to typed error classes", () => {
    expect(errorFromStatus(401, "x")).toBeInstanceOf(UnauthorizedError);
    expect(errorFromStatus(403, "x")).toBeInstanceOf(ForbiddenError);
    expect(errorFromStatus(404, "x")).toBeInstanceOf(NotFoundError);
    expect(errorFromStatus(422, "x")).toBeInstanceOf(ValidationError);
    expect(errorFromStatus(500, "x")).toBeInstanceOf(ServerError);
    expect(errorFromStatus(503, "x")).toBeInstanceOf(ServerError);
  });

  it("falls back to a generic ApiError for unmapped statuses", () => {
    const e = errorFromStatus(418, "teapot");
    expect(e).toBeInstanceOf(ApiError);
    expect(e).not.toBeInstanceOf(ServerError);
    expect(e.status).toBe(418);
    expect(e.message).toBe("teapot");
  });

  it("preserves the subclass name", () => {
    expect(errorFromStatus(401, "x").name).toBe("UnauthorizedError");
    expect(errorFromStatus(422, "x").name).toBe("ValidationError");
  });

  it("exposes the first field error, or null", () => {
    const v = errorFromStatus(422, "v", { email: ["is required", "must be an email"] });
    expect(v.firstError()).toBe("is required");
    expect(errorFromStatus(500, "x").firstError()).toBeNull();
  });
});
