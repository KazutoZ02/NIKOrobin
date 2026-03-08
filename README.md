<div align="center">

# 🌸 Niko Robin Discord Bot

<img src="./assets/logo.jpg" width="120" alt="Niko Robin Logo">

**A private, single-guild Discord bot built with Node.js & discord.js v14** *Ticket system • Welcome system • Auto-roles • Dashboard • Render ready*

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord)
![Render](https://img.shields.io/badge/Render-Hosting-46E3B7?style=for-the-badge&logo=render&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

</div>

---

## ✨ Features

### 🎟 Ticket System
* **`/ticket` Slash Command:** Easily open support tickets.
* **Private Channels:** Keeps conversations isolated between users and staff.
* **Interactive Buttons:** Quick "Claim" and "Close" UI for server staff.
* **Auto-Categories:** Automatically creates and organizes ticket categories.

### 👋 Welcome & 🚪 Leave Systems
* **Welcome Embeds:** Greets new members with a customized image embed.
* **Auto-Roles:** Automatically assigns a default role to users upon joining.
* **Leave Embeds:** Sends a goodbye message when a user departs the server.

### 🎛 Web Dashboard
A simple, clean web panel for configuring ticket roles dynamically.
* Select which roles are allowed to **create** tickets.
* Select which roles are allowed to **claim** tickets.

### ⚡ Utility
* **`/ping` Command:** Displays API latency, Bot latency, and a custom banner image.
* **Private Guild Design:** Built specifically to operate within a single guild. Perfect for private communities, project servers, or moderation utilities.

---

## 🛠 Tech Stack

* **Node.js** (v18+)
* **discord.js** (v14)
* **Express** (For the Web Dashboard)
* **Render** (Optimized for cloud deployment)

---

## 🗂 Project Structure

```text
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
