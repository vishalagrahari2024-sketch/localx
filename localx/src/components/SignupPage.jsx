import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "./firebase";
import { GraduationCap } from "lucide-react";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

   
    const enrollmentPattern = /^BTCD[0-9]{2}[A-Z]{1}[0-9]{4}$/;
    if (!enrollmentPattern.test(enrollment.toUpperCase())) {
      setError("Please enter a valid enrollment number like BTCD24O1074");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      if (user) {
       
        await updateProfile(user, {
          displayName: `${name} (${enrollment.toUpperCase()})`,
        });
      }
      window.location.href = "/profile";
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex flex-1 bg-sky-500 items-center justify-center flex-col gap-6">
        <GraduationCap size={160} className="text-white opacity-90" />
        <h1 className="text-white text-5xl font-bold tracking-tight">SmartX</h1>
        <p className="text-sky-100 text-lg">Your campus community.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-sm w-full">
          <h1 className="text-3xl font-bold mb-6">Create your account</h1>

          <form onSubmit={handleSignup} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
            <input
              type="text"
              placeholder="Enrollment Number (e.g., BTCD24O1074)"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
              value={enrollment}
              onChange={(e) => setEnrollment(e.target.value.toUpperCase())}
              required
            />
            <button
              type="submit"
              className="w-full bg-sky-500 text-white py-2 rounded-lg font-semibold hover:bg-sky-600 transition"
            >
              Sign up
            </button>
          </form>

          {error && <p className="text-red-500 mt-2">{error}</p>}

          <p className="text-sm text-gray-600 mt-4 text-center">
            Already have an account?{" "}
            <Link to="/" className="text-sky-500 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
