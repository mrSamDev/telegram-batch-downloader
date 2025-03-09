const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

class TelegramFileDownloader {
  constructor(apiId, apiHash, phoneNumber, concurrencyLimit = 5) {
    this.client = null;
    this.session = new StringSession("");
    this.apiId = apiId;
    this.apiHash = apiHash;
    this.phoneNumber = phoneNumber;
    this.concurrencyLimit = concurrencyLimit;
  }

  async connect() {
    this.client = new TelegramClient(this.session, this.apiId, this.apiHash, {
      connectionRetries: 5,
    });

    await this.client.start({
      phoneNumber: this.phoneNumber,
      phoneCode: async () => await input.text("Please enter the code you received: "),
      onError: (err) => console.log(err),
    });

    console.log("Client connected successfully");
    return this.client;
  }

  async findChat(chatName) {
    try {
      const dialogs = await this.client.getDialogs();
      const targetChat = dialogs.find((dialog) => dialog.name.toLowerCase().includes(chatName.toLowerCase()));

      if (!targetChat) {
        throw new Error(`No chat found with name containing "${chatName}"`);
      }

      return targetChat.entity;
    } catch (error) {
      console.error("Error finding chat:", error);
      throw error;
    }
  }

  async processBatch(tasks) {
    return Promise.all(tasks.map((task) => task()));
  }

  fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  async downloadARWFilesFromChat(chatName, downloadLimit = 500) {
    try {
      const chat = await this.findChat(chatName);

      const downloadDir = path.join(__dirname, "telegram_arw_downloads");
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const messages = await this.client.getMessages(chat, {
        limit: downloadLimit,
      });

      const downloadTasks = [];
      const skippedFiles = [];
      const downloadedFiles = [];

      for (const message of messages) {
        if (message.media && message.media.document) {
          const document = message.media.document;

          const attributes = document.attributes || [];
          const fileNameAttr = attributes.find((attr) => attr.fileName);
          console.log("fileNameAttr: ", fileNameAttr);

          if (fileNameAttr && fileNameAttr.fileName.match(/DS.*\.ARW$/i)) {
            const fileName = fileNameAttr.fileName;
            const downloadPath = path.join(downloadDir, fileName);

            if (this.fileExists(downloadPath)) {
              skippedFiles.push({
                name: fileName,
                path: downloadPath,
                reason: "already exists",
              });
              continue;
            }

            downloadTasks.push(async () => {
              try {
                await this.client.downloadMedia(message, {
                  outputFile: downloadPath,
                });

                const fileInfo = {
                  path: downloadPath,
                  name: fileName,
                  timestamp: Date.now(),
                };

                console.log(`Downloaded: ${fileName}`);
                return fileInfo;
              } catch (downloadError) {
                console.error(`Error downloading ${fileName}:`, downloadError.message);
                return null;
              }
            });
          }
        }
      }

      if (downloadTasks.length > 0) {
        console.log(`Found ${downloadTasks.length} ARW files to download`);
        console.log(`Skipping ${skippedFiles.length} already existing files`);

        for (let i = 0; i < downloadTasks.length; i += this.concurrencyLimit) {
          const batch = downloadTasks.slice(i, i + this.concurrencyLimit);
          console.log(`Processing batch ${Math.floor(i / this.concurrencyLimit) + 1}/${Math.ceil(downloadTasks.length / this.concurrencyLimit)}`);

          const results = await this.processBatch(batch);
          downloadedFiles.push(...results.filter((result) => result !== null));
        }
      } else {
        console.log("No new ARW files to download");
      }

      console.log(`Download summary for "${chatName}":`);
      console.log(`- Total files processed: ${downloadTasks.length + skippedFiles.length}`);
      console.log(`- Files downloaded: ${downloadedFiles.length}`);
      console.log(`- Files skipped: ${skippedFiles.length}`);

      return {
        downloaded: downloadedFiles,
        skipped: skippedFiles,
      };
    } catch (error) {
      console.error("Error downloading files:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
    }
  }
}

const config = {
  apiId: process.env.APP_ID,
  apiHash: process.env.APP_HASH,
  phoneNumber: process.env.PHONE_NUMBER,
  chatName: process.env.CHAT_NAME || "chat name",
  concurrencyLimit: parseInt(process.env.CONCURRENCY_LIMIT || "10"),
};

async function main() {
  const downloader = new TelegramFileDownloader(config.apiId, config.apiHash, config.phoneNumber, config.concurrencyLimit);

  try {
    await downloader.connect();
    const result = await downloader.downloadARWFilesFromChat(config.chatName);

    if (result.downloaded.length > 0) {
      console.log("\nDownloaded files:");
      result.downloaded.forEach((file) => {
        console.log(`- ${file.name}`);
      });
    }

    if (result.skipped.length > 0) {
      console.log("\nSkipped files (already exist):");
      result.skipped.forEach((file) => {
        console.log(`- ${file.name}`);
      });
    }

    console.log("\nDownload process complete!");
  } catch (error) {
    console.error("Main function error:", error);
    console.error(error.stack);
  } finally {
    await downloader.disconnect();
  }
}

main().catch(console.error);
