<script setup >
import AMapLoader from '@amap/amap-jsapi-loader';
import { shallowRef, onMounted, ref, watch } from 'vue'
import { $get, $post } from '../utils/request';


let currentAMap = null

//定义一个map对象
const map = shallowRef(null);
//热门城市
const citys = ref([])
//当前选择的城市id
const city_id = ref('0')
//县区数组 
const areas = ref([])
//当前选择的区县编号
const area_id = ref('0')
//初始化地图的方法
const initMap = () => {
  console.log("initMap")
  console.log(map.value)
  AMapLoader.load({
    key: "f41e26f182d89e341900a31d446d2b60",             // 申请好的Web端开发者Key，首次调用 load 时必填
    version: "2.0",      // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    plugins: [
      'AMap.ToolBar',
      'AMap.Scale',
      'AMap.HawkEye',
      'AMap.MapType',
      'AMap.Geolocation',
      'AMap.DistrictSearch'
    ],       // 需要使用的的插件列表，如比例尺'AMap.Scale'等
  }).then((AMap) => {
    currentAMap = AMap
    map.value = new AMap.Map("container", {  //设置地图容器id
      viewMode: "3D",    //是否为3D地图模式
      pitch: 45,
      zoom: 5,           //初始化地图级别
      center: [105.602725, 37.076636], //初始化地图中心点位置
    });
    //添加地图控件

    // 在图面添加工具条控件，工具条控件集成了缩放、平移、定位等功能按钮在内的组合控件
    map.value.addControl(new AMap.ToolBar({
      position: {
        right: "20px",
        top: "150px",
      }
    }));

    // 在图面添加比例尺控件，展示地图在当前层级和纬度下的比例尺
    map.value.addControl(new AMap.Scale());

    // 在图面添加鹰眼控件，在地图右下角显示地图的缩略图
    map.value.addControl(new AMap.HawkEye({ isOpen: true }));

    // 在图面添加类别切换控件，实现默认图层与卫星图、实施交通图层之间切换的控制
    map.value.addControl(new AMap.MapType());

    // 在图面添加定位控件，用来获取和展示用户主机所在的经纬度位置
    map.value.addControl(new AMap.Geolocation());



  }).catch(e => {
    console.log(e);
  })
}
//获取热门城市
const loadCitys = async () => {
  let ret = await $get('/api/aj/getcitycode', {})
  console.log(ret)
  if (ret?.result?.hotcity) {
    citys.value = ret.result.hotcity
  }
}

//获取城市的区县
const loadAreas = async (citycode) => {
  const { result } = await $get('/api/aj/get_area', { citycode })
  console.log(result)
  const arr = Object.keys(result).map(key => {
    return {
      area_id: key,
      area_name: result[key]
    }
  })
  areas.value = arr
}
//获取商品信息
const loadShops = async () => {
  // //获取市+区县信息
  let cityName = citys.value.find(c => c.code === city_id.value).name
  let areaName = areas.value.find(a => a.area_id === area_id.value).area_name
  let address = cityName + areaName

  // 获取该地址的坐标
  const res = await $get('https://restapi.amap.com/v3/geocode/geo?parameters', {
    key: "2c35e6652f6313e1944411a944443810",
    address
  })
  // location: "116.601144,39.948574"
  const { location } = res.geocodes[0]
  const position = location.split(',')
  map.value.setZoomAndCenter(13, position)



  // 传入经纬度，设置地图中心点 var position = new AMap.LngLat(116, 39);  // 标准写法 简写 var position = [116, 39]; 
  map.value.setCenter(position);
  // 同时设置地图中心点和缩放级别



    //绘制区县边界
    var district = new currentAMap.DistrictSearch({ // 创建行政区查询对象
      subdistrict: 0,//获取边界不需要返回下级行政区
      extensions: 'all', // 返回行政区边界坐标等具体信息
      level: 'district' // 设置查询行政区级别为 区 
    });
    district.search(areaName, function (status, result) {
      var bounds = result.districtList[0].boundaries; // 获取朝阳区的边界信息
      var polygons = [];
      if (bounds) {
        // console.log(result.districtList[0].boundaries, 'result.districtList[0].boundaries;')
        for (var i = 0, l = bounds.length; i < l; i++) {
          var polygon = new currentAMap.Polygon({ //生成行政区划polygon
            map: map.value,
            strokeWeight: 1,
            path: bounds[i],
            fillOpacity: 0.7,
            fillColor: '#CCF3FF',
            strokeColor: '#CC66CC'
          })
          polygons.push(polygon);
        }

        map.value.setFitView();// 地图自适应
      }
    })


  //获取商城信息
  const { shop_data } = await $get('/api/at/shop', {
    city_id: city_id.value,
    area_id: area_id.value
  })
  // 使用clearMap方法删除所有覆盖物
  map.value.clearMap();
  //循环遍历所有的商城
  shop_data.forEach(s => {
    //商城的内容
    let content = `<div style="display:flex;align-items:center"> 
        <div style='margin-right:5px'><img style='width:60px' src="${s.shop_ico}"/></div>
         <div style='font-size:12px'>
             <div>商城: ${s.shop_name}</div>
             <div>地址: ${s.addr}</div>
             <div>电话: ${s.mobile}</div>
             <div>商城简介: ${s.shop_desc}</div>
          </div>
      </div>`
    const marker = new currentAMap.Marker({
      //位置
      position: [s.map_longitude, s.map_latitude],  // 经纬度对象，也可以是经纬度构成的一维数组[116.39, 39.9]
      //标题
      title: s.shop_name
    });
    // 将创建的点标记添加到已有的地图实例：
    map.value.add(marker)
    //给每个marker注册点击事件
    marker.on('click', function (e) {
      //创建并打开一个信息框
      // 创建 infoWindow 实例	
      var infoWindow = new AMap.InfoWindow({
        content: content,  //传入 dom 对象，或者 html 字符串\
        offset: new AMap.Pixel(0, -30)
      });
      console.log(e.target.getPosition())
      // 打开信息窗体
      infoWindow.open(map.value, e.target.getPosition());
    })
  })
}


// 监听城市编码
watch(city_id, (newVal) => {
  area_id.value = '0'
  loadAreas(newVal)
})

// 监听区县编码
watch(area_id, (newVal) => {
  if (newVal !== '0') {
    loadShops(newVal)
  }
  //清除地图上的覆盖物
  map.value.clearMap()
})
onMounted(() => {
  //获取热门城市
  loadCitys()
  initMap();
})
</script>

<template>
  <div class="box">
    <h3>BING 数码商城</h3>
    <div>
      <span>热门城市</span>
      <select v-model="city_id">
        <option value="0">选择城市</option>
        <option v-for="(item, index) in citys" :key="index" :value="item.code">{{ item.name }}</option>
      </select> &nbsp;&nbsp;
      <select v-model="area_id">
        <option value="0">选择区县</option>
        <option v-for="(item, index) in areas" :key="index" :value="item.area_id">{{ item.area_name }}</option>
      </select>
    </div>
  </div>
  <div id="container"></div>
</template>

<style scoped>
.box {
  padding: 5px;
  margin: 5px;
  border: 1px solid #ccc;
  color: #333;
}

.box h3 {
  color: #333;
}

#container {
  padding: 0px;
  margin: 5px;
  box-sizing: border-box;
  height: 650px;
}
</style>
