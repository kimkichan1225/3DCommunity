module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // source-map-loader 규칙 수정 (경고 무시)
      const rules = webpackConfig.module.rules;
      
      rules.forEach((rule) => {
        if (rule.test && rule.test.toString().includes('source-map')) {
          rule.use = rule.use || [];
          rule.use.forEach((loader) => {
            if (typeof loader === 'object' && loader.loader === 'source-map-loader') {
              // 경고 무시 옵션
              loader.options = loader.options || {};
              loader.options.filterSourceMappingUrl = 'all';
            }
          });
        }
      });

      return webpackConfig;
    },
  },
};
