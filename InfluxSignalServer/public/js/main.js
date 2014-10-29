//caller发起cal时,服务器只对callee的longpol做出响应,未对caller的call做出响应.

$(document).ready(function(){
 
  $("#loginBtn").click(login);
  $("#logoutBtn").click(logout);
  $("#callBtn").click(call);
  $("#sendIceBtn").click(sendIce);
  
  var ws;
  var url = "http://" + window.location.host;
  var tmp;
  var callerId;
  var calleeId;
  
  var localUser = {};
  
  function login (){
    localUser.id = $("#id").val();
    localUser.name = $("#name").val();
  
    $.ajax({
      url: url + "/v1/log_in",
  	  type: "POST",
  	  async: false,
      data: 
  	  {
          "id": localUser.id,
          "name": localUser.name
      },
      success: function(data, status){
	    if (status === 'success'){
		  handleLogedIn(data);
		} 
  	}
    });
    
  }
  
  function handleLogedIn (data){
    //wsInit();
	
	//set localUser info
  	data1 = JSON.parse(data);
  	for (x in data1.users){
  	  if (data1.users[x].id === localUser.id){
  	    localUser.token = data1.users[x].token;
  		break;
  	  }
  	}

    //prepare for a conversation
	
    postLongPol({
	  "id": localUser.id,
	  "token": localUser.token
	});	
  }
  
  function logout() {
    callerId = null;
	calleeId = null;
	
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
  
  function call() {
    callerId = localUser.id;
	calleeId = prompt('input callee id...');
	callStart(callerId, calleeId, localUser.token);
  }
  
  function reply(msg) {
    //TODO
	//handleReply
	calleeId = msg.caller_id;
	callerId = msg.callee_id;
	
	var rep = {
	  "token": localUser.token,
	  "caller_id": msg.caller_id,
	  "callee_id": msg.callee_id,
	  "sdp": "sdp of " + localUser.id
	};
	$.ajax({
	  url: url + "/v1/reply",
	  type: "POST",
	  async: false,
	  data: rep,
	  success: function(data) {
	    console.log(data);
	  }
	});
  }
  
  function reject(msg) {
    var msg = {
	  
	}
  }
  
  function sendIce() {
    var iceCandidate = {
	  "token" : localUser.token,
	  "caller_id" : callerId,
	  "callee_id" : calleeId,
	  "ice_candidate": "ice candidate of " + localUser.id
	};
    $.ajax({
	  url: url + "/v1/ice_candidate",
	  type: "POST",
	  async: false,
	  data: iceCandidate,
	  success : function(data){
	    console.log(data);
	  }
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
		  reject(msg);
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
  
  function print(data) {
    $("#notification").html($("#notification").html() + "<br/>" + data);
  }

});