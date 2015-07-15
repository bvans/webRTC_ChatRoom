var global = {
  proxy : new EventProxy(),
  token : '',
  hearBeatInt : -1
};

$(document).ready(function () {
  global.proxy.on('callIn', calling);

  if (webrtcDetectedBrowser !== "chrome") {
    alert('不好意思,仅支持chrom内核的浏览器.');
    var userAgent = navigator.userAgent;
    if (userAgent.indexOf("Firefox") != -1 || userAgent.indexOf("Presto") != -1) {
      window.location.replace("about:blank");
    } else {
      window.opener = null;
      window.open("", "_self");
      window.close();
    }
    return;
  }

  recentFriendsUl = $("#recentFriends_ul");
  friendsUl = $("#myFriends_ul");
  friendsCountSpan = $(".h3.h3_2 span");

  global.token = login(selfId, selfName);
  TOKEN = global.token;

  localVideoContainer = document.getElementById("localVideo");
  remoteVideoContainer = document.getElementById("remoteVideo");

  $closeTd = $("#closeTd");

  $closeTd.click(function () {
    easyDialog.open({
      container : {
        header : '提示',
        content : '确定要结束通话吗?',
        yesFn : hangup,
        noFn : true
      },
      fixed : false,
    });
    /* if (confirm('确定要结束通话吗?')){
    hangup();
    } */
  });

  window['dandan'] = {}
  var ing_user; //当前用户
  //浏览器
  function liulanqi() {
    var h = $(window).height();
    var w = $(window).width();
    $("#top").width(w);
    //$("#foot").html(h);

    //好友栏(左)
    $(".box").height(h - 135);
    //聊天窗口(中)
    $("#mid_con").height(h - 135);
    //QQ秀(右)
    $(".right_box").height(h - 135);
    //$("#mid_say textarea").width(w - 480);

    if ($(".box").height() < 350) {
      $(".box").height(350)
    }
    if ($("#mid_con").height() < 350) {
      $("#mid_con").height(350)
    }
    if ($(".right_box").height() < 350) {
      $(".right_box").height(350)
    }
    if ($("#mid_say textarea").width() < 320) {
      $("#mid_say textarea").width(320)
    }

    /*	 if($("#mid_foot").width()<400){
    $("#mid_foot").width(400)
    }  */

    if (w <= 800) {
      $("#top").width(800);
      $("#body").width(800)
    } else {
      $("#body").css("width", "100%")
    }
    //$("#top").html(b_h);

    $(".my_show").height($("#mid_con").height() - 30); //显示的内容的高度出现滚动条
    //$(".my_show").scrollTop($(".con_box").height()-$(".my_show").height());//让滚动滚到最底端.在这里不加这句了，没多用，可能还卡

    //右边的高度
    r_h = $(".right_box").height() - 40 * 3;
    $("#right_top").height(r_h * 0.25)
    $("#right_mid").height(r_h * 0.45)
    $("#right_foot").height(r_h * 0.3)

  }
  window['dandan']['liulanqi'] = liulanqi;

  //时间
  function mytime() {
    var now = (new Date()).getHours();
    if (now > 0 && now <= 6) {
      return "午夜好";
    } else if (now > 6 && now <= 11) {
      return "早上好";
    } else if (now > 11 && now <= 14) {
      return "中午好";
    } else if (now > 14 && now <= 18) {
      return "下午好";
    } else {
      return "晚上好";
    }
  }
  window['dandan']['mytime'] = mytime;

  //触发浏览器
  $(window).scroll(function () {
    dandan.liulanqi();
  }); //滚动触发

  $(window).resize(function () {
    dandan.liulanqi();
    return false;
  }); //窗口触发
  //alert("??????")
  dandan.liulanqi();

  //显示个数
  function user_geshu() {
    var length1 = $(".ul_1 > li").length;
    var length2 = $(".ul_2 > li").length;
    $(".n_geshu_1").text(length1);
    $(".n_geshu_2").text(length2);
  }
  user_geshu()
  //alert(length1)

  //点击分组名称
  $(".groupTitle").click(function () {
    $(this).toggleClass('fold');
    $(this).toggleClass('unfold');
    $(this).next("ul").toggle(500);
  });

  //鼠标经过会员的时候
  function hover_user($this) {
    $($this).hover(
      function () {
      $(this).addClass("hover");
    },
      function () {
      $(this).removeClass("hover");
    });
  }

  //$("#right_foot").html('<p><img src="images/head.jpg" alt="头象" /></p>' + selfName);

  //过滤所有的空格
  function kongge(content) {
    return content.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }
  window['dandan']['kongge'] = kongge;

  /*******************************************************************************************/
  //创建新用户
  window.newuser = function ($this, arr, i, ing) {
    var id = "user";

    alert(ing)
    if (ing != undefined) { //创建最近聊天
      //alert("最近聊天为真");
      $($this).prepend('<li id="' + id + i + '">' + arr[0] + '</li>');
      $('#' + id + i).click(function () {
        title_newuser('title_' + id + ing, arr[0], arr[1]);
      }); //给按钮加事件
    } else { //创建好友
      $($this).append('<li id="' + id + i + '">' + arr[0] + '</li>');

      ////点击用户事件
      $('#' + id + i).click(function () {
        title_newuser('title_' + id + i, arr[0], arr[1]);
      }); //给按钮加事件
    }
    //hover_user('#' + id + i); //给经过触发
    user_geshu(); //更新人数
  }
  window['dandan']['newuser'] = newuser;

  ////更新最近聊天的位置
  function ing_my_user($this, arr, i, ing) {
    var id = "user";
    $("#" + id + i).remove();
    $($this).prepend('<li id="' + id + i + '">' + arr[0] + '</li>');
    $('#' + id + i).click(function () {
      title_newuser('title_' + id + ing, arr[0], arr[1]);
    }); //给按钮加事件
    //hover_user('#' + id + i); //给经过触发
  }

  //创建标题栏和主控制（原是有一个主控制，忘了，就合在一起了，哈哈）
  function title_newuser(id, user, img) {
    if ($("#" + id).length < 1) {
      $("#mid_top").append(
        '<div id="' + id + '" class="list">' +
        '<table border="0" cellspacing="0" cellpadding="0">' +
        '<tr>' +
        '<td id="zi' + id + '" class="td_user td_user_click">' + user + '</td>' +
        '<td id="zino' + id + '" class="td_hide td_hide_click">X</td>' +
        '</tr>' +
        '</table>' +
        '</div>');

      //创建完成后给事件
      //alert('#'+id)
      $('#' + id).click(function () {
        title_newuser(id, user, img);
      }); //给按钮加事件
      //关闭
      $("#zino" + id).click(function () {
        delete_user(id, user, img);
        return false
      }); //关闭打开的


    } else {
      $("#zino" + id).addClass("td_hide_click"); //给自己加样式
      $("#zi" + id).addClass("td_user_click"); //给自己加样式
    }
    my_siblings("#" + id); //去掉兄弟样式

    //创建内容框
    my_user_con(user, id);

    //创建头像
    my_user_head(user, id, img);

    ing_user = id; //当前用户
    //alert(ing_user);

    $("#right_mid").html(""); //清空右边的内容
  }

  //欢迎
  popLogin();
  $("#loginBtn").click(function () {
    selfId = $("#selfId").val();
    selfName = $("#selfName").val();

    $("#selfId").next().html("");
    $("#selfName").next().html("");
    if (!selfId) {
      $("#selfId").next().html("ID不能为空.");
      return;
    } else if (!selfName) {
      $("#selfName").next().html("Name不能为空.");
      return;
    }

    if (TOKEN) {
      $("#top").html('<h2><br/>&nbsp;&nbsp;' + dandan.mytime() + ',' + (selfName || '游客') + ',欢迎你的到来！！</h2>');
      pushLogin();
    }

  });
  popLogin();
  //login();

})
