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
    "thumbnail": "/uploads/thumbnail/04e2e97db940a75b_small.jpg",
    "image_src": "/uploads/original/04e2e97db940a75b.jpg",
    "title": "激流勇进",
    "category": "风景",
    "describe": "雷公峡的溪流中，黄色皮划艇劈波斩浪，橙色救生衣在绿意中格外醒目。水花四溅的瞬间，记录了夏日里与自然的热血对话。",
    "location": "广东.惠州",
    "width": 800,
    "height": 1067,
    "is_hdr": true,
    "color_space": "srgb",
    "is_live_photo": true,
    "live_video": "/uploads/live/04e2e97db940a75b.mp4",
    "live_video_h264": null,
    "live_codec": "h264",
    "live_duration": "2.08",
    "live_file_size": "4.95",
    "live_has_audio": true,
    "model": "vivo X200 Pro",
    "focal_length": "46mm",
    "aperture": "f/1.57",
    "shutter_speed": "1/627s"
  },
  {
    "thumbnail": "/uploads/thumbnail/0120f3a74540d8c1_small.jpg",
    "image_src": "/uploads/original/0120f3a74540d8c1.jpg",
    "title": "蔚蓝心事",
    "category": "风景",
    "describe": "惠州的海水清澈见底，礁石在蓝绿色的波光中若隐若现。海浪轻轻拍打着岸边，带走所有的疲惫，只留下这片宁静的蔚蓝。",
    "model": "vivo X200 Pro",
    "focal_length": "46mm",
    "aperture": "f/1.6",
    "shutter_speed": "1/2888s",
    "location": "广东.惠州",
    "width": 800,
    "height": 600,
    "is_hdr": true
  },
  {
    "thumbnail": "/uploads/thumbnail/23c674c31228fdf5_small.jpg",
    "image_src": "/uploads/original/23c674c31228fdf5.jpg",
    "title": "炭火人间",
    "category": "食物",
    "describe": "铁板上的肉片滋滋作响，焦香的边缘泛着诱人的金黄色泽，油脂在高温下闪烁着光芒。这是最简单却最治愈的人间烟火气。",
    "model": "vivo X200 Pro",
    "focal_length": "230mm",
    "aperture": "f/2.7",
    "shutter_speed": "1/50",
    "location": "广东.惠州",
    "width": 800,
    "height": 602,
    "is_hdr": true
  }
]
