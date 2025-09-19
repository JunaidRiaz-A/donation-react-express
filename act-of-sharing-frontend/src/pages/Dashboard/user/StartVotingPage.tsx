"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../../api/axiosInstance";

interface Story {
  _id: string; 
  title: string;
  description: string;
  recipient: {
    name: string;
    categoryOfNeed: string;
    story: string;
    fundsUsage: string;
  };
}

const StartVotingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const eventId = location.state?.eventId; 
  const [voterEmail, setVoterEmail] = useState<string>("");
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string>("");
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState<boolean>(true);

  
  useEffect(() => {
    if (!eventId) {
      toast.error("No event selected. Please go back and select an event.");
      navigate("/dashboard/my-events");
      return;
    }

    const fetchStories = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL;
        const url = `${baseUrl}/events/${eventId}/stories`;
        const response = await axiosInstance.get(url);

        if (response.status === 200 && Array.isArray(response.data)) {
          
          const fetchedStories = response.data.map((story: any) => ({
            _id: story._id, 
            title: story.title || "Untitled Story",
            description: story.description || "No description available",
            recipient: {
              name: story.recipient?.name || "Unknown",
              categoryOfNeed: story.recipient?.categoryOfNeed || "",
              story: story.recipient?.story || "",
              fundsUsage: story.recipient?.fundsUsage || "",
            },
          }));
          setStories(fetchedStories);
        } else {
          throw new Error("Failed to fetch stories");
        }
      } catch (error: any) {
        console.error("Error fetching stories:", error.response ? error.response.data : error.message);
        toast.error("Failed to load stories. Please try again.");
      } finally {
        setLoadingStories(false);
      }
    };

    fetchStories();
  }, [eventId, navigate]);

  const validateEmail = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!voterEmail) {
      setEmailError("Email is required");
      return false;
    } else if (!emailRegex.test(voterEmail)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail() || !selectedStoryId) {
      toast.error("Please provide a valid email and select a story");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      const url = `${baseUrl}/events/votes`; 

      const payload = {
        eventId,
        storyId: selectedStoryId,
        voterEmail,
      };

      console.log("Sending payload:", payload); 

      const response = await axiosInstance.post(url, payload);

      if (response.status === 201) {
        toast.success("Vote submitted successfully!");
        navigate("/dashboard/my-events");
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error: any) {
      console.error("Error submitting vote:", error.response ? error.response.data : error.message);
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to submit vote. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <div className="voting-container">
        <div className="voting-wrapper">
          <div className="voting-card">
            <div className="card-header">
              <h1 className="card-title">Start Voting</h1>
              <p className="card-subtitle">Select a story and provide your email to cast your vote</p>
            </div>

            <form onSubmit={handleVote} className="voting-form">
              <div className="form-section">
                <div className="input-group">
                  <label htmlFor="voterEmail" className="input-label">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="voterEmail"
                    value={voterEmail}
                    onChange={(e) => setVoterEmail(e.target.value)}
                    className={`form-input ${emailError ? "error" : ""}`}
                    placeholder="Enter your email address"
                  />
                  {emailError && <div className="error-message">{emailError}</div>}
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h2 className="section-title">Select a Story</h2>
                  <div className="request-counter">{stories.length} stories available</div>
                </div>
                <div className="requests-container">
                  <div className="requests-grid">
                    {loadingStories ? (
                      <div className="loading-text">Loading stories...</div>
                    ) : stories.length > 0 ? (
                      stories.map((story) => (
                        <div
                          key={story._id}
                          className={`request-card ${selectedStoryId === story._id ? "selected" : ""}`}
                          onClick={() => setSelectedStoryId(story._id)}
                        >
                          <div className="request-content">
                            <div className="request-header">
                              <h3 className="request-title">{story.title}</h3>
                              <div className="radio-wrapper">
                                <input
                                  type="radio"
                                  name="story"
                                  value={story._id}
                                  checked={selectedStoryId === story._id}
                                  onChange={() => setSelectedStoryId(story._id)}
                                  className="radio-input"
                                />
                                <div className="radio-custom"></div>
                              </div>
                            </div>
                            <p className="request-description">{story.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-requests-text">No stories available for this event.</div>
                    )}
                  </div>
                  {stories.length > 3 && (
                    <div className="scroll-indicator">
                      <div className="scroll-text">Scroll to see more stories</div>
                      <div className="scroll-arrow">↓</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="donate-button" disabled={!voterEmail || !selectedStoryId || loadingStories}>
                  <span>Vote</span>
                  <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .voting-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%);
          padding: 2rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .voting-wrapper {
          width: 100%;
          max-width: 600px;
        }

        .voting-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(81, 68, 161, 0.1), 0 10px 10px -5px rgba(81, 68, 161, 0.04);
          overflow: hidden;
          border: 1px solid rgba(81, 68, 161, 0.08);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .card-header {
          background: linear-gradient(135deg, #5144A1 0%, #6B5CE7 100%);
          color: white;
          padding: 2rem;
          text-align: center;
          flex-shrink: 0;
        }

        .card-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }

        .card-subtitle {
          font-size: 1rem;
          opacity: 0.9;
          margin: 0;
          font-weight: 400;
        }

        .voting-form {
          padding: 2rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section:last-child {
          margin-bottom: 0;
        }

        .form-section:nth-child(2) {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .input-group {
          position: relative;
        }

        .input-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .required {
          color: #EF4444;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #E5E7EB;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: white;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #5144A1;
          box-shadow: 0 0 0 3px rgba(81, 68, 161, 0.1);
        }

        .form-input.error {
          border-color: #EF4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .error-message {
          color: #EF4444;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          font-weight: 500;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-shrink: 0;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1F2937;
          margin: 0;
        }

        .request-counter {
          font-size: 0.875rem;
          color: #6B7280;
          background: #F3F4F6;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-weight: 500;
        }

        .requests-container {
          flex: 1;
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid #E5E7EB;
        }

        .requests-grid {
          height: 400px;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          scroll-behavior: smooth;
        }

        .requests-grid::-webkit-scrollbar {
          width: 6px;
        }

        .requests-grid::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 3px;
        }

        .requests-grid::-webkit-scrollbar-thumb {
          background: #5144A1;
          border-radius: 3px;
        }

        .requests-grid::-webkit-scrollbar-thumb:hover {
          background: #4338CA;
        }

        .loading-text,
        .no-requests-text {
          text-align: center;
          color: #6B7280;
          font-size: 1rem;
          padding: 1rem;
        }

        .request-card {
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
          position: relative;
          flex-shrink: 0;
        }

        .request-card:hover {
          border-color: #5144A1;
          box-shadow: 0 4px 12px rgba(81, 68, 161, 0.15);
          transform: translateY(-1px);
        }

        .request-card.selected {
          border-color: #5144A1;
          background: linear-gradient(135deg, rgba(81, 68, 161, 0.05) 0%, rgba(107, 92, 231, 0.05) 100%);
          box-shadow: 0 4px 12px rgba(81, 68, 161, 0.15);
        }

        .request-content {
          width: 100%;
        }

        .request-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .request-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1F2937;
          margin: 0;
          flex: 1;
          line-height: 1.4;
        }

        .request-description {
          color: #6B7280;
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0;
        }

        .radio-wrapper {
          position: relative;
          margin-left: 1rem;
          flex-shrink: 0;
        }

        .radio-input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .radio-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #D1D5DB;
          border-radius: 50%;
          background: white;
          transition: all 0.2s ease;
          position: relative;
        }

        .radio-custom::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #5144A1;
          transition: transform 0.2s ease;
        }

        .request-card.selected .radio-custom {
          border-color: #5144A1;
        }

        .request-card.selected .radio-custom::after {
          transform: translate(-50%, -50%) scale(1);
        }

        .scroll-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(255, 255, 255, 0.95));
          padding: 1rem;
          text-align: center;
          pointer-events: none;
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        .requests-grid::-webkit-scrollbar-thumb:active ~ .scroll-indicator,
        .requests-grid:hover ~ .scroll-indicator {
          opacity: 0.5;
        }

        .scroll-text {
          font-size: 0.75rem;
          color: #6B7280;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .scroll-arrow {
          font-size: 1rem;
          color: #5144A1;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-4px);
          }
          60% {
            transform: translateY(-2px);
          }
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 2rem;
          flex-shrink: 0;
        }

        .donate-button {
          background: linear-gradient(135deg, #5144A1 0%, #6B5CE7 100%);
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(81, 68, 161, 0.3);
        }

        .donate-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(81, 68, 161, 0.4);
        }

        .donate-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .donate-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 4px 12px rgba(81, 68, 161, 0.2);
        }

        .button-icon {
          width: 16px;
          height: 16px;
        }

        @media (max-width: 640px) {
          .voting-container {
            padding: 1rem;
          }

          .card-header {
            padding: 1.5rem;
          }

          .card-title {
            font-size: 1.75rem;
          }

          .voting-form {
            padding: 1.5rem;
          }

          .requests-grid {
            height: 300px;
          }

          .request-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .radio-wrapper {
            margin-left: 0;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </>
  );
};

export default StartVotingPage;