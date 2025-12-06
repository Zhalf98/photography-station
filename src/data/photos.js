/**
 * 照片数据文件
 * 存储分类和照片列表数据
 */

// 分类配置
export const categories = [
  {
    "id": "landscape",
    "name": "风景",
    "icon": "mdi:image",
    "description": "捕捉大自然的壮美与宁静，记录旅途中的每一处风景，从城市的繁华到乡村的宁静，从山川的雄伟到湖泊的宁静。"
  },
  {
    "id": "food",
    "name": "食物",
    "icon": "mdi:coffee",
    "description": "用镜头记录美食的诱人时刻，从色彩到质感，从摆盘到氛围，每一道菜都是一个故事，每一次品尝都是一次体验。"
  }
]

// 照片列表
export const photoGallery = [
  {
    "thumbnail": "/uploads/thumbnail/830da70fd3e55267_small.jpg",
    "image_src": "/uploads/original/830da70fd3e55267.jpg",
    "title": "祈年问天",
    "category": "风景",
    "describe": "蓝色琉璃瓦在北京的阳光下熠熠生辉，祈年殿以最庄严的姿态连接着天地。六百年的风雨洗礼，洗不去那份对苍穹的敬畏与虔诚。站在这里，仿佛能听见历史的回响，感受到古人天人合一的哲思在时空中流转。",
    "model": "Apple iPhone 15",
    "focal_length": "54mm",
    "aperture": "f/1.6",
    "shutter_speed": "1/3115",
    "location": "北京.东城",
    "width": 800,
    "height": 1067
  },
  {
    "thumbnail": "/uploads/thumbnail/23c674c31228fdf5_small.jpg",
    "image_src": "/uploads/original/23c674c31228fdf5.jpg",
    "title": "炭火人间",
    "category": "食物",
    "describe": "230mm长焦镜头拉近了与美食的距离，炭火上的肉片泛着诱人的焦糖色泽，油脂在高温下滋滋作响。这是惠州夜晚最温暖的烟火气，是三五好友围坐时最真实的人间滋味。每一口都是对生活最朴素的热爱。",
    "model": "vivo X200 Pro",
    "focal_length": "230mm",
    "aperture": "f/2.7",
    "shutter_speed": "1/50",
    "location": "广东.惠州",
    "width": 800,
    "height": 602
  }
]
