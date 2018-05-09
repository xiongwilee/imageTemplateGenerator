const path = require('path');
const fs = require('fs');
const resolve = function(...paths) {
  return path.resolve(__dirname, ...paths);
};

const Itg = require(resolve('../index.js'));
const log = console.log.bind(console);

Itg(resolve('../images/bg_invite.png'), {
    title: {
      size: '600,60',
      position: '+85+160',
      style: {
        fontSize: '48',
        color: '#333333',
        marginTop: -8,
        background: {
          padding: '15,28',
          color: '#ffffff',
          radius: '5'
        }
      },
      default: 'XXX邀请你来大白买车啦',
    },
    qrcode: {
      size: '256,256',
      position: '+432+1440',
      default: 'http://img003.qufenqi.com/products/cb/9f/cb9fbcf2eddb111b08ec6c0795900060.png'
    }
  }).then(temp => {
    return temp.gen({
      title: '歪某某邀请你来大白买车啦',
      qrcode: resolve('../images/qrcode.png')
    }, {
      type: 'Path',
      path: resolve('./text-background.png')
    });
  })
  .then((res) => {
    log('生成图片成功：', res);
  })
  .catch(err => {
    log('生成图片出错：', err);
  });