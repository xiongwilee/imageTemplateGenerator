# imageTemplateGenerator(puppeteer版)

[![NPM version](https://img.shields.io/npm/v/image-template-generator-web.svg)](https://www.npmjs.com/package/image-template-generator-web)

> 通过创建的模板，快速生成对应的图片，用以：自动生成营销分享图片、批量生成不同二维码的图片等等

![](http://wx4.sinaimg.cn/large/7171171cgy1fr2ks4nozjg20mz0buu0x.gif)

## 一、入门

imageTemplateGenerator(puppeteer版)基于puppeteer实现，大致原理为根据配置渲染网页，然后截图返回。

下载文件到任意目录，并安装依赖：
```shell
$ git clone  -b puppeteer git://github.com/xiongwilee/imageTemplateGenerator.git imageTemplateGenerator
$ cd imageTemplateGenerator
$ npm install
```

执行示例文件：
```shell
$ cd example
$ node index.js
```

提示：`生成图片成功: ./merged.png !`，则说明操作成功，可以查看生成的`example/merged.png`文件。

## 二、详细说明

### 1、使用方法

**1）安装依赖**

```shell
$ npm install image-template-generator-web
```

**2）使用**

用法一：
```javascript
const Itgw = require('image-template-generator');
Itgw(bgImg, { /* template config*/})
  .then((temp)=>{
    return temp.gen({/* item config */}, { /* options */ })
  })
  .then((result)=>{
    // result
  })
```

用法二：
```javascript
const Itgw = require('image-template-generator');
Itgw(bgImg, { /* template config*/}, {/* item config */}, { /* options */ })
  .then((result)=>{
    // result
  })
```

可参考： `example/index.js`，此外，`bgImg`, `template config`, `item config`，`options` 详细配置说明见下文。

### 2、详细配置

### 1）生成模板

```javascript
/**
 * imageTemplateGenerator： 通过创建的模板，拼接合并成一张图片
 * 
 * @param  {<Buffer|Stream|Url<String>|Path<String>|Request Config<Object>} bg        背景图片
 * @param  {Object} tempConf                模板配置
 * @return {Promise}
 */
Itgw(bgImg[, Template config])
```

例如：
```javascript
const Itgw = require('image-template-generator');
const bgImg = '<Url<String>|Path<String>|Request Config<Object>'
Itgw(bgImg, { /* template config*/})
  .then((temp)=>{
    // temp 是实例化之后的模板对象
    // 后续可以通过 temp.gen 方法根据创建的模板生成图片
  })
```

**bgImg**

整体的背景图片，可以是：

- `Url<String>`: 图片的链接
- `Path<String>`: 图片的文件系统路径
- `Request Config<Object>`: [requestjs](https://github.com/request/request) 的请求配置，参考[requestjs的配置文档](https://github.com/request/request#requestoptions-callback)

**template config**

模板的配置，用以说明每个元素的大小、位置、默认图片等属性。特地说明下，如果是文字类型的元素，需要用`type:'text'`属性做标记。

```JavaScript
{
  logo: {
    size: '144,74', // 图片的大小，用“,”分割，第一个值为宽，第二个值为高
    position: '+118+20', // 图片的位置，用“+”或“-”分割，第一个值为相对于bgImg的x轴偏移，第二个值为相对y轴，参考：https://github.com/aheckmann/gm
    default: 'http://img002.qufenqi.com/products/ac/04/ac04decbbd372b5289e1bf1be30fad99.png' // 默认图片，和bgImg一样，可以是：<Buffer|Stream|Url<String>|Path<String>|Request Config<Object>
  },
  title: {
    type: 'text', // 标记当前元素为文字
    size: '320,60',
    position: '+28+380',
    style: { // 文字样式
      fontSize: '14px',
      color: '#333333'
    },
    default: '更多商品，敬请期待' // 嵌入的文字
  },
  slogan: {
    size: '343,56',
    position: '+14+430',
    default: path.resolve('../images/slogan.png')
  },
  qrcode: {
    size: '91,91',
    position: '+93+528',
    default: 'http://img003.qufenqi.com/products/cb/9f/cb9fbcf2eddb111b08ec6c0795900060.png'
  },
  {
    // ... 
    // 该配置可以无限添加。
  }
}
```

其中`style`配置可以配置任意CSS语法（支持图片及文字模式），比如：

```javascript
text_example: {
    type: 'text',
    size: '320,60',
    position: '+28+380',
    // 样式
    style: { 
      // 字体大小
      fontSize: '14px',
      // 字体样式
      fontFamily: '字体名称',
      // 字体加粗
      fontWeight: 'bold',
      // 颜色
      color: '#333333'
      // ...
    },
    default: '这是文字文本示例' // 嵌入的文字，需要手动用'\n'分割
  },
```

### 2）通过模板生成图片

```javascript
/**
   * 通过模板生成对应的图片
   * 
   * @param  {Object} itemsConf       图片的元素配置
   * @param  {Object} options         产出配置
   *                  options.type    写死为Buffer
   *                  options.height  生成的图片高度
   *                  optiosn.width   生成的图片宽度
   * @return {Promise(<Buffer>)}    返回Promise
   */
temp.gen(itemsConf[, options])
```

例如：
```javascript
temp.gen({/* item config */}, { /* options */ })
 .then((data)=>{
    // data 根据options返回，默认产出Buffer
  })
```

**itemsConf**

生成图片的元素配置，key和`template config`的key一致（如果使用默认，不用配置即可），例如：
```javascript
{
    banner: 'https://img002.qufenqi.com/products/e0/af/e0afcc5a1350f4966f963bc0bff6aafa.jpg',
    title: 'Apple iPhone X (A1865) 64GB 深空灰色 移动联通\n电信4G手机 ',
    logo: {
      method: 'GET',
      url: 'https://www.baidu.com/img/bd_logo1.png',
      // body: JSON.stringify(postData),
    },
    qrcode: path.resolve('../images/qrcode.png')
}
```

key对应的值，和bgImg一致，包括：`<Url<String>|Path<String>|Request Config<Object>`。

**options**

- `type`: String， 可以配置为'Buffer'/'Stream'/'Path'，默认为'Buffer'
- `path`: String，如果options配置为"Path"，则需要配置写入文件系统的路径


以上为详细配置，综合示例可参考：`example/index.js`。

### 3、TODO

- [ ] 添加测试用例 

## 三、贡献

欢迎提issue、fork；有任何疑问也可以邮件联系：xiongwilee[at]foxmail.com。