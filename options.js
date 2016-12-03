const DEFAULT_PLAYBACK_RATE = '1';
const DEFAULT_HOVER_TIME = '370';

const playbackRateControl = document.getElementById('playback-rate');
const hoverTimeControl = document.getElementById('hover-time');
const resetControl = document.getElementById('reset-to-default');
const status = document.getElementById('status');


function save_options() {
  chrome.storage.sync.set({
    playbackRate: playbackRateControl.value,
    hoverTime: hoverTimeControl.value,
  }, function() {
    // Update status to let user know options were saved.
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function restore_options() {
  chrome.storage.sync.get({
    playbackRate: DEFAULT_PLAYBACK_RATE,
    hoverTime: DEFAULT_HOVER_TIME,
  }, function(items) {
    playbackRateControl.value = items.playbackRate;
    hoverTimeControl.value = items.hoverTime;
  });
}

function reset_and_save() {
  playbackRateControl.value = DEFAULT_PLAYBACK_RATE;
  hoverTimeControl.value = DEFAULT_HOVER_TIME;
  save_options();
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
document.getElementById('reset-to-default').addEventListener('click', reset_and_save);
