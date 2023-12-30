const express = require('express');
const multer = require('multer');
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');
const utils = require('./utils')
const app = express();

// 设置根目录
app.use(express.static('public'));
// 使用 body-parser 中间件解析请求的正文
app.use(bodyParser.json());
// 设置文件上传的存储方式
const storage = multer.diskStorage({
  destination: 'public/images',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// 创建 multer 对象
const upload = multer({ storage: storage });

// 设置路由
app.post('/upload', upload.array('image'), async(req, res) => {
  const uploadedFiles = req.files; // 获取上传的文件信息
  // 获取图片列表
  let imageList = uploadedFiles;
  console.log(0000000000,imageList)
  const compressedImageList = await utils.compressImages(imageList);
  await utils.buildThumbImages(compressedImageList)
  // await utils.buildThumbImages(imageList)
  const updatedImageList = utils.getImagesList()
  res.json({
    success: true,
    message: '文件上传成功',
    imageList: updatedImageList
  });
});
//获取所有图片
app.get('/getImages', (req, res) => {
  const imageList = utils.getImagesList()
  res.json({
    imageList: imageList
  });
});

// 添加删除图片的路由
app.post('/delete',(req, res) => {
  // 获取要删除的图片的路径
  const imagePaths = req.body.imagePaths;
  for (const imagePath of imagePaths) {
    try {
      const imageName = utils.getImageName(imagePath);
      const imagePathToDelete = `public/images/${imageName}`;
      const thumbnailPathToDelete = `public/thumbnails/${imageName}`;
      fs.existsSync(imagePathToDelete) && fs.unlinkSync(imagePathToDelete);
      fs.existsSync(thumbnailPathToDelete) && fs.unlinkSync(thumbnailPathToDelete);
    } catch (error) {
      console.error('Error deleting file:', imagePath, error);
    }
  }
  // 获取图片列表
  const imageList = utils.getImagesList();
  res.json({
    imageList: imageList
  });
});

// 所有图片去重
app.post('/delete-duplicate-images', (req, res) => {
  // 获取要删除相同文件的目录
  const directory = req.body.directory || 'public/images';
  const thumbDirectory = 'public/thumbnails';
  utils.deleteDuplicateFiles(directory);
  utils.deleteDuplicateFiles(thumbDirectory);
  const imageList = utils.getImagesList();
  // 返回成功消息
  res.json({
    success: true,
    message: '所有相同的文件已删除',
    imageList,
  });
});

// 获取指定页码和每页数量的图片
app.get('/api/images', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;
  const totalImages = await utils.getTotalImages();
  const images = await utils.getImages(page, size);
  res.json({
    images: images,
    totalImages: totalImages,
    imageList: images,
  });
});

// 获取图片总数
app.get('/api/images/count', async (req, res) => {
  const totalImages = await utils.getTotalImages();
  res.json({
    count: totalImages,
  });
});

// 创建 HTTP 服务器
const server = http.createServer(app);

// 启动服务器
server.listen(3000, () => {
  console.log('服务器已启动，端口号为 3000');
});