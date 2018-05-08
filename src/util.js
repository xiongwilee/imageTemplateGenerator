/**
 * @author xiongwilee
 */

const Stream = require('stream');
const path = require('path');
const fs = require('fs');

const gm = require('gm');
const request = require('request');
const pathResolve = function (...paths) {
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
  const defaultConf = {
    color: '#333333',
    fontSize: '16',
    fontWeigth: 'Normal',
    width: 4000,
    height: 4000,
    marginLeft: 0,
    marginTop: -8,
    background: {
      padding: '15,28',
      color: '#ffffff',
      radius: '5'
    }
  };
  const conf = Object.assign(defaultConf, config.style);
  const fontFamily = pathResolve(`../fonts/SourceHanSerifCN-${conf.fontWeigth}.ttf`);
  const hasBackground = !!conf.background && Object.keys(conf.background).length > 0;

  return new Promise((resolve, reject) => {
    const fontSize = +conf.fontSize;
    // 生成图片背景色所需变量
    let background = conf.background,
      padding,
      paddingV,
      paddingH;
    // 文字外边距
    let textMarginLeft = conf.marginLeft,
      textMarginTop = conf.marginTop + fontSize;
    // gm(x,y, 'none')为设置为透明，
    // 参考：https://github.com/aheckmann/gm/issues/580#issuecomment-291173926
    // 生成文字
    const textGm = gm(conf.width, conf.height, 'none');
      // 设置分辨率，使其在高清屏下更清晰
      // yuanye：不知道为什么要调用该方法，直接用更大字体就可以了吧？调用后还会造成计算距离时有比率的问题
      // .density(300, 300)
    // 若需要生成背景色，则需要添加几步
    if (hasBackground) {
      const { padding: defaultPadding,
        color: defaultColor,
        radius: defaultRadius
      } = defaultConf.background;
      padding = background.padding || defaultPadding;
      paddingV = +padding.split(',')[0];
      paddingH = +padding.split(',')[1];
      textMarginLeft += paddingH;
      textMarginTop += paddingV;
      // 背景色各种配置
      const bgColor = background.color || defaultColor,
        bgRadius = background.radius || defaultRadius,
        bgWidth = fontSize * text.length + (paddingH * 2),
        bgHeight = fontSize + paddingV * 2;

      textGm.fill(bgColor)
        .drawRectangle(0, 0, bgWidth, bgHeight, bgRadius, bgRadius)
        .fill(conf.color);
    }
    // 最后生成文字，原因是先生成文字再绘制背景色会出现背景色被裁剪的问题
    textGm.stroke(conf.color)
      .font(fontFamily, conf.fontSize)
      // 这里垂直距离有偏移，必须通过fontSize消除偏移
      .drawText(textMarginLeft, textMarginTop, text)
      .trim()
      .toBuffer('PNG', (err, buffer) => {
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