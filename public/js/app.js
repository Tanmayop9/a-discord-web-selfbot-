// Connect to Socket.IO for real-time updates
const socket = io();

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type}`;
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.zIndex = '9999';
  notification.style.minWidth = '300px';
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// API helper
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(endpoint, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Request failed');
    }
    
    return result;
  } catch (error) {
    showNotification(error.message, 'danger');
    throw error;
  }
}

// Send message
async function sendMessage(channelId, message, replyTo = null) {
  try {
    await apiCall('/send-message', 'POST', { channelId, message, replyTo });
    showNotification('Message sent!', 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Edit message
async function editMessage(channelId, messageId, newContent) {
  try {
    await apiCall('/edit-message', 'POST', { channelId, messageId, newContent });
    showNotification('Message edited!', 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Delete message
async function deleteMessage(channelId, messageId) {
  if (!confirm('Are you sure you want to delete this message?')) {
    return false;
  }
  
  try {
    await apiCall('/delete-message', 'POST', { channelId, messageId });
    showNotification('Message deleted!', 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Add reaction
async function addReaction(channelId, messageId, emoji) {
  try {
    await apiCall('/add-reaction', 'POST', { channelId, messageId, emoji });
    showNotification('Reaction added!', 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Update status
async function updateStatus(status) {
  try {
    await apiCall('/update-status', 'POST', { status });
    showNotification(`Status updated to ${status}!`, 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Update custom status
async function updateCustomStatus(emoji, text, expiresAt = null) {
  try {
    await apiCall('/update-custom-status', 'POST', { emoji, text, expiresAt });
    showNotification('Custom status updated!', 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Update Rich Presence
async function updateRPC(data) {
  try {
    await apiCall('/update-rpc', 'POST', data);
    showNotification('Rich Presence updated!', 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Clear activities
async function clearActivities() {
  try {
    await apiCall('/clear-activities', 'POST');
    showNotification('Activities cleared!', 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Send friend request
async function sendFriendRequest(username) {
  try {
    await apiCall('/send-friend-request', 'POST', { username });
    showNotification('Friend request sent!', 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Accept friend request
async function acceptFriendRequest(userId) {
  try {
    await apiCall('/accept-friend-request', 'POST', { userId });
    showNotification('Friend request accepted!', 'success');
    setTimeout(() => location.reload(), 1000);
    return true;
  } catch (error) {
    return false;
  }
}

// Remove friend
async function removeFriend(userId) {
  if (!confirm('Are you sure you want to remove this friend?')) {
    return false;
  }
  
  try {
    await apiCall('/remove-friend', 'POST', { userId });
    showNotification('Friend removed!', 'success');
    setTimeout(() => location.reload(), 1000);
    return true;
  } catch (error) {
    return false;
  }
}

// Block user
async function blockUser(userId) {
  if (!confirm('Are you sure you want to block this user?')) {
    return false;
  }
  
  try {
    await apiCall('/block-user', 'POST', { userId });
    showNotification('User blocked!', 'success');
    setTimeout(() => location.reload(), 1000);
    return true;
  } catch (error) {
    return false;
  }
}

// Join voice channel
async function joinVoice(channelId) {
  try {
    await apiCall('/join-voice', 'POST', { channelId });
    showNotification('Joined voice channel!', 'success');
    setTimeout(() => location.reload(), 1000);
    return true;
  } catch (error) {
    return false;
  }
}

// Leave voice channel
async function leaveVoice() {
  try {
    await apiCall('/leave-voice', 'POST');
    showNotification('Left voice channel!', 'success');
    setTimeout(() => location.reload(), 1000);
    return true;
  } catch (error) {
    return false;
  }
}

// Toggle mute
async function toggleMute(mute) {
  try {
    await apiCall('/voice-mute', 'POST', { mute });
    showNotification(mute ? 'Muted!' : 'Unmuted!', 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Toggle deafen
async function toggleDeafen(deafen) {
  try {
    await apiCall('/voice-deafen', 'POST', { deafen });
    showNotification(deafen ? 'Deafened!' : 'Undeafened!', 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Leave server
async function leaveServer(serverId) {
  if (!confirm('Are you sure you want to leave this server?')) {
    return false;
  }
  
  try {
    await apiCall('/leave-server', 'POST', { serverId });
    showNotification('Left server!', 'success');
    setTimeout(() => location.href = '/servers', 1000);
    return true;
  } catch (error) {
    return false;
  }
}

// Create invite
async function createInvite(channelId, maxAge = 0, maxUses = 0) {
  try {
    const result = await apiCall('/create-invite', 'POST', { channelId, maxAge, maxUses });
    showNotification('Invite created!', 'success');
    return result;
  } catch (error) {
    return null;
  }
}

// Update bio
async function updateBio(bio) {
  try {
    await apiCall('/update-bio', 'POST', { bio });
    showNotification('Bio updated!', 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Update HypeSquad house
async function updateHypeSquad(house) {
  try {
    await apiCall('/update-hypesquad', 'POST', { house });
    showNotification(`Joined ${house} house!`, 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Set note
async function setNote(userId, note) {
  try {
    await apiCall('/set-note', 'POST', { userId, note });
    showNotification('Note saved!', 'success');
    return true;
  } catch (error) {
    return false;
  }
}

// Modal functionality
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Tab functionality
function switchTab(tabId) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab content
  const selectedContent = document.getElementById(tabId);
  if (selectedContent) {
    selectedContent.classList.add('active');
  }
  
  // Add active class to clicked tab
  const selectedTab = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
}

// Listen for new messages via WebSocket
socket.on('newMessage', (data) => {
  console.log('New message received:', data);
  // You can add real-time message updates here
  // For example, append the message to the message list if on the same channel
});

// Auto-scroll to bottom of message list
function scrollToBottom(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}

// Format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) {
    return 'Just now';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}m ago`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Copied to clipboard!', 'success');
  }).catch(() => {
    showNotification('Failed to copy!', 'danger');
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Discord Web Selfbot initialized');
  
  // Close modals when clicking outside
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
  
  // Auto-scroll message lists
  const messageLists = document.querySelectorAll('.message-list');
  messageLists.forEach(list => {
    list.scrollTop = list.scrollHeight;
  });
});
