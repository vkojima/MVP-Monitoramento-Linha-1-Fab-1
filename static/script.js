// static/script.js

const charts = {};
const historicalCharts = {};

function loadCameraData() {
    fetch('http://10.1.79.17:4000/tracking_info')
        .then(response => response.json())
        .then(data => {
            console.log('Dados recebidos:', data);
            const additionalInfo = document.getElementById('additional-info');

            Object.entries(data).forEach(([postoKey, postoData]) => {
                const postoId = postoKey.replace('Posto', '');
                const infoBoxId = `info-box-posto${postoId}`;

                if (!postoData || !postoData.ID || !postoData.IE || !postoData.IQ) {
                    console.warn(`Dados incompletos para ${postoKey}`);
                    return;
                }

                let infoBox = document.getElementById(infoBoxId);
                if (!infoBox) {
                    infoBox = document.createElement('div');
                    infoBox.className = 'info-box';
                    infoBox.id = infoBoxId;

                    infoBox.innerHTML = `
                        <header>
                            <h2>Posto ${postoId}</h2>
                            <div class="status"></div>
                        </header>
                        <img src="/video_feed/${postoId}" alt="Câmera ao Vivo">
                        <div class="gauges">
                            <div class="gauge"><canvas id="posto${postoId}-oee"></canvas></div>
                            <div class="gauge"><canvas id="posto${postoId}-id"></canvas></div>
                            <div class="gauge"><canvas id="posto${postoId}-ie"></canvas></div>
                            <div class="gauge"><canvas id="posto${postoId}-iq"></canvas></div>
                        </div>
                        <p>Data/Hora: <em>${postoData.Data.split('/').slice(0, 2).join('/')} ${postoData.Hora.split(':').slice(0, 2).join(':')}</em></p>
                        <p>Qtd. Produzida: <em>${postoData.Quantidade}</em></p>
                        `;
                        // <canvas id="historical-chart-posto${postoId}" width="400" height="200"></canvas> // * Removido temporariamente

                    additionalInfo.appendChild(infoBox);

                    initializeKPIs(`posto${postoId}`, {
                        oee: calculateOEE(postoData.ID, postoData.IE, postoData.IQ),
                        id: parseFloat(postoData.ID.replace('%', '')) || 0,
                        ie: parseFloat(postoData.IE.replace('%', '')) || 0,
                        iq: parseFloat(postoData.IQ.replace('%', '')) || 0
                    });
                } else {
                    initializeKPIs(`posto${postoId}`, {
                        oee: calculateOEE(postoData.ID, postoData.IE, postoData.IQ),
                        id: parseFloat(postoData.ID.replace('%', '')) || 0,
                        ie: parseFloat(postoData.IE.replace('%', '')) || 0,
                        iq: parseFloat(postoData.IQ.replace('%', '')) || 0
                    });
                }

                const status = postoData.Status ? "Operando" : "Parado";
                infoBox.querySelector('.status').textContent = status;

                updateStatusColors();

                sendDataToServer({
                    posto: postoKey,
                    data: postoData.Data,
                    hora: postoData.Hora,
                    status: postoData.Status,
                    ordem: postoData.Ordem,
                    qtd: postoData.Quantidade,
                    oee: calculateOEE(postoData.ID, postoData.IE, postoData.IQ),
                    id: parseFloat(postoData.ID.replace('%', '')) || 0,
                    ie: parseFloat(postoData.IE.replace('%', '')) || 0,
                    iq: parseFloat(postoData.IQ.replace('%', '')) || 0
                });
                // updateHistoricalChart(postoId);
            });
            updateGeneralChartsFromPostos(data);
        })
        .catch(error => {
            console.error('Erro ao carregar os dados dos postos:', error);
        });
}

function calculateOEE(id = '0%', ie = '0%', iq = '0%') {
    const idValue = parseFloat(id.replace('%', '')) || 0;
    const ieValue = parseFloat(ie.replace('%', '')) || 0;
    const iqValue = parseFloat(iq.replace('%', '')) || 0;
    return ((idValue * ieValue * iqValue) / 10000).toFixed(2);
}


function updateStatusColors() {
    document.querySelectorAll('.info-box .status').forEach((status) => {
        const statusText = status.textContent.trim();
        if (statusText === "Parado") {
            status.style.backgroundColor = "#ff4a3d"; 
            status.style.color = "#fff"; 
        } else if (statusText === "Operando") {
            status.style.backgroundColor = "#4CAF50"; 
            status.style.color = "#fff"; 
        } else if (statusText === "Sem conexão") {
            status.style.backgroundColor = "#666";
            status.style.color = "#fff";
        }
    });
}

function sendDataToServer(data) {
    fetch('http://10.1.79.17:5000/save_data', { // Certifique-se que a URL está correta
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao enviar dados para o servidor');
        }
        return response.json();
    })
    .then(result => {
        console.log('Dados salvos com sucesso:', result);
    })
    .catch(error => {
        console.error('Erro ao enviar dados para o servidor:', error);
    });
}

function calculateSeconds(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length < 3) return 0;
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
}

window.onload = function() {
    loadCameraData();
    setInterval(loadCameraData, 15000); 
};

