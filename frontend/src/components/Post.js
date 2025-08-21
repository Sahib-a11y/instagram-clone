import React, { useState } from "react";

const  Post = ({post,token}) => {
    const [likes,setlikes] = useState(post.like.length);
    const [isLiked,setIsliked] = useState(false)
    const [comments,setComments] = useState(post.Comment || []);
    const [newComment,setNewCOmment] = useState('');


    const  handleLike  =  async () => {
        try {
             const response  = await fetch('http://localhost:4000/like',{
                method: 'PUT',
                headers:{
                    'Content-Type' : 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body:JSON.stringify({postId: post._id})
             });
             if(response.ok) {
                setlikes(likes-1);
                setIsliked(false);
             }
        }catch (error) {
            console.error('Unliked failed:',error);
        }
    }

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return 
        
        try{
            const response = await fetch ('http: //localhost:4000/comment',{
                method: 'PUT',
                headers: {
                    'Content-Type' : 'application/json',
                    'Authorisation' : `Bearer ${token}`
                },
                body:JSON.stringify({postId:post._id, text:newComment})
            });

            if (response.ok) {
                const data = await response.json();
                setComments([...comments,data.result.Comment[data.result.Comment.length-1]]);
                setNewCOmment('')
            }
        }catch (error) {
            console.error('COmment failed:',error);
        }
    };

    return(
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
                <img
                src={post.postedBy.pic}
                alt={post.postedBy.name}
                className="w-10 h-10 rounded-full mr-3"
                 />
                 <div>
                    <h3 className="font-medium">{post.postedBy.name}</h3>
                    <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
                 </div>
            </div>

            <h2 className="text-xl font-bold mb-2">{post.title}</h2>
            <p className="mb-4">{post.body}</p>


            {post.photo && (
                <img
                src={post.photo}
                alt={post.title}
                className="w-full h-auto mb-4 rounded"
                />
            )}

            <div className="flex items-center mb-4">
                <button
                onClick={isLiked ? handleLike : handleLike}
                className="flex items-center text-gray-500 hover:text-red-500 mr-4">
                    <span className="mr-1">{likes}</span>
                    {isLiked ? 'Unlike' : 'Like'}
                </button>
            </div>

            <div className="mb-4">
                <h4 className="font-medium mb-2">Comments ({comments.length})</h4>
                <div className="space-y-3">
                    {comments.map(( comment, index) => {
                        <div key={index} className="flex items-start">
                            <img
                            src={comment.postedBy.pic}
                            alt={comment.postedBy.name}
                            className="w-8 h-8 rounded-full mr-2"
                            />

                            <div>
                                <p className="font-medium text-sm">{comment.text}</p>
                                <p className="text-sm">{comment.text}</p>
                           </div>
                        </div>
                    })}
                </div>
            </div>


            <form onSubmit={handleComment} className="flex">
                <input
                type="text"
                value={newComment}
                onChange= {(e) => setNewCOmment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500"/>

                <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700"
                >Post
            </button>
          </form>
        </div>
    );
};

export default Post;