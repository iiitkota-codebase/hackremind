const { Client } = require('discord.js');
const { connect, connection } = require('mongoose');

const Event = require('./models');
const getEvents = require('./providers');
const {
  config: { BOT_TOKEN, CHANNEL_ID, MONGO_URI },
  hosts,
  intercept,
  reset
} = require('./tuners');
const { generateEmbed, openBrowser, closeBrowser } = require('./generators');

module.exports = async (context, timer) => {
  intercept(context);

  // connect to the mongodb instance
  await connect(MONGO_URI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true
  });

  // remove events older than 5 days
  Event.remove({
    start: { $lt: new Date(+afterDate() - 5 * 8.64e7) }
  });

  const newEvents = [];

  const storeIfNotExists = async event => {
    if (!hosts[event.host]) return;

    const res = await Event.findOneAndUpdate(
      {
        id: event.id,
        host: event.host
      },
      { $setOnInsert: event },
      { upsert: true, new: true, rawResult: true }
    );

    res.lastErrorObject.updatedExisting || newEvents.push(res.value);
  };

  // retrieve and store first 5 events in the database
  const events = await getEvents();

  // eslint-disable-next-line no-restricted-syntax
  for (const event of events) {
    await storeIfNotExists(event);
    if (newEvents.length > 4) break;
  }

  // open puppeteer (chromium browser)
  await openBrowser();

  // generate embeds of new events
  const embeds = await Promise.all(newEvents.map(generateEmbed));

  // close puppeteer (chromium browser)
  await closeBrowser();

  // array to hold failed pushes
  const failed = [];

  const client = new Client();
  await client.login(BOT_TOKEN);
  const channel = await client.channels.fetch(CHANNEL_ID);

  // exhaust all embeds one by one
  while (embeds.length > 0) {
    const [embed] = embeds.splice(0, 1);
    try {
      const message = await channel.send({ embed });
      channel.type === 'news' && (await message.crosspost());
    } catch (e) {
      console.error(e);
      failed.push(e);
    }
  }

  // TODO: remove failed embeds from db so that they can be pushed on later runs
  console.warn(failed);

  // close connection to the database
  await connection.close();
  client.destroy();

  reset();
  context.done();
};
