const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let isReady = false;

client.on('ready', () => {
  isReady = true;
  console.log(`🤖 Discord Bot logged in as: ${client.user.tag}`);
  console.log(`📍 Payment Channel ID: ${process.env.DISCORD_PAYMENT_CHANNEL_ID}`);
});

client.on('disconnect', () => {
  isReady = false;
  console.warn('⚠️ Bot disconnected. Attempting to reconnect...');
});

client.on('reconnecting', () => {
  console.log('🔄 Bot reconnecting...');
});

client.on('error', (error) => {
  console.error('❌ Discord Bot Error:', error);
});

// Function to send payment confirmation embed
const sendPaymentEmbed = async (paymentData) => {
  if (!isReady) {
    console.warn('⚠️ Bot not ready, cannot send embed');
    return false;
  }

  const {
    username,
    discordId,
    avatar,
    serviceName,
    game,
    amount,
    currency,
    paymentMethod,
    paymentId
  } = paymentData;

  const channel = client.channels.cache.get(process.env.DISCORD_PAYMENT_CHANNEL_ID);
  
  if (!channel) {
    console.error('❌ Payment channel not found');
    return false;
  }

  const embed = new EmbedBuilder()
    .setTitle('👑 Royal Paradise Payment Confirmed')
    .setColor(0x9b59b6) // Purple color
    .setThumbnail(avatar || null)
    .setImage(process.env.WEBSITE背景_IMAGE_URL || null)
    .addFields(
      {
        name: '👤 User',
        value: `[${username}](https://discord.com/users/${discordId})`,
        inline: true
      },
      {
        name: '🎮 Service',
        value: serviceName,
        inline: true
      },
      {
        name: '🎯 Game',
        value: game,
        inline: true
      },
      {
        name: '💰 Amount',
        value: currency === 'INR' ? `₹${amount}` : `$${amount}`,
        inline: true
      },
      {
        name: '💳 Payment Method',
        value: paymentMethod,
        inline: true
      },
      {
        name: '🔔 Payment ID',
        value: `\`${paymentId}\``,
        inline: true
      },
      {
        name: '✅ Verification',
        value: '**PAID**',
        inline: false
      }
    )
    .setTimestamp()
    .setFooter({
      text: 'Royal\'s Paradise • Premium Gaming Services',
      iconURL: client.user.displayAvatarURL()
    });

  try {
    await channel.send({ embeds: [embed] });
    console.log(`✅ Payment embed sent for user: ${username}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send payment embed:', error);
    return false;
  }
};

// Start the bot
const startBot = () => {
  if (process.env.DISCORD_BOT_TOKEN) {
    client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
      console.error('❌ Failed to login bot:', err);
    });
  } else {
    console.warn('⚠️ Discord Bot Token not provided. Bot will not start.');
  }
};

module.exports = { startBot, sendPaymentEmbed, client };
