"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, HandCoins, Plus } from "lucide-react";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import EventCreationForm from "../../../modals/EventCreationForm";
import { useEvent } from "../../../context/EventContext";
import { useAuth } from "../../../context/AuthContext";
import axiosInstance from "../../../api/axiosInstance";
import { toast } from "react-toastify";

interface Event {
  _id: string;
  title: string;
  location: string;
  date: string;
  suggestedDonation: number | null;
  guestCount: number;
  status: string;
  createdAt: string;
  hostId?: { _id: string; firstname: string; lastname: string };
}

interface Contribution {
  _id: string;
  eventId: { _id: string; title: string };
  userId: { firstname: string; lastname: string; email: string };
  amount: number;
  status: string;
  createdAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalEvents: number;
  limit: number;
}

interface Stat {
  id: number;
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

interface User {
  _id?: string;
  firstname?: string;
  lastname?: string;
}

interface TotalGoalResponse {
  totalSuggestedDonation: number;
}

const HostDashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [totalRaised, setTotalRaised] = useState<number>(0);
  const [totalSuggestedDonation, setTotalSuggestedDonation] = useState<number>(0);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalEvents: 0,
    limit: 10,
  });
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);

  const { user } = useAuth();
  const { events, getHostSpecificEvents } = useEvent();
  const navigate = useNavigate();

  const fetchEvents = async (page: number = 1): Promise<void> => {
    if (!user?._id) return;
    setEventsLoading(true);
    try {
      const response = await getHostSpecificEvents(page, pagination.limit);
      const paginationData = response.pagination || {};
      setPagination({
        currentPage: paginationData.currentPage || 1,
        totalPages: paginationData.totalPages || 1,
        totalEvents: paginationData.totalEvents || 0,
        limit: paginationData.limit || 10,
      });
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast.error(error.message || "Failed to fetch events");
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchHostTotalRaised = async (): Promise<void> => {
    try {
      const token: string = localStorage.getItem("token") || "";
      const response = await axiosInstance.get(`/contributions/total-funds`, {
        headers: { "Content-Type": "application/json", "x-auth-token": token },
      });
      const totalFunds = Number(response.data.totalFunds) || 0;
      setTotalRaised(totalFunds);
    } catch (error: any) {
      console.error("Error fetching host external total raised:", error);
      toast.error(error.response?.data?.message || "Failed to fetch external contributions");
      setTotalRaised(0);
    }
  };

  useEffect(() => {
    console.log("HostDashboard mounted, user:", user);
    if (user) {
      fetchHostTotalRaised();
      fetchEvents(pagination.currentPage);
    }
  }, [user, pagination.currentPage]);

  const upcomingEvents = useMemo(() => {
    if (!events?.length) return [];
    return events
      .filter((event: Event) => event.status === "upcoming")
      .sort((a: Event, b: Event) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((event: Event) => ({
        id: event._id,
        name: event.title || "Unnamed Event",
        location: event.location || "Unknown",
        date: new Date(event.date).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        suggestedDonation: event.suggestedDonation !== null ? Number(event.suggestedDonation) : null,
        guests: Number(event.guestCount) || 0,
        status: event.status,
      }));
  }, [events]);

  useEffect(() => {
    const totalItems = upcomingEvents.length;
    const totalPages = Math.ceil(totalItems / pagination.limit);
    setPagination((prev) => ({
      ...prev,
      totalEvents: totalItems,
      totalPages: totalPages || 1,
      currentPage: Math.min(prev.currentPage, totalPages) || 1,
    }));
  }, [upcomingEvents, pagination.limit]);

  const paginatedEvents = upcomingEvents.slice(
    (pagination.currentPage - 1) * pagination.limit,
    pagination.currentPage * pagination.limit
  );

  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const stats: Stat[] = useMemo(() => {
    const totalEvents = events?.length || 0;
    const totalGuests = events?.length
      ? events.reduce((sum: number, event: Event) => sum + (Number(event.guestCount) || 0), 0)
      : 0;
    const totalIndividualSuggestedDonations = events?.length
      ? events.reduce((sum: number, event: Event) => sum + (event.suggestedDonation !== null ? Number(event.suggestedDonation) : 0), 0)
      : 0;

    return [
      { id: 1, title: "Total Events", value: totalEvents, icon: <Calendar size={24} /> },
      { id: 2, title: "Total Guests", value: totalGuests, icon: <Users size={24} /> },
      { id: 3, title: "Total Donations", value: `R ${totalRaised.toLocaleString()}`, icon: <HandCoins size={24} /> },
      { id: 4, title: "Total Suggested Donations", value: `R ${totalIndividualSuggestedDonations.toLocaleString()}`, icon: <HandCoins size={24} /> },
    ];
  }, [events, totalRaised, totalSuggestedDonation]);

  const getUserName = (): string => {
    return user?.firstname && user?.lastname ? `${user.firstname} ${user.lastname}` : "Host";
  };
  const userName: string = getUserName();

  const handleModalClose = (): void => {
    setIsModalOpen(false);
    fetchEvents(pagination.currentPage);
  };

  const renderTableRows = (): JSX.Element => {
    if (eventsLoading) {
      return (
        <tr>
          <td colSpan={6} className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </td>
        </tr>
      );
    }
    if (paginatedEvents.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="text-center py-5">
            <Calendar size={48} className="text-muted mb-3" />
            <h5 className="text-muted">No Upcoming Events</h5>
            <p className="text-muted">You don't have any events scheduled.</p>
            <div className="d-flex flex-column gap-2 align-items-center">
            </div>
          </td>
        </tr>
      );
    }
    return (
      <>
        {paginatedEvents.map((event: any) => (
          <tr key={event.id} className="hover:bg-gray-50">
            <td className="table-cell px-4 py-2 truncate" style={{ width: "20%" }}>{event.name}</td>
            <td className="table-cell px-4 py-2 truncate" style={{ width: "20%" }}>{event.location}</td>
            <td className="table-cell px-4 py-2 truncate" style={{ width: "20%" }}>{event.date}</td>
            <td className="table-cell px-4 py-2" style={{ width: "15%" }}>
              {event.suggestedDonation !== null ? `R ${event.suggestedDonation.toLocaleString()}` : "Not specified"}
            </td>
            <td className="table-cell px-4 py-2" style={{ width: "15%" }}>{event.guests}</td>
            <td className="table-cell px-4 py-2" style={{ width: "10%" }}>{event.status}</td>
          </tr>
        ))}
      </>
    );
  };

  return (
    <DashboardLayout userRole="host" userName={userName}>
      <div className="container-fluid p-4" style={{ width: '100%', overflowX: 'auto' }}>
        <div className="card border-0 bg-primary text-white mb-4 shadow-sm">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between">
              <div className="mb-3 mb-md-0">
                <h2 className="mb-2 text-white text-lg font-semibold">Welcome, {userName}!</h2>
                <p>
                  You have <strong>{upcomingEvents.length}</strong> upcoming events. Your events have raised{" "}
                  <strong>R {totalRaised.toLocaleString()}</strong> from external contributions for charitable causes.
                </p>
              </div>
              <div className="text-md-end d-flex flex-column gap-2">
                <button onClick={() => setIsModalOpen(true)} className="btn btn-light">
                  <Plus size={18} className="me-2" />
                  Host New Event
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          {stats.map((stat: Stat) => (
            <div key={stat.id} className="col-12 col-md-6 col-xl-3">
              <div className="card h-100 border-0 shadow-sm bg-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-primary">{stat.icon}</span>
                  </div>
                  <h3 className="stat-value text-lg font-semibold">{stat.value}</h3>
                  <p className="stat-title text-muted mb-0">{stat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card border-0 shadow-sm mb-4 bg-white">
          <div className="card-header bg-white d-flex flex-column flex-md-row justify-content-between align-items-center">
            <h5 className="card-title mb-0 text-lg font-semibold">Upcoming Events</h5>
            <div className="d-flex gap-2 mt-2 mt-md-0">
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive" style={{ maxHeight: "calc(100vh - 360px)" }}>
              <table className="table-custom w-full text-sm">
                <thead

 className="sticky top-0 bg-primary text-white">
                  <tr>
                    <th className="table-header px-4 py-2" style={{ width: "20%" }}>Event Name</th>
                    <th className="table-header px-4 py-2" style={{ width: "20%" }}>Location</th>
                    <th className="table-header px-4 py-2" style={{ width: "20%" }}>Date</th>
                    <th className="table-header px-4 py-2" style={{ width: "15%" }}>Suggested Donation</th>
                    <th className="table-header px-4 py-2" style={{ width: "15%" }}>Guests</th>
                    <th className="table-header px-4 py-2" style={{ width: "10%" }}>Status</th>
                  </tr>
                </thead>
                <tbody>{renderTableRows()}</tbody>
              </table>
            </div>
            <div className="card-footer bg-white py-3 border-t border-gray-200">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center">
                <div className="mb-2 mb-sm-0 text-sm">
                  Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalEvents)} of {pagination.totalEvents} events
                </div>
                <nav aria-label="Page navigation">
                  <ul className="pagination mb-0 flex space-x-2">
                    <li className={`page-item ${pagination.currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <button className="page-link px-3 py-1 border rounded" onClick={() => handlePageChange(pagination.currentPage - 1)}>
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: pagination.totalPages }, (_, i: number) => (
                      <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? "bg-primary text-white" : "bg-white"} border rounded`}>
                        <button className="page-link px-3 py-1" onClick={() => handlePageChange(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${pagination.currentPage === pagination.totalPages ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <button className="page-link px-3 py-1 border rounded" onClick={() => handlePageChange(pagination.currentPage + 1)}>
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {isModalOpen && <EventCreationForm onClose={handleModalClose} />}
      </div>

      <style jsx>{`
        .table-custom {
          border-collapse: collapse;
          width: 100%;
        }
        .table-header {
          font-weight: 600;
        }
        .table-cell {
          border-bottom: 1px solid #dee2e6;
        }
        .text-primary {
          color: #5144A1;
        }
        .bg-primary {
          background-color: #5144A1;
        }
        .text-muted {
          color: #6c757d;
        }
        @media (max-width: 640px) {
          .table-custom {
            font-size: 0.75rem;
          }
          .table-header, .table-cell {
            padding: 0.5rem;
          }
          .pagination {
            flex-wrap: wrap;
            justify-content: center;
          }
          .page-link {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
          }
          .stat-value {
            font-size: 1.25rem;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .table-custom {
            font-size: 0.875rem;
          }
          .table-header, .table-cell {
            padding: 0.75rem;
          }
          .stat-value {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default HostDashboard;