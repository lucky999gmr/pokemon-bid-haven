
import { useState, useContext } from "react";
import { Navbar } from "@/components/Navbar";
import { UserContext } from "@/App";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";

const Profile = () => {
  const { user } = useContext(UserContext);
  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || '');
  const [saving, setSaving] = useState(false);
  
  // Get initials for avatar
  const initials = displayName ? displayName.substring(0, 2).toUpperCase() : '';

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSave = () => {
    setSaving(true);
    // Simulate saving
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved."
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Your Profile</h1>
        
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-red-500 text-white text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl dark:text-white">{displayName}</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  {user.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <Input
                value={user.email || ''}
                disabled
                className="bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={saving} className="ml-auto">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="mt-6 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl dark:text-white">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-300 text-sm">Pokémon Owned</p>
                <p className="text-2xl font-bold dark:text-white">0</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-300 text-sm">Auctions Won</p>
                <p className="text-2xl font-bold dark:text-white">0</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-300 text-sm">Games Played</p>
                <p className="text-2xl font-bold dark:text-white">0</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-300 text-sm">PokéCoins</p>
                <p className="text-2xl font-bold dark:text-white">1000</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
