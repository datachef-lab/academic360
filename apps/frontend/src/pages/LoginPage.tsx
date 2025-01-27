import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { FaLock } from "react-icons/fa";
import avatar from "@/assets/logo.png";
import bg from "@/assets/img5.png";
import img1 from "@/assets/img1.png";
import img6 from "@/assets/img6.jpg";
import "@/styles/LoginPage.css";
import { Button } from "@/components/ui/button";
import { postRequest } from "@/utils/api";

type LoginResponse = {
  payload: {
    accessToken:string,
    user:{
      name:string,
      email:string,
    },
  };
}


const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<{ email: string; password: string }>({
    email: "",
    password: "",
  });
  const [loading,setLoading] = useState<boolean>(false);


  const [focusState, setFocusState] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

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

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const response = await postRequest<LoginResponse>("/auth/login", formData);
    console.log("Response3", response.payload.accessToken);
    localStorage.setItem("accessToken", response.payload.accessToken);
    setLoading(false);

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
                  <h5>email</h5>
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
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
                    value={formData.password}
                    className="input"
                    onFocus={() => handleFocus("password")}
                    onBlur={(event) => handleBlur(event, "password")}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Link to="/forgot-password">Forgot Password?</Link>
                <Button type="submit">{loading ? "Logging in..." : "Login"}</Button>
                <Button type="button" className="" variant="secondary">
                  <Link to={`${import.meta.env.VITE_APP_BACKEND_URL}/auth/google`} className="text-black">
                    Continue with Google...
                  </Link>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
