import React, { useState } from "react";
import "@/styles/LoginPage.css";
import avatar from "@/assets/logo.png";
import bg from "@/assets/img5.png";
import img1 from "@/assets/img1.png";
import img6 from "@/assets/img6.jpg";
import { FaUser } from "react-icons/fa";
import { FaLock } from "react-icons/fa";
import { Button } from "@/components/ui/button";

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<{ username: string; password: string }>({
    username: "",
    password: "",
  });

  const [focusState, setFocusState] = useState<{ username: boolean; password: boolean }>({
    username: false,
    password: false,
  });

  const handleFocus = (field: "username" | "password") => {
    setFocusState({ ...focusState, [field]: true });
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement , Element>,
    field: "username" | "password"
  ) => {
    if (e.target.value === "") {
      setFocusState({ ...focusState, [field]: false });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;


    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted", formData);

    if (formData.username && formData.password) {
      alert(`Welcome, ${formData.username}!`);
    } else {
      alert("Please fill in all fields.");
    }
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
           <div className=" flex items-center justify-center"> <img src={avatar} alt="Avatar" />
           </div>
            <div className="">
            <div className={`input-div one ${focusState.username ? "focus" : ""}`}>
              <div className="i">
                <FaUser />
              </div>
              <div className="div">
                <h5>Username</h5>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  className="input"
                  onFocus={() => handleFocus("username")}
                  onBlur={(event) => handleBlur(event, "username")}
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

            <a href="#">Forgot Password?</a>
            <button type="submit" className="btn">Login</button>
            </div>
            <Button variant="outline"> google auth</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
