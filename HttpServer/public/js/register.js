var ErrorCode = {};
  ErrorCode.ERROR_QUERYMYSQL = 434;
  ErrorCode.ERROR_CRASHMYSQL= 444;
  ErrorCode.ERROR_NOREGISTER = 612;//设备未注册
  ErrorCode.ERROR_NOEPG = 613;
  ErrorCode.ERROR_NODIR = 614;
  ErrorCode.ERROR_FAILSCREENSHOT = 615;//截图失败
  ErrorCode.ERROR_TOKEN = 616;//token 验证失败
  ErrorCode.ERROR_BUSY = 617;
  ErrorCode.ERROR_NET = 618;

var localPeerConnection;
var localStream;
var lcoalSdp;
var localChannel;

var TOKEN;
var ws;
var localIces = [];
var remoteIces = [];
var USERS = {};
var heartBeat = 5 * 1000;
var hearBeatInt;

var url = "http://" + window.location.host;
var replyUrl = url + '/v1/reply';
var callUrl = url + '/v1/call';
var polURL = url + '/v1/sync_status';
var iceUrl = url + '/v1/ice_candidate';
var busyURL = url + '/v1/busy';
var endupUrl = url + '/v1/end_up';
var hangupUrl = url + '/v1/hang_up';
var refusedUrl = url + '/v1/refused';

var sendHangupURL;
var stunServerURL;

var myStatus;
var selfId;
var selfName;
var callerId;
var calleeId;
var remoteSdp;

var localVideoContainer;
var remoteVideoContainer;

var callTimeout;
var answerTimeout;

var ep = new EventProxy();
var offerHandleTimeout;

var STUN = webrtcDetectedBrowser === 'firefox' ? 
  {'url':'stun:23.21.150.121'} :  
  {'url': 'stun:stun.l.google.com:19302'};
var TURN = {'url' : 'turn:121.40.188.109:3478', 'credential': 'homeo'}; 
var TURN2 = {
  url: 'turn:numb.viagenie.ca',
  credential: 'muazkh',
  username: 'webrtc@live.com'}; 
var pcConfig = {'iceServers': [STUN, TURN, TURN2]};
var pcConstraints = {
  'optional': [{'DtlsSrtpKeyAgreement': true},
    {'RtpDataChannels': true}
  ]
};
  
  function login(selfId, selfName){
    $.ajax({
      url: url + "/v1/log_in",
  	  type: "POST",
  	  async: false,
      data: 
  	  {
          "id": selfId,
          "name": selfName
      },
      success: function(data, status){
	    if (status === 'success'){
		  data = JSON.parse(data);
		  TOKEN = data.token;
		  wsInit(selfId, TOKEN);
	      heartBeatHandle(data);
		  global.hearBeatInt = self.setInterval("sendHeartBeat()", heartBeat);
		  ep.on('hangup', hangup);
		  myStatus = 'idle';
		} 
  	  }
    });
    return TOKEN;
  }

  
  function logout() {
    callerId = null;
	calleeId = null;
	
	hangup();
	ws.close();
	var msg = {
	  "id": localUser.id,
	  "name": localUser.name
	}
	$.ajax({
	  url: url + "/v1/log_out",
	  type: "POST",
	  async: false,
	  data: msg,
	  succss: function(data){
	    console.log(data);
	  }
	});
  }
