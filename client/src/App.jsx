import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

function App() {
  /* =========================
     AUTH
  ========================= */

  const [isLogin, setIsLogin] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: ""
  });

  const [message, setMessage] = useState("");

  /* =========================
     DATA
  ========================= */

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [showUsers, setShowUsers] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] =
    useState(false);

  /* =========================
     FORMS
  ========================= */

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    venue: ""
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: ""
  });

  /* =========================
     DASHBOARD
  ========================= */

  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    activeEvents: 0,
    announcements: 0
  });

  /* =========================
     LOGIN / REGISTER
  ========================= */

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const endpoint = isLogin
        ? `${API}/api/login`
        : `${API}/api/register`;

      const body = isLogin
        ? {
            email: form.email,
            password: form.password
          }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone,
            role: "participant"
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      if (isLogin) {
        setLoggedInUser(data.user);
        setMessage("");
      } else {
        setMessage("Registration successful! Please login.");
        setIsLogin(true);

        setForm({
          name: "",
          email: "",
          password: "",
          phone: ""
        });
      }
    } catch (error) {
      setMessage("Cannot connect to server.");
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const logout = () => {
    setLoggedInUser(null);
    setIsLogin(true);

    setForm({
      name: "",
      email: "",
      password: "",
      phone: ""
    });

    setMessage("");
  };

  /* =========================
     USERS
  ========================= */

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API}/api/users`);
      const data = await response.json();

      setUsers(data);
      setShowUsers(true);
    } catch {
      alert("Unable to load users");
    }
  };

  /* =========================
     EVENTS
  ========================= */

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API}/api/events`);
      const data = await response.json();

      setEvents(data);
      setShowEvents(true);
    } catch {
      alert("Unable to load events");
    }
  };

  const handleEventChange = (e) => {
    setEventForm({
      ...eventForm,
      [e.target.name]: e.target.value
    });
  };

  const createEvent = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...eventForm,
          organizer_id: loggedInUser?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to create event");
        return;
      }

      alert("Event created successfully!");

      setEventForm({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        venue: ""
      });

      setShowCreateEvent(false);
      fetchEvents();
      updateStats();
    } catch {
      alert("Cannot connect to server");
    }
  };

  /* =========================
     EVENT REGISTRATION
  ========================= */

  const registerForEvent = async (eventId) => {
    if (!loggedInUser) return;

    try {
      const response = await fetch(`${API}/api/event-register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event_id: eventId,
          user_id: loggedInUser.id
        })
      });

      const data = await response.json();

      alert(data.message || "Registration completed");
    } catch {
      alert("Unable to register for event");
    }
  };

  /* =========================
     PARTICIPANTS
  ========================= */

  const viewParticipants = async (eventId) => {
    try {
      const response = await fetch(
        `${API}/api/event-registrations/${eventId}`
      );

      const data = await response.json();

      if (!data.length) {
        alert("No participants registered for this event.");
        return;
      }

      const participantNames = data
        .map(
          (item, index) =>
            `${index + 1}. ${item.name} - ${item.email}`
        )
        .join("\n");

      alert(`Registered Participants:\n\n${participantNames}`);
    } catch {
      alert("Unable to load participants");
    }
  };

  /* =========================
     ANNOUNCEMENTS
  ========================= */

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${API}/api/announcements`);
      const data = await response.json();

      setAnnouncements(data);
      setShowAnnouncements(true);
    } catch {
      alert("Unable to load announcements");
    }
  };

  const handleAnnouncementChange = (e) => {
    setAnnouncementForm({
      ...announcementForm,
      [e.target.name]: e.target.value
    });
  };

  const createAnnouncement = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API}/api/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: announcementForm.title,
          message: announcementForm.message,
          created_by: loggedInUser?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to publish announcement");
        return;
      }

      alert("Announcement published successfully!");

      setAnnouncementForm({
        title: "",
        message: ""
      });

      setShowCreateAnnouncement(false);
      fetchAnnouncements();
      updateStats();
    } catch {
      alert("Cannot connect to server");
    }
  };

  /* =========================
     STATS
  ========================= */

  const updateStats = async () => {
    try {
      const [usersRes, eventsRes, announcementsRes] =
        await Promise.all([
          fetch(`${API}/api/users`),
          fetch(`${API}/api/events`),
          fetch(`${API}/api/announcements`)
        ]);

      const usersData = await usersRes.json();
      const eventsData = await eventsRes.json();
      const announcementsData = await announcementsRes.json();

      const today = new Date();

      const activeEvents = eventsData.filter((event) => {
        if (!event.event_date) return false;

        const eventDate = new Date(event.event_date);
        return eventDate >= today;
      });

      setStats({
        users: usersData.length,
        events: eventsData.length,
        activeEvents: activeEvents.length,
        announcements: announcementsData.length
      });

      setUsers(usersData);
      setEvents(eventsData);
      setAnnouncements(announcementsData);
    } catch {
      console.log("Stats could not be loaded");
    }
  };

  /* =========================
     INITIAL DATA
  ========================= */

  useEffect(() => {
    if (loggedInUser) {
      updateStats();
    }
  }, [loggedInUser]);

  /* =========================
     AUTH SCREEN
  ========================= */

  if (!loggedInUser) {
    return (
      <div className="auth-page">

        <div className="auth-left">
          <div className="auth-brand">
            <div className="brand-icon">🌐</div>

            <div>
              <h1>
                Connect<span>Sphere</span>
              </h1>

              <p>Events • Community • Together</p>
            </div>
          </div>

          <div className="auth-content">
            <h2>
              Connect.
              <br />
              Participate.
              <br />
              Grow.
            </h2>

            <p>
              One platform for managing college events,
              communities and participants.
            </p>
          </div>
        </div>

        <div className="auth-right">

          <div className="auth-card">

            <div className="mobile-logo">
              🌐 Connect<span>Sphere</span>
            </div>

            <h2>
              {isLogin ? "Welcome Back 👋" : "Create Account"}
            </h2>

            <p className="auth-subtitle">
              {isLogin
                ? "Login to continue to ConnectSphere"
                : "Join the ConnectSphere community"}
            </p>

            <form onSubmit={handleSubmit}>

              {!isLogin && (
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />

              {!isLogin && (
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={handleChange}
                />
              )}

              <button type="submit" className="auth-main-button">
                {isLogin ? "Login →" : "Create Account →"}
              </button>
            </form>

            {message && (
              <div className="auth-message">
                {message}
              </div>
            )}

            <div className="switch-auth">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}

              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage("");
                }}
              >
                {isLogin ? " Register" : " Login"}
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  /* =========================
     DASHBOARD
  ========================= */

  return (
    <div className="app-layout">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="brand-logo">
            🌐
          </div>

          <div>
            <h2>
              Connect<span>Sphere</span>
            </h2>

            <small>
              Events • Community • Together
            </small>
          </div>

        </div>

        <div className="sidebar-menu">

          <button
            className="sidebar-item active"
            onClick={() => {
              setShowUsers(false);
              setShowEvents(false);
              setShowAnnouncements(false);
              setShowCreateEvent(false);
              setShowCreateAnnouncement(false);
            }}
          >
            🏠
            <span>Dashboard</span>
          </button>

          <button
            className="sidebar-item"
            onClick={fetchUsers}
          >
            👥
            <span>Manage Users</span>
          </button>

          <button
            className="sidebar-item"
            onClick={fetchEvents}
          >
            📅
            <span>Manage Events</span>
          </button>

          <button
            className="sidebar-item"
            onClick={fetchAnnouncements}
          >
            📢
            <span>Announcements</span>
          </button>

          <button
            className="sidebar-item"
            onClick={() =>
              alert(
                "Reports module is ready for integration."
              )
            }
          >
            📊
            <span>Reports</span>
          </button>

          <button
            className="sidebar-item"
            onClick={() =>
              alert(
                "Settings module is ready for integration."
              )
            }
          >
            ⚙️
            <span>Settings</span>
          </button>

          <button
            className="sidebar-item logout"
            onClick={logout}
          >
            🚪
            <span>Logout</span>
          </button>

        </div>

        <div className="sidebar-bottom">

          <div className="community-icon">
            ✨
          </div>

          <h3>Better Events</h3>
          <p>Stronger Community</p>

          <div className="sidebar-line"></div>

        </div>

      </aside>

      {/* MAIN AREA */}

      <main className="main-content">

        {/* TOP HEADER */}

        <header className="top-header">

          <div className="mobile-menu">
            ☰
          </div>

          <h2>
            Connect<span>Sphere</span>
          </h2>

          <div className="profile-area">

            <div className="profile-avatar">
              👤
            </div>

            <div className="profile-info">
              <strong>
                {loggedInUser.name}
              </strong>

              <small>
                {loggedInUser.role}
              </small>
            </div>

          </div>

        </header>

        <div className="content-area">

          {/* WELCOME BANNER */}

          <section className="welcome-banner">

            <div className="welcome-icon">
              👥
            </div>

            <div>
              <h1>
                {loggedInUser.role === "admin"
                  ? "Admin Dashboard"
                  : loggedInUser.role === "organizer"
                  ? "Organizer Dashboard"
                  : "Participant Dashboard"}
              </h1>

              <p>
                Welcome back, {loggedInUser.name} 👋
              </p>

              <span className="role-badge">
                {loggedInUser.role}
              </span>
            </div>

            <div className="welcome-decoration">
              <strong>Connect</strong>
              <strong>Participate</strong>
              <strong>Grow</strong>
            </div>

          </section>

          {/* STATS */}

          <section className="stats-grid">

            <div className="stat-box purple">

              <div className="stat-icon">
                👥
              </div>

              <div>
                <span>Total Users</span>
                <strong>{stats.users}</strong>
                <small>↑ Community</small>
              </div>

            </div>

            <div className="stat-box blue">

              <div className="stat-icon">
                📅
              </div>

              <div>
                <span>Total Events</span>
                <strong>{stats.events}</strong>
                <small>↑ Events</small>
              </div>

            </div>

            <div className="stat-box pink">

              <div className="stat-icon">
                📢
              </div>

              <div>
                <span>Active Events</span>
                <strong>{stats.activeEvents}</strong>
                <small>↑ Ongoing</small>
              </div>

            </div>

            <div className="stat-box green">

              <div className="stat-icon">
                📄
              </div>

              <div>
                <span>Announcements</span>
                <strong>{stats.announcements}</strong>
                <small>↑ Updates</small>
              </div>

            </div>

          </section>

          {/* QUICK ACTIONS */}

          <section className="panel">

            <div className="panel-title">
              <span>⚡</span>
              <h2>Quick Actions</h2>
            </div>

            <div className="quick-actions">

              <button
                onClick={fetchUsers}
                className="quick purple-action"
              >
                <span>👥</span>
                <strong>Manage Users</strong>
                <b>→</b>
              </button>

              <button
                onClick={() => setShowCreateEvent(true)}
                className="quick blue-action"
              >
                <span>📅</span>
                <strong>Create Event</strong>
                <b>→</b>
              </button>

              <button
                onClick={fetchEvents}
                className="quick pink-action"
              >
                <span>🗓️</span>
                <strong>View Events</strong>
                <b>→</b>
              </button>

              <button
                onClick={() =>
                  setShowCreateAnnouncement(true)
                }
                className="quick green-action"
              >
                <span>📢</span>
                <strong>Post Announcement</strong>
                <b>→</b>
              </button>

            </div>

          </section>

          {/* CREATE EVENT */}

          {showCreateEvent && (
            <section className="panel form-panel">

              <div className="panel-title">
                <span>📅</span>
                <h2>Create New Event</h2>
              </div>

              <form onSubmit={createEvent}>

                <input
                  name="title"
                  placeholder="Event Title"
                  value={eventForm.title}
                  onChange={handleEventChange}
                  required
                />

                <textarea
                  name="description"
                  placeholder="Event Description"
                  value={eventForm.description}
                  onChange={handleEventChange}
                  rows="4"
                />

                <div className="form-row">

                  <input
                    type="date"
                    name="event_date"
                    value={eventForm.event_date}
                    onChange={handleEventChange}
                    required
                  />

                  <input
                    type="time"
                    name="event_time"
                    value={eventForm.event_time}
                    onChange={handleEventChange}
                  />

                </div>

                <input
                  name="venue"
                  placeholder="Venue"
                  value={eventForm.venue}
                  onChange={handleEventChange}
                />

                <div className="form-buttons">

                  <button type="submit">
                    Create Event
                  </button>

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() =>
                      setShowCreateEvent(false)
                    }
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </section>
          )}

          {/* CREATE ANNOUNCEMENT */}

          {showCreateAnnouncement && (
            <section className="panel form-panel">

              <div className="panel-title">
                <span>📢</span>
                <h2>Post Announcement</h2>
              </div>

              <form onSubmit={createAnnouncement}>

                <input
                  name="title"
                  placeholder="Announcement Title"
                  value={announcementForm.title}
                  onChange={handleAnnouncementChange}
                  required
                />

                <textarea
                  name="message"
                  placeholder="Announcement Message"
                  value={announcementForm.message}
                  onChange={handleAnnouncementChange}
                  rows="5"
                  required
                />

                <div className="form-buttons">

                  <button type="submit">
                    Publish Announcement
                  </button>

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() =>
                      setShowCreateAnnouncement(false)
                    }
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </section>
          )}

          {/* USERS */}

          {showUsers && (
            <section className="panel">

              <div className="panel-title">
                <span>👥</span>
                <h2>Manage Users</h2>
              </div>

              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Phone</th>
                    </tr>
                  </thead>

                  <tbody>

                    {users.map((user) => (
                      <tr key={user.id}>

                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className="role-table">
                            {user.role}
                          </span>
                        </td>
                        <td>{user.phone || "-"}</td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </section>
          )}

          {/* EVENTS */}

          {showEvents && (
            <section className="panel">

              <div className="panel-title">
                <span>📅</span>
                <h2>All Events</h2>
              </div>

              <div className="event-grid">

                {events.length === 0 ? (
                  <p className="empty">
                    No events available.
                  </p>
                ) : (
                  events.map((event) => (
                    <div
                      className="event-card"
                      key={event.id}
                    >

                      <div className="event-top">
                        <span>📅</span>
                        <span className="event-id">
                          #{event.id}
                        </span>
                      </div>

                      <h3>{event.title}</h3>

                      <p>
                        {event.description ||
                          "No description available."}
                      </p>

                      <div className="event-info">
                        📆 {event.event_date}
                      </div>

                      <div className="event-info">
                        ⏰ {event.event_time || "Time not specified"}
                      </div>

                      <div className="event-info">
                        📍 {event.venue || "Venue not specified"}
                      </div>

                      <div className="event-actions">

                        <button
                          onClick={() =>
                            registerForEvent(event.id)
                          }
                        >
                          Register
                        </button>

                        <button
                          className="secondary-action"
                          onClick={() =>
                            viewParticipants(event.id)
                          }
                        >
                          Participants
                        </button>

                      </div>

                    </div>
                  ))
                )}

              </div>

            </section>
          )}

          {/* ANNOUNCEMENTS */}

          {showAnnouncements && (
            <section className="panel">

              <div className="panel-title">
                <span>📢</span>
                <h2>Latest Announcements</h2>
              </div>

              <div className="announcement-list">

                {announcements.length === 0 ? (
                  <p className="empty">
                    No announcements available.
                  </p>
                ) : (
                  announcements.map((announcement) => (
                    <div
                      className="announcement"
                      key={announcement.id}
                    >

                      <div className="announcement-dot"></div>

                      <div>

                        <h3>
                          {announcement.title}
                        </h3>

                        <p>
                          {announcement.message}
                        </p>

                        <small>
                          {announcement.created_at
                            ? new Date(
                                announcement.created_at
                              ).toLocaleDateString()
                            : ""}
                        </small>

                      </div>

                    </div>
                  ))
                )}

              </div>

            </section>
          )}

          {/* BOTTOM CONTENT */}

          {!showUsers &&
            !showEvents &&
            !showAnnouncements &&
            !showCreateEvent &&
            !showCreateAnnouncement && (
              <div className="bottom-grid">

                {/* RECENT EVENTS */}

                <section className="panel">

                  <div className="panel-heading-row">

                    <div className="panel-title">
                      <span>📅</span>
                      <h2>Recent Events</h2>
                    </div>

                    <button
                      className="view-all"
                      onClick={fetchEvents}
                    >
                      View All →
                    </button>

                  </div>

                  {events.length === 0 ? (
                    <div className="empty-box">
                      <span>📅</span>
                      <p>
                        No events created yet.
                      </p>

                      <button
                        onClick={() =>
                          setShowCreateEvent(true)
                        }
                      >
                        Create First Event
                      </button>
                    </div>
                  ) : (
                    <div className="mini-events">

                      {events
                        .slice(0, 4)
                        .map((event) => (
                          <div
                            className="mini-event"
                            key={event.id}
                          >

                            <div>
                              <strong>
                                {event.title}
                              </strong>

                              <small>
                                {event.event_date} •{" "}
                                {event.venue ||
                                  "Venue not specified"}
                              </small>
                            </div>

                            <span>
                              Upcoming
                            </span>

                          </div>
                        ))}

                    </div>
                  )}

                </section>

                {/* LATEST ANNOUNCEMENTS */}

                <section className="panel">

                  <div className="panel-heading-row">

                    <div className="panel-title">
                      <span>📢</span>
                      <h2>Latest Announcements</h2>
                    </div>

                    <button
                      className="view-all"
                      onClick={fetchAnnouncements}
                    >
                      View All →
                    </button>

                  </div>

                  {announcements.length === 0 ? (
                    <div className="empty-box">
                      <span>📢</span>
                      <p>
                        No announcements yet.
                      </p>

                      <button
                        onClick={() =>
                          setShowCreateAnnouncement(true)
                        }
                      >
                        Post Announcement
                      </button>
                    </div>
                  ) : (
                    <div className="announcement-list">

                      {announcements
                        .slice(0, 4)
                        .map((item) => (
                          <div
                            className="announcement"
                            key={item.id}
                          >

                            <div className="announcement-dot"></div>

                            <div>
                              <h3>{item.title}</h3>

                              <p>
                                {item.message}
                              </p>

                              <small>
                                {item.created_at
                                  ? new Date(
                                      item.created_at
                                    ).toLocaleDateString()
                                  : ""}
                              </small>
                            </div>

                          </div>
                        ))}

                    </div>
                  )}

                </section>

              </div>
            )}

          {/* FOOTER */}

          <footer>
            <strong>ConnectSphere</strong>
            <span>
              Events • Community • Together
            </span>
            <small>
              College Event & Community Management Platform
            </small>
          </footer>

        </div>
      </main>
    </div>
  );
}

export default App;