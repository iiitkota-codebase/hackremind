const cheerio = require('cheerio');
const entities = require('entities');
const got = require('got');

const { hosts } = require('../tuners');

const fetchData = async (url, params, page = 1) => {
  // call the Devpost API
  const {
    meta: { total_count: totalCount, per_page: perPage },
    hackathons = []
  } = await got(url, {
    searchParams: { ...params, page }
  }).json();

  // implement pagination
  if (perPage * page >= totalCount) return hackathons;
  return [...hackathons, ...(await fetchData(url, params, page + 1))];
};

const parseDate = str => {
  const matches = /^(\w{3})\s(\d{2}).*?(\d{4})/.exec(str);
  return new Date([...matches].splice(1).join(' '));
};

const getDetails = async url => {
  const html = await got(url);
  const $ = cheerio.load(html.body);

  // scrape required JSON data
  return JSON.parse($('#challenge-json-ld').html());
};

module.exports = async () => {
  const host = 'devpost.com';
  if (!hosts[host]) return [];

  // fetch hackathon data
  let data = await fetchData('https://devpost.com/api/hackathons', {
    challenge_type: 'online',
    order_by: 'recently-added',
    status: 'upcoming'
  });

  // remove hackathons whose submission starts after 3 days
  data = data.filter(
    ({ submission_period_dates: s }) => parseDate(s) < beforeDate()
  );

  // transform data to events
  await Promise.all(
    data.map(async (e, i) => {
      const details = await getDetails(e.url);

      data[i] = {
        id: e.id,
        title: e.title,
        description: entities.decodeHTML(details.description),
        host,
        url: e.url,
        start: details.startDate,
        end: details.endDate,
        image: details.image,
        thumbnail: `https://${e.thumbnail_url.replace(/(^\w+:|^)\/\//, '')}`
      };
    })
  );

  return data;
};
