
import { useEffect, useState } from "react";
import { Wrench, Plus, RefreshCw, CheckCircle, Clock, ClipboardList } from "lucide-react";
import "./App.css";

const API = "http://localhost:8080/api/requests";
const STUDENT = "student1@smartcampus.test";

export default function App() {
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState("student");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "EQUIPMENT",
    location: "",
    studentEmail: STUDENT,
  });

  async function loadRequests() {
    setLoading(true);
    try {
      const url = view === "admin"
        ? API
        : `${API}/student/${encodeURIComponent(STUDENT)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Could not load requests");
      const data = await response.json();
      setRequests(Array.isArray(data) ? data : [data]);
    } catch (error) {
      setMessage(error.message + ". Is Spring Boot running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [view]);

  async function submitRequest(event) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setMessage("Service request submitted successfully!");
      setForm({
        title: "",
        description: "",
        category: "EQUIPMENT",
        location: "",
        studentEmail: STUDENT,
      });
      setView("student");
      await loadRequests();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      const response = await fetch(`${API}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");
      setMessage(`Request #${id} updated to ${status}`);
      await loadRequests();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const pending = requests.filter(r => r.status === "PENDING").length;
  const progress = requests.filter(r => r.status === "IN_PROGRESS").length;
  const resolved = requests.filter(r => r.status === "RESOLVED").length;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><Wrench size={26} /> <span>CampusCare</span></div>
        <p className="side-label">WORKSPACE</p>
        <button className={view === "student" ? "nav active" : "nav"}
          onClick={() => setView("student")}> <ClipboardList size={18}/> Student Portal</button>
        <button className={view === "admin" ? "nav active" : "nav"}
          onClick={() => setView("admin")}> <CheckCircle size={18}/> Admin Dashboard</button>
        <div className="side-footer">Smart Campus<br/>Service Management</div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><span className="eyebrow">SMART CAMPUS / SERVICE DESK</span>
          <h1>{view === "admin" ? "Admin Dashboard" : "Student Portal"}</h1></div>
          <button className="refresh" onClick={loadRequests}><RefreshCw size={16}/> Refresh</button>
        </header>

        {message && <div className="notice">{message}</div>}

        <section className="stats">
          <div className="stat"><Clock/><span>Pending</span><strong>{pending}</strong></div>
          <div className="stat"><RefreshCw/><span>In Progress</span><strong>{progress}</strong></div>
          <div className="stat"><CheckCircle/><span>Resolved</span><strong>{resolved}</strong></div>
        </section>

        {view === "student" && (
          <section className="panel">
            <h2><Plus size={20}/> Raise a Service Request</h2>
            <form onSubmit={submitRequest} className="request-form">
              <label>Issue title<input required value={form.title}
                onChange={e => setForm({...form, title:e.target.value})}
                placeholder="e.g. Wi-Fi not working"/></label>
              <label>Category<select value={form.category}
                onChange={e => setForm({...form, category:e.target.value})}>
                <option value="NETWORK">Network / Wi-Fi</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="CLEANING">Cleaning</option>
                <option value="OTHER">Other</option>
              </select></label>
              <label>Location<input required value={form.location}
                onChange={e => setForm({...form, location:e.target.value})}
                placeholder="Building, room, or area"/></label>
              <label>Description<textarea required rows="3" value={form.description}
                onChange={e => setForm({...form, description:e.target.value})}
                placeholder="Describe the issue"/></label>
              <button className="primary" type="submit"><Plus size={17}/> Submit Request</button>
            </form>
          </section>
        )}

        <section className="panel">
          <div className="panel-heading">
            <h2>{view === "admin" ? "All Campus Requests" : "My Requests"}</h2>
            <span>{requests.length} total</span>
          </div>
          {loading ? <p>Loading requests...</p> : requests.length === 0 ?
            <p className="empty">No requests yet. Submit your first campus issue.</p> :
            <div className="request-list">
              {requests.map(r => (
                <article className="request" key={r.id}>
                  <div className="request-top">
                    <div><span className="request-id">REQUEST #{r.id} · {r.category}</span>
                    <h3>{r.title}</h3></div>
                    <span className={`status ${r.status.toLowerCase()}`}>{r.status.replace("_", " ")}</span>
                  </div>
                  <p>{r.description}</p>
                  <div className="meta"><span>📍 {r.location || "Location not specified"}</span>
                    <span>👤 {r.studentEmail}</span></div>
                  {view === "admin" && <div className="admin-actions">
                    <label>Update status
                      <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </label>
                  </div>}
                </article>
              ))}
            </div>}
        </section>
      </main>
    </div>
  );
}
