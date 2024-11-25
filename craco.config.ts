// https://github.com/facebook/create-react-app/issues/12700#issuecomment-1463040093
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  webpack: {
    configure: (config: any) => ({
      ...config,
      module: {
        ...config.module,
        rules: config.module.rules.map((rule: any) => {
          if (rule.oneOf instanceof Array) {
            // eslint-disable-next-line no-param-reassign
            rule.oneOf[rule.oneOf.length - 1].exclude = [
              /\.(js|mjs|jsx|cjs|ts|tsx)$/,
              /\.html$/,
              /\.json$/,
            ];
          }
          return rule;
        }),
      },
    }),
  },
};
