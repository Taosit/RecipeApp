import React, {useState} from "react"
import {Link, useNavigate} from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {useRecipeContext} from "../contexts/RecipeContextProvider";
import {signInWithEmailAndPassword, getAuth} from "firebase/auth";
import showIcon from "../assets/show.png";
import hideIcon from "../assets/hide.png";

function SignIn() {
  const {signUp} = useRecipeContext()
  const [formData, setFormData] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...formData,
      [e.target.id]: e.target.value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(formData)
    const auth = getAuth()
    signInWithEmailAndPassword(auth, formData.email, formData.password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        console.log(user)
        navigate("/recipes")
      })
      .catch(() => {
        toast.error("Incorrect email or password", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          progress: undefined,
        })
      });
  }

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="auth-form">
      <h2>Sign In</h2>
      <div className="fields">
        <div className="auth-input-group">
          <label htmlFor="email">Email:</label>
          <input type="text" id="email" onChange={(e) => handleChange(e)}/>
        </div>
        <div className="auth-input-group">
          <label htmlFor="password">Password:</label>
          <div className="password-input-div">
            <input type={showPassword ? "text" : "password"} id="password" onChange={(e) => handleChange(e)}/>
            <img src={showPassword ? showIcon : hideIcon} alt={showPassword ? "Password visible" : "Password invisible"}
                 onClick={() => setShowPassword(prev => !prev)} className="password-icon"
            />
          </div>
        </div>
      </div>
      <hr/>
      <button className="button-orange" type="submit">Sign In</button>
      <hr/>
      <Link className="link" to="/sign-up" >
        Sign Up Instead
      </Link>
      <hr/>
      <Link className="link" to="/forgot-password" >
        Forgot Password
      </Link>
    </form>
  );
}

export default SignIn;