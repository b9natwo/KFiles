document.getElementById('krakenForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Get the input value
    const krakenLink = document.getElementById('krakenLink').value;
    
    // Extract the ID from the KrakenFiles link
    const regex = /krakenfiles\.com\/view\/([a-zA-Z0-9]+)\/file\.html/;
    const match = krakenLink.match(regex);
    
    if (match && match[1]) {
        const id = match[1];
        
        // Create the new embed link
        const newLink = `https://krakenfiles.com/embed-audio/${id}?autoplay=false&link=true`;
        
        // Update the shareable link
        const shareLink = `${window.location.origin}/view/${id}`;
        document.getElementById('shareLinkUrl').href = shareLink;
        document.getElementById('shareLinkUrl').textContent = shareLink;
        document.getElementById('shareLink').style.display = 'block';
    } else {
        alert('Invalid KrakenFiles link');
    }
});
