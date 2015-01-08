
function addUser($ul, user) {
  var $userLi = $ul.children("li[uid=" + user.id + "]");
  
  if ($userLi.length === 0) {
    $ul.append('<li uid=' + user.id + '>' + user.name + '</li>');
    $ul.prev().children("span").html($ul.children().length);
    $userLi = $ul.children().last();
  }
  http://www.baidu.com/s?wd=jquery%20api
  updateStatus($userLi, user);
  return;
}

function hasUSer ($ul, user) {
  var existed = $ul.children("li:contains(" + user.name + ")").filter(function(){
    return $(this).html() === user.name;
	});
  if (existed.length === 0) {
    return false;
  } else {
    return true;
  }
}

function delUser($ul, id) {
  $ul.children("li[uid ='" + id + "']").remove();
  $ul.prev().children("span").html($ul.children().length);
}

function emptyUser($ul){
  $ul.empty();
  $ul.prev().children("span").html(0);
}

function updateStatus($li, user) {
  if ($li.attr('status') === user.status) {
    return;
  } 
  else if (user.status === '0'){
    $li.attr('status', user.status);
	$li.removeClass();
	$li.addClass("idle");
	$li.bind('click', user, function(arg){
      console.log("CLICK?" + this.innerHTML);
	  callStart(arg.data.id);	
    });
  }
  else if(user.status === '1' || user.status === '2') {
    //busy或ready状态的图标显示,以及鼠标样式
	$li.attr('status', user.status);
    $li.removeClass();
    $li.addClass("busy");
    $li.unbind('click');
  }
}

//更新recent
function updateRecent($ul, usersObj) {
  var recents = $ul.children('li');
  for (var i = 0; i < recents.length; i++){
    var id = recents.eq(i).attr('uid');
	if (!usersObj[id]) {
	  delUser($ul, id);
	} else {
	  updateStatus(recents.eq(i), usersObj[id]);
	}
  }
}

function updatefriends($ul, userArr) {
  emptyUser($ul);
  for (var x in userArr) {
    addUser($ul, userArr[x]);
  }
} 

function popLogin() {
  $('.theme-popover-mask').fadeIn(100);
  $('.theme-popover').slideDown(200);
}

function pushLogin() {
  $('.theme-popover-mask').fadeOut(100);
  $('.theme-popover').slideUp(200);
}
