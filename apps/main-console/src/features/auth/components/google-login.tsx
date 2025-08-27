import React from "react";
import { GoogleOAuthProvider, GoogleLogin as GoogleLoginButton, CredentialResponse } from "@react-oauth/google";
import { jwtDecode, JwtPayload } from "jwt-decode";
import axios, { AxiosError } from "axios";
import Cookies from 'js-cookie';

type UserData = {
  name: string;
  email: string;
  pitcher: string;
};



const GoogleLogin: React.FC = () => {
    const googleClientId: string = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

  console.log("cliend id ***",googleClientId)
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error("Credential is undefined");
      }
      const decodeToken = jwtDecode<JwtPayload & { name: string; email: string; pitcher: string }>
      (credentialResponse.credential);
      console.log("google user info", decodeToken);

      const userData: UserData = {
        name: decodeToken.name,
        email: decodeToken.email,
        pitcher: decodeToken.pitcher,
      };

      const res = await axios.post("/auth/google/", userData);
      if (res.data && res.data.token) {
        const { token } = res.data;

       
        Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'Strict' }); 

        // Redirect to dashboard or another page
        // window.location.href = "/dashboard";
      }
    } catch (error) {
        const axiosError =error as AxiosError
        console.error("error***",axiosError);
        console.log("error2***",axiosError.response);
        alert('An error occurred during login. Please try again.');

    }
  };
  const handleError = () => {
    console.error('Google Login Failed');
    alert('Unable to login with Google. Please try again.');
  };
const config = {
  text: "signin_with",
  shape: "circle",
  theme: "filled_black",
} as const;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="flex item-center justify-center">
        <GoogleLoginButton
          onSuccess={handleSuccess}
          onError={handleError}
          text={config.text}
          shape={config.shape}
          theme={config.theme}
        ></GoogleLoginButton>
      </div>
    </GoogleOAuthProvider>
  );
};
export default GoogleLogin;
