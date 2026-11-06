import type { AxiosProgressEvent } from "axios";
import { api, unwrap } from "./api";

/* ===== Types ===== */
export interface User {
  _id: string;
  username: string;
  email?: string;
  fullName: string;
  avatar?: string;
  coverImage?: string;
  createdAt?: string;
}

export interface Channel extends User {
  subscribersCount?: number;
  channelsSubscribedToCount?: number;
  videosCount?: number;
  totalViews?: number;
  isSubscribed?: boolean;
}

export interface Video {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  videoFile?: string;
  duration?: number;
  views?: number;
  likes?: number;
  isPublished?: boolean;
  isLiked?: boolean;
  commentsCount?: number;
  createdAt?: string;
  owner?:
    | (User & { subscribersCount?: number; isSubscribed?: boolean })
    | string;
}

export interface Comment {
  _id: string;
  content: string;
  owner?: User | string;
  createdAt?: string;
  video?: string;
  likesCount?: number;
  isLiked?: boolean;
}

export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  videos?: Video[];
  totalVideos?: number;
  totalDuration?: number;
  totalViews?: number;
  owner?: User | string;
  updatedAt?: string;
}

export interface CommunityPost {
  _id: string;
  content: string;
  owner?: User | string;
  createdAt?: string;
  likesCount?: number;
  isLiked?: boolean;
}

export interface Page<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user?: User;
}

export interface ChannelStats {
  totalVideos: number;
  publishedVideos: number;
  draftVideos: number;
  totalViews: number;
  totalLikes: number;
  totalDuration: number;
  totalComments: number;
  subscribersCount: number;
  newSubscribersLast30Days: number;
  topVideos: Video[];
  uploadsByMonth: { month: string; uploads: number; views: number }[];
}

type PageParams = { page?: number; limit?: number };

/* ===== Auth & users ===== */
export const AuthAPI = {
  register: (form: FormData) =>
    api.post("/users/register", form).then((r) => unwrap<User>(r.data)),
  login: (body: { email?: string; username?: string; password: string }) =>
    api.post("/users/login", body).then((r) => unwrap<AuthTokens>(r.data)),
  logout: () => api.post("/users/logout").then((r) => r.data),
  me: () => api.get("/users/current-user").then((r) => unwrap<User>(r.data)),
  changePassword: (body: { oldPassword: string; newPassword: string }) =>
    api
      .post("/users/change-password", body)
      .then((r) => unwrap<AuthTokens>(r.data)),
  updateAccount: (body: Partial<Pick<User, "fullName" | "email">>) =>
    api.patch("/users/update-account", body).then((r) => unwrap<User>(r.data)),
  updateAvatar: (file: File) => {
    const f = new FormData();
    f.append("avatar", file);
    return api.patch("/users/avatar", f).then((r) => unwrap<User>(r.data));
  },
  updateCover: (file: File) => {
    const f = new FormData();
    f.append("coverImage", file);
    return api.patch("/users/cover-image", f).then((r) => unwrap<User>(r.data));
  },
  watchHistory: () =>
    api.get("/users/watch-history").then((r) => unwrap<Video[]>(r.data)),
  clearHistory: () => api.delete("/users/watch-history").then((r) => r.data),
  removeFromHistory: (videoId: string) =>
    api.delete(`/users/watch-history/${videoId}`).then((r) => r.data),
  channelByName: (username: string) =>
    api.get(`/users/c/${username}`).then((r) => unwrap<Channel>(r.data)),
};

/* ===== Videos ===== */
export type VideoSort = "createdAt" | "views" | "likes" | "duration" | "title";

export const VideoAPI = {
  list: (
    params: PageParams & {
      query?: string;
      sortBy?: VideoSort;
      sortType?: "asc" | "desc";
      userId?: string;
    } = {},
  ) => api.get("/videos", { params }).then((r) => unwrap<Page<Video>>(r.data)),
  get: (id: string) =>
    api.get(`/videos/${id}`).then((r) => unwrap<Video>(r.data)),
  related: (id: string, limit = 8) =>
    api
      .get(`/videos/${id}/related`, { params: { limit } })
      .then((r) => unwrap<Video[]>(r.data)),
  publish: (form: FormData, onProgress?: (percent: number) => void) =>
    api
      .post("/videos/publish", form, {
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (onProgress && e.total)
            onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => unwrap<Video>(r.data)),
  update: (id: string, form: FormData) =>
    api.patch(`/videos/${id}`, form).then((r) => unwrap<Video>(r.data)),
  remove: (id: string) => api.delete(`/videos/${id}`).then((r) => r.data),
  togglePublish: (id: string) =>
    api
      .patch(`/videos/${id}/toggle-publish`)
      .then((r) => unwrap<Video>(r.data)),
  view: (id: string) =>
    api.patch(`/videos/${id}/view`).then((r) => unwrap<Video>(r.data)),
};

/* ===== Comments ===== */
export const CommentAPI = {
  list: (videoId: string, params: PageParams = {}) =>
    api
      .get(`/comments/${videoId}`, { params })
      .then((r) => unwrap<Page<Comment>>(r.data)),
  add: (videoId: string, content: string) =>
    api
      .post(`/comments/${videoId}`, { content })
      .then((r) => unwrap<Comment>(r.data)),
  update: (commentId: string, content: string) =>
    api
      .patch(`/comments/${commentId}`, { content })
      .then((r) => unwrap<Comment>(r.data)),
  remove: (commentId: string) =>
    api.delete(`/comments/${commentId}`).then((r) => r.data),
};

/* ===== Likes ===== */
export interface ToggleLikeResponse {
  isVideoLiked?: boolean;
  likes?: number;
  isCommentLiked?: boolean;
  isCommunityLiked?: boolean;
  likesCount?: number;
}

export const LikeAPI = {
  toggleVideo: (videoId: string) =>
    api
      .post(`/likes/video/${videoId}`)
      .then((r) => unwrap<ToggleLikeResponse>(r.data)),
  isVideoLiked: (videoId: string) =>
    api
      .get(`/likes/video/${videoId}`)
      .then((r) => unwrap<{ isLiked: boolean }>(r.data)),
  toggleComment: (commentId: string) =>
    api
      .post(`/likes/comment/${commentId}`)
      .then((r) => unwrap<ToggleLikeResponse>(r.data)),
  toggleCommunity: (postId: string) =>
    api
      .post(`/likes/community/${postId}`)
      .then((r) => unwrap<ToggleLikeResponse>(r.data)),
  likedVideos: (params: PageParams = {}) =>
    api
      .get("/likes/videos", { params })
      .then((r) => unwrap<Page<Video>>(r.data)),
};

/* ===== Playlists ===== */
export const PlaylistAPI = {
  create: (body: { name: string; description?: string }) =>
    api.post("/playlists", body).then((r) => unwrap<Playlist>(r.data)),
  addVideo: (playlistId: string, videoId: string) =>
    api.post(`/playlists/add/${playlistId}/${videoId}`).then((r) => r.data),
  get: (playlistId: string) =>
    api.get(`/playlists/${playlistId}`).then((r) => unwrap<Playlist>(r.data)),
  byUser: (userId: string) =>
    api
      .get(`/playlists/user/${userId}`)
      .then((r) => unwrap<Playlist[]>(r.data)),
  update: (playlistId: string, body: { name: string; description?: string }) =>
    api
      .patch(`/playlists/${playlistId}`, body)
      .then((r) => unwrap<Playlist>(r.data)),
  remove: (playlistId: string) =>
    api.delete(`/playlists/${playlistId}`).then((r) => r.data),
  removeVideo: (playlistId: string, videoId: string) =>
    api.delete(`/playlists/${playlistId}/${videoId}`).then((r) => r.data),
};

/* ===== Subscriptions ===== */
export interface Subscription {
  channel: Channel;
  createdAt?: string;
}

export const SubAPI = {
  toggle: (channelId: string) =>
    api
      .post(`/subscriptions/${channelId}`)
      .then((r) =>
        unwrap<{ isSubscribed: boolean; subscribersCount: number }>(r.data),
      ),
  subscribers: (channelId: string, params: PageParams = {}) =>
    api
      .get(`/subscriptions/channel/${channelId}`, { params })
      .then((r) =>
        unwrap<Page<{ subscriber: User; createdAt: string }>>(r.data),
      ),
  subscribedTo: (userId: string) =>
    api
      .get(`/subscriptions/user/${userId}`)
      .then((r) => unwrap<Subscription[]>(r.data)),
  feed: (params: PageParams = {}) =>
    api
      .get("/subscriptions/feed", { params })
      .then((r) => unwrap<Page<Video>>(r.data)),
};

/* ===== Community ===== */
export const CommunityAPI = {
  create: (content: string) =>
    api
      .post("/community", { content })
      .then((r) => unwrap<CommunityPost>(r.data)),
  feed: (params: PageParams = {}) =>
    api
      .get("/community", { params })
      .then((r) => unwrap<Page<CommunityPost>>(r.data)),
  byChannel: (channelId: string, params: PageParams = {}) =>
    api
      .get(`/community/${channelId}`, { params })
      .then((r) => unwrap<Page<CommunityPost>>(r.data)),
  update: (postId: string, content: string) =>
    api
      .patch(`/community/${postId}`, { content })
      .then((r) => unwrap<CommunityPost>(r.data)),
  remove: (postId: string) =>
    api.delete(`/community/${postId}`).then((r) => r.data),
};

/* ===== Creator dashboard ===== */
export const DashboardAPI = {
  stats: () =>
    api.get("/dashboard/stats").then((r) => unwrap<ChannelStats>(r.data)),
  videos: (params: PageParams = {}) =>
    api
      .get("/dashboard/videos", { params })
      .then((r) => unwrap<Page<Video>>(r.data)),
};
