import cv2
import numpy as np
import datetime
import ftplib
import sys
import datetime
import os
import time

HOST_NAME = "xxxxxxxxxx"
USER_NAME = "username"
USER_PASS = "password"
SERVER_PATH = "/images"

def ftp_upload(filename, target_filename):
    ftp=ftplib.FTP(HOST_NAME)
    ftp.set_pasv("true")
    ftp.login(USER_NAME, USER_PASS)
    ftp.cwd(SERVER_PATH)

    f = open(filename, "rb")
    ftp.storbinary("STOR " + target_filename, f)
    ftp.close()
    f.close()


def alpha_blend(img, alpha=1.0, beta=0.0):
    dst = alpha * img + beta
    return np.clip(dst, 0, 255).astype(np.uint8)


def draw_text(img, text):
    fontFace = cv2.FONT_HERSHEY_DUPLEX
    fontScale = 1
    thickness = 1
    (w, h), _ = cv2.getTextSize(text, fontFace, fontScale, thickness)
    color = (255,255,255)
    padding = 10
    x1, y1 = 20, 20
    x2 = x1 + w-1 + 2*padding
    y2 = y1 + h-1 + 2*padding
    roi = img[y1:y2, x1:x2]
    roi = alpha_blend(roi, 0.5, -20)
    cv2.putText(roi, text, (padding,h+padding), fontFace, fontScale, color, thickness)
    img[y1:y2, x1:x2] = roi
    return img


def justify(dt):
    dict = {"second": 0, "microsecond":0}
    dt = dt.replace(**dict)
    return dt


def save_image(image, filename):
    if os.path.isfile(filename):                                # 既存ファイルが存在したら
        os.remove(filename)                                     # それを削除する

    while os.path.isfile(filename):                             # 削除完了しない間は
        time.sleep(0.1)                                         # 待つ

    cv2.imwrite(filename, image)                                # 画像を保存する

    while not os.path.isfile(filename):                         # ファイルが存在しない間は
        time.sleep(0.1)                                         # 待つ


def main():
    cap = cv2.VideoCapture(0)
    # ラズパイZEROの処理を軽くするために画像サイズを小さくする
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 800)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 600)

    os.chdir("./images/")                                       # カレントディレクトリ変更
    local_filename = "latest.jpg"                               # ローカルのファイル名
    step, unit = 15, "minute"                                   # 時間ステップ
    dt_step = datetime.timedelta(**{unit+"s": step})            # タイムデルタ値
    dt_now = datetime.datetime.now()                            # 現在日時
    dt_next = dt_now + dt_step                                  # 次のタイミング
    value = getattr(dt_next, unit)                              # 次のタイミングの特定の時間要素
    value = value // step * step                                # 切りのよい値にする
    dt_next = dt_next.replace(**{unit: value})                  # 次のタイミングを修正する
    dt_next = justify(dt_next)                                  # 秒以下を0にする
    last_minute = -1                                            # 分の初期値

    print("next:", dt_next)
    while True:
        dt_now = datetime.datetime.now()                        # 現在日時
        if getattr(dt_now, "minute") != last_minute:            # 分が変わったら（1分に1回実行する）
            ret, frame = cap.read()                             # カメラ映像を取得する
            if ret:                                             # 撮影に成功していたら
                str_time = dt_now.strftime("%Y/%m/%d %H:%M")    # テキスト
                frame = draw_text(frame, str_time)              # テキストを画像に書き込む

                save_image(frame, local_filename)               # 画像を保存する
                ftp_upload(local_filename, local_filename)      # 「latest.jpg」という名でアップロードする

                if dt_now > dt_next:                            # さらに、次のタイミングになっていたら
                    filename = dt_next.strftime("%Y-%m-%d_%H+%M")+ ".jpg"     # ファイル名
                    ftp_upload(local_filename, filename)        # 時刻のファイル名でアップロードする

                    dt_next = dt_next + dt_step                 # 次のタイミングを更新
                    print("next:", dt_next)

                # cv2.imshow("img", frame)
                key = cv2.waitKey(1) & 0xFF
                if key == 27:
                    break

            else:
                print("no image")

            last_minute = getattr(dt_now, "minute")             # 分を更新

    cv2.destroyAllWindows()


if __name__ == "__main__":
    print("start")
    main()
