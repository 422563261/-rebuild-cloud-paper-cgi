# 后端说明

## 功能概述
1. 接受创建请求，生成token，返回客户端
2. 接受用户的数据，通过websocket广播转发，并在本地存储


## 接口
1. /token/create 向服务器申请创建一个演示间，获取一个token，然后马上建立ws连接
	* method:GET
	* 返回：token：一个16位随机字符串，每4个字母用一个-分割，因此字符串长度一共为16+3
2. /token/destroy/:token 销毁演示间
	* method:GET
	* :token:要销毁的token。仅有“发送绘制事件”权限的用户发送的该请求才会被处理
3. /websocket/connect/:token 建立ws连接，相当于加入演示间


## 结构说明
* api
	* websocket.js
	* token.js
	* 
	*
* storage
* app.js
* api_router.js
* dispatch.js


## 扩展建议
1. 不用创建token，AR扫一扫类似物品进入同一个房间（类似于支付宝那种）