import React, { useState } from "react";

const CreatePost = ({ token, onCreatePost }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pic, setPic] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !body.trim()) {
      setError("Title and content are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/createPost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), pic }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Post created successfully!");
        onCreatePost(data.result);
        setTitle("");
        setBody("");
        setPic("");

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to create post.");
        setTimeout(() => setError(""), 3000);
      }
    } catch {
      setError("Network error. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Create New Post</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter post title"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows="4"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Write your post content..."
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Image URL (optional)
          </label>
          <input
            type="text"
            value={pic}
            onChange={(e) => setPic(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm 
                     text-sm font-medium text-white 
                     ${loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"} 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {loading ? "Creating..." : "Create Post"}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
