🌸 Niko Robin — Private Discord Bot

«A private single-guild Discord bot built with Node.js + discord.js v14.
Includes a ticket system, welcome/leave system, auto-roles, slash commands, and a web dashboard — fully compatible with Render free tier hosting.»

---

✨ Features

- 🎟 Ticket System
  
  - "/ticket" command to create tickets
  - Claim & close buttons
  - Role-based permissions
  - Private ticket channels

- 👋 Welcome System
  
  - Sends welcome embed with image
  - Auto-assigns user role on join

- 🚪 Leave System
  
  - Sends leave embed with custom image

- ⚡ Ping Command
  
  - "/ping" shows bot latency
  - Includes banner image

- 🎛 Web Dashboard
  
  - Configure ticket permissions
  - Choose which roles can:
    - raise tickets
    - claim tickets
  - Simple password protection

- 🛡 Private Bot
  
  - Works only in one guild

- ☁ Render Compatible
  
  - Ready for Render free tier web service

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

Create a ".env" file or set these on Render:

DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_server_id
DASHBOARD_PASSWORD=your_dashboard_password
PORT=10000

---

📦 Installation

Clone the repository

git clone https://github.com/yourusername/niko-robin.git
cd niko-robin

Install dependencies

npm install

Start the bot

npm start

---

☁ Deploy on Render

1️⃣ Push the project to GitHub

2️⃣ Create a new Render Web Service

3️⃣ Use these settings

Setting| Value
Runtime| Node
Build Command| "npm install"
Start Command| "npm start"

4️⃣ Add environment variables in Render dashboard

5️⃣ Deploy 🎉

---

🎟 Ticket System

Users can open tickets using:

/ticket

Ticket channels include:

- Claim Button → Staff claims ticket
- Close Button → Deletes ticket after 5 seconds

Permissions are managed in the web dashboard.

---

🎛 Dashboard

Access the dashboard from:

https://your-render-app.onrender.com

Login with the password set in:

DASHBOARD_PASSWORD

Dashboard lets you configure:

- Roles that can create tickets
- Roles that can claim tickets

---

🖼 Required Assets

Place these images inside the "assets/" folder:

File| Used For
"banner.jpg"| Ping & ticket embeds
"welcome.jpg"| Welcome message
"leave.jpg"| Leave message

---

🛠 Tech Stack

- Node.js
- discord.js v14
- Express
- Render Hosting

---

📜 License

MIT License

---

👤 Author

Created by Kazuto

«Inspired by the legendary archaeologist
Nico Robin from One Piece 🏴‍☠️»