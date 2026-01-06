// frontend/src/pages/FreelancerProfileSetup.jsx - COMPLETE FIX
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  UserCircle, Briefcase, DollarSign, Award, CheckCircle,
  Plus, X, Save, MapPin, Globe
} from "lucide-react";
import api from "../utils/api";

const FreelancerProfileSetup = ({ user }) => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(!userId);
  const [skillInput, setSkillInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");

  // ✅ FIX: Proper initialization with empty arrays
  const [profile, setProfile] = useState({
    title: "",
    bio: "",
    skills: [],
    experience_years: 0,
    hourly_rate: "",
    portfolio_url: "",
    certifications: [],
    categories: [],
    languages: [],
    education: [],
    portfolio: [],
    location: "",
    website: "",
    availability: "available",
  });

const availableSkills = [
  // Home & Repair
  "Electrical Work",
  "Plumbing",
  "Carpentry",
  "Appliance Repair",
  "AC Repair",

  // Cleaning & Maintenance
  "Home Cleaning",
  "Pest Control",

  // Delivery & Logistics
  "Local Delivery",
  "Two-Wheeler Delivery",
  "Goods Transport",

  // Skilled Labor
  "Painting",
  "General Maintenance",

  // Food & Personal
  "Home Cooking",
  "Catering",
  "Tailoring",

  // Business Support
  "Order Handling",
  "Billing / POS",

  // Emergency
  "Emergency Services",
];


const availableCategories = [
  "Home Services",
  "Repair & Maintenance",
  "Local Delivery",
  "Skilled Labor",
  "Cleaning & Maintenance",
  "Food & Catering",
  "Personal & Lifestyle",
  "Pet Services",
  "Business Support",
  "Emergency Services",
];


  useEffect(() => {
    loadProfile(userId);
  }, [userId]);

  const loadProfile = async (id = null) => {
    try {
      setFetchingProfile(true);
      const endpoint = id ? `/freelancer/profile/${id}` : "/freelancer/profile";
      const response = await api.get(endpoint);

      // Handle both response.data.profile and response.data directly
      const profileData = response.data?.profile || response.data;
      
      if (profileData) {
        // ✅ FIX: Safe array handling with proper fallbacks
        setProfile({
          title: profileData.title || "",
          bio: profileData.bio || "",
          skills: Array.isArray(profileData.skills) ? profileData.skills : [],
          experience_years: profileData.experience_years || 0,
          hourly_rate: profileData.hourly_rate || "",
          portfolio_url: profileData.portfolio_url || "",
          certifications: Array.isArray(profileData.certifications) ? profileData.certifications : [],
          categories: Array.isArray(profileData.categories) ? profileData.categories : [],
          languages: Array.isArray(profileData.languages) ? profileData.languages : [],
          education: Array.isArray(profileData.education) ? profileData.education : [],
          portfolio: Array.isArray(profileData.portfolio) ? profileData.portfolio : [],
          location: profileData.location || "",
          website: profileData.website || "",
          availability: profileData.availability || "available",
        });

        if (!userId) {
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      if (error.response?.status === 404) {
        // Profile doesn't exist yet - that's okay, user can create one
        setIsEditing(true);
      } else {
        toast.error("Failed to load profile");
      }
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!profile.title?.trim()) {
      toast.error("Professional title is required");
      return;
    }
    if (!profile.bio?.trim()) {
      toast.error("Bio is required");
      return;
    }
    if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
      toast.error("Please select at least one skill");
      return;
    }
    if (!profile.hourly_rate || parseFloat(profile.hourly_rate) <= 0) {
      toast.error("Please enter a valid hourly rate");
      return;
    }

    setLoading(true);

    try {
      // Prepare payload - ensure all fields are properly formatted
      const payload = {
        title: profile.title?.trim() || "",
        bio: profile.bio?.trim() || "",
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        categories: Array.isArray(profile.categories) ? profile.categories : [],
        experience_years: parseInt(profile.experience_years) || 0,
        hourly_rate: parseFloat(profile.hourly_rate) || 0,
        portfolio_url: profile.portfolio_url || null,
        education: Array.isArray(profile.education) ? profile.education : [],
        certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
        portfolio: Array.isArray(profile.portfolio) ? profile.portfolio : [],
        languages: Array.isArray(profile.languages) ? profile.languages : ["English"],
        location: profile.location?.trim() || null,
        website: profile.website?.trim() || null,
        availability: profile.availability || "available",
      };

      console.log("Saving profile with payload:", payload);

      const response = await api.post("/freelancer/profile", payload);

      console.log("Profile save response:", response.data);

      toast.success(response.data.message || "Profile saved successfully!");
      
      // ✅ FIX: Reload profile and switch to view mode after save
      await loadProfile(userId);
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Error saving profile:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      
      // Provide more detailed error message
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message 
        || error.message 
        || "Failed to save profile. Please check all required fields.";
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Safe skill toggling
  const toggleSkill = (skill) => {
    setProfile((prev) => {
      const currentSkills = Array.isArray(prev.skills) ? prev.skills : [];
      return {
        ...prev,
        skills: currentSkills.includes(skill)
          ? currentSkills.filter((s) => s !== skill)
          : [...currentSkills, skill],
      };
    });
  };

  // ✅ FIX: Safe category toggling
  const toggleCategory = (category) => {
    setProfile((prev) => {
      const currentCategories = Array.isArray(prev.categories) ? prev.categories : [];
      return {
        ...prev,
        categories: currentCategories.includes(category)
          ? currentCategories.filter((c) => c !== category)
          : [...currentCategories, category],
      };
    });
  };

  const addSkill = () => {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, skillInput.trim()] });
      setSkillInput("");
      toast.success("Skill added");
    }
  };

  const removeSkill = (skill) => {
    setProfile({ ...profile, skills: profile.skills.filter((s) => s !== skill) });
  };

  const addLanguage = () => {
    if (languageInput.trim() && !profile.languages.includes(languageInput.trim())) {
      setProfile({ ...profile, languages: [...profile.languages, languageInput.trim()] });
      setLanguageInput("");
      toast.success("Language added");
    }
  };

  const removeLanguage = (lang) => {
    setProfile({ ...profile, languages: profile.languages.filter((l) => l !== lang) });
  };

  if (fetchingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
        <div className="flex flex-col items-center gap-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <UserCircle className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {isEditing ? "Edit" : "Setup"} Freelancer Profile
          </h1>
          <p className="text-muted-foreground text-lg">
            Stand out to potential clients with a professional profile
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-2 p-8">
          {!isEditing ? (
            // View Mode - Display profile with Edit button
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Freelancer Profile</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <UserCircle size={18} />
                  Edit Profile
                </button>
              </div>

              {/* Profile Display */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Professional Title</h3>
                  <p className="text-muted-foreground">{profile.title || "Not set"}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Bio</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio || "Not set"}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Experience</h3>
                    <p className="text-muted-foreground">{profile.experience_years || 0} years</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Hourly Rate</h3>
                    <p className="text-muted-foreground">${profile.hourly_rate || "0"}/hour</p>
                  </div>
                </div>

                {profile.categories && profile.categories.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.categories.map((cat, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.skills && profile.skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.location && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Location</h3>
                    <p className="text-muted-foreground">{profile.location}</p>
                  </div>
                )}

                {profile.website && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Website</h3>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      {profile.website}
                    </a>
                  </div>
                )}

                {profile.portfolio_url && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Portfolio</h3>
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      {profile.portfolio_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Edit Mode - Form
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Professional Title */}
            <div className="space-y-2">
              <label className="block font-semibold text-base">
                Professional Title *
              </label>
              <input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                placeholder="e.g., Full Stack Developer"
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="block font-semibold text-base">
                Professional Bio *
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell clients about your experience..."
                required
                rows={6}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {(profile.bio || "").length}/500 characters
              </p>
            </div>

            {/* Experience & Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block font-semibold text-base">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  value={profile.experience_years}
                  onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="50"
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-base">
                  Hourly Rate (USD) *
                </label>
                <input
                  type="number"
                  value={profile.hourly_rate}
                  onChange={(e) => setProfile({ ...profile, hourly_rate: e.target.value })}
                  placeholder="50"
                  min="1"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <label className="block font-semibold text-base">Categories</label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => {
                  const isSelected = Array.isArray(profile.categories) && profile.categories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {isSelected && <CheckCircle size={14} className="inline mr-1" />}
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-3">
              <label className="block font-semibold text-base">
                Skills * (Click to select)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => {
                  const isSelected = Array.isArray(profile.skills) && profile.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {isSelected && <CheckCircle size={14} className="inline mr-1" />}
                      {skill}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {Array.isArray(profile.skills) ? profile.skills.length : 0} skills
              </p>
            </div>

            {/* Custom Skills */}
            <div className="space-y-3">
              <label className="block font-semibold text-base">Add Custom Skills</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Add a custom skill"
                  className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
              {profile.skills.filter(s => !availableSkills.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.filter(s => !availableSkills.includes(s)).map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-600 text-white rounded-full text-sm flex items-center gap-2">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Location & Website */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block font-semibold text-base">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="e.g., New York, USA"
                    className="w-full pl-10 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-base">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="w-full pl-10 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    if (profile.title) {
                      setIsEditing(false);
                      loadProfile(userId);
                    } else {
                      navigate(userId ? -1 : "/dashboard");
                    }
                  }}
                  className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfileSetup;










// // frontend/src/pages/FreelancerProfileSetup.jsx - BULLETPROOF FIX
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "../components/ui/card";
// import { Button } from "../components/ui/button";
// import { Input } from "../components/ui/input";
// import { Label } from "../components/ui/label";
// import { Textarea } from "../components/ui/textarea";
// import { Badge } from "../components/ui/badge";
// import {
//   UserCircle,
//   Briefcase,
//   DollarSign,
//   Award,
//   Globe,
//   CheckCircle,
// } from "lucide-react";
// import api from "../utils/api";

// const FreelancerProfileSetup = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [fetchingProfile, setFetchingProfile] = useState(true);

//   // ✅ FIX: Always initialize with empty arrays
//   const [profile, setProfile] = useState({
//     title: "",
//     bio: "",
//     skills: [],
//     experience_years: 0,
//     hourly_rate: "",
//     portfolio_url: "",
//     certifications: [],
//     categories: [], // ✅ Always array
//   });

//   const availableSkills = [
//     "React",
//     "Node.js",
//     "Python",
//     "Django",
//     "FastAPI",
//     "PostgreSQL",
//     "MongoDB",
//     "AWS",
//     "Docker",
//     "Kubernetes",
//     "UI/UX Design",
//     "Figma",
//     "Adobe XD",
//     "Content Writing",
//     "SEO",
//     "Digital Marketing",
//     "Video Editing",
//     "Data Science",
//     "Machine Learning",
//     "TensorFlow",
//     "Vue.js",
//     "Angular",
//     "TypeScript",
//     "GraphQL",
//     "Redis",
//   ];

//   const availableCategories = [
//     "Web Development",
//     "Mobile Development",
//     "UI/UX Design",
//     "Data Science",
//     "Machine Learning",
//     "DevOps",
//     "Content Writing",
//     "Digital Marketing",
//     "Video Editing",
//     "Graphic Design",
//     "Consulting",
//   ];

//   useEffect(() => {
//     loadProfile();
//   }, []);

//   const loadProfile = async () => {
//     try {
//       setFetchingProfile(true);
//       const response = await api.get("/freelancer/profile");

//       if (response.data.profile) {
//         // ✅ FIX: Ensure all arrays have default values
//         setProfile({
//           title: response.data.profile.title || "",
//           bio: response.data.profile.bio || "",
//           skills: Array.isArray(response.data.profile.skills)
//             ? response.data.profile.skills
//             : [],
//           experience_years: response.data.profile.experience_years || 0,
//           hourly_rate: response.data.profile.hourly_rate || "",
//           portfolio_url: response.data.profile.portfolio_url || "",
//           certifications: Array.isArray(response.data.profile.certifications)
//             ? response.data.profile.certifications
//             : [],
//           categories: Array.isArray(response.data.profile.categories)
//             ? response.data.profile.categories
//             : [],
//         });
//       }
//     } catch (error) {
//       console.error("Error loading profile:", error);
//       if (error.response?.status !== 404) {
//         toast.error("Failed to load profile");
//       }
//     } finally {
//       setFetchingProfile(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validation
//     if (!profile.title?.trim()) {
//       toast.error("Professional title is required");
//       return;
//     }
//     if (!profile.bio?.trim()) {
//       toast.error("Bio is required");
//       return;
//     }
//     if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
//       toast.error("Please select at least one skill");
//       return;
//     }
//     if (!profile.hourly_rate || parseFloat(profile.hourly_rate) <= 0) {
//       toast.error("Please enter a valid hourly rate");
//       return;
//     }

//     setLoading(true);

//     try {
//       const response = await api.post("/freelancer/profile", {
//         ...profile,
//         hourly_rate: parseFloat(profile.hourly_rate),
//         experience_years: parseInt(profile.experience_years) || 0,
//       });

//       toast.success(response.data.message || "Profile saved successfully!");
//       setTimeout(() => {
//         navigate("/seller-dashboard");
//       }, 1500);
//     } catch (error) {
//       console.error("Error saving profile:", error);
//       toast.error(error.response?.data?.detail || "Failed to save profile");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const toggleSkill = (skill) => {
//     setProfile((prev) => {
//       // ✅ FIX: Defensive check
//       const currentSkills = Array.isArray(prev.skills) ? prev.skills : [];
//       return {
//         ...prev,
//         skills: currentSkills.includes(skill)
//           ? currentSkills.filter((s) => s !== skill)
//           : [...currentSkills, skill],
//       };
//     });
//   };

//   const toggleCategory = (category) => {
//     setProfile((prev) => {
//       // ✅ FIX: Defensive check
//       const currentCategories = Array.isArray(prev.categories)
//         ? prev.categories
//         : [];
//       return {
//         ...prev,
//         categories: currentCategories.includes(category)
//           ? currentCategories.filter((c) => c !== category)
//           : [...currentCategories, category],
//       };
//     });
//   };

//   if (fetchingProfile) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="flex flex-col items-center gap-4">
//           <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
//           <p className="text-sm text-muted-foreground">Loading profile...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-12">
//       <div className="max-w-4xl mx-auto px-4">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
//             <UserCircle className="text-white" size={40} />
//           </div>
//           <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
//             Complete Your Freelancer Profile
//           </h1>
//           <p className="text-muted-foreground text-lg">
//             Stand out to potential clients with a professional profile
//           </p>
//         </div>

//         <Card className="shadow-xl border-2">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Briefcase size={24} className="text-purple-600" />
//               Professional Information
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Professional Title */}
//               <div className="space-y-2">
//                 <Label htmlFor="title" className="text-base font-semibold">
//                   Professional Title *
//                 </Label>
//                 <Input
//                   id="title"
//                   value={profile.title}
//                   onChange={(e) =>
//                     setProfile({ ...profile, title: e.target.value })
//                   }
//                   placeholder="e.g., Full Stack Developer, UI/UX Designer"
//                   required
//                   className="h-12"
//                 />
//               </div>

//               {/* Bio */}
//               <div className="space-y-2">
//                 <Label htmlFor="bio" className="text-base font-semibold">
//                   Professional Bio *
//                 </Label>
//                 <Textarea
//                   id="bio"
//                   value={profile.bio}
//                   onChange={(e) =>
//                     setProfile({ ...profile, bio: e.target.value })
//                   }
//                   placeholder="Tell clients about your experience, expertise, and what makes you unique..."
//                   required
//                   rows={6}
//                   className="resize-none"
//                 />
//                 <p className="text-xs text-muted-foreground">
//                   {(profile.bio || "").length}/500 characters
//                 </p>
//               </div>

//               {/* Experience & Rate */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="experience"
//                     className="text-base font-semibold"
//                   >
//                     Years of Experience *
//                   </Label>
//                   <div className="relative">
//                     <Briefcase
//                       className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                       size={18}
//                     />
//                     <Input
//                       id="experience"
//                       type="number"
//                       value={profile.experience_years}
//                       onChange={(e) =>
//                         setProfile({
//                           ...profile,
//                           experience_years: parseInt(e.target.value) || 0,
//                         })
//                       }
//                       min="0"
//                       max="50"
//                       required
//                       className="pl-10 h-12"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="hourly_rate"
//                     className="text-base font-semibold"
//                   >
//                     Hourly Rate (USD) *
//                   </Label>
//                   <div className="relative">
//                     <DollarSign
//                       className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                       size={18}
//                     />
//                     <Input
//                       id="hourly_rate"
//                       type="number"
//                       value={profile.hourly_rate}
//                       onChange={(e) =>
//                         setProfile({
//                           ...profile,
//                           hourly_rate: e.target.value,
//                         })
//                       }
//                       placeholder="50"
//                       min="1"
//                       step="0.01"
//                       required
//                       className="pl-10 h-12"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Portfolio URL */}
//               <div className="space-y-2">
//                 <Label htmlFor="portfolio" className="text-base font-semibold">
//                   Portfolio URL (Optional)
//                 </Label>
//                 <div className="relative">
//                   <Globe
//                     className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                     size={18}
//                   />
//                   <Input
//                     id="portfolio"
//                     type="url"
//                     value={profile.portfolio_url}
//                     onChange={(e) =>
//                       setProfile({ ...profile, portfolio_url: e.target.value })
//                     }
//                     placeholder="https://yourportfolio.com"
//                     className="pl-10 h-12"
//                   />
//                 </div>
//               </div>

//               {/* Categories */}
//               <div className="space-y-3">
//                 <Label className="text-base font-semibold">
//                   Categories (Select your specialties)
//                 </Label>
//                 <div className="flex flex-wrap gap-2">
//                   {availableCategories.map((category) => {
//                     // ✅ FIX: Safe check
//                     const isSelected =
//                       Array.isArray(profile.categories) &&
//                       profile.categories.includes(category);

//                     return (
//                       <Badge
//                         key={category}
//                         variant={isSelected ? "default" : "outline"}
//                         className={`cursor-pointer px-4 py-2 text-sm transition-all ${
//                           isSelected
//                             ? "bg-purple-600 hover:bg-purple-700 shadow-md"
//                             : "hover:bg-purple-50 dark:hover:bg-purple-950"
//                         }`}
//                         onClick={() => toggleCategory(category)}
//                       >
//                         {isSelected && (
//                           <CheckCircle size={14} className="mr-1" />
//                         )}
//                         {category}
//                       </Badge>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Skills */}
//               <div className="space-y-3">
//                 <Label className="text-base font-semibold">
//                   Skills * (Select all that apply)
//                 </Label>
//                 <div className="flex flex-wrap gap-2">
//                   {availableSkills.map((skill) => {
//                     // ✅ FIX: Safe check
//                     const isSelected =
//                       Array.isArray(profile.skills) &&
//                       profile.skills.includes(skill);

//                     return (
//                       <Badge
//                         key={skill}
//                         variant={isSelected ? "default" : "outline"}
//                         className={`cursor-pointer px-4 py-2 text-sm transition-all ${
//                           isSelected
//                             ? "bg-blue-600 hover:bg-blue-700 shadow-md"
//                             : "hover:bg-blue-50 dark:hover:bg-blue-950"
//                         }`}
//                         onClick={() => toggleSkill(skill)}
//                       >
//                         {isSelected && (
//                           <CheckCircle size={14} className="mr-1" />
//                         )}
//                         {skill}
//                       </Badge>
//                     );
//                   })}
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   Selected:{" "}
//                   {Array.isArray(profile.skills) ? profile.skills.length : 0}{" "}
//                   skills
//                 </p>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-3 pt-6">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => navigate("/seller-dashboard")}
//                   className="flex-1"
//                   disabled={loading}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   disabled={loading}
//                   className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
//                 >
//                   {loading ? (
//                     <>
//                       <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Award size={18} className="mr-2" />
//                       Save Profile
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </form>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default FreelancerProfileSetup;
