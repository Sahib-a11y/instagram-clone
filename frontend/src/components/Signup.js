import React,{useState} from "react";
import { User,Mail,Lock,EyeOff,Eye, Camera } from "lucide-react";

const Signup= ({ontoggleform})=> {
  const [formdata, setFormData] = useState({ name:'',
    email:'',
    password:'',
    pic:''
    })
  const [isLoading ,setIsloading] = useState(false);
  const [message,setmessage] = useState('')
  const[showPassword,setshowpassword]=useState(false)

  const handleChange = (e) => {
    setFormData({...FormData, [e.target.name]: e.target.value});
  };

  const handleSignup =  async () => {
    if (!formdata.name || !FormData.email || !FormData.password) {
      setmessage({type:'error', text: ' Please fill all fields'});
      return;
    }

    setIsloading(true);
    setmessage('');

    try{
      const response  = await fetch('http://localhost:4000/signup', {
        method: 'POST',
        headers:{'Content-Type': 'application/json'},
        body: JSON.stringify(formdata),
      });

      const data = await response.json();

      if (response.ok) {
        setmessage({ type:'success', text:data.msg + 'please login now'})
        setFormData({name:'',email:'', password:'', pic:''});
      } else {
        setmessage({type:'error', text:data.error});
      }
    }catch(error){
      setmessage({type:'error', text: 'Network Error'});
    }

    setIsloading(false);
  };

  return(
    <div className="justify-items-center" >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-600">Instagram Signup Page</p>
      </div>

      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
        <input
        type="text"
        name="name"
        placeholder="Full name"
        value={formdata.name}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-3 booder border-gray-300 rounded-lg focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
      </div>

      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
        <input
        type="email"
        name="email"
        placeholder="Enter your Email"
        value={formdata.email}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
      </div>

      <div className="relative">
        <Lock className= "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
        <input
        type={showPassword ? "text" : "password"}
        name="name"
        placeholder="Enter Your Password"
        value={formdata.password}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
        <button
        type="button"
        onClick={() => setshowpassword(!showPassword)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600">
          {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className = "w-5 h-5"/>}
        </button>
      </div>

      <div className="relative">
        <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
        <input
        type= "url"
        name = "pic"
        placeholder = "Profile picture "
        value={formdata.pic}
        obChange={handleChange}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
      </div>

      {message &&(
        <div className = {`p- rounded-lg text-sm ${message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'}`}>
              {message.text}
              </div>
      )}

      <button 
      onClick={handleSignup}
      disabled={isLoading}
      className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium">
        {isLoading ? 'Processing....': 'Create Account'}
      </button>

      <p className = "text-center text-gray-600">
        Already have a Account?{''}
        <button
        onClick={ontoggleform}
        className ="text-blue-600 hover:text-blue-700 font-medium">Sign In</button>
      </p>
    </div>
  )
}

export default Signup