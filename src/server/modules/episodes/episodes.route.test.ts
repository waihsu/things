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

const { default: episodesRoute } = await import("./episodes.route");

const buildApp = (user: { id: string } | null) => {
  const app = new Hono<AppBindings>();
  app.use("*", async (c, next) => {
    c.set("user", user as AppBindings["Variables"]["user"]);
    c.set("session", null);
    await next();
  });
  app.route("/episodes", episodesRoute);
  return app;
};

describe("episodes route", () => {
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

  it("returns 401 for GET /episodes when user is missing", async () => {
    const app = buildApp(null);
    const res = await app.request("/episodes");

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "Unauthorized" });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("filters episodes by series_id when query param is provided", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: "ep-1", name: "Episode 1" }],
      rowCount: 1,
    });

    const app = buildApp({ id: "user-1" });
    const res = await app.request("/episodes?series_id=serie-1");
    const body = (await res.json()) as { episodes: Array<{ id: string }> };

    expect(res.status).toBe(200);
    expect(body.episodes).toHaveLength(1);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("WHERE e.serie_id = $1"),
      ["serie-1"],
    );
  });

  it("returns 400 for POST /episodes when payload is invalid", async () => {
    const app = buildApp({ id: "user-1" });
    const res = await app.request("/episodes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Episode title",
      }),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "Invalid payload" });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("returns 403 for POST /episodes when user does not own series", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ user_id: "other-user" }],
      rowCount: 1,
    });

    const app = buildApp({ id: "user-1" });
    const res = await app.request("/episodes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Episode title",
        paragraph: "Body",
        series_id: "serie-1",
      }),
    });

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "Forbidden" });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("SELECT user_id FROM series WHERE id = $1"),
      ["serie-1"],
    );
  });

  it("creates episode when payload is valid and user owns series", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ user_id: "user-1" }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

    const generatedId = "00000000-0000-4000-8000-000000000001";
    const uuidSpy = spyOn(crypto, "randomUUID").mockReturnValue(generatedId);
    const app = buildApp({ id: "user-1" });
    const res = await app.request("/episodes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Episode title",
        paragraph: "Body",
        order: 2,
        series_id: "serie-1",
      }),
    });
    const body = (await res.json()) as { id: string };

    expect(res.status).toBe(201);
    expect(body).toEqual({ id: generatedId });
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO episodes"),
      [generatedId, "Episode title", "serie-1", "Body", 2],
    );

    uuidSpy.mockRestore();
  });

  it("returns 403 for PUT /episodes/:id when user does not own episode", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    const app = buildApp({ id: "user-1" });
    const res = await app.request("/episodes/ep-1", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated title",
        paragraph: "Updated body",
        order: 3,
      }),
    });

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "Forbidden" });
  });

  it("deletes episode when user owns it", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ user_id: "user-1" }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

    const app = buildApp({ id: "user-1" });
    const res = await app.request("/episodes/ep-1", {
      method: "DELETE",
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Deleted" });
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      "DELETE FROM episodes WHERE id = $1",
      ["ep-1"],
    );
  });
});

