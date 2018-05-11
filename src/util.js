/**
 * @author xiongwilee
 */

const path = require('path');
const fs = require('fs');

const puppeteer = require('puppeteer-cn');
const request = require('request');

/**
 * 通过URL或者文件路径获取图片的base64字符串
 * 
 * @param  {String} url path or url or Buffer
 * @return {String}     [description]
 */
exports.getImgBase64 = function(url) {
  if (!url) return Promise.resolve();

  if (Buffer.isBuffer(url)) {
    return new Promise((resolve, reject) => {
      process.nextTick(function() {
        resolve()
      })
    });
  }


  if (typeof url === 'object' || exports.isUrl(url)) {
    // 如果是URL则通过网络请求获取数据
    const reqParams = {};

    if (typeof url === 'string') {
      Object.assign(reqParams, {
        method: 'GET',
        url: url,
        // 强制为base64
        encoding: 'base64'
      });
    } else {
      Object.assign(reqParams, url, {
        // 强制为base64
        encoding: 'base64'
      });
    }

    return new Promise((resolve, reject) => {
      request(reqParams, function(err, response, body) {
        if (err) return reject(err);

        const contentType = response.headers['content-type'] || 'image/png';
        const base64Head = exports.getBase64Head(contentType);

        resolve(base64Head + body);
      })
    });
  } else {
    // 否则如果是图片，直接通过 fs 读取，并返回
    const base64Head = exports.getBase64Head(url);

    return new Promise((resolve, reject) => {
      fs.readFile(url, {
        encoding: 'base64'
      }, function(err, data) {
        if (err) return reject(err);
        resolve(base64Head + data);
      });
    });
  }

}

/**
 * 拼接base64的头
 *
 * @param {String} path 可以是url也可以是path
 */
exports.getBase64Head = function(path) {
  let contentType;

  // 如果是这种格式的 ， image/png ，则直接拼装
  if (/^image\/[a-zA-Z0-9]+$/.test(path)) {
    contentType = path;
  } else {
    const suffix = path.match(/\.([a-zA-Z0-9]+)$/)[1] || 'png';
    contentType = 'image/' + suffix;
  }

  return `data:${contentType};base64,`;
}

exports.isBase64 = function(str) {
  return /^data:i/.test(str);
}

exports.isUrl = function(str) {
  return /^(https\:\/\/|http\:\/\/)/.test(str);
}

exports.isPath = function(str) {
  return /^(\/|\.\/|\.\.\/|[a-zA-Z0-9\-\_]+\/)/.test(str);
}