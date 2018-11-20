/**
 * @author xiongwilee
 */

const Template = require('./src/template');

/**
 * imageTemplateGenerator： 通过创建的模板，拼接合并成一张图片
 *
 * @param  {String|Buffer|Object} bg        背景图片
 * @param  {Object} tempConf  				模板配置
 * @param  {Object} itemsConf 				模板元素配置
 * @param  {Object} options 				输出配置
 * @return {Promise}
 */
module.exports = function imageTemplateGenerator(bg, tempConf, pupeepteerConfig, itemsConf, options) {
  // 如果不配置bg, 则认为不需要通过既定的语法生成图片，而直接通过puppeteer生成
  if (!bg || !tempConf) {
    return Template.getObject(bg, tempConf, pupeepteerConfig);
  }

  const Temp = Template.genFromBg(bg, tempConf, pupeepteerConfig);

  if (!itemsConf) return Temp;

  return Temp.then((err, temp) => {
    return temp.gen(itemsConf, options);
  });
};