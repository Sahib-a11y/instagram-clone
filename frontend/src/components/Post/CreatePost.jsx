import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";


const  CreatePost = ({ onPostCreated }) => {
    const  {token} = useAuth();
    const  [isExpanded, setIsExpanded]  = useState(false);
    const [formData,setFormData] =  useState({
        title: '',
        body: '',
        pic:''
    });
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleImageUpload = async (e) => {
        const  file  = e.target.files[0];
        if(!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image',file);

        try {
            const  response  =  await fetch (`${ProcessingInstruction.env.REACT_APP_API_URL}/upload`, {
                method:'POST',
                headers: {
                    'Authorization':`Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data  = await response.json();
                setFormData(prev => ({...prev, pic: data.url}));
            } else {
                alert ('Image upload failed');
            }
        }catch (error) {
            alert ('Image upload failed');
        }
        setUploading(false)
    };

    const handleSubmit = async () => {
        if(!formData.title || !formData.body || !formData.pic) {
            alert('Please fill all fields and upload an image');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch (`${process.env.REACT_APP_URL}/createPost`, {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json',
                    'Authrization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if(response.ok) {
                setFormData({ title:'', body:'', pic:''});
                setIsExpanded(false)
                onPostCreated();
            }else {
                alert('Failed to create post')
            }
        }catch(error) {
            alert ('Failed to create post');
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start space-x-4">
                <div className="flex-1">
                    {!isExpanded ? (
                        <button
                        onClick={() => setIsExpanded(true)}
                        className="flex-1"
                        >
                            <span className="text-gray-500">What's on your mind?</span>
                        </button>
                    ): (
                        <div className="space-x-4">
                            <input type="text"
                            placeholder="Post title..."
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />

                            <textarea
                            placeholder="What's on your mind"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title:e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>

                            <div className="space-y-2">
                                <input type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                {uploading && <p className="text-sem text-blue-600">Uploading image...</p>}
                                {formData.pic && (
                                    <img src={formData.pic} alt="Preview" className="w-32 h-32 object cover rounded-md" />
                                )}
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                onClick={() => {
                                    setIsExpanded(false);
                                    setFormData({ title:'', body:'', pic: ''});
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >Cancel</button>

                                <button
                                onClick={handleSubmit}
                                disabled={loading || uploading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? <LoadingSpinner size='sm'/> : 'Post'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

