import React from "react";
import Post from './Post'

const Feed = ({posts,token}) => {
    return(
        <div className="space-y-6">
            {posts.length > 0 ? (
                posts.map(post => (
                    <Post key = {post._id} post = {post} token={token} />
                ))
            ):(
                <p className="text-center text-gray-500">You not posted posts </p>
            )}
        </div>
    )
}
export default Feed