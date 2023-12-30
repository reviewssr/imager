const fs = require('fs')
const path = require('path');
const Jimp = require('jimp');

const imageExtensions = ['.jpg', '.png'];
// 设置缩略图的宽度和高度
const thumbnailWidth = 100;
const thumbnailHeight = 100;
// 控制图片质量使其不超过指定大小
const maxFileSize = 400 * 1024; // 400KB

// 定义一个函数来删除所有相同的文件
function deleteDuplicateFiles(directory) {
  // 获取指定目录中的所有文件
  const files = fs.readdirSync(directory);
  const fileMD5s = {};
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // 获取文件的绝对路径
    const file_path = `${directory}/${file}`;
    // 检查文件是否存在
    if (fs.existsSync(file_path)) {
      const md5 = fs.readFileSync(file_path, 'base64');
      if (fileMD5s[md5]) {
        fs.unlinkSync(file_path);
      } else {
        fileMD5s[md5] = true;
      }
    }
  }
}
function getImagesList(type = 'thumbnails') {
  const images = fs.readdirSync(`public/${type}`);
  const imageList = [];
  images.forEach(image => {
    if (imageExtensions.includes(path.extname(image))) {
      imageList.push(path.join(`./${type}`,image));
    }
  });
  return imageList.reverse();
}
// 获取图片总数
const getTotalImages = () => {
  const fs = require('fs');
  const path = require('path');
  const images = fs.readdirSync('public/thumbnails').map((file) => {
    return path.join('./thumbnails', file);
  });
  return images.length;
};

// 获取指定页码和每页数量的图片
const getImages = (page, size) => {
  const fs = require('fs');
  const path = require('path');
  let images = fs.readdirSync('public/thumbnails').map((file) => {
    return path.join('./thumbnails', file);
  });
  images = images.reverse()
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;
  return images.slice(startIndex, endIndex);
};

const buildThumbImages = async (imageList) =>{
  try {
    console.log('-----------开始批量处理缩略图-----------')
    let result = [];
    for (const file of imageList) {
      console.log('开始处理缩略图:', file.path)
      const image = await Jimp.read(file.path);
      await image.resize(thumbnailWidth, thumbnailHeight).write(`public/thumbnails/${file.filename}`);
      result.push(`thumbnails/${file.filename}`);
    }
    return result;
  }catch(err) {
    console.log('处理缩略图失败', err);
  }
}

const compressImages = async (imageList) => {
  const compressedImageList = [];
  for (const file of imageList) {
    const fileName = file.filename;
    const extension = file.path.split('.').pop().toLowerCase();
    try {
      let originImage = await Jimp.read(file.path);
      if (extension !== 'jpg') {
        const compressedImagePath = `public/images/${path.parse(fileName).name}.jpg`;
        await originImage.quality(100).writeAsync(compressedImagePath);
        await deleteFile(file.path);
      }
      let quality = 100;
      let compressedImagePath = `public/images/${path.parse(fileName).name}.jpg`;
      await originImage.quality(quality).writeAsync(compressedImagePath);
      let compressedFile = fs.statSync(compressedImagePath);

      while (compressedFile.size > maxFileSize && quality > 20) {
        quality -= 20;
        compressedImagePath = `public/images/${path.parse(fileName).name}.jpg`;
        await originImage.quality(quality).writeAsync(compressedImagePath);
        compressedFile = fs.statSync(compressedImagePath);
        console.log('当前处理的质量和文件大小',quality,compressedFile.size)
      }
      compressedImageList.push({
        filename: `${path.parse(fileName).name}.jpg`,
        path: compressedImagePath,
      });

    } catch (error) {
      console.error('图片压缩或转格式时报错:', file.filename, error);
      compressedImageList.push(file);
    }
  }
  return compressedImageList;
};

async function deleteFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
    console.log('成功删除文件:', filePath);
  } catch (error) {
    console.error('删除文件报错:', filePath, error);
    throw error; 
  }
}

const moveFiles = (sourceDir = 'public/workspace', destinationDir = 'public/images') => {
  // 获取源目录下的所有文件
  const files = fs.readdirSync(sourceDir);
  // 遍历文件
  files.forEach((file) => {
    // 移动文件
    fs.renameSync(`${sourceDir}/${file}`, `${destinationDir}/${file}`);
  });
};
const getImageName = (path) => {
  return path.match(/[^/]+$/)[0];
}

module.exports = {
  deleteDuplicateFiles,
  getImagesList,
  getTotalImages,
  getImages,
  buildThumbImages,
  moveFiles,
  getImageName,
  compressImages,
};