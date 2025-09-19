"use client";

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { Calendar, MapPin, Users, Edit, Trash2, Info, Plus, UserPlus, Eye, Vote, BarChart3 } from "lucide-react";
import { FcMoneyTransfer } from "react-icons/fc";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import EventEditModal from "../modals/EventEditModal";
import { toast } from "react-toastify";

interface Event {
  _id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  guestCount: number;
  goalAmount: number;
  suggestedDonation: number;
  imageUrl?: string;
  isPublic: boolean;
  createdAt: string;
  hostId: string | { _id: string };
  status?: string;
  isDraft?: boolean;
}

interface DeleteConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
}

interface InviteModalProps {
  show: boolean;
  onHide: () => void;
  event: Event | null;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalEvents: number;
  limit: number;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  show,
  onHide,
  onConfirm,
}) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Confirm Deletion</h5>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete this draft event? This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onHide}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Delete Event
          </button>
        </div>
      </div>
    </div>
  );
};

const InviteModal: React.FC<InviteModalProps> = ({ show, onHide, event }) => {
  const [guestEmail, setGuestEmail] = useState("");
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const { user } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|org|net|edu|gov)$/i;
    return emailRegex.test(email);
  };

  const handleSendInvitation = async () => {
    if (event && guestEmail && user?.email) {
      if (!validateEmail(guestEmail)) {
        toast.error("Please enter a valid email address (e.g., user@domain.com).");
        return;
      }

      try {
        const response = await axiosInstance.post(`${baseUrl}/events/invite-by-email`, {
          from: user.email,
          eventId: event._id,
          to: guestEmail,
        });
        toast.success("Invitation sent successfully!");
        setGuestEmail("");
        onHide();
      } catch (error) {
        console.error("Error sending invitation:", error);
        const message = error.response?.data?.message || "An error occurred while sending the invitation.";
        toast.error(`Failed to send invitation: ${message}`);
      }
    } else {
      toast.error("Please enter a valid email address or check user authentication.");
    }
  };

  const handleClear = () => {
    setGuestEmail("");
  };

  if (!show || !event) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onHide();
        }
      }}
    >
      <div className="modal-content invite-modal">
        <div className="modal-header">
          <h5 className="modal-title">Invite Guest to Draft Event</h5>
        </div>
        <div className="modal-body">
          <div className="event-details">
            <h6>Event Details</h6>
            <div className="event-info">
              <p>
                <strong>Title:</strong> {event.title}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(event.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <p>
                <strong>Location:</strong> {event.location || "N/A"}
              </p>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="guestEmail" className="form-label">
              Guest Email Address
            </label>
            <input
              type="email"
              className="form-control"
              id="guestEmail"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="Enter guest email (e.g., user@domain.com)"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClear}>
            Clear
          </button>
          <button className="btn btn-primary" onClick={handleSendInvitation}>
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
};

const DraftEventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventIdToDelete, setEventIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalEvents: 0,
    limit: 10,
  });

  const baseUrl = import.meta.env.VITE_BASE_URL;

  console.log("Base URL in DraftEventsPage:", baseUrl);

  const fetchDraftEvents = async (page: number = 1) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const params = { hostId: user.id, page, limit: pagination.limit };
      console.log("Fetching draft events from:", `${baseUrl}/api/events/drafts`, "with params:", params);
      const response = await axiosInstance.get(`${baseUrl}/api/events/drafts`, {
        headers: { "x-auth-token": token },
        params,
      });
      setEvents(response.data.events || []);
      setPagination({
        currentPage: response.data.pagination.currentPage || 1,
        totalPages: response.data.pagination.totalPages || 1,
        totalEvents: response.data.pagination.totalEvents || 0,
        limit: response.data.pagination.limit || 10,
      });
    } catch (err: any) {
      console.error("Error fetching draft events:", err);
      setError(err.response?.data?.message || "Failed to fetch draft events");
      toast.error(error || "Failed to fetch draft events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDraftEvents(pagination.currentPage);
    }
  }, [user?.id, pagination.currentPage]);

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEventIdToDelete(eventId);
    setShowDeleteModal(true);
  };

  const handleInvite = (event: Event) => {
    setSelectedEvent(event);
    setShowInviteModal(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventIdToDelete) return;

    setIsDeleting(eventIdToDelete);
    setShowDeleteModal(false);
    try {
      const token = localStorage.getItem("token") || "";
      await axiosInstance.delete(`${baseUrl}/api/draft-events/${eventIdToDelete}`, {
        headers: { "x-auth-token": token },
      });
      toast.success("Draft event deleted successfully");
      fetchDraftEvents(pagination.currentPage);
    } catch (err: any) {
      console.error("Failed to delete event:", err);
      toast.error(err.response?.data?.message || "Failed to delete event");
    } finally {
      setIsDeleting(null);
      setEventIdToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isUpcoming = (dateString: string) => {
    const eventDate = new Date(dateString);
    return eventDate > new Date();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Image failed to load:", e.currentTarget.src);
    e.currentTarget.style.display = "none";
    e.currentTarget.nextElementSibling!.style.display = "flex";
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  if (!user) {
    return null;
  }

  const userName = `${user.firstname || "User"} ${user.lastname || ""}`;
  const userRole = user.role || "host";

  const draftEvents = [...events]
    .filter((event) => event.isDraft)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <DashboardLayout
      userRole={userRole as "admin" | "host" | "guest"}
      userName={userName}
    >
      <div className="events-container">
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Draft Events</h1>
            <p className="page-subtitle">Manage your draft events</p>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="events-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your draft events...</p>
            </div>
          ) : draftEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Calendar size={48} />
              </div>
              <h3>No Draft Events Found</h3>
              <p>You haven't created any draft events yet. Start by creating a new event!</p>
            </div>
          ) : (
            <div className="events-grid">
              {draftEvents.map((event) => {
                const imageUrl = event.imageUrl ? `${baseUrl}${event.imageUrl}` : null;
                console.log("Draft Event Image URL:", imageUrl);
                return (
                  <div key={event._id} className={`event-card ${!isUpcoming(event.date) ? "past-event" : ""}`}>
                    <div className="card-header">
                      <div className="image-container">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={event.title}
                            className="event-image"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="placeholder-image">
                            <Calendar size={32} />
                          </div>
                        )}
                        {!isUpcoming(event.date) && <div className="event-status">Past Event</div>}
                        {event.isDraft && <div className="event-status draft-status">Draft</div>}
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="event-title-section">
                        <h3 className="event-title">{event.title}</h3>
                      </div>

                      <div className="event-details">
                        <div className="detail-item">
                          <Calendar size={16} />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="detail-item">
                          <MapPin size={16} />
                          <span>{event.location || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <Users size={16} />
                          <span>Max Guests: {event.guestCount || 0}</span>
                        </div>
                        <div className="detail-item">
                          <FcMoneyTransfer size={16} />
                          <span>Suggested: R  {event.suggestedDonation || "0"}</span>
                        </div>
                        <div className="detail-item">
                          <Info size={16} />
                          <span>{event.isPublic ? "Public" : "Private"}</span>
                        </div>
                      </div>

                      {(user.role === "host" && isUpcoming(event.date)) && (
                        <div className="action-buttons">
                          <div className="edit-delete-actions">
                            <button
                              className="btn btn-outline"
                              onClick={() => handleEditEvent(event)}
                              disabled={isDeleting === event._id}
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleDeleteEvent(event._id)}
                              disabled={isDeleting === event._id}
                            >
                              <Trash2 size={16} />
                              {isDeleting === event._id ? "Deleting..." : "Delete"}
                            </button>
                          </div>

                          <div className="primary-actions">
                            <button
                              className="btn btn-primary"
                              onClick={() => navigate("/story-capture", { state: { eventId: event._id } })}
                            >
                              <Eye size={16} />
                              Story Capture
                            </button>
                            <button className="btn btn-secondary" onClick={() => handleInvite(event)}>
                              <UserPlus size={16} />
                              Invite
                            </button>
                          </div>

                          <div className="secondary-actions">
                            <button
                              className="btn btn-outline"
                              onClick={() => navigate("/start-voting", { state: { eventId: event._id } })}
                            >
                              <Vote size={16} />
                              Start Voting
                            </button>
                            <button
                              className="btn btn-outline"
                              onClick={() => navigate("/voting-result", { state: { eventId: event._id } })}
                            >
                              <BarChart3 size={16} />
                              Results
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {draftEvents.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalEvents)} of {pagination.totalEvents} events
              </div>
              <nav aria-label="Page navigation">
                <ul className="pagination">
                  <li className={`page-item ${pagination.currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChange(pagination.currentPage - 1)}>
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: pagination.totalPages }, (_, i) => (
                    <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? "active" : ""}`}>
                      <button className="page-link" onClick={() => handlePageChange(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.currentPage === pagination.totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChange(pagination.currentPage + 1)}>
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>

        <EventEditModal
          show={showEditModal}
          onHide={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
        />

        <DeleteConfirmationModal
          show={showDeleteModal}
          onHide={() => {
            setShowDeleteModal(false);
            setEventIdToDelete(null);
          }}
          onConfirm={confirmDeleteEvent}
        />

        <InviteModal
          show={showInviteModal}
          onHide={() => setShowInviteModal(false)}
          event={selectedEvent}
        />
      </div>

      <style jsx>{`
        .events-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 2rem;
        }

        .page-header {
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content {
          max-width: 1300px;
          margin: 0 auto;
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }

        .page-subtitle {
          font-size: 1.125rem;
          color: #64748b;
          margin: 0;
        }

        .events-content {
          max-width: 1300px;
          margin: 0 auto;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #5144A1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          color: #64748b;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        .empty-state p {
          color: #64748b;
          margin: 0;
        }

        .events-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .event-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
          min-width: 0;
        }

        .event-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .event-card.past-event {
          opacity: 0.8;
          background: #f8fafc;
        }

        .card-header {
          position: relative;
        }

        .image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .event-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .event-card:hover .event-image {
          transform: scale(1.05);
        }

        .placeholder-image {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .event-status {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .draft-status {
          background: #5144A1;
        }

        .card-body {
          padding: 1.5rem;
        }

        .event-title-section {
          margin-bottom: 1rem;
        }

        .event-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          line-height: 1.4;
        }

        .event-details {
          margin-bottom: 1.5rem;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .detail-item svg {
          color: #5144A1;
          flex-shrink: 0;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .edit-delete-actions {
          display: flex;
          gap: 0.5rem;
        }

        .primary-actions {
          display: flex;
          gap: 0.5rem;
        }

        .secondary-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          flex: 1;
          min-height: 44px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #5144A1;
          color: white;
        }

        .btn-primary:hover {
          background: #453b8c;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #64748b;
          color: white;
        }

        .btn-secondary:hover {
          background: #475569;
          transform: translateY(-1px);
        }

        .btn-outline {
          background: transparent;
          color: #5144A1;
          border: 1px solid #5144A1;
        }

        .btn-outline:hover {
          background: #5144A1;
          color: white;
          transform: translateY(-1px);
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background: #b91c1c;
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 500px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .invite-modal {
          width: 600px;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .modal-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: rgb(151, 153, 156);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .event-details h6 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 1rem 0;
        }

        .event-info {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .event-info p {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          color: #64748b;
        }

        .event-info p:last-child {
          margin-bottom: 0;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-control:focus {
          outline: none;
          border-color: #5144A1;
          box-shadow: 0 0 0 3px rgba(81, 68, 161, 0.1);
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          background: #f8fafc;
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .alert-danger {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .pagination-container {
          margin-top: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .pagination-info {
          font-size: 0.875rem;
          color: #64748b;
        }

        .pagination {
          display: flex;
          gap: 0.5rem;
          margin: 0;
        }

        .page-item {
          display: flex;
        }

        .page-item.disabled .page-link {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .page-item.active .page-link {
          background: #5144A1;
          color: white;
          border-color: #5144A1;
        }

        .page-link {
          padding: 0.5rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #5144A1;
          background: white;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .page-link:hover:not(.disabled) {
          background: #5144A1;
          color: white;
          border-color: #5144A1;
        }

        @media (max-width: 1200px) {
          .events-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .events-container {
            padding: 1rem;
          }

          .page-title {
            font-size: 2rem;
          }

          .events-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .event-card {
            margin: 0;
          }

          .card-body {
            padding: 1rem;
          }

          .edit-delete-actions,
          .primary-actions,
          .secondary-actions {
            flex-direction: column;
          }

          .btn {
            flex: none;
          }

          .modal-content {
            width: 95vw;
            margin: 1rem;
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding: 1rem;
          }

          .pagination-container {
            flex-direction: column;
            align-items: center;
          }
        }

        @media (max-width: 480px) {
          .event-title-section {
            margin-bottom: 0.75rem;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default DraftEventsPage;