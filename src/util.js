/**
 * @author xiongwilee
 */

const Stream = require('stream');
const path = require('path');
const fs = require('fs');

const gm = require('gm');
const request = require('request');
const pathResolve = function(...paths) {
  return path.resolve(__dirname, ...paths);
};

/**
 * 通过未知参数获取图片
 * 
 * @param  {Buffer|Stream|String|Object}  img   图片的 Buffer / Stram / 链接 / request请求配置对象
 * @param  {Object}             config     配置
 *                              config.type Buffer | Stream | Path
 *                              config.path 如果config.type为Path,则配置path路径
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
  // 覆盖默认样式配置
  const conf = Object.assign({
    color: '#333333',
    fontSize: '16',
    fontWeigth: 'Normal',
    width: 4000,
    height: 4000,
    marginLeft: 0,
    marginTop: 0,
    background: {
      // 设置为false，则不使用背景图片
      // 一旦配置中设置了background , 利用Object.assign潜复制的特性，可以将enable置为undefined
      enable: false,
      padding: '15,28',
      color: '#ffffff',
      radius: '5'
    }
  }, config.style);

  // 根据图片分辨率校准位置和大小
  const resolution = 300;
  const resizeRate = resolution / 96;

  // 文字字体
  const font = {
    family: pathResolve(`../fonts/SourceHanSerifCN-${conf.fontWeigth}.ttf`),
    size: +conf.fontSize
  };

  // 外边距
  const margin = {
    left: conf.marginLeft,
    top: font.size * resizeRate
  }

  // 背景配置
  const hasBg = conf.background && conf.background.enable !== false;
  const bg = {};

  // 背景图片配置
  if (hasBg) {
    const background = conf.background;
    const padding = background.padding;

    const paddingV = +padding.split(',')[0];
    const paddingH = +padding.split(',')[1];

    // 调整边距
    margin.left += paddingH;
    margin.top += paddingV;

    // 背景色各种配置
    bg.color = background.color;
    bg.radius = background.radius;
    bg.width = font.size * text.length + (paddingH * 2);
    bg.height = font.size + paddingV * 2;
  }

  // 根据字体大小及图片宽度，用\n切割文字
  text = exports.cutText(text, font.size, config.width);

  return new Promise((resolve, reject) => {
    // gm(x,y, 'none')为设置为透明，
    // 参考：https://github.com/aheckmann/gm/issues/580#issuecomment-291173926
    const textGm = gm(conf.width, conf.height, 'none')
      // 设置分辨率，使其在高清屏下更清晰
      .density(300, 300);

    // 若需要生成背景色，则需要添加几步
    if (hasBg) {
      textGm.fill(bg.color)
        .drawRectangle(0, 0, bg.width * resizeRate, bg.height * resizeRate, bg.radius, bg.radius);
    }

    // 最后生成文字，原因是先生成文字再绘制背景色会出现背景色被裁剪的问题
    textGm.stroke(conf.color)
      .fill(conf.color)
      .font(font.family, font.size)
      // 这里垂直距离有偏移，必须通过font.size消除偏移
      .drawText(margin.left, margin.top, text)
      .trim()
      .toBuffer('PNG', (err, buffer) => {
        if (err) return reject(err);
        resolve(buffer);
      });

  });
}

/**
 * 根据宽度及字体大小切割文字
 * @param  {String} text     [description]
 * @param  {Number} fontSize [description]
 * @param  {Number} width    [description]
 * @return {String}          [description]
 */
exports.cutText = function(text, fontSize, width) {
  const fontLength = Math.floor(width / fontSize);

  const reg = new RegExp(`(.{${fontLength}})`, 'g');
  return text.replace(reg, '$1\n');
}