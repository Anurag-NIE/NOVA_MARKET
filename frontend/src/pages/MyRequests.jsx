// frontend/src/pages/MyRequests.jsx - NEW FILE
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  Eye,
  Trash2,
  Plus,
  Clock,
  FileText,
} from "lucide-react";
import api from "../utils/api";

const MyRequests = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/my-service-requests");
      console.log("My requests:", response.data);
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load your requests");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      await api.delete(`/service-requests/${requestId}`);
      toast.success("Request deleted successfully");
      fetchMyRequests(); // Refresh list
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("Failed to delete request");
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
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">
            Loading your requests...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              My Service Requests
            </h1>
            <p className="text-muted-foreground">
              Manage your posted projects and view proposals
            </p>
          </div>
          <Button
            onClick={() => navigate("/post-service-request")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus size={18} className="mr-2" />
            Post New Request
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <FileText className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Requests
                  </p>
                  <p className="text-2xl font-bold">{requests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Clock className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold">
                    {requests.filter((r) => r.status === "open").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Briefcase className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">
                    {requests.filter((r) => r.status === "in_progress").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <Users className="text-amber-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Proposals
                  </p>
                  <p className="text-2xl font-bold">
                    {requests.reduce(
                      (sum, r) => sum + (r.proposals_count || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="text-purple-600" size={48} />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Requests Yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Post your first service request and start receiving proposals
                from talented freelancers
              </p>
              <Button
                onClick={() => navigate("/post-service-request")}
                className="bg-gradient-to-r from-purple-600 to-blue-600"
              >
                <Plus size={18} className="mr-2" />
                Post Your First Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card
                key={request.id}
                className="hover:shadow-lg transition-shadow border-2"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                          <Briefcase className="text-purple-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">
                            {request.title}
                          </h3>
                          <p className="text-muted-foreground line-clamp-2 mb-3">
                            {request.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <Badge variant="outline">{request.category}</Badge>
                            <Badge variant="outline">
                              {request.experience_level}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="font-semibold">
                          ${request.budget?.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {request.deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-blue-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Deadline
                          </p>
                          <p className="font-semibold text-sm">
                            {new Date(request.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-purple-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Proposals
                        </p>
                        <p className="font-semibold">
                          {request.proposals_count || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-amber-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Posted</p>
                        <p className="font-semibold text-sm">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {request.skills_required &&
                    request.skills_required.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold mb-2">
                          Required Skills:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {request.skills_required.map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => navigate(`/view-proposals/${request.id}`)}
                      className="flex-1"
                      variant="outline"
                    >
                      <Eye size={18} className="mr-2" />
                      View Proposals ({request.proposals_count || 0})
                    </Button>
                    <Button
                      onClick={() => handleDelete(request.id)}
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
