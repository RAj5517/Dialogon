import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { api } from '../utils/api';
import { BookLoader } from "react-awesome-loaders";
import axios from 'axios';
import FancyButton from '../components/ui/FancyButton/FancyButton';

const Dashboard = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventData, setEventData] = useState({
    title: '',
    date: new Date(),
    time: '',
    meetingLink: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [userData, setUserData] = useState(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [manualJoinLink, setManualJoinLink] = useState('');
  const [showManualJoinModal, setShowManualJoinModal] = useState(false);
  
  // Notification system
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const notificationTimeoutRef = useRef(null);

  // Show notification function
  const showNotification = (message, type = 'success') => {
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    // Set the notification
    setNotification({ show: true, message, type });
    
    // Set a timeout to hide the notification
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Fetch events when component mounts
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.email) {
      fetchEvents(user.email);
    }
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      // Fetch user data
      api.getUserData(user.id)
        .then(data => setUserData(data))
        .catch(err => console.error('Error fetching user data:', err));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const handleEditClick = (event, index) => {
    setEditingEvent({ ...event, index });
    setEventData({
      title: event.title,
      date: new Date(event.date),
      time: event.time,
      meetingLink: event.meeting_link
    });
    setShowEventModal(true);
    setIsEditing(true);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate the date and time
      const eventDateTime = new Date(`${eventData.date.toISOString().split('T')[0]} ${eventData.time}`);
      const now = new Date();
      
      if (eventDateTime < now) {
        throw new Error('Cannot create events in the past');
      }

      const user = JSON.parse(localStorage.getItem('user'));
      const adjustedDate = new Date(eventData.date.getTime() - eventData.date.getTimezoneOffset() * 60000);
      
      // Additional date validation
      if (adjustedDate.getMonth() !== eventData.date.getMonth()) {
        throw new Error('Invalid date for selected month');
      }

      const eventPayload = {
        title: eventData.title,
        date: adjustedDate.toISOString().split('T')[0],
        time: eventData.time,
        meeting_link: eventData.meetingLink,
        user_email: user.email
      };

      let response;
      if (isEditing && editingEvent !== null) {
        response = await api.updateEvent(user.email, editingEvent.index, eventPayload);
        showNotification(`Event "${eventData.title}" updated successfully`, 'success');
      } else {
        response = await api.createEvent(eventPayload);
        showNotification(`Event "${eventData.title}" created successfully`, 'success');
      }

      setEvents(response.events);
      setShowEventModal(false);
      setEventData({
        title: '',
        date: new Date(),
        time: '',
        meetingLink: '',
      });
      setIsEditing(false);
      setEditingEvent(null);
      
    } catch (err) {
      console.error('Error saving event:', err);
      setError(err.message || 'Failed to save event');
      showNotification(err.message || 'Failed to save event', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (email) => {
    setEventsLoading(true);
    try {
      const events = await api.getUserEvents(email);
      setEvents(events);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
      showNotification('Failed to load events', 'error');
    } finally {
      setTimeout(() => {
        setEventsLoading(false);
      }, 800); // Add small delay for smooth transition
    }
  };

  // Add this helper function at the top of your component
  const sortEventsByDate = (events) => {
    return [...events].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA - dateB;
    });
  };

  // Add this function to handle event deletion
  const handleDeleteEvent = async (event, index) => {
    try {
      setDeleteLoading(true); // Show the BookLoader
      const user = JSON.parse(localStorage.getItem('user'));
      await api.deleteEvent(user.email, index);
      await fetchEvents(user.email);
      showNotification(`Event "${event.title}" deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
      showNotification('Failed to delete event', 'error');
    } finally {
      setTimeout(() => {
        setDeleteLoading(false);
      }, 800);
    }
  };

  // Update the date change handler
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setEventData(prev => ({
        ...prev,
        date: newDate
      }));
      setError('');
    } else {
      setError('Invalid date selected');
    }
  };

  // Add this function to handle manual meeting joining
  const handleManualJoin = async (meetingLink) => {
    try {
      setLoading(true);
      console.log('Sending request to join meeting:', meetingLink); // Debug log
      const response = await axios.post('http://localhost:8000/api/auth/manual-join/', {
        meeting_link: meetingLink,
        user_name: 'Dialogon Assistant'
      });
      
      console.log('Server response:', response.data); // Debug log
      showNotification(response.data.message || 'Meeting assistant launched successfully!', 'success');
    } catch (error) {
      console.error('Error launching meeting assistant:', error.response?.data || error);
      showNotification(error.response?.data?.message || 'Failed to launch meeting assistant. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add this function to handle manual join submission
  const handleManualJoinSubmit = async (e) => {
    e.preventDefault();
    if (!manualJoinLink) {
      showNotification('Please enter a meeting link', 'warning');
      return;
    }
    await handleManualJoin(manualJoinLink);
    setShowManualJoinModal(false);
    setManualJoinLink('');
  };

  // Reset event data function
  const resetEventData = () => {
    setEventData({
      title: '',
      date: new Date(),
      time: '',
      meetingLink: '',
    });
    setIsEditing(false);
    setEditingEvent(null);
    setError('');
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowEventModal(false);
    setDate(null);
    resetEventData();
  };

  // Handle Add Event button click
  const handleAddEventClick = () => {
    setEventData(prev => ({ ...prev, date: date || new Date() }));
    setShowEventModal(true);
  };

  return (
    <div className="min-h-screen bg-black bg-grid-small-black/[0.1] dark:bg-grid-small-white/[0.1] text-neutral-200">
      {/* Notification Component */}
      {notification.show && (
        <div 
          className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg animate-slideInRight ${
            notification.type === 'success' ? 'bg-green-500/20 border border-green-500/20 text-green-400' :
            notification.type === 'error' ? 'bg-red-500/20 border border-red-500/20 text-red-400' :
            'bg-yellow-500/20 border border-yellow-500/20 text-yellow-400'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : notification.type === 'error' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
            <p>{notification.message}</p>
            <button 
              onClick={() => setNotification({ ...notification, show: false })}
              className="ml-4 text-current hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Add css for animations */}
      <style>
        {`
          @keyframes slideInRight {
            0% {
              opacity: 0;
              transform: translateX(100px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-slideInRight {
            animation: slideInRight 0.3s ease-out forwards;
          }

          @keyframes scaleIn {
            0% {
              opacity: 0;
              transform: scale(0.95) translateY(-10px);
            }
            60% {
              transform: scale(1.02);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .animate-scaleIn {
            animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes fadeIn {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
        `}
      </style>

      {/* Navbar */}
      <nav className="bg-neutral-800/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-2xl font-bold text-neutral-200">
              Dialogon
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/10 border border-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Add Manual Join Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <FancyButton
          onClick={() => setShowManualJoinModal(true)}
          className="bg-blue-600"
        >
          Launch Agent Manually
        </FancyButton>
      </div>

      {/* Manual Join Modal */}
      {showManualJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900/95 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-neutral-700/50 backdrop-blur-xl ring-1 ring-white/10 animate-scaleIn">
            <h2 className="text-2xl font-bold mb-6 text-neutral-200 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              Join Meeting Manually
            </h2>
            <form onSubmit={handleManualJoinSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-neutral-400">
                  Meeting Link
                </label>
                <input
                  type="text"
                  value={manualJoinLink}
                  onChange={(e) => setManualJoinLink(e.target.value)}
                  placeholder="Enter meeting link"
                  className="w-full px-4 py-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 placeholder-neutral-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualJoinModal(false)}
                  className="px-4 py-2.5 bg-red-500/20 text-red-400 rounded-xl font-medium transition-all duration-200 hover:bg-red-500/30 border border-red-500/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl font-medium transition-all duration-200 hover:bg-indigo-500/30 border border-indigo-500/20 flex items-center gap-2"
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {loading ? 'Launching...' : 'Launch Assistant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-neutral-900 shadow-xl rounded-lg border border-neutral-800">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-neutral-200">
                Calendar
              </h2>
              <style>
                {`
                  .react-calendar {
                    background: transparent !important;
                    border: none !important;
                    font-family: inherit !important;
                    width: 100% !important;
                  }
                  .react-calendar__tile {
                    color: #94a3b8 !important;
                    padding: 1em 0.5em !important;
                    position: relative !important;
                    border-radius: 0.75rem !important;
                    transition: all 0.2s ease-in-out !important;
                  }
                  .react-calendar__tile:enabled:hover,
                  .react-calendar__tile:enabled:focus {
                    background: rgba(99, 102, 241, 0.1) !important;
                    color: #818cf8 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1) !important;
                  }
                  .react-calendar__tile--now {
                    background: rgba(99, 102, 241, 0.1) !important;
                    border: 1px solid rgba(99, 102, 241, 0.3) !important;
                    color: #818cf8 !important;
                  }
                  .react-calendar__tile--active {
                    background: rgba(99, 102, 241, 0.2) !important;
                    color: #818cf8 !important;
                    border-radius: 0.75rem !important;
                    border: 1px solid rgba(99, 102, 241, 0.3) !important;
                  }
                  .react-calendar__tile--active:enabled:hover,
                  .react-calendar__tile--active:enabled:focus {
                    background: rgba(99, 102, 241, 0.3) !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2) !important;
                  }
                  .react-calendar__navigation button {
                    color: #94a3b8 !important;
                    min-width: 44px !important;
                    background: none !important;
                    font-family: inherit !important;
                    padding: 0.5rem !important;
                    border-radius: 0.75rem !important;
                    transition: all 0.2s ease-in-out !important;
                  }
                  .react-calendar__navigation button:enabled:hover,
                  .react-calendar__navigation button:enabled:focus {
                    background-color: rgba(99, 102, 241, 0.1) !important;
                    color: #818cf8 !important;
                    transform: translateY(-1px) !important;
                  }
                  .react-calendar__month-view__weekdays__weekday {
                    color: #64748b !important;
                    font-weight: 500 !important;
                    padding: 0.5rem !important;
                    text-decoration: none !important;
                  }
                  .react-calendar__month-view__weekdays__weekday abbr {
                    text-decoration: none !important;
                    font-weight: 500 !important;
                  }
                  .react-calendar__month-view__days__day--weekend {
                    color: #f87171 !important;
                  }
                  .react-calendar__month-view__days__day--weekend:enabled:hover,
                  .react-calendar__month-view__days__day--weekend:enabled:focus {
                    background: rgba(248, 113, 113, 0.1) !important;
                    color: #f87171 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 12px rgba(248, 113, 113, 0.1) !important;
                  }
                  .react-calendar__navigation button[disabled] {
                    opacity: 0.3 !important;
                    cursor: not-allowed !important;
                  }
                  .react-calendar__tile:disabled {
                    opacity: 0.3 !important;
                    cursor: not-allowed !important;
                    background: transparent !important;
                  }
                  .react-calendar__month-view__days__day--neighboringMonth {
                    color: #475569 !important;
                  }
                `}
              </style>
              <Calendar 
                onChange={(newDate) => {
                  const adjustedDate = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000);
                  setDate(adjustedDate);
                  if (!showEventModal) {
                    setEventData(prev => ({
                      ...prev,
                      date: adjustedDate
                    }));
                    setShowEventModal(true);
                  } else {
                    setEventData(prev => ({
                      ...prev,
                      date: adjustedDate
                    }));
                  }
                }}
                value={showEventModal ? date : null}
                className="w-full bg-transparent text-gray-100"
                tileClassName="hover:bg-indigo-500/10 rounded-lg text-center p-2"
                navigationLabel={({ date }) => (
                  <span className="text-neutral-200 text-lg font-medium">
                    {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                )}
                prevLabel={<span className="text-neutral-200 text-xl font-medium hover:text-[#8A817C] transition-colors">&lt;</span>}
                nextLabel={<span className="text-neutral-200 text-xl font-medium hover:text-[#8A817C] transition-colors">&gt;</span>}
                showNeighboringMonth={false}
              />
              <button
                onClick={handleAddEventClick}
                className="mt-4 bg-indigo-500/20 text-indigo-400 py-3.5 rounded-xl text-[0.95rem] font-medium cursor-pointer transition-all duration-300 hover:bg-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed w-full border border-indigo-500/20 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Event
              </button>
            </div>
          </div>

          {/* Upcoming Events Section */}
          <div className="bg-neutral-900 shadow-xl rounded-lg border border-neutral-800">
            <div className="p-8 relative">
              <h2 className="text-2xl font-bold mb-6 text-neutral-200">
                Upcoming Events
              </h2>
              
              <div className="min-h-[200px] relative">
                {(eventsLoading || deleteLoading) ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/70 backdrop-blur-sm animate-fadeIn rounded-lg">
                    <div className="animate-scaleIn">
                      <BookLoader 
                        background={"transparent"}
                        desktopSize={"80px"}
                        mobileSize={"40px"}
                        textColor={"#6366F1"}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 animate-fadeIn">
                    {sortEventsByDate(events
                      .filter(event => {
                        const eventDateTime = new Date(`${event.date} ${event.time}`);
                        const now = new Date();
                        return eventDateTime > now;
                      }))
                      .map((event, index) => (
                        <div 
                          key={index} 
                          className="bg-neutral-800 p-6 rounded-lg border border-neutral-700 hover:border-neutral-600 transition-all duration-300 group hover:shadow-lg hover:shadow-black/20"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg group-hover:text-blue-400 transition-colors truncate">
                                {event.title}
                              </h3>
                              <p className="text-gray-400 mt-2">
                                {new Date(event.date).toLocaleDateString('en-US', { 
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-gray-400">
                                {event.time}
                              </p>
                              
                              {/* Add status indicator */}
                              <div className="mt-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  event.status === 'joined' ? 'bg-green-500/20 text-green-400' :
                                  event.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {event.status === 'joined' ? 'In Progress' :
                                   event.status === 'completed' ? 'Completed' :
                                   'Scheduled'}
                                </span>
                              </div>
                              
                              <div className="mt-3 flex gap-2">
                                {/* Join Meeting Button */}
                                <a 
                                  href={event.meeting_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Join Meeting
                                </a>
                                
                                {/* Launch Assistant Button */}
                                <button
                                  onClick={() => handleManualJoin(event.meeting_link)}
                                  className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={loading}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Launch Assistant
                                </button>
                              </div>
                              
                              <div className="mt-2 flex items-center gap-4">
                                <button
                                  onClick={() => handleEditClick(event, index)}
                                  className="mt-4 bg-neutral-700 text-neutral-200 py-2 px-4 rounded-lg text-[0.95rem] font-medium cursor-pointer transition-all duration-300 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-4 w-4" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                                    />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event, index)}
                                  className="mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 px-4 rounded-lg text-[0.95rem] font-medium cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1 border border-red-500/20"
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-4 w-4" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                    />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs whitespace-nowrap">
                              {new Date(`2000-01-01 ${event.time}`).toLocaleTimeString('en-US', { 
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    {events.filter(event => new Date(`${event.date} ${event.time}`) > new Date()).length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-neutral-400">No upcoming events</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Completed Events Section */}
          <div className="bg-neutral-900 shadow-xl rounded-lg border border-neutral-800">
            <div className="p-8 relative h-full">
              <h2 className="text-2xl font-bold mb-6 text-neutral-200">
                Completed Events
              </h2>
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 top-0 left-0 right-0 bottom-0 bg-neutral-900/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                <div className="text-2xl font-bold mb-2 text-neutral-200">
                  Coming Soon
                </div>
                <p className="text-neutral-400 text-center px-4">
                  Meeting summaries and recordings will be available here
                </p>
              </div>
              {/* Placeholder Content */}
              <div className="space-y-4 opacity-30 min-h-[300px]">
                <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-neutral-200">
                        Sample Completed Event
                      </h3>
                      <p className="text-neutral-400 mt-2">
                        Meeting Summary
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-neutral-500">• Discussion point 1</p>
                        <p className="text-neutral-500">• Discussion point 2</p>
                        <p className="text-neutral-500">• Discussion point 3</p>
                      </div>
                      <button 
                        className="text-neutral-400 mt-3 opacity-50 cursor-not-allowed"
                        disabled
                      >
                        View Recording
                      </button>
                    </div>
                    <span className="px-3 py-1 bg-neutral-600/20 text-neutral-400 rounded-full text-sm">
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900/95 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-neutral-700/50 backdrop-blur-xl ring-1 ring-white/10 animate-scaleIn">
            <h2 className="text-2xl font-bold mb-6 text-neutral-200 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {isEditing ? 'Edit Event' : 'Create New Event'}
            </h2>
            <form onSubmit={handleEventSubmit} className="space-y-6">
              {error && (
                <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-400">Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 placeholder-neutral-500"
                  value={eventData.title}
                  onChange={(e) => setEventData({...eventData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-400">Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 placeholder-neutral-500"
                  value={eventData.date.toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-400">Time</label>
                <input
                  type="time"
                  className="w-full px-4 py-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 placeholder-neutral-500"
                  value={eventData.time}
                  onChange={(e) => setEventData({...eventData, time: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-400">Meeting Link</label>
                <input
                  type="url"
                  className="w-full px-4 py-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 placeholder-neutral-500"
                  value={eventData.meetingLink}
                  onChange={(e) => setEventData({...eventData, meetingLink: e.target.value})}
                  placeholder="Enter meeting link"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2.5 bg-red-500/20 text-red-400 rounded-xl font-medium transition-all duration-200 hover:bg-red-500/30 border border-red-500/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl font-medium transition-all duration-200 hover:bg-indigo-500/30 border border-indigo-500/20 flex items-center gap-2"
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userData && (
        <div>
          <h2>Welcome {userData.username}</h2>
          <p>Bio: {userData.user_data?.bio}</p>
          <p>Last Login: {userData.user_data?.last_login}</p>
          {/* Add other user data fields */}
        </div>
      )}
    </div>
  );
};

export default Dashboard;