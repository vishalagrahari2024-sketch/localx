import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { Link } from "react-router-dom"; 
import { auth } from "./firebase";
import SignInWithGoogle from "./signWithGoogle";
import { GraduationCap } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/profile";
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex flex-1 bg-sky-500 items-center justify-center flex-col gap-6">
        <GraduationCap size={160} className="text-white opacity-90" />
        <h1 className="text-white text-5xl font-bold tracking-tight">LocalX</h1>
        <p className="text-sky-100 text-lg">Your campus community.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-sm w-full">
          <h1 className="text-3xl font-bold mb-6">Sign in to LocalX</h1>
          <h3 className="text-3xl font-bold mb-6">Connect With Your Friends</h3>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-sky-500 text-white py-2 rounded-lg font-semibold hover:bg-sky-600 transition"
            >
              Log in
            </button>
          </form>

          <div className="flex items-center my-4">
            <hr className="flex-grow border-gray-300" />
            <span className="px-2 text-sm text-gray-500">OR</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          <SignInWithGoogle />

          <p className="text-sm text-gray-600 mt-4 text-center">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-sky-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
