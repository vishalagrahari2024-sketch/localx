import React from "react";
import { auth, db } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const SignInWithGoogle = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const allowedDomain = "mitsgwl.ac.in";
      const userEmail = (user && user.email) ? user.email.toLowerCase() : "";

      if (!userEmail.endsWith("@" + allowedDomain)) {
        alert("Please ensure you using college email  @" + allowedDomain);
        try {
          await auth.signOut();
        } catch (signOutErr) {
          console.error("Error signing out unauthorized user:", signOutErr);
        }
        return; 
      }
    

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          createdAt: new Date().toISOString(),
          enrollment: user.displayName?.match(/\((.*?)\)/)?.[1] || "Not available",
        });
        navigate("/complete-profile");
      } else {
        navigate("/profile");
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      alert("Google Sign-In failed. Please try again.");
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-gray-100 transition w-full"
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="w-5 h-5"
      />
      <span className="text-gray-700 font-medium">Continue with Google</span>
    </button>
  );
};

export default SignInWithGoogle;
