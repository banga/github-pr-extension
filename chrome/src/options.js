function saveOptions() {
    const options = {editorUrl: document.getElementById('editor-url').value};
    chrome.storage.sync.set(options).then(() => console.log(`Saved settings`, options));
}

function restoreOptions() {
    chrome.storage.sync.get({editorUrl: ''}).then(({editorUrl}) => {
        document.getElementById('editor-url').value = editorUrl;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('editor-url').addEventListener('change', saveOptions);
