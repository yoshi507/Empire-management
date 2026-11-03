# Empire Management

A multi-server Discord network management and moderation bot built with Node.js, discord.js v14 and SQLite.

## Commands

| Command | Description |
|---|---|
| `/say` | Make the bot send a message |
| `/staff` | View staff members (permission/role-name detection) |
| `/network` | View network totals and bot connection status |
| `/servers` | List registered network servers |
| `/addserver` | Register a server the bot has joined |
| `/removeserver` | Remove a server from the network registry |
| `/serverinfo` | View details for a server the bot can access |
| `/warn` | Record a warning and attempt to DM the member |
| `/mute` | Timeout a member (1 minute to 28 days) |
| `/unmute` | Remove a timeout |
| `/kick` | Remove a member |
| `/ban` | Ban a member, optionally deleting up to 7 days of messages |
| `/unban` | Reverse a ban using the user's ID |
| `/purge` | Delete up to 100 recent messages |
| `/lock` | Prevent @everyone from sending messages in a channel |
| `/unlock` | Restore the @everyone send-message overwrite |
| `/slowmode` | Set slowmode from 0 to 21,600 seconds |

## Setup

1. Create an application at the [Discord Developer Portal](https://discord.com/developers/applications), add a bot, and copy its token.
2. Enable **Server Members Intent** under Bot → Privileged Gateway Intents.
3. Invite it with OAuth2 scopes `bot` and `applications.commands`. Suggested permissions: View Channels, Send Messages, Embed Links, Read Message History, Manage Messages, Manage Channels, Kick Members, Ban Members and Moderate Members.
4. Install Node.js 20+ and run:

```bash
git clone https://github.com/yoshi507/Empire-management.git
cd Empire-management
npm install
cp .env.example .env
```

5. Put your bot token and application ID in `.env`. Optionally set `OWNER_IDS` to comma-separated trusted network-owner user IDs.
6. Register commands and start the bot:

```bash
npm run deploy
npm start
```

Global slash commands may take a short while to appear.

## Network registry

Use `/addserver server_id:<ID>` to add a server. The bot must already be in that server. Optional description and invite fields can be supplied. Use `/removeserver server_id:<ID>` to remove it. The Discord owner of the server where the command is run, or a user listed in `OWNER_IDS`, can manage the registry.

## Storage and security

- Never commit your `.env` file or share your bot token.
- SQLite stores the network registry and warning history in `data/empire.sqlite` by default. Back up this file.
- Use persistent disk storage on your hosting provider. This bot is designed for one running instance using one SQLite database.
- The bot must have the relevant Discord permissions and its role must be above members it moderates.
- `/staff` detects staff by permissions and common role names; it is not a configurable staff-role system yet.
- The bot does not generate invite links. Supply an invite you have already created.

## Project scripts

- `npm run deploy` — register global slash commands.
- `npm start` — run the bot.
