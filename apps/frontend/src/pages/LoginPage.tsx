import React, { useState } from "react";
import "@/styles/LoginPage.css";
import avatar from "@/assets/logo.png";
import bg from "@/assets/img5.png";
import img1 from "@/assets/img1.png";
import img6 from "@/assets/img6.jpg";
import { FaUser } from "react-icons/fa";
import { FaLock } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/services/auth";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      console.log("Login successful:", data);
      navigate("/home", { replace: true });
    },
  });

  const [credential, setCredential] = useState({ email: "", password: "" });
  const [focusState, setFocusState] = useState({ email: false, password: false });

  const handleFocus = (field: "email" | "password") => {
    setFocusState({ ...focusState, [field]: true });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement, Element>, field: "email" | "password") => {
    if (e.target.value === "") {
      setFocusState({ ...focusState, [field]: false });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredential({ ...credential, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (credential.email.trim() == "" || credential.password.trim() == "") {
      alert("Please fill in all fields.");
      return;
    }

    loginMutation.mutate(credential);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_APP_BACKEND_URL}/auth/google`;
  };

  return (
    <div className="app-container">
      <div className="container">
        <div className="img">
          <div className="img-div1">
            <img src={bg} alt="Background" />
          </div>
          <div className="img-div2">
            <img src={img1} alt="Background" />
          </div>
          <div className="img-div3">
            <img src={img6} alt="Background" />
          </div>
        </div>
        <div className="login-content">
          <form action="/" onSubmit={handleSubmit}>
            <div className=" flex items-center justify-center">
              {" "}
              <img src={avatar} alt="Avatar" />
            </div>
            <div className="">
              <div className={`input-div one ${focusState.email ? "focus" : ""}`}>
                <div className="i">
                  <FaUser />
                </div>
                <div className="div">
                  <h5>Email</h5>
                  <input
                    type="text"
                    name="email"
                    value={credential.email}
                    className="input"
                    onFocus={() => handleFocus("email")}
                    onBlur={(event) => handleBlur(event, "email")}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={`input-div pass ${focusState.password ? "focus" : ""}`}>
                <div className="i">
                  <FaLock />
                </div>
                <div className="div">
                  <h5>Password</h5>
                  <input
                    type="password"
                    name="password"
                    value={credential.password}
                    className="input"
                    onFocus={() => handleFocus("password")}
                    onBlur={(event) => handleBlur(event, "password")}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <Link to="forget-password">Forgot Password?</Link>
              <button type="submit" className="btn ">
                Login
              </button>
            </div>

            <div className="w-full mt-5 mb-3 flex flex-row items-center justify-center">
              <span className="w-full border border-gray-500"></span>
              <p className="text-lg text-white mx-4">Or</p>
              <span className="w-full border border-gray-500"></span>
            </div>
            <div
              onClick={handleGoogleLogin}
              className="flex gap-2 justify-center items-center p-1 border border-transparent hover:border-slate-400 rounded-md py-2 text-white font-medium text-xl cursor-pointer"
            >
              <div className="flex items-center justify-center">
                <img
                  src="/google.png"
                  className="object-contain"
                  style={{ height: "42px", margin: "0" }}
                  alt="google"
                />
              </div>
              <p>Continue with Google</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
