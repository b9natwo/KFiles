document.getElementById('fileForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Get the input value
    const fileLink = document.getElementById('fileLink').value;
    
    // Extract the ID from the KrakenFiles or plwcse.top link
    const krakenRegex = /krakenfiles\.com\/view\/([a-zA-Z0-9]+)\/file\.html/;
    const plwcseRegex = /plwcse\.top\/f\/([a-zA-Z0-9]+)/;
    const pillowcaseRegex = /pillowcase\.su\/f\/([a-zA-Z0-9]+)/;
    
    const krakenMatch = fileLink.match(krakenRegex);
    const plwcseMatch = fileLink.match(plwcseRegex);
    const pillowcaseMatch = fileLink.match(pillowcaseRegex)
    
    let id, shareLink;
    if (krakenMatch && krakenMatch[1]) {
        id = krakenMatch[1];
        shareLink = `${window.location.origin}/view/${id}`;
    } else if (plwcseMatch && plwcseMatch[1]) {
        id = plwcseMatch[1];
        shareLink = `${window.location.origin}/f/${id}`;
    } else if (pillowcaseMatch && pillowcaseMatch[1]) {
        id = pillowcaseMatch[1];
        shareLink = `${window.location.origin}/f/${id}`;
    } else {
        alert('Invalid link');
        return;
    }
    
    document.getElementById('shareLinkUrl').href = shareLink;
    document.getElementById('shareLinkUrl').textContent = shareLink;
    document.getElementById('shareLink').style.display = 'block';
});
