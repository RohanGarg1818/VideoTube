import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import { setupTestApp, createUser, png } from "./helpers.js";

describe("Auth & users", () => {
  let ctx, request;
  before(async () => {
    ctx = await setupTestApp();
    request = supertest(ctx.app);
  });
  after(() => ctx.teardown());

  it("reports health", async () => {
    const res = await request.get("/api/v1/healthcheck");
    assert.equal(res.status, 200);
    assert.equal(res.body.data.database, "connected");
    assert.ok(res.headers["x-request-id"]);
  });

  it("validates registration input", async () => {
    const res = await request
      .post("/api/v1/users/register")
      .field("fullName", "X")
      .field("email", "not-an-email")
      .field("username", "ab")
      .field("password", "123")
      .attach("avatar", png, { filename: "a.png", contentType: "image/png" });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.length >= 3);
  });

  it("rejects non-image avatars", async () => {
    const res = await request
      .post("/api/v1/users/register")
      .field("fullName", "X")
      .field("email", "x@test.dev")
      .field("username", "xuser")
      .field("password", "password123")
      .attach("avatar", Buffer.from("hi"), { filename: "a.txt", contentType: "text/plain" });
    assert.equal(res.status, 400);
  });

  it("registers, logs in and never leaks secrets", async () => {
    const { user, token, auth } = await createUser(request, { username: "rohan_dev", email: "rohan@test.dev" });
    assert.ok(token);
    assert.equal(user.password, undefined);
    assert.equal(user.refreshToken, undefined);

    const me = await request.get("/api/v1/users/current-user").set(auth);
    assert.equal(me.status, 200);
    assert.equal(me.body.data.username, "rohan_dev");
    assert.equal(me.body.data.password, undefined);
  });

  it("rejects duplicate username / email with 409", async () => {
    await createUser(request, { username: "dupe_user", email: "dupe@test.dev" });
    const res = await request
      .post("/api/v1/users/register")
      .field("fullName", "Dupe")
      .field("email", "dupe@test.dev")
      .field("username", "another_one")
      .field("password", "password123")
      .attach("avatar", png, { filename: "a.png", contentType: "image/png" });
    assert.equal(res.status, 409);
  });

  it("uses one generic error for bad credentials", async () => {
    const a = await request.post("/api/v1/users/login").send({ username: "nobody_here", password: "password123" });
    const b = await request.post("/api/v1/users/login").send({ username: "rohan_dev", password: "wrong-pass" });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.body.message, b.body.message);
  });

  it("blocks NoSQL operator injection in login", async () => {
    const res = await request.post("/api/v1/users/login").send({ username: { $ne: null }, password: { $ne: null } });
    assert.equal(res.status, 400);
  });

  it("rotates refresh tokens and detects reuse", async () => {
    const { refreshToken } = await createUser(request);
    const first = await request.post("/api/v1/users/refresh-token").send({ refreshToken });
    assert.equal(first.status, 200);
    assert.ok(first.body.data.refreshToken);
    assert.notEqual(first.body.data.refreshToken, refreshToken);

    // replaying the old token revokes the session…
    const replay = await request.post("/api/v1/users/refresh-token").send({ refreshToken });
    assert.equal(replay.status, 401);
    // …so even the newest token stops working
    const after = await request
      .post("/api/v1/users/refresh-token")
      .send({ refreshToken: first.body.data.refreshToken });
    assert.equal(after.status, 401);
  });

  it("requires auth on protected routes", async () => {
    const res = await request.get("/api/v1/users/current-user");
    assert.equal(res.status, 401);
    const bad = await request.get("/api/v1/users/current-user").set("Authorization", "Bearer nope");
    assert.equal(bad.status, 401);
  });

  it("changes password and returns fresh tokens", async () => {
    const { auth, credentials } = await createUser(request);
    const wrong = await request
      .post("/api/v1/users/change-password")
      .set(auth)
      .send({ oldPassword: "nope", newPassword: "newpassword1" });
    assert.equal(wrong.status, 400);

    const res = await request
      .post("/api/v1/users/change-password")
      .set(auth)
      .send({ oldPassword: credentials.password, newPassword: "newpassword1" });
    assert.equal(res.status, 200);
    assert.ok(res.body.data.accessToken);

    const login = await request
      .post("/api/v1/users/login")
      .send({ email: credentials.email, password: "newpassword1" });
    assert.equal(login.status, 200);
  });

  it("returns a public channel profile without email", async () => {
    const owner = await createUser(request, { username: "channel_owner" });
    const fan = await createUser(request);
    await request.post(`/api/v1/subscriptions/${owner.user._id}`).set(fan.auth).expect(200);

    const res = await request.get("/api/v1/users/c/channel_owner").set(fan.auth);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.subscribersCount, 1);
    assert.equal(res.body.data.isSubscribed, true);
    assert.equal(res.body.data.email, undefined);

    const anon = await request.get("/api/v1/users/c/channel_owner");
    assert.equal(anon.body.data.isSubscribed, false);
  });

  it("returns JSON 404 for unknown routes", async () => {
    const res = await request.get("/api/v1/does-not-exist");
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  it("serves the OpenAPI spec", async () => {
    const res = await request.get("/api-docs.json");
    assert.equal(res.status, 200);
    assert.equal(res.body.openapi, "3.1.0");
  });
});
