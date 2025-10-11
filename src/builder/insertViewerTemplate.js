fetch('../storyViewer.html')
    .then(response => {
        if (!response.ok) {
            throw new Error('Loading Template failed. Status: ' + response.status);
        }
        return response.text();
    })
    .then(data => {
        document.getElementById('storyViewerTemplate').textContent = data;
    })
    .catch(error => {
        console.error('Es gab ein Problem mit der Fetch-Operation:', error);
    });