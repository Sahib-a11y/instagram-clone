import { useEffect, useState } from "react"


const  Dashboard = () => {
    const [currentTab , setcureentTab] = useState('home')
    const [posts, setPosts] = useState([])
    const [Loading,setLoading] = useState()

    const loadPosts = async (type = 'all') => {
        setLoading(true);
        try{
            let data;
            switch(type){
                case 'my':
                    data = await api.getMyPosts();
                    setPosts(data.post || []);
                    break;
                case 'following':
                    data = await api.getSubPosts();
                    setPosts(data || [])
                    break;
                default:
                    data = await api.getAllPosts();
                    setPosts(data.posts || []);
            }
        }catch (error) {
            console.error('Error Loading posts:', error);
            setPosts([]);
        }
        setLoading(false)
    };

    useEffect(() => {
        if(currentTab === 'home'){
            loadPosts('all');
        }else if (currentTab === 'my-posts'){
            loadPosts('my');
        }else if (currentTab === 'following') {
            loadPosts('following')
        }
    },[currentTab]);
}

export default Dashboard