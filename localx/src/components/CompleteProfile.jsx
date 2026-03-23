import React, { useState } from "react";
import { auth, db } from "./firebase";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const CompleteProfile = () => {
  const [username, setUsername] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const enrollmentPattern = /^BTCD[0-9]{2}[A-Z]{1}[0-9]{4}$/;

    if (!enrollmentPattern.test(enrollment.toUpperCase())) {
      setError("Please enter a valid enrollment number like BTCD24O1074");
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, {
          displayName: `${username} (${enrollment.toUpperCase()})`,
        });

        await setDoc(doc(db, "users", user.uid), {
          name: username,
          email: user.email,
          enrollment: enrollment.toUpperCase(),
          provider: "google",
          createdAt: new Date(),
        });
      }
      navigate("/profile");
    } catch (err) {
      setError("Failed to update profile: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-4">Complete Your Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
            required
          />
          <input
            type="text"
            placeholder="Enter your Enrollment No (e.g., BTCD24O1074)"
            value={enrollment}
            onChange={(e) => setEnrollment(e.target.value.toUpperCase())}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-sky-500 text-white py-2 rounded-lg font-semibold hover:bg-sky-600 transition"
          >
            Save & Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
