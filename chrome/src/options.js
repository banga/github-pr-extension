function saveOptions() {
    const options = {editorUrl: document.getElementById('editor-url').value};
    chrome.storage.sync.set(options, () => console.log(`Saved settings`, options));
}

function restoreOptions() {
    chrome.storage.sync.get({editorUrl: ''}, function ({editorUrl}) {
        document.getElementById('editor-url').value = editorUrl;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('editor-url').addEventListener('change', saveOptions);
