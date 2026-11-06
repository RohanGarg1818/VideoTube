import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import { setupTestApp, createUser, publishVideo } from "./helpers.js";

describe("Likes, comments, playlists, subscriptions, community", () => {
  let ctx, request, alice, bob, video;
  before(async () => {
    ctx = await setupTestApp();
    request = supertest(ctx.app);
    alice = await createUser(request);
    bob = await createUser(request);
    video = await publishVideo(request, alice.auth);
  });
  after(() => ctx.teardown());

  it("toggles video likes without double counting under concurrency", async () => {
    await Promise.all(Array.from({ length: 5 }, () => request.post(`/api/v1/likes/video/${video._id}`).set(bob.auth)));
    const v = await request.get(`/api/v1/videos/${video._id}`).set(bob.auth);
    // 5 toggles = liked, but whatever interleaving happened the counter must match reality
    const status = await request.get(`/api/v1/likes/video/${video._id}`).set(bob.auth);
    assert.equal(v.body.data.likes, status.body.data.isLiked ? 1 : 0);

    const liked = await request.get("/api/v1/likes/videos").set(bob.auth);
    assert.equal(liked.body.data.docs.length, status.body.data.isLiked ? 1 : 0);
  });

  it("paginates comments with like counts and enforces ownership", async () => {
    for (let i = 0; i < 3; i++) {
      await request
        .post(`/api/v1/comments/${video._id}`)
        .set(bob.auth)
        .send({ content: `comment ${i}` })
        .expect(201);
    }
    const page = await request.get(`/api/v1/comments/${video._id}`).query({ limit: 2 });
    assert.equal(page.body.data.docs.length, 2);
    assert.equal(page.body.data.totalDocs, 3);
    const commentId = page.body.data.docs[0]._id;

    const like = await request.post(`/api/v1/likes/comment/${commentId}`).set(alice.auth);
    assert.equal(like.body.data.isCommentLiked, true);
    assert.equal(like.body.data.likesCount, 1);

    const withViewer = await request.get(`/api/v1/comments/${video._id}`).set(alice.auth);
    assert.equal(withViewer.body.data.docs[0].isLiked, true);

    assert.equal(
      (await request.patch(`/api/v1/comments/${commentId}`).set(alice.auth).send({ content: "x" })).status,
      403
    );
    assert.equal(
      (await request.post(`/api/v1/comments/${video._id}`).set(bob.auth).send({ content: "   " })).status,
      400
    );
    assert.equal((await request.delete(`/api/v1/comments/${commentId}`).set(bob.auth)).status, 200);
  });

  it("keeps the legacy comment route working", async () => {
    const res = await request
      .post(`/api/v1/comments/add/${alice.user._id}/${video._id}`)
      .set(bob.auth)
      .send({ content: "legacy" });
    assert.equal(res.status, 201);
  });

  it("protects playlists and keeps order", async () => {
    const v2 = await publishVideo(request, alice.auth, { title: "Second" });
    const created = await request.post("/api/v1/playlists").set(bob.auth).send({ name: "Watch later" });
    assert.equal(created.status, 201);
    const id = created.body.data._id;

    await request.post(`/api/v1/playlists/add/${id}/${v2._id}`).set(bob.auth).expect(200);
    await request.post(`/api/v1/playlists/add/${id}/${video._id}`).set(bob.auth).expect(200);
    await request.post(`/api/v1/playlists/add/${id}/${video._id}`).set(bob.auth).expect(200); // idempotent

    const pl = await request.get(`/api/v1/playlists/${id}`);
    assert.deepEqual(
      pl.body.data.videos.map((v) => v._id),
      [v2._id, video._id]
    );
    assert.equal(pl.body.data.owner.password, undefined);
    assert.equal(pl.body.data.owner.refreshToken, undefined);
    assert.equal(pl.body.data.videos[0].owner.password, undefined);

    assert.equal((await request.post(`/api/v1/playlists/add/${id}/${video._id}`).set(alice.auth)).status, 403);
    assert.equal((await request.patch(`/api/v1/playlists/${id}`).set(alice.auth).send({ name: "mine" })).status, 403);
    assert.equal((await request.delete(`/api/v1/playlists/${id}`).set(alice.auth)).status, 403);
    assert.equal((await request.delete(`/api/v1/playlists/${id}/${video._id}`).set(bob.auth)).status, 200);
  });

  it("handles subscriptions and the subscription feed", async () => {
    assert.equal((await request.post(`/api/v1/subscriptions/${bob.user._id}`).set(bob.auth)).status, 400);

    const sub = await request.post(`/api/v1/subscriptions/${alice.user._id}`).set(bob.auth);
    assert.deepEqual(sub.body.data, { isSubscribed: true, subscribersCount: 1 });

    const channels = await request.get(`/api/v1/subscriptions/user/${bob.user._id}`).set(bob.auth);
    assert.equal(channels.body.data[0].channel.username, alice.user.username);
    assert.equal(channels.body.data[0].channel.subscribersCount, 1);

    const feed = await request.get("/api/v1/subscriptions/feed").set(bob.auth);
    assert.ok(feed.body.data.totalDocs >= 1);

    const unsub = await request.post(`/api/v1/subscriptions/${alice.user._id}`).set(bob.auth);
    assert.deepEqual(unsub.body.data, { isSubscribed: false, subscribersCount: 0 });
  });

  it("supports community posts with likes", async () => {
    const post = await request.post("/api/v1/community").set(alice.auth).send({ content: "Hello world" });
    assert.equal(post.status, 201);
    const id = post.body.data._id;

    const like = await request.post(`/api/v1/likes/community/${id}`).set(bob.auth);
    assert.deepEqual(like.body.data, { isCommunityLiked: true, likesCount: 1 });

    const feed = await request.get("/api/v1/community").set(bob.auth);
    assert.equal(feed.body.data.docs[0].likesCount, 1);
    assert.equal(feed.body.data.docs[0].isLiked, true);

    assert.equal((await request.delete(`/api/v1/community/${id}`).set(bob.auth)).status, 403);
    assert.equal((await request.delete(`/api/v1/community/${id}`).set(alice.auth)).status, 200);
  });
});
