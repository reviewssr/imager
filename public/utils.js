const Loading = document.getElementById('loading');

// 定义一个公共方法
const changeThumbToImage = (path) => {
  return path.replace('thumbnails', 'images')
};

// 显示 loading 框
const showLoading = ()=> {
  // @ts-ignore
  Loading.style.display = 'block';
}

// 隐藏 loading 框
const hideLoading = ()=> {
  // @ts-ignore
  Loading.style.display = 'none';
}


// 将公共方法暴露给全局作用域
export default {
  changeThumbToImage,
  hideLoading,
  showLoading
};