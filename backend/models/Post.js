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
        text:String,
        postedBy:{type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    }],
    postedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
})

const Post = mongoose.model("post",postschema)

export default Post