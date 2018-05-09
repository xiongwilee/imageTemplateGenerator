const fs = require('fs');
const request = require('request');
const puppeteer = require('puppeteer');

puppeteer.launch()
  .then((browser) => {
    browser.newPage()
      .then((page) => {
        return Promise.resolve()
          .then(() => {
            return page.setContent(`
          			<!DOCTYPE html>
          			<html>
          				<head>
          					<meta charset="utf-8" />
          					<meta name="viewport" content="width=device-width,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
          				</head>
          				<body>
          					<h1>这是一个测试页面</h1>
          				</body>
          			</html>`)
          })
          .then(() => {
            return page.screenshot({
              path: './test.png'
            });
          })
      });
  })

// fs.readFile('./images/qrcode.png', function(err, data) {
//   console.log(data.toString('base64'))
// });


// request({
//   url: 'https://www.baidu.com/img/bd_logo1.png',
//   encoding: 'base64'
// }, function(err, response, body) {
//   console.log(err, response.headers, 'data:' + response.headers['content-type'] + ';base64,' + body);
// })