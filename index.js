require('dotenv').config()
const Koa = require('koa'); //Koa http server Framework
const KoaRouter = require('koa-router'); //Koa path route middleware
const BodyParser = require('koa-bodyparser'); //Koa Body parse middleware
const app = new Koa(); //Create Koa app instance
const vision = require('@google-cloud/vision'); //Import google cloud vision module
const multer = require("@koa/multer"); //Koa multer multipart upload extension
const jsQR = require("jsqr"); //Pure javascript QR code decode module
const client = new vision.ImageAnnotatorClient(); //구글에 요청보낼 때 사용
const FileType = require('file-type');
const Jimp = require('jimp');//For jsqr, have to handle image
const upload = multer({
    storage: multer.memoryStorage()
});
app.proxy = true;
const router = new KoaRouter();
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
});
app.use(BodyParser());
router.options('healthPreflight', '/health', async (ctx) => {
	ctx.set('Access-Control-Allow-Origin', ctx.request.header.referer || ctx.request.header.origin);
	ctx.set('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
	ctx.set('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin, Content-Type, Authorization');
  ctx.set('Access-Control-Allow-Credentials', true);
	ctx.response.status = 200;
})
router.get('health', '/health', async (ctx) => {
  ctx.response.body = 'hello';
  ctx.response.status = 200;
  ctx.set('Access-Control-Allow-Origin', ctx.request.header.referer || ctx.request.header.origin);
  ctx.set('Access-Control-Allow-Credentials', true);
})
router.post('qrcode', '/qrcode', upload.fields([{
  name: 'file' 
}]), async ctx => {
  try {
    if (!!(ctx.request.files) && (ctx.request.files.file.length > 0)){
      const content = ctx.request.files.file[0].buffer
      const image = await Jimp.read(content)
      const pixels = new Uint8ClampedArray(image.bitmap.data)
      
      const code = jsQR(pixels, image.bitmap.width, image.bitmap.height);//jsqr은 Uint8ClampedArray 형식만 받음.
      ctx.response.body = {
        success: true,
        data: code.data
      }
    } else {
      throw new Error('file not provided')
    }
  } catch (e){
    ctx.response.status = 503
    ctx.response.body = {
      success: false,
      reason: e.message
    }
  }
})
router.post('food', '/food', upload.fields([{
  name: 'file'
}]), async (ctx) => {
  try {
    if (!!(ctx.request.files) && (ctx.request.files.file.length > 0)){
      const content = ctx.request.files.file[0].buffer.toString('base64')
      const request = {
        image: {content: content },
      }
      const [result] = await client.objectLocalization(request); //[result]는 array의 첫 번째 값이 들어옴.
      const objects = result.localizedObjectAnnotations; //이미지를 해석한 결과 -> score, name, ...
      const foods = {} //객체
      let most = 0;
      let name = null;
      objects.filter(object => object.score >= 0.5).forEach(object => { 
        if (!!(foods[object.name])){
          foods[object.name] += 1
        } else {
          foods[object.name] = 1
        }
      });
      for (var key in foods){
        if (foods[key] > most){
          name = key
          most = foods[key]
        }
      }
      const fileFromBUffer = await FileType.fromBuffer(ctx.request.files.file[0].buffer);
      const uploadResults = await s3.upload({
        Bucket: process.env.S3_BUCKET_NAME,
        ACL: 'public-read',
        Body: ctx.request.files.file[0].buffer,
        Key: `${Date.now()}.${fileFromBUffer.ext}`
      }).promise();
      ctx.response.body = {
        success: true,
        name, // name: name,
        count: most,
        key: `https://embedded-sensor-images.s3.ap-northeast-2.amazonaws.com/${uploadResults.Key}`,
        max_availability: 10 // 식품 유효기간? 유통기한
      }
    } else {
      throw new Error('file not provided')
    }
  } catch (e){
    ctx.response.status = 503
    ctx.response.body = {
      success: false,
      reason: e.message
    }
  }
})
app.use(router.routes())
  .use(router.allowedMethods())
  .listen(8500, () => console.log('Running on port 8500'));