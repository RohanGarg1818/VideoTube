import mongoose, { Schema } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        throw new ApiError(400, "Name is required")
    }

    const playlist = await Playlist.create(
        {
            name,
            description
        }
    )

    if (!playlist) {
        throw new ApiError(500, "something went wrong while creating playlist")
    }

    playlist.owner = req.user?._id;
    await playlist.save();

    return res.status(200).json(new ApiResponse(200, playlist, "playlist created"))
})

const addVideos = asyncHandler(async (req, res) => {
    const { videoId, playlistId } = req.params;

    if (!videoId || !playlistId ) {
        throw new ApiError(400, "video id r playlist id is missing");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404," playlist not found")
    }

    if(!playlist.videos.some(id => id.toString() === videoId)){
        playlist.videos.push(videoId);
        await playlist.save();
    }

    return res.status(200).json(new ApiResponse(200,playlist,"video added successfully"));
})

const getPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;

    if (!playlistId) {
        throw new ApiError(400,"playlist id is missing")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
            _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
            from: "videos",
            localField: "videos",
            foreignField: "_id",
            as: "videos"
            }
        },
        {
            $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
            }
        },
        {
            $addFields: {
            owner: {
                $first: "$owner"
            }
            }
        }
    ]);

    if (!playlist?.length) {
        throw new ApiError(404,"playlist not found")
    }

    return res.status(200).json(new ApiResponse(200,playlist[0],"playlist fetched"))
})

const getUserPlaylist = asyncHandler(async(req,res)=>{
    const {userId} = req.params;

    if(!userId){
        throw new ApiError(400,"user id is missing")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
            _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
            from: "videos",
            localField: "videos",
            foreignField: "_id",
            as: "videos"
            }
        },
        {
            $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
            }
        },
        {
            $addFields: {
            owner: {
                $first: "$owner"
            }
            }
        }
    ]);

    if (!playlist?.length) {
        return res.status(200).json(new ApiResponse(200,[], "no playlists found"));
    }

    return res.status(200).json(new ApiResponse(200,playlist, "playlists fetched"));
})

const deletePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;

    if (!playlistId) {
        throw new ApiError(400,"playlist id is missing")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if(!playlist){
        throw new ApiError(400,"playlist not found")
    }

    return res.status(200).json(new ApiResponse(200,playlist,"playlist delete successfully"))
})

const updatePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} =req.params;
    if(!playlistId){
        throw new ApiError(400,"playlist id is missing")
    }

    const {name,description}= req.body;
    if (!name) {
        throw new ApiError(400,"name is required")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name,
                description: description || ""
            }
        },
        {
            new:true
        }
    )

    if (!playlist) {
        throw new ApiError(404,"playlist not found")
    }

    return res.status(200).json(new ApiResponse(200,playlist,"playlist updated"))

})

const removePlaylistVideo = asyncHandler(async(req,res)=>{
    const {playlistId, videoId} = req.params;

    if(!videoId || !playlistId ){
        throw new ApiError(400,"playlist id or video id is missing")
    }

    const playlist = await Playlist.findById(playlistId);

    playlist.videos = playlist.videos.filter(
        item => item.toString() !== videoId
    );
    await playlist.save();

    return res.status(200).json(new ApiResponse(200,playlist," video removed successfully"));
})

export { createPlaylist, addVideos, getPlaylist,getUserPlaylist,deletePlaylist, updatePlaylist, removePlaylistVideo }