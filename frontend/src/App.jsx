import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import axios from 'axios';
import API from './services/api';

// Authentication & Theme Context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const nextTheme = !prev;
      localStorage.setItem('theme', nextTheme ? 'dark' : 'light');
      return nextTheme;
    });
  };

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, darkMode, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Navigation Header Bar
function Navbar() {
  const { user, logout, darkMode, toggleTheme } = useAuth();
  const navigate = useNavigate();

  return (
      <nav className={`border-b px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white/90 border-gray-200 text-gray-800 shadow-sm'
      }`}>
        {/* Brand Logo & Main Nav Items */}
        <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-4">
          <Link to="/" className="text-xl sm:text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400 hover:opacity-80">
            EventNexus
          </Link>

          <div className="flex items-center gap-3 sm:gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-blue-500 transition">Events</Link>
            {user && user.role === 'user' && (
              <>
                <Link to="/my-bookings" className="hover:text-blue-500 transition">My Bookings</Link>
                <Link to="/profile" className="hover:text-blue-500 transition">Profile</Link>
              </>
            )}
            {user && user.role === 'admin' && (
              <>
                <Link to="/admin" className="text-amber-500 dark:text-amber-400 hover:opacity-80 font-semibold transition">
                  👑 Admin Panel
                </Link>
                <Link to="/profile" className="hover:text-blue-500 transition">Profile</Link>
              </>
            )}
          </div>
        </div>

        {/* Theme Switcher & User Actions */}
        <div className="flex flex-wrap items-center justify-end w-full sm:w-auto gap-3 sm:gap-4">
          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-gray-100 border-gray-300 text-slate-800 hover:bg-gray-200'
            }`}
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>

          {user ? (
            <div className={`flex items-center gap-3 sm:gap-4 border-l pl-3 sm:pl-6 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
              <div className="text-right max-w-[120px] sm:max-w-none truncate">
                <p className={`text-xs font-normal ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Signed in as</p>
                <p className="text-xs sm:text-sm font-semibold truncate">{user.name} ({user.role})</p>
              </div>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm border transition ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
              }`}>
                Sign In
              </Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shadow-lg shadow-blue-600/30">
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>
    );
}

// Payment Modal Component (Supports OTP Authentication & Dynamic Theme)
function PaymentModal({ isOpen, onClose, amount, eventTitle, onPaymentSuccess }) {
  const { darkMode } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [wallet, setWallet] = useState('MobiKwik');
  const [step, setStep] = useState('select');
  const [otp, setOtp] = useState('');
  const [processing, setProcessing] = useState(false);
  const [otpError, setOtpError] = useState('');

  if (!isOpen) return null;

  const handleProceedToOtp = () => {
    setStep('otp');
    setOtpError('');
  };

  const handleVerifyOtp = () => {
    if (otp !== '123456') {
      setOtpError('Invalid OTP/PIN. Enter 123456 for test demo.');
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep('select');
      setOtp('');
      onPaymentSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className={`border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-colors duration-300 ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center text-white">
          <div>
            <h3 className="font-bold text-lg">Razorpay Secure Gateway</h3>
            <p className="text-xs text-blue-100">{eventTitle}</p>
          </div>
          <span className="text-2xl font-black">${amount}</span>
        </div>

        <div className="p-6 space-y-5">
          {step === 'select' ? (
            <>
              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Select Payment Method</p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedMethod('upi')}
                  className={`p-3 rounded-xl border text-xs font-medium transition ${
                    selectedMethod === 'upi'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-500 dark:text-blue-300'
                      : darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-700/50' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  📱 UPI / QR
                </button>
                <button
                  onClick={() => setSelectedMethod('wallet')}
                  className={`p-3 rounded-xl border text-xs font-medium transition ${
                    selectedMethod === 'wallet'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-500 dark:text-blue-300'
                      : darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-700/50' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  👛 Wallets
                </button>
                <button
                  onClick={() => setSelectedMethod('card')}
                  className={`p-3 rounded-xl border text-xs font-medium transition ${
                    selectedMethod === 'card'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-500 dark:text-blue-300'
                      : darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-700/50' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  💳 Card
                </button>
              </div>

              {selectedMethod === 'upi' && (
                <div className={`p-4 rounded-xl border space-y-2 ${darkMode ? 'bg-slate-900/80 border-slate-700/80' : 'bg-gray-50 border-gray-200'}`}>
                  <label className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Virtual Payment Address (VPA)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Supports GPay, PhonePe, Paytm, BHIM</p>
                </div>
              )}

              {selectedMethod === 'wallet' && (
                <div className={`p-4 rounded-xl border space-y-2 ${darkMode ? 'bg-slate-900/80 border-slate-700/80' : 'bg-gray-50 border-gray-200'}`}>
                  <label className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Select Digital Wallet</label>
                  <select
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="MobiKwik">MobiKwik Wallet</option>
                    <option value="Freecharge">Freecharge</option>
                    <option value="Paytm Wallet">Paytm Wallet</option>
                    <option value="Airtel Money">Airtel Money</option>
                  </select>
                </div>
              )}

              {selectedMethod === 'card' && (
                <div className={`p-4 rounded-xl border space-y-1 text-xs ${darkMode ? 'bg-slate-900/80 border-slate-700/80 text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                  <p>Test Card: <span className="text-blue-500 font-mono font-bold">4111 1111 1111 1111</span></p>
                  <p>Expiry: <span className="text-blue-500 font-mono font-bold">12/28</span> | CVV: <span className="text-blue-500 font-mono font-bold">123</span></p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className={`w-1/3 py-3 rounded-xl text-sm font-medium transition ${
                    darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToOtp}
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-bold transition shadow-lg shadow-emerald-600/20"
                >
                  Proceed to Pay
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={`p-5 rounded-xl border space-y-3 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs font-bold text-center ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>3D-Secure Two-Factor Auth</p>
                <p className={`text-[11px] text-center ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Enter your payment PIN or OTP to authorize charge</p>
                <input
                  type="password"
                  placeholder="Enter OTP (123456)"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-center text-xl tracking-widest focus:outline-none focus:border-blue-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                {otpError && <p className="text-xs text-red-500 text-center">{otpError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('select')}
                  disabled={processing}
                  className={`w-1/3 py-3 rounded-xl text-sm font-medium transition ${
                    darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={processing}
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-bold transition flex justify-center items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {processing ? (
                    <>
                      <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                      Verifying...
                    </>
                  ) : (
                    'Submit OTP & Pay'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Event Search, Filter & List Dashboard
function EventList() {
  const { darkMode } = useAuth();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    API.get('/events')
      .then((res) => setEvents(res.data))
      .catch(() => {});
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || e.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className={`flex flex-col md:flex-row gap-4 justify-between items-center p-4 rounded-2xl border backdrop-blur transition-colors ${
        darkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white/80 border-gray-200 shadow-sm'
      }`}>
        <input
          type="text"
          placeholder="Search events by title or venue..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`border px-4 py-2.5 rounded-xl w-full md:w-96 focus:outline-none focus:border-blue-500 transition text-sm ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
          }`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`border px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition text-sm w-full md:w-auto ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
          }`}
        >
          <option value="All">All Categories</option>
          <option value="Technology">Technology</option>
          <option value="Music">Music</option>
          <option value="Business">Business</option>
        </select>
      </div>

      {filteredEvents.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${
          darkMode ? 'text-slate-400 bg-slate-800/30 border-slate-800' : 'text-gray-500 bg-white border-gray-200'
        }`}>
          <p className="text-lg">No events found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <div key={evt.id} className={`border rounded-2xl overflow-hidden transition duration-300 shadow-xl flex flex-col justify-between ${
              darkMode ? 'bg-slate-800 border-slate-700/80 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-500'
            }`}>
              <div>
                <div className="relative">
                  <img src={evt.image_url} alt={evt.title} className="w-full h-48 object-cover" />
                  <span className={`absolute top-3 left-3 text-xs backdrop-blur border px-3 py-1 rounded-full font-semibold ${
                    darkMode ? 'bg-slate-900/80 text-blue-300 border-blue-500/30' : 'bg-white/90 text-blue-600 border-blue-200 shadow-sm'
                  }`}>
                    {evt.category}
                  </span>
                </div>
                <div className="p-5 space-y-2">
                  <h3 className={`text-lg font-bold line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{evt.title}</h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>📍 {evt.venue}</p>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>📅 {evt.date}</p>
                </div>
              </div>
              <div className="p-5 pt-0">
                <div className={`flex justify-between items-center pt-4 border-t ${darkMode ? 'border-slate-700/60' : 'border-gray-100'}`}>
                  <span className="text-xl font-extrabold text-emerald-500">${evt.ticket_price}</span>
                  <Link
                    to={`/events/${evt.id}`}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                  >
                    View Details & Book
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Single Event Details Page
function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, darkMode } = useAuth();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState(1);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    API.get(`/events/${id}`)
      .then((res) => setEvent(res.data))
      .catch(() => setError('Failed to load event details.'));
  }, [id]);

  const handleOpenGateway = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setMsg('');
    setError('');
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setIsModalOpen(false);
    try {
      await API.post('/bookings', {
        event_id: event.id,
        tickets: tickets,
      });
      setMsg('🎉 Payment Verified & Booking Confirmed!');
      setEvent((prev) => ({
        ...prev,
        available_seats: prev.available_seats - tickets,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed.');
    }
  };

  if (!event) return <div className={`p-12 text-center ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Loading event information...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        amount={tickets * event.ticket_price}
        eventTitle={event.title}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <div className={`border rounded-2xl overflow-hidden shadow-2xl transition-colors ${
        darkMode ? 'bg-slate-800 border-slate-700/80' : 'bg-white border-gray-200'
      }`}>
        <img src={event.image_url} alt={event.title} className="w-full h-72 object-cover" />
        <div className="p-8 space-y-6">
          <div>
            <span className={`text-xs border px-3 py-1 rounded-full font-semibold ${
              darkMode ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              {event.category}
            </span>
            <h1 className={`text-3xl font-extrabold mt-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{event.title}</h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Organizer: <span className="font-semibold">{event.organizer}</span></p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border text-sm ${
            darkMode ? 'bg-slate-900/60 border-slate-700/60' : 'bg-gray-50 border-gray-200'
          }`}>
            <div><p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>📍 Venue</p><p className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>{event.venue}</p></div>
            <div><p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>📅 Date & Time</p><p className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>{event.date}</p></div>
            <div><p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>⏳ Seats Left</p><p className="font-semibold text-emerald-500">{event.available_seats}</p></div>
          </div>

          <div className={`border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4 ${darkMode ? 'border-slate-700/60' : 'border-gray-200'}`}>
            <div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Price per ticket</p>
              <p className="text-3xl font-extrabold text-emerald-500">${event.ticket_price}</p>
            </div>
            <div className="flex items-center gap-4">
              <label className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Tickets:</label>
              <input
                type="number"
                min="1"
                max={event.available_seats || 10}
                value={tickets}
                onChange={(e) => setTickets(parseInt(e.target.value) || 1)}
                className={`border px-3 py-2 rounded-xl w-20 text-center focus:outline-none focus:border-blue-500 ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
              <button
                onClick={handleOpenGateway}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-emerald-600/30"
              >
                Pay & Book Now (${tickets * event.ticket_price})
              </button>
            </div>
          </div>

          {msg && <div className="p-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-xl text-center font-semibold">{msg}</div>}
          {error && <div className="p-4 bg-red-500/20 text-red-400 border border-red-500/50 rounded-xl text-center font-semibold">{error}</div>}
        </div>
      </div>
    </div>
  );
}

// User Bookings View with Cancellation and Download Functionality
function MyBookings() {
  const { darkMode } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchBookings = () => {
    API.get('/bookings/my')
      .then((res) => setBookings(res.data))
      .catch(() => setError('Failed to load bookings.'));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
  const confirmCancel = window.confirm(
    "⚠️ Are you sure you want to cancel this booking?\n\nNote: As per our policy, cancelled bookings are non-refundable."
  );

  if (!confirmCancel) return;

  try {
    await API.delete(`/bookings/${bookingId}`);
    // Refresh your bookings state here
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    setMessage("Booking cancelled successfully.");
  } catch (err) {
    setMessage("Failed to cancel booking.");
  }
};

  const handleDownloadConfirmation = (booking) => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>Booking Confirmation - ${booking.event_title}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .card { border: 2px solid #2563eb; padding: 24px; border-radius: 12px; max-width: 500px; margin: auto; }
            h2 { color: #2563eb; margin-top: 0; }
            .row { display: flex; justify-space-between; margin-bottom: 8px; }
            .label { font-weight: bold; }
            .footer { margin-top: 24px; font-size: 12px; color: #777; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>EventNexus Confirmation</h2>
            <hr />
            <p><span class="label">Booking ID:</span> #${booking.id}</p>
            <p><span class="label">Event:</span> ${booking.event_title}</p>
            <p><span class="label">Venue:</span> ${booking.venue}</p>
            <p><span class="label">Date:</span> ${booking.event_date}</p>
            <p><span class="label">Tickets:</span> ${booking.tickets}</p>
            <p><span class="label">Total Paid:</span> $${booking.total_amount}</p>
            <p><span class="label">Status:</span> ${booking.status}</p>
            <div class="footer">Thank you for booking with EventNexus!</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Bookings & History</h1>
      {msg && <p className="text-emerald-500 text-sm font-semibold">{msg}</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {bookings.length === 0 ? (
        <div className={`border p-8 rounded-2xl text-center ${
          darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500'
        }`}>
          No bookings found under your account.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className={`border p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700/80' : 'bg-white border-gray-200'
            }`}>
              <div className="space-y-1">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{b.event_title}</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>📍 {b.venue} | 📅 {b.event_date}</p>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Tickets: <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>{b.tickets}</span> | Total Paid: <span className="text-emerald-500 font-bold">${b.total_amount}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-xs font-semibold rounded-full">
                  {b.status}
                </span>
                <button
                  onClick={() => handleDownloadConfirmation(b)}
                  className="px-3 py-1.5 bg-blue-600/20 text-blue-500 border border-blue-500/30 hover:bg-blue-600 hover:text-white text-xs font-semibold rounded-lg transition"
                >
                  📄 Download Receipt
                </button>
                <button
                  onClick={() => handleCancelBooking(b.id)}
                  className="px-3 py-1.5 bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// User Profile & Password Update Component
function ProfilePage() {
  const { user, updateUser, darkMode } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [error, setError] = useState('');

  if (!user) return <Navigate to="/login" />;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setProfileMsg('');
    try {
      await API.put('/auth/profile', { name, email });
      updateUser({ name, email });
      setProfileMsg('Profile details updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setPassMsg('');
    try {
      await API.put('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPassMsg('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Profile Settings</h1>

      {error && <div className="p-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded-xl text-center text-xs">{error}</div>}

      {/* UPDATE PROFILE FORM */}
      <div className={`p-6 rounded-2xl border space-y-4 ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Update Profile</h2>
        {profileMsg && <p className="text-emerald-500 text-xs font-semibold">{profileMsg}</p>}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500 ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <div>
            <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500 ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition">
            Save Profile Changes
          </button>
        </form>
      </div>

      {/* CHANGE PASSWORD FORM */}
      <div className={`p-6 rounded-2xl border space-y-4 ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Change Password</h2>
        {passMsg && <p className="text-emerald-500 text-xs font-semibold">{passMsg}</p>}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500 ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <div>
            <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500 ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

// User Registration Component
function Register() {
  const { darkMode } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/auth/register', {
        name,
        email,
        password,
        role,
        admin_code: adminCode,
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className={`p-8 max-w-md mx-auto mt-12 border rounded-2xl shadow-2xl space-y-6 transition-colors ${
      darkMode ? 'bg-slate-800 border-slate-700/80' : 'bg-white border-gray-200'
    }`}>
      <div className="text-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create Account</h2>
        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Join EventNexus to book and manage events</p>
      </div>

      {error && <div className="p-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded-xl text-center text-xs">{error}</div>}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          />
        </div>
        <div>
          <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          />
        </div>
        <div>
          <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          />
        </div>
        <div>
          <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Account Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          >
            <option value="user">Standard User</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        {role === 'admin' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
            <label className="block text-xs text-amber-500 dark:text-amber-300 font-semibold">Admin Passcode Required</label>
            <input
              type="password"
              required
              placeholder="Enter security passcode"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        )}

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition text-sm shadow-lg shadow-blue-600/30">
          Create Account
        </button>
      </form>

      <p className={`text-xs text-center ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
        Already registered? <Link to="/login" className="text-blue-500 font-semibold hover:underline">Sign In</Link>
      </p>
    </div>
  );
}

// Login Component
function Login() {
  const { darkMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', { email, password });
      login(res.data.user, res.data.access_token);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className={`p-8 max-w-md mx-auto mt-12 border rounded-2xl shadow-2xl space-y-6 transition-colors ${
      darkMode ? 'bg-slate-800 border-slate-700/80' : 'bg-white border-gray-200'
    }`}>
      <div className="text-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sign In</h2>
        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Access your account and bookings</p>
      </div>

      {error && <div className="p-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded-xl text-center text-xs">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          />
        </div>
        <div>
          <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition text-sm shadow-lg shadow-blue-600/30">
          Sign In
        </button>
      </form>

      <p className={`text-xs text-center ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
        Need an account? <Link to="/register" className="text-blue-500 font-semibold hover:underline">Register here</Link>
      </p>
    </div>
  );
}

// Admin Panel Component with CRUD Controls & Theme Toggle Support
function AdminPanel() {
  const [stats, setStats] = useState(null);
  const { user, darkMode } = useAuth();
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Technology',
    venue: '', date: '', ticket_price: '', total_seats: '',
    image_url: ''
  });
  useEffect(() => {
    // Fetch stats
    API.get('/admin/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('Error fetching stats:', err));

    // Fetch users
    API.get('/admin/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => console.error('Error fetching users:', err));
  }, []);
  const [msg, setMsg] = useState('');

  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  const fetchEvents = () => {
    API.get('/events').then(res => setEvents(res.data)).catch(() => {});
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await API.put(`/events/${editingEvent.id}`, formData);
        setMsg('Event updated successfully!');
      } else {
        await API.post('/events', formData);
        setMsg('Event created successfully!');
      }
      setFormData({ title: '', description: '', category: 'Technology', venue: '', date: '', ticket_price: '', total_seats: '', image_url: '' });
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (evt) => {
    setEditingEvent(evt);
    setFormData({ ...evt });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await API.delete(`/events/${id}`);
      setMsg('Event deleted!');
      fetchEvents();
    } catch (err) {
      setMsg('Failed to delete event');
    }
  };

  const getCurrentDateTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};
const exportToCSV = () => {
    if (!events.length) return alert("No events to export!");
    const headers = "ID,Title,Category,Price,Total Seats,Available Seats\n";
    const rows = events.map(e => `${e.id},"${e.title}",${e.category},${e.ticket_price || e.price},${e.total_seats},${e.available_seats}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events_report.csv';
    a.click();
  };
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch registered users from backend
    API.get('/admin/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => console.error('Error fetching users:', err));
  }, []);
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-extrabold text-amber-500 dark:text-amber-400">👑 Administrator Control Center</h1>

      {msg && <div className="p-3 bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-xl text-center text-sm">{msg}</div>}

      {/* CREATE / EDIT FORM */}
      <div className={`border p-6 rounded-2xl space-y-4 transition-colors ${
        darkMode ? 'bg-slate-800 border-slate-700/80' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        
      {/* Quick Admin Stats Dashboard & Export */}
        {/* Dashboard Statistics Overview */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
    <p className="text-xs text-gray-400">Total Users</p>
    <p className="text-2xl font-bold text-blue-400">{stats?.total_users || users.length}</p>
  </div>
  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
    <p className="text-xs text-gray-400">Total Events</p>
    <p className="text-2xl font-bold text-indigo-400">{stats?.total_events || events.length}</p>
  </div>
  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
    <p className="text-xs text-gray-400">Active Events</p>
    <p className="text-2xl font-bold text-emerald-400">{stats?.active_events || events.length}</p>
  </div>
  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
    <p className="text-xs text-gray-400">Completed Events</p>
    <p className="text-2xl font-bold text-gray-400">{stats?.completed_events || 0}</p>
  </div>
  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
    <p className="text-xs text-gray-400">Total Bookings</p>
    <p className="text-2xl font-bold text-amber-400">{stats?.total_bookings || 0}</p>
  </div>
  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
    <p className="text-xs text-gray-400">Revenue Summary</p>
    <p className="text-2xl font-bold text-green-400">${stats?.revenue_summary || 0}</p>
  </div>
</div>

{/* Recent Registrations & Popularity Chart Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
  {/* Recent Registrations */}
  <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
    <h4 className="text-md font-bold text-white mb-3">Recent Registrations</h4>
    <ul className="space-y-2 text-sm text-gray-300">
      {stats?.recent_registrations?.map((r) => (
        <li key={r.id} className="flex justify-between border-b border-slate-700/50 pb-1.5">
          <span>{r.email}</span>
          <span className="text-xs text-gray-500">ID: #{r.id}</span>
        </li>
      )) || <li className="text-gray-500">No recent signups</li>}
    </ul>
  </div>

  {/* Event Popularity Bar Chart (CSS-based) */}
  <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
    <h4 className="text-md font-bold text-white mb-3">Event Popularity</h4>
    <div className="space-y-3">
      {events.slice(0, 3).map((e) => {
        const booked = e.total_seats - e.available_seats;
        const pct = Math.min(100, Math.round((booked / (e.total_seats || 1)) * 100));
        return (
          <div key={e.id}>
            <div className="flex justify-between text-xs text-gray-300 mb-1">
              <span className="truncate max-w-[200px]">{e.title}</span>
              <span>{booked} booked ({pct}%)</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</div>
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{editingEvent ? '✏️ Edit Event' : '➕ Add New Event'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <input type="text" name="title" placeholder="Event Title" required value={formData.title} onChange={handleChange} className={`border p-2.5 rounded-xl ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
          <input type="text" name="venue" placeholder="Venue" required value={formData.venue} onChange={handleChange} className={`border p-2.5 rounded-xl ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
          <input type="text" name="date" placeholder="Date & Time (e.g. Oct 25, 2026)" required value={formData.date} onChange={handleChange} className={`border p-2.5 rounded-xl ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
          <select name="category" value={formData.category} onChange={handleChange} className={`border p-2.5 rounded-xl ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
            <option value="Technology">Technology</option>
            <option value="Music">Music</option>
            <option value="Business">Business</option>
          </select>
          <input type="number" name="ticket_price" placeholder="Price ($)" required value={formData.ticket_price} onChange={handleChange} className={`border p-2.5 rounded-xl ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
          <input type="number" name="total_seats" placeholder="Total Seats" required value={formData.total_seats} onChange={handleChange} className={`border p-2.5 rounded-xl ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
          <input type="url" name="image_url" placeholder="Image URL" required value={formData.image_url} onChange={handleChange} className={`border p-2.5 rounded-xl md:col-span-2 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className={`border p-2.5 rounded-xl md:col-span-2 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
          
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl transition">
              {editingEvent ? 'Update Event' : 'Create Event'}
            </button>
            {editingEvent && (
              <button type="button" onClick={() => { setEditingEvent(null); setFormData({ title: '', description: '', category: 'Technology', venue: '', date: '', ticket_price: '', total_seats: '', image_url: '' }); }} className={`py-2.5 px-4 rounded-xl ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
{/* Registered Users & Account Management */}
<div className="mt-8 bg-slate-800 p-6 rounded-xl border border-slate-700">
  <h3 className="text-xl font-bold text-white mb-4">Registered Users & Accounts</h3>
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm text-gray-300">
      <thead className="bg-slate-900 text-gray-400 uppercase text-xs">
        <tr>
          <th className="p-3">User ID</th>
          <th className="p-3">Email</th>
          <th className="p-3">Role</th>
          <th className="p-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-b border-slate-700">
            <td className="p-3">{u.id}</td>
            <td className="p-3">{u.email}</td>
            <td className="p-3">
              <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'}`}>
                {u.role || 'user'}
              </span>
            </td>
            <td className="p-3">
              {u.role !== 'admin' && (
                <button
                  onClick={async () => {
                    if (window.confirm(`Delete user ${u.email}?`)) {
                      try {
                        const res = await fetch(`http://127.0.0.1:5000/api/admin/users/${u.id}`, { 
                          method: 'DELETE' 
                        });
                        if (res.ok) {
                          setUsers(users.filter(user => user.id !== u.id));
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }
                  }}
                  className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded text-xs transition border border-red-500/30"
                >
                  Delete User
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
      {/* EVENT MANAGEMENT TABLE */}
        <h3 className="text-xl font-bold text-white mb-4">EVENT MANAGEMENT TABLE</h3>

      <button 
  onClick={exportToCSV}
  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
>
  📥 Export CSV Report
</button>
      <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors ${
        darkMode ? 'bg-slate-800 border-slate-700/80' : 'bg-white border-gray-200'
      }`}>
        <table className={`w-full text-left text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
          <thead className={`text-xs uppercase border-b ${
            darkMode ? 'bg-slate-900/80 text-slate-400 border-slate-700' : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Seats Left</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-slate-700/60' : 'divide-gray-100'}`}>
            {events.map((evt) => (
              <tr key={evt.id} className={darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}>
                <td className={`p-4 font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{evt.title}</td>
                <td className="p-4">{evt.category}</td>
                <td className="p-4 text-emerald-500 font-bold">${evt.ticket_price}</td>
                <td className="p-4">{evt.available_seats}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEdit(evt)} className="px-3 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-xs hover:bg-amber-500 hover:text-white font-semibold transition">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(evt.id)} className="px-3 py-1 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-xs hover:bg-red-600 hover:text-white font-semibold transition">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Inner Content Container to Access Theme Context
function MainContent() {
  const { darkMode } = useAuth();
  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
      darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar />
      <Routes>
        <Route path="/" element={<EventList />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </div>
  );
}

// Application Container
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MainContent />
      </Router>
    </AuthProvider>
  );
}