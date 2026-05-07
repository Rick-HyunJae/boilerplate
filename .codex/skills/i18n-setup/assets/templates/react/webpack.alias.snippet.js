// webpack config 의 resolve.alias 에 머지.
const path = require('path');

module.exports = {
    resolve: {
        alias: {
            '~language': path.resolve(__dirname, 'src/static/language'),
            '~hooks': path.resolve(__dirname, 'src/hooks'),
        },
    },
};
