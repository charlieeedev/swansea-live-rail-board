# 🚆 Swansea Live Rail Board

A modern, station-style **live departures and arrivals board for Swansea Railway Station (SWA)**, powered by **National Rail Darwin** real-time railway data.

The project recreates the look and feel of a traditional UK railway station departure board, including yellow service indicators, platform information, operators, live statuses and automatic updates.

## ✨ Features

* 🟡 Station-style yellow service indicators
* 🚆 Live **Departures** and **Arrivals**
* 🕐 Live digital clock and date
* 📍 Swansea Railway Station — **SWA**
* 🚉 Destination and origin information
* 🛤️ Platform information
* 🚄 Train operating company information
* 🟢 On-time status indicators
* 🟡 Due / expected services
* 🔴 Delayed and cancelled service indicators
* 🔄 Automatic data refresh every 30 seconds
* 📱 Responsive design for desktop, tablet and mobile
* 🔐 Darwin API token kept securely on the server

## 🛠️ Technologies

This project uses:

* **HTML5** — Website structure
* **CSS3** — Station-board styling and responsive design
* **JavaScript** — Live board functionality
* **Node.js** — Backend server
* **Express** — API server
* **xml2js** — Darwin XML response parsing
* **dotenv** — Secure environment variable management
* **National Rail Darwin** — Real-time train running data

## 🚉 Station

The board is configured for:

**Swansea Railway Station**

* CRS Code: `SWA`
* Location: Swansea, Wales
* Country: United Kingdom

## 📡 Darwin API

The live railway information is provided through the **National Rail Darwin real-time information service**.

The browser does **not** communicate directly with Darwin. Instead, the Node.js backend securely requests the d
