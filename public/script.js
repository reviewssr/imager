import utils from './utils.js';
const imagesContainer = document.getElementById('images');
let modal = document.getElementById('modal');
let modalImg = document.getElementById('modal-img');
const deleteButton = document.getElementById('delete-button');
const selectButton = document.getElementById('select-button');
const toastContainer = document.getElementById('toast-container');
const deleteDuplicateButton = document.getElementById('delete-duplicate-button');
const prevPageButton = document.getElementById('prev-page-button');
const nextPageButton = document.getElementById('next-page-button');
const currentPageElement = document.getElementById('current-page');
const totalPagesElement = document.getElementById('total-pages');
const pageSizeSelect = document.getElementById('page-size-select');
const pageNumberInput = document.getElementById('page-number-input');
const goToPageButton = document.getElementById('go-to-page-button');


let selectMode = false;
// 设置默认每页展示数量
let pageSize = localStorage.getItem('pageSize') || 20;
// @ts-ignore
pageSizeSelect.value = pageSize;
// 设置默认当前页码
let currentPage = 1;
let totalPages;
let totalImages;
let CURRENT_PAGE_IMAGES;
let CURRENT_IMAGE;

// 获取元素
const form = document.querySelector('form');
// 添加事件监听器
// @ts-ignore
form.addEventListener('submit', (event) => {
  event.preventDefault();
  utils.showLoading();
  // 收集表单数据
  const formData = new FormData(form);
  // 将文件上传到服务器
  fetch('/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    utils.hideLoading()
    // 处理服务器返回的数据
    if (data.success) {
      createToast('文件上传成功', 'success');
      console.log("上传结果",data)
      init()
    } else {
      createToast('文件上传失败', 'error');
    }
  })
  .catch(error => {
    utils.hideLoading()
    console.log('上传错误：',error)
    // 处理错误
    createToast('文件上传失败', 'error');
  });
});


// 选中按钮
selectButton.addEventListener('click', () => {
  // 切换选中模式
  selectMode = !selectMode;
  // 更新按钮文本
  selectButton.textContent = selectMode ? '取消选中' : '选中';
  // 取消所有图片元素的 `selected` 类
  imagesContainer.querySelectorAll('img').forEach(image => {
    image.classList.remove('selected');
  });
});

// 图片点击
imagesContainer.addEventListener('click', (event) => {
  // 如果点击的是图片元素
  if (event.target.tagName === 'IMG' && selectMode) {
    // 切换图片元素的 `selected` 类
    event.target.classList.toggle('selected');
  }
  if (event.target.tagName === 'IMG' && !selectMode){
    // 显示模态框
    modal.style.display = 'block';
    let imageSrc = event.target.src;
      // 设置模态框中的图片的 `src` 属性
    modalImg.src = utils.changeThumbToImage(imageSrc);
    CURRENT_IMAGE = imageSrc.match(/thumbnails\/[^/]+$/)[0];
  }
});

// 删除按钮
deleteButton.addEventListener('click', () => {
  // 获取要删除的图片的路径
  const imagePaths = [];
  imagesContainer.querySelectorAll('img').forEach(image => {
    if (image.classList.contains('selected'))
      imagePaths.push(image.src);
  });
  console.log('要删除的图片是',imagePaths)
  // 发送删除请求到服务器
  fetch('/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imagePaths: imagePaths
    })
  })
  .then(response => response.json())
  .then(data => {
    // 更新图片列表
    init()
    selectButton?.click()
  });
});

// 添加事件监听器
deleteDuplicateButton.addEventListener('click', ()=>{
   // 将所有图片的源地址发送到后端
   fetch('/delete-duplicate-images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      directory: ''
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      init()
      createToast('多余的相同文件已删除', 'success');
    } else {
      createToast('删除多余的相同文件失败', 'error');
    }
  })
  .catch(error => {
    createToast('删除多余的相同文件失败', 'error');
  });
});

// 定义更新图片列表的方法
function updateImageList(imageList) {
  // 清空图片列表
  imagesContainer.innerHTML = '';
  // 遍历图片文件路径
  imageList.forEach(image => {
    const img = document.createElement('img');
    img.src = image;
    img.width = 100;
    img.height = 100;
    // @ts-ignore
    imagesContainer.appendChild(img);
  });
}

// 获取图片数据
const getImages = async (page, size) => {
  const response = await fetch(`/api/images?page=${page}&size=${size}`);
  const data = await response.json();
  const imageList = data.imageList;
  CURRENT_PAGE_IMAGES = imageList;
  updateImageList(imageList); 
  return data;
};
// 创建 Toast 消息
function createToast(message, type) {
  const toast = document.createElement('div');
  toast.classList.add('toast');
  toast.classList.add(`toast--${type}`);
  toast.textContent = message;
  // 添加 Toast 消息到容器中
  toastContainer.appendChild(toast);
  // 5 秒后自动关闭 Toast 消息
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// 更新分页信息
const updatePagination = (totalImages, pageSize) => {
  totalPages = Math.ceil(totalImages / pageSize);
  totalPagesElement.textContent = totalPages;
  if (currentPage === 1) {
    prevPageButton.disabled = true;
  } else {
    prevPageButton.disabled = false;
  }
  if (currentPage === totalPages) {
    nextPageButton.disabled = true;
  } else {
    nextPageButton.disabled = false;
  }
  currentPageElement.innerHTML = currentPage
};

// 获取图片总数
const getTotalImages = async () => {
  const response = await fetch('/api/images/count');
  const data = await response.json();
  return data.count;
};

// 设置每页展示数量
pageSizeSelect.addEventListener('change', async (e) => {
  pageSize = parseInt(e.target.value);
  localStorage.setItem('pageSize', pageSize);
  currentPage = 1;
  let totalImages = await getTotalImages();
  updatePagination(totalImages, pageSize);
  const images = await getImages(currentPage, pageSize);
  renderImages(images);
});

// 上一页
prevPageButton.addEventListener('click', async () => {
  if (currentPage > 1) {
    currentPage--;
    const images = await getImages(currentPage, pageSize);
    updatePagination(totalImages, pageSize);
  }
});

// 下一页
nextPageButton.addEventListener('click', async () => {
  if (currentPage < totalPages) {
    currentPage++;
    const images = await getImages(currentPage, pageSize);
    updatePagination(totalImages, pageSize);
  }
});


/**
 * modal点开后操作
 */
const nextButton = document.getElementById('next-button');
const previousButton = document.getElementById('previous-button');
const modalDeleteButton = document.getElementById('modal-delete-button');
const modalOverlay = document.getElementById('modal-overlay');

modalOverlay.addEventListener('click', () => {
  closeModal();
});

// 点击非模态框区域模态框关闭
// document.addEventListener('click', (e) => {
//   if (!modal.contains(e.target)) {
//     closeModal();
//   }
// });

// 关闭模态框
function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// modal点开后操作
nextButton.addEventListener('click', (e) => {
  e.stopPropagation();
  let currentIndex = CURRENT_PAGE_IMAGES.indexOf(CURRENT_IMAGE);
  let nextIndex = currentIndex + 1;
  if (nextIndex >= CURRENT_PAGE_IMAGES.length) {
    nextIndex = 0;
  }
  const nextImage = CURRENT_PAGE_IMAGES[nextIndex];
  modalImg.src = utils.changeThumbToImage(nextImage);
  CURRENT_IMAGE = nextImage;
});

previousButton.addEventListener('click', (e) => {
  e.stopPropagation();
  let currentIndex = CURRENT_PAGE_IMAGES.indexOf(CURRENT_IMAGE);
  let previousIndex = currentIndex - 1;
  if (previousIndex < 0) {
    previousIndex = CURRENT_PAGE_IMAGES.length - 1;
  }
  const previousImage = CURRENT_PAGE_IMAGES[previousIndex];
  modalImg.src =  utils.changeThumbToImage(previousImage);
  CURRENT_IMAGE = previousImage;
});


modalDeleteButton.addEventListener('click', (e) => {
  e.stopPropagation();
  // Close the modal
  modal.style.display = 'none';
});

goToPageButton.addEventListener('click', () => {
  let pageNumber = pageNumberInput.value;
  if(!pageNumber) createToast('请输入正确页面', 'error');
  pageNumber = parseInt(pageNumber);
  // 检查页码是否有效
  if (pageNumber < 1 || pageNumber > totalPages) {
    createToast("输入页面信息无效", "error")
    return;
  }
  // 跳转到指定的页面
  currentPage = pageNumber;
  updatePagination(totalImages,pageSize);
  getImages(currentPage, pageSize);
});






// 初始化
const init = async () => {
  totalImages = await getTotalImages();
  updatePagination(totalImages, pageSize);
  const images = await getImages(currentPage, pageSize);
  // renderImages(images);
};

init();

// 监听页面加载事件
window.addEventListener('load', () => {
  utils.hideLoading();
});

// 监听 AJAX 请求开始事件
document.addEventListener('ajaxStart', () => {
  utils.showLoading();
});

// 监听 AJAX 请求结束事件
document.addEventListener('ajaxStop', () => {
  utils.hideLoading();
});

// 监听 AJAX 请求出错事件
document.addEventListener('ajaxError', () => {
  utils.hideLoading();
});
