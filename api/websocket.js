var {stdRes, Room} = require('../lib')
var cookieParser = require('cookie-parser')
var Cookie = require('cookie')
var fs = require('fs')

// 请求建立连接
exports.connect = function (req, res) {
  var token = req.params.token
  var passwd = req.params.passwd
  if (!global.ROOMS[token]) {
    res.send(stdRes('token无效', 102))
    return
  }
  // 校验passwd
  if (global.ROOMS[token].passwd && global.ROOMS[token].passwd !== passwd) {
    res.send(stdRes('password不正确', 104))
    return
  }
  // 通过
  res.cookie('token', token)
  if (passwd) res.cookie('passwd', passwd)
  res.send(stdRes())
  return
}

// 查看与websocket连接相关信息
exports.getRooms = function (req, res) {
  var result = {rooms: []}
  for (let token in global.ROOMS) {
    result.rooms.push({
      id: global.ROOMS[token].roomId,
      token: global.ROOMS[token].token,
      passwd: !!global.ROOMS[token].token,
    })
  }

  res.send(stdRes('ok', 0, result))
  return

  var room
  for (var i = 0; i < ROOMS.length; i++) {
    room = {
      id: ROOMS[i].id,
      token: ROOMS[i].token
    }
    rooms.push(room)
  }
  console.log('rooms:' + rooms)
  // 返回
  res.send(rooms)

}

global.IO.on('connection', function (socket) {

  if (!socket.request.headers.cookie) {
    // console.log('cookie is empty');
    return
  }
  var cookieObj = Cookie.parse(socket.request.headers.cookie)

  var token = cookieObj.token
  var passwd = cookieObj.passwd
  var room
  // console.log('client connection use ' + token);

  // 第一个使用token的为房间所有者
  if (global.TOKENS.indexOf(token) !== -1) {
    // console.log('create room: ' + token);
    // 销毁token
    global.TOKENS.splice(global.TOKENS.indexOf(token), 1)
    // 创建房间
    room = new Room({
      token,
      roomId: global.ROOMS_ID++
    })
    global.ROOMS[token] = room

    // 为房间设置密码
    if (global.TOKEN2PASSWD[token]) {
      room.passwd = global.TOKEN2PASSWD[token]
      delete global.TOKEN2PASSWD[token]
    }
    // 添加连接，绑定事件
    room.connectPool.push(socket)
    socket.on('message', function (data) {
      room.historyData.push(arguments)
      for (let link of room.connectPool.slice(1)) {
        link.emit('message', ...arguments)
      }
    })
    socket.on('video', function (data) {
      // console.log(room.connectPool.length)
      for (let link of room.connectPool) {
        link.emit('video', data)
      }
    })
    socket.on('chat', function (data) {
      room.historyChat.push(arguments)
      for (let link of room.connectPool) {
        link.emit('chat', data)
      }
    })
    return
  }

  socket.on('chat', function (data) {
    global.ROOMS[token].historyChat.push(arguments)
    for (let link of global.ROOMS[token].connectPool) {
      link.emit('chat', data)
    }
  })
  socket.on('video', function (data) {
    global.ROOMS[token].historyChat.push(arguments)
    for (let link of global.ROOMS[token].connectPool) {
      link.emit('video', data)
    }
  })

  //token无效

  if (!token || !global.ROOMS[token]) {
    // console.log('token invalid: ' + token);
    socket.disconnect()
    return
  }
  // passwd无效
  if (global.ROOMS[token].passwd && global.ROOMS[token].passwd !== passwd) {
    // console.log('password illegal');
    socket.disconnect()
    return
  }

  // 观众连接
  console.log('add connect pool: ' + token)
  global.ROOMS[token].connectPool.push(socket)
  global.ROOMS[token].connectPool.forEach(link => {
    link.emit('refresh', 'refresh')
  })
  // 将所有历史数据推过去
  global.ROOMS[token].historyData.forEach(function (data) {
    socket.emit('message', ...data)
  })
  // global.ROOMS[token].historyVideo.forEach(function (data) {
  //   socket.emit('video', ...data)
  // })
  global.ROOMS[token].historyChat.forEach(function (data) {
    socket.emit('chat', ...data)
  })
})


