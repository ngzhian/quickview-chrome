function save_options() {
  var playbackRate = document.getElementById('playback-rate').value;
  chrome.storage.sync.set({
    playbackRate: playbackRate,
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function restore_options() {
  chrome.storage.sync.get({
    playbackRate: '1',
  }, function(items) {
    document.getElementById('playback-rate').value = items.playbackRate;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
