import React, {useContext, useState} from 'react'
import AuthLayout from '../../components/layouts/AuthLayout'
import {Link, useNavigate} from 'react-router-dom';
import Input from '../../components/Inputs/Input';
import { validateEmail, validateUsername } from '../../utils/helper';
import ProfilePhotoSelector from '../../components/Inputs/ProfilePhotoSelector';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import uploadImage from '../../utils/uploadImage';
import { UserContext } from "../../context/userContext";

const REQUIRE_USERNAME = true;
const SignUp = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { updateUser, login } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    const emailClean = email.trim().toLowerCase();
    const userNameClean = (userName || "").trim();

    if (!firstName) return setError("Please enter your first name");
    if (!lastName) return setError("Please enter your last name");

    if (REQUIRE_USERNAME) {
      if (!userName) return setError("Please enter a username");
      if (!validateUsername(userName)) {
        return setError(
          "Username must be at least 6 characters and contain only letters, numbers, or underscores."
        );
      }
    }

    if (!validateEmail(emailClean)) {
      return setError("Please enter a valid email address");
    }
    if (!password || password.length < 8) {
      return setError("Password must be at least 8 characters");
    }

    setError(null);
    setLoading(true);

    try {
      // 1) Upload image if provided
      let profileImageUrl = "";
      if (profilePic) {
        const imgUploadRes = await uploadImage(profilePic); // returns { imageUrl }
        profileImageUrl = imgUploadRes?.imageUrl || "";
      }

      // 2) Register
      const { data } = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        firstName,
        lastName,
        userName: userNameClean,
        userNameLower: userNameClean.toLowerCase(),
        email: emailClean,
        password,
        profileImageUrl,
        
      });

      const { token, user } = data || {};
      if (!token) {
        setError("Sign up failed. No token returned.");
        setLoading(false);
        return;
      }

       // 3) Persist auth + context (sets token state -> isAuthenticated true)
      login(user || null, token);

      // 4) Go to step 2
      navigate("/signup2", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>  
        <div className="lg:w-[100%] h-auto md:h-full mt-10 md:mt-0 flex flex-col justify-center">
          <h3 className="text-xl font-semibold text-var(--primary-color)">
            Create an Account
            </h3>
            <p className="text-xs text-var(--primary-color) mt-[5px] mb-6">
              Join us today by entering your details below!

            </p>
            <form onSubmit={handleSignUp}>
              <ProfilePhotoSelector image = {profilePic} setImage={setProfilePic}/>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input value ={userName} onChange = {({target}) => setUserName(target.value)} label = "Username" placeholder="Username" type = "text"/>
                <Input value ={firstName} onChange = {({target}) => setFirstName(target.value)} label = "First Name" placeholder="John" type = "text"/>
                <Input value ={lastName} onChange = {({target}) => setLastName(target.value)} label = "Last Name" placeholder="Doe" type = "text"/>
                <Input value ={email} onChange = {({target}) => setEmail(target.value)} label = "Email Address" placeholder ="johndoe@example.com" type = "text"/>
                <div className = "col-span-2">
                <Input value ={password} onChange = {({target}) => setPassword(target.value)} label = "Password" placeholder ="8 characters minimum" type = "password"/>
                </div>
              </div>

            {error && <p className="text-red-500 text-xs pb-2.5"> {error}</p>}

                    <button type ="submit" className="btn-primary">
                      SIGN UP
                    </button>
                    <p className="text-[13px] text-var(--primary-color) mt-3">
                      Already have an account?{" "}
                      <Link className ="font-medium text-var(--primary-color) underline" to ="/login">Login</Link>
                    </p>

            </form>
        </div>
    </AuthLayout>
  )
}

export default SignUp