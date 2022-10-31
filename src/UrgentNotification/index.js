/**
 *
 * @param {import("zerespluginlibrary").Plugin} Plugin
 * @param {import("zerespluginlibrary").BoundAPI} Library
 * @returns
 */

module.exports = (Plugin, Library) => {
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
