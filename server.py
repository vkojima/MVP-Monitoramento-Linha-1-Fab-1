from flask import Flask, jsonify
from flask_cors import CORS
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/tracking_info', methods=['GET'])
def generate_data():
    postos = {}
    num_postos = 6
    order_number = random.choice([12008576, 12008577, 12008578, 12008579])
    for i in range(1, 2 + 1):
        posto_key = f"Posto{i}"
        postos[posto_key] = {
            "Data": datetime.now().strftime("%d/%m/%y"),
            "Hora": datetime.now().strftime("%H:%M:%S.%f")[:-3],
            "ID": f"0%",
            "IE": f"{random.uniform(60, 100):.2f}%",
            "IQ": f"{random.uniform(98, 100):.2f}%",
            "Ordem": order_number,
            "Quantidade": random.randint(75, 150),
            "Status": random.choice(["Operando"]), 
        }
    for i in range(3, num_postos + 1):
        posto_key = f"Posto{i}"
        postos[posto_key] = {
            "Data": datetime.now().strftime("%d/%m/%y"),
            "Hora": datetime.now().strftime("%H:%M:%S.%f")[:-3],
            "ID": f"0%",
            "IE": f"{random.uniform(60, 100):.2f}%",
            "IQ": f"{random.uniform(98, 100):.2f}%",
            "Ordem": order_number,
            "Quantidade": random.randint(75, 150),
            "Status": random.choice(["Sem conexao"]), 
        }
    return jsonify(postos)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=4000, debug=True)