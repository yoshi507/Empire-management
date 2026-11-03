require("dotenv").config();
const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require("discord.js");
const store = require("./database");
if(!process.env.DISCORD_TOKEN){console.error("Missing DISCORD_TOKEN. Copy .env.example to .env.");process.exit(1);}
const client = new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildModeration]});
const C={brand:0x5865F2,success:0x57F287,error:0xED4245};
const owners=new Set((process.env.OWNER_IDS||"").split(",").map(x=>x.trim()).filter(Boolean));
const makeEmbed=(title,description,color=C.brand)=>new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();
const clean=value=>String(value??"Not set").slice(0,900);
const ownerCheck=i=>owners.has(i.user.id)||i.user.id===i.guild?.ownerId;
const reason=i=>i.options.getString("reason")||`Action by ${i.user.tag}`;
async function permission(i,p){if(!i.memberPermissions?.has(p)){await i.reply({content:"You don't have permission to use this command.",flags:MessageFlags.Ephemeral});return false;}return true;}
async function target(i,user){return i.guild.members.fetch(user.id).catch(()=>null);}
async function done(i,title,description){return i.reply({embeds:[makeEmbed(title,description,C.success)]});}

client.once("ready",()=>{console.log(`Empire Management online as ${client.user.tag} in ${client.guilds.cache.size} server(s).`);client.user.setActivity("the Empire network",{type:3});});
client.on("guildCreate",g=>console.log(`Joined ${g.name} (${g.id})`));
client.on("guildDelete",g=>console.log(`Left ${g.name} (${g.id})`));

client.on("interactionCreate",async i=>{
 if(!i.isChatInputCommand())return;
 const cmd=i.commandName;
 try{
  if(!i.guild)return i.reply({content:"Use this command inside a server.",flags:MessageFlags.Ephemeral});
  switch(cmd){
   case "say":{
    if(!await permission(i,PermissionFlagsBits.ManageMessages))return;
    const ch=i.options.getChannel("channel")||i.channel;
    if(!ch?.send)return i.reply({content:"I can't send messages in that channel.",flags:MessageFlags.Ephemeral});
    await ch.send({content:i.options.getString("message"),allowedMentions:{parse:[]}});
    return i.reply({content:`Message sent in ${ch}.`,flags:MessageFlags.Ephemeral});
   }
   case "staff":{
    await i.deferReply();
    const members=await i.guild.members.fetch();
    const staff=members.filter(m=>m.permissions.has(PermissionFlagsBits.Administrator)||m.permissions.has(PermissionFlagsBits.ManageGuild)||m.permissions.has(PermissionFlagsBits.ModerateMembers)||m.roles.cache.some(r=>/staff|moderator|admin|management/i.test(r.name)));
    const lines=staff.map(m=>`• ${m.user.tag} — \`${m.id}\``).slice(0,40);
    return i.editReply({embeds:[makeEmbed(`Staff — ${i.guild.name}`,lines.length?lines.join("\n"):"No staff members detected. Detection uses moderation permissions and common staff role names.")]});
   }
   case "network":{
    const servers=store.listServers();
    const count=servers.reduce((n,s)=>n+(client.guilds.cache.get(s.guild_id)?.memberCount||0),0);
    return i.reply({embeds:[makeEmbed("Empire Network",`**Registered servers:** ${servers.length}\n**Bot-connected servers:** ${client.guilds.cache.size}\n**Members in registered servers (available data):** ${count.toLocaleString()}\n\nUse \`/servers\` for the network directory.`)]});
   }
   case "servers":{
    const servers=store.listServers();
    const lines=servers.map((s,n)=>{const live=client.guilds.cache.get(s.guild_id);return `**${n+1}. ${clean(s.guild_name)}** ${live?"🟢":"⚪"}\nID: \`${s.guild_id}\`${s.description?`\n${clean(s.description)}`:""}${s.invite_url?`\n[Join server](${s.invite_url})`:""}`;});
    return i.reply({embeds:[makeEmbed("Empire Network Servers",lines.length?lines.join("\n\n").slice(0,4000):"No servers registered yet.")]});
   }
   case "addserver":{
    if(!ownerCheck(i))return i.reply({content:"Only the server owner or a configured network owner can manage the registry.",flags:MessageFlags.Ephemeral});
    const id=i.options.getString("server_id");
    if(!/^\d{17,20}$/.test(id))return i.reply({content:"That is not a valid Discord server ID.",flags:MessageFlags.Ephemeral});
    const g=await client.guilds.fetch(id).catch(()=>null);
    if(!g)return i.reply({content:"I can't find that server. The bot must have joined it first.",flags:MessageFlags.Ephemeral});
    const invite=i.options.getString("invite")||"";
    if(invite&&!/^https?:\/\/(discord\.gg|discord\.com\/invite)\//i.test(invite))return i.reply({content:"Please provide a valid Discord invite URL.",flags:MessageFlags.Ephemeral});
    store.addServer({guild_id:g.id,guild_name:g.name,description:i.options.getString("description")||"",invite_url:invite,added_by:i.user.id,added_at:new Date().toISOString()});
    return done(i,"Server added",`**${g.name}** has been added to the Empire network.`);
   }
   case "removeserver":{
    if(!ownerCheck(i))return i.reply({content:"Only the server owner or a configured network owner can manage the registry.",flags:MessageFlags.Ephemeral});
    const id=i.options.getString("server_id"),existing=store.getServer(id);
    if(!existing)return i.reply({content:"That server isn't registered.",flags:MessageFlags.Ephemeral});
    store.removeServer(id);return done(i,"Server removed",`**${clean(existing.guild_name)}** has been removed from the network.`);
   }
   case "serverinfo":{
    const id=i.options.getString("server_id")||i.guild.id;
    const g=await client.guilds.fetch(id).catch(()=>null);
    if(!g)return i.reply({content:"I can't access that server. The bot must be a member.",flags:MessageFlags.Ephemeral});
    const full=await g.fetch(),registered=store.getServer(id),owner=await client.users.fetch(full.ownerId).catch(()=>null);
    const e=makeEmbed(full.name,registered?.description||"Server information");
    if(full.iconURL())e.setThumbnail(full.iconURL({size:256}));
    e.addFields({name:"Server ID",value:full.id,inline:true},{name:"Owner",value:owner?.tag||full.ownerId,inline:true},{name:"Members",value:String(full.memberCount??"Unknown"),inline:true},{name:"Created",value:`<t:${Math.floor(full.createdTimestamp/1000)}:D>`,inline:true},{name:"Network status",value:registered?"Registered":"Not registered",inline:true},{name:"Channels",value:String(full.channels.cache.size),inline:true});
    return i.reply({embeds:[e]});
   }
   case "warn":{
    if(!await permission(i,PermissionFlagsBits.ModerateMembers))return;
    const user=i.options.getUser("member"),m=await target(i,user);
    if(!m)return i.reply({content:"That member isn't in this server.",flags:MessageFlags.Ephemeral});
    const why=reason(i);store.addWarning(i.guild.id,user.id,i.user.id,why);
    await user.send({embeds:[makeEmbed(`Warning in ${i.guild.name}`,why,C.error)]}).catch(()=>{});
    return done(i,"Member warned",`**${user.tag}** has been warned.\n**Reason:** ${clean(why)}\n**Recorded warnings:** ${store.listWarnings(i.guild.id,user.id).length}`);
   }
   case "mute":{
    if(!await permission(i,PermissionFlagsBits.ModerateMembers))return;
    const user=i.options.getUser("member"),m=await target(i,user);
    if(!m)return i.reply({content:"That member isn't in this server.",flags:MessageFlags.Ephemeral});
    if(!m.moderatable)return i.reply({content:"I can't timeout that member. Check role hierarchy and permissions.",flags:MessageFlags.Ephemeral});
    const mins=i.options.getInteger("minutes");await m.timeout(mins*60000,reason(i));
    return done(i,"Member timed out",`**${user.tag}** timed out for **${mins} minute(s)**.\n**Reason:** ${clean(reason(i))}`);
   }
   case "unmute":{
    if(!await permission(i,PermissionFlagsBits.ModerateMembers))return;
    const user=i.options.getUser("member"),m=await target(i,user);
    if(!m)return i.reply({content:"That member isn't in this server.",flags:MessageFlags.Ephemeral});
    if(!m.moderatable)return i.reply({content:"I can't modify that member. Check role hierarchy.",flags:MessageFlags.Ephemeral});
    await m.timeout(null,reason(i));return done(i,"Timeout removed",`The timeout for **${user.tag}** has been removed.`);
   }
   case "kick":{
    if(!await permission(i,PermissionFlagsBits.KickMembers))return;
    const user=i.options.getUser("member"),m=await target(i,user);
    if(!m)return i.reply({content:"That member isn't in this server.",flags:MessageFlags.Ephemeral});
    if(!m.kickable)return i.reply({content:"I can't kick that member. Check role hierarchy.",flags:MessageFlags.Ephemeral});
    await m.kick(reason(i));return done(i,"Member kicked",`**${user.tag}** was kicked.\n**Reason:** ${clean(reason(i))}`);
   }
   case "ban":{
    if(!await permission(i,PermissionFlagsBits.BanMembers))return;
    const user=i.options.getUser("member"),m=await target(i,user);
    if(m&&!m.bannable)return i.reply({content:"I can't ban that member. Check role hierarchy.",flags:MessageFlags.Ephemeral});
    const days=i.options.getInteger("delete_days")??0;
    await i.guild.members.ban(user.id,{reason:reason(i),deleteMessageSeconds:days*86400});
    return done(i,"Member banned",`**${user.tag}** was banned.\n**Reason:** ${clean(reason(i))}`);
   }
   case "unban":{
    if(!await permission(i,PermissionFlags.BanMembers))return;
    const id=i.options.getString("user_id");
    if(!/^\d{17,20}$/.test(id))return i.reply({content:"Enter a valid Discord user ID.",flags:MessageFlags.Ephemeral});
    await i.guild.members.unban(id,reason(i));return done(i,"User unbanned",`User \`${id}\` has been unbanned.`);
   }
   case "purge":{
    if(!await permission(i,PermissionFlags.ManageMessages))return;
    if(!i.channel?.bulkDelete)return i.reply({content:"This command only works in text channels.",flags:MessageFlags.Ephemeral});
    const deleted=await i.channel.bulkDelete(i.options.getInteger("amount"),true);
    return i.reply({content:`Deleted ${deleted.size} message(s). Messages older than 14 days cannot be bulk deleted.`,flags:MessageFlags.Ephemeral});
   }
   case "lock":case "unlock":{
    if(!await permission(i,PermissionFlags.ManageChannels))return;
    const ch=i.options.getChannel("channel")||i.channel;
    if(!ch?.permissionOverwrites)return i.reply({content:"Choose a supported text channel.",flags:MessageFlags.Ephemeral});
    await ch.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:cmd==="lock"?false:null},{reason:`${cmd} by ${i.user.tag}`});
    return done(i,cmd==="lock"?"Channel locked":"Channel unlocked",`${ch} has been ${cmd==="lock"?"locked":"unlocked"}.`);
   }
   case "slowmode":{
    if(!await permission(i,PermissionFlagsBits.ManageChannels))return;
    const ch=i.options.getChannel("channel")||i.channel;
    if(!ch?.setRateLimitPerUser)return i.reply({content:"Choose a supported text channel.",flags:MessageFlags.Ephemeral});
    const seconds=i.options.getInteger("seconds");await ch.setRateLimitPerUser(seconds,`Slowmode changed by ${i.user.tag}`);
    return done(i,"Slowmode updated",`${ch} slowmode is now **${seconds} second(s)**.`);
   }
  }
 }catch(err){
  console.error(`/${cmd} failed:`,err);
  const payload={content:"Something went wrong. Check my permissions, role position, and bot logs.",flags:MessageFlags.Ephemeral};
  if(i.deferred||i.replied)await i.followUp(payload).catch(()=>{});else await i.reply(payload).catch(()=>{});
 }
});
client.login(process.env.DISCORD_TOKEN);
