# camera_process.py
from ultralytics import YOLO
import time
import cv2

def camera_worker(cam_config, camera_data, camera_frames):
    try:
        cam_id = cam_config['id']
        ip = cam_config['ip']
        cap = cv2.VideoCapture(ip)
        model = YOLO('yolo_detect/train/runs/runs_yolo11n/train11/weights/best.pt')

        while True:
            ret, frame = cap.read()
            if ret:
                results = model.predict(frame)
                annotated_frame = results[0].plot()
                
                calculated_time = round(time.time() % 1, 2)
                calculated_time_real = calculated_time + 0.1
                quantity_produced = int(time.time()) % 100
                oee_value = 85
                id_value = 90
                ie_value = 75
                iq_value = 80
                
                camera_data[cam_id] = {
                    'id': cam_id,
                    'status': 'Operando',
                    'video_url': f'/video_feed/{cam_id}',
                    'tempo_padrao_medio': calculated_time,
                    'tempo_real_medio': calculated_time_real,
                    'qt_produzida': quantity_produced,
                    'oee': oee_value,
                    'id_value': id_value,
                    'ie': ie_value,
                    'iq': iq_value
                }
                camera_frames[cam_id] = annotated_frame
            else:
                camera_data[cam_id] = {
                    'id': cam_id,
                    'status': 'Sem conexão',
                    'video_url': f'/video_feed/{cam_id}',
                    'tempo_padrao_medio': 0,
                    'tempo_real_medio': 0,
                    'qt_produzida': 0,
                    'oee': 0,
                    'id_value': 0,
                    'ie': 0,
                    'iq': 0
                }
                camera_frames[cam_id] = None
            time.sleep(0.1)
        cap.release()
    except Exception as e:
        print(f"Erro no processo da câmera {cam_config['id']}: {e}")