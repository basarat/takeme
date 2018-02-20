const { FuseBox } = require('fuse-box');
const fsbx = require('fuse-box');

const box = FuseBox
  .init({
    homeDir: "src",
    sourceMap: {
      bundleReference: "sourcemaps.js.map",
      outFile: "demo/sourcemaps.js.map",
    },
    outFile: "demo/app.js",
    plugins: [
      fsbx.EnvPlugin({ NODE_ENV: process.argv[2] }),
      !process.argv.includes('client') 
        && !process.argv.includes('server') 
        && fsbx.UglifyJSPlugin()
    ]
  });


if (process.argv.includes('client')){
  box.devServer('>demo/app.tsx', {
    port: 8080,
    root : './demo'
  });
}
else if (process.argv.includes('server')){
  box.bundle('>demo/appServer.tsx');
  const express = require('express');
  const app = express();
  app.use('/', (req, res) => {
    if ( req.path.indexOf('app.js')!==-1 ) {
      res.sendFile(__dirname + '/demo/app.js');
    }
    else {
      res.sendFile(__dirname + '/demo/index.html');
    }
  });
  app.listen(8080, () => console.log('Example app listening on port 8080!'));
}
else {
  box.bundle('>demo/app.tsx');
}