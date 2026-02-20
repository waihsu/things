import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { Hono } from "hono";
import type { AppBindings } from "@/src/server/types";

type QueryResult<T = Record<string, unknown>> = {
  rows: T[];
  rowCount: number;
};

const queryMock = mock(
  async () =>
    ({
      rows: [],
      rowCount: 0,
    }) as QueryResult,
);

mock.module("@/src/db/http", () => ({
  query: queryMock,
}));

const { default: poemsRoute } = await import("./poems.route");

const buildApp = (user: { id: string } | null) => {
  const app = new Hono<AppBindings>();
  app.use("*", async (c, next) => {
    c.set("user", user as AppBindings["Variables"]["user"]);
    c.set("session", null);
    await next();
  });
  app.route("/poems", poemsRoute);
  return app;
};

describe("poems route", () => {
  beforeEach(() => {
    queryMock.mockClear();
    queryMock.mockImplementation(
      async () =>
        ({
          rows: [],
          rowCount: 0,
        }) as QueryResult,
    );
  });

  it("returns 401 for GET /poems when user is missing", async () => {
    const app = buildApp(null);
    const res = await app.request("/poems");

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "Unauthorized" });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("returns 400 for POST /poems when payload is invalid", async () => {
    const app = buildApp({ id: "user-1" });
    const res = await app.request("/poems", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Only title",
      }),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "Invalid payload" });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("creates poem when payload is valid", async () => {
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const generatedId = "00000000-0000-4000-8000-000000000007";
    const uuidSpy = spyOn(crypto, "randomUUID").mockReturnValue(generatedId);

    const app = buildApp({ id: "user-1" });
    const res = await app.request("/poems", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Moonlight",
        summary: "Soft night verse",
        content: "Light over water, words over silence.",
      }),
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: generatedId });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO poems"),
      [
        generatedId,
        "Moonlight",
        "Soft night verse",
        "Light over water, words over silence.",
        "user-1",
      ],
    );

    uuidSpy.mockRestore();
  });
});

