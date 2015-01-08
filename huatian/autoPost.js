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
  content = content || '����'; 
 
  var postSympathy = function (doc, replies, content) {
    replies = replies || 0;
    targets = $('.topic-item-left span', doc).filter(function () {
        return $(this).html().trim() - '' <= replies;
      }).parent().parent();
    targets = $('a[href]', targets);

    var ids = [];
    targets.each(function (i, e) {
      ����ids.push($(e).attr('href'));
    });
    ids = ids.filter(function (v, i, a) {
        if (v.match(/topic\/\d+$/)) {
          return true;
        }
      }).map(function (v, i, a) {
        return v.match(/\d+$/)[0];
      });
    console.log('��������:' + ids.length);

	
	var index = Math.floor(Math.random()*ids.length);
	var postId = ids[index];
    if (postId) {
	  $.get('http://love.163.com/park/topic/' + postId, function(data){
	    var postdoc  = data;
		var uid = $('.js-username.need-login', postdoc).attr('href').match(/\d+/)[0];
		//����Ƿ��ں�������
		if(blackList.indexOf(uid) != -1){
		  return;
		}
		
		$.get('http://love.163.com/' + uid, function(data) {
		   var msgs = [
		     '¥��,������һ��̬��~[p_΢Ц]��ֻ������˵��',
			 '¥�����,[e_΢Ц],û�˻������Ӷ�����~�Ұ���ӵ�����,��ϲ��' + 
			   '�Ļ��������~����л,����Һ����[e_õ��]',
			 '�������������Į��������֮��ȱ�ٽ�����Խ��Խ����˿�ʼѰ���ڹ�'+
			   '��������ϱ���Լ���Ѱ��֪���������������ǲ�ͬ�ģ���������������������ڣ���'+
			   '�һ���С��������־�������֮���ʣ�����ī��֮�󰮣���������֮Ψ������������'+
			   '������Ҫ��,��������֮��İ����Իظ�һ¥����ʽ���ݸ�Ƽˮ����¥��,�������ܵ�'+
			   '���˵���ů~[p_΢Ц]',
			 '¥��[p_΢Ц],���Ƿ��й��������˻ص����ξ��棿�Ƿ��а���F5������1¥�����Σ��Ƿ��ڽ���͵͵������'+
			   '�����Լ�������û����ǣ�����,��Щ���ǹ�ȥʽ��,���������Ǵ��һ��Ŭ��,��������,�û��������~',
			 '���һ������������ǰ���������ֽС�ǰŮ�Ѷ����¡����ҿ������ῴ�������������'+
			   '�Ƕ�ô��ʵ�ϣ��������������Ӹ��˵�һӡ�󣬾���¥��̫��į�ˡ�'+
			   '���ǣ����������Ӹ����С���ҹŮ�ѵ����������ҵġ�������������ȫ��һ���ˡ���һ���ῴ��'+
			   '���㿴�˲����ϵ����ǻ�͵͵�ؿ���',
			   '��ν������һ����Ů����һ������Ṳͬ�����͹�ͬ���������룬�ڸ��������γɵ��໥��Ľ��'+
			     '�������Է���Ϊ�Լ�������µ�һ��ǿ�ҵġ����桢רһ�ĸ��顣 \n  �����ϵĶ�����Կ�'+
				 '��:\n��һ��������ڵ����������ԣ�ͬ��֮��ĸ��鲻�ܳ�֮Ϊ���顣\n�ڶ�����ν��һ����'+
				 '����������ָ����������ȥ�����ʺ;������������û��һ�����������������ǿ���¥��'+
				 '��\n������������ǿ���˰������໥��Ľ�ĸ��飬����һ�е���˼���������ǰ��顣\n��'+
				 '�ģ������ǿ����Է���Ϊ������µĸ��飬���һ����椡����á��ҿ��ӡ�Լ�ڵ���Ϊ�������ĸ���'+
				 '�����ǰ��顣���������������Ǿ仰һ����һ�в��Խ��ΪĿ�ĵ���������ˣ��å��\n���壬'+
				 '������ǿ�ҵġ�����ġ�רһ�ġ��������ֶ��������Ƕ��ǵġ�������������ġ�����ĺ�ĵ�'+
				 '���鶼���ǰ��顣\n��ô��������,����¥������ô��?\n'
		   ];
		  
		   var usrdoc = data;
		   var gender =  $('.profile-basic-info-left span', usrdoc).eq(0).text() || '';
		   var age =  $('.profile-basic-info-left span', usrdoc).eq(1).text().match(/\d+/)[0]-'' || '';
		   var resident =  $('.profile-basic-info-left span', usrdoc).eq(3).text().slice(0,2);
		   var city = $('.profile-basic-info-left span', usrdoc).eq(3).text().slice(2);;
		   
		   if (resident === '����') {
		     resident = '������';
			 city = city.slice(1);
		   } else if (resident === '����') {
		     resident = '����';
			 city = city.slice(2);
		   } else if (resident === '����') {
		     resident = '���ɹ�';
			 city = city.slice(1);
		   } else {
	
		   }
		   
		   console.log(gender + age + resident + ':' + city);
		   //console.log(JSON.stringify(getWeather(city)));
		   if (gender === '��') {
		      if (age > 30) {
			    content = '¥��,������һ��̬��~[p_΢Ц]��ֻ������˵��';
			  } else {
			    content = '@����Ư������,��ҿ쿴,������һ��' + resident + '��˧С��';
			  } 
		   } else if (gender === 'Ů') {
		     if (age > 30) {
			   content = '¥��,������һ��̬��~[p_΢Ц]��ֻ������˵��';
			 } else {
			   content = '¥��,[e_΢Ц],�Ҿ��������ʺܲ���,���Ժ���ˣ������?[e_õ��]';
			   msgs.push(content);
			   msgs.push(content);
			   msgs.push(content);
			   msgs.push(content);
			 }
		   }
		   
		   msgs.push(content);
		   var index = Math.floor(Math.random()*msgs.length);
		   var msg = msgs[index];
		   msg += '\n [p_΢Ц]�������ϲ��,�������~�����ϲ��,����Һ����.'+
		     '[e_õ��]��Ȼ������ҳ��������Ҳ�Ǽ��õ�~';
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
	  console.log('���޿ɻظ�������');
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

//var msg = '¥��,[e_΢Ц],�Ҿ��������ʺܲ���,���Ժ���ˣ������?[e_õ��]';

setTimeout((function (replies, seconds, content){
  return function () {
    autoPost(replies, seconds, content);
  }
})(0, 10, ""), 5000);
})();
//