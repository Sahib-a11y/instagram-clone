import mongoose from "mongoose";

const postschema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    body:{
        type:String,
        required:true,
    },
    photo:{
        type:String,
        required:true,
    },
    like:[{type:mongoose.Schema.Types.ObjectId}],
    Comment:[{
        text:{
            type: String,
            required:true
        },
        postedBy:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        createdAt:{
            type:Date,
            default: Date.now
        },
        like:[{type:mongoose.Schema.Types.ObjectId}],
        replies:[{
            text:{
                type: String,
                required:true
            },
            postedBy:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
                required:true
            },
            createdAt:{
                type:Date,
                default: Date.now
            },
            like:[{type:mongoose.Schema.Types.ObjectId}]
        }]
    }],
    postedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
},{
    timestamps:true
})

const Post = mongoose.model("post",postschema)

export default Post