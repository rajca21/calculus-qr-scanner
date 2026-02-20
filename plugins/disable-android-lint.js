const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function disableAndroidLint(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'gradle') {
      config.modResults.contents = config.modResults.contents.replace(
        /android\s*{/,
        `android {
    lint {
        abortOnError false
        checkReleaseBuilds false
        disable 'ExtraTranslation'
    }`,
      );
    }
    return config;
  });
};
