import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";  
import { auth, db } from "./components/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";



const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
           
            setUserData({
              name: user.displayName,
              email: user.email,
              enrollment:
                user.displayName?.match(/\((.*?)\)/)?.[1] || "Not available",
            });
          }
        } catch (err) {
          console.error("Error fetching profile:", err.message);
        }
      } else {
        navigate("/"); 
      }
      setLoading(false);
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (loading) return <p className="text-center mt-10">Loading profile...</p>;

  if (!userData)
    return (
      <p className="text-center mt-10 text-red-500">
        Failed to load profile data.
      </p>
    );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4 text-sky-600">
          Welcome, {userData.name}
        </h1>
        <p className="text-gray-700 mb-2">
          <strong>Email:</strong> {userData.email}
        </p>
        <p className="text-gray-700 mb-4">
          <strong>Enrollment No:</strong> {userData.enrollment}
        </p>

        <button
          onClick={handleLogout}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition"
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
