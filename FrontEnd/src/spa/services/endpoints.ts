import { api, unwrap } from "./api";

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  coverImage?: string;
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
  createdAt?: string;
  owner?: User | string;
}

export interface Comment {
  _id: string;
  content: string;
  owner?: User | string;
  createdAt?: string;
  video?: string;
}

export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  videos?: Video[];
  owner?: User | string;
}

export interface CommunityPost {
  _id: string;
  content: string;
  owner?: User | string;
  createdAt?: string;
}

/* ===== Auth ===== */
export const AuthAPI = {
  register: (form: FormData) =>
    api.post("/users/register", form).then((r) => unwrap<User>(r.data)),
  login: (body: { email?: string; username?: string; password: string }) =>
    api.post("/users/login", body).then((r) => r.data),
  logout: () => api.post("/users/logout").then((r) => r.data),
  refresh: () => api.post("/users/refresh-token").then((r) => r.data),
  me: () => api.get("/users/current-user").then((r) => unwrap<User>(r.data)),
  changePassword: (body: { oldPassword: string; newPassword: string }) =>
    api.post("/users/change-password", body).then((r) => r.data),
  updateAccount: (body: Partial<Pick<User, "fullName" | "email">>) =>
    api.patch("/users/update-account", body).then((r) => unwrap<User>(r.data)),
  updateAvatar: (file: File) => {
    const f = new FormData();
    f.append("avatar", file);
    return api
      .patch("/users/avatar", f)
      .then((r) => unwrap<User>(r.data));
  },
  updateCover: (file: File) => {
    const f = new FormData();
    f.append("coverImage", file);
    return api
      .patch("/users/cover-image", f)
      .then((r) => unwrap<User>(r.data));
  },
  watchHistory: () =>
    api.get("/users/watch-history").then((r) => unwrap<Video[]>(r.data)),
  channelByName: (username: string) =>
    api
      .get(`/users/c/${username}`)
      .then((r) => unwrap<User & { subscribersCount?: number; channelsSubscribedToCount?: number; isSubscribed?: boolean }>(r.data))
      .catch(async () => {
        // fallback if backend exposes different path
        const r = await api.get(`/users/channel/${username}`);
        return unwrap<User>(r.data);
      }),
};

/* ===== Videos ===== */
export const VideoAPI = {
  list: (params: { page?: number; limit?: number; query?: string; sortBy?: string; sortType?: string; userId?: string } = {}) =>
    api.get("/videos", { params }).then((r) => unwrap<{ docs: Video[]; totalDocs?: number; totalPages?: number; page?: number } | Video[]>(r.data)),
  get: (id: string) => api.get(`/videos/${id}`).then((r) => unwrap<Video>(r.data)),
  publish: (form: FormData) =>
    api.post("/videos/publish", form).then((r) => unwrap<Video>(r.data)),
  update: (id: string, form: FormData | Record<string, unknown>) =>
    api.patch(`/videos/${id}`, form).then((r) => unwrap<Video>(r.data)),
  remove: (id: string) => api.delete(`/videos/${id}`).then((r) => r.data),
  togglePublish: (id: string) =>
    api.patch(`/videos/toggle/publish/${id}`).then((r) => r.data),
  view: (id: string) => api.patch(`/videos/${id}/view`).then((r) => unwrap<Video>(r.data)),
};

/* ===== Comments ===== */
export const CommentAPI = {
  list: (videoId: string) =>
    api.get(`/comments/${videoId}`).then((r) => unwrap<{ docs: Comment[] } | Comment[]>(r.data)),
  add: (channelId: string, videoId: string, content: string) =>
    api
      .post(`/comments/add/${channelId}/${videoId}`, { content })
      .then((r) => unwrap<Comment>(r.data)),
  update: (commentId: string, content: string) =>
    api.patch(`/comments/${commentId}`, { content }).then((r) => unwrap<Comment>(r.data)),
  remove: (commentId: string) =>
    api.delete(`/comments/${commentId}`).then((r) => r.data),
};

/* ===== Likes ===== */
export interface ToggleLikeResponse {
  isVideoLiked?: boolean;
  likes?: number;
  isCommentLiked?: boolean;
  isCommunityLiked?: boolean;
}

export const LikeAPI = {
  toggleVideo: (videoId: string) =>
    api.post(`/likes/video/${videoId}`).then((r) => unwrap<ToggleLikeResponse>(r.data)),
  isVideoLiked: (videoId: string) =>
    api.get(`/likes/video/${videoId}`).then((r) => unwrap<{ isLiked: boolean }>(r.data)),
  toggleComment: (commentId: string) =>
    api.post(`/likes/comment/${commentId}`).then((r) => unwrap<ToggleLikeResponse>(r.data)),
  toggleCommunity: (postId: string) =>
    api.post(`/likes/community/${postId}`).then((r) => unwrap<ToggleLikeResponse>(r.data)),
  likedVideos: () =>
    api.get("/likes/videos").then((r) => unwrap<Video[]>(r.data)),
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
    api.get(`/playlists/user/${userId}`).then((r) => unwrap<Playlist[]>(r.data)),
  update: (playlistId: string, body: { name?: string; description?: string }) =>
    api.patch(`/playlists/${playlistId}`, body).then((r) => unwrap<Playlist>(r.data)),
  remove: (playlistId: string) =>
    api.delete(`/playlists/${playlistId}`).then((r) => r.data),
  removeVideo: (playlistId: string, videoId: string) =>
    api.delete(`/playlists/remove/${playlistId}/${videoId}`).then((r) => r.data),
};

/* ===== Subscriptions ===== */
export interface Subscription {
  channel: User;
  createdAt?: string;
}

export const SubAPI = {
  toggle: (channelId: string) =>
    api.post(`/subscriptions/${channelId}`).then((r) => r.data),

  subscribers: (channelId: string) =>
    api.get(`/subscriptions/channel/${channelId}`).then((r) => unwrap<User[]>(r.data)),

  subscribedTo: (userId: string) =>
    api.get(`/subscriptions/user/${userId}`).then((r) => unwrap<Subscription[]>(r.data)),
};

/* ===== Community ===== */
export const CommunityAPI = {
  create: (content: string) =>
    api.post("/community", { content }).then((r) => unwrap<CommunityPost>(r.data)),
  feed: () =>
    api.get("/community").then((r) => unwrap<CommunityPost[]>(r.data)),
  byChannel: (channelId: string) =>
    api.get(`/community/${channelId}`).then((r) => unwrap<CommunityPost[]>(r.data)),
  update: (postId: string, content: string) =>
    api.patch(`/community/${postId}`, { content }).then((r) => unwrap<CommunityPost>(r.data)),
  remove: (postId: string) =>
    api.delete(`/community/${postId}`).then((r) => r.data),
};