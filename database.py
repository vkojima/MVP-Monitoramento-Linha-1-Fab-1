# database.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import csv
import os
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)

FILE_PATH = 'C:/Users/kojima/Downloads/data.csv'

cumulative_times = {}      # {posto: {"operando": seconds, "parado": seconds}}
last_status = {}           # {posto: bool}
last_timestamp = {}        # {posto: datetime}
state_history = {}         # {posto: [True, False, True, ...]}
state_window_size = 5      # Ajuste este valor conforme necessário

@app.route('/save_data', methods=['POST'])
def save_data():
    data = request.get_json()
    posto = data.get('Posto', data.get('posto', ''))
    csv_file = FILE_PATH
    file_exists = os.path.isfile(csv_file)
    
    data_str = data.get('Data', data.get('data', ''))
    hora_str = data.get('Hora', data.get('hora', ''))
    try:
        timestamp = datetime.strptime(f"{data_str} {hora_str}", "%d/%m/%y %H:%M:%S.%f")
    except ValueError:
        try:
            timestamp = datetime.strptime(f"{data_str} {hora_str}", "%d/%m/%y %H:%M:%S")
        except ValueError:
            timestamp = datetime.now() 

    current_status = data.get('Status', data.get('status', False))

    if posto not in cumulative_times:
        cumulative_times[posto] = {"operando": 0, "parado": 0}
        last_status[posto] = current_status
        last_timestamp[posto] = timestamp
        state_history[posto] = [current_status]
    else:
        state_history[posto].append(current_status)
        if len(state_history[posto]) > state_window_size:
            state_history[posto].pop(0)
        
        predominant_state = max(set(state_history[posto]), key=state_history[posto].count)
        
        if predominant_state != last_status[posto]:
            last_status[posto] = predominant_state
            last_timestamp[posto] = timestamp  # Atualiza o timestamp da mudança de estado

        time_diff = (timestamp - last_timestamp[posto]).total_seconds()
        
        if last_status[posto]:
            cumulative_times[posto]["operando"] += time_diff
        else:
            cumulative_times[posto]["parado"] += time_diff
        
        last_timestamp[posto] = timestamp

    total_time = cumulative_times[posto]["operando"] + cumulative_times[posto]["parado"]
    if total_time > 0:
        id_value = (cumulative_times[posto]["operando"] / total_time) * 100
    else:
        id_value = 0.0
    data['ID'] = f"{id_value:.2f}%"

    data_to_write = [
        posto,
        data.get('Data', data.get('data', '')),
        data.get('Hora', data.get('hora', '')),
        data.get('Ordem', data.get('ordem', '')),
        data.get('Quantidade', data.get('qtd', 0)),
        data.get('OEE', data.get('oee', '0%')),
        data.get('ID', data.get('id', '0%')),
        data.get('IE', data.get('ie', '0%')),
        data.get('IQ', data.get('iq', '0%')),
        last_status[posto],
        time.strftime("%Y-%m-%d %H:%M:%S")
    ]

    try:
        with open(csv_file, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            if not file_exists:
                writer.writerow(['Posto', 'Data', 'Hora', 'Ordem', 'Quantidade', 'OEE', 'ID', 'IE', 'IQ', 'Status', 'Timestamp'])
            writer.writerow(data_to_write)
        return jsonify({"status": "success", "message": "Data saved successfully"}), 200
    except Exception as e:
        print(f"Erro ao salvar dados no CSV: {e}")
        return jsonify({"status": "fail", "message": "Error saving data"}), 500

@app.route('/get_csv_data', methods=['GET'])
def get_csv_data():
    csv_file = FILE_PATH
    data = []
    
    if not os.path.isfile(csv_file):
        return jsonify(data), 200

    try:
        with open(csv_file, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                try:
                    required_fields = ['Posto', 'Data', 'Hora', 'Ordem', 'Quantidade', 'OEE', 'ID', 'IE', 'IQ', 'Status', 'Timestamp']
                    for field in required_fields:
                        if field not in row or row[field] == '':
                            if field in ['Quantidade']:
                                row[field] = 0
                            elif field in ['OEE', 'ID', 'IE', 'IQ']:
                                row[field] = '0.0%'
                            elif field in ['Status']:
                                row[field] = False
                            else:
                                row[field] = ''
                    quantidade = row['Quantidade']
                    row['Quantidade'] = int(quantidade) if quantidade else 0
                    oee = row['OEE'].replace('%', '')
                    row['OEE'] = float(oee) if oee else 0.0
                    id_val = row['ID'].replace('%', '')
                    row['ID'] = float(id_val) if id_val else 0.0
                    ie_val = row['IE'].replace('%', '')
                    row['IE'] = float(ie_val) if ie_val else 0.0
                    iq_val = row['IQ'].replace('%', '')
                    row['IQ'] = float(iq_val) if iq_val else 0.0
                    status_str = str(row['Status']).lower()
                    row['Status'] = True if status_str in ['true', '1'] else False

                    data.append(row)
                except Exception as e:
                    print(f"Erro ao processar linha do CSV: {row}, Erro: {e}")
                    continue
    except Exception as e:
        print(f"Erro ao ler o CSV: {e}")
        return jsonify({"status": "fail", "message": "Error reading data"}), 500

    try:
        return jsonify(data), 200
    except Exception as e:
        print(f"Erro ao converter para JSON: {e}")
        print("Dados a serem enviados:", data)
        return jsonify({"status": "fail", "message": "Error converting data to JSON"}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=False)
