jquery = document.createElement('script');
jquery.setAttribute('src', 'http://static.blog.csdn.net/scripts/jquery.js');
document.head.appendChild(jquery);

//
cityJs = document.createElement('script');
cityJs.setAttribute('src', 'http://mhxy.me/js/cities.js')
document.head.appendChild(cityJs);
  

var getWeather = function (city) {
  var weather = {};
  var cityCode = cities[city]
  if (!cityCode){
    return null;
  }
  
  var xhr = new window.XMLHttpRequest();
  xhr.open('GET', 'http://weather.mail.163.com/weather/xhr/weather/info.do?city=' + cityCode, false);
  xhr.send();
  weatherInof = JSON.parse(xhr.responseText).data;
  
  weather.cityCode = cityCode;
  weather.lunar = weatherInof.lunar;
  weather.tempDay = weatherInof.info[0].tempDay;
  weather.tempNight = weatherInof.info[0].tempNight;
  weather.des = weatherInof.info[0].weatherDay.value;
  weather.time = weatherInof.publishTime;
  weather.pm = weatherInof.aqi.pm;
  return weather;
}

blackList = [
2184647,
5575031,
3168710
];



(function(){
sympathize = function (replies, seconds, content) {
  var doc;
  
  replies = replies || 0;
  seconds = seconds || 10;
  content = content || '挽尊'; 
 
  var postSympathy = function (doc, replies, content) {
    replies = replies || 0;
    targets = $('.topic-item-left span', doc).filter(function () {
        return $(this).html().trim() - '' <= replies;
      }).parent().parent();
    targets = $('a[href]', targets);

    var ids = [];
    targets.each(function (i, e) {
      　　ids.push($(e).attr('href'));
    });
    ids = ids.filter(function (v, i, a) {
        if (v.match(/topic\/\d+$/)) {
          return true;
        }
      }).map(function (v, i, a) {
        return v.match(/\d+$/)[0];
      });
    console.log('帖子数量:' + ids.length);

	
	var index = Math.floor(Math.random()*ids.length);
	var postId = ids[index];
    if (postId) {
	  $.get('http://love.163.com/park/topic/' + postId, function(data){
	    var postdoc  = data;
		var uid = $('.js-username.need-login', postdoc).attr('href').match(/\d+/)[0];
		//检测是否在黑名单里
		if(blackList.indexOf(uid) != -1){
		  return;
		}
		
		$.get('http://love.163.com/' + uid, function(data) {
		   var msgs = [
		     '楼主,交往是一种态度~[p_微笑]我只能这样说了',
			 '楼主你好,[e_微笑],没人回你贴子多尴尬~我帮你加点人气,不喜欢' + 
			   '的话你告诉我~不用谢,请叫我红领巾[e_玫瑰]',
			 '这个世界日趋冷漠，人与人之间缺少交流，越来越多的人开始寻求在广'+
			   '大的网络上表达自己，寻求知己；但是人与人是不同的，我们在这个过程难免碰壁，但'+
			   '我花田小霸王，立志秉承儒家之大仁，奉行墨家之大爱，践行马哲之唯物，不忘社会主义'+
			   '的最终要领,把人与人之间的爱，以回复一楼的形式传递给萍水相逢的楼主,让您感受到'+
			   '亲人的温暖~[p_微笑]',
			 '楼主[p_微笑],你是否有过发帖无人回的尴尬局面？是否有按破F5都不见1楼的尴尬？是否在角落偷偷哭泣，'+
			   '想着自己发的贴没人理睬？？不,那些都是过去式了,现在让我们大家一起努力,积极回帖,让花田充满爱~',
			 '如果一份贴摆在我面前，它的名字叫《前女友二三事》，我看都不会看，无论这个孩子'+
			   '是多么的实诚，可是这样的帖子给人第一印象，就是楼主太寂寞了。'+
			   '但是，如果这份帖子改名叫《那夜女友的手伸向了我的。。。》，就完全不一样了。我一定会看，'+
			   '就算看了不承认但还是会偷偷地看。',
			   '所谓爱情是一对男女基于一定的社会共同基础和共同的生活理想，在各自内心形成的相互倾慕，'+
			     '并渴望对方成为自己终身伴侣的一种强烈的、纯真、专一的感情。 \n  从以上的定义可以看'+
				 '出:\n第一，爱情存在的主体是异性，同性之间的感情不能称之为爱情。\n第二，所谓的一定的'+
				 '社会基础就是指人能生存下去的物质和精神基础，所以没有一定的社会基础，爱情是空中楼阁'+
				 '。\n第三，定义里强调了爱情是相互倾慕的感情，所以一切单相思或暗恋都不是爱情。\n第'+
				 '四，爱情是渴望对方成为终身伴侣的感情，因而一切泡妞、把妹、找凯子、约炮的行为所产生的感情'+
				 '都不是爱情。就如网上流传的那句话一样，一切不以结婚为目的的恋爱都是耍流氓。\n第五，'+
				 '爱情是强烈的、纯真的、专一的。所以那种对异性似是而非的、夹杂物质利益的、朝三暮四的'+
				 '感情都不是爱情。\n那么问题来了,请问楼主你怎么看?\n'
		   ];
		  
		   var usrdoc = data;
		   var gender =  $('.profile-basic-info-left span', usrdoc).eq(0).text() || '';
		   var age =  $('.profile-basic-info-left span', usrdoc).eq(1).text().match(/\d+/)[0]-'' || '';
		   var resident =  $('.profile-basic-info-left span', usrdoc).eq(3).text().slice(0,2);
		   var city = $('.profile-basic-info-left span', usrdoc).eq(3).text().slice(2);;
		   
		   if (resident === '黑龙') {
		     resident = '黑龙江';
			 city = city.slice(1);
		   } else if (resident === '其他') {
		     resident = '阳光';
			 city = city.slice(2);
		   } else if (resident === '内蒙') {
		     resident = '内蒙古';
			 city = city.slice(1);
		   } else {
	
		   }
		   
		   console.log(gender + age + resident + ':' + city);
		   //console.log(JSON.stringify(getWeather(city)));
		   if (gender === '男') {
		      if (age > 30) {
			    content = '楼主,交往是一种态度~[p_微笑]我只能这样说了';
			  } else {
			    content = '@花田漂亮妹子,大家快看,这里有一个' + resident + '的帅小伙';
			  } 
		   } else if (gender === '女') {
		     if (age > 30) {
			   content = '楼主,交往是一种态度~[p_微笑]我只能这样说了';
			 } else {
			   content = '楼主,[e_微笑],我觉得你气质很不错,可以和你耍朋友吗?[e_玫瑰]';
			   msgs.push(content);
			   msgs.push(content);
			   msgs.push(content);
			   msgs.push(content);
			 }
		   }
		   
		   msgs.push(content);
		   var index = Math.floor(Math.random()*msgs.length);
		   var msg = msgs[index];
		   msg += '\n [p_微笑]如果您不喜欢,请告诉我~如果您喜欢,请叫我红领巾.'+
		     '[e_玫瑰]当然到我主页送我礼物也是极好的~';
		   console.log(msg);
		   
		   $.ajax({
	        url: 'http://love.163.com/park/topic/comment/add',
	        type: 'POST',
	        data: {
              'content' : msg,
              topicId : postId,
              'postTrend' : '0'
            }
	      });
		});
	  });
    } else {
	  console.log('暂无可回复的帖子');
	}
  }

  $.get('http://love.163.com/park/topic', function (data) {
    doc = data;
    postSympathy(doc, replies, content);
  });
}

var autoPost = function (replies, seconds, content) {
  setInterval((function(replies, seconds, content){
    return function() {
	  sympathize(replies, seconds, content);
	} 
  })(replies, seconds, content), Math.ceil(Math.random()*10000) + seconds*1000);
};

//var msg = '楼主,[e_微笑],我觉得你气质很不错,可以和你耍朋友吗?[e_玫瑰]';

setTimeout((function (replies, seconds, content){
  return function () {
    autoPost(replies, seconds, content);
  }
})(0, 10, ""), 5000);
})();
//