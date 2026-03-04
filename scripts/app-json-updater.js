module.exports.readVersion = function (contents) {
  try {
    return JSON.parse(contents).expo.version;
  } catch (e) {
    return "0.0.0";
  }
};

module.exports.writeVersion = function (contents, version) {
  const json = JSON.parse(contents);
  if (!json.expo) json.expo = {};
  json.expo.version = version;
  return JSON.stringify(json, null, 2) + "\n";
};
