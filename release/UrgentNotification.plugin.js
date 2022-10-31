/**
 * @name UrgentNotification
 * @description Allow urgent messages to bypass do not disturb mode, streamer mode and others.
 * @version 0.0.2
 * @author YuzuZensai
 * @website https://github.com/YuzuZensai/UrgentNotification
 * @source https://raw.githubusercontent.com/YuzuZensai/UrgentNotification/main/release/UrgentNotification.plugin.js
 */
/*@cc_on
@if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/
const config = {
    info: {
        name: "UrgentNotification",
        authors: [
            {
                name: "YuzuZensai",
                github_username: "YuzuZensai"
            }
        ],
        version: "0.0.2",
        description: "Allow urgent messages to bypass do not disturb mode, streamer mode and others.",
        github: "https://github.com/YuzuZensai/UrgentNotification",
        github_raw: "https://raw.githubusercontent.com/YuzuZensai/UrgentNotification/main/release/UrgentNotification.plugin.js"
    },
    changelog: [
        {
            title: "Complete rewrite",
            type: "improved",
            items: [
                "The plugin is now a complete rewrite of the original plugin. It is now a lot more efficient and has a lot more features.",
                "Check out settings to see what you can do with it.",
                "Fixed tons of bugs."
            ]
        }
    ],
    defaultConfig: [
        {
            type: "textbox",
            id: "triggerCommand",
            name: "Trigger command",
            note: "Trigger command for the urgent notification",
            value: "!urgent"
        },
        {
            type: "switch",
            id: "commandResponseEnabled",
            name: "💬 Enable urgent command reply",
            note: "The plugin will send a confirmation message when the urgent command is triggered back to the user",
            value: true
        },
        {
            type: "switch",
            id: "autoReplyEnabled",
            name: "✉️ Enable AutoReply",
            note: "When a new message is received, the plugin will automatically reply with information about current status and how to trigger the urgent notification",
            value: true
        },
        {
            type: "switch",
            id: "onlyFromFriends",
            name: "🧑‍🤝‍🧑 Friends only mode",
            note: "Only reply back and allow urgent notifications from friends",
            value: true
        },
        {
            type: "category",
            id: "timer",
            name: "⌛ Timer",
            collapsible: true,
            shown: false,
            settings: [
                {
                    type: "slider",
                    id: "commandResponseCooldown",
                    name: "Urgent command cooldown",
                    note: "How long until the user can trigger the urgent command again (in minutes)",
                    value: 5,
                    min: 1,
                    max: 120,
                    markers: [
                        1,
                        5,
                        10,
                        15,
                        20,
                        30,
                        60,
                        90,
                        120
                    ],
                    stickToMarkers: true
                },
                {
                    type: "slider",
                    id: "autoReplyCooldown",
                    name: "AutoReply cooldown",
                    note: "How long until AutoReply can be triggered again (in minutes)",
                    value: 30,
                    min: 5,
                    max: 120,
                    markers: [
                        5,
                        10,
                        15,
                        20,
                        30,
                        60,
                        90,
                        120
                    ],
                    stickToMarkers: true
                },
                {
                    type: "slider",
                    id: "autoReplySelfDeleteCountdown",
                    name: "AutoReply Self Delete Countdown",
                    note: "How long until AutoReply will self delete the message (in minutes)",
                    value: 5,
                    min: 1,
                    max: 120,
                    markers: [
                        1,
                        5,
                        10,
                        15,
                        20,
                        30,
                        60,
                        90,
                        120
                    ],
                    stickToMarkers: true
                }
            ]
        },
        {
            type: "category",
            id: "commandResponseMessage",
            name: "✏️ Customize command response message",
            collapsible: true,
            shown: false,
            settings: [
                {
                    type: "textbox",
                    id: "header",
                    name: "Header",
                    note: "",
                    value: "❗✉️ㅤ**__URGENT NOTIFICATION SENT__**"
                },
                {
                    type: "textbox",
                    id: "body",
                    name: "Body",
                    note: "",
                    value: "If I'm taking too long to respond, please send  send ``!urgent`` again (there is a cooldown)\\nPlease don't abuse the urgent tag. Thanks you"
                }
            ]
        },
        {
            type: "category",
            id: "streaming",
            name: "🔴 [AutoReply] When streaming",
            collapsible: true,
            shown: false,
            settings: [
                {
                    type: "switch",
                    id: "enabled",
                    name: "Enable",
                    note: "",
                    value: true
                },
                {
                    type: "textbox",
                    id: "header",
                    name: "Header",
                    note: "",
                    value: "🌙ㅤ**${username} has notifications silenced**"
                },
                {
                    type: "textbox",
                    id: "body",
                    name: "Body",
                    note: "",
                    value: "🔴ㅤI'm currently streaming or recording, in order to prevent any accidental notifications being shown\\nㅤ ㅤ and other reasons. I'll check my notifications periodically."
                }
            ]
        },
        {
            type: "category",
            id: "dnd",
            name: "🔕 [AutoReply] When do not disturb enabled",
            collapsible: true,
            shown: false,
            settings: [
                {
                    type: "switch",
                    id: "enabled",
                    name: "Enable",
                    note: "",
                    value: true
                },
                {
                    type: "textbox",
                    id: "header",
                    name: "Header",
                    note: "",
                    value: "🌙ㅤ**${username} has notifications silenced**"
                },
                {
                    type: "textbox",
                    id: "body",
                    name: "Body",
                    note: "",
                    value: "🔕ㅤI'm currently busy, I'll respond to you later."
                }
            ]
        },
        {
            type: "category",
            id: "idle",
            name: "🌙 [AutoReply] Idle",
            collapsible: true,
            shown: false,
            settings: [
                {
                    type: "switch",
                    id: "enabled",
                    name: "Enable",
                    note: "",
                    value: true
                },
                {
                    type: "textbox",
                    id: "header",
                    name: "Header",
                    note: "",
                    value: "🌙ㅤ**${username} is currently away**"
                },
                {
                    type: "textbox",
                    id: "body",
                    name: "Body",
                    note: "",
                    value: "💤ㅤI'm currently AFK right now, doing things in real life, or just taking a break."
                }
            ]
        },
        {
            type: "category",
            id: "inVR",
            name: "🥽 [AutoReply] When using VR headset",
            collapsible: true,
            shown: false,
            settings: [
                {
                    type: "switch",
                    id: "enabled",
                    name: "Enable",
                    note: "",
                    value: true
                },
                {
                    type: "textbox",
                    id: "header",
                    name: "Header",
                    note: "",
                    value: "🥽ㅤ**${username} is currently in VR**"
                },
                {
                    type: "textbox",
                    id: "body",
                    name: "Body",
                    note: "",
                    value: " 👁️‍🗨️ㅤI'm currently wearing a VR headset. I might not be able to respond to you right away\\nㅤ ㅤ I'll check my notifications periodically."
                }
            ]
        },
        {
            type: "category",
            id: "general",
            name: "✉️ [AutoReply] Footer text",
            collapsible: true,
            shown: false,
            settings: [
                {
                    type: "textbox",
                    id: "footer",
                    name: "Footer text",
                    note: "",
                    value: "⚠️ㅤIf this is an urgent matter or need to contact me ASAP, please send ``!urgent``."
                }
            ]
        }
    ],
    main: "index.js"
};
class Dummy {
    constructor() {this._config = config;}
    start() {}
    stop() {}
}
 
if (!global.ZeresPluginLibrary) {
    BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.name ?? config.info.name} is missing. Please click Download Now to install it.`, {
        confirmText: "Download Now",
        cancelText: "Cancel",
        onConfirm: () => {
            require("request").get("https://betterdiscord.app/gh-redirect?id=9", async (err, resp, body) => {
                if (err) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                if (resp.statusCode === 302) {
                    require("request").get(resp.headers.location, async (error, response, content) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), content, r));
                    });
                }
                else {
                    await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                }
            });
        }
    });
}
 
module.exports = !global.ZeresPluginLibrary ? Dummy : (([Plugin, Api]) => {
     const plugin = (Plugin, Library) => {
  const { DiscordModules, Logger } = Library;

  const {
    UserStore,
    ChannelStore,
    MessageStore,
    RelationshipStore,
    UserStatusStore,
    StreamerModeStore,
    Dispatcher,
    MessageQueue,
    APIModule,
    MessageActions,
    NavigationUtils,
    NotificationModule,
  } = DiscordModules;

  return class extends Plugin {
    onStart() {
      Logger.info("Plugin enabled!");
      Dispatcher.subscribe("MESSAGE_CREATE", this.onMessage.bind(this));

      if (!global.UrgentNotification)
        global.UrgentNotification = {
          recently_sent: [],
          cooldown: [],
          resetCooldowns: () => {
            global.UrgentNotification.recently_sent = [];
            global.UrgentNotification.cooldown = [];
            Logger.info("Recently sent and cooldown list cleared");
          },
          resetAll: () => {
            global.UrgentNotification.resetCooldowns();
            global.UrgentNotification.purgePendingDeleteNow();
          },
          purgePendingDeleteNow: () => {
            Logger.info("Pending delete messages cleared");
            for (let x in global.UrgentNotification.pending_delete) {
              clearTimeout(x);
              global.UrgentNotification.pending_delete[x].f();
            }
            global.UrgentNotification.pending_delete = {};
          },
        };
      if (!global.UrgentNotification.cooldown)
        global.UrgentNotification.cooldown = [];
      if (!global.UrgentNotification.recently_sent)
        global.UrgentNotification.recently_sent = [];
      if (!global.UrgentNotification.pending_delete)
        global.UrgentNotification.pending_delete = {};
    }

    onStop() {
      Dispatcher.unsubscribe("MESSAGE_CREATE", this.onMessage.bind(this));
      Logger.info("Plugin disabled!");
    }

    getSettings() {
      return this.settings;
    }

    onMessage(data) {
      let channel = ChannelStore.getChannel(data.channelId);
      let isGuild = channel.guild_id != null;
      let isDM = channel.type == 1;

      if (isGuild || !isDM || !data.message) return;

      let message = data.message;
      let isNormalMessage = message.type == 0;

      if (!isNormalMessage) return;

      if (!message.author)
        message = MessageStore.getMessage(channel.id, message.id);

      if (!message.author) return;

      let author = message.author;
      if (author.id === this.getUserID()) return;

      let isFriend = RelationshipStore.isFriend(message.author.id);

      let streamerModeSettings = StreamerModeStore.getSettings();
      let status = UserStatusStore.getStatus(this.getUserID());
      let isStreamerModeEnabled =
        streamerModeSettings.enabled || status === "streaming";

      let activities = UserStatusStore.getActivities(this.getUserID());
      let isVR = activities.some((x) => x.name === "SteamVR");

      if (status === "invisible") return;
      if (status === "online" && !isStreamerModeEnabled && !isVR) return;
      //if (status === "idle") return;

      if (message.content === this.settings.triggerCommand) {
        if (this.settings.onlyFromFriends && !isFriend) {
          Logger.info(
            message.author.username,
            "is not your friend, urgent message ignored"
          );
          return;
        }

        let isCooldown = global.UrgentNotification.cooldown.includes(author.id);
        if (isCooldown) return;

        global.UrgentNotification.cooldown.push(author.id);
        Logger.info("Added", author.username, "to cooldown list");
        setTimeout(() => {
          global.UrgentNotification.cooldown =
            global.UrgentNotification.cooldown.filter((e) => e !== author.id);
          Logger.info("Removed from cooldown", message.author.username);
        }, this.getCommandResponseCooldown());

        this.forceNotify(channel, message);

        if (!this.settings.commandResponseEnabled) return;
        MessageQueue.enqueue(
          {
            type: 0,
            message: {
              channelId: channel.id,
              content: this.makeCommandResponseMessage(
                { username: this.getLocalUsername() },
                this.settings
              ),
              tts: false,
            },
          },
          (data) => {
            Logger.info("Message sent to", message.author.username);
            let newMessage = data.body;
            this.scheduleDelete(
              channel.id,
              newMessage.id,
              this.getAutoReplySelfDeleteCountdown()
            );
            this.sendACK(channel.id, message.id, 2);
          }
        );
      } else {
        if (!this.settings.autoReplyEnabled) return;
        if (this.settings.onlyFromFriends && !isFriend) return;
        let isRecentlySent = global.UrgentNotification.recently_sent.includes(
          author.id
        );
        if (isRecentlySent) return;

        let isCooldown = global.UrgentNotification.cooldown.includes(author.id);
        if (isCooldown) return;

        let messageToSend;
        if (this.settings.streaming.enabled && isStreamerModeEnabled)
          messageToSend = this.makeStreamingMessage(
            { username: this.getLocalUsername() },
            this.settings
          );
        else if (this.settings.dnd.enabled && status === "dnd")
          messageToSend = this.makeDNDMessage(
            { username: this.getLocalUsername() },
            this.settings
          );
        else if (this.settings.inVR.enabled && isVR)
          messageToSend = this.makeInVRMessage(
            { username: this.getLocalUsername() },
            this.settings
          );
        else if (this.settings.idle.enabled && status === "idle")
          messageToSend = this.makeIdleMessage(
            { username: this.getLocalUsername() },
            this.settings
          );
        else return;

        global.UrgentNotification.recently_sent.push(author.id);
        Logger.info("Added", author.username, "to recently sent list");
        setTimeout(() => {
          global.UrgentNotification.recently_sent =
            global.UrgentNotification.recently_sent.filter(
              (e) => e !== author.id
            );
          Logger.info("Removed from recently sent", message.author.username);
        }, this.getAutoReplyCooldown());

        MessageQueue.enqueue(
          {
            type: 0,
            message: {
              channelId: channel.id,
              content: messageToSend,
              tts: false,
            },
          },
          (data) => {
            Logger.info("Message sent to", message.author.username);
            let newMessage = data.body;
            this.scheduleDelete(
              channel.id,
              newMessage.id,
              this.getAutoReplySelfDeleteCountdown()
            );
            this.sendACK(channel.id, message.id, 2);
          }
        );
      }
    }

    getSettingsPanel() {
      return this.buildSettingsPanel().getElement();
    }

    makeStreamingMessage(data, settings) {
      return this.makeMessage(
        data,
        settings.streaming.header,
        settings.streaming.body,
        settings.general.footer
      );
    }

    makeDNDMessage(data, settings) {
      return this.makeMessage(
        data,
        settings.dnd.header,
        settings.dnd.body,
        settings.general.footer
      );
    }

    makeIdleMessage(data, settings) {
      return this.makeMessage(
        data,
        settings.idle.header,
        settings.idle.body,
        settings.general.footer
      );
    }

    makeInVRMessage(data, settings) {
      return this.makeMessage(
        data,
        settings.inVR.header,
        settings.inVR.body,
        settings.general.footer
      );
    }

    makeFancyMessage(text) {
      text = text.replaceAll("\n", "\n> ");
      text = text.replaceAll("\\n", "\n> ");
      if (text.charAt(text.length - 1) == " ") {
        text = text.substring(0, text.length - 1) + " ㅤ\n";
      }
      return `> ${text}`;
    }

    makeCommandResponseMessage(data, settings) {
      return this.makeFancyMessage(
        `\n${settings.commandResponseMessage.header.replaceAll(
          "${username}",
          data.username
        )}\n\n${settings.commandResponseMessage.body.replaceAll(
          "${username}",
          data.username
        )}\n`
      );
    }

    makeMessage(data, header, body, footer) {
      return this.makeFancyMessage(
        `\n${header.replaceAll(
          "${username}",
          data.username
        )}\n\n${body.replaceAll(
          "${username}",
          data.username
        )}\n\n${footer.replaceAll("${username}", data.username)}\n`
      );
    }

    forceNotify(channel, message) {
      NotificationModule.showNotification(
        `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.webp?size=96`,
        `[URGENT] Notification`,
        `from ${message.author.username}`,
        {
          notif_type: "MESSAGE_CREATE",
          notif_user_id: message.author.id,
          message_id: message.id,
          message_type: message.type,
          channel_id: channel.id,
          channel_type: channel.type,
          guild_id: null,
        },
        {
          omitViewTracking: true,
          overrideStreamerMode: true,
          sound: "message1",
          volume: 0.4,
          onClick: () => {
            NavigationUtils.transitionTo(
              `/channels/@me/${channel.id}/${message.id}`,
              undefined,
              undefined
            );
          },
        }
      );
    }

    sendACK(channelID, messageID, count) {
      APIModule.post({
        url: `/channels/${channelID}/messages/${messageID}/ack`,
        body: {
          manual: true,
          mention_count: count,
        },
      });
    }

    scheduleDelete(channelID, messageID, timeout) {
      const f = () => {
        MessageActions.deleteMessage(channelID, messageID);
        delete global.UrgentNotification.pending_delete[x];
      };

      let x = setTimeout(f, timeout);

      global.UrgentNotification.pending_delete[x] = { channelID, messageID, f };
    }

    getAutoReplySelfDeleteCountdown() {
      return this.settings.timer.autoReplySelfDeleteCountdown * 60 * 1000;
    }

    getCommandResponseCooldown() {
      return this.settings.timer.commandResponseCooldown * 60 * 1000;
    }

    getAutoReplyCooldown() {
      return this.settings.timer.autoReplyCooldown * 60 * 1000;
    }

    getUserID() {
      return UserStore.getCurrentUser().id;
    }

    getLocalUsername() {
      return UserStore.getCurrentUser().username;
    }
  };
};
     return plugin(Plugin, Api);
})(global.ZeresPluginLibrary.buildPlugin(config));
/*@end@*/