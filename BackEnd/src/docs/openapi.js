/**
 * OpenAPI 3.1 description of the VideoTube REST API, served at /api-docs.
 * Built with tiny helpers to keep the spec readable and close to the routes.
 */
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const idParam = (name) => ({ name, in: "path", required: true, schema: { type: "string", pattern: "^[a-f0-9]{24}$" } });
const pageParams = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 12 } },
];
const json = (schema) => ({ content: { "application/json": { schema } } });
const multipart = (properties, required = []) => ({
  required: true,
  content: { "multipart/form-data": { schema: { type: "object", properties, required } } },
});
const ok = (data, description = "Success") => ({
  description,
  ...json({ allOf: [ref("ApiResponse"), { type: "object", properties: { data } }] }),
});
const page = (item) => ({
  allOf: [ref("Page"), { type: "object", properties: { docs: { type: "array", items: item } } }],
});
const errors = {
  400: { $ref: "#/components/responses/BadRequest" },
  401: { $ref: "#/components/responses/Unauthorized" },
  404: { $ref: "#/components/responses/NotFound" },
};

const op = (tag, summary, { auth = false, params = [], body, responses, description } = {}) => ({
  tags: [tag],
  summary,
  ...(description && { description }),
  ...(auth && { security: [{ bearerAuth: [] }, { cookieAuth: [] }] }),
  ...(params.length && { parameters: params }),
  ...(body && { requestBody: body }),
  responses: { 200: ok({}), ...responses, ...errors },
});

const file = { type: "string", format: "binary" };
const text = (max) => ({ type: "string", maxLength: max });

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "VideoTube API",
    version: "2.0.0",
    description:
      "REST API for VideoTube – a video sharing platform. All responses use the envelope `{ statusCode, success, message, data }`. Errors add `errors[]` and a `requestId` you can correlate with server logs.",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    "Health",
    "Auth",
    "Users",
    "Videos",
    "Comments",
    "Likes",
    "Playlists",
    "Subscriptions",
    "Community",
    "Dashboard",
  ].map((name) => ({ name })),
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      cookieAuth: { type: "apiKey", in: "cookie", name: "accessToken" },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          statusCode: { type: "integer" },
          success: { type: "boolean" },
          message: { type: "string" },
          data: {},
        },
      },
      ApiError: {
        type: "object",
        properties: {
          statusCode: { type: "integer" },
          success: { type: "boolean", const: false },
          message: { type: "string" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: { location: { type: "string" }, field: { type: "string" }, message: { type: "string" } },
            },
          },
          requestId: { type: "string" },
        },
      },
      Page: {
        type: "object",
        properties: {
          docs: { type: "array", items: {} },
          totalDocs: { type: "integer" },
          limit: { type: "integer" },
          page: { type: "integer" },
          totalPages: { type: "integer" },
          hasNextPage: { type: "boolean" },
          hasPrevPage: { type: "boolean" },
          nextPage: { type: ["integer", "null"] },
          prevPage: { type: ["integer", "null"] },
        },
      },
      PublicUser: {
        type: "object",
        properties: {
          _id: { type: "string" },
          username: { type: "string" },
          fullName: { type: "string" },
          avatar: { type: "string" },
        },
      },
      User: {
        allOf: [
          ref("PublicUser"),
          {
            type: "object",
            properties: {
              email: { type: "string" },
              coverImage: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      Video: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          videoFile: { type: "string" },
          thumbnail: { type: "string" },
          duration: { type: "number" },
          views: { type: "integer" },
          likes: { type: "integer" },
          isPublished: { type: "boolean" },
          owner: ref("PublicUser"),
          isLiked: { type: "boolean", description: "Only on detail endpoints" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Comment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          content: { type: "string" },
          owner: ref("PublicUser"),
          likesCount: { type: "integer" },
          isLiked: { type: "boolean" },
          createdAt: { type: "string" },
        },
      },
      Post: {
        type: "object",
        properties: {
          _id: { type: "string" },
          content: { type: "string" },
          owner: ref("PublicUser"),
          likesCount: { type: "integer" },
          isLiked: { type: "boolean" },
          createdAt: { type: "string" },
        },
      },
      Playlist: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          videos: { type: "array", items: ref("Video") },
          totalVideos: { type: "integer" },
          totalDuration: { type: "number" },
          owner: ref("PublicUser"),
        },
      },
      AuthTokens: {
        type: "object",
        properties: { accessToken: { type: "string" }, refreshToken: { type: "string" }, user: ref("User") },
      },
    },
    responses: {
      BadRequest: { description: "Validation failed", ...json(ref("ApiError")) },
      Unauthorized: { description: "Missing / invalid / expired token", ...json(ref("ApiError")) },
      NotFound: { description: "Resource not found", ...json(ref("ApiError")) },
    },
  },
  paths: {
    "/healthcheck": {
      get: op("Health", "Liveness & database readiness probe", {
        responses: { 503: { description: "Database unavailable" } },
      }),
    },

    "/users/register": {
      post: op("Auth", "Register a new account", {
        body: multipart(
          {
            fullName: text(60),
            email: { type: "string", format: "email" },
            username: text(30),
            password: { type: "string", minLength: 8 },
            avatar: file,
            coverImage: file,
          },
          ["fullName", "email", "username", "password", "avatar"]
        ),
        responses: { 201: ok(ref("User"), "Created"), 409: { description: "Email or username taken" } },
      }),
    },
    "/users/login": {
      post: op("Auth", "Log in with email or username", {
        body: json({
          type: "object",
          properties: { email: { type: "string" }, username: { type: "string" }, password: { type: "string" } },
          required: ["password"],
        }),
        responses: { 200: ok(ref("AuthTokens")) },
        description:
          "Sets httpOnly `accessToken`/`refreshToken` cookies and also returns the tokens for Bearer usage. Rate limited.",
      }),
    },
    "/users/refresh-token": {
      post: op("Auth", "Rotate refresh token", {
        body: json({ type: "object", properties: { refreshToken: { type: "string" } } }),
        responses: { 200: ok(ref("AuthTokens")) },
        description: "Refresh tokens are single-use (rotation). Re-using an old token revokes the session.",
      }),
    },
    "/users/logout": { post: op("Auth", "Log out (revokes refresh token)", { auth: true }) },
    "/users/change-password": {
      post: op("Auth", "Change password (signs out other sessions)", {
        auth: true,
        body: json({
          type: "object",
          properties: { oldPassword: { type: "string" }, newPassword: { type: "string", minLength: 8 } },
          required: ["oldPassword", "newPassword"],
        }),
        responses: { 200: ok(ref("AuthTokens")) },
      }),
    },
    "/users/current-user": {
      get: op("Users", "Get the signed-in user", { auth: true, responses: { 200: ok(ref("User")) } }),
    },
    "/users/update-account": {
      patch: op("Users", "Update name / email", {
        auth: true,
        body: json({ type: "object", properties: { fullName: { type: "string" }, email: { type: "string" } } }),
        responses: { 200: ok(ref("User")) },
      }),
    },
    "/users/avatar": {
      patch: op("Users", "Replace avatar", {
        auth: true,
        body: multipart({ avatar: file }, ["avatar"]),
        responses: { 200: ok(ref("User")) },
      }),
    },
    "/users/cover-image": {
      patch: op("Users", "Replace cover image", {
        auth: true,
        body: multipart({ coverImage: file }, ["coverImage"]),
        responses: { 200: ok(ref("User")) },
      }),
    },
    "/users/watch-history": {
      get: op("Users", "Watch history (most recent first, max 50)", {
        auth: true,
        responses: { 200: ok({ type: "array", items: ref("Video") }) },
      }),
      delete: op("Users", "Clear watch history", { auth: true }),
    },
    "/users/watch-history/{videoId}": {
      delete: op("Users", "Remove one video from history", { auth: true, params: [idParam("videoId")] }),
    },
    "/users/c/{username}": {
      get: op("Users", "Public channel profile", {
        params: [{ name: "username", in: "path", required: true, schema: { type: "string" } }],
        description: "Includes subscribersCount, videosCount, totalViews and (when signed in) isSubscribed.",
      }),
    },

    "/videos": {
      get: op("Videos", "List / search published videos", {
        params: [
          ...pageParams,
          { name: "query", in: "query", schema: { type: "string" } },
          { name: "userId", in: "query", schema: { type: "string" } },
          {
            name: "sortBy",
            in: "query",
            schema: { type: "string", enum: ["createdAt", "views", "likes", "duration", "title"] },
          },
          { name: "sortType", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
        ],
        responses: { 200: ok(page(ref("Video"))) },
      }),
    },
    "/videos/publish": {
      post: op("Videos", "Upload & publish a video", {
        auth: true,
        body: multipart(
          {
            title: text(120),
            description: text(5000),
            videoFile: file,
            thumbnail: file,
            isPublished: { type: "string", enum: ["true", "false"] },
          },
          ["title", "videoFile", "thumbnail"]
        ),
        responses: { 201: ok(ref("Video"), "Created"), 413: { description: "File too large" } },
      }),
    },
    "/videos/{videoId}": {
      get: op("Videos", "Video details (+ isLiked, owner.isSubscribed)", {
        params: [idParam("videoId")],
        responses: { 200: ok(ref("Video")) },
      }),
      patch: op("Videos", "Update title / description / thumbnail (owner only)", {
        auth: true,
        params: [idParam("videoId")],
        body: multipart({ title: text(120), description: text(5000), thumbnail: file }),
        responses: { 403: { description: "Not the owner" } },
      }),
      delete: op("Videos", "Delete a video and all related data (owner only)", {
        auth: true,
        params: [idParam("videoId")],
        responses: { 403: { description: "Not the owner" } },
      }),
    },
    "/videos/{videoId}/view": {
      patch: op("Videos", "Register a unique view + update watch history", { params: [idParam("videoId")] }),
    },
    "/videos/{videoId}/toggle-publish": {
      patch: op("Videos", "Publish / unpublish (owner only)", { auth: true, params: [idParam("videoId")] }),
    },
    "/videos/{videoId}/related": {
      get: op("Videos", "Up-next suggestions", {
        params: [idParam("videoId")],
        responses: { 200: ok({ type: "array", items: ref("Video") }) },
      }),
    },

    "/comments/{videoId}": {
      get: op("Comments", "Paginated comments of a video", {
        params: [idParam("videoId"), ...pageParams],
        responses: { 200: ok(page(ref("Comment"))) },
      }),
      post: op("Comments", "Add a comment", {
        auth: true,
        params: [idParam("videoId")],
        body: json({ type: "object", properties: { content: text(2000) }, required: ["content"] }),
        responses: { 201: ok(ref("Comment")) },
      }),
    },
    "/comments/{commentId}": {
      patch: op("Comments", "Edit own comment", {
        auth: true,
        params: [idParam("commentId")],
        body: json({ type: "object", properties: { content: text(2000) } }),
      }),
      delete: op("Comments", "Delete own comment", { auth: true, params: [idParam("commentId")] }),
    },

    "/likes/video/{videoId}": {
      post: op("Likes", "Toggle like on a video", { auth: true, params: [idParam("videoId")] }),
      get: op("Likes", "Has the current user liked this video?", { auth: true, params: [idParam("videoId")] }),
    },
    "/likes/comment/{commentId}": {
      post: op("Likes", "Toggle like on a comment", { auth: true, params: [idParam("commentId")] }),
    },
    "/likes/community/{postId}": {
      post: op("Likes", "Toggle like on a community post", { auth: true, params: [idParam("postId")] }),
    },
    "/likes/videos": {
      get: op("Likes", "Videos liked by the current user", {
        auth: true,
        params: pageParams,
        responses: { 200: ok(page(ref("Video"))) },
      }),
    },

    "/playlists": {
      post: op("Playlists", "Create playlist", {
        auth: true,
        body: json({ type: "object", properties: { name: text(100), description: text(1000) }, required: ["name"] }),
        responses: { 201: ok(ref("Playlist")) },
      }),
    },
    "/playlists/{playlistId}": {
      get: op("Playlists", "Playlist with ordered videos", {
        params: [idParam("playlistId")],
        responses: { 200: ok(ref("Playlist")) },
      }),
      patch: op("Playlists", "Rename / describe (owner only)", {
        auth: true,
        params: [idParam("playlistId")],
        body: json({ type: "object", properties: { name: text(100), description: text(1000) } }),
      }),
      delete: op("Playlists", "Delete (owner only)", { auth: true, params: [idParam("playlistId")] }),
    },
    "/playlists/user/{userId}": {
      get: op("Playlists", "Playlists of a user", {
        params: [idParam("userId")],
        responses: { 200: ok({ type: "array", items: ref("Playlist") }) },
      }),
    },
    "/playlists/add/{playlistId}/{videoId}": {
      post: op("Playlists", "Add video (idempotent)", {
        auth: true,
        params: [idParam("playlistId"), idParam("videoId")],
      }),
    },
    "/playlists/{playlistId}/{videoId}": {
      delete: op("Playlists", "Remove video", { auth: true, params: [idParam("playlistId"), idParam("videoId")] }),
    },

    "/subscriptions/{channelId}": {
      post: op("Subscriptions", "Toggle subscription", { auth: true, params: [idParam("channelId")] }),
    },
    "/subscriptions/channel/{channelId}": {
      get: op("Subscriptions", "Subscribers of a channel", {
        auth: true,
        params: [idParam("channelId"), ...pageParams],
      }),
    },
    "/subscriptions/user/{channelId}": {
      get: op("Subscriptions", "Channels a user follows", { auth: true, params: [idParam("channelId")] }),
    },
    "/subscriptions/feed": {
      get: op("Subscriptions", "Latest videos from followed channels", {
        auth: true,
        params: pageParams,
        responses: { 200: ok(page(ref("Video"))) },
      }),
    },

    "/community": {
      get: op("Community", "Global community feed", { params: pageParams, responses: { 200: ok(page(ref("Post"))) } }),
      post: op("Community", "Create a post", {
        auth: true,
        body: json({ type: "object", properties: { content: text(2000) }, required: ["content"] }),
        responses: { 201: ok(ref("Post")) },
      }),
    },
    "/community/{channelId}": {
      get: op("Community", "Posts of a channel", {
        params: [idParam("channelId"), ...pageParams],
        responses: { 200: ok(page(ref("Post"))) },
      }),
    },
    "/community/{postId}": {
      patch: op("Community", "Edit own post", {
        auth: true,
        params: [idParam("postId")],
        body: json({ type: "object", properties: { content: text(2000) } }),
      }),
      delete: op("Community", "Delete own post", { auth: true, params: [idParam("postId")] }),
    },

    "/dashboard/stats": {
      get: op("Dashboard", "Creator analytics (views, likes, subscribers, top videos, monthly uploads)", {
        auth: true,
      }),
    },
    "/dashboard/videos": {
      get: op("Dashboard", "All own videos incl. drafts, with comment counts", {
        auth: true,
        params: pageParams,
        responses: { 200: ok(page(ref("Video"))) },
      }),
    },
  },
};
