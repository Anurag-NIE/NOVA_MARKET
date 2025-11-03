import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp,
  Mail,
} from "lucide-react";
import api from "../utils/api";

const ManageProposals = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Fetching proposals for request ID:", id);
      const [requestRes, proposalsRes] = await Promise.all([
        api.get(`/service-requests/${id}`),
        api.get(`/service-requests/${id}/proposals`),
      ]);
      
      console.log("Request response:", requestRes.data);
      console.log("Proposals response:", proposalsRes.data);
      
      const requestData = requestRes.data?.request || requestRes.data;
      const proposalsData = proposalsRes.data?.proposals || [];
      
      console.log("Setting request:", requestData);
      console.log("Setting proposals:", proposalsData);
      
      setRequest(requestData);
      setProposals(proposalsData);
      
      if (proposalsData.length === 0) {
        console.warn("No proposals found for request ID:", id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      toast.error(error.response?.data?.detail || "Failed to load proposals");
      // Don't navigate away, just show error
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    if (!window.confirm("Are you sure you want to accept this proposal?")) {
      return;
    }

    try {
      await api.post(`/service-requests/${id}/proposals/${proposalId}/accept`);
      toast.success("Proposal accepted successfully!");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error accepting proposal:", error);
      toast.error(error.response?.data?.detail || "Failed to accept proposal");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "accepted":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-lg text-indigo-200">Loading proposals...</p>
        </div>
      </div>
    );
  }

  // Sort proposals by match score (highest first)
  const sortedProposals = [...proposals].sort(
    (a, b) => (b.ai_match_score || 0) - (a.ai_match_score || 0)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/my-requests")}
          className="mb-6 text-indigo-300 hover:text-white"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to My Requests
        </Button>

        {/* Request Summary */}
        {request && (
          <Card className="bg-slate-900/50 backdrop-blur-xl border-2 border-indigo-500/20 shadow-2xl mb-6">
            <CardHeader>
              <CardTitle className="text-2xl text-white">{request.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  {request.category}
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  ${request.budget?.toLocaleString()}
                </Badge>
                <Badge className={getStatusColor(request.status)}>
                  {request.status}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Proposals List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              Proposals ({proposals.length})
            </h2>
            {proposals.length > 0 && (
              <p className="text-slate-400">
                Sorted by match score (highest first)
              </p>
            )}
          </div>

          {sortedProposals.length === 0 ? (
            <Card className="bg-slate-900/50 backdrop-blur-xl border-2 border-slate-700 p-12 text-center">
              <Mail size={64} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No Proposals Yet
              </h3>
              <p className="text-slate-400">
                Proposals from freelancers will appear here
              </p>
            </Card>
          ) : (
            sortedProposals.map((proposal) => (
              <Card
                key={proposal.id || proposal._id}
                className="bg-slate-900/50 backdrop-blur-xl border-2 border-slate-700 hover:border-indigo-500/50 transition-all"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {proposal.freelancer_name || "Freelancer"}
                        </h3>
                        <Badge className={getStatusColor(proposal.status)}>
                          {proposal.status}
                        </Badge>
                        {proposal.ai_match_score !== undefined && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <TrendingUp size={12} className="mr-1" />
                            {proposal.ai_match_score}% Match
                          </Badge>
                        )}
                      </div>
                      {proposal.freelancer_title && (
                        <p className="text-sm text-slate-400 mb-2">
                          {proposal.freelancer_title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Proposal Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <DollarSign size={20} className="text-emerald-400" />
                      <div>
                        <p className="text-xs text-slate-400">Proposed Price</p>
                        <p className="font-bold text-emerald-400">
                          ${proposal.proposed_price?.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <Clock size={20} className="text-blue-400" />
                      <div>
                        <p className="text-xs text-slate-400">Delivery Time</p>
                        <p className="font-semibold text-blue-400">
                          {proposal.delivery_time_days || proposal.delivery_time} days
                        </p>
                      </div>
                    </div>

                    {proposal.completed_projects !== undefined && (
                      <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <Award size={20} className="text-purple-400" />
                        <div>
                          <p className="text-xs text-slate-400">Completed Projects</p>
                          <p className="font-semibold text-purple-400">
                            {proposal.completed_projects}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cover Letter */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">
                      Proposal Message
                    </h4>
                    <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {proposal.cover_letter}
                    </p>
                  </div>

                  {/* Skills */}
                  {proposal.skills && proposal.skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {proposal.skills.slice(0, 8).map((skill, idx) => (
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

                  {/* Actions */}
                  {request?.status === "open" && proposal.status === "pending" && (
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                      <Button
                        onClick={() => handleAcceptProposal(proposal.id || proposal._id)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <CheckCircle size={18} className="mr-2" />
                        Accept Proposal
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                        onClick={() => {
                          // TODO: Implement reject functionality
                          toast.info("Reject functionality coming soon");
                        }}
                      >
                        <XCircle size={18} className="mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {proposal.status === "accepted" && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <CheckCircle className="text-green-400" size={20} />
                      <span className="text-green-400 font-semibold">
                        This proposal has been accepted
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageProposals;

