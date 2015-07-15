/**
 * Created by fengyun on 2014/8/14.
 */
function errorCode(){
}

errorCode.ERROR_QUERYMYSQL = 434;
errorCode.ERROR_CRASHMYSQL= 444;
errorCode.ERROR_NOREGISTER = 612;//设备未注册
errorCode.ERROR_NOEPG = 613;
errorCode.ERROR_NODIR = 614;
errorCode.ERROR_FAILSCREENSHOT = 615;//截图失败
errorCode.ERROR_TOKEN = 616;//token 验证失败
errorCode.ERROR_BUSY = 617;
errorCode.ERROR_NET = 618;

exports.global = errorCode;