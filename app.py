# app.py
from flask import Flask, render_template, Response, jsonify
from multiprocessing import Process, Manager
from camera_process import camera_worker
import json
import cv2
import time

app = Flask(__name__)

# 1. ENDPOINTS
@app.route('/')
def index():
    return render_template('indice.html')

@app.route('/camera_data')
def get_camera_data():
    return jsonify(list(camera_data.values()))

@app.route('/video_feed/<int:cam_id>')
def video_feed(cam_id: int):
    def generate():
        '''
        Rota do Flask para servir a página de video de cada camera.
        
        :param cam_id (int): id da camera
        '''
        while True:
            frame = camera_frames.get(cam_id)
            if frame is not None:
                ret, buffer = cv2.imencode('.jpg', frame)
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            else:
                time.sleep(0.01)
    return Response(generate(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == '__main__':
    # 1. CONFIGURAÇÃO DAS CÂMERAS
    camera_configs = [
    {"id": 1, "ip": "http://10.1.60.155:4000/video_feed", "roi_points": [[410, 175], [600, 175], [600, 450], [410, 450]]},  # roi_points = [superior esquerdo, inferior esquerdo, superior direito, inferior direito]
    {"id": 2, "ip": "http://10.1.60.183:4000/video_feed", "roi_points": [[800, 200], [1000, 200], [1000, 400], [800, 400]]},]

    manager = Manager()
    camera_data = manager.dict()
    camera_frames = manager.dict()

    # 2. INICIALIZAÇÃO DAS CÂMERAS
    processes = []
    for cam_config in camera_configs:
        print("Iniciando câmera ", cam_config['id'])
        cam_id = cam_config['id']
        p = Process(target=camera_worker, args=(cam_config, camera_data, camera_frames))
        p.start()
        processes.append(p)
        time.sleep(0.1)

    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    finally:
        for p in processes:
            p.terminate()
            p.join()