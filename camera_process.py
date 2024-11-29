# camera_process.py
from ultralytics import YOLO
import numpy as np
import time
import cv2

def camera_worker(cam_config: dict, camera_data: dict, camera_frames: dict) -> None:
    '''
    Processa o fluxo de imagem da câmera

    :param cam_config (dict): configurações da câmera como id e video_url
    :param camera_data (dict): dados da câmera como id, status, video_url, tempo_padrao_medio, tempo_real_medio, qt_produzida, oee, id_value, ie, iq
    :param camera_frames (dict): frames da câmera 
    '''

    try:
        cam_id = cam_config['id']
        ip = cam_config['ip']
        roi_points = np.array(cam_config['roi_points'], dtype=np.int32)

        cap = cv2.VideoCapture(ip)
        model = YOLO('yolo_detect/train/runs/runs_yolo11n/train11/weights/best.pt')

        object_tracker = {} 
        object_id = 0       
        qtd_produzida = 0
        process_times = []  

        while True:
            ret, frame = cap.read()
            if ret:
                results = model.predict(frame, iou=0.2, conf=0.4)
                detections = results[0]

                annotated_frame = frame.copy()
                cv2.polylines(annotated_frame, [roi_points], isClosed=True, color=(0, 255, 0), thickness=2)

                current_objects_in_roi = []
                for box in detections.boxes:
                    cls = int(box.cls[0])  
                    if model.names[cls] == 'motor':
                        x1, y1, x2, y2 = map(int, box.xyxy[0])

                        cx = int((x1 + x2) / 2)
                        cy = int((y1 + y2) / 2)

                        if cv2.pointPolygonTest(roi_points, (cx, cy), False) >= 0:
                            found = False
                            for obj_id, obj_info in object_tracker.items():
                                if abs(cx - obj_info['cx']) < 50 and abs(cy - obj_info['cy']) < 50:
                                    object_tracker[obj_id]['cx'] = cx
                                    object_tracker[obj_id]['cy'] = cy
                                    current_objects_in_roi.append(obj_id)
                                    found = True
                                    break
                            if not found:
                                object_id += 1
                                object_tracker[object_id] = {'cx': cx, 'cy': cy, 'start_time': time.time()}
                                current_objects_in_roi.append(object_id)

                            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                            cv2.putText(annotated_frame, f'ID: {object_id}', (x1, y1 - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                objects_to_remove = []
                for obj_id in list(object_tracker.keys()):
                    if obj_id not in current_objects_in_roi:
                        start_time = object_tracker[obj_id]['start_time']
                        end_time = time.time()
                        process_time = end_time - start_time
                        process_times.append(process_time)
                        qtd_produzida += 1
                        objects_to_remove.append(obj_id)

                for obj_id in objects_to_remove:
                    del object_tracker[obj_id]

                if process_times:
                    tempo_real_medio = sum(process_times) / len(process_times)
                else:
                    tempo_real_medio = 0

                camera_data[cam_id] = {
                    'id': cam_id,
                    'status': 'Operando',
                    'video_url': f'/video_feed/{cam_id}',
                    'tempo_padrao_medio': 0, 
                    'tempo_real_medio': round(tempo_real_medio, 2),
                    'qt_produzida': qtd_produzida,
                    'oee': 0, 
                    'id_value': 0, 
                    'ie': 0, 
                    'iq': 0 
                }
                camera_frames[cam_id] = annotated_frame
            else:
                camera_data[cam_id] = {
                    'id': cam_id,
                    'status': 'Sem conexão',
                    'video_url': f'/video_feed/{cam_id}',
                    'tempo_padrao_medio': 0,
                    'tempo_real_medio': 0,
                    'qt_produzida': qtd_produzida,
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
