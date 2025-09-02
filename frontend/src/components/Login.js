import React,{ useState } from "react";
import { Mail,Eye,EyeOff, Lock } from "lucide-react";

const Login = ({onToggleform, onLoginSuccess}) => {
    const [formdata,setFormData] = useState({email:'', password:''});
    const [isLoading,setIsLoading] = useState(false)
    const [message,setMessage] = useState('')
    const [showPassword , setshowpassword] = useState(false)


    const handleChange = (e) => {
    setFormData({...formdata,[e.target.name]: e.target.value})
  } 

    const handleLogin = async () => {
    if(!formdata.email || !formdata.password) {
        setMessage({ type: 'error' , text:'Please fill all fields'})
        return
    }

    setIsLoading(true)
    setMessage('');

    try {
        const response = await fetch('http://localhost:5000/login',{
            method:'POST',
            headers:{'Content-Type': 'application/json'},
            body: JSON.stringify(formdata),
        });

        const data = await response.json();


        if(response.ok){
            setMessage({ type : 'success', text: data.msg});
            localStorage.setItem('token',data.token);
            setTimeout(() => onLoginSuccess(),1000);
        }else{
            setMessage({
                type:'error', text: data.error
            })
        }
    } catch (error) {
        setMessage({type:'error', text:   'networking error'})
    }

    setIsLoading(false)
  }


  return(
    <div className="space-y-6">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Please Sign In</h2>
            <p>Sign in to your account</p>
        </div>


        <div className = "relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
            <input
            type="email"
            name="email"
            placeholder = "Email address"
            value={formdata.email}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
        </div>


        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          value={formdata.password}
          onChange={handleChange}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
        <button
          type="button"
          onClick={() => setshowpassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
        {message && (
            <div className={`p-3 rounded-lg text-sm ${
                message.type === `success`
                ? 'bg-green-100 text-green-700 border border-green-200':
                'bg-red-100 text-red-700 border border-red-200'
            }`}>
                {message.text}
                </div>
        )}

        <button 
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg
        hover:bg-blue-700"
        >
            {isLoading ? 'Signing in... ' : 'Sign In'}
        </button>
        <p className="text-center text-gray-600">Don't hove on account{``}
            <button
            onClick={onToggleform}
            className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up
            </button>
        </p>
    </div>
  );
}


export default Login