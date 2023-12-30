const fs = require('fs')
const path = require('path');
const sharp = require('jimp');

const imageExtensions = ['.jpg', '.png'];
// 设置缩略图的宽度和高度
const thumbnailWidth = 100;
const thumbnailHeight = 100;
// 控制图片质量使其不超过指定大小
const maxFileSize = 800 * 1024; // 800KB

// 定义一个函数来删除所有相同的文件
function deleteDuplicateFiles(directory) {
  // 获取指定目录中的所有文件
  const files = fs.readdirSync(directory);
  // 创建一个对象来存储文件的 MD5 哈希值
  const fileMD5s = {};
  // 遍历所有文件
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // 获取文件的绝对路径
    const file_path = `${directory}/${file}`;
    // 检查文件是否存在
    if (fs.existsSync(file_path)) {
      // 获取文件的 MD5 哈希值
      const md5 = fs.readFileSync(file_path, 'base64');
      // 如果文件的 MD5 哈希值已经存在于对象中，则删除该文件
      if (fileMD5s[md5]) {
        fs.unlinkSync(file_path);
      } else {
        // 如果文件的 MD5 哈希值不存在于对象中，则将该文件的 MD5 哈希值添加到对象中
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
  let result = [];
  for (const file of imageList) {
    const image = await sharp.read(file.path);
    await image.resize(thumbnailWidth, thumbnailHeight).write(`public/thumbnails/${file.filename}`);
    result.push(`thumbnails/${file.filename}`);
  }
  return result;
}

const compressImages = async (imageList) => {
  const compressedImageList = await Promise.all(
    imageList.map(async (file) => {
      const fileName = file.filename;
      const compressedImagePath = `public/images/${path.parse(fileName).name}.jpg`;
      try {
        let originImage = await sharp.read(file.path);
        // 转换为 JPEG 格式并覆盖原始图片
        await originImage.quality(100).writeAsync(compressedImagePath);
        // 删除原始图片
        await deleteFile(file.path);
        let quality = 100;
        image = await sharp.read(compressedImagePath);
        while (image.bitmap.data.length > maxFileSize && quality > 30) {
          quality -= 5;
          image.quality(quality);
        }
        await image.write(compressedImagePath);
        file.filename = `${path.parse(fileName).name}.jpg`;
        file.path = compressedImagePath;
        return file;
      } catch (error) {
        console.error('Error processing image:', fileName, error);
        return file;
      }
    })
  );
  return compressedImageList;
};
async function deleteFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
    console.log('File deleted successfully:', filePath);
  } catch (error) {
    console.error('Error deleting file:', filePath, error);
    throw error; // 抛出异常，使调用者知道删除文件出错了
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