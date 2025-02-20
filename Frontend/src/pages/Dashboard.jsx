import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
// import { eventService } from '../services/api';

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

  // Fetch events when component mounts
  useEffect(() => {
    fetchEvents();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
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
      const adjustedDate = new Date(eventData.date.getTime() - eventData.date.getTimezoneOffset() * 60000);
      const eventPayload = {
        title: eventData.title,
        date: adjustedDate.toISOString().split('T')[0],
        time: eventData.time,
        meeting_link: eventData.meetingLink,
        user_id: localStorage.getItem('userId')
      };

      if (isEditing) {
        // This will be implemented by backend developer
        // PUT request to /api/events/update/
        console.log('Event to be updated:', eventPayload);
        
        // For now, update the event in local state
        setEvents(events.map(event => 
          event === editingEvent ? { ...eventPayload } : event
        ));
      } else {
        // This will be implemented by backend developer
        // POST request to /api/events/create/
        console.log('Event to be created:', eventPayload);
        
        // For now, add to local state
        setEvents([...events, eventPayload]);
      }

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
      setError('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      // This will be implemented by backend developer
      // GET request to /api/events/
      // For now, using mock data matching the MongoDB structure
      const mockEvents = [
        {
          title: "Team Standup",
          date: "2025-02-22",
          time: "10:00 AM",
          meeting_link: "https://zoom.com/meeting123"
        },
        {
          title: "Project Demo",
          date: "2025-02-23",
          time: "3:00 PM",
          meeting_link: "https://meet.google.com/demo123"
        }
      ];
      setEvents(mockEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
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
  const handleDeleteEvent = (eventToDelete) => {
    // This will be implemented by backend developer
    // DELETE request to /api/events/delete/
    console.log('Event to be deleted:', eventToDelete);
    
    // For now, just filter out the event from the local state
    setEvents(events.filter(event => 
      event.date !== eventToDelete.date || 
      event.time !== eventToDelete.time || 
      event.title !== eventToDelete.title
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      {/* Navbar */}
      <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Dialogon
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-600/90 hover:bg-red-700 px-6 py-2 rounded-full font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-600/20"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-700/50">
            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
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
                .react-calendar__year-view__months__month {
                  padding: 0.75em 0.5em !important;
                  width: auto !important;
                  flex-basis: 25% !important;
                }
                .react-calendar__tile:enabled:hover,
                .react-calendar__tile:enabled:focus {
                  background: rgba(59, 130, 246, 0.2) !important;
                  color: #ffffff !important;
                  transform: translateY(-2px) !important;
                  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2) !important;
                }
                .react-calendar__tile--now {
                  background: rgba(59, 130, 246, 0.1) !important;
                  border: 1px solid rgba(59, 130, 246, 0.3) !important;
                }
                .react-calendar__month-view__days__day--weekend {
                  color: #93c5fd !important;
                }
                .react-calendar__month-view__days__day--weekend:enabled:hover,
                .react-calendar__month-view__days__day--weekend:enabled:focus {
                  background: rgba(147, 197, 253, 0.2) !important;
                  color: #ffffff !important;
                  transform: translateY(-2px) !important;
                  box-shadow: 0 4px 12px rgba(147, 197, 253, 0.2) !important;
                }
                .react-calendar__tile--active {
                  background: linear-gradient(to right, rgba(37, 99, 235, 0.8), rgba(147, 51, 234, 0.8)) !important;
                  color: white !important;
                  border-radius: 0.75rem !important;
                }
                .react-calendar__tile--active:enabled:hover,
                .react-calendar__tile--active:enabled:focus {
                  background: linear-gradient(to right, rgba(37, 99, 235, 0.9), rgba(147, 51, 234, 0.9)) !important;
                  transform: translateY(-2px) !important;
                  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3) !important;
                }
                .react-calendar__navigation button {
                  color: #e5e7eb !important;
                  min-width: 44px !important;
                  background: none !important;
                  font-family: inherit !important;
                  padding: 0.5rem !important;
                  border-radius: 0.75rem !important;
                  transition: all 0.2s ease-in-out !important;
                }
                .react-calendar__navigation button:enabled:hover,
                .react-calendar__navigation button:enabled:focus {
                  background-color: rgba(59, 130, 246, 0.2) !important;
                  transform: translateY(-1px) !important;
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
                <span className="text-indigo-400 text-lg">
                  {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
              )}
              prevLabel={<span className="text-indigo-400 text-xl">&lt;</span>}
              nextLabel={<span className="text-indigo-400 text-xl">&gt;</span>}
              showNeighboringMonth={false}
            />
            <button
              onClick={() => {
                setEventData(prev => ({
                  ...prev,
                  date: date
                }));
                setShowEventModal(true);
              }}
              className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-indigo-500/20 border border-white/5"
            >
              Add Event
            </button>
          </div>

          {/* Upcoming Events Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-700/50">
            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Upcoming Events
            </h2>
            <div className="space-y-4">
              {sortEventsByDate(events).map((event, index) => {
                const eventDate = new Date(event.date);
                const isUpcoming = eventDate >= new Date();
                
                if (!isUpcoming) return null;

                return (
                  <div 
                    key={index} 
                    className="bg-gray-700/50 backdrop-blur-sm p-6 rounded-xl border border-gray-600/50 hover:border-blue-500/50 transition-all duration-200 group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg group-hover:text-blue-400 transition-colors truncate">
                          {event.title}
                        </h3>
                        <p className="text-gray-400 mt-2">
                          {eventDate.toLocaleDateString('en-US', { 
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
                            onClick={() => handleEditClick(event)}
                            className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
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
                            onClick={() => handleDeleteEvent(event)}
                            className="text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1"
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
                );
              })}
              {events.filter(event => new Date(event.date) >= new Date()).length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No upcoming events</div>
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Create your first event
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Completed Events Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-700/50">
            <div className="relative">
              <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Completed Events
              </h2>
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text text-2xl font-bold mb-2">
                  Coming Soon
                </div>
                <p className="text-gray-400 text-center px-4">
                  Meeting summaries and recordings will be available here
                </p>
              </div>
              {/* Placeholder Content */}
              <div className="space-y-4 opacity-30">
                <div className="bg-gray-700/50 backdrop-blur-sm p-6 rounded-xl border border-gray-600/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-300">
                        Sample Completed Event
                      </h3>
                      <p className="text-gray-400 mt-2">
                        Meeting Summary
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-gray-500">• Discussion point 1</p>
                        <p className="text-gray-500">• Discussion point 2</p>
                        <p className="text-gray-500">• Discussion point 3</p>
                      </div>
                      <button 
                        className="text-blue-400 mt-3 opacity-50 cursor-not-allowed"
                        disabled
                      >
                        View Recording
                      </button>
                    </div>
                    <span className="px-3 py-1 bg-gray-600/20 text-gray-400 rounded-full text-sm">
                      Completed
                    </span>
                  </div>
                </div>
                <div className="bg-gray-700/50 backdrop-blur-sm p-6 rounded-xl border border-gray-600/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-300">
                        Another Past Event
                      </h3>
                      <p className="text-gray-400 mt-2">
                        Meeting Summary
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-gray-500">• Key decision made</p>
                        <p className="text-gray-500">• Action items assigned</p>
                      </div>
                      <button 
                        className="text-blue-400 mt-3 opacity-50 cursor-not-allowed"
                        disabled
                      >
                        View Recording
                      </button>
                    </div>
                    <span className="px-3 py-1 bg-gray-600/20 text-gray-400 rounded-full text-sm">
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
          <div className="bg-indigo-950/90 rounded-2xl p-8 w-full max-w-md border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
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
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    setEventData(prev => ({
                      ...prev,
                      date: newDate
                    }));
                  }}
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
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-indigo-500/20 border border-white/5"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl transition-all duration-200 border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;