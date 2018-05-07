const Stream = require('stream');
const path = require('path');
const fs = require('fs');

const gm = require('gm');
const request = require('request');

/**
 * 通过未知参数获取图片
 * 
 * @param  {Buffer|Stream|String|Object} 	img 	图片的 Buffer / Stram / 链接 / request请求配置对象
 * @param  {Object} 						config	配置
 *                               			config.type Buffer | Stream | Path
 *                               			config.path 如果config.type为Path,则配置path路径
 * @return {Promise} 
 */
exports.getImage = function getImage(img, config) {
  // 默认使用Buffer模式输出
  const conf = Object.assign({
    type: 'Buffer'
  }, config);

  if (typeof img === 'object') {
    if (img.url && img.method) {

      // 如果有url、method配置，则认为是request参数配置
      return exports.getImageByUrl(img, conf);
    } else {

      // 否则可能是stream 或者 buffer , 则直接返回
      return exports.convertGmToRes(gm(img), conf);
    }
  } else if (typeof img === 'string') {
    if (exports.isPath(img)) {

      // 如果是路径则直接返回
      return exports.convertGmToRes(gm(img), conf);
    } else if (exports.isUrl(img)) {

      // 如果是URL， 则拼装成request参数
      return exports.getImageByUrl({
        method: 'GET',
        url: img
      }, conf);
    } else {
      // 否则，认为是文字，需要自行拼接
      return exports.getImageByText(img, conf)
    }
  } else {
    throw 'Illegal Img Type!';
  }
}

exports.isUrl = function(str) {
  return /^(https\:\/\/|http\:\/\/)/.test(str);
}

exports.isPath = function(str) {
  return /^(\/|\.\/|\.\.\/|[a-zA-Z0-9\-\_]+\/)/.test(str);
}

exports.convertGmToRes = function convertGmToRes(imageGm, config) {
  switch (config.type) {
    case 'Buffer':
      return new Promise((resolve, reject) => {
        imageGm
          .toBuffer('PNG', function(err, buffer) {
            if (err) return reject(err);
            resolve(buffer)
          })
      });
      break;
    case 'Stream':
      return new Promise((resolve, reject) => {
        imageGm
          .stream(function(err, stdout, stderr) {
            if (err) return reject(err);
            resolve(stdout)
          });
      });
      break;
    case 'Path':
      return new Promise((resolve, reject) => {
        imageGm
          .write(config.path, function(err) {
            if (err) return reject(err);
            resolve(config.path)
          });
      });
      break;
    default:

      break;
  }
}

/**
 * 通过request参数获取图片
 * 
 * @param  {Obejct} params request配置
 * @param  {Object} config 配置
 * @return {Promise}        图片
 */
exports.getImageByUrl = function getImageByUrl(params, config) {
  return new Promise((resolve, reject) => {
    // 如果需要返回Buffer, 则设置encoding参数为null
    // 参考：https://github.com/request/request#requestoptions-callback encoding配置
    if (config.type === 'Buffer') {
      params.encoding = null;

      request(params, function(err, response, body) {
        if (err) return reject(err);
        resolve(body);
      });
    } else {
      const reqStream = request(params);
      if (config.type === 'Stream') {
        return resolve(reqStream);
      } else {
        reqStream.pipe(fs.createWriteStream(config.path));
        return resolve(config.path);
      }
    }
  })
}

exports.getImageByText = function getImageByText(text, config) {
  const conf = Object.assign({
    color: '#333333',
    fontSize: '16',
    fontWeigth: 'Normal',
    width: 4000,
    height: 4000,
    marginLeft: 0,
    marginTop: 64
  }, config.style);

  const fontFamily = path.resolve(__dirname, `../fonts/SourceHanSerifCN-${conf.fontWeigth}.ttf`);

  return new Promise((resolve, reject) => {
    // gm(x,y, 'none')为设置为透明，
    // 参考：https://github.com/aheckmann/gm/issues/580#issuecomment-291173926
    const imgGm = gm(conf.width, conf.height, 'none')
      // 设置分辨率，使其在高清屏下更清晰
      .density(300, 300)
      .stroke(conf.color)
      .font(fontFamily, conf.fontSize)
      // 这里垂直距离有偏移，必须通过fontSize的倍数消除偏移
      .drawText(conf.marginLeft, conf.marginTop, text)
      .trim()
      .toBuffer('PNG', function(err, buffer) {
        // 测试是否读取到了bg
        // fs.writeFile('./text.png', image, function(err){ console.log(err, '~~~~~~~') });
        if (err) return reject(err);

        resolve(buffer);
      });
  });

  // return exports.convertGmToRes(
  //   gm(conf.width, conf.height, 'none')
  //     .stroke(conf.color)
  //     .font(fontFamily, conf.fontSize)
  //     .drawText(0, conf.fontSize, text)
  //     .trim(), config);
}