import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as authService from "../services/authService";

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // --- Profile info (name/email) ---
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  // --- Change password ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // --- Delete account ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileMessage("");
    try {
      const updated = await authService.updateProfile({ name, email });
      updateUser(updated);
      setEditingProfile(false);
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setProfileError(err.response?.data?.message || "Update failed");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Password change failed");
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError("");
    try {
      await authService.deleteAccount(deletePassword);
      logout();
      navigate("/");
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Account deletion failed");
    }
  };

  return (
    <div className="page profile-page">
      <h1>Profile &amp; Settings</h1>

      {/* --- Profile info --- */}
      <section className="settings-card">
        <h2>Profile</h2>

        {profileMessage && <p className="success-banner">{profileMessage}</p>}
        {profileError && <p className="error-banner">{profileError}</p>}

        {editingProfile ? (
          <form onSubmit={handleSaveProfile}>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <div className="button-row">
              <button type="submit" className="btn btn-primary">
                Save
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingProfile(false);
                  setName(user.name);
                  setEmail(user.email);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p>
              <strong>Name:</strong> {user?.name}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            {user?.createdAt && (
              <p>
                <strong>Member since:</strong>{" "}
                {new Date(user.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            <button className="btn btn-primary" onClick={() => setEditingProfile(true)}>
              Edit Profile
            </button>
          </>
        )}
      </section>

      {/* --- Change password --- */}
      <section className="settings-card">
        <h2>Change Password</h2>

        {passwordMessage && <p className="success-banner">{passwordMessage}</p>}
        {passwordError && <p className="error-banner">{passwordError}</p>}

        <form onSubmit={handleChangePassword}>
          <label>
            Current Password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Update Password
          </button>
        </form>
      </section>

      {/* --- Delete account --- */}
      <section className="settings-card settings-card-danger">
        <h2>Delete Account</h2>
        <p className="danger-text">
          This permanently deletes your account, every ticket you've uploaded, and their files.
          This cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete My Account
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount}>
            {deleteError && <p className="error-banner">{deleteError}</p>}
            <label>
              Confirm your password to proceed
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />
            </label>
            <div className="button-row">
              <button type="submit" className="btn btn-danger">
                Permanently Delete Account
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default Profile;
