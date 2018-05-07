# imageTemplateGenerator

> 通过创建的模板，快速生成对应的图片，用以：自动生成营销分享图片、批量生成不同二维码的图片等等

![](http://wx4.sinaimg.cn/large/7171171cgy1fr2ks4nozjg20mz0buu0x.gif)

## 入门

### 一、环境依赖

imageTemplateGenerator 基于 [gm](https://github.com/aheckmann/gm) ，所以同gm的依赖，需要安装对应的工具。

参考： [https://github.com/aheckmann/gm#getting-started](https://github.com/aheckmann/gm#getting-started)

```shell
$ brew install imagemagick
$ brew install graphicsmagick
$ brew install ghostscript
```

### 二、试用

下载文件到任意目录，并安装依赖：
```shell
# 仓储有一套中文字体，clone会比较慢，请耐心等候
$ git clone git://github.com/xiongwilee/imageTemplateGenerator.git
$ cd imageTemplateGenerator
$ npm install
```

执行示例文件：
```shell
$ cd example
$ node index.js
```

提示：
```
生成图片成功: ./merged.png !
```
则操作成功。

## 详细说明

### 一、使用方法

**1、安装依赖**

说明： `imagemagick`, `graphicsmagick`, `ghostscript` 也是必须的，见上文。

```shell
$ npm install image-template-generator
```

**2、使用**

用法一：
```javascript
const Itg = require('image-template-generator');
Itg(bgImg, { /* template config*/})
  .then((temp)=>{
    return temp.gen({/* item config */}, { /* options */ })
  })
  .then((result)=>{
    // result
  })
```

用法二：
```javascript
const Itg = require('image-template-generator');
Itg(bgImg, { /* template config*/}, {/* item config */}, { /* options */ })
  .then((result)=>{
    // result
  })
```

可参考： `example/index.js`，此外，`bgImg`, `template config`, `item config`，`options` 详细配置说明见下文。

### 二、详细配置

### 三、TODO

- [ ] 添加测试用例 
- [ ] 文字行高，及自动换行功能
- [ ] 字体扩展，目前仅支持 `SourceHanSerifCN-Normal.ttf`

## 贡献

欢迎提issue、fork；有任何疑问也可以邮件联系：xiongwilee[at]foxmail.com。