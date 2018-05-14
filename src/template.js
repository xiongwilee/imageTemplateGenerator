/**
 * @author xiongwilee
 */

const Stream = require('stream');
const fs = require('fs');
const path = require('path');

const gm = require('gm');
const Util = require('./util');

class Template {
  constructor(bg, tempConf) {
    this.bg = bg;
    this.tempConf = tempConf;
    this.temps = Object.keys(tempConf);
  }

  /**
   * 通过模板生成对应的图片
   * 
   * @param  {Object} itemsConf   图片的元素配置
   * @param  {Object} options      产出配置
   *                  options.type 'Buffer'/'Stream'/'Path'
   * @return {Promise(<Buffer|Stream>)}    返回Promise
   */
  gen(itemsConf, options) {
    const conf = Object.assign({
      type: 'Buffer'
    }, options);

    const promiseList = this.temps.map((curr) => {
      const curTemp = this.tempConf[curr];
      const curItem = itemsConf[curr];

      // 如果curItem没有配置，则使用默认的图片
      const curImg = curItem || curTemp.default;

      // 获取宽高配置
      const sizeConf = curTemp.size && curTemp.size.split(',');

      return Util.getImage(curImg, {
          type: 'Stream',
          width: sizeConf[0],
          height: sizeConf[1],
          style: curTemp.style
        })
        .then((image) => {
          // 测试是否读取到了配置文件中的图片
          // fs.writeFile('./' + index + '.png', image, function(err){ console.log(err, '~~~~~~~') });

          // 将要拼接的图片重置宽高
          return this.resize(image, {
            width: sizeConf[0],
            height: sizeConf[1]
          });
        })
        .then((image) => {
          return { image, curTemp }
        })
    })

    return Promise.all(promiseList)
      .then((imags) => {
        return imags.reduce((accu, curr, index) => {
          return accu.then((bg) => {
            return this.merge(curr.image, bg, curr.curTemp);
          });
        }, Promise.resolve(this.bg)).then((image) => {
          // console.log(Buffer.isBuffer(image), conf, '~~~~0');
          switch (conf.type) {
            case 'Stream':
              return gm(image).stream();
              break;
            case 'Path':
              return new Promise((resolve, reject) => {
                fs.writeFile(conf.path, image, function(err) {
                  if (err) return reject(err);
                  resolve(conf.path, image);
                });
              });
              break;
            case 'Buffer':
            default:
              return image;
              break;
          }
        });
      });
  }

  /**
   * 重置图片宽高
   * 
   * @param  {Stream} image   图片流
   * @param  {Object} config 当前模板配置
   * @return {Promise(<Stream>)}    返回Promise, 返回为图片处理流     
   */
  resize(image, config) {
    // 如果有宽高配置，则重置高度
    return new Promise((resolve, reject) => {
      if (!config) return resolve(image);

      gm(image)
        .resize(config.width, config.height)
        .toBuffer('PNG', function(err, buffer) {
          if (err) return reject(err);
          resolve(buffer);
        });
    })
  }

  merge(image, bg, curTemp) {

    return new Promise((resolve, reject) => {
      // 测试是否成功获取文件      
      // fs.writeFile('./merge_images.png', image, function(err) { console.log(err, '~~~~~~~') });
      // fs.writeFile('./merge_bg.png', bg, function(err) { console.log(err, '~~~~~~~') });

      // 这里的composite方法不能执行一个Buffer，
      // 所以必须先写入文件系统
      const imagePath = path.resolve(__dirname, `../images/temp-${Date.now()}-${Math.random().toString(16).substr(2)}.png`);
      fs.writeFile(imagePath, image, function(err) {
        if (err) return reject(err);
        gm(bg)
          .composite(imagePath)
          .geometry(curTemp.position)
          .toBuffer('PNG', function(err, buffer) {
            if (err) return reject(err);
            // 完事儿后删除文件
            fs.unlinkSync(imagePath);

            resolve(buffer);
          });
      });
    });
  }
}

module.exports = function(bg, tempConf) {
  // 这里通过获取bg的buffer
  // 以防 new Template(bg, tempConf) 与 temp.gen 不在一个执行队列导致的stream丢包问题
  return Util.getImage(bg, { type: 'Buffer' })
    .then((image) => {
      if (!Buffer.isBuffer(image)) throw 'Illegal Backgroud Image Format!';
      // 测试是否读取到了bg
      // fs.writeFile('./bg.png', image, function(err){ console.log(err, '~~~~~~~') });

      return new Template(image, tempConf);
    });
}