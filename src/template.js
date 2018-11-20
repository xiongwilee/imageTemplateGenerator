/**
 * @author xiongwilee
 */

const Util = require('./util');

const puppeteer = require('puppeteer');

class Template {
  constructor(bgBase64, tempConf, puppeteerConfig = {}) {
    this.bgBase64 = bgBase64;
    this.puppeteerConfig = puppeteerConfig;
    if (tempConf) {
      this.tempConf = tempConf;
      this.temps = Object.keys(tempConf);
    }
  }

  /**
   * 通过模板生成对应的图片
   *
   * @param  {Object} itemsConf   图片的元素配置
   * @param  {Object} options      产出配置
   * @return {Promise(<Buffer|Stream>)}    返回Promise
   */
  gen(itemsConf, options) {
    // console.log(itemsConf, options, '~~~~~~~~0');
    const promiseList = this.temps.map((key) => {
      const img = itemsConf[key] || this.tempConf[key].default;

      if (this.tempConf[key].type === 'text') {
        return Promise.resolve({
          key: key,
          text: img
        });
      } else {
        return Util.getImgBase64(img)
          .then((imgBase64) => {
            return {
              key: key,
              img: imgBase64
            };
          });
      }
    });

    // console.log(promiseList, '~~~~~~~~1');
    return Promise.all(promiseList)
      .then((dataList) => {
        const html = this.getHtmlByTemp(dataList);
        // console.log(html, '~~~~~~~~3');
        return this.getPageImg(html, options);
      })
      .then((data) => {
        if (!Buffer.isBuffer(data)) throw new Error('Get screenshot Error!');

        return data;
      });
  }

  getPageImg(url, options, gotoOptions, shotOptions) {
    const config = Object.assign({
      width: 750,
      height: 1334,
      deviceScaleFactor: 1
    }, options);
    
    return this.getPage((page) => {
      return Promise.resolve()
        // 设置视口宽高
        .then(() => {
          return page.setViewport(config);
        })
        .then(() => {
          if (Util.isUrl(url)) {
            return page.goto(url, Object.assign({}, gotoOptions));
          } else {
            return page.setContent(url, gotoOptions);
          }
        })
        .then(() => {
          return page.screenshot(Object.assign({
            path: config.path,
            // 默认生成png图片
            type: 'png',
            // 是否截全屏
            fullPage: true,
            // 图片质量:  options.quality is unsupported for the png screenshots , 先注释
            // quality: 100
          }, shotOptions)).then((data) => {
            return data;
          });
        })
        .then((data) => {
          return data;
        });
      })
      .then((data) => {
        return data;
      });
  }

  getHtmlByTemp(itemList) {
    // 整体背景图片
    const htmlStyle = {
      backgroundImage: this.bgBase64 ? `url(${this.bgBase64})` : 'none',
      backgroundSize: 'cover'
    };

    // 元素个体样式
    const itemDoms = itemList.reduce((accu, item) => {
      const curItem = this.tempConf[item.key];

      // 获取宽高
      const curItemSize = curItem.size.split(',') || [];
      // 获取位置
      const curItemPosi = curItem.position.match(/([+-]\d+)/g) || [];

      const style = Object.assign({
        position: 'absolute',
        width: `${curItemSize[0]}px`,
        height: `${curItemSize[1]}px`,
        left: `${curItemPosi[0]}px`,
        top: `${curItemPosi[1]}px`,

        backgroundImage: item.img ? `url(${item.img})` : 'none',
        backgroundSize: 'cover',

        fontSize: '16px',
        // TODO: 这里的fontFamily无效
        fontFamily: 'arial,sans-serif',
        WebkitFontSmoothing: 'antialiased'
      }, curItem.style);

      // console.log(this.stringifyStyle(style), '~~~~~~~~~');
      // console.log(!!item.img);
      return accu + `<div id="${item.key}" style="${this.stringifyStyle(style)}">${item.text||''}</div>`;
    }, '');

    return `
      <!DOCTYPE html>
      <html style="${this.stringifyStyle(htmlStyle)}">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
        </head>
        <body>
          ${itemDoms}
        </body>
      </html>`;
  }

  /**
   * 将对象式的CSS属性，转化为CSS字符串
   *
   * @param  {Object} style [description]
   * @return {String}       [description]
   */
  stringifyStyle(style) {
    return Object.keys(style).reduce((accu, key) => {
      let styleKey = key.replace(/([A-Z])/g, letter => `-${letter.toLowerCase()}`);
      let styleVal = style[key].replace(/"/g, '');

      return `${accu}${styleKey}:${styleVal};`;
    }, '');
  }

  /**
   * 获取一个通过puppeteerConfig打开的page对象
   *
   * @param  {Function} process 中间进程,return Promise
   * @return
   */
  getPage(process) {
    return puppeteer.launch(this.puppeteerConfig.launch)
      .then((browser) => {
        return browser.newPage()
          .then((page) => {
            return process(page);
          })
          .then((data) => {
            return browser.close()
              .then(() => {
                return data;
              });
          });
      });
  }
}

/**
 * 直接输出Template实例化对象
 */
exports.getObject = function(bgBase64, tempConf, puppeteerConfig) {
  return new Template(bgBase64, tempConf, puppeteerConfig);
};

/**
 * 通过背景图片生成图片
 */
exports.genFromBg = function(bg, tempConf, puppeteerConfig) {
  // 先获取背景图片
  return Util.getImgBase64(bg)
    .then((bgBase64) => {
      return new Template(bgBase64, tempConf, puppeteerConfig);
    });
};