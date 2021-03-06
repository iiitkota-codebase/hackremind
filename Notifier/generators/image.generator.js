const probe = require('probe-image-size');

const { config } = require('../tuners');

// fixes image url to make sure that each embed has the same width
module.exports = async (img, defaultURL = config.ONE_PX_IMG) => {
  let url = defaultURL;

  // use img if it's not a placeholder, its A.R. >= 4:3 and width >= 432px
  if (img && img.length > 0 && !img.toLowerCase().includes('placeholder')) {
    const { width, height } = await probe(img);
    url = width / height < 4 / 3 || width < 432 ? url : img;
  }

  return { url };
};
