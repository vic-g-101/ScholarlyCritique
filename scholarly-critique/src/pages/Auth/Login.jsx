import React, { useContext, useState} from 'react'
import AuthLayout from '../../components/layouts/AuthLayout'
import {Link, useNavigate} from 'react-router-dom';
import Input from '../../components/Inputs/Input';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(UserContext);
  const navigate = useNavigate();


  const handleLogin = async(e) => {
    e.preventDefault();

    //make email lowercase before sending in
    const emailClean = email.trim().toLowerCase();
    if(!validateEmail(emailClean)){
      setError("Please enter a valid email address.");
      return;
    }
    if(!password){
      setError("Please enter a valid password.");
      return;
    }
    setError(null);
    setLoading(true);

    //Login API call
    try {
      const { data } = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email: emailClean,
        password,
      });

      const { token, user } = data || {};
      if (!token) {
        setError("Login failed. No token returned.");
        return;
      }
      // single source of truth: context handles localStorage too
      login(user, token);
      navigate("/dashboard");
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
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-var(--text-color)">Welcome Back!</h3>
        <p className="text-xs text-var(--text-color) mt-[5px] mb-6">
          Please enter your information
        </p>

        <form onSubmit={handleLogin}>
          <Input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label="Email Address"
            placeholder="johndoe@example.com"
            type="email"
            autoComplete="email"
          />
          <Input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label="Password"
            placeholder="8 characters minimum"
            type="password"
            autoComplete="current-password"
          />

          {error && (
            <p className="text-red-500 text-xs pb-2.5" role="alert" aria-live="polite">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "LOGIN"}
          </button>

          <p className="text-[13px] text-var(--primary-color) mt-3">
            Don&apos;t have an account?{" "}
            <Link className="font-medium text-var(--primary-color) underline" to="/signUp">
              SignUp
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;