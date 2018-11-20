const http = require('http');
const Itg = require('../index')();

const server = http.createServer( (req, res) => {

  Itg.getPageImg('https://www.baidu.com')
    .then((imgBuffer)=>{
      res.setHeader('Content-type', 'image/png');
      res.write(imgBuffer);
      res.end();
    })
    .catch((err)=>{
      console.error(err);
    });
});

server.listen(3001);