import React from "react";

export default function Profile({ user }) {
  return (
    <div className="mainContent p-8 bg-[#feffdf] min-h-screen">
      <div className="optionContainer grid grid-cols-1 lg:grid-cols-2 gap-8 ">
        {/* Profile Section */}
        <div className="option p-6 bg-[radial-gradient(#ffe79acc,#ffe79a99)] text-black rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Profile</h1>
          <p className="text-lg">View and edit your profile</p>
          <div className="mt-4">
            <p className="text-lg">
              <strong>Name:</strong> {user.name}
            </p>
            <p className="text-lg">
              <strong>Date of Birth:</strong> {user.dateOfBirth}
            </p>
            <p className="text-lg">
              <strong>Gender:</strong> {user.gender}
            </p>
          </div>
        </div>

        {/* Achievement Section */}
        <div className="option p-6 bg-[radial-gradient(#ffe79acc,#ffe79a99)] text-black rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Achievements</h1>
          <p className="text-lg">List your achievements here...</p>
          {/* Add more details as needed */}
        </div>

        {/* Contest Section */}
        <div className="option p-6 bg-[radial-gradient(#ffe79acc,#ffe79a99)] text-black rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Contests</h1>
          <p className="text-lg">Participated and organized contests...</p>
          {/* Add more details as needed */}
        </div>

        {/* Contribution Section */}
        <div className="option p-6 bg-[radial-gradient(#ffe79acc,#ffe79a99)] text-black rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Contributions</h1>
          <p className="text-lg">Your contributions to the community...</p>
          {/* Add more details as needed */}
        </div>

        {/* Contact with User Section */}
        <div className="option p-6 bg-[radial-gradient(#ffe79acc,#ffe79a99)] text-black rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Contact Information</h1>
          <p className="text-lg">
            <strong>Address:</strong> {user.address}
          </p>
          <p className="text-lg">
            <strong>Phone:</strong> {user.phone}
          </p>
          <p className="text-lg">
            <strong>Email:</strong> {user.email}
          </p>
        </div>

        {/* Settings Section */}
        <div className="option p-6 bg-[radial-gradient(#ffe79acc,#ffe79a99)] text-black rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-lg">Change your account settings</p>
          {user.category === "admin" && (
            <p className="text-lg">
              <strong>Admin Key:</strong> {user.adminKey}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}






App.jsx:
<Route path="/profile" element={<Profile user={user} />} />


tailwind.config:
  content: ["./src/**/Registration.{js,jsx,ts,tsx}","./src/**/Login.{js,jsx,ts,tsx}","./src/**/Profile.{js,jsx,ts,tsx}"],
