const { EmbedBuilder } = require('discord.js');

/**
 * Send payment confirmation embed to Discord channel
 * @param {Object} client - Discord.js client instance
 * @param {Object} paymentData - Payment information
 * @returns {Promise<boolean>} - Success status
 */
const sendDiscordEmbed = async (client, paymentData) => {
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

  const channelId = process.env.DISCORD_PAYMENT_CHANNEL_ID;
  
  if (!channelId) {
    console.error('❌ DISCORD_PAYMENT_CHANNEL_ID not configured');
    return false;
  }

  const channel = client.channels.cache.get(channelId);
  
  if (!channel) {
    console.error('❌ Payment channel not found');
    return false;
  }

  // Build avatar URL
  const avatarUrl = avatar 
    ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png?size=256`
    : null;

  // Build embed
  const embed = new EmbedBuilder()
    .setTitle('👑 Royal Paradise Payment Confirmed')
    .setColor(0x9b59b6) // Purple color (#9b59b6)
    .setThumbnail(avatarUrl)
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
      text: "Royal's Paradise • Premium Gaming Services",
      iconURL: client.user?.displayAvatarURL() || null
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

/**
 * Send order status update embed
 * @param {Object} client - Discord.js client instance
 * @param {Object} orderData - Order information
 */
const sendOrderStatusEmbed = async (client, orderData) => {
  const {
    username,
    discordId,
    status,
    orderId,
    services,
    totalAmount,
    currency
  } = orderData;

  const channelId = process.env.DISCORD_PAYMENT_CHANNEL_ID;
  
  if (!channelId) return false;

  const channel = client.channels.cache.get(channelId);
  if (!channel) return false;

  const statusColors = {
    pending: 0xf59e0b,    // Yellow
    paid: 0x10b981,       // Green
    failed: 0xef4444,     // Red
    refunded: 0x6b7280    // Gray
  };

  const embed = new EmbedBuilder()
    .setTitle(`📋 Order ${status.toUpperCase()}`)
    .setColor(statusColors[status] || 0x9b59b6)
    .addFields(
      {
        name: '👤 User',
        value: `[${username}](https://discord.com/users/${discordId})`,
        inline: true
      },
      {
        name: '📦 Order ID',
        value: `\`${orderId}\``,
        inline: true
      },
      {
        name: '💰 Amount',
        value: currency === 'INR' ? `₹${totalAmount}` : `$${totalAmount}`,
        inline: true
      },
      {
        name: '🎮 Services',
        value: services.map(s => s.name).join(', ') || 'N/A',
        inline: false
      }
    )
    .setTimestamp()
    .setFooter({
      text: "Royal's Paradise",
      iconURL: client.user?.displayAvatarURL() || null
    });

  try {
    await channel.send({ embeds: [embed] });
    return true;
  } catch (error) {
    console.error('❌ Failed to send order status embed:', error);
    return false;
  }
};

module.exports = {
  sendDiscordEmbed,
  sendOrderStatusEmbed
};
