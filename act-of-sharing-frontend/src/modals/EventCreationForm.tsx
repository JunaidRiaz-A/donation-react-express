import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, Clock, MapPin, Users, FileText, Image } from "lucide-react";
import { FcMoneyTransfer } from "react-icons/fc"; // Added money transfer icon
import { useEvent } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

interface EventFormData {
  title: string;
  date: string;
  time: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  guestCount: string;
  suggestedDonation: string;
  description: string;
  eventImage: File | null;
  isPublic: boolean;
}

interface EventCreationFormProps {
  onClose: () => void;
}

const EventCreationForm: React.FC<EventCreationFormProps> = ({ onClose }) => {
  const { createEvent, loading, error } = useEvent();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showEventCreatedModal, setShowEventCreatedModal] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const totalSteps = 2;
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [lastSelectedLocation, setLastSelectedLocation] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    date: "",
    time: "",
    location: "",
    latitude: null,
    longitude: null,
    guestCount: "",
    suggestedDonation: "",
    description: "",
    eventImage: null,
    isPublic: false,
  });
  const [previewUrls, setPreviewUrls] = useState<{ eventImage: string | null }>({
    eventImage: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const MAX_GUESTS = 1000000;
  const MAX_DONATION = 100000000;

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGoogleMapsLoaded(true);
      script.onerror = () => {
        console.error("Failed to load Google Maps script");
        toast.error("Failed to load map services");
      };
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    };

    loadGoogleMapsScript();
  }, []);

  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || !autocompleteRef.current) return;

    const loadGoogleMaps = async () => {
      try {
        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
        const { Autocomplete, AutocompleteService, PlacesService } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

        const mapInstance = new Map(mapRef.current, {
          center: { lat: 0, lng: 0 },
          zoom: 2,
          mapId: "EVENT_CREATION_MAP",
        });
        setMap(mapInstance);

        const autocomplete = new Autocomplete(autocompleteRef.current, {
          fields: ["formatted_address", "geometry", "name"],
          types: ["address"],
        });

        const autoService = new AutocompleteService();
        const placeService = new PlacesService(mapInstance);
        setAutocompleteService(autoService);
        setPlacesService(placeService);

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const location = place.formatted_address || place.name || "";
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            setFormData((prev) => ({
              ...prev,
              location,
              latitude: lat,
              longitude: lng,
            }));
            setErrors((prev) => ({ ...prev, location: "" }));
            setLastSelectedLocation(location);
            setSuggestions([]);

            mapInstance.setCenter({ lat, lng });
            mapInstance.setZoom(15);

            if (marker) marker.setMap(null);
            const newMarker = new AdvancedMarkerElement({
              map: mapInstance,
              position: { lat, lng },
            });
            setMarker(newMarker);
          }
        });
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        toast.error("Failed to load map services");
      }
    };

    loadGoogleMaps();

    return () => {
      if (marker) marker.setMap(null);
    };
  }, [isGoogleMapsLoaded]);

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!map || !event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const formattedAddress = results[0].formatted_address;
        setFormData((prev) => ({
          ...prev,
          location: formattedAddress,
          latitude: lat,
          longitude: lng,
        }));
        setErrors((prev) => ({ ...prev, location: "" }));
        setLastSelectedLocation(formattedAddress);
        setSuggestions([]);

        if (autocompleteRef.current) autocompleteRef.current.value = formattedAddress;

        if (marker) marker.setMap(null);
        const newMarker = new AdvancedMarkerElement({
          map,
          position: { lat, lng },
        });
        setMarker(newMarker);
        map.setCenter({ lat, lng });
        map.setZoom(15);
      }
    });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, location: value }));
    setErrors((prev) => ({ ...prev, location: "" }));

    if (autocompleteService && value) {
      autocompleteService.getPlacePredictions(
        { input: value, types: ["address"] },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (placeId: string) => {
    if (placesService && map) {
      placesService.getDetails({ placeId, fields: ["formatted_address", "geometry"] }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const location = place.formatted_address || "";
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          setFormData((prev) => ({
            ...prev,
            location,
            latitude: lat,
            longitude: lng,
          }));
          setLastSelectedLocation(location);
          setSuggestions([]);

          if (autocompleteRef.current) autocompleteRef.current.value = location;

          map.setCenter({ lat, lng });
          map.setZoom(15);

          if (marker) marker.setMap(null);
          const newMarker = new AdvancedMarkerElement({
            map,
            position: { lat, lng },
          });
          setMarker(newMarker);
        }
      });
    }
  };

  useEffect(() => {
    if (map) {
      map.addListener("click", handleMapClick);
    }
    return () => {
      if (map) google.maps.event.clearListeners(map, "click");
    };
  }, [map, marker]);

  const validateStep = (step: number): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.title) errors.title = "Event title is required";
      if (!formData.date) errors.date = "Date is required";
      if (!formData.time) errors.time = "Time is required";
      if (!formData.location) errors.location = "Location is required";
      if (!formData.guestCount) {
        errors.guestCount = "Max guests is required";
      } else if (
        isNaN(Number(formData.guestCount)) ||
        Number(formData.guestCount) < 2 ||
        Number(formData.guestCount) > MAX_GUESTS
      ) {
        errors.guestCount = `Max guests must be between 2 and ${MAX_GUESTS.toLocaleString()}`;
      }
      if (formData.suggestedDonation) {
        if (
          isNaN(Number(formData.suggestedDonation)) ||
          Number(formData.suggestedDonation) < 25 ||
          Number(formData.suggestedDonation) > MAX_DONATION
        ) {
          errors.suggestedDonation = `Suggested donation must be between 25 and ${MAX_DONATION.toLocaleString()}`;
        }
      }
      if (!formData.description) errors.description = "Description is required";
    }
    return errors;
  };

  const nextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
    } else {
      setErrors({});
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const step1Errors = validateStep(1);
    const allErrors = { ...step1Errors };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }
    if (!isTermsChecked) {
      setErrors((prev) => ({ ...prev, termsCheck: "Please check the box" }));
      return;
    }

    if (!user?.id) {
      setErrors((prev) => ({ ...prev, submit: "User authentication required" }));
      toast.error("Please log in to create an event");
      return;
    }

    const eventData = new FormData();
    eventData.append("title", formData.title);
    eventData.append("description", formData.description);
    eventData.append("date", formData.date);
    eventData.append("time", formData.time);
    eventData.append("location", formData.location);
    eventData.append("latitude", formData.latitude ? formData.latitude.toString() : "");
    eventData.append("longitude", formData.longitude ? formData.longitude.toString() : "");
    eventData.append("guestCount", formData.guestCount);
    eventData.append("suggestedDonation", formData.suggestedDonation || "0");
    eventData.append("isPublic", formData.isPublic.toString());
    eventData.append("isDraft", "false");
    if (formData.eventImage) eventData.append("eventImage", formData.eventImage);

    try {
      await createEvent(eventData);
      toast.success("Event created successfully!");
      setShowEventCreatedModal(true); // Show the event created modal
    } catch (err) {
      console.error("Error creating event:", err);
      setErrors((prev) => ({ ...prev, submit: "Failed to create event" }));
      toast.error("Failed to create event");
    }
  };

  const handleSaveAsDraft = async () => {
    if (!user?.id) {
      toast.error("Please log in to save a draft");
      return;
    }

    const eventData = new FormData();
    eventData.append("title", formData.title || "Untitled Event");
    eventData.append("description", formData.description || "");
    eventData.append("date", formData.date || "");
    eventData.append("time", formData.time || "");
    eventData.append("location", formData.location || "");
    eventData.append("latitude", formData.latitude ? formData.latitude.toString() : "");
    eventData.append("longitude", formData.longitude ? formData.longitude.toString() : "");
    eventData.append("guestCount", formData.guestCount || "");
    eventData.append("suggestedDonation", formData.suggestedDonation || "0");
    eventData.append("isPublic", formData.isPublic.toString());
    eventData.append("isDraft", "true");
    if (formData.eventImage) eventData.append("eventImage", formData.eventImage);

    try {
      await createEvent(eventData);
      toast.success("Event saved as draft successfully!");
      onClose();
    } catch (err) {
      console.error("Error saving draft:", err);
      toast.error("Failed to save draft");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setFormData((prev) => ({ ...prev, eventImage: file }));

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrls((prev) => {
        if (prev.eventImage) URL.revokeObjectURL(prev.eventImage);
        return { ...prev, eventImage: previewUrl };
      });
    } else {
      setPreviewUrls((prev) => {
        if (prev.eventImage) URL.revokeObjectURL(prev.eventImage);
        return { ...prev, eventImage: null };
      });
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrls.eventImage) URL.revokeObjectURL(previewUrls.eventImage);
    };
  }, []);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTermsChecked(e.target.checked);
    if (e.target.checked) {
      setErrors((prev) => ({ ...prev, termsCheck: "" }));
    } else {
      setErrors((prev) => ({ ...prev, termsCheck: "Please check the box" }));
    }
  };

  const handleImagePreview = (imageUrl: string) => {
    if (!imageUrl) return;
    setShowImagePreview(imageUrl);
  };

  const closeImagePreview = () => setShowImagePreview(null);

  const handleCloseWithConfirmation = () => {
    if (
      formData.title ||
      formData.date ||
      formData.time ||
      formData.location ||
      formData.guestCount ||
      formData.suggestedDonation ||
      formData.description ||
      formData.eventImage
    ) {
      setShowDraftModal(true);
    } else {
      onClose();
    }
  };

  const handleDraftModalAction = (action: "save" | "cancel") => {
    setShowDraftModal(false);
    if (action === "save") {
      handleSaveAsDraft();
    } else {
      onClose();
    }
  };

  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("AM");

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setHour(e.target.value);
    updateTime(e.target.value, minute, ampm);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMinute(e.target.value);
    updateTime(hour, e.target.value, ampm);
  };

  const handleAmpmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAmpm(e.target.value);
    updateTime(hour, minute, e.target.value);
  };

  const updateTime = (newHour: string, newMinute: string, newAmpm: string) => {
    if (newHour && newMinute && newAmpm) {
      const timeString = `${newHour.padStart(2, "0")}:${newMinute} ${newAmpm}`;
      setFormData((prev) => ({
        ...prev,
        time: timeString,
      }));
      setErrors((prev) => ({ ...prev, time: "" }));
    }
  };

  const handleEventCreatedModalClose = () => {
    setShowEventCreatedModal(false);
    onClose();
    navigate("/dashboard/my-events"); // Navigate to My Events page
  };

  const handleInviteParticipants = () => {
    setShowEventCreatedModal(false);
    onClose();
    // Assuming an invite page or functionality; adjust the route as needed
    navigate("/invite-participants"); // Navigate to invite participants page
  };

  return (
    <>
      <div
        className="modal"
        tabIndex={-1}
        style={{
          display: "block",
          backgroundColor: "rgba(0,0,0,0.5)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1050,
        }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header" style={{ background: "#ffffff", color: "#000000", borderBottom: "1px solid #dee2e6" }}>
              <h5 className="modal-title">Create New Event</h5>
              <button
                type="button"
                className="btn-close btn-close-black"
                onClick={handleCloseWithConfirmation}
                disabled={loading}
                style={{ filter: "none" }}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-progress mb-4 d-flex justify-content-between align-items-center">
                  {[...Array(totalSteps)].map((_, index) => (
                    <div
                      key={index}
                      className={`progress-step text-center ${
                        currentStep > index + 1 ? "completed" : ""
                      } ${currentStep === index + 1 ? "active" : ""}`}
                      style={{ flex: 1 }}
                    >
                      <div
                        className="progress-circle mx-auto"
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          backgroundColor:
                            currentStep > index + 1
                              ? "#5144A1"
                              : currentStep === index + 1
                              ? "#5144A1"
                              : "#dee2e6",
                          color: currentStep >= index + 1 ? "white" : "#6c757d",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                        }}
                      >
                        {index + 1}
                      </div>
                      <div
                        className="progress-label mt-2"
                        style={{ fontSize: "12px" }}
                      >
                        {index === 0 ? "Event Details" : "Review"}
                      </div>
                      {index < totalSteps - 1 && (
                        <div
                          className="progress-line"
                          style={{
                            position: "absolute",
                            top: "15px",
                            left: "50%",
                            width: "50%",
                            height: "2px",
                            backgroundColor:
                              currentStep > index + 1 ? "#5144A1" : "#dee2e6",
                          }}
                        ></div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-card">
                  {currentStep === 1 && (
                    <div className="form-step">
                      <h2 className="h4 mb-2">Event Details</h2>
                      <p className="text-muted mb-4">
                        Let's set up your meal gathering. Provide details about
                        when and where you'll host.
                      </p>

                      <div className="mb-3">
                        <label htmlFor="title" className="form-label">
                          Event Title <span style={{ color: "red" }}>*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FileText size={18} />
                          </span>
                          <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="form-control"
                            placeholder="Give your event a meaningful name"
                            required
                            disabled={loading}
                          />
                        </div>
                        {errors.title && (
                          <div className="text-danger mt-1">{errors.title}</div>
                        )}
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="date" className="form-label">
                            Date <span style={{ color: "red" }}>*</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <Calendar size={18} />
                            </span>
                            <input
                              type="date"
                              id="date"
                              name="date"
                              value={formData.date}
                              onChange={handleInputChange}
                              className="form-control"
                              required
                              disabled={loading}
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                          {errors.date && (
                            <div className="text-danger mt-1">{errors.date}</div>
                          )}
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="time" className="form-label">
                            Time <span style={{ color: "red" }}>*</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <Clock size={18} />
                            </span>
                            <select
                              id="hour"
                              value={hour}
                              onChange={handleHourChange}
                              className="form-control me-2"
                              style={{ width: "80px" }}
                              required
                              disabled={loading}
                            >
                              <option value="">Hour</option>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                            <select
                              id="minute"
                              value={minute}
                              onChange={handleMinuteChange}
                              className="form-control me-2"
                              style={{ width: "80px" }}
                              required
                              disabled={loading}
                            >
                              <option value="00">00</option>
                              <option value="15">15</option>
                              <option value="30">30</option>
                              <option value="45">45</option>
                            </select>
                            <select
                              id="ampm"
                              value={ampm}
                              onChange={handleAmpmChange}
                              className="form-control"
                              style={{ width: "80px" }}
                              required
                              disabled={loading}
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                          {errors.time && (
                            <div className="text-danger mt-1">{errors.time}</div>
                          )}
                        </div>
                      </div>

                      <div className="mb-3 position-relative">
                        <label htmlFor="location" className="form-label">
                          Location <span style={{ color: "red" }}>*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <MapPin size={18} />
                          </span>
                          <input
                            type="text"
                            id="location"
                            name="location"
                            ref={autocompleteRef}
                            value={formData.location}
                            onChange={handleLocationChange}
                            className="form-control"
                            placeholder="Enter address or click on map"
                            required
                            disabled={loading || !isGoogleMapsLoaded}
                            autoComplete="off"
                          />
                        </div>
                        {errors.location && (
                          <div className="text-danger mt-1">{errors.location}</div>
                        )}
                        <div
                          ref={mapRef}
                          className="position-relative"
                          style={{
                            height: "300px",
                            width: "100%",
                            marginTop: "10px",
                            borderRadius: "4px",
                            border: "1px solid #dee2e6",
                            backgroundColor: isGoogleMapsLoaded ? "transparent" : "#f8f9fa",
                          }}
                        >
                          {!isGoogleMapsLoaded && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                                color: "#6c757d",
                              }}
                            >
                              Loading map...
                            </div>
                          )}
                          {suggestions.length > 0 && (
                            <ul
                              className="suggestions-dropdown"
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: "rgba(255, 255, 255, 0.9)",
                                border: "1px solid #dee2e6",
                                borderRadius: "4px",
                                maxHeight: "100%",
                                overflowY: "auto",
                                zIndex: 1000,
                                listStyle: "none",
                                padding: "10px",
                                margin: 0,
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              }}
                            >
                              {suggestions.map((suggestion) => (
                                <li
                                  key={suggestion.place_id}
                                  onClick={() => handleSuggestionSelect(suggestion.place_id)}
                                  style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #eee",
                                    background: "white",
                                  }}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {suggestion.description}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <small className="text-muted d-block mt-1">
                          Type an address or click on the map to select a location.
                        </small>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="guestCount" className="form-label">
                            Max Guests <span style={{ color: "red" }}>*</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <Users size={18} />
                            </span>
                            <input
                              type="number"
                              id="guestCount"
                              name="guestCount"
                              value={formData.guestCount}
                              onChange={handleInputChange}
                              className="form-control"
                              placeholder="e.g., 12"
                              min="2"
                              max={MAX_GUESTS}
                              required
                              disabled={loading}
                            />
                          </div>
                          {errors.guestCount && (
                            <div className="text-danger mt-1">{errors.guestCount}</div>
                          )}
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="suggestedDonation" className="form-label">
                            Suggested Donation Amount (Per Person)
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <FcMoneyTransfer size={18} /> {/* Replaced DollarSign with FcMoneyTransfer */}
                            </span>
                            <input
                              type="number"
                              id="suggestedDonation"
                              name="suggestedDonation"
                              value={formData.suggestedDonation}
                              onChange={handleInputChange}
                              className="form-control"
                              placeholder="e.g., 500"
                              min="25"
                              max={MAX_DONATION}
                              disabled={loading}
                            />
                          </div>
                          {errors.suggestedDonation && (
                            <div className="text-danger mt-1">{errors.suggestedDonation}</div>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="description" className="form-label">
                          Description <span style={{ color: "red" }}>*</span>
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="form-control"
                          rows={4}
                          placeholder="Tell your guests what to expect at your gathering"
                          required
                          disabled={loading}
                        ></textarea>
                        {errors.description && (
                          <div className="text-danger mt-1">{errors.description}</div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label htmlFor="eventImage" className="form-label">
                          Event Image
                        </label>
                        <div className="input-group" style={{ height: "50px" }}>
                          <span className="input-group-text" style={{ height: "100%" }}>
                            <Image size={18} />
                          </span>
                          <input
                            type="file"
                            id="eventImage"
                            name="eventImage"
                            onChange={handleFileChange}
                            className="form-control"
                            accept="image/*"
                            style={{ height: "100%" }}
                            disabled={loading}
                          />
                          {previewUrls.eventImage && (
                            <span className="input-group-text" style={{ height: "100%" }}>
                              <img
                                src={previewUrls.eventImage}
                                alt="Event preview"
                                style={{
                                  maxWidth: "60px",
                                  maxHeight: "60px",
                                  objectFit: "contain",
                                  cursor: "pointer",
                                  marginLeft: "10px",
                                }}
                                onClick={() => handleImagePreview(previewUrls.eventImage!)}
                              />
                            </span>
                          )}
                        </div>
                        <small className="text-muted d-block mt-1">
                          Upload an image that represents your meal gathering.
                          Recommended size: 1200x800px.
                        </small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Visibility</label>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="isPublic"
                            name="isPublic"
                            checked={formData.isPublic}
                            onChange={handleInputChange}
                            disabled={loading}
                          />
                          <label className="form-check-label" htmlFor="isPublic">
                            Public (Visible to all users)
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="isPrivate"
                            checked={!formData.isPublic}
                            onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: !e.target.checked }))}
                            disabled={loading}
                          />
                          <label className="form-check-label" htmlFor="isPrivate">
                            Private (Visible only to invited guests)
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="form-step">
                      <h2 className="h4 mb-2">Review Your Event</h2>
                      <p className="text-muted mb-4">
                        Please review all details before creating your event.
                      </p>

                      <div className="review-section mb-4">
                        {formData.isDraft && (
                          <div
                            className="draft-banner mb-3"
                            style={{
                              backgroundColor: "#fff3cd",
                              color: "#856404",
                              padding: "10px",
                              border: "1px solid #ffeeba",
                              borderRadius: "4px",
                              textAlign: "center",
                              fontWeight: "bold",
                            }}
                          >
                            Draft
                          </div>
                        )}
                        <h3 className="h5 mb-3">Event Details</h3>
                        <div className="mb-2">
                          <span className="fw-bold">Title:</span>
                          <span className="ms-2">{formData.title}</span>
                        </div>
                        <div className="mb-2">
                          <span className="fw-bold">Date & Time:</span>
                          <span className="ms-2">
                            {formData.date} • {formData.time}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="fw-bold">Location:</span>
                          <span className="ms-2">{formData.location}</span>
                        </div>
                        <div className="mb-2">
                          <span className="fw-bold">Coordinates:</span>
                          <span className="ms-2">
                            {formData.latitude && formData.longitude
                              ? `${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`
                              : "Not specified"}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="fw-bold">Max Guests:</span>
                          <span className="ms-2">{formData.guestCount}</span>
                        </div>
                        <div className="mb-2">
                          <span className="fw-bold">Suggested Donation Amount (Per Person):</span>
                          <span className="ms-2">{formData.suggestedDonation ? `${formData.suggestedDonation}` : "Not specified"}</span> {/* Removed $ symbol */}
                        </div>
                        <div className="mb-2">
                          <span className="fw-bold">Visibility:</span>
                          <span className="ms-2">{formData.isPublic ? "Public" : "Private"}</span>
                        </div>
                        <div className="mb-2">
                          <span className="fw-bold">Description:</span>
                          <span className="ms-2">{formData.description}</span>
                        </div>
                        {previewUrls.eventImage && (
                          <div className="mb-2">
                            <span className="fw-bold">Event Image:</span>
                            <span
                              className="ms-2 text-primary"
                              style={{ cursor: "pointer" }}
                              onClick={() => handleImagePreview(previewUrls.eventImage!)}
                            >
                              View Event Image
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="form-check mb-3">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="termsCheck"
                          checked={isTermsChecked}
                          onChange={handleCheckboxChange}
                          required
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="termsCheck">
                          I confirm that all information is accurate.
                        </label>
                        {errors.termsCheck && (
                          <div className="text-danger mt-2">{errors.termsCheck}</div>
                        )}
                      </div>
                      {errors.submit && (
                        <div className="text-danger mt-2">{errors.submit}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                {currentStep > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={prevStep}
                    disabled={loading}
                  >
                    Back
                  </button>
                )}
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={nextStep}
                    disabled={loading}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !isTermsChecked}
                  >
                    {loading ? (
                      <div className="spinner-border spinner-border-sm text-light" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      "Create Event"
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {showImagePreview && (
        <div
          className="modal"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.8)",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1060,
          }}
          onClick={closeImagePreview}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ background: "transparent", border: "none" }}>
              <div className="modal-header" style={{ border: "none", position: "relative" }}>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeImagePreview}
                  style={{ position: "absolute", top: "10px", right: "10px", zIndex: 1061 }}
                ></button>
              </div>
              <div className="modal-body d-flex justify-content-center align-items-center">
                <img
                  src={showImagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: "90%",
                    maxHeight: "90vh",
                    objectFit: "contain",
                  }}
                  onError={() => console.error("Failed to load image:", showImagePreview)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showDraftModal && (
        <div
          className="modal"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.5)",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1070,
          }}
          onClick={() => setShowDraftModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header" style={{ background: "linear-gradient(135deg, #5144A1 0%, #6B5CE7 100%)", color: "white", borderBottom: "none" }}>
                <h5 className="modal-title">Save Draft</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDraftModal(false)}
                  style={{ filter: "invert(1) grayscale(100%) brightness(200%)" }}
                ></button>
              </div>
              <div className="modal-body">
                <p>Do you want to save this event as a draft or cancel?</p>
              </div>
              <div className="modal-footer" style={{ borderTop: "none", justifyContent: "center" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleDraftModalAction("save")}
                  disabled={loading}
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => handleDraftModalAction("cancel")}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEventCreatedModal && (
        <div className="auth-modal-overlay">
          <div
            className="auth-modal-container"
            style={{ opacity: 1, transform: "translateY(0)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auth-modal-header">
              <div className="auth-modal-logo">
                <Calendar size={24} className="auth-logo-icon" />
                <h2>Event Created</h2>
              </div>
              <button className="auth-close-button" onClick={handleEventCreatedModalClose}>
                <X size={20} />
              </button>
            </div>
            <div className="auth-form">
              <p>
                Your event has been created successfully! Go to your events page to manage it or
                invite participants to donate.
              </p>
              <div className="auth-form-group">
                <button
                  type="button"
                  className="auth-submit-button"
                  onClick={handleEventCreatedModalClose}
                  disabled={loading}
                >
                  Go to My Events
                </button>
                {/* <button
                  type="button"
                  className="auth-link-button mt-3"
                  onClick={handleInviteParticipants}
                  disabled={loading}
                >
                  Invite Participants
                </button> */}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .text-primary { color: #5144A1 !important; }
        .bg-primary { background-color: #5144A1 !important; }
        .text-danger { color: #dc3545 !important; }
        .text-muted { color: #6c757d !important; }
        .form-progress { position: relative; }
        .progress-step { position: relative; }
        .progress-circle { transition: background-color 0.3s; }
        .progress-line { z-index: 0; }
        .progress-label { color: #6c757d; }
        .progress-step.active .progress-label,
        .progress-step.completed .progress-label { color: #5144A1; }
        .review-section-title { border-bottom: 1px solid #dee2e6; padding-bottom: 0.5rem; }
        .review-label { font-weight: 500; color: #495057; }
        .review-value { color: #6c757d; }
        .btn-close-white { filter: invert(1) grayscale(100%) brightness(200%); }
        .btn-close-black { filter: none; }
        .input-group { height: 50px !important; }
        .input-group-text { height: 100% !important; padding: 0.375rem 0.75rem !important; }
        .form-control { height: 100% !important; padding: 0.375rem 0.75rem !important; }
        .input-group img { max-width: 60px !important; max-height: 60px !important; }
        .suggestions-dropdown {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(255, 255, 255, 0.9) !important;
          border: 1px solid #dee2e6 !important;
          border-radius: 4px !important;
          max-height: 100% !important;
          overflow-y: auto !important;
          z-index: 1000 !important;
          list-style: none !important;
          padding: 10px !important;
          margin: 0 !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        .suggestions-dropdown li {
          padding: 8px 12px !important;
          cursor: pointer !important;
          border-bottom: 1px solid #eee !important;
          background: white !important;
        }
        .suggestions-dropdown li:hover {
          background-color: #f8f9fa !important;
        }
        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1080;
        }
        .auth-modal-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          width: 400px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .auth-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .auth-modal-logo {
          display: flex;
          align-items: center;
        }
        .auth-logo-icon {
          margin-right: 10px;
          color: #5144A1;
        }
        .auth-close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #6c757d;
        }
        .auth-form {
          text-align: center;
        }
        .auth-form-group {
          margin-top: 20px;
        }
        .auth-submit-button {
          background-color: #5144A1;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
        }
        .auth-link-button {
          background: none;
          border: none;
          color: #5144A1;
          cursor: pointer;
          text-decoration: underline;
        }
        .auth-submit-button:hover, .auth-link-button:hover {
          opacity: 0.9;
        }
      `}</style>
    </>
  );
};

export default EventCreationForm;