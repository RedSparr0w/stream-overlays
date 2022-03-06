/* global tmi, twemoji */

// Our default settings
const Settings = {
  // Setup
  username: 'GamesDoneQuick',
  'Reload Window': () => window.location.reload(true),
  // Display
  font_size: 18,
  max_age: 3000,
  message_width: 'auto',
  background_color: [0, 0, 0, 0.8],
  message_color: [245, 245, 245],
  username_color: [244, 0, 147],
  force_color: false,
};

// Get the root element
const cssRoot = document.querySelector(':root');

// Create a function for setting a variable value
function setCssVariable(variable, value) {
  // Set the value of variable --blue to another value (in this case "lightblue")
  cssRoot.style.setProperty(variable, value);
}

// To get our user specified values
const PageParams = new URLSearchParams(window.location.search);
Object.keys(Settings).forEach(k => {
  try {
    const value = PageParams.get(k);
    if (value != undefined) Settings[k] = JSON.parse(PageParams.get(k));
  }catch(e){}
});

// Update the current URI
const UpdateURI = () => {
  const params = {};
  Object.keys(Settings).forEach(k => {
    if (typeof Settings[k] == 'function') return;
    params[k] = JSON.stringify(Settings[k]);
  });
  const uri = `${location.origin}${location.pathname}?${new URLSearchParams(params).toString()}`;
  history.replaceState({}, undefined, uri);
};

// Creating a GUI with our settings
const GUI = new dat.GUI({name: 'Twitch Chat Settings'});

const Setup = GUI.addFolder('Setup');
Setup.add(Settings, 'username').onChange(UpdateURI);
Setup.add(Settings, 'Reload Window').onChange(UpdateURI);

const Display = GUI.addFolder('Display');
Display.add(Settings, 'font_size', 5, 40).onChange((v) => {
  setCssVariable('--font-size', `${v}px`);
  UpdateURI();
});
Display.add(Settings, 'message_width', { Full: 'auto', Fit: 'fit-content' }).onChange((v) => {
  setCssVariable('--chat-width', v);
  UpdateURI();
});
Display.add(Settings, 'max_age', 0, 10000).onChange(UpdateURI);
Display.addColor(Settings, 'background_color').onChange((v) => {
  setCssVariable('--background-color', `rgba(${v})`);
  UpdateURI();
});
Display.addColor(Settings, 'message_color').onChange((v) => {
  setCssVariable('--message-color', `rgb(${v})`);
  UpdateURI();
});
Display.addColor(Settings, 'username_color').onChange((v) => {
  setCssVariable('--username-color', `rgb(${v})`);
  UpdateURI();
});
Display.add(Settings, 'force_color').onChange(UpdateURI);

const updateGUI = (menu) => {
  menu.open();
  for(const folder in menu.__folders) {
    updateGUI(menu.__folders[folder]);
  }
  for(const controller of menu.__controllers) {
    controller.setValue(controller.getValue());
  }
};
updateGUI(GUI);

const chatEle = document.getElementById('chat');

const twitchBadgeCache = {
  data: { global: {} },
};

const bttvEmoteCache = {
  lastUpdated: 0,
  data: { global: [] },
  urlTemplate: '//cdn.betterttv.net/emote/{{id}}/{{image}}',
};

const APIBase = 'https://api.twitch.tv/helix/';
const ClientID = 'urldb4qkndarj1t8ggcxk55l78h2hz';

const chatFilters = [
  // '\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF', // Partial Latin-1 Supplement
  // '\u0100-\u017F', // Latin Extended-A
  // '\u0180-\u024F', // Latin Extended-B
  '\u0250-\u02AF', // IPA Extensions
  '\u02B0-\u02FF', // Spacing Modifier Letters
  '\u0300-\u036F', // Combining Diacritical Marks
  '\u0370-\u03FF', // Greek and Coptic
  '\u0400-\u04FF', // Cyrillic
  '\u0500-\u052F', // Cyrillic Supplement
  '\u0530-\u1FFF', // Bunch of non-English
  '\u2100-\u214F', // Letter Like
  '\u2500-\u257F', // Box Drawing
  '\u2580-\u259F', // Block Elements
  '\u25A0-\u25FF', // Geometric Shapes
  '\u2600-\u26FF', // Miscellaneous Symbols
  // '\u2700-\u27BF', // Dingbats
  '\u2800-\u28FF', // Braille
  // '\u2C60-\u2C7F', // Latin Extended-C
];
const chatFilter = new RegExp(`[${chatFilters.join('')}]`);

// Read wanted stream chat from query.
const streamers = Settings.username;

const client = new tmi.client({
  // options: { debug: true },
  connection: {
    reconnect: true,
    secure: true,
  },

  channels: streamers.split(','),
});

addListeners();
client.connect();

function addListeners() {
  client.on('connecting', () => {
    showAdminMessage({
      message: 'Connecting...',
      attribs: { subtype: 'connecting' },
      timeout: 5000,
    });

    removeAdminChatLine({ subtype: 'disconnected' });
  });

  client.on('connected', () => {
    getBTTVEmotes();
    getBadges().then((badges) => (twitchBadgeCache.data.global = badges));
    showAdminMessage({
      message: 'Connected...',
      attribs: { subtype: 'connected' },
      timeout: 5000,
    });

    removeAdminChatLine({ subtype: 'connecting' });
    removeAdminChatLine({ subtype: 'disconnected' });
  });

  client.on('disconnected', () => {
    twitchBadgeCache.data = { global: {} };
    bttvEmoteCache.data = { global: [] };
    showAdminMessage({
      message: 'Disconnected...',
      attribs: { subtype: 'disconnected' },
      timeout: 5000,
    });

    removeAdminChatLine({ subtype: 'connecting' });
    removeAdminChatLine({ subtype: 'connected' });
  });

  function handleMessage(channel, userstate, message, fromSelf) {
    if (chatFilter.test(message)) {
      return;
    }

    const chan = getChan(channel);
    let name = userstate['display-name'] || userstate.username;
    if (/[^\w]/g.test(name)) {
      name += ` (${userstate.username})`;
    }
    userstate.name = name;
    showMessage({ chan, type: 'chat', message, data: userstate, timeout: Settings.max_age });
  }

  client.on('message', handleMessage);
  client.on('cheer', handleMessage);

  client.on('join', (channel, username, self) => {
    if (!self) {
      return;
    }

    // chan is the channel user (e.g. gotaga)
    // user is the user object related to this channel
    const chan = getChan(channel);
    const user = twitchNameToUser(chan);

    // Search for channel BetterTTV emotes
    getBTTVEmotes(user._id);

    // Get badges for current channel
    getBadges(user._id).then(
      (badges) => (twitchBadgeCache.data[chan] = badges)
    );

    showAdminMessage({
      message: `Joined ${chan}`,
      timeout: 5000,
    });
  });

  client.on('part', (channel, username, self) => {
    if (!self) {
      return;
    }
    const chan = getChan(channel);
    delete bttvEmoteCache.data[chan];
    showAdminMessage({
      message: `Parted ${chan}`,
      timeout: 5000,
    });
  });

  client.on('clearchat', (channel) => {
    removeChatLine({ channel });
  });

  client.on('timeout', (channel, username) => {
    removeChatLine({ channel, username });
  });
}

function removeChatLine(params = {}) {
  if ('channel' in params) {
    params.channel = getChan(params.channel);
  }
  const search = Object.keys(params)
    .map((key) => `[${key}="${params[key]}"]`)
    .join('');
  chatEle.querySelectorAll(search).forEach((n) => chatEle.removeChild(n));
}

function removeAdminChatLine(params = {}) {
  params.type = 'admin';
  removeChatLine(params);
}

function showAdminMessage(opts) {
  opts.type = 'admin';
  if ('attribs' in opts === false) {
    opts.attribs = {};
  }
  opts.attribs.type = 'admin';
  return showMessage(opts);
}

function getChan(channel = '') {
  return channel.replace(/^#/, '');
}

function showMessage({
  chan,
  type,
  message = '',
  data = {},
  timeout = 3000,
  attribs = {},
} = {}) {
  const chatLine_ = document.createElement('div');
  const chatLine = document.createElement('div');
  chatLine_.classList.add('chat-line');
  chatLine.classList.add('chat-line-inner');
  chatLine_.appendChild(chatLine);

  if (chan) {
    chatLine_.setAttribute('channel', chan);
  }

  Object.keys(attribs).forEach((key) => {
    chatLine_.setAttribute(key, attribs[key]);
  });

  // Check if message should be highlighted
  if (data['msg-id'] && data['msg-id'].includes('highlighted')) {
    chatLine_.classList.add('highlighted');
  }

  if (type === 'chat') {
    'id' in data && chatLine_.setAttribute('message-id', data.id);
    'user-id' in data && chatLine_.setAttribute('user-id', data['user-id']);
    'room-id' in data && chatLine_.setAttribute('channel-id', data['room-id']);
    'username' in data && chatLine_.setAttribute('username', data.username);

    const spaceEle = document.createElement('span');
    spaceEle.innerText = ' ';
    const badgeEle = document.createElement('span');
    if ('badges' in data && data.badges !== null) {
      badgeEle.classList.add('badges');
      const badgeGroup = Object.assign(
        {},
        twitchBadgeCache.data.global,
        twitchBadgeCache.data[chan] || {}
      );
      Object.keys(data.badges).forEach((type) => {
        const version = data.badges[type];
        const group = badgeGroup[type];
        if (group && version in group.versions) {
          const url = group.versions[version].image_url_1x;
          const ele = document.createElement('img');
          ele.setAttribute('src', url);
          ele.setAttribute('badgeType', type);
          ele.setAttribute('alt', type);
          ele.classList.add('badge');
          badgeEle.appendChild(ele);
        }
      });
    }

    const nameEle = document.createElement('span');
    nameEle.classList.add('user-name');
    nameEle.style = Settings.force_color ? '' : `color: ${data.color}`;
    nameEle.innerText = data.name;

    const colonEle = document.createElement('span');
    colonEle.classList.add('message-colon');
    colonEle.innerText = ': ';

    const messageEle = document.createElement('span');
    messageEle.classList.add('message');

    const finalMessage = handleEmotes(chan, data.emotes || {}, message);
    addEmoteDOM(messageEle, finalMessage);

    chatLine.appendChild(badgeEle);
    chatLine.appendChild(spaceEle);
    chatLine.appendChild(nameEle);
    chatLine.appendChild(colonEle);
    chatLine.appendChild(messageEle);
  } else if (type === 'admin') {
    chatLine_.classList.add('admin');

    const messageEle = document.createElement('span');
    messageEle.classList.add('message');
    messageEle.innerText = message;

    chatLine.appendChild(messageEle);
  }

  chatEle.appendChild(chatLine_);

  // Make sure the element is on the page first
  setTimeout(() => chatLine_.classList.add('visible'), 100);

  if (chatEle.childElementCount > 30) {
    chatEle.removeChild(chatEle.children[0]);
  }

  if (timeout) {
    setTimeout(() => {
      if (chatLine_.parentElement) {
        // Hide the element
        chatLine_.classList.remove('visible');
        // remove the element after 1 second (once hidden)
        setTimeout(() => chatEle.removeChild(chatLine_), 1000);
      }
    }, timeout);
  }
}

function handleEmotes(channel, emotes, message) {
  // let messageParts = message.split(' ');
  let bttvEmotes = bttvEmoteCache.data.global.slice(0);
  if (channel in bttvEmoteCache.data) {
    bttvEmotes = bttvEmotes.concat(bttvEmoteCache.data[channel]);
  }
  const twitchEmoteKeys = Object.keys(emotes);
  let allEmotes = twitchEmoteKeys.reduce((p, id) => {
    const emoteData = emotes[id].map((n) => {
      const [a, b] = n.split('-');
      const start = +a;
      const end = +b + 1;
      return {
        start,
        end,
        id,
        code: message.slice(start, end),
        type: ['twitch', 'emote'],
      };
    });
    return p.concat(emoteData);
  }, []);
  bttvEmotes.forEach(({ code, id, type, imageType }) => {
    const hasEmote = message.indexOf(code);
    if (hasEmote === -1) {
      return;
    }
    for (
      let start = message.indexOf(code);
      start > -1;
      start = message.indexOf(code, start + 1)
    ) {
      const end = start + code.length;
      allEmotes.push({ start, end, id, code, type });
    }
  });
  const seen = [];
  allEmotes = allEmotes
    .sort((a, b) => a.start - b.start)
    .filter(({ start, end }) => {
      if (seen.length && !seen.every((n) => start > n.end)) {
        return false;
      }
      seen.push({ start, end });
      return true;
    });
  if (allEmotes.length) {
    let finalMessage = [message.slice(0, allEmotes[0].start)];
    allEmotes.forEach((n, i) => {
      const p = Object.assign({}, n, { i });
      const { end } = p;
      finalMessage.push(p);
      if (i === allEmotes.length - 1) {
        finalMessage.push(message.slice(end));
      } else {
        finalMessage.push(message.slice(end, allEmotes[i + 1].start));
      }
      finalMessage = finalMessage.filter((n) => n);
    });
    return finalMessage;
  }
  return [message];
}

function addEmoteDOM(ele, data) {
  data.forEach((n) => {
    let out = null;
    if (typeof n === 'string') {
      out = document.createTextNode(n);
    } else {
      const {
        type: [type, subtype],
        code,
      } = n;
      if (type === 'twitch') {
        if (subtype === 'emote') {
          out = document.createElement('img');
          out.setAttribute(
            'src',
            `https://static-cdn.jtvnw.net/emoticons/v1/${n.id}/1.0`
          );
          out.setAttribute('alt', code);
        }
      } else if (type === 'bttv') {
        out = document.createElement('img');
        let url = bttvEmoteCache.urlTemplate;
        url = url.replace('{{id}}', n.id).replace('{{image}}', '1x');
        out.setAttribute('src', `https:${url}`);
      }
    }

    if (out) {
      ele.appendChild(out);
    }
  });
  twemoji.parse(ele);
}

function formQuerystring(qs = {}) {
  return Object.keys(qs)
    .map((key) => `${key}=${qs[key]}`)
    .join('&');
}

function request({
  base = '',
  endpoint = '',
  qs,
  headers = {},
  method = 'get',
}) {
  const opts = {
    method,
    headers: new Headers(headers),
  };

  return fetch(`${base + endpoint}?${formQuerystring(qs)}`, opts).then((res) =>
    res.json()
  );
}

function twitchAPI(opts) {
  const defaults = {
    base: APIBase,
    headers: {
      'Client-ID': ClientID,
      Accept: 'application/vnd.twitchtv.v5+json',
    },
  };

  return request(Object.assign(defaults, opts));
}


async function twitchNameToUser(username) {
  const user = await twitchAPI({
    endpoint: 'users',
    qs: { login: username },
  }).then(({ users }) => users[0] || null);

  console.debug('Channel user info:', user);
  return user;
}

function getBadges(channel) {
  return twitchAPI({
    base: 'https://badges.twitch.tv/v1/badges/',
    endpoint: `${channel ? `channels/${channel}` : 'global'}/display`,
    qs: { language: 'en' },
  }).then((data) => data.badge_sets);
}

function getBTTVEmotes(channel) {
  // Get default emotes by default
  let endpoint = '/cached/emotes/global';
  let global = true;

  // Else, search for current
  if (channel) {
    endpoint = `/cached/users/twitch/${channel}`;
    global = false;
  }

  return request({
    base: 'https://api.betterttv.net/3',
    endpoint,
  })
    .then((emotes) => {
      emotes.forEach((n) => {
        n.type = ['bttv', 'emote'];

        // This is global emotes set
        if (global) {
          bttvEmoteCache.data.global.push(n);
          return;
        }

        // Make array of emotes for current channel if not exist
        if (!bttvEmoteCache.data.channel) {
          bttvEmoteCache.data[channel] = [];
        }

        // Finally push it
        bttvEmoteCache.data[channel].push(n);
      });
    })
    .catch((reason) => console.error(reason));
}
