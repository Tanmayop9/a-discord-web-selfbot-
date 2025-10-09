const { Client, RichPresence, CustomStatus, SpotifyRPC } = require('discord.js-selfbot-v13');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer');
const http = require('http');
const socketIO = require('socket.io');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 10021;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 8 * 1024 * 1024 } });

// Discord selfbot setup
const client = new Client({
  checkUpdate: false,
  ws: { properties: { browser: 'Discord Client' } }
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || '';

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Store data
let botReady = false;
let userServers = [];
let currentStatus = 'online';
let currentActivities = [];

// Advanced features storage
let autoResponders = [];
let scheduledMessages = [];
let afkMode = { enabled: false, message: '', since: null };
let deletedMessages = [];
let editedMessages = [];
let customCommands = [];
let messageStats = {
  sent: 0,
  received: 0,
  deleted: 0,
  edited: 0,
  channels: {},
  servers: {}
};
let activityLogs = [];

// Ultra Advanced features storage
let messageTemplates = [];
let notifications = [];
let multiAccounts = [];
let currentTheme = 'dark';
let raidProtection = {
  enabled: false,
  joinThreshold: 10,
  timeWindow: 60,
  action: 'kick'
};
let serverBackups = [];
let quickActions = [
  { id: 1, name: 'Quick Status', action: 'status', icon: '🎮' },
  { id: 2, name: 'Send Embed', action: 'embed', icon: '🎨' },
  { id: 3, name: 'Mass DM', action: 'massdm', icon: '📬' },
  { id: 4, name: 'Analytics', action: 'analytics', icon: '📊' }
];

// Bot Creator storage
let createdBots = [];

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected to WebSocket');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Broadcast new messages to all connected clients
client.on('messageCreate', async (message) => {
  // Update message stats
  if (message.author.id === client.user.id) {
    messageStats.sent++;
  } else {
    messageStats.received++;
  }
  
  // Track per-channel stats
  if (!messageStats.channels[message.channel.id]) {
    messageStats.channels[message.channel.id] = { sent: 0, received: 0 };
  }
  if (message.author.id === client.user.id) {
    messageStats.channels[message.channel.id].sent++;
  } else {
    messageStats.channels[message.channel.id].received++;
  }
  
  // Auto-responder logic
  if (message.author.id !== client.user.id) {
    autoResponders.forEach(async (responder) => {
      if (responder.enabled) {
        const content = message.content.toLowerCase();
        const trigger = responder.trigger.toLowerCase();
        
        if ((responder.matchType === 'exact' && content === trigger) ||
            (responder.matchType === 'contains' && content.includes(trigger)) ||
            (responder.matchType === 'startsWith' && content.startsWith(trigger))) {
          try {
            await message.channel.send(responder.response);
          } catch (err) {
            console.error('Auto-responder error:', err.message);
          }
        }
      }
    });
  }
  
  // AFK mode auto-response
  if (afkMode.enabled && message.mentions.has(client.user)) {
    try {
      const afkDuration = Math.floor((Date.now() - afkMode.since) / 1000 / 60);
      await message.channel.send(`🌙 I'm currently AFK: ${afkMode.message} (${afkDuration} minutes ago)`);
    } catch (err) {
      console.error('AFK response error:', err.message);
    }
  }
  
  // Custom commands
  if (message.author.id === client.user.id) {
    customCommands.forEach(async (cmd) => {
      if (message.content.startsWith(cmd.trigger)) {
        try {
          await message.delete();
          await message.channel.send(cmd.response);
        } catch (err) {
          console.error('Custom command error:', err.message);
        }
      }
    });
  }
  
  // Log activity
  activityLogs.unshift({
    type: 'message',
    timestamp: Date.now(),
    channelId: message.channel.id,
    authorId: message.author.id,
    content: message.content.substring(0, 100)
  });
  if (activityLogs.length > 1000) activityLogs.pop();
  
  io.emit('newMessage', {
    channelId: message.channel.id,
    messageData: {
      id: message.id,
      content: message.content,
      author: message.author.tag,
      authorId: message.author.id,
      authorAvatar: message.author.displayAvatarURL(),
      timestamp: message.createdAt.toLocaleString(),
      editable: message.author.id === client.user.id,
      attachments: message.attachments.map(a => ({
        url: a.url,
        name: a.name,
        size: a.size
      })),
      embeds: message.embeds
    }
  });
});

// Message delete tracking
client.on('messageDelete', (message) => {
  messageStats.deleted++;
  deletedMessages.unshift({
    id: message.id,
    content: message.content,
    author: message.author.tag,
    authorId: message.author.id,
    channelId: message.channel.id,
    timestamp: Date.now(),
    attachments: message.attachments.map(a => ({ url: a.url, name: a.name }))
  });
  if (deletedMessages.length > 100) deletedMessages.pop();
  
  io.emit('messageDeleted', {
    messageId: message.id,
    channelId: message.channel.id
  });
});

// Message edit tracking
client.on('messageUpdate', (oldMessage, newMessage) => {
  messageStats.edited++;
  editedMessages.unshift({
    id: newMessage.id,
    oldContent: oldMessage.content,
    newContent: newMessage.content,
    author: newMessage.author.tag,
    channelId: newMessage.channel.id,
    timestamp: Date.now()
  });
  if (editedMessages.length > 100) editedMessages.pop();
  
  io.emit('messageEdited', {
    messageId: newMessage.id,
    channelId: newMessage.channel.id,
    newContent: newMessage.content
  });
});

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    botReady,
    user: client.user,
    status: currentStatus,
    activities: currentActivities
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    botReady,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: require('./package.json').version
  });
});

app.get('/servers', (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  userServers = client.guilds.cache.map(guild => ({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL() || '/default-icon.png',
    banner: guild.bannerURL() || null,
    memberCount: guild.memberCount,
    owner: guild.ownerId === client.user.id,
    description: guild.description || 'No description',
    verified: guild.verified || false,
    partnered: guild.partnered || false
  }));
  
  res.render('servers', { servers: userServers, user: client.user });
});

app.get('/server/:id', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const guild = client.guilds.cache.get(req.params.id);
  if (!guild) {
    return res.status(404).send('Server not found');
  }
  
  const channels = [];
  guild.channels.cache.forEach(ch => {
    channels.push({
      id: ch.id,
      name: ch.name,
      type: ch.type,
      position: ch.position,
      parentId: ch.parentId || null,
      nsfw: ch.nsfw || false
    });
  });
  channels.sort((a, b) => a.position - b.position);
  
  const roles = guild.roles.cache.map(role => ({
    id: role.id,
    name: role.name,
    color: role.hexColor,
    position: role.position,
    permissions: role.permissions.toArray(),
    mentionable: role.mentionable,
    hoist: role.hoist
  }));
  
  const emojis = guild.emojis.cache.map(emoji => ({
    id: emoji.id,
    name: emoji.name,
    url: emoji.url,
    animated: emoji.animated,
    available: emoji.available
  }));
  
  res.render('server', { guild, channels, roles, emojis, user: client.user });
});

app.get('/channel/:serverId/:channelId', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const channel = client.channels.cache.get(req.params.channelId);
  if (!channel) {
    return res.status(404).send('Channel not found');
  }
  
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    const messagesArray = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      author: msg.author.tag,
      authorId: msg.author.id,
      authorAvatar: msg.author.displayAvatarURL(),
      timestamp: msg.createdAt.toLocaleString(),
      editable: msg.author.id === client.user.id,
      attachments: msg.attachments.map(a => ({
        url: a.url,
        name: a.name,
        size: a.size,
        contentType: a.contentType
      })),
      embeds: msg.embeds,
      reactions: msg.reactions.cache.map(r => ({
        emoji: r.emoji.name,
        count: r.count,
        me: r.me
      })),
      reference: msg.reference ? {
        messageId: msg.reference.messageId,
        channelId: msg.reference.channelId
      } : null
    })).reverse();
    
    res.render('channel', { 
      channel, 
      messages: messagesArray, 
      serverId: req.params.serverId,
      user: client.user 
    });
  } catch (error) {
    res.status(500).send('Error fetching messages: ' + error.message);
  }
});

app.post('/send-message', upload.single('file'), async (req, res) => {
  const { channelId, message, replyTo } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const options = {};
    if (message) options.content = message;
    if (replyTo) options.reply = { messageReference: replyTo };
    if (req.file) options.files = [req.file.path];
    
    await channel.send(options);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/send-embed', async (req, res) => {
  const { channelId, title, description, color, footer, thumbnail, image, fields } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const embed = {
      title: title || undefined,
      description: description || undefined,
      color: color ? parseInt(color.replace('#', ''), 16) : undefined,
      footer: footer ? { text: footer } : undefined,
      thumbnail: thumbnail ? { url: thumbnail } : undefined,
      image: image ? { url: image } : undefined,
      fields: fields || undefined
    };
    
    await channel.send({ embeds: [embed] });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/edit-message', async (req, res) => {
  const { channelId, messageId, newContent } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const message = await channel.messages.fetch(messageId);
    if (message.author.id !== client.user.id) {
      return res.status(403).json({ error: 'Cannot edit messages from other users' });
    }
    
    await message.edit(newContent);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/delete-message', async (req, res) => {
  const { channelId, messageId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const message = await channel.messages.fetch(messageId);
    if (message.author.id !== client.user.id) {
      return res.status(403).json({ error: 'Cannot delete messages from other users' });
    }
    
    await message.delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/add-reaction', async (req, res) => {
  const { channelId, messageId, emoji } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const message = await channel.messages.fetch(messageId);
    await message.react(emoji);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-status', async (req, res) => {
  const { status } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setStatus(status);
    currentStatus = status;
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-custom-status', async (req, res) => {
  const { emoji, text, expiresAt } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const status = new CustomStatus(client)
      .setEmoji(emoji || '')
      .setState(text || '');
    
    if (expiresAt) {
      status.setExpiresAt(new Date(expiresAt));
    }
    
    await client.user.setPresence({ activities: [status] });
    currentActivities = [status];
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-rpc', async (req, res) => {
  const { name, details, state, largeImage, largeText, smallImage, smallText, appId, buttons } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const rpc = new RichPresence(client)
      .setApplicationId(appId || '123456789012345678')
      .setType('PLAYING')
      .setName(name || 'Custom Activity')
      .setDetails(details || '')
      .setState(state || '')
      .setStartTimestamp(Date.now());
    
    if (largeImage) {
      rpc.setAssetsLargeImage(largeImage);
    }
    if (largeText) {
      rpc.setAssetsLargeText(largeText);
    }
    if (smallImage) {
      rpc.setAssetsSmallImage(smallImage);
    }
    if (smallText) {
      rpc.setAssetsSmallText(smallText);
    }
    if (buttons && buttons.length > 0) {
      rpc.setButtons(buttons);
    }
    
    await client.user.setPresence({ activities: [rpc] });
    currentActivities = [rpc];
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-spotify', async (req, res) => {
  const { songName, artist, album, albumCoverUrl, duration, startTime } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const spotify = new SpotifyRPC(client)
      .setAssetsLargeImage(albumCoverUrl || 'spotify:1')
      .setDetails(songName || 'Song Name')
      .setState(artist || 'Artist Name')
      .setStartTimestamp(startTime || Date.now())
      .setEndTimestamp((startTime || Date.now()) + (duration || 180000));
    
    if (album) {
      spotify.setAssetsLargeText(album);
    }
    
    await client.user.setPresence({ activities: [spotify] });
    currentActivities = [spotify];
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/clear-activities', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setPresence({ activities: [] });
    currentActivities = [];
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/dms', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const dmChannels = [];
  client.channels.cache.forEach(ch => {
    if (ch.type === 'DM' && ch.recipient) {
      dmChannels.push({
        id: ch.id,
        recipient: ch.recipient.tag,
        recipientAvatar: ch.recipient.displayAvatarURL({ dynamic: true }),
        recipientId: ch.recipient.id,
        lastMessageId: ch.lastMessageId
      });
    } else if (ch.type === 'GROUP_DM') {
      dmChannels.push({
        id: ch.id,
        name: ch.name || 'Group DM',
        recipients: ch.recipients ? ch.recipients.map(r => r.tag).join(', ') : '',
        icon: ch.iconURL() || '/default-icon.png'
      });
    }
  });
  
  res.render('dms', { dms: dmChannels, user: client.user });
});

app.get('/friends', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const friends = [];
  const pending = [];
  const blocked = [];
  
  if (client.relationships && client.relationships.cache) {
    client.relationships.cache.forEach(r => {
      const userData = {
        id: r.id,
        username: r.user.tag,
        avatar: r.user.displayAvatarURL({ dynamic: true }),
        type: r.type
      };
      
      if (r.type === 'FRIEND') {
        friends.push({
          ...userData,
          status: r.user.presence?.status || 'offline',
          activities: r.user.presence?.activities || []
        });
      } else if (r.type === 'PENDING_INCOMING') {
        pending.push(userData);
      } else if (r.type === 'PENDING_OUTGOING') {
        pending.push({ ...userData, outgoing: true });
      } else if (r.type === 'BLOCKED') {
        blocked.push(userData);
      }
    });
  }
  
  res.render('friends', { friends, pending, blocked, user: client.user });
});

app.post('/send-friend-request', async (req, res) => {
  const { username } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.sendFriendRequest(username);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/accept-friend-request', async (req, res) => {
  const { userId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const relationship = client.relationships.cache.get(userId);
    if (relationship) {
      await relationship.accept();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Friend request not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/remove-friend', async (req, res) => {
  const { userId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const relationship = client.relationships.cache.get(userId);
    if (relationship) {
      await relationship.delete();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Relationship not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/block-user', async (req, res) => {
  const { userId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.blockUser(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/unblock-user', async (req, res) => {
  const { userId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.unblockUser(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/voice', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const voiceChannels = [];
  client.guilds.cache.forEach(guild => {
    guild.channels.cache.forEach(ch => {
      if (ch.type === 'GUILD_VOICE' || ch.type === 'GUILD_STAGE_VOICE') {
        voiceChannels.push({
          id: ch.id,
          name: ch.name,
          type: ch.type,
          guildName: guild.name,
          guildId: guild.id,
          members: ch.members ? ch.members.size : 0,
          userLimit: ch.userLimit || 0
        });
      }
    });
  });
  
  const currentVoice = client.voice?.channel ? {
    id: client.voice.channel.id,
    name: client.voice.channel.name,
    guild: client.voice.channel.guild.name,
    muted: client.voice.mute || false,
    deafened: client.voice.deaf || false
  } : null;
  
  res.render('voice', { voiceChannels, currentVoice, user: client.user });
});

app.post('/join-voice', async (req, res) => {
  const { channelId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel || (channel.type !== 'GUILD_VOICE' && channel.type !== 'GUILD_STAGE_VOICE')) {
      return res.status(404).json({ error: 'Voice channel not found' });
    }
    
    await channel.join();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/leave-voice', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    if (client.voice?.channel) {
      await client.voice.channel.leave();
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Not in a voice channel' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/voice-mute', async (req, res) => {
  const { mute } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    if (client.voice?.connection) {
      await client.voice.setSelfMute(mute);
      res.json({ success: true, muted: mute });
    } else {
      res.status(400).json({ error: 'Not in a voice channel' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/voice-deafen', async (req, res) => {
  const { deafen } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    if (client.voice?.connection) {
      await client.voice.setSelfDeaf(deafen);
      res.json({ success: true, deafened: deafen });
    } else {
      res.status(400).json({ error: 'Not in a voice channel' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/invites', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const invites = [];
  for (const guild of client.guilds.cache.values()) {
    try {
      const guildInvites = await guild.invites.fetch();
      guildInvites.forEach(invite => {
        invites.push({
          code: invite.code,
          url: invite.url,
          guild: guild.name,
          channel: invite.channel?.name || 'Unknown',
          uses: invite.uses,
          maxUses: invite.maxUses,
          expiresAt: invite.expiresAt ? invite.expiresAt.toLocaleString() : 'Never',
          inviter: invite.inviter ? invite.inviter.tag : 'Unknown'
        });
      });
    } catch (err) {
      console.error(`Failed to fetch invites for ${guild.name}:`, err.message);
    }
  }
  
  res.render('invites', { invites, user: client.user });
});

app.post('/create-invite', async (req, res) => {
  const { channelId, maxAge, maxUses } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const invite = await channel.createInvite({
      maxAge: parseInt(maxAge) || 0,
      maxUses: parseInt(maxUses) || 0
    });
    
    res.json({ success: true, code: invite.code, url: invite.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/leave-server', async (req, res) => {
  const { serverId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    await guild.leave();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/user-info', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('user-info', { 
    user: client.user,
    nitroType: client.user.nitroType || 'None',
    premiumType: client.user.premiumType || 0,
    phone: client.user.phone || 'Not set',
    email: client.user.email || 'Not set',
    verified: client.user.verified,
    mfaEnabled: client.user.mfaEnabled || false,
    bio: client.user.bio || '',
    banner: client.user.bannerURL() || null,
    accentColor: client.user.accentColor || null
  });
});

app.post('/update-bio', async (req, res) => {
  const { bio } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setBio(bio);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-banner', async (req, res) => {
  const { banner } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setBanner(banner);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-accent-color', async (req, res) => {
  const { color } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setAccentColor(color);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-avatar', async (req, res) => {
  const { avatar } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setAvatar(avatar);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-hypesquad', async (req, res) => {
  const { house } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setHypeSquad(house);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/settings', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const settings = {
    theme: client.settings?.theme || 'dark',
    locale: client.settings?.locale || 'en-US',
    messageDisplay: client.settings?.messageDisplayCompact || false,
    inlineAttachmentMedia: client.settings?.inlineAttachmentMedia || true,
    inlineEmbedMedia: client.settings?.inlineEmbedMedia || true,
    gifAutoPlay: client.settings?.gifAutoPlay || true,
    renderEmbeds: client.settings?.renderEmbeds || true,
    renderReactions: client.settings?.renderReactions || true,
    animateEmoji: client.settings?.animateEmoji || true,
    enableTTSCommand: client.settings?.enableTTSCommand || false,
    showCurrentGame: client.settings?.showCurrentGame || true
  };
  
  res.render('settings', { settings, user: client.user });
});

app.post('/update-settings', async (req, res) => {
  const { setting, value } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.settings.edit({ [setting]: value });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/applications', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const applications = await client.fetchApplications() || [];
    res.render('applications', { applications, user: client.user });
  } catch (error) {
    res.render('applications', { applications: [], user: client.user, error: error.message });
  }
});

app.get('/billing', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const billingInfo = {
      premiumType: client.user.premiumType || 0,
      premiumGuildSince: client.user.premiumGuildSince || null
    };
    res.render('billing', { billing: billingInfo, user: client.user });
  } catch (error) {
    res.render('billing', { billing: {}, user: client.user, error: error.message });
  }
});

app.get('/webhooks/:guildId', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      return res.status(404).send('Server not found');
    }
    
    const webhooks = await guild.fetchWebhooks();
    const webhookList = webhooks.map(wh => ({
      id: wh.id,
      name: wh.name,
      avatar: wh.avatarURL() || '/default-icon.png',
      channelId: wh.channelId,
      token: wh.token || 'Hidden',
      url: wh.url
    }));
    
    res.render('webhooks', { webhooks: webhookList, guild, user: client.user });
  } catch (error) {
    res.status(500).send('Error fetching webhooks: ' + error.message);
  }
});

app.post('/create-webhook', async (req, res) => {
  const { channelId, name, avatar } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const webhook = await channel.createWebhook(name, { avatar: avatar || undefined });
    res.json({ success: true, webhook: { id: webhook.id, url: webhook.url } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/delete-webhook', async (req, res) => {
  const { webhookId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const webhook = await client.fetchWebhook(webhookId);
    await webhook.delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/notes', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const notes = [];
  if (client.notes) {
    for (const [userId, note] of client.notes.cache) {
      try {
        const user = await client.users.fetch(userId);
        notes.push({
          userId,
          username: user.tag,
          avatar: user.displayAvatarURL(),
          note
        });
      } catch (err) {
        console.error(`Failed to fetch user ${userId}:`, err.message);
      }
    }
  }
  
  res.render('notes', { notes, user: client.user });
});

app.post('/set-note', async (req, res) => {
  const { userId, note } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setNote(userId, note);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ULTRA ADVANCED FEATURES ==========

// Analytics Dashboard
app.get('/analytics', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const topChannels = Object.entries(messageStats.channels)
    .sort((a, b) => (b[1].sent + b[1].received) - (a[1].sent + a[1].received))
    .slice(0, 10)
    .map(([channelId, stats]) => {
      const channel = client.channels.cache.get(channelId);
      return {
        channelId,
        channelName: channel ? channel.name : 'Unknown',
        ...stats,
        total: stats.sent + stats.received
      };
    });
  
  res.render('analytics', { 
    stats: messageStats,
    topChannels,
    activityLogs: activityLogs.slice(0, 50),
    user: client.user 
  });
});

// Auto-Responder Management
app.get('/auto-responder', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('auto-responder', { 
    autoResponders,
    user: client.user 
  });
});

app.post('/auto-responder/add', async (req, res) => {
  const { trigger, response, matchType } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  autoResponders.push({
    id: Date.now(),
    trigger,
    response,
    matchType: matchType || 'contains',
    enabled: true,
    created: Date.now()
  });
  
  res.json({ success: true });
});

app.post('/auto-responder/toggle', async (req, res) => {
  const { id } = req.body;
  
  const responder = autoResponders.find(r => r.id === parseInt(id));
  if (responder) {
    responder.enabled = !responder.enabled;
    res.json({ success: true, enabled: responder.enabled });
  } else {
    res.status(404).json({ error: 'Auto-responder not found' });
  }
});

app.post('/auto-responder/delete', async (req, res) => {
  const { id } = req.body;
  
  autoResponders = autoResponders.filter(r => r.id !== parseInt(id));
  res.json({ success: true });
});

// Message Scheduler
app.get('/scheduler', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('scheduler', { 
    scheduledMessages,
    user: client.user 
  });
});

app.post('/scheduler/add', async (req, res) => {
  const { channelId, message, timestamp } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }
  
  const scheduleTime = new Date(timestamp).getTime();
  const scheduled = {
    id: Date.now(),
    channelId,
    channelName: channel.name,
    message,
    scheduleTime,
    created: Date.now()
  };
  
  scheduledMessages.push(scheduled);
  
  // Schedule the message
  const delay = scheduleTime - Date.now();
  if (delay > 0) {
    setTimeout(async () => {
      try {
        await channel.send(message);
        scheduledMessages = scheduledMessages.filter(m => m.id !== scheduled.id);
      } catch (err) {
        console.error('Scheduled message error:', err.message);
      }
    }, delay);
  }
  
  res.json({ success: true });
});

app.post('/scheduler/delete', async (req, res) => {
  const { id } = req.body;
  
  scheduledMessages = scheduledMessages.filter(m => m.id !== parseInt(id));
  res.json({ success: true });
});

// AFK Mode
app.get('/afk', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('afk', { 
    afkMode,
    user: client.user 
  });
});

app.post('/afk/toggle', async (req, res) => {
  const { message } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  if (afkMode.enabled) {
    afkMode = { enabled: false, message: '', since: null };
  } else {
    afkMode = {
      enabled: true,
      message: message || 'I am AFK',
      since: Date.now()
    };
  }
  
  res.json({ success: true, enabled: afkMode.enabled });
});

// Message Sniper (Deleted/Edited Messages)
app.get('/sniper', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('sniper', { 
    deletedMessages,
    editedMessages,
    user: client.user 
  });
});

// Custom Commands
app.get('/custom-commands', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('custom-commands', { 
    customCommands,
    user: client.user 
  });
});

app.post('/custom-commands/add', async (req, res) => {
  const { trigger, response } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  customCommands.push({
    id: Date.now(),
    trigger,
    response,
    created: Date.now()
  });
  
  res.json({ success: true });
});

app.post('/custom-commands/delete', async (req, res) => {
  const { id } = req.body;
  
  customCommands = customCommands.filter(c => c.id !== parseInt(id));
  res.json({ success: true });
});

// Advanced Embed Builder
app.get('/embed-builder', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const channels = [];
  client.guilds.cache.forEach(guild => {
    guild.channels.cache.forEach(ch => {
      if (ch.isText()) {
        channels.push({
          id: ch.id,
          name: ch.name,
          guildName: guild.name
        });
      }
    });
  });
  
  res.render('embed-builder', { 
    channels,
    user: client.user 
  });
});

app.post('/embed-builder/send', async (req, res) => {
  const { channelId, embedData } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const embed = JSON.parse(embedData);
    await channel.send({ embeds: [embed] });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mass DM
app.get('/mass-dm', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const friends = [];
  if (client.relationships && client.relationships.cache) {
    client.relationships.cache.forEach(r => {
      if (r.type === 'FRIEND') {
        friends.push({
          id: r.id,
          username: r.user.tag,
          avatar: r.user.displayAvatarURL()
        });
      }
    });
  }
  
  res.render('mass-dm', { 
    friends,
    user: client.user 
  });
});

app.post('/mass-dm/send', async (req, res) => {
  const { userIds, message, delay } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const delayMs = parseInt(delay) || 1000;
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  
  // Send DMs with delay to avoid rate limiting
  let sent = 0;
  let failed = 0;
  
  for (const userId of ids) {
    try {
      const user = await client.users.fetch(userId);
      await user.send(message);
      sent++;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (err) {
      failed++;
      console.error(`Failed to DM ${userId}:`, err.message);
    }
  }
  
  res.json({ success: true, sent, failed });
});

// Server Backup
app.get('/backup/:guildId', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    const backup = {
      name: guild.name,
      icon: guild.iconURL(),
      channels: guild.channels.cache.map(ch => ({
        name: ch.name,
        type: ch.type,
        position: ch.position,
        parentId: ch.parentId
      })),
      roles: guild.roles.cache.map(r => ({
        name: r.name,
        color: r.hexColor,
        permissions: r.permissions.toArray(),
        position: r.position
      })),
      emojis: guild.emojis.cache.map(e => ({
        name: e.name,
        url: e.url,
        animated: e.animated
      })),
      timestamp: Date.now()
    };
    
    res.json({ success: true, backup });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Token Checker
app.get('/token-checker', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('token-checker', { user: client.user });
});

app.post('/token-checker/validate', async (req, res) => {
  const { token } = req.body;
  
  try {
    const testClient = new Client({ checkUpdate: false });
    await testClient.login(token);
    
    const info = {
      valid: true,
      userId: testClient.user.id,
      username: testClient.user.tag,
      avatar: testClient.user.displayAvatarURL(),
      nitro: testClient.user.nitroType || 'None',
      verified: testClient.user.verified
    };
    
    await testClient.destroy();
    res.json(info);
  } catch (error) {
    res.json({ valid: false, error: error.message });
  }
});

// Slash Commands Viewer
app.get('/slash-commands', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const commands = [];
  
  try {
    for (const guild of client.guilds.cache.values()) {
      try {
        const guildCommands = await guild.commands.fetch();
        guildCommands.forEach(cmd => {
          commands.push({
            id: cmd.id,
            name: cmd.name,
            description: cmd.description,
            guildName: guild.name,
            guildId: guild.id
          });
        });
      } catch (err) {
        console.error(`Failed to fetch commands for ${guild.name}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Error fetching slash commands:', error.message);
  }
  
  res.render('slash-commands', { commands, user: client.user });
});

// Activity Logger
app.get('/activity-logs', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('activity-logs', { 
    logs: activityLogs.slice(0, 100),
    user: client.user 
  });
});

app.post('/activity-logs/clear', async (req, res) => {
  activityLogs = [];
  res.json({ success: true });
});

// ========== NEW ULTRA ADVANCED FEATURES ==========

// Message Templates
app.get('/templates', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('templates', { 
    templates: messageTemplates,
    user: client.user 
  });
});

app.post('/templates/add', async (req, res) => {
  const { name, content, category } = req.body;
  
  messageTemplates.push({
    id: Date.now(),
    name,
    content,
    category: category || 'general',
    created: Date.now(),
    uses: 0
  });
  
  res.json({ success: true });
});

app.post('/templates/use', async (req, res) => {
  const { id, channelId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const template = messageTemplates.find(t => t.id === parseInt(id));
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    await channel.send(template.content);
    template.uses++;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/templates/delete', async (req, res) => {
  const { id } = req.body;
  
  messageTemplates = messageTemplates.filter(t => t.id !== parseInt(id));
  res.json({ success: true });
});

// Notification Center
app.get('/notifications', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.json({ notifications });
});

app.post('/notifications/clear', async (req, res) => {
  notifications = [];
  res.json({ success: true });
});

app.post('/notifications/mark-read', async (req, res) => {
  const { id } = req.body;
  
  const notification = notifications.find(n => n.id === parseInt(id));
  if (notification) {
    notification.read = true;
  }
  
  res.json({ success: true });
});

// Theme Management
app.post('/theme/set', async (req, res) => {
  const { theme } = req.body;
  
  currentTheme = theme;
  res.json({ success: true, theme });
});

app.get('/theme/get', async (req, res) => {
  res.json({ theme: currentTheme });
});

// Multi-Account Manager
app.get('/multi-account', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('multi-account', { 
    accounts: multiAccounts,
    currentToken: DISCORD_TOKEN,
    user: client.user 
  });
});

app.post('/multi-account/add', async (req, res) => {
  const { token, name } = req.body;
  
  try {
    const testClient = new Client({ checkUpdate: false });
    await testClient.login(token);
    
    multiAccounts.push({
      id: Date.now(),
      token,
      name: name || testClient.user.tag,
      username: testClient.user.tag,
      userId: testClient.user.id,
      avatar: testClient.user.displayAvatarURL(),
      added: Date.now()
    });
    
    await testClient.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Invalid token' });
  }
});

app.post('/multi-account/delete', async (req, res) => {
  const { id } = req.body;
  
  multiAccounts = multiAccounts.filter(a => a.id !== parseInt(id));
  res.json({ success: true });
});

// Advanced Search
app.get('/search', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('search', { user: client.user });
});

app.post('/search/messages', async (req, res) => {
  const { query, serverId, channelId, limit } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const results = [];
    const searchLimit = parseInt(limit) || 100;
    
    if (channelId) {
      const channel = client.channels.cache.get(channelId);
      if (channel) {
        const messages = await channel.messages.fetch({ limit: searchLimit });
        messages.forEach(msg => {
          if (msg.content.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              id: msg.id,
              content: msg.content,
              author: msg.author.tag,
              channelId: msg.channel.id,
              channelName: msg.channel.name,
              timestamp: msg.createdAt.toLocaleString()
            });
          }
        });
      }
    } else if (serverId) {
      const guild = client.guilds.cache.get(serverId);
      if (guild) {
        for (const [, channel] of guild.channels.cache) {
          if (channel.isText()) {
            try {
              const messages = await channel.messages.fetch({ limit: 50 });
              messages.forEach(msg => {
                if (msg.content.toLowerCase().includes(query.toLowerCase())) {
                  results.push({
                    id: msg.id,
                    content: msg.content,
                    author: msg.author.tag,
                    channelId: msg.channel.id,
                    channelName: msg.channel.name,
                    timestamp: msg.createdAt.toLocaleString()
                  });
                }
              });
            } catch (err) {
              // Skip channels we can't access
            }
          }
        }
      }
    }
    
    res.json({ success: true, results: results.slice(0, 50) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Raid Protection
app.get('/raid-protection', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('raid-protection', { 
    raidProtection,
    user: client.user 
  });
});

app.post('/raid-protection/toggle', async (req, res) => {
  const { enabled, joinThreshold, timeWindow, action } = req.body;
  
  raidProtection = {
    enabled: enabled === 'true' || enabled === true,
    joinThreshold: parseInt(joinThreshold) || 10,
    timeWindow: parseInt(timeWindow) || 60,
    action: action || 'kick'
  };
  
  res.json({ success: true, raidProtection });
});

// Backup Manager
app.get('/backup-manager', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('backup-manager', { 
    backups: serverBackups,
    user: client.user 
  });
});

app.post('/backup-manager/save', async (req, res) => {
  const { name, data } = req.body;
  
  serverBackups.push({
    id: Date.now(),
    name,
    data: JSON.parse(data),
    created: Date.now()
  });
  
  res.json({ success: true });
});

app.post('/backup-manager/restore', async (req, res) => {
  const { id } = req.body;
  
  const backup = serverBackups.find(b => b.id === parseInt(id));
  if (!backup) {
    return res.status(404).json({ error: 'Backup not found' });
  }
  
  // Restore logic would go here
  res.json({ success: true, data: backup.data });
});

app.post('/backup-manager/delete', async (req, res) => {
  const { id } = req.body;
  
  serverBackups = serverBackups.filter(b => b.id !== parseInt(id));
  res.json({ success: true });
});

// Server Statistics
app.get('/server-stats/:id', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) {
      return res.status(404).send('Server not found');
    }
    
    const stats = {
      name: guild.name,
      memberCount: guild.memberCount,
      channelCount: guild.channels.cache.size,
      roleCount: guild.roles.cache.size,
      emojiCount: guild.emojis.cache.size,
      boostLevel: guild.premiumTier,
      boostCount: guild.premiumSubscriptionCount,
      createdAt: guild.createdAt.toLocaleString(),
      owner: guild.ownerId
    };
    
    res.render('server-stats', { stats, guild, user: client.user });
  } catch (error) {
    res.status(500).send('Error fetching stats: ' + error.message);
  }
});

// Quick Actions
app.get('/quick-actions', async (req, res) => {
  res.json({ actions: quickActions });
});

// ========================================
// NEW ULTRA ADVANCED FEATURES
// ========================================

// Storage for new features
let stickerPacks = [];
let guildStickers = new Map();
let activeThreads = [];
let archivedThreads = [];
let stageChannels = [];
let currentStage = null;
let streamingStatus = {
  active: false,
  channelId: null,
  quality: '1080p',
  fps: 60,
  video: false,
  screenShare: false
};
let nitroStatus = {
  type: null,
  expiresAt: null,
  boosts: []
};
let componentMessages = [];
let soundboardSounds = [];
let advancedSettings = {};
let deviceStatus = 'desktop';

// ========================================
// STICKERS MANAGER
// ========================================

app.get('/stickers', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    // Fetch sticker packs
    const stickers = [];
    
    // Get guild stickers
    for (const guild of client.guilds.cache.values()) {
      try {
        const guildStickers = await guild.stickers.fetch();
        guildStickers.forEach(sticker => {
          stickers.push({
            id: sticker.id,
            name: sticker.name,
            description: sticker.description,
            tags: sticker.tags,
            format: sticker.format,
            guild: guild.name,
            guildId: guild.id,
            url: sticker.url,
            available: sticker.available
          });
        });
      } catch (err) {
        console.error(`Failed to fetch stickers for ${guild.name}`);
      }
    }
    
    res.render('stickers', { stickers, user: client.user });
  } catch (error) {
    res.status(500).send('Error fetching stickers: ' + error.message);
  }
});

app.post('/stickers/send', async (req, res) => {
  const { channelId, stickerId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    // Send sticker
    await channel.send({ stickers: [stickerId] });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// THREADS MANAGER
// ========================================

app.get('/threads/:channelId?', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const threads = [];
    
    if (req.params.channelId) {
      const channel = client.channels.cache.get(req.params.channelId);
      if (channel && channel.threads) {
        const activeThreads = await channel.threads.fetchActive();
        const archivedThreads = await channel.threads.fetchArchived();
        
        activeThreads.threads.forEach(thread => {
          threads.push({
            id: thread.id,
            name: thread.name,
            archived: false,
            locked: thread.locked,
            memberCount: thread.memberCount,
            messageCount: thread.messageCount,
            ownerId: thread.ownerId,
            channelId: channel.id,
            channelName: channel.name
          });
        });
        
        archivedThreads.threads.forEach(thread => {
          threads.push({
            id: thread.id,
            name: thread.name,
            archived: true,
            locked: thread.locked,
            memberCount: thread.memberCount,
            messageCount: thread.messageCount,
            ownerId: thread.ownerId,
            channelId: channel.id,
            channelName: channel.name
          });
        });
      }
    } else {
      // Get all threads from all channels
      for (const guild of client.guilds.cache.values()) {
        for (const channel of guild.channels.cache.values()) {
          if (channel.threads) {
            try {
              const activeThreads = await channel.threads.fetchActive();
              activeThreads.threads.forEach(thread => {
                threads.push({
                  id: thread.id,
                  name: thread.name,
                  archived: false,
                  locked: thread.locked,
                  memberCount: thread.memberCount,
                  messageCount: thread.messageCount,
                  ownerId: thread.ownerId,
                  channelId: channel.id,
                  channelName: channel.name,
                  guildName: guild.name
                });
              });
            } catch (err) {
              // Skip channels we can't access
            }
          }
        }
      }
    }
    
    res.render('threads', { threads, user: client.user, channelId: req.params.channelId });
  } catch (error) {
    res.status(500).send('Error fetching threads: ' + error.message);
  }
});

app.post('/threads/create', async (req, res) => {
  const { channelId, name, autoArchiveDuration, type, messageId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    let thread;
    if (messageId) {
      const message = await channel.messages.fetch(messageId);
      thread = await message.startThread({
        name: name || 'New Thread',
        autoArchiveDuration: parseInt(autoArchiveDuration) || 60
      });
    } else {
      thread = await channel.threads.create({
        name: name || 'New Thread',
        autoArchiveDuration: parseInt(autoArchiveDuration) || 60,
        type: type || 'GUILD_PUBLIC_THREAD'
      });
    }
    
    res.json({ success: true, threadId: thread.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/threads/:id/join', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const thread = client.channels.cache.get(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    await thread.join();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/threads/:id/leave', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const thread = client.channels.cache.get(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    await thread.leave();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// STAGE CHANNELS MANAGER
// ========================================

app.get('/stage-channels', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const stages = [];
    
    for (const guild of client.guilds.cache.values()) {
      for (const channel of guild.channels.cache.values()) {
        if (channel.type === 'GUILD_STAGE_VOICE') {
          const stageInstance = await channel.fetchStageInstance().catch(() => null);
          
          stages.push({
            id: channel.id,
            name: channel.name,
            guildName: guild.name,
            guildId: guild.id,
            topic: stageInstance?.topic || 'No active stage',
            active: !!stageInstance,
            participants: channel.members?.size || 0
          });
        }
      }
    }
    
    res.render('stage-channels', { stages, currentStage, user: client.user });
  } catch (error) {
    res.status(500).send('Error fetching stage channels: ' + error.message);
  }
});

app.post('/stage/:id/join', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(req.params.id);
    if (!channel || channel.type !== 'GUILD_STAGE_VOICE') {
      return res.status(404).json({ error: 'Stage channel not found' });
    }
    
    await channel.guild.members.me.voice.setChannel(channel);
    await channel.guild.members.me.voice.setSuppressed(true); // Join as audience
    
    currentStage = {
      id: channel.id,
      name: channel.name,
      suppressed: true
    };
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/stage/:id/speak', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Stage channel not found' });
    }
    
    await channel.guild.members.me.voice.setSuppressed(false); // Request to speak
    
    if (currentStage) {
      currentStage.suppressed = false;
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/stage/:id/leave', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Stage channel not found' });
    }
    
    await channel.guild.members.me.voice.setChannel(null);
    currentStage = null;
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// VOICE STREAMING & VIDEO
// ========================================

app.get('/streaming', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('streaming', { streamingStatus, user: client.user });
});

app.post('/streaming/start', async (req, res) => {
  const { channelId, quality, fps } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel || channel.type !== 'GUILD_VOICE') {
      return res.status(404).json({ error: 'Voice channel not found' });
    }
    
    // Note: Actual streaming requires additional setup
    streamingStatus = {
      active: true,
      channelId,
      quality: quality || '1080p',
      fps: parseInt(fps) || 60,
      video: false,
      screenShare: false
    };
    
    res.json({ success: true, message: 'Streaming setup ready (actual streaming requires additional configuration)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/streaming/stop', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  streamingStatus = {
    active: false,
    channelId: null,
    quality: '1080p',
    fps: 60,
    video: false,
    screenShare: false
  };
  
  res.json({ success: true });
});

app.post('/streaming/video', async (req, res) => {
  const { enabled } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  streamingStatus.video = enabled;
  res.json({ success: true, video: enabled });
});

app.post('/streaming/screen', async (req, res) => {
  const { enabled } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  streamingStatus.screenShare = enabled;
  res.json({ success: true, screenShare: enabled });
});

// ========================================
// NITRO FEATURES MANAGER
// ========================================

app.get('/nitro', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const nitroInfo = {
      type: client.user.nitroType || 'None',
      premiumSince: client.user.premiumSince || null,
      boosts: []
    };
    
    // Get boost information
    for (const guild of client.guilds.cache.values()) {
      const member = await guild.members.fetch(client.user.id).catch(() => null);
      if (member && member.premiumSince) {
        nitroInfo.boosts.push({
          guildId: guild.id,
          guildName: guild.name,
          since: member.premiumSince
        });
      }
    }
    
    res.render('nitro', { nitroInfo, user: client.user });
  } catch (error) {
    res.status(500).send('Error fetching nitro info: ' + error.message);
  }
});

app.post('/nitro/boost', async (req, res) => {
  const { guildId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }
    
    // Note: Actual boosting requires Nitro
    res.json({ success: true, message: 'Boost functionality requires Nitro subscription' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// GUILD DISCOVERY
// ========================================

app.get('/guild-discovery', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    // Note: Guild discovery API is limited in selfbots
    const discoveryGuilds = [];
    
    res.render('guild-discovery', { guilds: discoveryGuilds, user: client.user });
  } catch (error) {
    res.status(500).send('Error fetching guild discovery: ' + error.message);
  }
});

app.post('/guild-discovery/join', async (req, res) => {
  const { inviteCode } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const invite = await client.fetchInvite(inviteCode);
    await client.acceptInvite(inviteCode);
    
    res.json({ success: true, guildName: invite.guild.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// MESSAGE COMPONENTS MANAGER
// ========================================

app.get('/components', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('components', { componentMessages, user: client.user });
});

app.post('/components/create', async (req, res) => {
  const { channelId, content, components } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    // Parse components JSON
    const parsedComponents = JSON.parse(components);
    
    const message = await channel.send({
      content: content || 'Message with components',
      components: parsedComponents
    });
    
    componentMessages.push({
      id: message.id,
      channelId: channel.id,
      components: parsedComponents
    });
    
    res.json({ success: true, messageId: message.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// SOUNDBOARD MANAGER
// ========================================

app.get('/soundboard', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const sounds = [];
    
    // Get guild soundboard sounds
    for (const guild of client.guilds.cache.values()) {
      if (guild.soundboards) {
        try {
          const guildSounds = await guild.soundboards.fetch();
          guildSounds.forEach(sound => {
            sounds.push({
              id: sound.id,
              name: sound.name,
              guildName: guild.name,
              guildId: guild.id,
              emoji: sound.emoji
            });
          });
        } catch (err) {
          // Guild doesn't support soundboard or we can't access it
        }
      }
    }
    
    res.render('soundboard', { sounds, user: client.user });
  } catch (error) {
    res.status(500).send('Error fetching soundboard: ' + error.message);
  }
});

app.post('/soundboard/send', async (req, res) => {
  const { soundId, channelId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    // Note: Soundboard sending may require additional setup
    res.json({ success: true, message: 'Soundboard feature requires additional configuration' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ADVANCED SETTINGS MANAGER
// ========================================

app.get('/advanced-settings', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const settings = {
      locale: client.user.locale || 'en-US',
      theme: advancedSettings.theme || 'dark',
      compactMode: advancedSettings.compactMode || false,
      showEmbeds: advancedSettings.showEmbeds !== false,
      renderEmbeds: advancedSettings.renderEmbeds !== false,
      animatedEmojis: advancedSettings.animatedEmojis !== false,
      messageDisplayCompact: advancedSettings.messageDisplayCompact || false,
      convertEmoticons: advancedSettings.convertEmoticons || false,
      explicitContentFilter: advancedSettings.explicitContentFilter || 'DISABLED'
    };
    
    res.render('advanced-settings', { settings, user: client.user });
  } catch (error) {
    res.status(500).send('Error fetching settings: ' + error.message);
  }
});

app.post('/advanced-settings/update', async (req, res) => {
  const { setting, value } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    advancedSettings[setting] = value;
    
    // Note: Actual Discord settings update requires different API calls
    res.json({ success: true, message: 'Setting updated locally' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// MOBILE PRESENCE SIMULATOR
// ========================================

app.get('/mobile-presence', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('mobile-presence', { deviceStatus, user: client.user });
});

app.post('/presence/device', async (req, res) => {
  const { device } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    deviceStatus = device || 'desktop';
    
    // Note: Changing device status requires modifying WebSocket properties
    res.json({ success: true, device: deviceStatus, message: 'Device status updated locally' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// BOT CREATOR / APPLICATION MANAGER
// ========================================

app.get('/bot-creator', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('bot-creator', { 
    bots: createdBots, 
    user: client.user 
  });
});

app.post('/bot-creator/create', async (req, res) => {
  const { botNames, enableIntents } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const botsArray = Array.isArray(botNames) ? botNames : [botNames];
    const createdBotsInfo = [];
    const failedBots = [];
    
    for (const botName of botsArray) {
      if (!botName || botName.trim() === '') continue;
      
      try {
        // Create application via Discord API
        const createResponse = await axios.post(
          'https://discord.com/api/v9/applications',
          { name: botName.trim() },
          {
            headers: {
              'Authorization': DISCORD_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const appId = createResponse.data.id;
        
        // Create bot user
        const botResponse = await axios.post(
          `https://discord.com/api/v9/applications/${appId}/bot`,
          {},
          {
            headers: {
              'Authorization': DISCORD_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const botToken = botResponse.data.token;
        
        // Enable intents if requested
        if (enableIntents) {
          const intentsValue = 32767; // All intents
          await axios.patch(
            `https://discord.com/api/v9/applications/${appId}`,
            { 
              bot_public: false,
              bot_require_code_grant: false,
              flags: intentsValue
            },
            {
              headers: {
                'Authorization': DISCORD_TOKEN,
                'Content-Type': 'application/json'
              }
            }
          );
        }
        
        const botInfo = {
          id: appId,
          name: botName.trim(),
          token: botToken,
          intentsEnabled: enableIntents || false,
          createdAt: new Date().toISOString()
        };
        
        createdBots.push(botInfo);
        createdBotsInfo.push(botInfo);
        
      } catch (error) {
        console.error(`Failed to create bot ${botName}:`, error.message);
        failedBots.push({ name: botName, error: error.message });
      }
    }
    
    // Save tokens to file
    if (createdBotsInfo.length > 0) {
      const fs = require('fs');
      const tokensDir = '/tmp/bot-tokens';
      if (!fs.existsSync(tokensDir)) {
        fs.mkdirSync(tokensDir, { recursive: true });
      }
      
      const timestamp = Date.now();
      const filename = `bot_tokens_${timestamp}.txt`;
      const filepath = path.join(tokensDir, filename);
      
      let fileContent = `# Discord Bot Tokens\n`;
      fileContent += `# Created: ${new Date().toLocaleString()}\n`;
      fileContent += `# Total Bots: ${createdBotsInfo.length}\n\n`;
      
      createdBotsInfo.forEach((bot, index) => {
        fileContent += `# Bot ${index + 1}: ${bot.name}\n`;
        fileContent += `Application ID: ${bot.id}\n`;
        fileContent += `Token: ${bot.token}\n`;
        fileContent += `Intents Enabled: ${bot.intentsEnabled}\n`;
        fileContent += `Created: ${bot.createdAt}\n`;
        fileContent += `\n`;
      });
      
      fs.writeFileSync(filepath, fileContent);
      
      res.json({ 
        success: true, 
        bots: createdBotsInfo,
        failed: failedBots,
        tokenFile: filename,
        downloadUrl: `/download-tokens/${filename}`
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to create any bots', 
        failed: failedBots 
      });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/download-tokens/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join('/tmp/bot-tokens', filename);
  
  if (require('fs').existsSync(filepath)) {
    res.download(filepath);
  } else {
    res.status(404).send('File not found');
  }
});

app.post('/bot-creator/delete', async (req, res) => {
  const { botId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    // Delete application
    await axios.delete(
      `https://discord.com/api/v9/applications/${botId}`,
      {
        headers: {
          'Authorization': DISCORD_TOKEN
        }
      }
    );
    
    // Remove from local storage
    createdBots = createdBots.filter(bot => bot.id !== botId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/bot-creator/update-intents', async (req, res) => {
  const { botId, intents } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    // Update bot intents
    await axios.patch(
      `https://discord.com/api/v9/applications/${botId}`,
      { flags: intents },
      {
        headers: {
          'Authorization': DISCORD_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Update local storage
    const bot = createdBots.find(b => b.id === botId);
    if (bot) {
      bot.intentsEnabled = true;
      bot.intentsValue = intents;
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Discord client events
client.on('ready', async () => {
  console.log(`\n✅ Successfully logged in as: ${client.user.tag}`);
  console.log(`📊 User ID: ${client.user.id}`);
  console.log(`🏰 Servers: ${client.guilds.cache.size}`);
  console.log(`👥 Friends: ${client.relationships?.cache?.filter(r => r.type === 'FRIEND').size || 0}`);
  console.log(`💎 Nitro Type: ${client.user.nitroType || 'None'}`);
  console.log(`\n🌐 Dashboard available at: http://0.0.0.0:${PORT}`);
  botReady = true;
});

client.on('messageCreate', async (message) => {
  // Auto-response or logging can be added here
  console.log(`[${message.channel.type}] ${message.author.tag}: ${message.content}`);
});

client.on('relationshipAdd', (relationship) => {
  console.log(`Relationship added: ${relationship.user.tag} (${relationship.type})`);
});

client.on('relationshipRemove', (relationship) => {
  console.log(`Relationship removed: ${relationship.user.tag} (${relationship.type})`);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dashboard server running on http://0.0.0.0:${PORT}`);
});

// Login to Discord
if (!DISCORD_TOKEN || DISCORD_TOKEN === 'YOUR_TOKEN_HERE') {
  console.error('❌ ERROR: No Discord token provided!');
  console.error('Please set your DISCORD_TOKEN in environment variables:');
  console.error('export DISCORD_TOKEN="your_token_here"');
  console.error('\n⚠️  WARNING: Selfbots violate Discord ToS - use at your own risk!');
  console.error('This tool is for educational purposes only.');
} else {
  console.log('🔐 Attempting to login to Discord...');
  client.login(DISCORD_TOKEN).catch(err => {
    console.error('❌ Failed to login:', err.message);
    console.error('\nPlease check:');
    console.error('1. Your token is correct and valid');
    console.error('2. The token is from a user account (not a bot)');
    console.error('3. The account is not locked or restricted');
  });
}

// Create upload directory
const fs = require('fs');
const uploadDir = '/tmp/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
