import mongoose from "mongoose";

export interface Channel {
    id: string;
    name: string;   
    guild_id: string;
}

export const ChannelSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    guild_id: {
        type: String,
        required: true,
    },
});

export const Channel = mongoose.model<Channel>("Channel", ChannelSchema);

