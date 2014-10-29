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

var myname = $("#caller");
var callee = $("#callee");

var caller;
var callerSdp;

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
	msgBox.html(msgBox.html() + msg  + "\n");
}

function trace(text) {
	console.log((performance.now() / 1000).toFixed(3) + ": " + text);
}

function gotLocalStream(stream) {
	console.log("获取本地媒体成功!");
	localVideo.src = URL.createObjectURL(stream);
	// console.log('将得到的stream设置为本方媒体的src');
	localStream = stream;

}

// 准备拨号:获取本地多媒体设备,并初始化
function start() {
	//localStorage.clear();
	
	getUserMedia({
		audio : true,
		video : true
	}, gotLocalStream, function(error) {
		alert("getUserMedia error: ", error);
	});

	/*-------------------------------------- 创建本地连接--------------------------------------*/
	console.log('创建本地连接');
	localPeerConnection = new RTCPeerConnection(null, {
		optional : [{
			RtpDataChannels : true
		}]
	});

	// console.log('绑定本地连接的"ICEcandidate"事件:');
	localPeerConnection.onicecandidate = onLocalIceCandidate;

	// console.log('绑定本地连接的"addstream事件"');
	localPeerConnection.onaddstream = localAddStream;
	
	localPeerConnection.ondatachannel = gotReceiveChannel;
	
	window.setTimeout("getCallerSdp()", 1000);
		

	
	/*if (localStorage.getItem("callee") == myname.val()) {
		caller = localStorage.getItem("caller");
		localStorage.removeItem("caller");
		//alert(caller + " is calling you!");
		callerSdp = new RTCSessionDescription(JSON.parse(localStorage
				.getItem("callerSdp")));
		localStorage.removeItem("callerSdp");
		localPeerConnection.setRemoteDescription(callerSdp);

		localPeerConnection.createAnswer(createAnswerCallback, handleError);
		return;
	} else {
		alert("no calling.");
	}*/
	

}

function getCallerSdp(){
	if (localStorage.getItem("callerSdp") != null && localStream!= null) {
		myname.val(localStorage.getItem("callee"));
		callee.val(localStorage.getItem("caller"));
		
		console.log("callerSdp getted!");
		callerSdp = new RTCSessionDescription(JSON.parse(localStorage
				.getItem("callerSdp")));
		//localStorage.removeItem("callerSdp");
		localPeerConnection.setRemoteDescription(callerSdp);

		// console.log('本地连接挂上本地媒体流');
		localPeerConnection.addStream(localStream);
		localPeerConnection.createAnswer(createAnswerCallback, handleError);
		
		//window.setTimeout("getCallerCandidate()", 1000);
		return;

	}else{
		window.setTimeout("getCallerSdp()", 1000);
	}
	
}

function getCallerCandidate() {
	if (localStorage.getItem("callerCandidate") != null){
		console.log("callerCandidate getted!");
		callerCandidate = JSON.parse(localStorage.getItem("callerCandidate"));
		localPeerConnection.addIceCandidate(new RTCIceCandidate(callerCandidate));
		return;
	}else{
		window.setTimeout("getCallerCandidate()", 1000);
	}
	
}



function call() {
	var callerCandidate = localStorage.getItem("callerCandidate");
	if (callerCandidate != null){
		localPeerConnection.addIceCandidate(new RTCIceCandidate(callerCandidate));
	}


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

	if (localStorage.length == 1) {

	}
	console.log('将得到的description添加到远程连接的远程description上');
	remotePeerConnection.setRemoteDescription(description);

	console.log("远端连接创建一个answer");
	remotePeerConnection.createAnswer(createAnswerCallback, handleError);
}

function createAnswerCallback(RTCsdp) {
	console.log('远程连接创建answer成功回调,得到一个RTCSessionDescription:' + RTCsdp);

	console.log('远程连接将得到的description添加到其本地description上');
	localPeerConnection.setLocalDescription(RTCsdp);

	localStorage.setItem("calleeSdp", JSON.stringify(RTCsdp));
}

function hangup() {
	console.log("Ending call");
	localPeerConnection.close();
	localPeerConnection = null;
	print("Calling ended...");
}

function localAddStream(event) {
	console.log("addStream informed");
	remoteVideo.src = URL.createObjectURL(event.stream);

}


function gotReceiveChannel(event){
	localChannelInit(event.channel);
	console.log("get a channel");
}



function localHandleMessage(event) {
	console.log('远端接收通道的message事件发生,获得message:event.data"' + event.data +
	 '"');
	print(localStorage.getItem("caller") + ":" + event.data);
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
	
	if (event.candidate) {
		console.log("本地连接的ICEcandidate事件发生,获得的一个ICECandidate:event.candidate");
		localStorage.setItem("calleeCandidate", JSON.stringify(event.candidate));

		//console.log('本地连接添加获得的candidate');
		//remotePeerConnection.addIceCandidate(new RTCIceCandidate(tmpObj));

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
		localChannel.send(localSendBox.val());
	}
}

function localChannelInit(channel) {
	localChannel = channel;
	localChannel.onmessage = localHandleMessage;
	localChannel.onopen = handleChannelStateChange;
	localChannel.onclose = handleChannelStateChange;
}


function handleError() {
}
