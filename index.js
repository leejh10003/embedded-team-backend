require('dotenv').config()
const Koa = require('koa');
const KoaRouter = require('koa-router');
const BodyParser = require('koa-bodyparser');
const app = new Koa();
const vision = require('@google-cloud/vision');
const multer = require("@koa/multer");
const jsQR = require("jsqr");
var sizeOf = require('image-size');
const client = new vision.ImageAnnotatorClient();
const Jimp = require('jimp');
const upload = multer({
    storage: multer.memoryStorage()
});
app.proxy = true;
const router = new KoaRouter();
app.use(BodyParser());
router.options('healthPreflight', '/health', async (ctx) => {
	ctx.set('Access-Control-Allow-Origin', ctx.request.header.referer || ctx.request.header.origin);
	ctx.set('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
	ctx.set('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin, Content-Type, Authorization');
  ctx.set('Access-Control-Allow-Credentials', true);
	ctx.response.status = 200;
})
router.get('health', '/health', async (ctx) => {
  ctx.response.body = 'OK';
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
      
      const code = jsQR(pixels, image.bitmap.width, image.bitmap.height);
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
      const [result] = await client.objectLocalization(request);
      const objects = result.localizedObjectAnnotations;
      const foods = {}
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
      ctx.response.body = {
        success: true,
        name,
        count: most
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