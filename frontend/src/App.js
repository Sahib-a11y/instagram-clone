import React,{useState,useEffect} from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";


function App() {
  const [isLogin,setIsLogin] = useState(true)
  const [isLoggedIn,setIsLoggedIn] = useState(false)
  const [token,settoken] = useState(localStorage.getItem('token') || '')
  const [userData,setUserData] = useState(null)

  useEffect(() => {
    if (token) {
      verifyToken()
    }
  },[token]);

  const verifyToken = async () => {
    try{
      const response =  await fetch('http://localhost:4000/protected',{
        method: 'GET',
        headers:{
          'Authorization' : `Bearer ${token}`
        }
      });

      if(response.ok){
        const data = await response.json();
        setIsLoggedIn(true);
        setUserData(data.user);
      }else{
        localStorage.removeItem('token');
        settoken('');
      }
    }catch(error){
      console.error('Token verfication failed:', error);
    }
  };

  const handleLoginSuccess = (token) => {
    localStorage.setItem('token' ,token);
    settoken(token);
    setIsLoggedIn(true)
  };

  const  handleLogout = () => {
    localStorage.removeItem('token')
    settoken('')
    setIsLoggedIn(false)
    setUserData(null)
  };
  if(isLoggedIn){
    return(
      <div className="min-h-screen bg-gray-100">
        <Navbar onLogout= {handleLogout}/>
        <Dashboard userData = {userData} token={token}/>
      </div>
    )
  }

  return(
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {isLogin ? (
          <Login
          onToggleform={() => setIsLogin(false)}
          onLoginSuccess={handleLoginSuccess}/>
        ):(
          <Signup onToggleForm={() => setIsLogin(true)}/>
        )}
      </div>
    </div>
  );
}

export default App