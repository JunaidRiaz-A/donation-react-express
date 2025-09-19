"use client";

import React, { type ReactNode, useRef, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Heart,
  Home,
  Calendar,
  Users,
  Settings,
  PieChart,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
} from "lucide-react";
import { FcMoneyTransfer } from "react-icons/fc"; // Added money transfer icon
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosInstance";
import "../../styles/dashboard.css";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [draftCount, setDraftCount] = useState(0);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const baseUrl = import.meta.env.VITE_API_URL;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [location.pathname]);

  // Fetch draft count using /events/drafts API
  useEffect(() => {
    const fetchDraftCount = async () => {
      if (user?.id) {
        try {
          const token = localStorage.getItem("token") || "";
          const params = user.role?.toLowerCase() === "host" ? { hostId: user.id } : {};
          const response = await axiosInstance.get(`${baseUrl}/events/drafts`, {
            headers: { "x-auth-token": token },
            params: { page: 1, limit: 50, ...params },
          });
          const draftEvents = response.data.events || [];
          setDraftCount(draftEvents.length);
        } catch (err) {
          console.error("Error fetching draft count:", err);
          setDraftCount(0);
        }
      }
    };

    fetchDraftCount();
  }, [user?.id, user?.role, baseUrl]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        notificationsDropdownRef.current &&
        !notificationsDropdownRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName =
    user?.firstname && user?.lastname
      ? `${user.firstname} ${user.lastname}`
      : "User";
  const userRole =
    (user?.role?.toLowerCase() as "admin" | "host" | "participant") || "host";

  const getNavItems = () => {
    const commonItems = [
      {
        path: `/dashboard/${userRole}`,
        icon: <Home size={20} />,
        label: "Dashboard",
      },
      {
        path: "/dashboard/my-events",
        icon: <Calendar size={20} />,
        label:
          userRole === "participant" || userRole === "admin"
            ? "Events"
            : "My Events",
      },
      {
        path: "/dashboard/profile",
        icon: <User size={20} />,
        label: "Profile",
      },
      {
        path: "/dashboard/contributions",
        icon: <FcMoneyTransfer size={20} />, // Replaced with FcMoneyTransfer icon
        label: "Contributions",
      },
    ].filter(item => userRole !== "participant" || item.label !== "Contributions");

    if (userRole === "admin") {
      return [
        ...commonItems,
        { path: "/dashboard/users", icon: <Users size={20} />, label: "Users" },
        { path: "/dashboard/request-assistance", icon: <Users size={20} />, label: "Request Assistance" },
        { path: "/dashboard/contactus", icon: <Users size={20} />, label: "Contact Us" },
        { path: "/dashboard/stories", icon: <Users size={20} />, label: "Stories" },
      ];
    } else if (userRole === "host") {
      return [
        ...commonItems,
        { path: "/dashboard/draft-events", icon: <Calendar size={20} />, label: `Draft Events`, badge: draftCount },
      ];
    } else {
      return [...commonItems];
    }
  };

  const navItems = getNavItems();

  // Function to scroll to the top of the page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const notifications = [
    {
      id: 1,
      text: "No upcoming events",
      time: new Date().toLocaleTimeString(),
    },
  ];

  return (
    <div className="dashboard-container">
      {sidebarOpen && (
        <div className="sidebar-overlay d-lg-none" onClick={closeSidebar}></div>
      )}

      <div className={`dashboard-sidebar ${sidebarOpen ? "show" : ""}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={scrollToTop}>
            <Heart size={24} className="text-primary me-2" />
            <span>Acts of Sharing</span>
          </Link>
          <button className="sidebar-close d-lg-none" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <h6 className="mb-0">{userName}</h6>
            <span className="user-role">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </div>
        </div>

        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li key={item.path} className="sidebar-item">
              <Link
                to={item.path}
                className={`sidebar-link ${
                  location.pathname === item.path ? "active" : ""
                }`}
                onClick={() => {
                  closeSidebar();
                  scrollToTop();
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="badge badge-purple ms-2">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
          <li className="sidebar-item mt-auto">
            <Link
              to="/"
              className="sidebar-link text-danger"
              onClick={() => {
                closeSidebar();
                logout();
                scrollToTop();
              }}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="menu-toggle d-lg-none" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <h1 className="header-title">
              {navItems.find((item) => item.path === location.pathname)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="header-right">
            <div className="dropdown user-dropdown mr-3 mb-3" ref={userDropdownRef}>
              <button
                className="btn btn-icon user-dropdown-toggle"
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  setNotificationsOpen(false);
                }}
              >
                <div className="user-avatar-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </button>

              <div
                className={`dropdown-menu dropdown-menu-end ${
                  dropdownOpen ? "show" : ""
                }`}
              >
                <div className="dropdown-header">
                  <span>Signed in as</span>
                  <h6 className="mb-0">{userName}</h6>
                </div>
                <Link
                  to="/dashboard/profile"
                  className="dropdown-item"
                  onClick={scrollToTop}
                >
                  <User size={16} className="me-2" />
                  <span>Profile</span>
                </Link>
                <div className="dropdown-divider"></div>
                <Link
                  to="/"
                  className="dropdown-item text-danger"
                  onClick={() => {
                    logout();
                    scrollToTop();
                  }}
                >
                  <LogOut size={16} className="me-2" />
                  <span>Logout</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;