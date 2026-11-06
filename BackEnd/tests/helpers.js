import { MongoMemoryServer } from "mongodb-memory-server";

/**
 * Boots an in-memory MongoDB, configures env for tests and lazily imports the app
 * (env is validated at import time, so variables must be set first).
 */
export async function setupTestApp() {
  const mongo = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: "test",
    MONGODB_URI: mongo.getUri(),
    DB_NAME: "videotube-test",
    ACCESS_TOKEN_SECRET: "test-access-secret-0123456789",
    REFRESH_TOKEN_SECRET: "test-refresh-secret-0123456789",
    ACCESS_TOKEN_EXPIRY: "15m",
    REFRESH_TOKEN_EXPIRY: "1d",
    BCRYPT_SALT_ROUNDS: "8",
    MEDIA_STORAGE: "mock",
    RATE_LIMIT_ENABLED: "false",
    LOG_LEVEL: process.env.TEST_LOG_LEVEL || "silent",
    API_DOCS_ENABLED: "true",
  });

  const [{ app }, db, mongoose] = await Promise.all([
    import("../src/app.js"),
    import("../src/db/index.js"),
    import("mongoose"),
  ]);
  await db.connectDB();
  await mongoose.default.connection.syncIndexes();

  return {
    app,
    async teardown() {
      await mongoose.default.connection.dropDatabase();
      await db.disconnectDB();
      await mongo.stop();
    },
  };
}

export const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
export const mp4 = Buffer.from("00000018667479706d703432", "hex");

let counter = 0;
/** Registers + logs in a fresh user and returns { user, token, refreshToken, auth } */
export async function createUser(request, overrides = {}) {
  counter += 1;
  const data = {
    fullName: `Test User ${counter}`,
    email: `user${counter}_${Date.now()}@test.dev`,
    username: `user${counter}_${Date.now()}`.slice(0, 30),
    password: "password123",
    ...overrides,
  };
  const reg = await request
    .post("/api/v1/users/register")
    .field("fullName", data.fullName)
    .field("email", data.email)
    .field("username", data.username)
    .field("password", data.password)
    .attach("avatar", png, { filename: "avatar.png", contentType: "image/png" });
  if (reg.status !== 201) throw new Error(`register failed: ${reg.status} ${JSON.stringify(reg.body)}`);

  const login = await request.post("/api/v1/users/login").send({ email: data.email, password: data.password });
  const { accessToken, refreshToken, user } = login.body.data;
  return {
    user,
    token: accessToken,
    refreshToken,
    auth: { Authorization: `Bearer ${accessToken}` },
    credentials: data,
  };
}

export async function publishVideo(request, auth, overrides = {}) {
  const res = await request
    .post("/api/v1/videos/publish")
    .set(auth)
    .field("title", overrides.title ?? "My first video")
    .field("description", overrides.description ?? "A description")
    .attach("videoFile", mp4, { filename: "clip.mp4", contentType: "video/mp4" })
    .attach("thumbnail", png, { filename: "thumb.png", contentType: "image/png" });
  if (res.status !== 201) throw new Error(`publish failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data;
}
