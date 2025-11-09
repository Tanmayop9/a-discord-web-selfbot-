// ⚠️ USE AT YOUR OWN RISK - EDUCATIONAL PURPOSES ONLY ⚠️
// 
// Discord Terms of Service strictly prohibit selfbots and automation of user accounts.
// Using this tool may result in account termination.
// This code is provided for educational purposes only.
// The authors are not responsible for any consequences of using this tool.

const { Client } = require('discord.js-selfbot-v13');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// ============ CONFIGURATION ============
const TOKEN = ''; // your user token here
const SOURCE_GUILD_ID = '28292'; // source server ID
const TARGET_GUILD_ID = '29292'; // target server ID

// ============ TWEAKS ============
const TEMP_DIR = path.join(os.tmpdir(), 'emoji-sticker-temp');
const COPY_EMOJIS = true;
const COPY_STICKERS = true;
const DELAY_MS = 1500; // Delay between operations to avoid rate limits

// ============ UTILITY FUNCTIONS ============
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function displayWarning() {
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  WARNING: USE AT YOUR OWN RISK ⚠️');
  console.log('='.repeat(80));
  console.log('This tool automates a user account, which violates Discord Terms of Service.');
  console.log('Using this tool may result in:');
  console.log('  - Account suspension or termination');
  console.log('  - Rate limiting or API restrictions');
  console.log('  - Legal consequences');
  console.log('\nThis code is provided for EDUCATIONAL PURPOSES ONLY.');
  console.log('The authors assume NO responsibility for any consequences.');
  console.log('='.repeat(80) + '\n');
}

/**
 * Download an image from a URL to a buffer
 */
async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

/**
 * Copy emojis from source to target guild
 */
async function copyEmojis(sourceGuild, targetGuild) {
  if (!COPY_EMOJIS) {
    console.log('⏭️  Emoji copying is disabled');
    return;
  }

  console.log('\n🎨 Starting emoji copy...');
  
  const sourceEmojis = sourceGuild.emojis.cache;
  console.log(`  Found ${sourceEmojis.size} emoji(s) in source server`);

  if (sourceEmojis.size === 0) {
    console.log('  No emojis to copy');
    return;
  }

  const targetEmojis = targetGuild.emojis.cache;
  let copied = 0;
  let skipped = 0;
  let failed = 0;

  for (const [id, emoji] of sourceEmojis) {
    try {
      // Check if emoji already exists in target (by name)
      const exists = targetEmojis.find(e => e.name === emoji.name);
      if (exists) {
        console.log(`  ⏭️  Skipping emoji :${emoji.name}: (already exists)`);
        skipped++;
        continue;
      }

      console.log(`  ⬇️  Downloading emoji :${emoji.name}:...`);
      
      // Get emoji URL
      const emojiURL = emoji.url;
      if (!emojiURL) {
        console.warn(`    ⚠️  No URL for emoji :${emoji.name}:`);
        failed++;
        continue;
      }

      // Download emoji
      const imageBuffer = await downloadImage(emojiURL);
      
      // Create emoji in target guild
      console.log(`  ⬆️  Creating emoji :${emoji.name}: in target server...`);
      await targetGuild.emojis.create(imageBuffer, emoji.name);
      
      copied++;
      console.log(`  ✅ Successfully copied emoji :${emoji.name}:`);
      
      // Rate limiting delay
      await sleep(DELAY_MS);
    } catch (err) {
      failed++;
      console.error(`  ❌ Failed to copy emoji :${emoji.name}:: ${err.message}`);
      
      // If rate limited, wait longer
      if (err.message.includes('429') || err.message.includes('rate limit')) {
        console.log('  ⏸️  Rate limited, waiting 5 seconds...');
        await sleep(5000);
      }
    }
  }

  console.log(`\n📊 Emoji Copy Summary:`);
  console.log(`  ✅ Copied: ${copied}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);
}

/**
 * Copy stickers from source to target guild
 * Note: Sticker copying has limitations without Nitro
 */
async function copyStickers(sourceGuild, targetGuild) {
  if (!COPY_STICKERS) {
    console.log('⏭️  Sticker copying is disabled');
    return;
  }

  console.log('\n🎨 Starting sticker copy...');
  
  // Fetch stickers from source guild
  let sourceStickers;
  try {
    sourceStickers = await sourceGuild.stickers.fetch();
    console.log(`  Found ${sourceStickers.size} sticker(s) in source server`);
  } catch (err) {
    console.error(`  ❌ Failed to fetch stickers: ${err.message}`);
    return;
  }

  if (sourceStickers.size === 0) {
    console.log('  No stickers to copy');
    return;
  }

  // Fetch target stickers
  let targetStickers;
  try {
    targetStickers = await targetGuild.stickers.fetch();
  } catch (err) {
    console.error(`  ❌ Failed to fetch target stickers: ${err.message}`);
    targetStickers = new Map();
  }

  let copied = 0;
  let skipped = 0;
  let failed = 0;

  for (const [id, sticker] of sourceStickers) {
    try {
      // Check if sticker already exists in target (by name)
      const exists = targetStickers.find(s => s.name === sticker.name);
      if (exists) {
        console.log(`  ⏭️  Skipping sticker "${sticker.name}" (already exists)`);
        skipped++;
        continue;
      }

      console.log(`  ⬇️  Downloading sticker "${sticker.name}"...`);
      
      // Get sticker URL
      // Note: Sticker format can be PNG, APNG, or Lottie (JSON)
      const stickerURL = sticker.url;
      if (!stickerURL) {
        console.warn(`    ⚠️  No URL for sticker "${sticker.name}"`);
        failed++;
        continue;
      }

      // Download sticker
      const imageBuffer = await downloadImage(stickerURL);
      
      // Create sticker in target guild
      console.log(`  ⬆️  Creating sticker "${sticker.name}" in target server...`);
      
      // Prepare sticker options
      const stickerOptions = {
        name: sticker.name,
        tags: sticker.tags || 'custom',
        description: sticker.description || '',
      };
      
      await targetGuild.stickers.create(imageBuffer, stickerOptions);
      
      copied++;
      console.log(`  ✅ Successfully copied sticker "${sticker.name}"`);
      
      // Rate limiting delay
      await sleep(DELAY_MS);
    } catch (err) {
      failed++;
      console.error(`  ❌ Failed to copy sticker "${sticker.name}": ${err.message}`);
      
      // Common error: requires Nitro boost level
      if (err.message.includes('boost') || err.message.includes('PREMIUM')) {
        console.warn(`    ℹ️  Note: Server may need Nitro boost level to upload stickers`);
      }
      
      // If rate limited, wait longer
      if (err.message.includes('429') || err.message.includes('rate limit')) {
        console.log('  ⏸️  Rate limited, waiting 5 seconds...');
        await sleep(5000);
      }
    }
  }

  console.log(`\n📊 Sticker Copy Summary:`);
  console.log(`  ✅ Copied: ${copied}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log(`\n  ℹ️  Note: Sticker uploads may require server Nitro boost level.`);
    console.log(`     Emojis can be uploaded without Nitro, but stickers have restrictions.`);
  }
}

// ============ CLIENT SETUP ============
const client = new Client();

client.on('ready', async () => {
  displayWarning();
  
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`Starting emoji and sticker copy process...\n`);

  // Validate guilds
  const sourceGuild = client.guilds.cache.get(SOURCE_GUILD_ID);
  const targetGuild = client.guilds.cache.get(TARGET_GUILD_ID);
  
  if (!sourceGuild || !targetGuild) {
    console.error('❌ Invalid guild IDs. Please check SOURCE_GUILD_ID and TARGET_GUILD_ID.');
    console.error(`   Source Guild (${SOURCE_GUILD_ID}): ${sourceGuild ? '✅ Found' : '❌ Not found'}`);
    console.error(`   Target Guild (${TARGET_GUILD_ID}): ${targetGuild ? '✅ Found' : '❌ Not found'}`);
    process.exit(1);
  }

  console.log(`📥 Source: ${sourceGuild.name} (ID: ${SOURCE_GUILD_ID})`);
  console.log(`📤 Target: ${targetGuild.name} (ID: ${TARGET_GUILD_ID})`);

  // Check permissions
  const member = targetGuild.members.cache.get(client.user.id);
  if (!member) {
    console.warn('⚠️  Warning: Could not verify your permissions in the target server');
  } else {
    const hasEmojiPerm = member.permissions.has('MANAGE_EMOJIS_AND_STICKERS');
    if (!hasEmojiPerm) {
      console.warn('⚠️  Warning: You may not have "Manage Emojis and Stickers" permission in the target server');
      console.warn('     This may cause copy operations to fail');
    }
  }

  try {
    // Copy emojis
    await copyEmojis(sourceGuild, targetGuild);
    
    // Copy stickers
    await copyStickers(sourceGuild, targetGuild);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Copy process complete!');
    console.log('='.repeat(80));
    console.log('\nNote: Emoji copying works without Nitro.');
    console.log('Sticker copying may require server Nitro boost level in target server.');
    console.log('\nExiting...\n');
    
  } catch (err) {
    console.error('\n❌ An error occurred during the copy process:');
    console.error(err);
  }
  
  process.exit(0);
});

// Error handling
client.on('error', (error) => {
  console.error('Client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Start the client
console.log('Starting Discord client...');
client.login(TOKEN).catch((err) => {
  console.error('Failed to login:', err.message);
  console.error('Please check your TOKEN in the configuration.');
  process.exit(1);
});
