/*global getUserMedia, RTCSessionDescription, createIceServer, attachMediaStream,
attachMediaStream, reattachMediaStream, RTCPeerConnection*/

var localPeerConnection;
var localStream;
var lcoalSdp;
var localChannel;
var TOKEN;
var ws;
var localIces = [];
var remoteIces = [];
var url = "http://" + window.location.host;

var replyPath = url + '/v1/reply';
var callPath = url + '/v1/call';
var polURL = url + '/v1/signal';
var icePath = url + '/v1/ice_candidate';
var sendHangupURL;
var stunServerURL;

var selfId;
var callerId;
var calleeId;
var remoteSdp;

var localVideoContainer;
var remoteVideoContainer;

var STUN = webrtcDetectedBrowser === 'firefox' ? 
  //{'url':'stun:23.21.150.121'} : 
  {'url':'stun:localhost:9999'} : 
  {'url': 'stun:stun.l.google.com:19302'};
//var TURN = {'url' : 'turn:homeo@turn.bistri.com:80', 'credential': 'homeo'};
var TURN = {
  url: 'turn:numb.viagenie.ca',
  credential: 'muazkh',
  username: 'webrtc@live.com'};
var pcConfig = {'iceServers': [STUN, TURN]};
var pcConstraints = {
  'optional': [{'DtlsSrtpKeyAgreement': true},
    {'RtpDataChannels': true}
  ]
};

function postLongPol(postData) {
  selfId = postData.id;
  TOKEN = postData.token;
  
  $.ajax({
    url: polURL,
	type: "POST",
	data: postData,
    success: polHandle
  });
}

function wsInit(){
    ws = null;
    ws = new WebSocket('ws://' + host);
	
    ws.onmessage = function(event) {
      var msg = JSON.parse(event.data);
  	  if (msg.signal === 'loggedIn') {
  	    print(msg.username + ' logged in.');
  	  }
  	  else if (msg.signal === 'loggedOut'){
  	    print(msg.username + ' logged out.');
  	  }
	  else if (msg.signal === 'offer') {
	    //TODO
		//offerHandle
		
	    print('get an offer: ' + JSON.stringify(msg));
		var isReady = confirm(msg.caller_id + " is calling...");
		if (isReady) {
		  reply(msg);
		}else {
		  print('You rejected ' + msg.caller_id + "'s calling.");
		}
	  }
	  else if (msg.signal === 'answer') {
	    //TODO
		//answerHandle
		
	    print('get an answer: ' + JSON.stringify(msg));
	  }
	  else if (msg.signal === 'ice_candidate') {
	    //TODO
		//getIceCandidateHndale
		print('get an iceCandidate' + JSON.stringify(msg));
	  }
    };
    
    ws.onopen = function() {
      var req = {
  	  "id": localUser.id,
  	  "token": localUser.token,
  	  "signal": "login"
  	};
  	this.send(JSON.stringify(req));
    }
      
  }

//服务器推送"offer"时被动触发
function offerHandle(data) {
  remoteSdp = new RTCSessionDescription(JSON.parse(data.content));
  callerId = data.caller_id;
  calleeId = data.callee_id;

  getUserMedia({
    audio: true,
    video: true
  }, reply, function(error) {
    alert("getUserMedia error: " + error);
	return;
  });
}

//作为caller收到callee的answer时触发
function answerHandle(data) {
  remoteSdp = new RTCSessionDescription(JSON.parse(data.content));
  localPeerConnection.setRemoteDescription(remoteSdp, function(){
    console.log('set remote sdp.');
  }), handleError
}

//收到iceCandi时处理
function candidateHandle(data) {
  var ices = JSON.parse(data.content);
  for (var x in ices) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: ices[x].sdpMLineIndex,
      candidate: ices[x].candidate
	});
	remoteIces.push(candidate);
  }
  
  if (selfId === callerId) {
    for (var x in remoteIces) {
      localPeerConnection.addIceCandidate(remoteIces[x]);
	  console.log('add one ice');
    }
  }
}

//作为callee在获取本地媒体成功时被触发
function reply(stream){
  localVideoContainer = document.getElementById("localVideo");
  attachMediaStream(localVideoContainer, stream);
  localStream = stream;
 /*-------------------------------------- 创建peerconnection--------------------------------------*/
  localPeerConnection = new RTCPeerConnection(pcConfig, pcConstraints);
  localPeerConnection.onicecandidate = onLocalIceCandidate;
  // console.log('绑定本地连接的addstream事件');
  localPeerConnection.onaddstream = onAddStream;
  // console.log('绑定本地连接的ondataChannel')
  localPeerConnection.ondatachannel = onDataChannel;

  localPeerConnection.addStream(localStream);
  localPeerConnection.setRemoteDescription(remoteSdp, function(){
    console.log('set remote sdp.');
  }, handleError);
  localPeerConnection.createAnswer(createAnswerCallback, handleError);

}

//作为caller准备视频通话
function callStart(callerID, calleeID, token, type) {
  callerId = callerID;
  calleeId = calleeID;
  TOKEN = token;
  
  getUserMedia({
    audio: true,
    video: true
  }, call, function(error) {
    alert("getUserMedia error: " + error);
	return;
  });
}

//添加本地媒体成功时调用
function call(stream) {
  localVideoContainer = document.getElementById("localVideo");
  attachMediaStream(localVideoContainer, stream);
  localStream = stream;
  
  /*-------------------------------------- 创建peerconnection--------------------------------------*/
  localPeerConnection = new RTCPeerConnection(pcConfig, pcConstraints);
  localPeerConnection.onicecandidate = onLocalIceCandidate;
  // console.log('绑定本地连接的addstream事件');
  localPeerConnection.onaddstream = onAddStream;
  // console.log('绑定本地连接的ondataChannel')
  localPeerConnection.ondatachannel = onDataChannel;
  
  try {
	if (!localChannel){
	  localChannel = localPeerConnection.createDataChannel(
        "localSendDataChannel", {
        reliable : false
      });
      localChannelInit();
    } 
  }catch (e) {
      alert('本地连接创建发送数据通道 失败:' + e.message);
  }
  
  localPeerConnection.addStream(localStream);
  localPeerConnection.createOffer(createOfferCallback, handleError);
}

//用户主动操作触发
function hangup() {
  localDataChannel.close();
  localDataChannel = null;
  localStream.stop();
  localPeerConnection.removeStream(localStream);
  localStream = null;
  localPeerConnection.close();
  localPeerConnection = null;
}

function polHandle(data) {
  //收到消息后再次发送一个长连接
  $.ajax({
    url: polURL,
	type: "POST",
	data: {
	  "id": selfId,
	  "token": TOKEN
	},
    success: polHandle
  });
  
  data = JSON.parse(data);
  if (data.signal === undefined) {
    return;
  }

  if (data.signal === "offer") {
    offerHandle(data);
  }
  else if (data.signal === "answer") {
    answerHandle(data);
  }
  else if (data.signal === "ice_candidate") {
    candidateHandle(data);
  }
  return;
}

function onLocalIceCandidate(event) {
  console.log('handleIceCandidate event');
  if (event.candidate) {
	localIces.push(event.candidate);
	 //sendIce(iceCand);
  } else {
    console.log('End of candidates.\niceGatheringState:' + 
	  localPeerConnection.iceGatheringState
	);
	if (selfId === callerId) {
	  sendSdp(callerId, calleeId, lcoalSdp);
	} else {
	  replySdp(callerId, calleeId, lcoalSdp);
	}

	var data = {
	  "token": TOKEN,
	  "caller_id": callerId,
	  "callee_id": calleeId,
	  "ice_candidate": JSON.stringify(localIces)
	};
	sendIce(data);
  }
}

function createOfferCallback (RTCsdp) {
  lcoalSdp = RTCsdp;
  localPeerConnection.setLocalDescription(RTCsdp);
  console.log('set local sdp');
  //sendSdp(callerId, calleeId, lcoalSdp);
}

function createAnswerCallback (RTCsdp) {
  lcoalSdp = RTCsdp;
  localPeerConnection.setLocalDescription(RTCsdp);
  console.log('set local sdp');
  for (var x in remoteIces) {
    console.log('add one ice');
    localPeerConnection.addIceCandidate(remoteIces[x]);
  }
  //replySdp(callerId, calleeId, lcoalSdp);
}

function onDataChannel(event) {
  console.log('Receive Channel Callback');
  localChannel = event.channel;
  localChannelInit();
}

function onAddStream(event) {
  remoteVideoContainer = document.getElementById("remoteVideo")
  attachMediaStream(remoteVideoContainer, event.stream);
  console.log("add remote stream");
}

function handleMessage(event) {
  console.log('Received message: ' + event.data);
}

function localChannelInit() {
  console.log('DataChanne Inited.');
  localChannel.onmessage = onChannelMsg;
  localChannel.onopen = onChannelOpen;
  localChannel.onclose = onChannelClose;
}

function onChannelMsg(event) {
  console.log('远端接收通道的message事件发生,获得message:event.data"' + event.data + '"');
  //print(event.data);
}

function onChannelOpen() {
  console.log("localChannel is open.");
}

function onChannelClose() {
  console.log("localChannel is closed.");
}

function handleError(err) {
  console.log(JSON.stringify(err));
}

function replyErr(caller_id, callee_id, err) {
  var json = {
    "token": token,
    "caller_id": callee_id,
    "callee_id": callee_id,
    "error": err
  };
  $.post(replyURl, json, function(data, textStatus, jqXHR) {
    console.log("data:" + data);
    console.log("textStatus:" + textStatus);
    console.log("jqueryXHR:" + jqXHR);
  });
}

function sendSdp(caller_id, callee_id, sdp) {
  var msg = {
    "token": TOKEN,
    "caller_id": callerId,
    "callee_id": calleeId,
    "sdp": JSON.stringify(sdp)
  };
  
  $.ajax({
    url: callPath,
	type: 'POST',
	data: msg,
	success: function(data, statues){
	  console.log(data);
	}
  });
}

function replySdp(caller_id, callee_id, sdp) {
  var msg = {
    "token": TOKEN,
    "caller_id": caller_id,
    "callee_id": callee_id,
    "sdp": JSON.stringify(sdp)
  };
  
  $.ajax({
    url: replyPath,
	type: 'POST',
	data: msg,
	success: function(data, statues){
	  console.log(data);
	}
  });
}

function sendIce(ice) {
  $.ajax({
    url: icePath,
	type: "POST",
	data: ice,
	success: function(data, status){
	  
	}
  });
}

function callErr(caller_id, callee_id, err) {
  var json = {
    "token": token,
    "caller_id": callee_id,
    "callee_id": callee_id,
    "error": err
  };
  $.post(callURL, json, function(data, textStatus, jqXHR) {
    console.log("data:" + data);
    console.log("textStatus:" + textStatus);
    console.log("jqueryXHR:" + jqXHR);
  });
}

function sendHangup(caller_id, callee_id) {
  var json = {
    "token": token,
    "caller_id": caller_id,
    "callee_id": callee_id
  }
  $.post(sendHangupURL, json, function(data, textStatus, jqXHR) {
    console.log("data:" + data);
    console.log("textStatus:" + textStatus);
    console.log("jqueryXHR:" + jqXHR);
  });
}