import React,{useState} from 'react'
import Login from './components/Login';
import Signup from './components/Signup';

function App() {
  const [ isLogin, setLogin] = useState(true);
  const [ isLoggedin, setInLoggedin] = useState(false);

  const handleLoginAccces = () => {
    setInLoggedin(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')

setInLoggedin(false)
  }


  if(isLoggedin) {
    return(
      <div className = "min-h-screen bg-gray-50 flex items-center justify-center">
        <div className= "bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className = "text-2xl font-bold text-green-600 mb-4">Login Successful</h2>
          <button 
          onClick = {handleLogout}
          className= "bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition">Logout</button>
        </div>
      </div>
    )
  }

  return(
    <div className = "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className = "max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {isLogin ? (
          <Login
          onToggleform={()=> setLogin(false)}
          onLoginSuccess={handleLoginAccces}/>
        ) : (
          <Signup ontoggleform={() => setLogin(true)}/>
        )}
      </div>
    </div>
  )
}

export default App;