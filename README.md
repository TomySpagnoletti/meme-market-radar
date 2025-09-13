# Meme Market Radar

A real-time dashboard to analyze blockchain trading volumes and identify dominant trading protocols. Your radar for market trends.

## Features

- **Real-time Analytics**: Get up-to-the-minute data on blockchain trading volumes.
- **Top Performers**: Identify the top blockchain and leading trading protocol at a glance.
- **Comprehensive Data**: View total trading volume and transaction counts across all supported blockchains.
- **Detailed Breakdown**: Drill down into the data for each individual blockchain.
- **Secure**: Your BitQuery API key is stored securely in your browser's session storage and is never sent to any server other than BitQuery's.

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- BitQuery API

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need to have Node.js and npm installed on your machine. You can use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to manage Node.js versions.

You will also need a BitQuery API key. You can get one for free from the [BitQuery website](https://bitquery.io/).

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/TomySpagnoletti/meme-market-radar.git
    ```
2.  Navigate to the project directory
    ```sh
    cd meme-market-radar
    ```
3.  Install NPM packages
    ```sh
    npm install
    ```
4.  Start the development server
    ```sh
    npm run dev
    ```

Your application will be running at `http://localhost:8080`.

## Usage

1.  Open the application in your browser.
2.  Enter your BitQuery API key.
3.  View the dashboard and analyze the data.

## TODO

- Migrate Realtime Queries to Archived or Combined Dataset to improve the time range actually limited to 8 hours...
