<div align="center">🌸 Niko Robin Discord Bot

<img src="https://i.imgur.com/7x5KXkP.png" width="120">A private single-guild Discord bot built with Node.js & discord.js v14
Ticket system • Welcome system • Auto-roles • Dashboard • Render ready

<br>"Node.js" (https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
"Discord.js" (https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord)
"Render" (https://img.shields.io/badge/Render-Hosting-46E3B7?style=for-the-badge&logo=render&logoColor=black)
"License" (https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

</div>---

✨ Features

🎟 Ticket System

• "/ticket" slash command
• Private ticket channels
• Claim & Close buttons
• Staff role permissions
• Ticket category auto creation

---

👋 Welcome System

• Sends welcome embed with image
• Auto assigns user role

---

🚪 Leave System

• Sends goodbye embed when user leaves

---

⚡ Ping Command

"/ping"

Shows:

• API latency
• Bot latency
• Banner image

---

🎛 Web Dashboard

Simple web panel for configuring ticket roles.

You can choose:

• Which roles can create tickets
• Which roles can claim tickets

---

🛡 Private Bot

This bot only works inside one guild.

This makes it perfect for:

• Private communities
• Project servers
• Moderation utilities

---

🗂 Project Structure

niko-robin/
│
├── assets/
│   ├── banner.jpg
│   ├── welcome.jpg
│   └── leave.jpg
│
├── commands/
│   ├── ping.js
│   └── ticket.js
│
├── public/
│   ├── index.html
│   └── dashboard.js
│
├── config.json
├── index.js
├── package.json
├── .env
└── README.md

---

⚙ Environment Variables

Create a ".env" file:

DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_server_id
DASHBOARD_PASSWORD=your_dashboard_password
PORT=10000

---

📦 Installation

Clone repository

git clone https://github.com/yourusername/niko-robin.git
cd niko-robin

Install dependencies

npm install

Run bot

npm start

---

☁ Deploy on Render

1️⃣ Push project to GitHub

2️⃣ Open
https://render.com

3️⃣ Create New Web Service

4️⃣ Configure

Setting| Value
Runtime| Node
Build Command| npm install
Start Command| npm start

5️⃣ Add environment variables

Deploy 🎉

---

🎟 Ticket Command

Create ticket:

/ticket

The bot will create:

ticket-XXXX

Inside the channel you will see:

Claim → staff takes ticket
Close → deletes ticket

---

🎛 Dashboard

Open dashboard:

https://your-render-app.onrender.com

Enter password:

DASHBOARD_PASSWORD

From here you can manage ticket roles.

---

🖼 Required Assets

Add these images inside the assets folder

File| Used For
banner.jpg| ping & ticket embeds
welcome.jpg| welcome embed
leave.jpg| leave embed

---

🛠 Tech Stack

• Node.js
• discord.js v14
• Express
• Render hosting

---

📜 License

MIT License

---

<div align="center">👤 Author

Kazuto

Inspired by
🏴‍☠️ Nico Robin from One Piece

</div>