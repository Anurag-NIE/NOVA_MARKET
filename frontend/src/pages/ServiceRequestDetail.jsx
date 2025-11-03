import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Send,
  Eye,
  TrendingUp,
  Award,
} from "lucide-react";
import api from "../utils/api";

const ServiceRequestDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/service-requests/${id}`);
      setRequest(response.data.request);
    } catch (error) {
      console.error("Error fetching request:", error);
      toast.error("Failed to load service request");
      navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in_progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "completed":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  const getExperienceBadgeColor = (level) => {
    switch (level) {
      case "beginner":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "intermediate":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "expert":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-lg text-indigo-200">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!request) return null;

  const isOwner = user?.role === "buyer" && user?.id === request.client_id;
  const canApply = user?.role === "seller" && request.status === "open" && !request.has_applied;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-indigo-300 hover:text-white"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back
        </Button>

        <Card className="bg-slate-900/50 backdrop-blur-xl border-2 border-indigo-500/20 shadow-2xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-4 text-white">
                  {request.title}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                    {request.category}
                  </Badge>
                  <Badge className={getExperienceBadgeColor(request.experience_level)}>
                    {request.experience_level}
                  </Badge>
                  {request.ai_match_score !== undefined && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <TrendingUp size={12} className="mr-1" />
                      {request.ai_match_score}% Match
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <DollarSign size={24} className="text-emerald-400" />
                <div>
                  <p className="text-xs text-slate-400">Budget</p>
                  <p className="font-bold text-lg text-emerald-400">
                    ${request.budget?.toLocaleString()}
                  </p>
                </div>
              </div>

              {request.deadline && (
                <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <Calendar size={24} className="text-blue-400" />
                  <div>
                    <p className="text-xs text-slate-400">Deadline</p>
                    <p className="font-semibold text-blue-400">
                      {new Date(request.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <Send size={24} className="text-purple-400" />
                <div>
                  <p className="text-xs text-slate-400">Proposals</p>
                  <p className="font-semibold text-purple-400">
                    {request.proposal_count || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-bold mb-3 text-white">Description</h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {request.description}
              </p>
            </div>

            {/* Skills Required */}
            {request.skills_required && request.skills_required.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-3 text-white">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {request.skills_required.map((skill, idx) => (
                    <Badge
                      key={idx}
                      className="bg-slate-800 text-slate-300 border-slate-600"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Client Info */}
            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
              <User size={24} className="text-indigo-400" />
              <div>
                <p className="text-sm text-slate-400">Posted by</p>
                <p className="font-semibold text-white">{request.client_name}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-slate-700">
              {isOwner && (
                <Button
                  onClick={() => navigate(`/manage-proposals/${id}`)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <Eye size={18} className="mr-2" />
                  View Proposals ({request.proposal_count || request.proposals_count || 0})
                </Button>
              )}

              {canApply && (
                <Button
                  onClick={() => navigate(`/submit-proposal/${id}`)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <Send size={18} className="mr-2" />
                  Submit Proposal
                </Button>
              )}

              {request.has_applied && (
                <div className="flex-1 flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle className="text-green-400" size={20} />
                  <span className="text-green-400">You've already applied</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceRequestDetail;

