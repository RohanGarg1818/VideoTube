import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import { setupTestApp, createUser, publishVideo, png } from "./helpers.js";

describe("Videos", () => {
  let ctx, request, alice, bob;
  before(async () => {
    ctx = await setupTestApp();
    request = supertest(ctx.app);
    alice = await createUser(request);
    bob = await createUser(request);
  });
  after(() => ctx.teardown());

  it("publishes a video", async () => {
    const video = await publishVideo(request, alice.auth, { title: "Learning MongoDB" });
    assert.equal(video.title, "Learning MongoDB");
    assert.ok(video.videoFile.startsWith("https://"));
    assert.ok(video.duration >= 0);
  });

  it("requires a thumbnail and a video file", async () => {
    const res = await request
      .post("/api/v1/videos/publish")
      .set(alice.auth)
      .field("title", "No files")
      .attach("thumbnail", png, { filename: "t.png", contentType: "image/png" });
    assert.equal(res.status, 400);
  });

  it("lists with pagination, search and safe regex", async () => {
    for (let i = 0; i < 3; i++) await publishVideo(request, bob.auth, { title: `Node tutorial ${i}` });
    const res = await request.get("/api/v1/videos").query({ query: "node tutorial", limit: 2 });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.docs.length, 2);
    assert.equal(res.body.data.totalDocs, 3);
    assert.equal(res.body.data.hasNextPage, true);
    assert.ok(res.body.data.docs[0].owner.username);
    assert.equal(res.body.data.docs[0].owner.password, undefined);

    const evil = await request.get("/api/v1/videos").query({ query: "(a+)+$" });
    assert.equal(evil.status, 200);
  });

  it("rejects invalid sort fields and ids", async () => {
    assert.equal((await request.get("/api/v1/videos").query({ sortBy: "password" })).status, 400);
    assert.equal((await request.get("/api/v1/videos/not-an-id")).status, 400);
  });

  it("only lets the owner edit, toggle or delete", async () => {
    const video = await publishVideo(request, alice.auth);
    const edit = await request.patch(`/api/v1/videos/${video._id}`).set(bob.auth).field("title", "hacked");
    assert.equal(edit.status, 403);
    const toggle = await request.patch(`/api/v1/videos/${video._id}/toggle-publish`).set(bob.auth);
    assert.equal(toggle.status, 403);
    const del = await request.delete(`/api/v1/videos/${video._id}`).set(bob.auth);
    assert.equal(del.status, 403);

    const ok = await request.patch(`/api/v1/videos/${video._id}`).set(alice.auth).field("title", "Renamed");
    assert.equal(ok.status, 200);
    assert.equal(ok.body.data.title, "Renamed");
  });

  it("hides unpublished videos from everyone but the owner", async () => {
    const video = await publishVideo(request, alice.auth, { title: "Secret draft" });
    await request.patch(`/api/v1/videos/${video._id}/toggle-publish`).set(alice.auth).expect(200);

    assert.equal((await request.get(`/api/v1/videos/${video._id}`)).status, 404);
    assert.equal((await request.get(`/api/v1/videos/${video._id}`).set(bob.auth)).status, 404);
    assert.equal((await request.get(`/api/v1/videos/${video._id}`).set(alice.auth)).status, 200);

    const list = await request.get("/api/v1/videos").query({ query: "Secret draft" });
    assert.equal(list.body.data.totalDocs, 0);
  });

  it("counts unique views and maintains watch history", async () => {
    const v1 = await publishVideo(request, alice.auth, { title: "View me" });
    const v2 = await publishVideo(request, alice.auth, { title: "View me too" });

    await Promise.all([1, 2, 3].map(() => request.patch(`/api/v1/videos/${v1._id}/view`).set(bob.auth)));
    await request.patch(`/api/v1/videos/${v2._id}/view`).set(bob.auth).expect(200);
    await request.patch(`/api/v1/videos/${v1._id}/view`).set(bob.auth).expect(200);

    const video = await request.get(`/api/v1/videos/${v1._id}`);
    assert.equal(video.body.data.views, 1);
    assert.equal(video.body.data.viewers, undefined);

    const history = await request.get("/api/v1/users/watch-history").set(bob.auth);
    assert.deepEqual(
      history.body.data.map((v) => v._id),
      [v1._id, v2._id]
    );
    assert.ok(history.body.data[0].owner.username);
  });

  it("returns personalised details and related videos", async () => {
    const video = await publishVideo(request, alice.auth);
    await request.post(`/api/v1/likes/video/${video._id}`).set(bob.auth).expect(200);
    await request.post(`/api/v1/subscriptions/${alice.user._id}`).set(bob.auth).expect(200);

    const res = await request.get(`/api/v1/videos/${video._id}`).set(bob.auth);
    assert.equal(res.body.data.isLiked, true);
    assert.equal(res.body.data.likes, 1);
    assert.equal(res.body.data.owner.isSubscribed, true);
    assert.equal(res.body.data.owner.subscribersCount, 1);

    const related = await request.get(`/api/v1/videos/${video._id}/related`);
    assert.equal(related.status, 200);
    assert.ok(related.body.data.every((v) => v._id !== video._id));
  });

  it("cascades deletes to comments, likes, playlists and history", async () => {
    const video = await publishVideo(request, alice.auth);
    await request.post(`/api/v1/comments/${video._id}`).set(bob.auth).send({ content: "Nice!" }).expect(201);
    await request.post(`/api/v1/likes/video/${video._id}`).set(bob.auth).expect(200);
    await request.patch(`/api/v1/videos/${video._id}/view`).set(bob.auth).expect(200);
    const pl = await request.post("/api/v1/playlists").set(bob.auth).send({ name: "Faves" });
    await request.post(`/api/v1/playlists/add/${pl.body.data._id}/${video._id}`).set(bob.auth).expect(200);

    await request.delete(`/api/v1/videos/${video._id}`).set(alice.auth).expect(200);

    const playlist = await request.get(`/api/v1/playlists/${pl.body.data._id}`);
    assert.equal(playlist.body.data.videos.length, 0);
    const history = await request.get("/api/v1/users/watch-history").set(bob.auth);
    assert.ok(!history.body.data.some((v) => v._id === video._id));
    const comments = await request.get(`/api/v1/comments/${video._id}`);
    assert.equal(comments.status, 404);
  });

  it("serves creator dashboard stats", async () => {
    const creator = await createUser(request);
    const v = await publishVideo(request, creator.auth);
    await publishVideo(request, creator.auth);
    await request.patch(`/api/v1/videos/${v._id}/toggle-publish`).set(creator.auth);
    await request.patch(`/api/v1/videos/${v._id}/view`).set(creator.auth);

    const stats = await request.get("/api/v1/dashboard/stats").set(creator.auth);
    assert.equal(stats.status, 200);
    assert.equal(stats.body.data.totalVideos, 2);
    assert.equal(stats.body.data.draftVideos, 1);
    assert.equal(stats.body.data.totalViews, 1);

    const videos = await request.get("/api/v1/dashboard/videos").set(creator.auth);
    assert.equal(videos.body.data.totalDocs, 2);
  });
});
