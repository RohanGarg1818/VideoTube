import { z } from "zod";
import { idParams, nonEmptyText, paginationQuery } from "./common.js";

/* comments */
export const listCommentsSchema = { params: idParams("videoId"), query: paginationQuery };
export const addCommentSchema = {
  params: z.object({ videoId: idParams("videoId").shape.videoId, channelId: z.string().optional() }),
  body: z.object({ content: nonEmptyText("Comment", 2000) }),
};
export const updateCommentSchema = {
  params: idParams("commentId"),
  body: z.object({ content: nonEmptyText("Comment", 2000) }),
};
export const commentIdParams = { params: idParams("commentId") };

/* community */
export const communityPostSchema = { body: z.object({ content: nonEmptyText("Post", 2000) }) };
export const updatePostSchema = { params: idParams("postId"), body: z.object({ content: nonEmptyText("Post", 2000) }) };
export const postIdParams = { params: idParams("postId") };
export const feedSchema = { query: paginationQuery };
export const channelFeedSchema = { params: idParams("channelId"), query: paginationQuery };

/* playlists */
export const createPlaylistSchema = {
  body: z.object({ name: nonEmptyText("Name", 100), description: z.string().trim().max(1000).optional().default("") }),
};
export const updatePlaylistSchema = {
  params: idParams("playlistId"),
  body: z.object({ name: nonEmptyText("Name", 100), description: z.string().trim().max(1000).optional().default("") }),
};
export const playlistIdParams = { params: idParams("playlistId") };
export const playlistVideoParams = { params: idParams("playlistId", "videoId") };
export const userIdParams = { params: idParams("userId") };

/* likes & subscriptions */
export const likeVideoParams = { params: idParams("videoId") };
export const likeCommentParams = { params: idParams("commentId") };
export const likePostParams = { params: idParams("postId") };
export const channelIdParams = { params: idParams("channelId") };
export const paginated = { query: paginationQuery };
