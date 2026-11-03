require("dotenv").config();
const { REST, Routes, SlashCommandBuilder, ChannelType } = require("discord.js");
const commands = [
 new SlashCommandBuilder().setName("say").setDescription("Make the bot send a message").addStringOption(o=>o.setName("message").setDescription("Message to send").setRequired(true).setMaxLength(2000)).addChannelOption(o=>o.setName("channel").setDescription("Destination").addChannelTypes(ChannelType.GuildText,ChannelType.GuildAnnouncement)),
 new SlashCommandBuilder().setName("staff").setDescription("View staff members"),
 new SlashCommandBuilder().setName("network").setDescription("View network information"),
 new SlashCommandBuilder().setName("servers").setDescription("List network servers"),
 new SlashCommandBuilder().setName("addserver").setDescription("Add a server to the network").addStringOption(o=>o.setName("server_id").setDescription("Discord server ID").setRequired(true)).addStringOption(o=>o.setName("description").setDescription("Server description").setMaxLength(300)).addStringOption(o=>o.setName("invite").setDescription("Discord invite URL")),
 new SlashCommandBuilder().setName("removeserver").setDescription("Remove a server from the network").addStringOption(o=>o.setName("server_id").setDescription("Discord server ID").setRequired(true)),
 new SlashCommandBuilder().setName("serverinfo").setDescription("View server information").addStringOption(o=>o.setName("server_id").setDescription("Server ID; defaults to this server")),
 new SlashCommandBuilder().setName("warn").setDescription("Warn a member").addUserOption(o=>o.setName("member").setDescription("Member").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(true).setMaxLength(500)),
 new SlashCommandBuilder().setName("mute").setDescription("Timeout a member").addUserOption(o=>o.setName("member").setDescription("Member").setRequired(true)).addIntegerOption(o=>o.setName("minutes").setDescription("Duration in minutes (1-40320)").setRequired(true).setMinValue(1).setMaxValue(40320)).addStringOption(o=>o.setName("reason").setDescription("Reason").setMaxLength(500)),
 new SlashCommandBuilder().setName("unmute").setDescription("Remove a timeout").addUserOption(o=>o.setName("member").setDescription("Member").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setMaxLength(500)),
 new SlashCommandBuilder().setName("kick").setDescription("Remove a member").addUserOption(o=>o.setName("member").setDescription("Member").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setMaxLength(500)),
 new SlashCommandBuilder().setName("ban").setDescription("Ban a member").addUserOption(o=>o.setName("member").setDescription("Member").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setMaxLength(500)).addIntegerOption(o=>o.setName("delete_days").setDescription("Days of messages to delete (0-7)").setMinValue(0).setMaxValue(7)),
 new SlashCommandBuilder().setName("unban").setDescription("Reverse a ban").addStringOption(o=>o.setName("user_id").setDescription("User ID").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setMaxLength(500)),
 new SlashCommandBuilder().setName("purge").setDescription("Delete messages").addIntegerOption(o=>o.setName("amount").setDescription("Number to delete (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)),
 new SlashCommandBuilder().setName("lock").setDescription("Lock a channel").addChannelOption(o=>o.setName("channel").setDescription("Channel").addChannelTypes(ChannelType.GuildText,ChannelType.GuildAnnouncement)),
 new SlashCommandBuilder().setName("unlock").setDescription("Unlock a channel").addChannelOption(o=>o.setName("channel").setDescription("Channel").addChannelTypes(ChannelType.GuildText,ChannelType.GuildAnnouncement)),
 new SlashCommandBuilder().setName("slowmode").setDescription("Set slowmode").addIntegerOption(o=>o.setName("seconds").setDescription("Delay in seconds (0-21600)").setRequired(true).setMinValue(0).setMaxValue(21600)).addChannelOption(o=>o.setName("channel").setDescription("Channel").addChannelTypes(ChannelType.GuildText,ChannelType.GuildAnnouncement))
].map(c=>c.toJSON());
async function main(){
 if(!process.env.DISCORD_TOKEN||!process.env.CLIENT_ID) throw new Error("Set DISCORD_TOKEN and CLIENT_ID in .env first.");
 const rest=new REST({version:"10"}).setToken(process.env.DISCORD_TOKEN);
 await rest.put(Routes.applicationCommands(process.env.CLIENT_ID),{body:commands});
 console.log(`Registered ${commands.length} global slash commands.`);
}
main().catch(e=>{console.error(e);process.exit(1);});
