function sendHeartBeat() {
    $.ajax({
        url: polURL,
        type: "POST",
        data: {
            'token': TOKEN,
            'id': selfId,
        },
        success: heartBeatHandle,
        error: function (err) {
            console.log('send heartBeat error.');
            easyDialog.open({
                container: {
                    content: '与服务器断开连接,正在重连...',
                    yesFn: false,
                    noFn: false
                },
                fixed: false,
            });
        }
    });
}

//WebSocket处理
function wsInit(id, token) {
    ws = null;
    ws = new WebSocket('ws://' + window.location.host);

    ws.onmessage = function (event) {
        var msg = JSON.parse(event.data);

        if (msg.error !== undefined) {
            if (msg.error.code === ErrorCode.ERROR_TOKEN) {
                console.log('Token with ws Error.');
                tokenErrHandle();
                return;
            }
        }
        else if (msg.signal === 'offer') {
            console.log('get an offer from  ' + msg.caller_id);

            function _timeoutHandle() {
                return function () {
                    console.log('handle offer timeout.');
                    if (myStatus === 'busy') {
                        return;
                    }
                    easyDialog.close();
                    rejectOffer(msg.caller_id, msg.callee_id);
                    hangup();
                }
            }

            function _offerHandle(msg) {
                return function () {
                    clearTimeout(offerHandleTimeout);
                    offerHandle(msg);
                }
            }

            function _reject(msg) {
                return function () {
                    clearTimeout(offerHandleTimeout);
                    rejectOffer(msg.caller_id, msg.callee_id);
                }
            }

            if (myStatus !== 'idle') {
                rejectOffer(msg.caller_id, msg.callee_id);
                return;
            }
            myStatus = 'ready';

            easyDialog.open({
                container: {
                    header: '提示',
                    content: msg.caller_id + "请求与您视频通话...",
                    yesFn: _offerHandle(msg),
                    noFn: _reject(msg)
                },
                fixed: false,
                //callback: flicker.hide()
            });
            //var flicker = new Flicker();
            //Flicker.show('【' + msg.caller_id + '】 正在呼叫')
            offerHandleTimeout = setTimeout(_timeoutHandle(msg), 120e3);


            /* var isReady = confirm(msg.caller_id + " is calling...");
             if (isReady) {
             offerHandle(msg);
             }else {
             hangup();
             //TODO
             // send a rejection;
             sendRejection(refusedUrl, msg.caller_id, msg.callee_id);
             console.log('You rejected ' + msg.caller_id + "'s calling.");
             } */
        }
        else if (msg.signal === 'answer') {
            //TODO
            //answerHandle
            answerHandle(msg);
            console.log('get the answer. ');
        }
        else if (msg.signal === 'ice_candidate') {
            //TODO
            //getIceCandidateHndale
            console.log('get an iceCandidate');
            candidateHandle(msg);
        }
        else if (msg.signal === 'refused') {
            easyDialog.open({
                container: {
                    header: '提示',
                    content: '您的请求被对方拒绝.',
                    yesFn: function () {
                        return true
                    },
                    noFn: false
                },
                fixed: false,

            });
            //alert('您的请求被对方拒绝.');
            endup();
        }
        else {
            alert('Get a unknown ws message: ' + JSON.stringify(msg));
        }
    };

    ws.onopen = function () {
        var registry = {
            "id": id,
            "token": token,
            "signal": "registry"
        };
        this.send(JSON.stringify(registry));
    };

    ws.onclose = function () {
        wsInit(selfId, token);
    };
}


//服务器推送"offer"时被动触发
function offerHandle(data) {
    remoteSdp = new RTCSessionDescription({"sdp": data.content, "type": "offer"})
    callerId = data.caller_id;
    calleeId = data.callee_id;
    getMedia(replying, failureHandle);

    function failureHandle() {
        easyDialog.open({
            container: {
                header: '提示',
                content: '请检查您的摄像头或麦克风设备是否正常',
                yesFn: function () {
                    return true
                },
                noFn: false
            },
            fixed: false,
            autoClose: 3000
        });
        rejectOffer(data.caller_id, data.callee_id);
    }

}

//作为caller收到callee的answer时触发
function answerHandle(data) {
    remoteSdp = new RTCSessionDescription({"sdp": data.content, "type": "answer"});
    //console.log('RemoteSdp:\n' + remoteSdp.sdp);
    localPeerConnection.setRemoteDescription(remoteSdp,
        function () {
            console.log('set remote sdp.');
            console.log('ICES.length:' + remoteIces.length);
            while (remoteIces.length !== 0) {
                var ice = remoteIces.pop();
                localPeerConnection.addIceCandidate(ice, function () {
                    console.log('A remote ICE candidated is added successfully.');
                }, function (err) {
                    console.log('Faile to add an IceCandidate. Reason:' + JSON.stringify(err));
                });
            }
        },
        function (err) {
            console.log('>>>Failed to set remoteSdp: ' + JSON.stringify(err));
        });
}

//收到iceCandi时处理
function candidateHandle(data) {
    var ice = data.content;

    var candidate = new RTCIceCandidate({
        sdpMLineIndex: ice.sdpMLineIndex,
        candidate: ice.candidate
    });
    if (!localPeerConnection) {
        console.log('localPC not inited');
        remoteIces.push(candidate);
    } else {
        localPeerConnection.addIceCandidate(candidate, function () {
            console.log('A remote ICE candidated is added successfully.');
        }, function (err) {
            console.log('Faile to add an IceCandidate. Reason:' + JSON.stringify(err));
        });
    }

    function addIce(ice) {
        if (localPeerConnection) {
            localPeerConnection.addIceCandidate(ice, function () {
                console.log('A remote ICE candidated is added successfully.');
            }, function (err) {
                console.log('Faile to add an IceCandidate. Reason:' + JSON.stringify(err));
            });
        } else {
            console.log('lcoalPC not inited, the ice couldnot be added.');
            setTimeout(_addIce(ice), 1000);
        }
    }

    function _addIce(ice) {
        return function () {
            addIce(ice);
        }
    }

    //如果ice先于offer/answer到达,则localPeerConnection为空,需要延时.
    //_addIce(candidate)();
    //remoteIces.push(candidate);
}

//处理dataChannel收到的消息
function msgHandle(event) {
    console.log('Received message: ' + event.data);
}

//收到服务器的心跳信息后处理
function heartBeatHandle(data) {
    var users;

    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (err) {
            //服务器错误
            console.log(">>>Response ERR : \n_____" + data);
            return;
        }
    }

    //服务器返回错误
    if (data.error) {
        errorHandle(data.error);
        return;
    }

    if (data.users) {
        var users = data.users;

        USERS = {};
        for (var x in users) {
            switch (users[x].status) {
                case 0:
                    myStatus = 'idle';
                    break;
                case 1:
                    myStatus = 'ready';
                    break;
                case 2:
                    myStatus = 'busy';
                    break;
            }
            USERS[users[x].id] = users[x];
        }
        //ui处理,更新好友列表
        updatefriends(friendsUl, users);
        updateRecent(recentFriendsUl, USERS);
    }


    return;
}

function errorHandle(err) {
    if (err.code === ErrorCode.ERROR_TOKEN) {
        console.log('Token 验证失败.');
        hangup();
        tokenErrHandle();
        return;
    }
    else if (err.code === ErrorCode.ERROR_NET) {
        console.log("对方已掉线");
        hangup();
        offlineHandle();
    }
    else if (err.code === ErrorCode.ERROR_BUSY) {
        console.log('对方忙碌中.');
        hangup();
        busyHandle();
    }
    else {
        console.log(JSON.stringify(err));
    }
}

function offlineHandle() {

}

function busyHandle() {

}

function tokenErrHandle() {
    window.clearInterval(hearBeatInt);
    login(selfId, selfName);
}

//作为caller准备视频通话
function callStart(calleeID, type) {
    callerId = selfId;
    calleeId = calleeID;

    if (myStatus !== 'idle') {
        easyDialog.open({
            container: {
                header: '提示',
                content: '您正在通话中...',
                yesFn: function () {
                    return true
                },
                noFn: false
            },
            fixed: false,
            autoClose: 3000
        });
        return;
    }

    if (calleeId == callerId) {
        easyDialog.open({
            container: {
                header: '提示',
                content: '亲,您不能和自己视频通话.',
                yesFn: function () {
                    return true
                },
                noFn: false
            },
            fixed: false,
            autoClose: 10000
        });
        return;
    }

    myStatus = 'ready';
    getMedia(calling, function () {
        alert();
        easyDialog.open({
            container: {
                header: '提示',
                content: '请检查您的摄像头或麦克风设备是否正常',
                yesFn: function () {
                    return true
                },
                noFn: false
            },
            fixed: false,
            autoClose: 3000
        });
    });

}

//作为callee在获取本地媒体成功时被触发
function replying(stream, isReady) {
    if (isReady === 'timeout') {
        hangup();
        return;
    }

    attachMediaStream(localVideoContainer, stream);
    localStream = stream;
    pcInit();

    localPeerConnection.addStream(localStream);
    localPeerConnection.setRemoteDescription(remoteSdp, function () {
        console.log('set remote sdp.');
        console.log('ICES.lengt:' + remoteIces.length);
        while (remoteIces.length !== 0) {
            var ice = remoteIces.pop();
            localPeerConnection.addIceCandidate(ice, function () {
                console.log('A remote ICE candidated is added successfully.');
            }, function (err) {
                console.log('Faile to add an IceCandidate. Reason:' + JSON.stringify(err));
            });
        }
    }, errorHandle);
    localPeerConnection.createAnswer(createAnswerCallback, errorHandle);

}

//作为caller添加本地媒体成功时调用
function calling(stream, isReady) {
    if (isReady === 'timeout') {
        hangup();
        easyDialog.open({
            container: {
                header: '提示',
                content: '获取摄像头和麦克风超时.',
                yesFn: function () {
                    return true
                },
                noFn: false
            },
            fixed: false,
        });
        return;
    }

    attachMediaStream(localVideoContainer, stream);
    localStream = stream;

    pcInit();

    try {
        if (!localChannel) {
            localChannel = localPeerConnection.createDataChannel(
                "localSendDataChannel", {
                    reliable: false
                });
            localChannelInit();
        }
    } catch (e) {
        easyDialog.open({
            container: {
                header: '提示',
                content: '本地连接创建发送数据通道 失败:' + e.message,
                yesFn: function () {
                    return true
                },
                noFn: false
            },
            fixed: false,
            autoClose: 3000
        });
        //alert('本地连接创建发送数据通道 失败:' + e.message);
    }

    localPeerConnection.addStream(localStream);
    localPeerConnection.createOffer(createOfferCallback, errorHandle);
}

//发送hangup,回收pc相关资源
function hangup() {
    remoteIces = [];
    if (callTimeout) {
        clearTimeout(callTimeout);
    }
    if (answerTimeout) {
        clearTimeout(answerTimeout);
    }
    if (offerHandleTimeout) {
        clearTimeout(offerHandleTimeout);
    }


    try {
        easyDialog.close();
    } catch (e) {
        console.log('no dialog.');
    } finally {

    }
    //ui处理
    $closeTd.parent().hide();

    if (myStatus === 'idle') {
        console.log('已挂断.');
        return;
    }

    myStatus = 'idle';
    sendHangup();
    console.log("Hang up ing...");
    recycleResource();
}

function endup() {
    $closeTd.parent().hide();
    if (myStatus === 'idle') {
        console.log('已挂断.');
        return;
    }

    myStatus = 'idle';
    sendEndup();
    console.log("Endup ing...");
    recycleResource();
}

function createOfferCallback(RTCsdp) {
    //console.log("OfferSdp:\n" + JSON.stringify(RTCsdp));
    lcoalSdp = RTCsdp;
    localPeerConnection.setLocalDescription(RTCsdp);
    console.log('set local sdp');
    sendOffer(callerId, calleeId, lcoalSdp.sdp);


}

function createAnswerCallback(RTCsdp) {
    //console.log("AnswerSdp:\n" + JSON.stringify(RTCsdp));
    lcoalSdp = RTCsdp;
    localPeerConnection.setLocalDescription(RTCsdp);
    console.log('set local sdp');
    sendAnswer(callerId, calleeId, lcoalSdp.sdp);
}

//初始化peerConnection
function pcInit() {
    localPeerConnection = new RTCPeerConnection(pcConfig, pcConstraints);
    localPeerConnection.onicecandidate = onIceCandidate;
    // console.log('绑定本地连接的addstream事件');
    localPeerConnection.onaddstream = onAddStream;
    // console.log('绑定本地连接的ondataChannel')
    localPeerConnection.ondatachannel = onDataChannel;
    localPeerConnection.oniceconnectionstatechange = onIceConnectionStateChange;
    localPeerConnection.onremovestream = onRemoveStream;
    localPeerConnection.onsignalingstatechange = onSignalingStateChange;
    localPeerConnection.onnegotiationneeded = onNegotiationNeeded;
}

function onDataChannel(event) {
    console.log('Receive Channel Callback');
    localChannel = event.channel;
    localChannelInit();
}

function onAddStream(event) {
    attachMediaStream(remoteVideoContainer, event.stream);
    console.log("add remote stream");
}

function onIceConnectionStateChange() {
    if (!localPeerConnection) {
        return;
    }

    if (localPeerConnection.iceConnectionState === 'connected') {
        console.log("***ICEconnection state:" + localPeerConnection.iceConnectionState);
        if (myStatus !== 'busy') {
            myStatus = 'busy';
            sendBusy();
        }
    }
    else if (localPeerConnection.iceConnectionState === 'disconnected') {
        //TODO
        //用户之间的连接断开
        console.log("***ICEconnection state:" + localPeerConnection.iceConnectionState);
        endup();
    }
    else if (localPeerConnection.iceConnectionState === 'failed') {
        hangup();
        easyDialog.open({
            container: {
                header: '提示',
                content: '与对方建立视频连接失败...请重试',
                yesFn: function () {
                    return true
                },
                noFn: false
            },
            fixed: false,
        });
    }
    else {
        console.log("***ICEconnection state:" + localPeerConnection.iceConnectionState);
    }
}

//得到本地的iceCandidate时触发
function onIceCandidate(event) {
    var candidate = event.candidate;

    if (candidate) {
        //console.log('get local Ice Candidate.');
    } else {
        console.log('End of candidates.');
        console.log('iceConnectionState:' + localPeerConnection.iceConnectionState + '\n');
        return;
    }

    if (candidate.sdpMLineIndex === 0) {
        candidate.sdpMLineIndex = '0';
        candidate.sdpMid = 'audio';
        pushIce(candidate);
        return;
    }
    else if (candidate.sdpMLineIndex === 1) {
        candidate.sdpMLineIndex = '1';
        candidate.sdpMid = 'video';
        pushIce(candidate);
        return;
    }
    else if (candidate.sdpMLineIndex === 2) {
        candidate.sdpMLineIndex = '2';
        candidate.sdpMid = 'data';
        pushIce(candidate);
        return;
    } else {
        console.log("XXXX_Error: candidate format error");
        return;
    }
}

function onRemoveStream(event) {
    console.log("stream reomved.");
}

function recycleResource() {
    if (localChannel) {
        localChannel.close();
        localChannel = null;
    }

    if (localStream) {
        localStream.stop();
        localPeerConnection.removeStream(localStream);
        localStream = null;
    }

    if (localPeerConnection) {
        localPeerConnection.close();
        localPeerConnection = null;
    }
    remoteVideoContainer.setAttribute("src", "");
    localVideoContainer.setAttribute("src", "");


    //delUser(friendsUl, selfId === callerId ? USERS[calleeId] : USERS[callerId]);
}

function localChannelInit() {
    console.log('DataChanne Inited.');
    localChannel.onmessage = onChannelMsg;
    localChannel.onopen = onChannelOpen;
    localChannel.onclose = onChannelClose;
}

function onChannelMsg(event) {
    console.log('远端接收通道的message事件发生,获得message:event.data"' + event.data + '"');
    //printf(event.data);
}

function onChannelOpen() {
    console.log("localChannel is open.");
    //正式开始通话,UI处理

    $closeTd.siblings().html(selfId === callerId ? USERS[calleeId].name : USERS[callerId].name);
    $closeTd.parent().show();
    addUser(recentFriendsUl, selfId === callerId ? USERS[calleeId] : USERS[callerId]);

    try {
        easyDialog.close();
    } catch (e) {
        console.log('no dialog.');
    } finally {

    }

    if (myStatus !== 'busy') {
        myStatus = 'busy';
        sendBusy();
    }
}

function onChannelClose() {
    console.log("localChannel is closed.");
    endup();
}


function sendOffer(caller_id, callee_id, sdp) {

    var msg = {
        "token": TOKEN,
        "caller_id": callerId,
        "callee_id": calleeId,
        "sdp": sdp
    };
    //console.log('--------\n' + sdp);

    $.ajax({
        url: callUrl,
        type: 'POST',
        data: msg,
        success: function (data, statues) {
            if (data === 'OK') {
                console.log('The offer sent.');

                easyDialog.open({
                    container: {
                        content: '正在呼叫' + calleeId + '...<br/>请等待对方应答',
                        yesFn: false,
                        noFn: hangup
                    },
                    fixed: false,
                });

                //offer发送成功,但对方或服务器无响应
                function checkStatus() {
                    if (myStatus !== 'busy') {
                        easyDialog.open({
                            container: {
                                header: '提示',
                                content: '请求失败,请重试.',
                                yesFn: function () {
                                    return true
                                },
                                noFn: false
                            },
                            fixed: false,
                        });
                        hangup();
                    }
                }

                callTimeout = setTimeout(function () {
                    console.log('发起呼叫请求超时..请重试');
                    return checkStatus();
                }, 120e3);
                return;
            }

            data = JSON.parse(data);
            if (data.error) {
                if (data.error.code) {
                    errorHandle(data.error);
                }
                else {
                    console.log('Send the offer, but unknown Error returned.');
                }
            } else {

            }
        }
    });
}

function sendAnswer(caller_id, callee_id, sdp) {
    var msg = {
        "token": TOKEN,
        "caller_id": caller_id,
        "callee_id": callee_id,
        "sdp": sdp
    };

    $.ajax({
        url: replyUrl,
        type: 'POST',
        data: msg,
        success: function (data, status) {
            if (data === 'OK') {
                console.log('The answer was sent.');
                easyDialog.open({
                    container: {
                        content: '正在与' + calleeId + '建立连接...<br/>请稍候.',
                        yesFn: false,
                        noFn: false
                    },
                    fixed: false,
                });
                function _checkStatus() {
                    return function () {
                        console.log('对方响应超时...');
                        if (myStatus !== 'busy') {
                            hangup();
                            easyDialog.open({
                                container: {
                                    header: '提示',
                                    content: '对方响应超时...请重试',
                                    yesFn: function () {
                                        return true
                                    },
                                    noFn: false
                                },
                                fixed: false,
                            });
                        }
                    }
                }

                answerTimeout = setTimeout(_checkStatus(), 120e3);
                return;
            }

            data = JSON.parse(data);
            if (data.error) {
                if (data.error.code) {
                    errorHandle(data.error);
                }
                else {
                    console.log('Send the answer, but unknown Error returned.');
                }
            } else {
                //answer发送成功,但对方或服务器无响应
                console.log('answer发送成功,但服务器无响应');
            }
        }
    });
}

function pushIce(ice) {
    try {
        ws.send(JSON.stringify({
            'token': TOKEN,
            'caller_id': callerId,
            'callee_id': calleeId,
            'signal': 'ice_candidate',
            'content': ice
        }));
        console.log('send an Ice');
    } catch (e) {
        console.log('<<<<<<ERR:' + JSON.stringify(e));
    }
}


//当向服务器发送busy前将myStatus置为busy
function sendBusy() {
    window.clearTimeout(callTimeout);
    window.clearTimeout(answerTimeout);

    easyDialog.close();
    $.ajax({
        url: busyURL,
        type: 'POST',
        data: {
            'token': TOKEN,
            'caller_id': callerId,
            'callee_id': calleeId
        },
        success: function (data, status) {
            console.log('send busy status.');
        }
    });
}

//主动结束通话时调用
function sendHangup() {
    var json = {
        "token": TOKEN,
        "caller_id": callerId,
        "callee_id": calleeId
    }

    $.ajax({
        url: hangupUrl,
        type: 'POST',
        data: json,
        success: function (data, status) {
            if (data === 'OK') {
                console.log('send Hangup.');
                return;
            }

            if (!(typeof data === 'object')) {
                data = JSON.parse(data);
            }

            if (data.error) {
                if (data.error.code) {
                    errorHandle(data.error);
                }
                else {
                    console.log('Send the hangup, but unknown Error returned.');
                }
            }
        }
    });
}

//被动结束通话时调用
function sendEndup() {
    var json = {
        "token": TOKEN,
        "caller_id": callerId,
        "callee_id": calleeId
    }

    $.ajax({
        url: endupUrl,
        type: 'POST',
        data: json,
        success: function (data, status) {
            if (data.error) {
                if (data.error.code) {
                    errorHandle(data.error);
                }
                else {
                    console.log('Send the hangup, but unknown Error returned.');
                }
            }
        }
    });
}

function sendRejection(url, caller, callee) {
    var rejection = {
        'token': TOKEN,
        'caller_id': caller,
        'callee_id': callee,
        'signal': 'refused',
        'content': null
    };

    $.ajax({
        url: refusedUrl,
        type: 'POST',
        data: rejection,
        success: function (data, status) {
            if (data === 'OK') {
                console.log('The rejection was sent.');
                return;
            }

            try {
                data = JSON.parse(data);
                if (data.error) {
                    if (data.error.code) {
                        errorHandle(data.error);
                    }
                    else {
                        console.log('Send the rejection, but unknown Error returned.');
                    }
                }
            }
            catch (err) {
                console.log('ERR: ' + data);
            }

        }
    });
}


function getMedia(success, err) {
    var proxy = new EventProxy();
    proxy.once('mediaReady', function (e) {
        if (e.error) {
            err(e.error);
        } else {
            success(e.stream);
        }
    });

    getUserMedia({
        audio: true,
        video: true
    }, function (stream) {
        proxy.trigger('mediaReady', {'stream': stream});
    }, function (err) {
        proxy.trigger('mediaReady', {'error': err});
    });
    setTimeout(function () {
        proxy.trigger('mediaReady', {'error': 'getUserMedia TIMEOUT'})
    }, 10e3);
}


function rejectOffer(caller, callee) {
    hangup();
    //TODO
    // send a rejection;
    sendRejection(refusedUrl, caller, callee);
    console.log('You rejected ' + caller + "'s calling.");
}

function onSignalingStateChange(e) {
    if (localPeerConnection === null) {
        return;
    }
    console.log('***SignalingState: ' + localPeerConnection.signalingState);
}

function onNegotiationNeeded(e) {
    //console.table(e);
}



