function toggleDivs(showDivId, hideDivId) {
    // Hide the div with the ID in `hideDivId`
    document.getElementById(hideDivId).style.display = 'none';
    
    // Show the div with the ID in `showDivId`
    document.getElementById(showDivId).style.display = 'block';
}