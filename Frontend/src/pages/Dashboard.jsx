import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { api } from '../utils/api';
import { BookLoader } from "react-awesome-loaders";

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
      } else {
        response = await api.createEvent(eventPayload);
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
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-neutral-200">
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-neutral-800 shadow-xl rounded-lg border border-white/10">
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
                  }
                  .react-calendar__tile {
                    color: #e5e7eb !important;
                    padding: 1em 0.5em !important;
                    position: relative !important;
                    border-radius: 0.75rem !important;
                    transition: all 0.2s ease-in-out !important;
                  }
                  .react-calendar__tile:enabled:hover,
                  .react-calendar__tile:enabled:focus {
                    background: rgba(138, 129, 124, 0.2) !important;
                    color: #ffffff !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 12px rgba(138, 129, 124, 0.2) !important;
                  }
                  .react-calendar__tile--now {
                    background: rgba(138, 129, 124, 0.1) !important;
                    border: 1px solid rgba(138, 129, 124, 0.3) !important;
                  }
                  .react-calendar__tile--active {
                    background: #8A817C !important;
                    color: white !important;
                    border-radius: 0.75rem !important;
                  }
                  .react-calendar__tile--active:enabled:hover,
                  .react-calendar__tile--active:enabled:focus {
                    background: #8A817C !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 12px rgba(138, 129, 124, 0.3) !important;
                  }
                  .react-calendar__navigation button:enabled:hover,
                  .react-calendar__navigation button:enabled:focus {
                    background-color: rgba(138, 129, 124, 0.2) !important;
                    transform: translateY(-1px) !important;
                  }
                  .react-calendar__year-view__months__month {
                    padding: 0.75em 0.5em !important;
                    width: auto !important;
                    flex-basis: 25% !important;
                  }
                  .react-calendar__month-view__days__day--weekend {
                    color: #E07A5F !important;
                  }
                  .react-calendar__month-view__days__day--weekend:enabled:hover,
                  .react-calendar__month-view__days__day--weekend:enabled:focus {
                    background: rgba(224, 122, 95, 0.2) !important;
                    color: #E07A5F !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 12px rgba(224, 122, 95, 0.2) !important;
                  }
                  .react-calendar__navigation button[disabled] {
                    opacity: 0.5 !important;
                    background-color: transparent !important;
                  }
                  .react-calendar__month-view__weekdays__weekday {
                    color: #9ca3af !important;
                    font-weight: 500 !important;
                    padding: 0.5rem !important;
                    text-decoration: none !important;
                  }
                  .react-calendar__month-view__weekdays__weekday abbr {
                    text-decoration: none !important;
                    font-weight: 500 !important;
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
                value={date}
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
                onClick={() => {
                  setEventData(prev => ({ ...prev, date: date }));
                  setShowEventModal(true);
                }}
                className="mt-4 bg-neutral-700 text-neutral-200 py-3.5 rounded-lg text-[0.95rem] font-medium cursor-pointer transition-all duration-300 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                Add Event
              </button>
            </div>
          </div>

          {/* Upcoming Events Section */}
          <div className="bg-neutral-800 shadow-xl rounded-lg border border-white/10">
            <div className="p-8 relative">
              <h2 className="text-2xl font-bold mb-6 text-neutral-200">
                Upcoming Events
              </h2>
              
              <div className="min-h-[200px] relative">
                {(eventsLoading || deleteLoading) ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-800/50 backdrop-blur-sm animate-fadeIn rounded-lg">
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
                          className="bg-neutral-700/50 p-6 rounded-lg border border-white/10 hover:border-[#8A817C]/50 transition-all duration-300 group hover:shadow-lg hover:shadow-black/20"
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
          <div className="bg-neutral-800 shadow-xl rounded-lg border border-white/10">
            <div className="p-8 relative h-full">
              <h2 className="text-2xl font-bold mb-6 text-neutral-200">
                Completed Events
              </h2>
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 top-0 left-0 right-0 bottom-0 bg-neutral-900/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                <div className="text-2xl font-bold mb-2 text-neutral-200">
                  Coming Soon
                </div>
                <p className="text-neutral-400 text-center px-4">
                  Meeting summaries and recordings will be available here
                </p>
              </div>
              {/* Placeholder Content */}
              <div className="space-y-4 opacity-30 min-h-[300px]">
                <div className="bg-neutral-700/50 p-6 rounded-lg border border-white/10">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-800 rounded-lg p-8 w-full max-w-md border border-white/10">
            <h2 className="text-2xl font-bold mb-6 text-neutral-200">
              {isEditing ? 'Edit Event' : 'Create New Event'}
            </h2>
            <form onSubmit={handleEventSubmit} className="space-y-6">
              {error && (
                <div className="text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Title</label>
                <input
                  type="text"
                  className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
                  value={eventData.title}
                  onChange={(e) => setEventData({...eventData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Date</label>
                <input
                  type="date"
                  className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
                  value={eventData.date.toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Time</label>
                <input
                  type="time"
                  className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
                  value={eventData.time}
                  onChange={(e) => setEventData({...eventData, time: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Meeting Link</label>
                <input
                  type="url"
                  className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
                  value={eventData.meetingLink}
                  onChange={(e) => setEventData({...eventData, meetingLink: e.target.value})}
                  placeholder="https://meet.google.com/..."
                  required
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  className="mt-4 bg-neutral-700 text-neutral-200 py-3.5 rounded-lg text-[0.95rem] font-medium cursor-pointer transition-all duration-300 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="mt-4 bg-neutral-700 text-neutral-200 py-3.5 rounded-lg text-[0.95rem] font-medium cursor-pointer transition-all duration-300 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                >
                  Cancel
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