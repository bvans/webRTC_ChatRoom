var localStream, remoteStream;
var localPeerConnection, remotePeerConnection;
var localSendChannel, remoteSendChannel, localReceiveChannel, remoteReceiveChannel;

var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

var startButton = $("#startButton");
var callButton = $("#callButton");
var hangupButton = $("#hangupButton");

var localSendButton = $("#localSendBtn");
var remoteSendButton = $("#remoteSendBtn");

var msgBox = $("#msgBox");
var localSendBox = $("#localSendBox");
var remoteSendBox = $("#remoteSendBox");

var caller = $("#caller");
var callee = $("#callee");

// 开始按钮的点击事件
startButton.click(start);
// 拨号按钮的点击事件
callButton.click(call);
// 挂断按钮的点击事件
hangupButton.click(hangup);
// 本地 发送按钮的点击事件
localSendButton.click(localSend);
// 远端发送按钮的点击事件
remoteSendButton.click(remoteSend);

/*
 * console.log = function(msg) { msgBox.html(msgBox.html() + "\n" + msg); };
 */

function print(msg) {
	msgBox.html(msgBox.html() + "\n" + msg);
}

function trace(text) {
	console.log((performance.now() / 1000).toFixed(3) + ": " + text);
}

function gotLocalStream(stream) {
	console.log("获取本地媒体成功!");
	if (stream.getVideoTracks().length > 0) {
		console.log('使用的本机视频设备为: ' + stream.getVideoTracks()[0].label);
	}
	if (stream.getAudioTracks().length > 0) {
		console.log('使用的本机音频设备为: ' + stream.getAudioTracks()[0].label);
	}

	localVideo.src = URL.createObjectURL(stream);
	// console.log('将得到的stream设置为本方媒体的src');
	localStream = stream;
	callButton.disabled = false;
}

// 准备拨号:获取本地多媒体设备,并初始化
function start() {
	startButton.disabled = true;

	// console.log('获取本地媒体');
	getUserMedia({
		audio : true,
		video : true
	}, gotLocalStream, function(error) {
		console.log("getUserMedia error: ", error);
	});

}

// 拨号
function call() {
	callButton.disabled = true;
	hangupButton.disabled = false;

	// 打印所使用的设备的标签
	if (localStream.getVideoTracks().length > 0) {
		console.log('使用的本机视频设备为: ' + localStream.getVideoTracks()[0].label);
	}
	if (localStream.getAudioTracks().length > 0) {
		console.log('使用的本机音频设备为: ' + localStream.getAudioTracks()[0].label);
	}

	/*-------------------------------------- 创建本地通道--------------------------------------*/
	console.log('创建本地连接');
	localPeerConnection = new RTCPeerConnection(null, {
		optional : [ {
			RtpDataChannels : true
		} ]
	});

	localPeerConnection.onicecandidate = onLocalIceCandidate;
	// console.log('绑定本地连接的"ICEcandidate"事件:');

	// console.log('绑定本地连接的"addstream事件"');
	// localPeerConnection.onaddstream = localAddStream;

	try {
		// Reliable Data Channels not yet supported in Chrome
		// console.log("本地连接创建发送数据通道");
		localSendChannel = localPeerConnection.createDataChannel(
				"localSendDataChannel", {
					reliable : false
				});
		localChannelInit(localSendChannel);
	} catch (e) {
		alert('本地连接创建发送数据通道 失败:' + e.message);
	}
	/*
	 * localSendChannel.onmessage = handleMessage; localSendChannel.onopen =
	 * handleSendChannelStateChange; localSendChannel.onclose =
	 * handleSendChannelStateChange;
	 */

	/*------------------------------------------创建远端通道------------------------------------------*/
	console.log("创建远端连接");
	remotePeerConnection = new RTCPeerConnection(null, {
		optional : [ {
			RtpDataChannels : true
		} ]
	});

	// console.log('绑定远端连接的"ICEcandidate事件"');
	remotePeerConnection.onicecandidate = onRemoteIceCandidate;

	// console.log('绑定远端连接的"addstream事件"');
	remotePeerConnection.onaddstream = remoteAddStream;

	// console.log('远端连接绑定"datachannel"事件');
	remotePeerConnection.ondatachannel = onRemoteDataChannel;

	// console.log('本地连接挂上本地媒体流');
	localPeerConnection.addStream(localStream);

	console.log('本地连接创建一个offer');
	localPeerConnection.createOffer(createOfferCallback, handleError);
}

function createOfferCallback(RTCsdp) {

	/*
	 * prompt("得到本地的description为:", JSON.stringify(description)); var desc = new
	 * RTCSessionDescription(JSON.parse(prompt("请输入远端的description:")));
	 */

	// console.log('将得到的description添加到本地连接的本地description上');
	console.log('得到本地连接的RTCsdp');
	localPeerConnection.setLocalDescription(RTCsdp);

	var tmpOBJ = JSON.parse(JSON.stringify(RTCsdp));
	localStorage.setItem(caller.val(), JSON.stringify(RTCsdp));
	var description = new RTCSessionDescription(tmpOBJ);

	if (localStorage.length == 1){
		
	}
	console.log('将得到的description添加到远程连接的远程description上');
	remotePeerConnection.setRemoteDescription(description);

	console.log("远端连接创建一个answer");
	remotePeerConnection.createAnswer(createAnswerCallback, handleError);
}

function createAnswerCallback(RTCsdp) {
	console.log('远程连接创建answer成功回调,得到一个RTCSessionDescription:' + RTCsdp);

	console.log('远程连接将得到的description添加到其本地description上');
	remotePeerConnection.setLocalDescription(RTCsdp);

	console.log('同时将该description添加的本地连接的远程description上');
	localPeerConnection.setRemoteDescription(RTCsdp);

}

function hangup() {
	console.log("Ending call");
	localPeerConnection.close();
	remotePeerConnection.close();
	localPeerConnection = null;
	remotePeerConnection = null;
	hangupButton.disabled = true;
	callButton.disabled = false;
}

function remoteAddStream(event) {

	console.log('远端连接的"addstream"事件发生,获得一个MediaStream: evetn.stream');
	console.log('远端连接将得到的stream设置为其视频源');

	remoteVideo.src = URL.createObjectURL(event.stream);
}

function onRemoteDataChannel(event) {
	console
			.log('RemoteConn的dataChannel事件发生,获得一个RTCDataChannel: even.dataChannel');
	remoteReceiveChannel = event.channel;
	remoteChannelInit(remoteReceiveChannel);
	console.log("绑定remoteChannel相关事件");
}

function localHandleMessage(event) {
	// console.log('远端接收通道的message事件发生,获得message:event.data"' + event.data +
	// '"');
	print(this.label + " get message:" + event.data);
	console.log(this.label + "'s message event is sent");
}

function remoteHandleMessage(event) {
	// console.log('远端接收通道的message事件发生,获得message:event.data"' + event.data +
	// '"');
	print(this.label + " get message:" + event.data);
	console.log(this.label + "'s message event is sent");
}

function handleChannelStateChange() {
	console.log('通道状态改变:' + this.readyState);
	var readyState = this.readyState;
	if (readyState == "open") {

	} else {

	}
}

function onLocalIceCandidate(event) {
	console.log("本地连接的ICEcandidate事件发生,获得的一个ICECandidate:event.candidate");
	if (event.candidate) {

		var tmpObj = JSON.parse(JSON.stringify(event.candidate));

		console.log('本地连接添加获得的candidate');
		remotePeerConnection.addIceCandidate(new RTCIceCandidate(tmpObj));

	}
}

function onRemoteIceCandidate(event) {
	console.log('远端连接的candidate事件发生');
	if (event.candidate) {

		var tmpObj = JSON.parse(JSON.stringify(event.candidate));

		console.log('远端连接将得到的ICEcandidate添加到本连接上去');
		localPeerConnection.addIceCandidate(new RTCIceCandidate(tmpObj));
	}
}

function localSend() {
	if (localSendBox.val().length > 0) {
		localSendChannel.send(localSendBox.val());
	}
}
function remoteSend() {
	if (remoteSendBox.val().length > 0) {
		remoteReceiveChannel.send(remoteSendBox.val());
	}
}

function localChannelInit(channel) {
	channel.onmessage = localHandleMessage;
	channel.onopen = handleChannelStateChange;
	channel.onclose = handleChannelStateChange;
}

function remoteChannelInit(channel) {
	channel.onmessage = remoteHandleMessage;
	channel.onopen = handleChannelStateChange;
	channel.onclose = handleChannelStateChange;
}

function handleError() {
}
