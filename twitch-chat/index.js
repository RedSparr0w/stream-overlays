/* global tmi, twemoji, mock_data */

// #region Settings

// Our default settings
const Settings = {
  // Setup
  username: 'GamesDoneQuick',
  // Display
  font_size: 18,
  max_age: 3000,
  message_width: 'auto',
  border_radius: 0,
  opacity: 95,
  style: 'default',
  m: {
    bg: 'rgb(0,0,0)',
    msg: 'rgb(245,245,245)',
    name: 'rgb(196,165,252)',
    force: false,
  },
  h: {
    bg: 'rgb(100,65,165)',
    msg: 'rgb(245,245,245)',
    name: 'rgb(0,0,0)',
    force: true,
  },
};
const DefaultSettings = JSON.parse(JSON.stringify(Settings));
const Values = {
  // Output
  url_address: '',
};

// Create a function for setting a css variable value
const cssRoot = document.querySelector(':root');
const setCssVariable = (variable, value) => cssRoot.style.setProperty(variable, value);

// Update the output URI
const UpdateURI = () => {
  const params = {};
  Object.keys(Settings).forEach(k => {
    if (typeof Settings[k] == 'function') return;
    if (JSON.stringify(Settings[k]) == JSON.stringify(DefaultSettings[k])) return;
    if (typeof Settings[k] == 'object') {
      for (const key in Settings[k]) {
        params[`${k}.${key}`] = JSON.stringify(Settings[k][key]);
      }
      return;
    }
    params[k] = JSON.stringify(Settings[k]);
  });
  const uri = `${location.origin}${location.pathname}?${new URLSearchParams(params).toString()}`;
  Values.url_address = uri;
};

// Create our settings GUI
const Pane = new Tweakpane.Pane({
  title: 'Settings',
  expanded: true,
});

Pane.on('change', (ev) => {
  UpdateURI();
});

// Setup settings
const Setup = Pane.addFolder({
  title: 'Setup',
  expanded: true,
});
Setup.addInput(Settings, 'username');
const reloadButton = Setup.addButton({title: 'Reload'});
// Copy the output uri text when the button is clicked
reloadButton.on('click', () => {
  history.replaceState({}, undefined, Values.url_address);
  window.location.reload(true);
});
const fakeButton = Setup.addButton({title: 'Send fake messages'});
// Send some fake messages
let msg_id = 0;
const sendFakeMessage = () => {
  if (!mock_data) return;
  const msg = mock_data[msg_id++];
  msg_id = (msg_id + 1) % mock_data.length;
  showMessage({ type: 'chat', message: msg.message, data: msg, timeout: Settings.max_age });
};
fakeButton.on('click', () => {
  let messages = 10;
  while (messages --> 0) {
    setTimeout(sendFakeMessage, Math.floor(Math.random() * (messages * 1000)));
  }
});

// Display settings
const Display = Pane.addFolder({
  title: 'Display',
  expanded: true,
});
Display.addInput(Settings, 'max_age', { min: 0, max: 10000, step: 1 });
Display.addInput(Settings, 'font_size', { min: 5, max: 40, step: 1 }).on('change', (ev) => {
  setCssVariable('--font-size', `${ev.value}px`);
});
Display.addInput(Settings, 'border_radius', { min: 0, max: 50, step: 1 }).on('change', (ev) => {
  setCssVariable('--message-border-radius', `${ev.value}px`);
});
Display.addInput(Settings, 'opacity', { min: 0, max: 100, step: 1 }).on('change', (ev) => {
  setCssVariable('--opacity', ev.value / 100);
});
Display.addInput(Settings, 'message_width', { options: { Full: 'auto', Fit: 'fit-content' }}).on('change', (ev) => {
  setCssVariable('--chat-width', ev.value);
});
Display.addInput(Settings, 'style', {
  options: {
    Default: 'default',
    Bubble: 'bubble',
  },
});
const CustomM = Display.addFolder({
  title: 'Message Style',
  expanded: true,
});
CustomM.addInput(Settings.m, 'bg').on('change', (ev) => {
  setCssVariable('--background-color', ev.value);
});
CustomM.addInput(Settings.m, 'msg').on('change', (ev) => {
  setCssVariable('--message-color', ev.value);
});
CustomM.addInput(Settings.m, 'name').on('change', (ev) => {
  setCssVariable('--username-color', ev.value);
});
CustomM.addInput(Settings.m, 'force');

const CustomHM = Display.addFolder({
  title: 'Highlighted Message Style',
  expanded: true,
});
CustomHM.addInput(Settings.h, 'bg').on('change', (ev) => {
  setCssVariable('--highlighted-background-color', ev.value);
});
CustomHM.addInput(Settings.h, 'msg').on('change', (ev) => {
  setCssVariable('--highlighted-message-color', ev.value);
});
CustomHM.addInput(Settings.h, 'name').on('change', (ev) => {
  setCssVariable('--highlighted-username-color', ev.value);
});
CustomHM.addInput(Settings.h, 'force');

// Output settings
const Output = Pane.addFolder({
  title: 'Output',
  expanded: true,
});
const uriComponent = Output.addMonitor(Values, 'url_address', {
  interval: 1000,
});
const copyButton = Output.addButton({title: 'Copy URL'});
// Copy the output uri text when the button is clicked
copyButton.on('click', (ev) => {
  const input = uriComponent.controller_.view.valueElement.querySelector('input');
  input.select();
  input.setSelectionRange(0, 99999); /* For mobile devices */
  navigator.clipboard.writeText(input.value);
  ev.target.title = 'Copied!';
  setTimeout(() => ev.target.title = 'Copy URL', 1500);
});

// Update our uri string now
UpdateURI();


// Get our user specified values
const PageParams = new URLSearchParams(window.location.search);
Object.keys(Settings).forEach(k => {
  try {
    if (typeof Settings[k] == 'object') {
      for (const key in Settings[k]) {
        const value = PageParams.get(`${k}.${key}`);
        // If it doesn't exist, continue
        if (value == undefined) return;
        // Update our value
        Settings[k][key] = JSON.parse(value);
      }
      return;
    }
    // Get our value
    const value = PageParams.get(k);
    // If it doesn't exist, continue
    if (value == undefined) return;
    // Update our value
    Settings[k] = JSON.parse(PageParams.get(k));
  }catch(e){}
});
// Update the panel/trigger onchange events
Pane.importPreset(Settings);

// #endregion Settings

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
  const template = document.querySelector(`template[style-${Settings.style}]`);
  const chat = template.content.cloneNode(true);
  chat.firstElementChild.setAttribute(`style-${Settings.style}`, true);
  const chatLine = chat.querySelector('.chat-line');
  const chatLineInner = chat.querySelector('.chat-line-inner');
  const badgeEle = chat.querySelector('.badges');
  const nameContainerEle = chat.querySelector('.name-container');
  const nameEle = chat.querySelector('.username');
  const messageEle = chat.querySelector('.message');

  if (chan) {
    chatLine.setAttribute('channel', chan);
  }

  Object.keys(attribs).forEach((key) => {
    chatLine.setAttribute(key, attribs[key]);
  });

  // Check if message should be highlighted
  const highlighted = data['msg-id'] && data['msg-id'].includes('highlighted');
  if (highlighted) chatLine.classList.add('highlighted');
  if ('id' in data) chatLine.setAttribute('message-id', data.id);
  if ('user-id' in data) chatLine.setAttribute('user-id', data['user-id']);
  if ('room-id' in data) chatLine.setAttribute('channel-id', data['room-id']);
  if ('username' in data) chatLine.setAttribute('username', data.username);

  if (type === 'chat') {
    if ('badges' in data && data.badges !== null) {
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

    nameEle.style = highlighted ?
      Settings.h.force ? '' : `color: ${data.color}` :
      Settings.m.force ? '' : `color: ${data.color}`;
    nameEle.innerText = data.name;

    // Get any emotes from the message
    const finalMessage = handleEmotes(chan, data.emotes || {}, message);
    addEmoteDOM(messageEle, finalMessage);
  } else if (type === 'admin') {
    chatLine.classList.add('admin');
    nameContainerEle.remove();

    messageEle.innerText = message;

    chatLineInner.appendChild(messageEle);
  }

  chatEle.appendChild(chatLine);

  // Make sure the element is on the page first
  setTimeout(() => chatLine.classList.add('visible'), 100);

  if (chatEle.childElementCount > 45) {
    chatEle.removeChild(chatEle.children[0]);
  }

  if (timeout) {
    setTimeout(() => {
      if (chatLine.parentElement) {
        // Hide the element
        chatLine.classList.remove('visible');
        // remove the element after 1 second (once hidden) (may fail due to being removed by something else)
        setTimeout(() => {
          try {
            chatEle.removeChild(chatLine);
          } catch(e) {}
        }, 1000);
        
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
