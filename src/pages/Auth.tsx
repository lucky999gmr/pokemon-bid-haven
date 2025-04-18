
import { AuthForm } from "@/components/auth/AuthForm";
import { Navbar } from "@/components/Navbar";
import { useContext, useEffect } from "react";
import { UserContext } from "@/App";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-md w-full mx-auto space-y-8 mt-20 px-4 sm:px-6">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to PokéBid
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Login or create an account to start trading Pokémon
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Auth;
