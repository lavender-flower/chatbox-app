// navbar.js

function toggleMenu() {
  const dropdown = document.getElementById("nav-dropdown");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

// Optional: Add functions for each menu action
function createGroup() {
  alert("Create Group clicked!");
  // Add your logic for creating a group here
}

function openSettings() {
  alert("Settings clicked!");
  // Add your logic for opening settings here
}

function logout() {
  alert("Logout clicked!");
  // Add your logout logic here
}
