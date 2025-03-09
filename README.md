# Telegram ARW File Downloader

A Node.js tool to automatically download ARW files from a Telegram chat.

This project was inspired by the blog post: [Building a Telegram File Downloader](https://www.sijosam.in/blog/telegram-code-downloader/)

## Features

- Connects to Telegram API
- Searches for files matching DS\*.ARW pattern
- Downloads files with concurrent operation support
- Skips already downloaded files
- Configurable via environment variables

## Requirements

- Node.js 18.x or later
- Telegram API credentials (API ID and API Hash)

## Installation

### Using npm

```bash
# Clone this repository
git clone https://github.com/mrSamDev/telegram-batch-downloader telegram-arw-downloader
cd telegram-arw-downloader

# Install dependencies
npm install
```

### Using pnpm

```bash
# Clone this repository
git clone https://github.com/mrSamDev/telegram-batch-downloader telegram-arw-downloader
cd telegram-arw-downloader

# Install dependencies
pnpm install
```

### Using bun

```bash
# Clone this repository
git clone https://github.com/mrSamDev/telegram-batch-downloader telegram-arw-downloader
cd telegram-arw-downloader

# Install dependencies
bun install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
APP_ID=your_telegram_api_id
APP_HASH=your_telegram_api_hash
PHONE_NUMBER=your_phone_number_with_country_code
CHAT_NAME=target_chat_name
CONCURRENCY_LIMIT=10
```

### How to get Telegram API credentials

1. Visit https://my.telegram.org/auth
2. Log in with your phone number
3. Go to "API development tools"
4. Create a new application
5. Copy the API ID and API Hash to your `.env` file

## Usage

### Using npm

```bash
npm start
```

### Using pnpm

```bash
pnpm start
```

### Using bun

```bash
bun run server.js
```

## How It Works

1. The script connects to your Telegram account (you'll need to enter the authentication code sent to your Telegram app)
2. It searches for the specified chat by name
3. It scans messages for ARW files matching the pattern "DS\*.ARW"
4. Files are downloaded to a "telegram_arw_downloads" folder in the project directory
5. The script avoids downloading files that already exist

## Customization

You can modify the regex pattern in the code to match different file types or naming patterns.

## License

MIT
