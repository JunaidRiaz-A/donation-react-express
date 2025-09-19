import type React from "react";
import { useState, useEffect } from "react";
import { User, Mail, Save, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import axiosInstance from "../../../api/axiosInstance";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

interface ProfileFormData {
  firstname: string;
  lastname: string;
  email: string;
  role?: string;
}

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading, setUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Fixed line
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstname: "",
    lastname: "",
    email: "",
  });
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false); // Modal state
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        email: user.email || "",
        role: user.role?.toLowerCase() || "participant",
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.toLowerCase() }));
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|co)$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address (e.g., user@example.com)");
      setLoading(false);
      return;
    }

    // Check if role is changing and show modal
    if (formData.role && formData.role !== (user?.role?.toLowerCase() || "participant")) {
      setShowRoleChangeModal(true);
      setLoading(false); // Stop loading until modal is confirmed
      return;
    }

    // Proceed with submission if no role change or after modal confirmation
    await processSubmit();
  };

  const handleModalConfirm = async () => {
    setShowRoleChangeModal(false);
    setLoading(true);
    await processSubmit();
  };

  const handleModalCancel = () => {
    setShowRoleChangeModal(false);
    setLoading(false);
  };

  const processSubmit = async () => {
    try {
      const updateData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        ...(formData.role && formData.role !== (user?.role?.toLowerCase() || "participant") && { role: formData.role }),
      };
      console.log("Sending update data:", updateData);

      const response = await axiosInstance.put(`/users/${user?.id}`, updateData, {
        headers: { "X-Skip-Redirect": "true" },
      });

      if (response.data.user || response.data) {
        const updatedUser = response.data.user || response.data;
        console.log("Received updated user:", updatedUser);

        // Update user state with the response from the backend
        const finalUser = {
          ...user,
          ...updatedUser,
          role: updatedUser.role?.toLowerCase() || user.role?.toLowerCase() || "participant",
        };
        localStorage.setItem("user", JSON.stringify(finalUser));
        setUser(finalUser);

        // If role changed, log out and redirect to login
        if (formData.role && formData.role !== (user?.role?.toLowerCase() || "participant")) {
          logout(); // Clear auth state and token
          toast.info("Role changed successfully. Please log in again to apply the new role.");
          navigate("/login");
          return;
        }

        toast.info("Profile updated successfully");
        if (finalUser.role === "host") {
          navigate("/dashboard");
        }
        setIsEditing(false);
      } else {
        throw new Error("No user data returned from API");
      }
    } catch (err: any) {
      console.error("Profile update error:", err.response?.data || err.message || err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (authLoading) {
    return (
      <DashboardLayout userRole="host" userName="">
        <div className="container-fluid p-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading your profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null; // DashboardPage handles redirection
  }

  const userName = `${user.firstname || "User"} ${user.lastname || ""}`;
  const userRole = user.role?.toLowerCase() || "participant";

  return (
    <DashboardLayout userRole={userRole as "admin" | "host" | "participant"} userName={userName}>
      <div className="container-fluid p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1">My Profile</h2>
            <p className="text-muted">View and manage your account information</p>
          </div>
          <div className="d-flex flex-column flex-sm-row gap-2">
            <button className={`btn ${isEditing ? "btn-outline-secondary" : "btn-primary"}`} onClick={toggleEdit}>
              {isEditing ? (
                <>
                  <X size={16} className="me-2" />
                  Cancel
                </>
              ) : (
                <>
                  <User size={16} className="me-2" />
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <div className="d-flex flex-column flex-md-row align-items-center">
              <div
                className="profile-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mb-3 mb-md-0 me-md-3"
                style={{ width: "80px", height: "80px", fontSize: "1.75rem", flexShrink: 0 }}
              >
                {(user.firstname || "U").charAt(0).toUpperCase()}
                {(user.lastname || "").charAt(0).toUpperCase()}
              </div>
              <div className="text-center text-md-start">
                <h3 className="mb-1">
                  {user.firstname || "User"} {user.lastname || ""}
                </h3>
                <p className="mb-1">{(user.role?.toLowerCase() || "participant").charAt(0).toUpperCase() + (user.role?.toLowerCase() || "participant").slice(1)}</p>
                <small className="text-muted">Member since {formatDate(user.createdAt)}</small>
              </div>
            </div>
          </div>
          <div className="card-body">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <h4 className="mb-3">Personal Information</h4>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label htmlFor="firstname" className="form-label">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstname"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label htmlFor="lastname" className="form-label">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastname"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="email" className="form-label">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        disabled={loading}
                        readOnly
                      />
                    </div>
                    {userRole !== "host" && userRole !== "admin" && (
                      <div className="col-12">
                        <label htmlFor="role" className="form-label">
                          Role
                        </label>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          className="form-select"
                          disabled={loading}
                        >
                          <option value="participant">Participant</option>
                          <option value="host">Host</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={toggleEdit} disabled={loading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="me-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="mb-4">
                  <h4 className="mb-3">Personal Information</h4>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-1">
                          <User size={18} className="text-primary me-2" />
                          <label className="text-muted small">Full Name</label>
                        </div>
                        <p className="mb-0 fw-medium">
                          {user.firstname || "User"} {user.lastname || ""}
                        </p>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-1">
                          <Mail size={18} className="text-primary me-2" />
                          <label className="text-muted small">Email Address</label>
                        </div>
                        <p className="mb-0 fw-medium">{user.email || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3">Account Information</h4>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="mb-3">
                        <label className="text-muted small d-block mb-1">Account Type</label>
                        <p className="mb-0 fw-medium">
                          {(user.role?.toLowerCase() || "participant").charAt(0).toUpperCase() + (user.role?.toLowerCase() || "participant").slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="mb-3">
                        <label className="text-muted small d-block mb-1">Member Since</label>
                        <p className="mb-0 fw-medium">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Role Change Confirmation Modal */}
        {showRoleChangeModal && (
          <div className="modal" tabIndex="-1" style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: "#ffffff", borderRadius: "0.3rem" }}>
                <div className="modal-header" style={{ borderBottom: "1px solid #dee2e6" }}>
                  <h5 className="modal-title" style={{ color: "#333" }}>Confirm Role Change</h5>
                  <button type="button" className="btn-close" onClick={handleModalCancel} aria-label="Close"></button>
                </div>
                <div className="modal-body" style={{ color: "#555" }}>
                  Are you sure you want to change the role?
                </div>
                <div className="modal-footer" style={{ borderTop: "1px solid #dee2e6" }}>
                  <button type="button" className="btn btn-outline-secondary" onClick={handleModalCancel} style={{ color: "#6c757d", borderColor: "#6c757d" }}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleModalConfirm} style={{ backgroundColor: "#007bff", borderColor: "#007bff", color: "#ffffff" }}>
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage