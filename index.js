require('now-env');
const microAccess = require('micro-access');
const etag = require('etag');
const micro = require('micro');
const axios = require('axios');

const {
  ACCESS_ALLOW_ORIGIN,
  API_TOKEN,
  CAMPAIGN_ID,
  CACHE_MAX_AGE,
} = process.env;

const cache = `max-age=${Number(CACHE_MAX_AGE) || 300}`;

const ONE_MINUTE = 1000 * 60;

let responseText = '[]';
let responseETag = '';

const fetchUrl = async () => {
  try {
    const {
      data: { response },
    } = await axios.get(
      `https://api.indiegogo.com/1/campaigns/${CAMPAIGN_ID}.json?api_token=${API_TOKEN}`,
    );
    responseText = JSON.stringify(response);
    responseETag = etag(responseText);
  } catch (e) {
    console.log(e);
  }
};

fetchUrl();

setInterval(() => fetchUrl(), ONE_MINUTE);

module.exports = microAccess()((request, response) => {
  response.setHeader('cache-control', cache);
  response.setHeader('etag', responseETag);

  if (request.headers.etag === responseETag) {
    response.statusCode = 304;
    response.end();
    return;
  }
  response.end(responseText);
});
