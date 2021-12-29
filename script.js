function clock() {
// 時計＋1秒ごとの処理
    var time = moment();                                                // 現在時刻
    var strTime = time.format("YYYY/MM/DD HH:mm:ss");                   // 日時のフォーマット
    $("#hidden_clock").text(strTime);                                   // 現在時刻（隠し）

    var mode = $("#mode").text();                                       // モード
    if (mode == 0) {                                                    // mode==0ならば直近画像（1分で更新）を表示する
        strTime = time.format("YYYY/MM/DD HH:mm");                      // 日時のフォーマット
        var filename = "latest.jpg";                                    // 直近画像のファイル名
        $("#datetime").text(strTime);                                   // 日時表示
        showImage(filename);                                            // 画像を表示
    }
}


function changeMode(mode) {
    var time = moment();                                                // 現在時刻
    if (mode == 0) {
    // ほぼリアルタイムモード
        $("#mode").text(0);
        $("#btnCamera").addClass("selected");
        $("#btnTimeShift").removeClass("selected");
        $("#btnMovie").css("visibility", "hidden");
        $("#div_now").show();
        $("#div_time").hide();
        $("#div_movie").hide();
        strTime = time.format("YYYY/MM/DD HH:mm");                      // 日時のフォーマット
        var filename = "latest.jpg";                                    // 直近画像のファイル名
        $("#timetitle").text("Now:");                                   // 日時の見出し
        $("#datetime").text(strTime);                                   // 日時表示
        $("#timetitle").css("color", "black");                           // 色を変更
        $("#datetime").css("color", "black");                            // 色を変更
        showImage(filename);                                            // 画像を表示

    } else if (mode == 1) {
    // タイムシフトモード
        $("#mode").text(1);
        $("#btnCamera").removeClass("selected");
        $("#btnTimeShift").addClass("selected");
        $("#btnMovie").css("visibility", "hidden");
        $("#btnMovie").removeClass("selected");
        $("#div_now").hide();
        $("#div_time").show();
        $("#div_movie").hide();
        time = getJustTime(time);                                       // 直前のタイミング時刻
        strTime = time.format("YYYY/MM/DD HH:mm");                      // 日時のフォーマット
        var filename = time2fileName(time);                             // タイミング時刻のファイル名
        $("#timetitle").text("Watching:");                              // 日時の見出し
        $("#datetime").text(strTime);                                   // 日時表示
        $("#timetitle").css("color", "blue");                           // 色を変更
        $("#datetime").css("color", "blue");                            // 色を変更
        showImage(filename);                                            // 画像を表示

    } else if (mode == 2) {
    // 再生モード
        $("#mode").text(2);
        $("#btnCamera").removeClass("selected");
        $("#btnTimeShift").removeClass("selected");
        $("#btnMovie").addClass("selected");
        $("#div_now").hide();
        $("#div_time").hide();
        $("#div_movie").show();
        $("#timetitle").css("color", "red");                           // 色を変更
        $("#datetime").css("color", "red");                            // 色を変更
    }
}


function showImage(fileName){
  // URLにクエリパラメータを付与することで同じファイル名でも確実に画像をリロードさせる
	$("#image").attr("src", url + fileName + "?" + moment().unix());
	
	// リンク切れのとき代替画像にする
	$("#image").on("error", function(){
		$(this).attr("src", url + "no_image.jpg").show();
	});
}


function timeShift(value, unit) {
// タイムシフト
    if (value==0) {                                                     // 数値がゼロ＝最新画像を表示
        var time = moment();                                            // 現在時刻
        var time = getJustTime(time);                                   // 直前のタイミング時刻
        var filename = time2fileName(time);                             // タイミング時刻のファイル名
        showImage(filename);                                            // 画像を表示
        var strTime = time.format("YYYY/MM/DD HH:mm");                  // 日時のフォーマット
        $("#datetime").text(strTime);                                   // 日時表示
        $("#btnTimeShift").removeClass("selected");
    } else {
        if (unit == "u") {                                              // 単位が"u"ならば
            unit = iUnit;                                               // 単位と数値を
            value = value * iValue;                                     // グローバル変数で定義したものにする
        }
        var strTime = $("#datetime").text();                            // 表示されている時刻の文字列
        var time = moment(strTime);                                     // それをmoment時刻にする
        time.add(value, unit);                                          // 時刻をシフトする
        var filename = time2fileName(time);                             // シフトした時刻のファイル名
        showImage(filename);                                            // 画像を表示
        var strTime = time.format("YYYY/MM/DD HH:mm");                  // 日時のフォーマット
        $("#datetime").text(strTime);                                   // 日時表示
        $("#btnTimeShift").addClass("selected");
    }
    if (time < moment()) {
        $("#btnMovie").css("visibility", "visible");
    } else {
        $("#btnMovie").css("visibility", "hidden");
    }
}

function setLapse(id) {
    // アロー関数を使って全ボタンの選択状態を解除する
    var lapseButtons = ["1d", "1H", "1u"];
    lapseButtons.forEach( button => $("#" + button).removeClass("selected"));

    value = Number(id.substr(0, 1))
    unit = id.substr(-1)

    if (unit == "u") {                                                  // 単位が"u"ならば
        unit = iUnit;                                                   // 単位と数値を
        value = value * iValue;                                         // グローバル変数で定義したものにする
    }
    $("#" + id).addClass("selected")
    $("#lapseValue").text(String(value));
    $("#lapseUnit").text(unit);
}


async function playMovie(){
    var value = $("#lapseValue").text();
    var unit = $("#lapseUnit").text();
    var latestTime = getJustTime(moment());                             // 最新のタイミング
    $("#timetitle").text("Replaying:");                                 // 日時の見出し
    $("#movie").addClass("selected");

    while (true) {
    // 表示されている時刻を毎回取得する必要は必ずしもないが、こうすることで再生を強制終了できる
        var strTime = $("#datetime").text();                            // 表示されている過去時刻
        var time = moment(strTime);                                     // それをmoment時刻にする
        var fileName = time2fileName(time);                             // ファイル名取得
        time = time.add(value, unit);                                   // 次のタイミング
        if (time > latestTime) {                                        // 次のタイミングが最新よりも後ならば
            break;                                                      // ループを抜ける
        }
        var strTime = time.format("YYYY/MM/DD HH:mm");                  // 日時のフォーマット
        $("#datetime").text(strTime);                                   // 日時表示
        showImage(fileName);
        await sleep(300);
    }
    await sleep(1000);
    $("#movie").removeClass("selected");
    var mode = $("#mode").text();                                       // モード
    if (mode == "2") {                                                  // 途中で中断することなく再生完走したら
        changeMode(1);                                                  // モード1にする
    }
}


function time2fileName(time) {
// 時刻からファイル名を取得する
    return time.format("YYYY-MM-DD_HH+mm.jpg")
}


function getJustTime(time){                                           // 例　現在12時34分56秒で15分単位の場合
// 単位時間に調整する
  var num = time.get(iUnit);                                          // 分を取得する　　　　　　　　例　34
  num = Math.floor(num / iValue);                                     // 単位時間で割った商　　    　例　34\15=2
  time.set(iUnit, num * iValue);                                      // 分を単位の倍数で設定する　　例　2*15=30分
  time.startOf(iUnit);                                                // 分以下の単位をリセットする　例　56秒→00秒
  return time
}


var iValue = 15;            // iはinterval
var iUnit = "m";            // インターバルの単位
var url = "xxxxxxxxxx/images/";

// いわゆるsleep関数　async functionで呼び出す
// 参考　https://iwb.jp/javascript-sleep-await-promise-single-line-code/
const sleep = ms => new Promise(res => setTimeout(res, ms))

timeShift(0, "");
changeMode(0);
setLapse("1u")
setInterval("clock()",1000);  // 1秒ごとに実行
