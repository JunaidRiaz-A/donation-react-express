"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../../api/axiosInstance";

interface StoryFormData {
  title: string;
  description: string;
  recipient: {
    name: string;
    categoryOfNeed: string;
    story: string;
    fundsUsage: string;
  };
}

interface ErrorState {
  title?: string;
  description?: string;
  recipient?: {
    name?: string;
    categoryOfNeed?: string;
    story?: string;
    fundsUsage?: string;
  };
}

const StoryCapturePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const eventId = location.state?.eventId; // Retrieve eventId from state
  const [formData, setFormData] = useState<StoryFormData>({
    title: "",
    description: "",
    recipient: {
      name: "",
      categoryOfNeed: "",
      story: "",
      fundsUsage: "",
    },
  });
  const [errors, setErrors] = useState<ErrorState>({
    recipient: {},
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<1 | 2>(1);
  const [section1Complete, setSection1Complete] = useState<boolean>(false);
  const [section2Complete, setSection2Complete] = useState<boolean>(false);

  // Check if section 1 is complete
  useEffect(() => {
    const isSection1Complete = formData.title.trim() !== "" && formData.description.trim() !== "";
    setSection1Complete(isSection1Complete);
  }, [formData.title, formData.description]);

  // Check if section 2 is complete
  useEffect(() => {
    const { name, categoryOfNeed, story, fundsUsage } = formData.recipient;
    const isSection2Complete = name.trim() !== "" && categoryOfNeed.trim() !== "" && story.trim() !== "" && fundsUsage.trim() !== "";
    setSection2Complete(isSection2Complete);
  }, [formData.recipient]);

  // Validate eventId on component mount
  useEffect(() => {
    if (!eventId) {
      toast.error("No event selected. Please go back and select an event.");
      navigate("/dashboard/my-events");
    }
  }, [eventId, navigate]);

  const validateForm = (): ErrorState => {
    const newErrors: ErrorState = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.recipient.name.trim()) newErrors.recipient = { ...newErrors.recipient, name: "Recipient name is required" };
    if (!formData.recipient.categoryOfNeed.trim()) newErrors.recipient = { ...newErrors.recipient, categoryOfNeed: "Category of need is required" };
    if (!formData.recipient.story.trim()) newErrors.recipient = { ...newErrors.recipient, story: "Story is required" };
    if (!formData.recipient.fundsUsage.trim()) newErrors.recipient = { ...newErrors.recipient, fundsUsage: "Funds usage is required" };
    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("recipient.")) {
      const fieldName = name.split(".")[1]; // Extract the field name (e.g., "name", "story")
      setFormData((prev) => ({
        ...prev,
        recipient: { ...prev.recipient, [fieldName]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => {
      const updatedErrors = { ...prev };
      if (name.startsWith("recipient.")) {
        const fieldName = name.split(".")[1];
        if (updatedErrors.recipient) {
          updatedErrors.recipient = { ...updatedErrors.recipient, [fieldName]: "" };
        } else {
          updatedErrors.recipient = { [fieldName]: "" };
        }
      } else {
        updatedErrors[name as keyof ErrorState] = "";
      }
      return updatedErrors;
    });
  };

  const handleNextSection = () => {
    if (!section1Complete) {
      setErrors({
        ...(formData.title.trim() ? {} : { title: "Title is required" }),
        ...(formData.description.trim() ? {} : { description: "Description is required" }),
      });
      return;
    }
    setActiveSection(2);
  };

  const handlePrevSection = () => {
    setActiveSection(1);
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL ; // Use env variable or fallback
      const url = `${baseUrl}/events/stories`;

      const payload = {
        eventId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        nominator: formData.recipient.name.trim(), // Assuming nominator is the same as recipient name for simplicity
        recipient: {
          name: formData.recipient.name.trim(),
          categoryOfNeed: formData.recipient.categoryOfNeed.trim(),
          story: formData.recipient.story.trim(),
          fundsUsage: formData.recipient.fundsUsage.trim(),
        },
      };

      console.log("Sending payload:", payload); // Debug log to verify payload

      const response = await axiosInstance.post(url, payload);

      if (response.status === 201 || response.status === 200) {
        toast.success("Story submitted successfully!");
        navigate("/dashboard/my-events");
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error: any) {
      console.error("Error submitting story:", error.response ? error.response.data : error.message);
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to submit story. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="story-container">
        <div className="story-wrapper">
          <div className="story-card">
            <div className="card-header">
              <h1 className="card-title">Story Capture System</h1>
              <p className="card-subtitle">Share a meaningful story to help someone in need</p>

              <div className="progress-container">
                <div className="progress-steps">
                  <div
                    className={`progress-step ${activeSection === 1 ? "active" : ""} ${section1Complete ? "completed" : ""}`}
                    onClick={() => setActiveSection(1)}
                  >
                    <div className="step-content">
                      <div className="step-label">Basic Info</div>
                      <div className="step-number">1</div>
                    </div>
                  </div>
                  <div className="progress-line">
                    <div className={`progress-line-inner ${section1Complete ? "completed" : ""}`}></div>
                  </div>
                  <div
                    className={`progress-step ${activeSection === 2 ? "active" : ""} ${section2Complete ? "completed" : ""}`}
                    onClick={() => section1Complete && setActiveSection(2)}
                  >
                    <div className="step-content">
                      <div className="step-label">Story Details</div>
                      <div className="step-number">2</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="story-form">
              {activeSection === 1 && (
                <div className="form-section section-1">
                  <h2 className="section-title">Basic Information</h2>

                  <div className="input-group">
                    <label htmlFor="title" className="input-label">
                      Story Title <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`form-input ${errors.title ? "error" : ""}`}
                      placeholder="Enter a compelling title for your story"
                      disabled={loading}
                    />
                    {errors.title && <div className="error-message">{errors.title}</div>}
                  </div>

                  <div className="input-group">
                    <label htmlFor="description" className="input-label">
                      Brief Description <span className="required">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className={`form-textarea ${errors.description ? "error" : ""}`}
                      rows={4}
                      placeholder="Provide a brief overview of the story"
                      disabled={loading}
                    />
                    {errors.description && <div className="error-message">{errors.description}</div>}
                  </div>

                  <div className="form-actions">
                    <button type="button" className="next-button" onClick={handleNextSection} disabled={loading}>
                      <span>Continue to Story Details</span>
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
                </div>
              )}

              {activeSection === 2 && (
                <div className="form-section section-2">
                  <div className="recipient-section">
                    <h2 className="section-title">Recipient Information</h2>

                    <div className="input-group">
                      <label htmlFor="recipient.name" className="input-label">
                        Recipient Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="recipient.name"
                        name="recipient.name"
                        value={formData.recipient.name}
                        onChange={handleInputChange}
                        className={`form-input ${errors.recipient?.name ? "error" : ""}`}
                        placeholder="Individual or family name"
                        disabled={loading}
                      />
                      {errors.recipient?.name && <div className="error-message">{errors.recipient.name}</div>}
                    </div>
                  </div>

                  <div className="story-details-section">
                    <h2 className="section-title">Story Details</h2>

                    <div className="input-group">
                      <label htmlFor="recipient.story" className="input-label">
                        Full Story <span className="required">*</span>
                      </label>
                      <textarea
                        id="recipient.story"
                        name="recipient.story"
                        value={formData.recipient.story}
                        onChange={handleInputChange}
                        className={`form-textarea large ${errors.recipient?.story ? "error" : ""}`}
                        rows={6}
                        placeholder="Share the complete story about why this person or family needs support. Be detailed and heartfelt."
                        disabled={loading}
                      />
                      {errors.recipient?.story && <div className="error-message">{errors.recipient.story}</div>}
                    </div>

                    <div className="input-group">
                      <label htmlFor="recipient.fundsUsage" className="input-label">
                        How Funds Will Be Used <span className="required">*</span>
                      </label>
                      <textarea
                        id="recipient.fundsUsage"
                        name="recipient.fundsUsage"
                        value={formData.recipient.fundsUsage}
                        onChange={handleInputChange}
                        className={`form-textarea ${errors.recipient?.fundsUsage ? "error" : ""}`}
                        rows={4}
                        placeholder="Explain specifically how the donated funds will help the recipient"
                        disabled={loading}
                      />
                      {errors.recipient?.fundsUsage && <div className="error-message">{errors.recipient.fundsUsage}</div>}
                    </div>

                    <div className="input-group">
                      <label htmlFor="recipient.categoryOfNeed" className="input-label">
                        Category of Need <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="recipient.categoryOfNeed"
                        name="recipient.categoryOfNeed"
                        value={formData.recipient.categoryOfNeed}
                        onChange={handleInputChange}
                        className={`form-input ${errors.recipient?.categoryOfNeed ? "error" : ""}`}
                        placeholder="Enter category (e.g., Education)"
                        disabled={loading}
                      />
                      {errors.recipient?.categoryOfNeed && <div className="error-message">{errors.recipient.categoryOfNeed}</div>}
                    </div>
                  </div>

                  <div className="form-actions two-buttons">
                    <button type="button" className="back-button" onClick={handlePrevSection} disabled={loading}>
                      <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 17l-5-5m0 0l5-5m-5 5h12"
                        />
                      </svg>
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      className="submit-button"
                      disabled={loading || !section1Complete || !section2Complete}
                      onClick={handleSubmit}
                    >
                      {loading ? (
                        <>
                          <div className="loading-spinner"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Story</span>
                          <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .story-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%);
          padding: 2rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .story-wrapper {
          width: 100%;
          max-width: 700px;
        }

        .story-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(81, 68, 161, 0.1), 0 10px 10px -5px rgba(81, 68, 161, 0.04);
          overflow: hidden;
          border: 1px solid rgba(81, 68, 161, 0.08);
        }

        .card-header {
          background: linear-gradient(135deg, #5144A1 0%, #6B5CE7 100%);
          color: white;
          padding: 2.5rem 2rem 2rem;
          text-align: center;
        }

        .card-title {
          font-size: 2.25rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }

        .card-subtitle {
          font-size: 1.125rem;
          opacity: 0.9;
          margin: 0 0 2rem 0;
          font-weight: 400;
        }

        .progress-container {
          margin-top: 1.5rem;
        }

        .progress-steps {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 400px;
          margin: 0 auto;
          position: relative;
        }

        .progress-step {
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 2;
          position: relative;
        }

        .step-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .step-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
          white-space: nowrap;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.125rem;
          transition: all 0.2s ease;
        }

        .progress-step.completed .step-number {
          background: #4ADE80;
          border-color: #4ADE80;
          color: white;
        }

        .progress-step.active .step-number {
          background: white;
          border-color: white;
          color: #5144A1;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.3);
        }

        .progress-line {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 3px;
          background: rgba(255, 255, 255, 0.2);
          z-index: 1;
          margin-top: 20px;
        }

        .progress-line-inner {
          height: 100%;
          width: 0%;
          background: white;
          transition: width 0.3s ease;
        }

        .progress-line-inner.completed {
          width: 100%;
        }

        .story-form {
          padding: 2.5rem;
        }

        .form-section {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .section-title {
          font-size: 1.375rem;
          font-weight: 600;
          color: #1F2937;
          margin: 0 0 1.5rem 0;
        }

        .recipient-section,
        .story-details-section {
          margin-bottom: 2rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-group:last-child {
          margin-bottom: 0;
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
          padding: 1rem;
          border: 2px solid #E5E7EB;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: white;
          box-sizing: border-box;
          font-family: inherit;
        }

        .form-textarea {
          width: 100%;
          padding: 1rem;
          border: 2px solid #E5E7EB;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: white;
          box-sizing: border-box;
          font-family: inherit;
          resize: vertical;
          min-height: 120px;
        }

        .form-textarea.large {
          min-height: 160px;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #5144A1;
          box-shadow: 0 0 0 3px rgba(81, 68, 161, 0.1);
        }

        .form-input.error,
        .form-textarea.error {
          border-color: #EF4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .form-input:disabled,
        .form-textarea:disabled {
          background-color: #F9FAFB;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .error-message {
          color: #EF4444;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .error-message::before {
          content: "⚠";
          font-size: 0.75rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .form-actions.two-buttons {
          justify-content: space-between;
        }

        .next-button,
        .submit-button,
        .back-button {
          background: linear-gradient(135deg, #5144A1 0%, #6B5CE7 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
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

        .back-button {
          background: #F3F4F6;
          color: #4B5563;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .next-button:hover:not(:disabled),
        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(81, 68, 161, 0.4);
        }

        .back-button:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #E5E7EB;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
        }

        .next-button:active:not(:disabled),
        .submit-button:active:not(:disabled),
        .back-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .next-button:disabled,
        .submit-button:disabled,
        .back-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .button-icon {
          width: 16px;
          height: 16px;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .story-container {
            padding: 1rem;
          }

          .card-header {
            padding: 2rem 1.5rem 1.5rem;
          }

          .card-title {
            font-size: 1.875rem;
          }

          .card-subtitle {
            font-size: 1rem;
            margin-bottom: 1.5rem;
          }

          .story-form {
            padding: 2rem 1.5rem;
          }

          .section-title {
            font-size: 1.25rem;
          }

          .next-button,
          .submit-button,
          .back-button {
            padding: 0.875rem 1.5rem;
          }

          .progress-line {
            width: 100px;
          }
        }

        @media (max-width: 480px) {
          .card-header {
            padding: 1.5rem 1rem 1.25rem;
          }

          .story-form {
            padding: 1.5rem 1rem;
          }

          .card-title {
            font-size: 1.5rem;
          }

          .step-label {
            font-size: 0.75rem;
          }

          .step-number {
            width: 35px;
            height: 35px;
            font-size: 1rem;
          }

          .progress-line {
            width: 80px;
            margin-top: 17px;
          }

          .next-button,
          .submit-button,
          .back-button {
            padding: 0.75rem 1.25rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </>
  );
};

export default StoryCapturePage;