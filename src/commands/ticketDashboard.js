// src/commands/ticketDashboard.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
    GUILD_ID,
    loadTicketData,
    saveTicketData
} = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-dashboard')
        .setDescription('Manage ticket system settings (Admin)')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action to perform')
                .setRequired(true)
                .addChoices(
                    { name: 'View Settings', value: 'view' },
                    { name: 'Add Create Role', value: 'add_create' },
                    { name: 'Remove Create Role', value: 'remove_create' },
                    { name: 'Add Claim Role', value: 'add_claim' },
                    { name: 'Remove Claim Role', value: 'remove_claim' },
                    { name: 'Reset Settings', value: 'reset' }
                )
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to add or remove')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        // Only respond in the configured guild
        if (interaction.guildId !== GUILD_ID) {
            return interaction.reply({
                content: '⚠️ This command is only available in the designated server!',
                ephemeral: true
            });
        }
        
        const user = interaction.user;
        
        // Check if user has admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ You need Administrator permission to use this command!',
                ephemeral: true
            });
        }
        
        const action = interaction.options.getString('action');
        const role = interaction.options.getRole('role');
        
        const data = loadTicketData();
        const settings = data.settings;
        
        switch (action) {
            case 'view': {
                // Show current settings
                const createRolesMentions = settings.createRoles?.length > 0
                    ? settings.createRoles.map(roleId => {
                        const roleObj = interaction.guild.roles.cache.get(roleId);
                        return roleObj ? roleObj.toString() : null;
                    }).filter(Boolean).join(', ')
                    : 'Everyone';
                
                const claimRolesMentions = settings.claimRoles?.length > 0
                    ? settings.claimRoles.map(roleId => {
                        const roleObj = interaction.guild.roles.cache.get(roleId);
                        return roleObj ? roleObj.toString() : null;
                    }).filter(Boolean).join(', ')
                    : 'Everyone';
                
                const embed = {
                    title: '🎫 Ticket Dashboard',
                    description: 'Current ticket system settings',
                    color: 0x00ff00,
                    fields: [
                        {
                            name: '📝 Roles that can CREATE tickets',
                            value: createRolesMentions,
                            inline: false
                        },
                        {
                            name: '👮 Roles that can CLAIM tickets',
                            value: claimRolesMentions,
                            inline: false
                        }
                    ],
                    footer: {
                        text: "Niko Robin's Crew",
                        icon_url: interaction.client.user.displayAvatarURL()
                    }
                };
                
                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }
            
            case 'add_create': {
                if (!role) {
                    return interaction.reply({
                        content: '❌ Please specify a role!',
                        ephemeral: true
                    });
                }
                
                if (!settings.createRoles) settings.createRoles = [];
                
                if (!settings.createRoles.includes(role.id)) {
                    settings.createRoles.push(role.id);
                    data.settings = settings;
                    saveTicketData(data);
                    
                    await interaction.reply({
                        content: `✅ Added ${role.toString()} to roles that can create tickets!`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '⚠️ Role already in the list!',
                        ephemeral: true
                    });
                }
                break;
            }
            
            case 'remove_create': {
                if (!role) {
                    return interaction.reply({
                        content: '❌ Please specify a role!',
                        ephemeral: true
                    });
                }
                
                if (!settings.createRoles) settings.createRoles = [];
                
                if (settings.createRoles.includes(role.id)) {
                    settings.createRoles = settings.createRoles.filter(id => id !== role.id);
                    data.settings = settings;
                    saveTicketData(data);
                    
                    await interaction.reply({
                        content: `✅ Removed ${role.toString()} from roles that can create tickets!`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '⚠️ Role not in the list!',
                        ephemeral: true
                    });
                }
                break;
            }
            
            case 'add_claim': {
                if (!role) {
                    return interaction.reply({
                        content: '❌ Please specify a role!',
                        ephemeral: true
                    });
                }
                
                if (!settings.claimRoles) settings.claimRoles = [];
                
                if (!settings.claimRoles.includes(role.id)) {
                    settings.claimRoles.push(role.id);
                    data.settings = settings;
                    saveTicketData(data);
                    
                    await interaction.reply({
                        content: `✅ Added ${role.toString()} to roles that can claim tickets!`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '⚠️ Role already in the list!',
                        ephemeral: true
                    });
                }
                break;
            }
            
            case 'remove_claim': {
                if (!role) {
                    return interaction.reply({
                        content: '❌ Please specify a role!',
                        ephemeral: true
                    });
                }
                
                if (!settings.claimRoles) settings.claimRoles = [];
                
                if (settings.claimRoles.includes(role.id)) {
                    settings.claimRoles = settings.claimRoles.filter(id => id !== role.id);
                    data.settings = settings;
                    saveTicketData(data);
                    
                    await interaction.reply({
                        content: `✅ Removed ${role.toString()} from roles that can claim tickets!`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '⚠️ Role not in the list!',
                        ephemeral: true
                    });
                }
                break;
            }
            
            case 'reset': {
                settings.createRoles = [];
                settings.claimRoles = [];
                data.settings = settings;
                saveTicketData(data);
                
                await interaction.reply({
                    content: '✅ Ticket settings have been reset! Everyone can now create and claim tickets.',
                    ephemeral: true
                });
                break;
            }
        }
    }
};
